/**
 * Bookings Router — Capa pública de solicitud de citas
 * Permite a usuarios sin autenticar solicitar una cita (consulta o masaje).
 * Reutiliza las tablas clients y appointments del CRM.
 * Las citas se crean con status "pending": NO son una reserva confirmada hasta que
 * Cristina las acepta desde el CRM (crm.appointments.accept).
 *
 * Flujo:
 * 1. Resolver el servicio desde la BD (nombre, duración, precio, tipo) — no se fía del cliente
 * 2. Validar fecha (no pasada, hora de Madrid) y modalidad permitida para ese servicio
 * 3. Buscar/crear cliente (deduplicación por email) y evitar solicitudes duplicadas
 * 4. Crear cita "pending" + registrar en el historial
 * 5. Notificar al cliente y a Cristina (cada envío queda registrado con su resultado)
 * 6. Devolver enlace de WhatsApp pre-rellenado para el cliente
 */
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import {
  createClient,
  createAppointment,
  findClientByEmail,
  getAppointmentById,
  getAppointmentByRescheduleToken,
  getServiceBySlug,
  findOpenDuplicateAppointment,
  logAppointmentEvent,
} from "../db";
import { notifyOwner } from "../_core/notification";
import { sendClientConfirmationEmail, sendAdminNotificationEmail } from "../email";
import { notifyAdminNewBooking } from "../whatsapp";
import {
  acceptAppointment,
  cancelAppointmentWithReason,
  proposeAppointmentSlots,
  selectProposedSlot,
  trackNotification,
} from "../bookingActions";
import { buildAdminActionUrl, verifyAdminActionToken } from "../adminActionLink";
import { ENV } from "../_core/env";
import {
  CRISTINA_WHATSAPP_NUMBER,
  HOME_LABEL_SUFFIX,
  formatHomeAddress,
  getHomePrice,
  isBookableTime,
  slotsForDate,
  validateHomeAddress,
} from "../../shared/booking";
import {
  APPOINTMENT_SERVICE_TYPES,
  MASSAGE_TIME_SLOTS,
  allowedModalities,
  buildServiceLabel,
  madridLocalToEpoch,
  resolveAppointmentServiceType,
  validateRequestedDate,
  type AppointmentServiceType,
} from "../bookingRules";

// Respaldo si un servicio "legacy" del formulario no está en la tabla services.
const LEGACY_SERVICE_LABELS: Record<string, string> = {
  consulta_acompanamiento: "Consulta + Acompañamiento 21 días",
  consulta_naturopata: "Consulta Naturópata (60 min)",
  consulta_breve: "Consulta Breve (30 min)",
  consulta_express: "Consulta Express (20 min)",
  biohabitabilidad: "Biohabitabilidad",
  kinesiologia: "Kinesiología",
  masaje: "Masaje Terapéutico",
  otro: "Otro / Por definir",
};

const WHATSAPP_ADMIN_NUMBER = process.env.WHATSAPP_ADMIN_NUMBER || CRISTINA_WHATSAPP_NUMBER;

const SITE_URL = "https://cristinaviveconsciente.es";

const DEFAULT_DECLINE_REASON = "No es posible atender la cita en esa fecha y hora.";

/** Carga la cita del token; cualquier fallo (firma, caducidad, cita inexistente) responde igual. */
async function loadLinkedAppointment(token: string) {
  const verified = verifyAdminActionToken(token, ENV.cookieSecret);
  const row = verified ? await getAppointmentById(verified.appointmentId) : null;
  if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Enlace no válido o caducado" });
  return row;
}

export const bookingsRouter = router({
  /**
   * Solicitud pública de cita.
   * `serviceType` es el slug del servicio elegido (tabla `services`). Los masajes tienen slugs
   * libres (p. ej. masaje_relajante_navas_de_rio_frio_segovia) y se guardan como serviceType
   * "masaje" en la cita; el servicio concreto queda en serviceLabel.
   */
  request: publicProcedure
    .input(
      z.object({
        // Datos del solicitante
        firstName: z.string().trim().min(1, "El nombre es obligatorio").max(100),
        lastName: z.string().trim().min(1, "Los apellidos son obligatorios").max(100),
        email: z.string().trim().email("Email no válido").max(320),
        phone: z.string().trim().max(30).optional(),
        // Datos de la cita
        serviceType: z.string().trim().min(1).max(100),
        preferredDate: z.string().min(1, "La fecha preferida es obligatoria"), // "YYYY-MM-DD"
        preferredTime: z.string().optional(), // "HH:MM" (hora fija; obligatoria en masajes)
        /** Franja preferida (masajes): mañana / mediodía (solo fin de semana) / tarde / sin preferencia */
        timeSlot: z.enum(["morning", "midday", "afternoon", "any"]).optional(),
        /** Masajes: en consulta (Navas de Riofrío) o a domicilio (solo servicios con tarifa a domicilio) */
        serviceLocation: z.enum(["consulta", "domicilio"]).default("consulta"),
        /** Dirección del servicio a domicilio (obligatoria si serviceLocation = domicilio) */
        serviceStreet: z.string().trim().max(160).optional(),
        servicePostalCode: z.string().trim().max(10).optional(),
        serviceCity: z.string().trim().max(80).optional(),
        modality: z.enum(["presencial", "telefono", "zoom", "whatsapp"]).default("zoom"),
        message: z.string().trim().max(1000).optional(),
      })
    )
    .mutation(async ({ input }) => {
      // 1. Resolver el servicio desde la BD (fuente de verdad de nombre, duración y precio)
      const service = input.serviceType === "otro" ? null : await getServiceBySlug(input.serviceType);
      if (service && service.status !== "active") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Este servicio no está disponible actualmente" });
      }
      const isLegacy = (APPOINTMENT_SERVICE_TYPES as readonly string[]).includes(input.serviceType);
      if (!service && !isLegacy) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Servicio no válido" });
      }

      const serviceType: AppointmentServiceType = service
        ? resolveAppointmentServiceType(service)
        : (input.serviceType as AppointmentServiceType);
      const baseLabel = service
        ? buildServiceLabel(service.name, service.durationLabel, service.durationMinutes)
        : LEGACY_SERVICE_LABELS[input.serviceType] ?? input.serviceType;
      const isMassage = serviceType === "masaje";

      // 1b. Servicio a domicilio: solo masajes con tarifa a domicilio configurada y con dirección
      const isHome = input.serviceLocation === "domicilio";
      const homePrice = isHome ? getHomePrice(service) : null;
      if (isHome) {
        if (!isMassage || homePrice === null) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Este servicio no se ofrece a domicilio" });
        }
        // Cristina valora la solicitud según la dirección: calle y número, código postal y localidad
        const addressErrors = validateHomeAddress({ street: input.serviceStreet, postalCode: input.servicePostalCode, city: input.serviceCity });
        const firstError = Object.values(addressErrors)[0];
        if (firstError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Dirección a domicilio incompleta: ${firstError}` });
        }
      }
      const homeAddress = isHome
        ? formatHomeAddress({ street: input.serviceStreet!, postalCode: input.servicePostalCode!, city: input.serviceCity! })
        : null;
      const serviceLabel = isHome ? `${baseLabel} · ${HOME_LABEL_SUFFIX}` : baseLabel;

      // 2. Modalidad: un masaje solo es presencial (no se acepta Zoom/teléfono/WhatsApp)
      if (!allowedModalities(serviceType).includes(input.modality)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Los masajes solo se realizan de forma presencial" });
      }

      // 3. Fecha y hora (siempre hora de Madrid; el servidor corre en UTC)
      const dateError = validateRequestedDate(input.preferredDate);
      if (dateError) throw new TRPCError({ code: "BAD_REQUEST", message: dateError });

      // Masajes: hora fija dentro del horario (la franja `timeSlot` solo se admite de clientes antiguos)
      const fixedTime = isMassage && input.preferredTime && /^\d{2}:\d{2}$/.test(input.preferredTime) ? input.preferredTime : null;
      if (isMassage && fixedTime && !isBookableTime(input.preferredDate, fixedTime, service?.durationMinutes)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Esa hora no está disponible. Elige otra dentro del horario de Cristina" });
      }
      const slotKey = isMassage && !fixedTime ? input.timeSlot ?? "any" : null;
      if (isMassage && !fixedTime && input.timeSlot === undefined) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Elige la hora de la cita" });
      }
      if (slotKey && !slotsForDate(input.preferredDate).includes(slotKey)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Esa franja horaria no está disponible el día elegido" });
      }
      const timeStr = fixedTime
        ? fixedTime
        : isMassage
          ? MASSAGE_TIME_SLOTS[slotKey!].start
          : input.preferredTime && /^\d{2}:\d{2}$/.test(input.preferredTime)
            ? input.preferredTime
            : "12:00";
      const scheduledAt = madridLocalToEpoch(input.preferredDate, timeStr);
      if (Number.isNaN(scheduledAt)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Fecha u hora no válida" });
      }
      // Lo que se muestra en emails/WhatsApp: la hora fija, la franja (clientes antiguos) o la hora de la consulta
      const displayTime = fixedTime ?? (slotKey ? MASSAGE_TIME_SLOTS[slotKey].label : input.preferredTime || undefined);

      // 4. Buscar o crear cliente (deduplicación por email, case-insensitive)
      const emailNormalized = input.email.toLowerCase();
      const existing = await findClientByEmail(emailNormalized);
      const clientId = existing
        ? existing.id
        : await createClient({
            firstName: input.firstName,
            lastName: input.lastName,
            email: emailNormalized,
            phone: input.phone || null,
            status: "lead",
          });

      // WhatsApp pre-rellenado para el cliente (no confirma nada: solo le avisa a Cristina)
      const whatsappText = encodeURIComponent(
        `Hola Cristina, acabo de solicitar una cita de ${serviceLabel} para el ${input.preferredDate}${displayTime ? ` (${displayTime})` : ""}. Quedo a la espera de tu confirmación. Gracias 🌿`
      );
      const whatsappUrl = `https://wa.me/${WHATSAPP_ADMIN_NUMBER}?text=${whatsappText}`;
      const response = {
        success: true as const,
        status: "pending" as const,
        whatsappUrl,
        message:
          "Solicitud recibida. Tu cita queda pendiente de confirmación de Cristina, que se pondrá en contacto contigo en las próximas 24–48 horas.",
      };

      // 5. Anti-duplicados: misma persona + mismo servicio + mismo día con solicitud abierta
      const dayStart = madridLocalToEpoch(input.preferredDate, "00:00");
      const dayEnd = madridLocalToEpoch(input.preferredDate, "23:59");
      const duplicate = await findOpenDuplicateAppointment(clientId, serviceLabel, dayStart, dayEnd);
      if (duplicate) return { ...response, duplicate: true as const };

      // 6. Crear la cita con status pending
      const notes = [
        isMassage ? (fixedTime ? `Hora solicitada: ${fixedTime}` : `Franja preferida: ${MASSAGE_TIME_SLOTS[slotKey!].label}`) : null,
        isHome ? `Servicio a domicilio (${homePrice} €) — Dirección: ${homeAddress}` : null,
        input.message ? `Mensaje del solicitante: ${input.message}` : null,
      ].filter(Boolean);
      const insert: any = await createAppointment({
        clientId,
        serviceType,
        serviceLabel,
        scheduledAt,
        durationMinutes: service?.durationMinutes ?? undefined,
        price: isHome ? homePrice!.toFixed(2) : service?.price ?? undefined,
        modality: input.modality,
        status: "pending",
        internalNotes: notes.length ? notes.join("\n") : null,
      });
      const appointmentId: number | undefined = insert?.insertId ? Number(insert.insertId) : undefined;

      if (appointmentId) {
        await logAppointmentEvent({
          appointmentId,
          type: "request_submitted",
          toStatus: "pending",
          detail: `Solicitud web: ${service?.slug ?? input.serviceType}${fixedTime ? ` · hora ${fixedTime}` : slotKey ? ` · franja ${slotKey}` : ""}`,
        });
      }

      // Datos comunes para emails
      const emailData = {
        firstName: input.firstName,
        lastName: input.lastName,
        email: emailNormalized,
        phone: input.phone || undefined,
        serviceLabel,
        preferredDate: input.preferredDate,
        preferredTime: displayTime,
        modality: input.modality,
        message: [isHome ? `A domicilio — Dirección: ${homeAddress}` : null, input.message].filter(Boolean).join("\n") || undefined,
      };

      // 7. Notificaciones (no bloqueantes; cada una deja constancia de su resultado)
      const notify = (channel: "email" | "whatsapp" | "owner", audience: "client" | "admin", template: string, run: () => Promise<unknown>) => {
        if (!appointmentId) {
          run().catch((err) => console.warn(`[Notify] ${channel}/${audience}/${template}:`, err));
          return;
        }
        void trackNotification({ appointmentId, channel, audience, template, run });
      };

      notify("email", "client", "request_received", () => sendClientConfirmationEmail(emailData));
      // Enlace firmado para que Cristina acepte/declare/posponga desde el aviso (null si no hay secreto)
      const actionUrl = appointmentId ? buildAdminActionUrl(appointmentId, ENV.cookieSecret, SITE_URL) ?? undefined : undefined;
      notify("email", "admin", "new_request", () => sendAdminNotificationEmail({ ...emailData, actionUrl }));
      notify("whatsapp", "admin", "new_request", () =>
        notifyAdminNewBooking({
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone || undefined,
          email: emailNormalized,
          serviceLabel,
          preferredDate: input.preferredDate,
          preferredTime: displayTime,
          modality: input.modality,
          notes: [isHome ? `A domicilio — ${homeAddress}` : null, input.message].filter(Boolean).join(" · ") || undefined,
          actionUrl,
        })
      );
      notify("owner", "admin", "new_request", () =>
        notifyOwner({
          title: `Nueva solicitud de cita — ${input.firstName} ${input.lastName}`,
          content: `${input.firstName} ${input.lastName} (${emailNormalized}${input.phone ? ` · ${input.phone}` : ""}) ha solicitado una cita de ${serviceLabel} para el ${input.preferredDate}${displayTime ? ` (${displayTime})` : ""}. Modalidad: ${input.modality}.`,
        })
      );

      return response;
    }),

  /** El cliente selecciona uno de los slots propuestos por la admin (la cita vuelve a "pending") */
  selectSlot: publicProcedure
    .input(z.object({ token: z.string(), slotIndex: z.number().min(0).max(4) }))
    .mutation(({ input }) => selectProposedSlot(input.token, input.slotIndex)),

  /** Devuelve los slots propuestos para mostrarlos en la página pública */
  getSlots: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const row = await getAppointmentByRescheduleToken(input.token);
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Enlace no válido o expirado" });
      const { appointment: appt, client } = row;
      const slots: Array<{ date: string; time: string }> = appt.proposedSlots
        ? JSON.parse(appt.proposedSlots as string)
        : [];
      return {
        serviceLabel: appt.serviceLabel ?? appt.serviceType,
        clientFirstName: client?.firstName ?? "",
        slots,
        status: appt.status,
      };
    }),

  // ─── Enlace firmado del aviso a Cristina (Aceptar / Declinar / Posponer) ─────
  // Público, pero protegido por el token firmado (ver adminActionLink.ts). Mismas acciones y transiciones que el CRM.

  /** Datos de la cita para la página del enlace. Un token inválido o caducado da NOT_FOUND genérico. */
  adminLinkInfo: publicProcedure
    .input(z.object({ token: z.string().max(200) }))
    .query(async ({ input }) => {
      const appt = await loadLinkedAppointment(input.token);
      return {
        status: appt.appointment.status,
        canAct: appt.appointment.status === "pending",
        clientName: `${appt.client?.firstName ?? ""} ${appt.client?.lastName ?? ""}`.trim(),
        clientPhone: appt.client?.phone ?? null,
        clientEmail: appt.client?.email ?? null,
        serviceLabel: appt.appointment.serviceLabel ?? appt.appointment.serviceType,
        scheduledAt: new Date(appt.appointment.scheduledAt).getTime(),
        modality: appt.appointment.modality ?? "presencial",
        notes: appt.appointment.internalNotes ?? null,
      };
    }),

  /** Acepta o declina la solicitud desde el enlace. Solo si sigue pendiente. */
  adminLinkAct: publicProcedure
    .input(
      z.object({
        token: z.string().max(200),
        action: z.enum(["accept", "decline"]),
        reason: z.string().trim().max(300).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { appointment } = await loadLinkedAppointment(input.token);
      if (appointment.status !== "pending") {
        throw new TRPCError({ code: "CONFLICT", message: "Esta solicitud ya se ha resuelto" });
      }
      if (input.action === "accept") return acceptAppointment(appointment.id, null);
      return cancelAppointmentWithReason(appointment.id, input.reason || DEFAULT_DECLINE_REASON, null);
    }),

  /** Propone otras fechas desde el enlace (la cita pasa a "rescheduled" y el cliente elige). */
  adminLinkPropose: publicProcedure
    .input(
      z.object({
        token: z.string().max(200),
        slots: z.array(z.object({ date: z.string(), time: z.string() })).min(1).max(3),
      })
    )
    .mutation(async ({ input }) => {
      const { appointment } = await loadLinkedAppointment(input.token);
      if (appointment.status !== "pending") {
        throw new TRPCError({ code: "CONFLICT", message: "Esta solicitud ya se ha resuelto" });
      }
      const out = await proposeAppointmentSlots(appointment.id, input.slots, null);
      return { success: out.success };
    }),
});
