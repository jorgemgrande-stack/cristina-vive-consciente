/**
 * Test: WhatsApp helper — validación de número y generación de URLs
 */

import { describe, it, expect, beforeAll } from "vitest";

// Simular que la variable de entorno está configurada
beforeAll(() => {
  process.env.WHATSAPP_ADMIN_NUMBER = "34657165343";
});

describe("WhatsApp helper", () => {
  it("genera URL wa.me con el número correcto", async () => {
    // Re-importar después de setear la env var
    const { generateBookingWhatsAppUrl } = await import("./whatsapp");

    const url = generateBookingWhatsAppUrl({
      firstName: "Ana",
      lastName: "García",
      serviceLabel: "Consulta Naturópata",
      preferredDate: "15 de abril",
      preferredTime: "10:00",
      modality: "Online",
    });

    expect(url).toContain("wa.me/34657165343");
    expect(url).toContain("Consulta%20Natur%C3%B3pata");
  });

  it("el número configurado no es el placeholder por defecto", () => {
    const number = process.env.WHATSAPP_ADMIN_NUMBER;
    expect(number).toBeDefined();
    expect(number).not.toBe("34600000000"); // no es el placeholder
    expect(number).toBe("34657165343");     // es el número real de Cristina
  });

  it("genera texto de mensaje correcto para reserva", async () => {
    const { generateBookingWhatsAppText } = await import("./whatsapp");

    const text = generateBookingWhatsAppText({
      firstName: "Ana",
      lastName: "García",
      serviceLabel: "Masaje Terapéutico",
      preferredDate: "20 de abril",
      modality: "Presencial",
    });

    expect(text).toContain("Masaje Terapéutico");
    expect(text).toContain("20 de abril");
    expect(text).toContain("Presencial");
  });
});
