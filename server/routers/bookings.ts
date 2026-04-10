/**
 * Bookings Router — Capa pública de solicitud de citas
 * Permite a usuarios sin autenticar solicitar una cita.
 * Reutiliza las tablas clients y appointments del CRM.
 * Las citas se crean con status "pending" para que Cristina las gestione desde el CRM.
 *
 * Flujo:
 * 1. Buscar/crear cliente (deduplicación por email)
 * 2. Crear cita con status "pending"
 * 3. Enviar email de confirmación al cliente
 * 4. Enviar email de notificación al admin
 * 5. Notificar al admin via sistema de notificaciones Manus
 * 6. Devolver enlace de WhatsApp pre-rellenado para el cliente
 */
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { createClient, createAppointment, findClientByEmail, getAppointmentByRescheduleToken, updateAppointment } from "../db";
import { notifyOwner } from "../_core/notification";
import { sendClientConfirmationEmail, sendAdminNotificationEmail } from "../email";
import { notifyAdminNewBooking } from "../whatsapp";

const SERVICE_LABELS: Record<string, string> = {
  consulta_acompanamiento: "Consulta + Acompañamiento 21 días",
  consulta_naturopata: "Consulta Naturópata (60 min)",
  consulta_breve: "Consulta Breve (30 min)",
  consulta_express: "Consulta Express (20 min)",
  biohabitabilidad: "Biohabitabilidad",
  kinesiologia: "Kinesiología",
  masaje: "Masaje Terapéutico",
  otro: "Otro / Por definir",
};

const WHATSAPP_ADMIN_NUMBER = process.env.WHATSAPP_ADMIN_NUMBER ?? "34600000000"; // número de Cristina sin +

export const bookingsRouter = router({
  /**
   * Solicitud pública de cita.
   * 1. Busca si el cliente ya existe por email.
   * 2. Si no existe, lo crea como "lead".
   * 3. Crea la cita con status "pending".
   * 4. Envía emails de confirmación y notificación.
   * 5. Devuelve enlace de WhatsApp para el cliente.
   */
  request: publicProcedure
    .input(
      z.object({
        // Datos del solicitante
        firstName: z.string().min(1, "El nombre es obligatorio"),
        lastName: z.string().min(1, "Los apellidos son obligatorios"),
        email: z.string().email("Email no válido"),
        phone: z.string().optional(),
        // Datos de la cita
        serviceType: z.enum([
          "consulta_acompanamiento",
          "consulta_naturopata",
          "consulta_breve",
          "consulta_express",
          "biohabitabilidad",
          "kinesiologia",
          "masaje",
          "otro",
        ]),
        preferredDate: z.string().min(1, "La fecha preferida es obligatoria"), // "YYYY-MM-DD"
        preferredTime: z.string().optional(), // "HH:MM"
        modality: z.enum(["presencial", "telefono", "zoom", "whatsapp"]).default("zoom"),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // 1. Buscar o crear cliente (deduplicación por email, case-insensitive)
      let clientId: number;
      const emailNormalized = input.email.trim().toLowerCase();

      const existing = await findClientByEmail(emailNormalized);

      if (existing) {
        clientId = existing.id;
      } else {
        clientId = await createClient({
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          email: emailNormalized,
          phone: input.phone?.trim() ?? null,
          status: "lead",
        });
      }

      // 2. Construir timestamp de la cita con validación
      const dateStr = input.preferredDate;
      const timeStr = input.preferredTime ?? "12:00";
      const scheduledAt = new Date(`${dateStr}T${timeStr}:00`).getTime();
      if (isNaN(scheduledAt)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Fecha u hora no válida" });
      }

      // 3. Crear la cita con status pending
      const serviceLabel = SERVICE_LABELS[input.serviceType] ?? input.serviceType;
      await createAppointment({
        clientId,
        serviceType: input.serviceType,
        serviceLabel,
        scheduledAt,
        modality: input.modality,
        status: "pending",
        internalNotes: input.message
          ? `Mensaje del solicitante: ${input.message}`
          : null,
      });

      // Datos comunes para emails
      const emailData = {
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        email: emailNormalized,
        phone: input.phone?.trim(),
        serviceLabel,
        preferredDate: dateStr,
        preferredTime: input.preferredTime,
        modality: input.modality,
        message: input.message?.trim(),
      };

      // 4. Enviar email de confirmación al cliente (no bloqueante)
      sendClientConfirmationEmail(emailData).catch((err) => {
        console.warn("[Email] Error sending client confirmation:", err);
      });

      // 5. Enviar email de notificación al admin (no bloqueante)
      sendAdminNotificationEmail(emailData).catch((err) => {
        console.warn("[Email] Error sending admin notification:", err);
      });

      // 6. Notificar al admin via WhatsApp (no bloqueante)
      notifyAdminNewBooking({
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        phone: input.phone?.trim(),
        email: emailNormalized,
        serviceLabel,
        preferredDate: dateStr,
        preferredTime: input.preferredTime,
        modality: input.modality,
        notes: input.message?.trim(),
      }).catch((err) => {
        console.warn("[WhatsApp] Error notifying admin (booking):", err);
      });

      // 7. Notificar al admin via Manus (no bloqueante)
      notifyOwner({
        title: `Nueva solicitud de cita — ${input.firstName} ${input.lastName}`,
        content: `${input.firstName} ${input.lastName} (${emailNormalized}${input.phone ? ` · ${input.phone}` : ""}) ha solicitado una cita de ${serviceLabel} para el ${dateStr}${input.preferredTime ? ` a las ${input.preferredTime}` : ""}. Modalidad: ${input.modality}.${input.message ? ` Mensaje: "${input.message}"` : ""}`,
      }).catch((err) => {
        console.warn("[Notification] Error notifying owner:", err);
      });

      // 7. Generar enlace de WhatsApp pre-rellenado para el cliente
      // El cliente puede enviarse a sí mismo el mensaje de confirmación
      const whatsappText = encodeURIComponent(
        `Hola Cristina, acabo de solicitar una cita de ${serviceLabel} para el ${dateStr}${input.preferredTime ? ` a las ${input.preferredTime}` : ""}. Quedo a la espera de tu confirmación. Gracias 🌿`
      );
      const whatsappUrl = `https://wa.me/${WHATSAPP_ADMIN_NUMBER}?text=${whatsappText}`;

      return {
        success: true,
        whatsappUrl,
        message: "Tu solicitud ha sido recibida. Cristina se pondrá en contacto contigo en las próximas 24–48 horas.",
      };
    }),

  /** El cliente selecciona uno de los slots propuestos por la admin */
  selectSlot: publicProcedure
    .input(z.object({ token: z.string(), slotIndex: z.number().min(0).max(4) }))
    .mutation(async ({ input }) => {
      const row = await getAppointmentByRescheduleToken(input.token);
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Enlace no válido o expirado" });
      const { appointment: appt } = row;

      const slots: Array<{ date: string; time: string }> = appt.proposedSlots
        ? JSON.parse(appt.proposedSlots as string)
        : [];
      if (!slots[input.slotIndex]) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Opción no válida" });
      }

      const chosen = slots[input.slotIndex];
      const [year, month, day] = chosen.date.split("-").map(Number);
      const [hour, minute] = chosen.time.split(":").map(Number);
      const newScheduledAt = new Date(year, month - 1, day, hour, minute).getTime();

      await updateAppointment(appt.id, {
        scheduledAt: newScheduledAt,
        status: "pending",
        rescheduleToken: null as any,
        proposedSlots: null as any,
      });

      // Datos del slot seleccionado para la respuesta
      return {
        success: true,
        serviceLabel: appt.serviceLabel ?? appt.serviceType,
        chosenDate: chosen.date,
        chosenTime: chosen.time,
      };
    }),

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
});
