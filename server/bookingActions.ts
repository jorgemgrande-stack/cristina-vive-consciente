/**
 * bookingActions.ts — lógica compartida del flujo de reservas que toca BD/notificaciones.
 * - trackNotification: envía una notificación y deja constancia (enviada / fallida / omitida).
 * - selectProposedSlot: el cliente elige una de las fechas propuestas (antes duplicado en
 *   bookings.ts y crm.ts).
 */
import { TRPCError } from "@trpc/server";
import { getAppointmentByRescheduleToken, updateAppointment, logAppointmentEvent } from "./db";
import { isAdminEmailConfigured, isEmailConfigured, sendAdminSlotSelectedEmail } from "./email";
import { madridLocalToEpoch } from "./bookingRules";

export type NotificationChannel = "email" | "whatsapp" | "owner";
export type NotificationAudience = "client" | "admin";
export type NotificationResult = "sent" | "failed" | "skipped";

/**
 * Ejecuta `run` (envío) y registra el resultado en el historial de la cita.
 * Nunca lanza: una notificación fallida no debe romper la acción de negocio.
 * - "skipped": no hay configuración para enviarla (SMTP, ADMIN_EMAIL, WhatsApp API, aviso interno).
 * - "failed": había configuración pero el envío dio error (el motivo queda en `detail`).
 */
export async function trackNotification(opts: {
  appointmentId: number;
  channel: NotificationChannel;
  audience: NotificationAudience;
  /** Qué notificación es: request_received, accepted, cancelled, reschedule_proposed, slot_selected... */
  template: string;
  actorUserId?: number | null;
  run: () => Promise<unknown>;
}): Promise<NotificationResult> {
  const { appointmentId, channel, audience, template, actorUserId = null, run } = opts;
  let result: NotificationResult = "sent";
  let detail = template;

  try {
    if (channel === "email" && !isEmailConfigured()) {
      result = "skipped";
      detail = `${template}: SMTP no configurado`;
    } else if (channel === "email" && audience === "admin" && !isAdminEmailConfigured()) {
      result = "skipped";
      detail = `${template}: ADMIN_EMAIL no configurado`;
    } else {
      const out: any = await run();
      if (channel === "whatsapp" && out && out.sent === false) {
        result = "skipped";
        detail = `${template}: WhatsApp API no configurada (solo enlace wa.me)`;
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/not configured/i.test(msg)) {
      result = "skipped";
      detail = `${template}: servicio no configurado`;
    } else {
      result = "failed";
      detail = `${template}: ${msg}`;
      console.warn(`[Notify] ${channel}/${audience}/${template} falló:`, msg);
    }
  }

  await logAppointmentEvent({ appointmentId, type: "notification", channel, audience, result, detail, actorUserId });
  return result;
}

/**
 * El cliente elige una de las fechas que propuso Cristina (enlace con token de un solo uso).
 * La cita vuelve a "pending": elegir fecha NO la confirma, Cristina debe aceptarla.
 */
export async function selectProposedSlot(token: string, slotIndex: number) {
  const row = await getAppointmentByRescheduleToken(token);
  if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Enlace no válido o expirado" });
  const { appointment: appt, client } = row;

  if (appt.status !== "rescheduled") {
    throw new TRPCError({ code: "CONFLICT", message: "Esta propuesta ya no está disponible" });
  }

  const slots: Array<{ date: string; time: string }> = appt.proposedSlots ? JSON.parse(appt.proposedSlots as string) : [];
  const chosen = slots[slotIndex];
  if (!chosen) throw new TRPCError({ code: "BAD_REQUEST", message: "Opción no válida" });

  const newScheduledAt = madridLocalToEpoch(chosen.date, chosen.time);
  if (Number.isNaN(newScheduledAt)) throw new TRPCError({ code: "BAD_REQUEST", message: "Opción no válida" });

  await updateAppointment(appt.id, {
    scheduledAt: newScheduledAt,
    status: "pending",
    rescheduleToken: null as any,
    proposedSlots: null as any,
  });
  await logAppointmentEvent({
    appointmentId: appt.id,
    type: "status_changed",
    fromStatus: "rescheduled",
    toStatus: "pending",
    detail: `Cliente eligió ${chosen.date} ${chosen.time}`,
  });

  void trackNotification({
    appointmentId: appt.id,
    channel: "email",
    audience: "admin",
    template: "slot_selected",
    run: () =>
      sendAdminSlotSelectedEmail({
        clientFirstName: client?.firstName ?? "Cliente",
        clientLastName: client?.lastName ?? "",
        clientEmail: client?.email ?? "",
        clientPhone: client?.phone ?? undefined,
        serviceLabel: appt.serviceLabel ?? appt.serviceType,
        scheduledAt: newScheduledAt,
        modality: appt.modality ?? "presencial",
      }),
  });

  return {
    success: true,
    serviceLabel: appt.serviceLabel ?? appt.serviceType,
    chosenDate: chosen.date,
    chosenTime: chosen.time,
  };
}
