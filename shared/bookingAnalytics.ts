/**
 * bookingAnalytics.ts — definición y saneado de eventos de medición de reservas (puro, testeable).
 *
 * PRINCIPIOS
 * - Un clic en "Reservar" o una visita NO es una reserva. Solo cuenta como conversión el evento
 *   `booking_request_submitted` (solicitud enviada con éxito).
 * - `booking_confirmed` y `booking_paid` ocurren DESPUÉS, en el admin / en el cobro: no se pueden
 *   disparar desde el navegador del cliente. Hoy quedan registrados en el historial de la cita
 *   (appointment_events) y están pensados para importarse como conversiones offline.
 * - Nunca se envían datos personales (nombre, email, teléfono), texto libre ni datos de salud.
 *   Solo se admiten los parámetros de la lista blanca de abajo, con valores cortos y simples.
 */

export const BOOKING_EVENTS = {
  /** Señal secundaria: se abrió el formulario de reserva (intención, NO conversión). */
  FORM_OPENED: "booking_form_opened",
  /** CONVERSIÓN PRIMARIA: solicitud enviada y registrada (queda pendiente de confirmación). */
  REQUEST_SUBMITTED: "booking_request_submitted",
  /** Conversión de mayor valor: Cristina confirma la cita (solo servidor/admin; importación offline). */
  CONFIRMED: "booking_confirmed",
  /** Solo si en el futuro hay cobro online asociado a la reserva. */
  PAID: "booking_paid",
} as const;
export type BookingEventName = (typeof BOOKING_EVENTS)[keyof typeof BOOKING_EVENTS];

/** Eventos que el navegador del cliente sí puede emitir. */
export const CLIENT_EMITTABLE_EVENTS: BookingEventName[] = [BOOKING_EVENTS.FORM_OPENED, BOOKING_EVENTS.REQUEST_SUBMITTED];

const ALLOWED_PARAMS = ["service_slug", "service_group", "modality", "currency"] as const;
export type BookingEventParams = Partial<Record<(typeof ALLOWED_PARAMS)[number], string>>;

const SAFE_VALUE = /^[a-z0-9_.-]{1,80}$/i;

/** Deja solo parámetros de la lista blanca con valores simples (sin espacios, @, números largos…). */
export function sanitizeBookingEventParams(params: Record<string, unknown> = {}): BookingEventParams {
  const out: BookingEventParams = {};
  for (const key of ALLOWED_PARAMS) {
    const v = params[key];
    if (typeof v === "string" && SAFE_VALUE.test(v)) out[key] = v;
  }
  return out;
}

export type ConsentState = { analytics: boolean; ads: boolean };

/** El evento solo se emite si hay consentimiento de analítica o de publicidad. */
export function mayEmit(consent: ConsentState | null | undefined): boolean {
  return !!consent && (consent.analytics === true || consent.ads === true);
}
