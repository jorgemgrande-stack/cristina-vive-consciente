/**
 * googleTag.ts — carga de Google tag (gtag.js) condicionada al consentimiento.
 *
 * ESTADO: PREPARADO Y APAGADO. Solo hace algo si se definen las variables de entorno de Vite
 * (en Railway, en tiempo de build):
 *   VITE_GOOGLE_ADS_ID                 p. ej. AW-123456789   (Google Ads)
 *   VITE_GA4_ID                        p. ej. G-ABCDE12345   (Google Analytics 4, opcional)
 *   VITE_GOOGLE_ADS_BOOKING_LABEL      etiqueta de la conversión "solicitud de reserva"
 * Sin ID no se descarga ningún script de Google. Con ID pero sin consentimiento, tampoco.
 *
 * Reglas:
 * - Consent Mode v2: todo en "denied" por defecto; solo pasa a "granted" lo que el usuario acepta
 *   (analítica → analytics_storage; publicidad → ad_storage, ad_user_data, ad_personalization).
 * - La conversión de Google Ads es `booking_request_submitted` (solicitud enviada), nunca una visita
 *   ni un clic. No se envía valor, nombre, email, teléfono ni texto libre.
 * - Un identificador de clic (gclid) lo gestiona gtag.js en sus cookies propias, solo con consentimiento.
 */
import { getConsent } from "./consent";

const ADS_ID = (import.meta.env.VITE_GOOGLE_ADS_ID as string | undefined)?.trim();
const GA4_ID = (import.meta.env.VITE_GA4_ID as string | undefined)?.trim();
const BOOKING_LABEL = (import.meta.env.VITE_GOOGLE_ADS_BOOKING_LABEL as string | undefined)?.trim();

const ID_PATTERN = /^(AW|G)-[A-Z0-9]{6,}$/;
const IDS = [ADS_ID, GA4_ID].filter((id): id is string => !!id && ID_PATTERN.test(id));

type GtagFn = (...args: unknown[]) => void;
type GoogleWindow = Window & { dataLayer?: unknown[]; gtag?: GtagFn };

let scriptInjected = false;

function ensureGtag(): GtagFn {
  const w = window as GoogleWindow;
  w.dataLayer = w.dataLayer || [];
  if (!w.gtag) {
    // gtag.js exige objetos `arguments` en dataLayer, no arrays.
    w.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      w.dataLayer!.push(arguments);
    };
    w.gtag("consent", "default", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
    });
  }
  return w.gtag;
}

function applyConsent(): void {
  const consent = getConsent();
  if (IDS.length === 0 || !consent || (!consent.analytics && !consent.ads)) {
    // Sin ID o sin consentimiento: no se carga nada. Si ya estaba cargado, se retira el permiso.
    if (scriptInjected) {
      ensureGtag()("consent", "update", {
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
        analytics_storage: "denied",
      });
    }
    return;
  }

  const gtag = ensureGtag();
  gtag("consent", "update", {
    ad_storage: consent.ads ? "granted" : "denied",
    ad_user_data: consent.ads ? "granted" : "denied",
    ad_personalization: consent.ads ? "granted" : "denied",
    analytics_storage: consent.analytics ? "granted" : "denied",
  });

  if (!scriptInjected) {
    scriptInjected = true;
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(IDS[0])}`;
    document.head.appendChild(s);
    gtag("js", new Date());
    for (const id of IDS) gtag("config", id, { allow_ad_personalization_signals: consent.ads });
  }
}

/** Se llama una vez al arrancar la web: aplica el consentimiento guardado y escucha cambios. */
export function initGoogleTag(): void {
  if (IDS.length === 0) return;
  applyConsent();
  window.addEventListener("cvc:consent-changed", applyConsent);
}

/** Conversión de Google Ads por solicitud de reserva enviada (solo con consentimiento de publicidad). */
export function reportBookingRequestConversion(): void {
  const consent = getConsent();
  const w = window as GoogleWindow;
  if (!ADS_ID || !ID_PATTERN.test(ADS_ID) || !BOOKING_LABEL || !consent?.ads || !w.gtag) return;
  w.gtag("event", "conversion", { send_to: `${ADS_ID}/${BOOKING_LABEL}` });
}
