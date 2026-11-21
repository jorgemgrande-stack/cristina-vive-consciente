/**
 * consent.ts — estado del consentimiento de cookies (localStorage). Sin dependencias para evitar ciclos.
 * null = el usuario aún no ha decidido (se muestra el banner).
 */
import type { ConsentState } from "@shared/bookingAnalytics";

export const CONSENT_KEY = "cvc_consent_v1";
export const CONSENT_CHANGED_EVENT = "cvc:consent-changed";
export const OPEN_COOKIE_SETTINGS_EVENT = "cvc:open-cookie-settings";

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

/** `policyVersion`: versiones publicadas de la política de cookies y de privacidad que se mostraban al decidir (null = texto original). */
export function setConsent(consent: ConsentState, policyVersion?: { cookies: number | null; privacy: number | null }): void {
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ ...consent, savedAt: new Date().toISOString(), ...(policyVersion ? { policyVersion } : {}) }));
  } catch {
    /* almacenamiento no disponible: se queda sin consentimiento */
  }
  window.dispatchEvent(new Event(CONSENT_CHANGED_EVENT));
}
