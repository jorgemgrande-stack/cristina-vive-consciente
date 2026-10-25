/**
 * clientCare.ts — reglas puras de la ficha de clientes (sin base de datos; se prueban aparte).
 *
 * Separación de datos (ver docs/PRIVACIDAD_FICHAS.md):
 *  - Administrativos y prácticos: tabla `clients` y `session_history` (texto normal).
 *  - Salud / emocional (Primera visita, Acompañamiento): `client_sensitive_records`, cifrados y solo con
 *    consentimiento explícito vigente de ese cliente para ese módulo.
 */
import { z } from "zod";

// ─── Textos de ayuda (visibles en la interfaz) ───────────────────────────────
export const REMEMBER_INFO_HELP =
  "Solo preferencias prácticas (p. ej. «prefiere presión suave», «le gusta la música baja», «avisar por WhatsApp»). " +
  "No escribas aquí diagnósticos, salud, medicación, historia familiar, vida sexual ni relatos personales.";

export const SESSION_NOTES_HELP =
  "Notas prácticas de la sesión. Lo relativo a salud o emociones va en Primera visita o Acompañamiento, con su consentimiento.";

// ─── Límites de los campos (también se validan en el servidor) ───────────────
export const LIMITS = {
  shortText: 150,
  rateNote: 200,
  longText: 2000,
  /** Campos de Primera visita y Acompañamiento: breves a propósito (minimización) */
  sensitiveText: 1000,
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

/** Hora pactada «HH:MM» (24 h) */
export const SESSION_TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export const sessionInput = z.object({
  sessionDate: z.number().int().positive(),
  /** Hora pactada de la sesión (opcional). Vacío o null = sin hora */
  sessionTime: z.union([z.literal(""), z.string().regex(SESSION_TIME_RE, "Hora no válida (usa HH:MM, 24 h)")]).optional().nullable(),
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
const sensitiveText = optionalText(LIMITS.sensitiveText);

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

// ─── Consentimiento explícito por módulo ─────────────────────────────────────
export type SensitiveModuleKey = "first_visit" | "emotional";

/**
 * Textos que se muestran al cliente antes de registrar su consentimiento. Con cada consentimiento se guarda
 * la versión: si se cambia un texto, hay que cambiar también su versión. BORRADOR pendiente de que Cristina
 * lo valide (docs/PRIVACIDAD_FICHAS.md §8).
 */
export const CONSENT_TEXTS: Record<SensitiveModuleKey, { version: string; title: string; text: string }> = {
  first_visit: {
    version: "pv-2026-10-v1",
    title: "Primera visita",
    text:
      "Cristina Battistelli (Cristina Vive Consciente) anotará en tu ficha la información de salud y bienestar que quieras " +
      "compartir (motivo de la visita, alergias o sensibilidades, circunstancias a tener en cuenta y zonas a evitar) para " +
      "preparar tus sesiones y darles seguimiento. Cristina no es profesional sanitaria: estas notas no son diagnósticos ni " +
      "sustituyen la atención médica. Es voluntario y solo se anota lo que decidas contar. La información se guarda cifrada, " +
      "solo accede Cristina y no se usa para publicidad, analítica ni herramientas de inteligencia artificial, ni se envía por " +
      "correo o WhatsApp. Puedes pedir una copia, corregirla o retirar este consentimiento en cualquier momento; al retirarlo " +
      "se suprimen estos datos. Contacto: info@cristinaviveconsciente.es.",
  },
  emotional: {
    version: "ae-2026-10-v1",
    title: "Acompañamiento emocional",
    text:
      "Cristina Battistelli (Cristina Vive Consciente) anotará lo que quieras compartir en el acompañamiento emocional " +
      "(lo que relatas, sus observaciones y los objetivos de seguimiento) para preparar las sesiones y darles continuidad. " +
      "No es terapia psicológica ni atención sanitaria, y no se hacen diagnósticos. Es voluntario e independiente de la " +
      "primera visita: aceptarlo no es condición para reservar ni recibir ningún servicio. La información se guarda cifrada, " +
      "solo accede Cristina y no se usa para publicidad, analítica ni herramientas de inteligencia artificial, ni se envía por " +
      "correo o WhatsApp. Puedes pedir una copia, corregirla o retirar este consentimiento en cualquier momento; al retirarlo " +
      "se suprimen estos datos. Contacto: info@cristinaviveconsciente.es.",
  },
};

export const CONSENT_METHODS = ["papel_firmado", "formulario_electronico"] as const;

// ─── Revisión periódica de la conservación ───────────────────────────────────
/** Cada cuánto se pregunta si los datos de un módulo siguen siendo necesarios (a confirmar por Cristina). */
export const RETENTION_REVIEW_MONTHS = 12;
const REVIEW_MS = RETENTION_REVIEW_MONTHS * 30 * 86_400_000;

type ConsentLike = { grantedAt: number; withdrawnAt?: number | null; reviewedAt?: number | null };

/**
 * ¿Toca revisar los datos de un módulo? (solo si quedan datos)
 * - «withdrawn»: consentimiento retirado → suprimir salvo obligación legal de conservarlos.
 * - «periodic»: han pasado RETENTION_REVIEW_MONTHS desde el consentimiento o la última revisión.
 */
export function retentionReview(consent: ConsentLike | undefined, hasData: boolean, now: number = Date.now()): "withdrawn" | "periodic" | null {
  if (!consent || !hasData) return null;
  if (consent.withdrawnAt) return "withdrawn";
  return now - Math.max(consent.grantedAt, consent.reviewedAt ?? 0) >= REVIEW_MS ? "periodic" : null;
}

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

/** Día de la sesión «YYYY-MM-DD» en hora de Madrid (la fecha se guarda como un instante del día). */
export function sessionDay(sessionDate: number): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).format(sessionDate);
}

/**
 * Sesiones de más reciente a más antigua: por día; dentro del día, por hora pactada (las que no tienen hora,
 * después de las que sí); y, a igualdad, la registrada más tarde primero (id descendente).
 */
export function sortSessions<T extends { sessionDate: number; id: number; sessionTime?: string | null }>(sessions: T[]): T[] {
  return [...sessions].sort((a, b) => {
    const day = sessionDay(b.sessionDate).localeCompare(sessionDay(a.sessionDate));
    if (day) return day;
    const ta = a.sessionTime || "";
    const tb = b.sessionTime || "";
    if (ta !== tb) return tb.localeCompare(ta); // "" (sin hora) queda al final del día
    return b.id - a.id;
  });
}

/** Opciones del selector de hora: cada 15 minutos de 07:00 a 22:45, en 24 h (más la hora guardada si no encaja). */
export function sessionTimeOptions(current?: string | null): string[] {
  const opts: string[] = [];
  for (let m = 7 * 60; m < 23 * 60; m += 15) opts.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  if (current && SESSION_TIME_RE.test(current) && !opts.includes(current)) opts.push(current), opts.sort();
  return opts;
}

/** Nombres de los campos que cambian (para el registro de auditoría: nunca los valores). */
export function changedFields(before: Record<string, unknown>, after: Record<string, unknown>): string[] {
  return Object.keys(after).filter((k) => after[k] !== undefined && (before[k] ?? null) !== (after[k] ?? null));
}
