/**
 * Constantes de reserva compartidas entre cliente (formulario) y servidor (validación).
 * Fuente: datos facilitados por Cristina (2026-10-02). Si cambian horarios o tarifas, se editan aquí.
 */

/** Lugar donde se presta el masaje en consulta. */
export const MASSAGE_LOCATION = "Navas de Riofrío (Segovia)";

/**
 * Ficha del centro en Google (Maps/Business Profile "Bion Cristina - Masajes").
 * Es una búsqueda por nombre en Google Maps: no depende de coordenadas ni de un identificador de lugar.
 */
export const CENTER_MAPS_URL = "https://www.google.com/maps/search/?api=1&query=Bion%20Cristina%20-%20Masajes";

/** WhatsApp de Cristina (sin "+"): +34 657 165 343. Única fuente: web, enlaces wa.me y avisos al admin. */
export const CRISTINA_WHATSAPP_NUMBER = "34657165343";

// ─── Horario de Cristina ─────────────────────────────────────────────────────
// Lunes a viernes: 10:00–13:00 y 16:00–19:00 · Sábado y domingo: 10:00–19:00.

export const OPENING_HOURS_TEXT = "Lunes a viernes de 10:00 a 13:00 y de 16:00 a 19:00 · Sábados y domingos de 10:00 a 19:00";

/** Franjas del formulario. `start` es la hora que se guarda como referencia de la cita. */
export const MASSAGE_TIME_SLOTS = {
  morning: { label: "Mañana (10:00 – 13:00)", start: "10:00" },
  midday: { label: "Mediodía (13:00 – 16:00)", start: "13:00" },
  afternoon: { label: "Tarde (16:00 – 19:00)", start: "16:00" },
  any: { label: "Sin preferencia de hora", start: "10:00" },
} as const;
export type MassageTimeSlot = keyof typeof MASSAGE_TIME_SLOTS;

/** ¿Sábado o domingo? Se calcula sobre la fecha "YYYY-MM-DD" sin depender de la zona horaria. */
export function isWeekend(date: string): boolean {
  const d = new Date(`${date}T12:00:00Z`).getUTCDay();
  return d === 0 || d === 6;
}

/** Franjas disponibles para una fecha: entre semana mañana y tarde; el fin de semana también mediodía. */
export function slotsForDate(date?: string): MassageTimeSlot[] {
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date) && isWeekend(date)) return ["morning", "midday", "afternoon", "any"];
  return ["morning", "afternoon", "any"];
}

// ─── Hora fija ───────────────────────────────────────────────────────────────
/** Intervalo entre horas de inicio que se ofrecen al cliente (minutos). */
export const START_TIME_STEP_MIN = 30;
/** Duración que se asume si el servicio no la indica (minutos). */
export const DEFAULT_SESSION_MINUTES = 60;

/** Tramos de atención en minutos desde las 00:00: entre semana 10–13 y 16–19; fin de semana 10–19. */
function openingWindows(date: string): Array<[number, number]> {
  return isWeekend(date) ? [[10 * 60, 19 * 60]] : [[10 * 60, 13 * 60], [16 * 60, 19 * 60]];
}

const pad2 = (n: number) => String(n).padStart(2, "0");
export const minutesToHHMM = (m: number) => `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;

/** Minutos desde las 00:00 de la hora actual en Madrid, y la fecha "YYYY-MM-DD" de hoy en Madrid. */
function madridNow(now: number): { date: string; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  }).formatToParts(new Date(now));
  const g = (t: string) => parts.find((p) => p.type === t)!.value;
  return { date: `${g("year")}-${g("month")}-${g("day")}`, minutes: Number(g("hour")) * 60 + Number(g("minute")) };
}

/**
 * Horas de inicio ("HH:MM") que se pueden solicitar un día: dentro del horario de Cristina, cada
 * START_TIME_STEP_MIN minutos y de forma que la sesión TERMINE antes de que cierre el tramo.
 * Si la fecha es hoy, se descartan las horas que ya han pasado (hora de Madrid).
 */
export function bookableTimes(date: string, durationMinutes?: number | null, now: number = Date.now()): string[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];
  const duration = durationMinutes && durationMinutes > 0 ? durationMinutes : DEFAULT_SESSION_MINUTES;
  const today = madridNow(now);
  const out: string[] = [];
  for (const [open, close] of openingWindows(date)) {
    for (let t = open; t + duration <= close; t += START_TIME_STEP_MIN) {
      if (date === today.date && t <= today.minutes) continue;
      out.push(minutesToHHMM(t));
    }
  }
  return out;
}

export function isBookableTime(date: string, time: string, durationMinutes?: number | null, now: number = Date.now()): boolean {
  return bookableTimes(date, durationMinutes, now).includes(time);
}

// ─── Servicio a domicilio ────────────────────────────────────────────────────
/**
 * Tarifa a domicilio por servicio (€). Solo los servicios listados aquí ofrecen domicilio.
 * La tabla `services` no tiene todavía un campo propio: cuando se añada `homePrice` (migración),
 * estos valores pasarán a la base de datos.
 */
export const HOME_SERVICE_PRICES: Record<string, number> = {
  masaje_terapeutico_navas_de_rio_frio_segovia: 110,
  masaje_relajante_navas_de_rio_frio_segovia: 100,
};

export function getHomePrice(slug?: string | null): number | null {
  return slug && slug in HOME_SERVICE_PRICES ? HOME_SERVICE_PRICES[slug] : null;
}

export type ServiceLocation = "consulta" | "domicilio";
export const HOME_LABEL_SUFFIX = "a domicilio";

// ─── Condiciones ─────────────────────────────────────────────────────────────
export const PAYMENT_NOTE = "Se abona en la cita. No se cobra nada al enviar la solicitud.";

/** Política de cancelación (borrador estándar de centros de masaje; pendiente de validar por Cristina). */
export const CANCELLATION_POLICY =
  "Puedes cancelar o cambiar tu cita sin coste avisando con al menos 24 horas de antelación (por WhatsApp o email). " +
  "Si cancelas con menos de 24 horas o no te presentas, Cristina podrá pedirte una señal previa para darte una nueva cita. " +
  "Si has adelantado una señal, se te devuelve íntegra al cancelar con 24 horas o más.";
