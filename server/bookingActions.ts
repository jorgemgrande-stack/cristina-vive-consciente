/**
 * bookingActions.ts — lógica compartida del flujo de reservas que toca BD/notificaciones.
 * - trackNotification: envía una notificación y deja constancia (enviada / fallida / omitida).
 * - selectProposedSlot: el cliente elige una de las fechas propuestas (antes duplicado en
 *   bookings.ts y crm.ts).
 */
import { TRPCError } from "@trpc/server";
import crypto from "crypto";
import { getAppointmentById, getAppointmentByRescheduleToken, updateAppointment, logAppointmentEvent } from "./db";
import {
  isAdminEmailConfigured,
  isEmailConfigured,
  sendAdminSlotSelectedEmail,
  sendAppointmentAcceptedEmail,
  sendAppointmentAcceptedAdminEmail,
  sendAppointmentCancelledEmail,
  sendAppointmentCancelledAdminEmail,
  sendRescheduleProposalEmail,
} from "./email";
import {
  ACCEPTABLE_FROM,
  CANCELLABLE_FROM,
  PROPOSABLE_FROM,
  canTransition,
  madridLocalToEpoch,
  validateRequestedDate,
  type AppointmentStatus,
} from "./bookingRules";

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


// ─── Acciones de Cristina sobre una solicitud (CRM y enlaces del aviso) ──────
// Una sola implementación: el CRM y los enlaces firmados del aviso hacen exactamente lo mismo.

/** Falla con CONFLICT si la cita no está en un estado desde el que se permite la acción. */
export function assertTransition(status: AppointmentStatus, allowed: AppointmentStatus[], action: string) {
  if (!canTransition(status, allowed)) {
    throw new TRPCError({
      code: "CONFLICT",
      message: `No se puede ${action}: la cita ya está "${status}". Recarga la lista para ver su estado actual.`,
    });
  }
}

async function loadAppointment(id: number) {
  const row = await getAppointmentById(id);
  if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Cita no encontrada" });
  return row;
}

/** `actorUserId` null = acción hecha desde el enlace del aviso (queda indicado en el historial). */
const viaLink = (actorUserId: number | null) => (actorUserId === null ? { detail: "Desde el enlace del aviso" } : {});

/** Acepta una solicitud pendiente → confirmed + emails. Solo desde "pending". */
export async function acceptAppointment(id: number, actorUserId: number | null) {
  const { appointment: appt, client } = await loadAppointment(id);
  assertTransition(appt.status, ACCEPTABLE_FROM, "confirmar");
  await updateAppointment(id, { status: "confirmed" });
  await logAppointmentEvent({
    appointmentId: id, type: "status_changed", fromStatus: appt.status, toStatus: "confirmed", actorUserId, ...viaLink(actorUserId),
  });

  const emailData = {
    clientFirstName: client?.firstName ?? "Cliente",
    clientEmail: client?.email ?? "",
    serviceLabel: appt.serviceLabel ?? appt.serviceType,
    scheduledAt: appt.scheduledAt,
    modality: appt.modality ?? "presencial",
  };
  if (client?.email) {
    void trackNotification({
      appointmentId: id, channel: "email", audience: "client", template: "accepted", actorUserId,
      run: () => sendAppointmentAcceptedEmail(emailData),
    });
  }
  void trackNotification({
    appointmentId: id, channel: "email", audience: "admin", template: "accepted", actorUserId,
    run: () => sendAppointmentAcceptedAdminEmail({ ...emailData, clientLastName: client?.lastName ?? "", clientPhone: client?.phone ?? undefined }),
  });
  return { success: true };
}

/** Rechaza/cancela una cita con motivo → cancelled + emails. No sobre citas ya completadas o canceladas. */
export async function cancelAppointmentWithReason(id: number, reason: string, actorUserId: number | null) {
  const { appointment: appt, client } = await loadAppointment(id);
  assertTransition(appt.status, CANCELLABLE_FROM, "cancelar");
  await updateAppointment(id, { status: "cancelled", cancellationReason: reason });
  await logAppointmentEvent({
    appointmentId: id, type: "status_changed", fromStatus: appt.status, toStatus: "cancelled", actorUserId, ...viaLink(actorUserId),
  });

  const emailData = {
    clientFirstName: client?.firstName ?? "Cliente",
    clientEmail: client?.email ?? "",
    serviceLabel: appt.serviceLabel ?? appt.serviceType,
    scheduledAt: appt.scheduledAt,
    modality: appt.modality ?? "presencial",
    cancellationReason: reason,
  };
  if (client?.email) {
    void trackNotification({
      appointmentId: id, channel: "email", audience: "client", template: "cancelled", actorUserId,
      run: () => sendAppointmentCancelledEmail(emailData),
    });
  }
  void trackNotification({
    appointmentId: id, channel: "email", audience: "admin", template: "cancelled", actorUserId,
    run: () => sendAppointmentCancelledAdminEmail({ ...emailData, clientLastName: client?.lastName ?? "" }),
  });
  return { success: true };
}

/** Propone nuevas fechas → rescheduled + token de un solo uso + email al cliente. */
export async function proposeAppointmentSlots(id: number, slots: Array<{ date: string; time: string }>, actorUserId: number | null) {
  const { appointment: appt, client } = await loadAppointment(id);
  assertTransition(appt.status, PROPOSABLE_FROM, "proponer otra fecha");

  for (const s of slots) {
    const err = validateRequestedDate(s.date);
    if (err || Number.isNaN(madridLocalToEpoch(s.date, s.time))) {
      throw new TRPCError({ code: "BAD_REQUEST", message: `Fecha propuesta no válida (${s.date} ${s.time}): ${err ?? "hora no válida"}` });
    }
  }

  const token = crypto.randomBytes(24).toString("hex");
  await updateAppointment(id, { status: "rescheduled", rescheduleToken: token, proposedSlots: JSON.stringify(slots) });
  await logAppointmentEvent({
    appointmentId: id,
    type: "status_changed",
    fromStatus: appt.status,
    toStatus: "rescheduled",
    detail: `Propuestas: ${slots.map((s) => `${s.date} ${s.time}`).join(", ")}${actorUserId === null ? " (desde el enlace del aviso)" : ""}`,
    actorUserId,
  });

  if (client?.email) {
    const emailData = {
      clientFirstName: client.firstName ?? "Cliente",
      clientEmail: client.email,
      serviceLabel: appt.serviceLabel ?? appt.serviceType,
      scheduledAt: appt.scheduledAt,
      modality: appt.modality ?? "presencial",
      proposedSlots: slots,
      rescheduleToken: token,
    };
    void trackNotification({
      appointmentId: id, channel: "email", audience: "client", template: "reschedule_proposed", actorUserId,
      run: () => sendRescheduleProposalEmail(emailData),
    });
  }
  return { success: true, token };
}
