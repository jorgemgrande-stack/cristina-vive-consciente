/**
 * analytics.ts — emisión de eventos de reserva SIN cargar ninguna etiqueta de terceros.
 *
 * - Los eventos se publican en `window.dataLayer` (formato Google Tag Manager / gtag). Hoy el sitio
 *   NO carga GTM, Google Ads ni píxeles: este módulo solo deja la medición lista.
 * - Sin consentimiento (por defecto) NO se emite nada. El sitio todavía no tiene banner de
 *   cookies: hasta que exista, `setConsent()` no se llama y la medición permanece apagada.
 *   Cuando se añada un gestor de consentimiento, debe llamar a `setConsent({analytics, ads})`.
 * - Solo se envían parámetros de la lista blanca (ver shared/bookingAnalytics.ts): nunca datos
 *   personales, texto libre ni datos de salud.
 */
import {
  CLIENT_EMITTABLE_EVENTS,
  mayEmit,
  sanitizeBookingEventParams,
  type BookingEventName,
  type BookingEventParams,
  type ConsentState,
} from "@shared/bookingAnalytics";

const CONSENT_KEY = "cvc_consent_v1";

export function getConsent(): ConsentState | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw);
    return { analytics: c?.analytics === true, ads: c?.ads === true };
  } catch {
    return null;
  }
}

/** Para el futuro gestor de consentimiento (banner de cookies). */
export function setConsent(consent: ConsentState): void {
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
  } catch {
    /* almacenamiento no disponible: se queda sin consentimiento */
  }
}

export function trackBookingEvent(name: BookingEventName, params: Record<string, unknown> = {}): void {
  if (!CLIENT_EMITTABLE_EVENTS.includes(name)) return; // confirmed/paid no se emiten desde el navegador
  if (!mayEmit(getConsent())) return;
  const w = window as unknown as { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer || [];
  const payload: { event: BookingEventName } & BookingEventParams = { event: name, ...sanitizeBookingEventParams(params) };
  w.dataLayer.push(payload);
}
