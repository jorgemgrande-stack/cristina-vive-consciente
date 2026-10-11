/**
 * Pedidos de guías por Bizum: referencia, importes y aviso a Cristina por CallMeBot.
 * Sin red ni BD: se simulan fetch y ./db.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  BIZUM_PHONE,
  BIZUM_PHONE_DISPLAY,
  bizumAmount,
  formatEuros,
  generateOrderReference,
  isValidOrderReference,
} from "../shared/orders";

vi.mock("./db", () => ({ getDb: vi.fn(async () => null) }));

describe("shared/orders", () => {
  it("el Bizum va al mismo número que el WhatsApp de Cristina", () => {
    expect(BIZUM_PHONE).toBe("+34657165343");
    expect(BIZUM_PHONE_DISPLAY).toBe("+34 657 16 53 43");
  });

  it("genera referencias válidas y distintas", () => {
    const refs = new Set(Array.from({ length: 200 }, () => generateOrderReference()));
    expect(refs.size).toBeGreaterThan(190);
    for (const r of refs) expect(isValidOrderReference(r)).toBe(true);
  });

  it("referencia determinista con un generador fijo y sin caracteres ambiguos", () => {
    expect(generateOrderReference(() => 0)).toBe("GUIA-AAAAAA");
    expect(isValidOrderReference("GUIA-0OIL1A")).toBe(false);
    expect(isValidOrderReference("guia-abcdef")).toBe(false);
    expect(isValidOrderReference("GUIA-ABC")).toBe(false);
    expect(isValidOrderReference("GUIA-ABCDEF'; DROP")).toBe(false);
  });

  it("formatea importes", () => {
    expect(formatEuros(1200)).toBe("12 €");
    expect(formatEuros(750)).toBe("7,50 €");
    expect(bizumAmount(700)).toBe("7.00");
    expect(bizumAmount(1250)).toBe("12.50");
  });
});

describe("aviso de pedido por CallMeBot", () => {
  const okResponse = () => new Response("<html>Message queued.</html>", { status: 200 });
  let fetchMock: ReturnType<typeof vi.fn>;
  const env = { ...process.env };
  const ORDER = { reference: "GUIA-K7P3Q9", productTitle: "Guía del Agua Estructurada", amount: "12 €" };

  beforeEach(() => {
    fetchMock = vi.fn(async () => okResponse());
    vi.stubGlobal("fetch", fetchMock);
    delete process.env.WHATSAPP_API_TOKEN;
    delete process.env.WHATSAPP_PHONE_ID;
    delete process.env.WHATSAPP_ADMIN_NUMBER;
    process.env.CALLMEBOT_APIKEY = "clave-de-prueba-123";
    vi.resetModules();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = { ...env };
  });

  it("el texto lleva producto, importe y referencia, pero ningún dato del cliente", async () => {
    const { generateCallMeBotOrderText } = await import("./whatsapp");
    const t = generateCallMeBotOrderText(ORDER);
    expect(t).toContain("GUIA-K7P3Q9");
    expect(t).toContain("12 €");
    expect(t).toContain("/crm/pedidos");
    expect(generateCallMeBotOrderText(ORDER, "claimed")).toContain("ya hizo el Bizum");
  });

  it("envía a Cristina (34657165343) con CallMeBot", async () => {
    const { notifyAdminNewOrder } = await import("./whatsapp");
    const r = await notifyAdminNewOrder(ORDER);
    expect(r.sent).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain("phone=34657165343");
    expect(decodeURIComponent(url)).toContain("GUIA-K7P3Q9");
  });

  it("si CallMeBot rechaza el aviso, lanza (el llamador lo registra) y no filtra la apikey", async () => {
    fetchMock.mockResolvedValueOnce(new Response("ERROR: apikey is invalid", { status: 200 }));
    const { notifyAdminNewOrder } = await import("./whatsapp");
    await expect(notifyAdminNewOrder(ORDER)).rejects.toThrow(/rechaz/i);
    await notifyAdminNewOrder(ORDER).catch(() => {});
    const errs: string[] = [];
    fetchMock.mockResolvedValueOnce(new Response("ERROR: x", { status: 200 }));
    await notifyAdminNewOrder(ORDER).catch((e) => errs.push(String(e.message)));
    expect(errs.join("")).not.toContain("clave-de-prueba-123");
  });
});
