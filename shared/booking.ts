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
