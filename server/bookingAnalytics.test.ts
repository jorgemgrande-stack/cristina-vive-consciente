import { describe, it, expect } from "vitest";
import {
  BOOKING_EVENTS,
  CLIENT_EMITTABLE_EVENTS,
  WHATSAPP_CLICK_EVENTS,
  mayEmit,
  sanitizeBookingEventParams,
} from "../shared/bookingAnalytics";

describe("analítica de reservas", () => {
  it("distingue solicitud enviada de reserva confirmada y de pagada", () => {
    expect(BOOKING_EVENTS.REQUEST_SUBMITTED).toBe("booking_request_submitted");
    expect(BOOKING_EVENTS.CONFIRMED).toBe("booking_confirmed");
    expect(BOOKING_EVENTS.PAID).toBe("booking_paid");
    expect(new Set(Object.values(BOOKING_EVENTS)).size).toBe(6); // todos distintos (incluye los clics a WhatsApp, señales secundarias)
  });

  it("el navegador no puede emitir confirmed/paid (ocurren después, en el admin)", () => {
    expect(CLIENT_EMITTABLE_EVENTS).toContain(BOOKING_EVENTS.REQUEST_SUBMITTED);
    expect(CLIENT_EMITTABLE_EVENTS).not.toContain(BOOKING_EVENTS.CONFIRMED);
    expect(CLIENT_EMITTABLE_EVENTS).not.toContain(BOOKING_EVENTS.PAID);
  });

  it("solo pasan parámetros de la lista blanca (sin PII, sin texto libre)", () => {
    const out = sanitizeBookingEventParams({
      service_slug: "masaje_relajante_navas_de_rio_frio_segovia",
      service_group: "masaje",
      modality: "presencial",
      email: "ana@example.com",
      firstName: "Ana",
      phone: "600111222",
      message: "tengo dolor de espalda",
    });
    expect(out).toEqual({
      service_slug: "masaje_relajante_navas_de_rio_frio_segovia",
      service_group: "masaje",
      modality: "presencial",
    });
  });

  it("descarta valores con espacios, arrobas o texto largo aunque la clave sea válida", () => {
    expect(sanitizeBookingEventParams({ service_slug: "ana@example.com" })).toEqual({});
    expect(sanitizeBookingEventParams({ service_slug: "dolor de espalda" })).toEqual({});
    expect(sanitizeBookingEventParams({ service_slug: "a".repeat(200) })).toEqual({});
    expect(sanitizeBookingEventParams({ modality: 123 as unknown as string })).toEqual({});
  });

  it("sin consentimiento no se emite nada", () => {
    expect(mayEmit(null)).toBe(false);
    expect(mayEmit({ analytics: false, ads: false })).toBe(false);
    expect(mayEmit({ analytics: true, ads: false })).toBe(true);
    expect(mayEmit({ analytics: false, ads: true })).toBe(true);
  });
});

describe("clics a WhatsApp (señal secundaria)", () => {
  it("el globo y el botón del formulario son eventos de WhatsApp, nunca la solicitud de reserva", () => {
    expect(WHATSAPP_CLICK_EVENTS).toEqual([BOOKING_EVENTS.WHATSAPP_CLICKED, BOOKING_EVENTS.WHATSAPP_CONTACT_CLICKED]);
    expect(WHATSAPP_CLICK_EVENTS).not.toContain(BOOKING_EVENTS.REQUEST_SUBMITTED);
    expect(CLIENT_EMITTABLE_EVENTS).toContain(BOOKING_EVENTS.WHATSAPP_CONTACT_CLICKED);
  });

  it("admite `placement` con valores simples y descarta texto libre", () => {
    expect(sanitizeBookingEventParams({ placement: "floating_button" })).toEqual({ placement: "floating_button" });
    expect(sanitizeBookingEventParams({ placement: "globo de la home" })).toEqual({});
  });
});
