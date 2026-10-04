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
 * Servicio a domicilio. La tarifa está en la base de datos (`services.homePrice`, editable en el CRM):
 * un precio > 0 significa que ese servicio se ofrece a domicilio; vacío/NULL, que no.
 */
export type HomeServiceInfo = { homePrice?: string | number | null };

export function getHomePrice(service?: HomeServiceInfo | null): number | null {
  const n = service?.homePrice == null || service.homePrice === "" ? NaN : Number(service.homePrice);
  return Number.isFinite(n) && n > 0 ? n : null;
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

// ─── Lugar del masaje y dirección a domicilio ────────────────────────────────

/** Texto corto del lugar: un masaje es en consulta (Navas de Riofrío) y, si tiene tarifa, también a domicilio. */
export function massagePlaceLabel(service?: HomeServiceInfo | null): string {
  return getHomePrice(service) !== null ? "En Navas de Riofrío o a domicilio" : "En Navas de Riofrío";
}

/** Respuesta de «¿Dónde se realiza el masaje?». */
export function massagePlaceAnswer(service?: HomeServiceInfo | null): string {
  const home = getHomePrice(service);
  return home !== null
    ? `En consulta, en Navas de Riofrío (Segovia), o a domicilio por ${home} €. Para el domicilio necesito tu dirección postal completa y Cristina confirmará si puede desplazarse a tu zona.`
    : "En consulta, en Navas de Riofrío (Segovia). Si te interesa un servicio a domicilio, consúltalo con Cristina.";
}

export type HomeAddress = { street: string; postalCode: string; city: string };
export type HomeAddressErrors = Partial<Record<keyof HomeAddress, string>>;

/** Código postal español: 5 dígitos con provincia 01–52. */
export function isSpanishPostalCode(cp: string): boolean {
  if (!/^\d{5}$/.test(cp)) return false;
  const prov = Number(cp.slice(0, 2));
  return prov >= 1 && prov <= 52;
}

/** Errores por campo de una dirección a domicilio; objeto vacío = válida. */
export function validateHomeAddress(a: Partial<HomeAddress>): HomeAddressErrors {
  const errors: HomeAddressErrors = {};
  const street = (a.street ?? "").trim();
  const postalCode = (a.postalCode ?? "").trim();
  const city = (a.city ?? "").trim();
  if (street.length < 5 || !/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{2}/.test(street)) errors.street = "Indica la calle y el número (y piso o puerta si los hay)";
  if (!isSpanishPostalCode(postalCode)) errors.postalCode = "Indica un código postal válido de 5 dígitos";
  if (city.length < 2) errors.city = "Indica la localidad";
  return errors;
}

/** "Calle Mayor 5, 2ºB, 40100 Segovia" */
export function formatHomeAddress(a: HomeAddress): string {
  return `${a.street.trim()}, ${a.postalCode.trim()} ${a.city.trim()}`;
}

/** 80 → "80 €"; 72.5 → "72,50 €" (formato de precio de las tarjetas). */
export function formatEuros(value: string | number | null | undefined): string {
  const n = Number(value);
  if (value == null || value === "" || !Number.isFinite(n)) return "";
  return `${Number.isInteger(n) ? n : n.toFixed(2).replace(".", ",")} €`;
}

// ─── Confirmación por WhatsApp al cliente ────────────────────────────────────

/** Fecha y hora de una cita en hora de Madrid: { date: "sábado 3 de octubre", time: "14:00" }. */
export function formatMadridDateTime(epochMs: number): { date: string; time: string } {
  const d = new Date(epochMs);
  return {
    date: d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Madrid" }),
    time: d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Europe/Madrid" }),
  };
}

/** Texto (y datos de la plantilla de WhatsApp Business) del aviso de cita confirmada. */
export function confirmationMessageParts(opts: { firstName: string; serviceLabel: string; scheduledAt: number }) {
  const { date, time } = formatMadridDateTime(opts.scheduledAt);
  const suffix = ` · ${HOME_LABEL_SUFFIX}`;
  const atHome = opts.serviceLabel.toLowerCase().endsWith(suffix.toLowerCase());
  const place = atHome ? "en tu domicilio" : `en ${MASSAGE_LOCATION}`;
  const service = atHome ? opts.serviceLabel.slice(0, opts.serviceLabel.length - suffix.length) : opts.serviceLabel;
  const first = opts.firstName.trim().split(/\s+/)[0] || "";
  return { name: first, service, date, time, place };
}

export function confirmationWhatsAppText(opts: { firstName: string; serviceLabel: string; scheduledAt: number }): string {
  const p = confirmationMessageParts(opts);
  return (
    `Hola ${p.name}, soy Cristina (BION). Tu cita de ${p.service} está confirmada para el ${p.date} a las ${p.time}, ${p.place}. ` +
    `Si necesitas cambiarla, respóndeme por aquí. ¡Hasta pronto! 🌿`
  );
}

// ─── Reserva directa por WhatsApp (desde el paso de revisión del formulario) ──

/** Mensaje que el cliente envía a Cristina para reservar directamente por WhatsApp. */
export function directWhatsAppReservationText(opts: {
  firstName: string;
  serviceLabel: string;
  durationLabel?: string | null;
  /** "YYYY-MM-DD" */
  date: string;
  /** "HH:MM" */
  time?: string;
  atHome?: boolean;
}): string {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(opts.date)
    ? new Date(`${opts.date}T12:00:00Z`).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Madrid" })
    : opts.date;
  const service = opts.durationLabel && !opts.serviceLabel.includes(opts.durationLabel) ? `${opts.serviceLabel} (${opts.durationLabel})` : opts.serviceLabel;
  const when = `${d}${opts.time ? ` a las ${opts.time}` : ""}`;
  const where = opts.atHome ? "a domicilio" : `en ${MASSAGE_LOCATION}`;
  const name = opts.firstName.trim().split(/\s+/)[0];
  return `Hola Cristina, soy ${name || "un cliente"}. Quiero reservar ${service} el ${when}, ${where}. ¿Me confirmas si te viene bien? Gracias 🌿`;
}

export function directWhatsAppReservationUrl(opts: Parameters<typeof directWhatsAppReservationText>[0]): string {
  return `https://wa.me/${CRISTINA_WHATSAPP_NUMBER}?text=${encodeURIComponent(directWhatsAppReservationText(opts))}`;
}

/** Enlace a WhatsApp de Cristina para pedir confirmación inmediata desde el email de solicitud recibida. */
export function immediateConfirmationWhatsAppUrl(opts: {
  firstName: string;
  serviceLabel: string;
  /** "YYYY-MM-DD" */
  date: string;
  /** "HH:MM" o etiqueta de franja heredada */
  time?: string;
}): string {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(opts.date)
    ? new Date(`${opts.date}T12:00:00Z`).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Madrid" })
    : opts.date;
  const when = `${d}${opts.time ? ` (${opts.time})` : ""}`;
  const name = opts.firstName.trim().split(/\s+/)[0];
  const text = `Hola Cristina, soy ${name || "un cliente"}. Acabo de solicitar ${opts.serviceLabel} para el ${when} y necesito confirmación inmediata. ¿Podemos confirmarlo? Gracias 🌿`;
  return `https://wa.me/${CRISTINA_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}
