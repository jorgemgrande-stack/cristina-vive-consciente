/**
 * googleTag.ts — carga de Google tag (gtag.js) condicionada al consentimiento.
 *
 * ESTADO: PREPARADO Y APAGADO. Solo hace algo si se definen las variables de entorno de Vite
 * (en Railway, en tiempo de build):
 *   VITE_GOOGLE_ADS_ID                 p. ej. AW-123456789   (Google Ads)
 *   VITE_GA4_ID                        p. ej. G-ABCDE12345   (Google Analytics 4, opcional)
 *   VITE_GOOGLE_ADS_BOOKING_LABEL      etiqueta de la conversión "solicitud de reserva"
 *   VITE_GTM_ID                        contenedor de Google Tag Manager (por defecto GTM-MVV9SN7V)
 * Sin ID no se descarga ningún script de Google. Con ID pero sin consentimiento, tampoco.
 *
 * Google Tag Manager se carga AQUÍ, tras el consentimiento, y no con el fragmento pegado en index.html:
 * así no hay ninguna petición a Google antes de que el visitante acepte. Tampoco se usa el <noscript> del
 * fragmento (cargaría el contenedor sin consentimiento). El contenedor nace vacío: mientras no tenga etiquetas,
 * no mide nada. Las conversiones de Google Ads y los eventos de GA4 siguen saliendo por gtag.js; si se crean
 * en GTM las mismas etiquetas, habría que quitar las de gtag para no contar dos veces.
 *
 * Reglas:
 * - Consent Mode v2: todo en "denied" por defecto; solo pasa a "granted" lo que el usuario acepta
 *   (analítica → analytics_storage; publicidad → ad_storage y ad_user_data). `ad_personalization` queda SIEMPRE
 *   en "denied": solo medimos conversiones, no se hace remarketing ni personalización de anuncios.
 * - La conversión de Google Ads es `booking_request_submitted` (solicitud enviada), nunca una visita
 *   ni un clic. No se envía valor, nombre, email, teléfono ni texto libre.
 * - Un identificador de clic (gclid) lo gestiona gtag.js en sus cookies propias, solo con consentimiento.
 */
import { getConsent } from "./consent";

const ADS_ID = (import.meta.env.VITE_GOOGLE_ADS_ID as string | undefined)?.trim();
const GA4_ID = (import.meta.env.VITE_GA4_ID as string | undefined)?.trim();
const BOOKING_LABEL = (import.meta.env.VITE_GOOGLE_ADS_BOOKING_LABEL as string | undefined)?.trim();

const GTM_ID = ((import.meta.env.VITE_GTM_ID as string | undefined)?.trim() || "GTM-MVV9SN7V");

const ID_PATTERN = /^(AW|G)-[A-Z0-9]{6,}$/;
const GTM_PATTERN = /^GTM-[A-Z0-9]{6,}$/;
const HAS_GTM = GTM_PATTERN.test(GTM_ID);
const IDS = [ADS_ID, GA4_ID].filter((id): id is string => !!id && ID_PATTERN.test(id));

type GtagFn = (...args: unknown[]) => void;
type GoogleWindow = Window & { dataLayer?: unknown[]; gtag?: GtagFn };

let scriptInjected = false;
let gtmInjected = false;

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
  if ((IDS.length === 0 && !HAS_GTM) || !consent || (!consent.analytics && !consent.ads)) {
    // Sin ID o sin consentimiento: no se carga nada. Si ya estaba cargado, se retira el permiso.
    if (scriptInjected || gtmInjected) {
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
    ad_personalization: "denied", // sin remarketing: la política de cookies solo declara medición
    analytics_storage: consent.analytics ? "granted" : "denied",
  });

  if (HAS_GTM && !gtmInjected) {
    gtmInjected = true;
    (window as GoogleWindow).dataLayer!.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    const g = document.createElement("script");
    g.async = true;
    g.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GTM_ID)}`;
    document.head.appendChild(g);
  }

  if (IDS.length > 0 && !scriptInjected) {
    scriptInjected = true;
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(IDS[0])}`;
    document.head.appendChild(s);
    gtag("js", new Date());
    for (const id of IDS) gtag("config", id, { allow_ad_personalization_signals: false });
  }
}

/** Se llama una vez al arrancar la web: aplica el consentimiento guardado y escucha cambios. */
export function initGoogleTag(): void {
  if (IDS.length === 0 && !HAS_GTM) return;
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

/**
 * Evento de reserva hacia Google Analytics 4 (solo con consentimiento de analítica e ID de GA4 configurado).
 * `params` ya viene saneado (lista blanca: service_slug, service_group, modality, currency): nunca datos personales.
 */
export function sendGa4Event(name: string, params: Record<string, string> = {}): void {
  const consent = getConsent();
  const w = window as GoogleWindow;
  if (!GA4_ID || !ID_PATTERN.test(GA4_ID) || !consent?.analytics || !w.gtag) return;
  w.gtag("event", name, params);
}
