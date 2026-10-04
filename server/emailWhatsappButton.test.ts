import { describe, it, expect } from "vitest";
import { immediateConfirmationWhatsAppUrl } from "../shared/booking";

describe("botón de confirmación inmediata por WhatsApp (email al cliente)", () => {
  const base = { firstName: "Ana García", serviceLabel: "Masaje Relajante", date: "2026-10-20", time: "11:30" };

  it("apunta al WhatsApp de Cristina con el mensaje codificado", () => {
    const url = immediateConfirmationWhatsAppUrl(base);
    expect(url.startsWith("https://wa.me/34657165343?text=")).toBe(true);
    const t = decodeURIComponent(url.split("?text=")[1]);
    expect(t).toContain("soy Ana.");
    expect(t).toContain("Masaje Relajante");
    expect(t).toMatch(/martes,? 20 de octubre \(11:30\)/i);
    expect(t).toContain("confirmación inmediata");
    expect(t).not.toContain("García");
  });

  it("sin hora ni nombre no rompe", () => {
    const t = decodeURIComponent(immediateConfirmationWhatsAppUrl({ ...base, firstName: " ", time: undefined }).split("?text=")[1]);
    expect(t).toContain("soy un cliente");
    expect(t).not.toContain("()");
  });
});
