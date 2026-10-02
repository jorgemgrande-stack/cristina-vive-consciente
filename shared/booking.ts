/**
 * Constantes de reserva compartidas entre cliente (formulario) y servidor (validación).
 */

/** Lugar donde se presta el masaje en consulta. */
export const MASSAGE_LOCATION = "Navas de Riofrío (Segovia)";

/** Franjas que ve el cliente en el formulario de masaje. `start` es la hora que se guarda como referencia. */
export const MASSAGE_TIME_SLOTS = {
  morning: { label: "Mañana (9:00 – 13:00)", start: "09:00" },
  afternoon: { label: "Tarde (16:00 – 20:00)", start: "16:00" },
  any: { label: "Sin preferencia de hora", start: "10:00" },
} as const;
export type MassageTimeSlot = keyof typeof MASSAGE_TIME_SLOTS;

/** WhatsApp de Cristina (sin "+"): +34 657 165 343. Única fuente: web, enlaces wa.me y avisos al admin. */
export const CRISTINA_WHATSAPP_NUMBER = "34657165343";
