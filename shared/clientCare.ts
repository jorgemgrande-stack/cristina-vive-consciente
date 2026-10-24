/**
 * clientCare.ts — reglas puras de la ficha de clientes (sin base de datos; se prueban aparte).
 *
 * Separación de datos (ver docs/PRIVACIDAD_FICHAS.md):
 *  - Administrativos y prácticos: tabla `clients` y `session_history` (texto normal).
 *  - Categoría especial (salud / emocional): `client_sensitive_records`, cifrados y bloqueados por defecto.
 */
import { z } from "zod";

// ─── Textos de ayuda (visibles en la interfaz) ───────────────────────────────
export const REMEMBER_INFO_HELP =
  "Solo preferencias prácticas (p. ej. «prefiere presión suave», «le gusta la música baja», «avisar por WhatsApp»). " +
  "No escribas aquí diagnósticos, salud, medicación, historia familiar, vida sexual ni relatos personales.";

export const SESSION_NOTES_HELP =
  "Notas prácticas de la sesión. Nada de salud, emociones ni relatos personales: eso va en las secciones protegidas cuando estén habilitadas.";

// ─── Límites de los campos (también se validan en el servidor) ───────────────
export const LIMITS = {
  shortText: 150,
  rateNote: 200,
  longText: 2000,
} as const;

const optionalText = (max: number) => z.string().trim().max(max).optional().nullable();

export const profileInput = z.object({
  occupation: optionalText(LIMITS.shortText),
  customRate: z
    .string()
    .trim()
    .regex(/^\d{1,4}([.,]\d{1,2})?$/, "Tarifa no válida")
    .optional()
    .nullable()
    .or(z.literal("")),
  customRateNote: optionalText(LIMITS.rateNote),
  rememberInfo: optionalText(LIMITS.longText),
});
export type ProfileInput = z.infer<typeof profileInput>;

export const sessionInput = z.object({
  sessionDate: z.number().int().positive(),
  serviceId: z.number().int().positive().optional().nullable(),
  durationMinutes: z.number().int().min(5).max(600).optional().nullable(),
  /** Observaciones prácticas (columna summary) */
  practicalNotes: optionalText(LIMITS.longText),
  clientPreferences: optionalText(LIMITS.longText),
  /** Cuestiones pendientes para la próxima sesión (columna nextSteps) */
  pendingNext: optionalText(LIMITS.longText),
  appointmentId: z.number().int().positive().optional().nullable(),
});
export type SessionInput = z.infer<typeof sessionInput>;

// ─── Datos de categoría especial: estructura (se guarda cifrada) ─────────────
const sensitiveText = optionalText(LIMITS.longText);

/** Ficha de primera visita: todos los campos opcionales */
export const firstVisitPayload = z.object({
  visitReason: sensitiveText,
  allergies: sensitiveText,
  healthForSafety: sensitiveText,
  areasToAvoid: sensitiveText,
  wellbeing: sensitiveText,
  otherObservations: sensitiveText,
});
export type FirstVisitPayload = z.infer<typeof firstVisitPayload>;

/** Anotación de acompañamiento: relato del cliente, observaciones de la profesional y seguimiento, separados */
export const emotionalPayload = z.object({
  clientAccount: z.object({
    reason: sensitiveText,
    situations: sensitiveText,
    emotions: sensitiveText,
    familyHistory: sensitiveText,
  }),
  professionalObservations: z.object({
    workDone: sensitiveText,
    observations: sensitiveText,
  }),
  followUp: z.object({
    goals: sensitiveText,
    pending: sensitiveText,
  }),
});
export type EmotionalPayload = z.infer<typeof emotionalPayload>;

// ─── Cálculos del resumen ────────────────────────────────────────────────────
type SessionLike = { sessionDate: number; serviceId?: number | null };
type AppointmentLike = { id: number; scheduledAt: number; status: string; serviceLabel?: string | null };
type ServiceLike = { id: number; name: string };

/** Última visita = fecha de la sesión más reciente registrada (no de reservas futuras). */
export function lastVisit(sessions: SessionLike[]): number | null {
  return sessions.reduce<number | null>((max, s) => (max === null || s.sessionDate > max ? s.sessionDate : max), null);
}

/** Próxima cita = la reserva futura más cercana pendiente o confirmada (única fuente: appointments). */
export function nextAppointment<T extends AppointmentLike>(appointments: T[], now: number = Date.now()): T | null {
  return (
    appointments
      .filter((a) => a.scheduledAt > now && (a.status === "pending" || a.status === "confirmed"))
      .sort((a, b) => a.scheduledAt - b.scheduledAt)[0] ?? null
  );
}

/** Servicios recibidos, a partir de las sesiones enlazadas a servicios reales del sistema. */
export function servicesReceived(sessions: SessionLike[], services: ServiceLike[]) {
  const byId = new Map(services.map((s) => [s.id, s.name]));
  const acc = new Map<number, { serviceId: number; name: string; count: number; last: number }>();
  for (const s of sessions) {
    if (!s.serviceId || !byId.has(s.serviceId)) continue;
    const cur = acc.get(s.serviceId) ?? { serviceId: s.serviceId, name: byId.get(s.serviceId)!, count: 0, last: 0 };
    cur.count += 1;
    cur.last = Math.max(cur.last, s.sessionDate);
    acc.set(s.serviceId, cur);
  }
  return Array.from(acc.values()).sort((a, b) => b.last - a.last);
}

/** Sesiones de más reciente a más antigua (desempate por id, también descendente). */
export function sortSessions<T extends { sessionDate: number; id: number }>(sessions: T[]): T[] {
  return [...sessions].sort((a, b) => b.sessionDate - a.sessionDate || b.id - a.id);
}

/** Nombres de los campos que cambian (para el registro de auditoría: nunca los valores). */
export function changedFields(before: Record<string, unknown>, after: Record<string, unknown>): string[] {
  return Object.keys(after).filter((k) => after[k] !== undefined && (before[k] ?? null) !== (after[k] ?? null));
}
