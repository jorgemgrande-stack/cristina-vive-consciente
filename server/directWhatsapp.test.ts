import { describe, it, expect } from "vitest";
import { directWhatsAppReservationText, directWhatsAppReservationUrl, CRISTINA_WHATSAPP_NUMBER } from "../shared/booking";
import { BOOKING_EVENTS, CLIENT_EMITTABLE_EVENTS } from "../shared/bookingAnalytics";

describe("reserva directa por WhatsApp", () => {
  const base = { firstName: "Ana García", serviceLabel: "Masaje Terapéutico 90 min", durationLabel: "90 min", date: "2026-10-20", time: "11:30" };

  it("el mensaje incluye servicio, día, hora y lugar, y saluda con el primer nombre", () => {
    const t = directWhatsAppReservationText(base);
    expect(t).toContain("soy Ana.");
    expect(t).toContain("Masaje Terapéutico 90 min");
    expect(t).toMatch(/martes,? 20 de octubre/i);
    expect(t).toContain("a las 11:30");
    expect(t).toContain("Navas de Riofrío (Segovia)");
    expect(t).not.toContain("García"); // solo el nombre, no los apellidos
  });

  it("no repite la duración si el nombre del servicio ya la lleva; la añade si no", () => {
    expect(directWhatsAppReservationText(base)).not.toContain("(90 min)");
    expect(directWhatsAppReservationText({ ...base, serviceLabel: "Masaje Relajante", durationLabel: "45 min" })).toContain("Masaje Relajante (45 min)");
  });

  it("a domicilio lo dice y no menciona la consulta", () => {
    const t = directWhatsAppReservationText({ ...base, atHome: true });
    expect(t).toContain("a domicilio");
    expect(t).not.toContain("Navas de Riofrío");
  });

  it("el enlace va al WhatsApp de Cristina con el texto codificado, sin datos de contacto del cliente", () => {
    const url = directWhatsAppReservationUrl(base);
    expect(url.startsWith(`https://wa.me/${CRISTINA_WHATSAPP_NUMBER}?text=`)).toBe(true);
    const decoded = decodeURIComponent(url.split("?text=")[1]);
    expect(decoded).toBe(directWhatsAppReservationText(base));
    expect(decoded).not.toMatch(/@|\+34\d/); // ni email ni teléfono del cliente
  });

  it("sin nombre o con fecha rara no rompe", () => {
    expect(directWhatsAppReservationText({ ...base, firstName: "  " })).toContain("soy un cliente");
    expect(directWhatsAppReservationText({ ...base, date: "pronto", time: undefined })).toContain("el pronto,");
  });

  it("el clic es una señal secundaria: se puede emitir, pero no es la conversión de Google Ads", () => {
    expect(BOOKING_EVENTS.WHATSAPP_CLICKED).toBe("booking_whatsapp_clicked");
    expect(CLIENT_EMITTABLE_EVENTS).toContain(BOOKING_EVENTS.WHATSAPP_CLICKED);
    expect(BOOKING_EVENTS.WHATSAPP_CLICKED).not.toBe(BOOKING_EVENTS.REQUEST_SUBMITTED);
  });
});
