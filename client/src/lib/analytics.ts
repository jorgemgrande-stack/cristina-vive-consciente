/**
 * analytics.ts — consentimiento y emisión de eventos de reserva.
 *
 * - Los eventos se publican en `window.dataLayer` (formato Google Tag Manager / gtag). La etiqueta de
 *   Google solo se carga si hay IDs configurados y consentimiento (ver googleTag.ts); hoy no hay IDs.
 * - Sin consentimiento (por defecto) NO se emite nada. El consentimiento lo gestiona el banner de
 *   cookies (components/CookieBanner.tsx), que llama a `setConsent()`.
 * - Solo se envían parámetros de la lista blanca (ver shared/bookingAnalytics.ts): nunca datos
 *   personales, texto libre ni datos de salud.
 */
import {
  BOOKING_EVENTS,
  CLIENT_EMITTABLE_EVENTS,
  mayEmit,
  sanitizeBookingEventParams,
  type BookingEventName,
  type BookingEventParams,
} from "@shared/bookingAnalytics";
import { getConsent } from "./consent";
import { reportBookingRequestConversion, sendGa4Event } from "./googleTag";

export { CONSENT_KEY, CONSENT_CHANGED_EVENT, OPEN_COOKIE_SETTINGS_EVENT, getConsent, setConsent } from "./consent";

export function trackBookingEvent(name: BookingEventName, params: Record<string, unknown> = {}): void {
  if (!CLIENT_EMITTABLE_EVENTS.includes(name)) return; // confirmed/paid no se emiten desde el navegador
  if (!mayEmit(getConsent())) return;
  const w = window as unknown as { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer || [];
  const clean = sanitizeBookingEventParams(params);
  const payload: { event: BookingEventName } & BookingEventParams = { event: name, ...clean };
  w.dataLayer.push(payload);
  // gtag.js ignora los objetos planos del dataLayer: para que GA4 reciba el evento hay que enviarlo con gtag()
  sendGa4Event(name, clean as Record<string, string>);
  if (name === BOOKING_EVENTS.REQUEST_SUBMITTED) reportBookingRequestConversion();
}
