/**
 * Medición del clic en WhatsApp (cliente) con el consentimiento real de la web simulado:
 * qué sale hacia GA4 y hacia Google Ads con cada combinación, y que nunca se envía como reserva.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ADS_ID = "AW-123456789";
const BOOKING_LABEL = "reservaLabel";
const WHATSAPP_LABEL = "whatsappLabel";

type Call = unknown[];
let gtagCalls: Call[];
let dataLayer: unknown[];

function setConsent(consent: { analytics: boolean; ads: boolean } | null) {
  const store = new Map<string, string>();
  if (consent) store.set("cvc_consent_v1", JSON.stringify(consent));
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
  });
}

async function loadAnalytics(env: Record<string, string> = {}) {
  vi.stubEnv("VITE_GOOGLE_ADS_ID", ADS_ID);
  vi.stubEnv("VITE_GA4_ID", "G-ABCDE12345");
  vi.stubEnv("VITE_GOOGLE_ADS_BOOKING_LABEL", BOOKING_LABEL);
  vi.stubEnv("VITE_GOOGLE_ADS_WHATSAPP_LABEL", WHATSAPP_LABEL);
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  vi.resetModules();
  const analytics = await import("../client/src/lib/analytics");
  const { BOOKING_EVENTS } = await import("../shared/bookingAnalytics");
  return { ...analytics, BOOKING_EVENTS };
}

const ga4Events = () => gtagCalls.filter((c) => c[0] === "event" && c[1] !== "conversion");
const adsConversions = () => gtagCalls.filter((c) => c[0] === "event" && c[1] === "conversion").map((c) => (c[2] as { send_to: string }).send_to);

beforeEach(() => {
  gtagCalls = [];
  dataLayer = [];
  vi.stubGlobal("window", { dataLayer, gtag: (...args: unknown[]) => gtagCalls.push(args) });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("CRM y administración", () => {
  it("con todo el consentimiento, desde /crm o /admin no se envía nada a Google", async () => {
    setConsent({ analytics: true, ads: true });
    for (const pathname of ["/crm/clientes/9001", "/admin/login"]) {
      vi.stubGlobal("window", { dataLayer, gtag: (...args: unknown[]) => gtagCalls.push(args), location: { pathname } });
      const a = await loadAnalytics();
      a.trackBookingEvent(a.BOOKING_EVENTS.WHATSAPP_CONTACT_CLICKED, { placement: "floating_button" });
    }
    expect(gtagCalls).toHaveLength(0);
  });
});

describe("clic en el globo de WhatsApp", () => {
  const click = (a: Awaited<ReturnType<typeof loadAnalytics>>) =>
    a.trackBookingEvent(a.BOOKING_EVENTS.WHATSAPP_CONTACT_CLICKED, { placement: "floating_button", service_slug: "masaje_relajante_navas_de_rio_frio_segovia" });

  it("sin decisión de cookies no envía nada", async () => {
    setConsent(null);
    click(await loadAnalytics());
    expect(dataLayer).toHaveLength(0);
    expect(gtagCalls).toHaveLength(0);
  });

  it("con cookies rechazadas no envía nada", async () => {
    setConsent({ analytics: false, ads: false });
    click(await loadAnalytics());
    expect(dataLayer).toHaveLength(0);
    expect(gtagCalls).toHaveLength(0);
  });

  it("solo analítica: un evento a GA4 y ninguna conversión de Ads", async () => {
    setConsent({ analytics: true, ads: false });
    click(await loadAnalytics());
    expect(ga4Events()).toEqual([["event", "whatsapp_contact_clicked", { placement: "floating_button", service_slug: "masaje_relajante_navas_de_rio_frio_segovia" }]]);
    expect(adsConversions()).toEqual([]);
  });

  it("solo publicidad: una conversión de WhatsApp en Ads y nada a GA4", async () => {
    setConsent({ analytics: false, ads: true });
    click(await loadAnalytics());
    expect(ga4Events()).toEqual([]);
    expect(adsConversions()).toEqual([`${ADS_ID}/${WHATSAPP_LABEL}`]);
  });

  it("ambos: exactamente un evento GA4 y una conversión, nunca la de reserva", async () => {
    setConsent({ analytics: true, ads: true });
    click(await loadAnalytics());
    expect(ga4Events()).toHaveLength(1);
    expect(adsConversions()).toEqual([`${ADS_ID}/${WHATSAPP_LABEL}`]);
    expect(adsConversions()).not.toContain(`${ADS_ID}/${BOOKING_LABEL}`);
    expect(dataLayer).toHaveLength(1);
  });

  it("sin etiqueta de WhatsApp configurada no envía conversión a Ads", async () => {
    setConsent({ analytics: true, ads: true });
    click(await loadAnalytics({ VITE_GOOGLE_ADS_WHATSAPP_LABEL: "" }));
    expect(adsConversions()).toEqual([]);
    expect(ga4Events()).toHaveLength(1);
  });

  it("no envía datos personales aunque se los pasen", async () => {
    setConsent({ analytics: true, ads: true });
    const a = await loadAnalytics();
    a.trackBookingEvent(a.BOOKING_EVENTS.WHATSAPP_CONTACT_CLICKED, { placement: "floating_button", phone: "600111222", email: "ana@example.com" } as never);
    expect(ga4Events()[0][2]).toEqual({ placement: "floating_button" });
  });
});

describe("la solicitud de reserva sigue separada", () => {
  it("la solicitud enviada usa la etiqueta de reserva, no la de WhatsApp", async () => {
    setConsent({ analytics: true, ads: true });
    const a = await loadAnalytics();
    a.trackBookingEvent(a.BOOKING_EVENTS.REQUEST_SUBMITTED, { service_slug: "masaje_relajante_navas_de_rio_frio_segovia" });
    expect(adsConversions()).toEqual([`${ADS_ID}/${BOOKING_LABEL}`]);
  });

  it("el botón de WhatsApp del formulario cuenta como WhatsApp, no como reserva", async () => {
    setConsent({ analytics: true, ads: true });
    const a = await loadAnalytics();
    a.trackBookingEvent(a.BOOKING_EVENTS.WHATSAPP_CLICKED, { placement: "booking_modal" });
    expect(adsConversions()).toEqual([`${ADS_ID}/${WHATSAPP_LABEL}`]);
  });
});
