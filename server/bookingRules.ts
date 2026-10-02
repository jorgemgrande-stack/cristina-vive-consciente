/**
 * bookingRules.ts — reglas puras (sin BD ni red) del flujo de reservas.
 * Se separan para poder probarlas y para que bookings.ts y crm.ts compartan la misma lógica.
 */

export const SPAIN_TZ = "Europe/Madrid";

/** Valores del enum `appointments.serviceType` (columna MySQL ENUM: no se puede ampliar sin migración). */
export const APPOINTMENT_SERVICE_TYPES = [
  "consulta_acompanamiento",
  "consulta_naturopata",
  "consulta_breve",
  "consulta_express",
  "biohabitabilidad",
  "kinesiologia",
  "masaje",
  "otro",
] as const;
export type AppointmentServiceType = (typeof APPOINTMENT_SERVICE_TYPES)[number];

export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled" | "rescheduled";
export type Modality = "presencial" | "telefono" | "zoom" | "whatsapp";

export { MASSAGE_LOCATION, MASSAGE_TIME_SLOTS, type MassageTimeSlot } from "../shared/booking";

// ─── Zona horaria ────────────────────────────────────────────────────────────
// El servidor corre en UTC (Railway): `new Date("2026-10-10T10:00:00")` se interpretaría
// como 10:00 UTC (= 12:00 en Madrid). Siempre hay que construir la hora como hora de Madrid.

function tzOffsetMs(epoch: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SPAIN_TZ,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(epoch));
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(epoch / 1000) * 1000;
}

/** "2026-10-10" + "10:00" (hora de Madrid) → epoch en ms. Devuelve NaN si el formato no es válido. */
export function madridLocalToEpoch(date: string, time: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return NaN;
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59) return NaN;
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  let epoch = guess - tzOffsetMs(guess);
  epoch = guess - tzOffsetMs(epoch); // segunda pasada: cruza un cambio de hora
  return epoch;
}

/** Fecha de hoy en Madrid como "YYYY-MM-DD". */
export function todayInMadrid(now: number = Date.now()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: SPAIN_TZ }).format(new Date(now));
}

/** null si la fecha es válida y no está en el pasado (en Madrid); si no, el mensaje de error. */
export function validateRequestedDate(date: string, now: number = Date.now()): string | null {
  if (Number.isNaN(madridLocalToEpoch(date, "12:00"))) return "Fecha no válida";
  if (date < todayInMadrid(now)) return "La fecha no puede estar en el pasado";
  return null;
}

// ─── Servicio → cita ─────────────────────────────────────────────────────────

export function isMassageService(service: { type?: string | null; slug?: string | null }): boolean {
  return service.type === "masaje" || service.slug === "masaje";
}

/**
 * Los servicios de la tabla `services` tienen slugs libres (p. ej.
 * "masaje_relajante_navas_de_rio_frio_segovia"), pero `appointments.serviceType` es un ENUM
 * cerrado. Todo masaje se guarda como "masaje"; el servicio concreto queda en `serviceLabel`.
 */
export function resolveAppointmentServiceType(service: { slug: string; type?: string | null }): AppointmentServiceType {
  if (isMassageService(service)) return "masaje";
  if ((APPOINTMENT_SERVICE_TYPES as readonly string[]).includes(service.slug)) {
    return service.slug as AppointmentServiceType;
  }
  return "otro";
}

/** Modalidades que admite cada tipo de servicio. Un masaje solo es presencial. */
export function allowedModalities(serviceType: AppointmentServiceType): Modality[] {
  return serviceType === "masaje" ? ["presencial"] : ["presencial", "telefono", "zoom", "whatsapp"];
}

export function buildServiceLabel(name: string, durationLabel?: string | null, durationMinutes?: number | null): string {
  const dur = durationLabel || (durationMinutes ? `${durationMinutes} min` : "");
  return dur && !name.includes(dur) ? `${name} — ${dur}` : name;
}

// ─── Transiciones de estado ──────────────────────────────────────────────────
// Evita que una acción accidental (doble clic, solicitud antigua) cambie una cita ya resuelta.

export const ACCEPTABLE_FROM: AppointmentStatus[] = ["pending"];
export const CANCELLABLE_FROM: AppointmentStatus[] = ["pending", "confirmed", "rescheduled"];
export const PROPOSABLE_FROM: AppointmentStatus[] = ["pending", "confirmed", "rescheduled"];

export function canTransition(from: AppointmentStatus, allowed: AppointmentStatus[]): boolean {
  return allowed.includes(from);
}
