import { describe, it, expect } from "vitest";
import { normalizePhone, isValidPhone, whatsappNumber, formatPhoneDisplay } from "../shared/phone";
import { confirmationWhatsAppText, confirmationMessageParts } from "../shared/booking";

describe("teléfonos de contacto", () => {
  it("normaliza a +34… los móviles y fijos españoles escritos de cualquier forma", () => {
    for (const raw of ["693026894", "693 02 68 94", "+34693026894", "+34 693 026 894", "0034 693-026-894", "(693) 026.894", "34693026894"])
      expect(normalizePhone(raw), raw).toBe("+34693026894");
    expect(normalizePhone("910123456")).toBe("+34910123456");
  });
  it("acepta números internacionales con prefijo", () => {
    expect(normalizePhone("+44 7911 123456")).toBe("+447911123456");
    expect(normalizePhone("0033 6 12 34 56 78")).toBe("+33612345678");
  });
  it("rechaza lo que no es un teléfono", () => {
    for (const bad of ["", "   ", "abc", "123", "12345678901234567", "123456789", "+34 6930", "69302689", "hola 693026894", null, undefined])
      expect(isValidPhone(bad as any), String(bad)).toBe(false);
  });
  it("whatsappNumber da solo cifras con prefijo; formatPhoneDisplay agrupa los españoles", () => {
    expect(whatsappNumber("693 026 894")).toBe("34693026894");
    expect(whatsappNumber("x")).toBeNull();
    expect(formatPhoneDisplay("+34693026894")).toBe("+34 693 02 68 94");
  });
});

describe("mensaje de cita confirmada por WhatsApp", () => {
  const at = Date.UTC(2026, 9, 3, 12, 0); // 14:00 en Madrid (CEST)
  it("en consulta: nombre, servicio, día, hora y lugar", () => {
    const t = confirmationWhatsAppText({ firstName: "Jorge Grande", serviceLabel: "Masaje Relajante — 45 min", scheduledAt: at });
    expect(t).toContain("Hola Jorge,");
    expect(t).toContain("Masaje Relajante — 45 min");
    expect(t).toMatch(/sábado,? 3 de octubre/i);
    expect(t).toContain("14:00");
    expect(t).toContain("Navas de Riofrío (Segovia)");
  });
  it("a domicilio: lo dice y no menciona la consulta", () => {
    const p = confirmationMessageParts({ firstName: "Ana", serviceLabel: "Masaje Relajante — 45 min · a domicilio", scheduledAt: at });
    expect(p.place).toBe("en tu domicilio");
    expect(p.service).toBe("Masaje Relajante — 45 min");
  });
});
