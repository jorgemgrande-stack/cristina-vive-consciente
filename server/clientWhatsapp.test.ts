/**
 * Aviso de cita confirmada al CLIENTE por WhatsApp Business (plantilla): se activa solo con las variables configuradas.
 * Sin red: se simula fetch.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn(async () => null) }));
import { isClientWhatsAppConfigured, sendClientConfirmationWhatsApp } from "./whatsapp";

const KEYS = ["WHATSAPP_API_TOKEN", "WHATSAPP_PHONE_ID", "WHATSAPP_TEMPLATE_CONFIRMED", "WHATSAPP_TEMPLATE_LANG"] as const;
const saved: Record<string, string | undefined> = {};
const opts = { phone: "+34 693 026 894", firstName: "Jorge Grande", serviceLabel: "Masaje Relajante — 45 min", scheduledAt: Date.UTC(2026, 9, 3, 12, 0) };

beforeEach(() => {
  KEYS.forEach((k) => { saved[k] = process.env[k]; delete process.env[k]; });
});
afterEach(() => {
  KEYS.forEach((k) => { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; });
  vi.unstubAllGlobals();
});

describe("WhatsApp Business al cliente", () => {
  it("sin configurar no envía nada ni llama a la red", async () => {
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    expect(isClientWhatsAppConfigured()).toBe(false);
    expect(await sendClientConfirmationWhatsApp(opts)).toMatchObject({ sent: false });
    expect(f).not.toHaveBeenCalled();
  });

  it("configurado: envía la plantilla con las 5 variables, al número normalizado y sin exponer el token en el cuerpo", async () => {
    process.env.WHATSAPP_API_TOKEN = "TOKEN-SECRETO";
    process.env.WHATSAPP_PHONE_ID = "12345";
    process.env.WHATSAPP_TEMPLATE_CONFIRMED = "cita_confirmada";
    const f = vi.fn(async () => ({ ok: true, text: async () => "" }));
    vi.stubGlobal("fetch", f);
    expect(await sendClientConfirmationWhatsApp(opts)).toEqual({ sent: true, note: "Enviado por WhatsApp Business API" });
    const [url, init] = f.mock.calls[0] as unknown as [string, any];
    expect(url).toBe("https://graph.facebook.com/v21.0/12345/messages");
    expect(init.headers.Authorization).toBe("Bearer TOKEN-SECRETO");
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({ messaging_product: "whatsapp", to: "34693026894", type: "template" });
    expect(body.template).toMatchObject({ name: "cita_confirmada", language: { code: "es" } });
    const vars = body.template.components[0].parameters.map((p: any) => p.text);
    expect(vars).toHaveLength(5);
    expect(vars[0]).toBe("Jorge");
    expect(vars[1]).toBe("Masaje Relajante — 45 min");
    expect(vars[3]).toBe("14:00");
    expect(JSON.stringify(body)).not.toContain("TOKEN-SECRETO");
  });

  it("si la API responde con error, lanza (queda como «fallida» en el historial de la cita)", async () => {
    process.env.WHATSAPP_API_TOKEN = "t";
    process.env.WHATSAPP_PHONE_ID = "1";
    process.env.WHATSAPP_TEMPLATE_CONFIRMED = "p";
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 400, text: async () => "template not approved" })));
    await expect(sendClientConfirmationWhatsApp(opts)).rejects.toThrow(/400/);
  });

  it("un teléfono no válido no llega a la API", async () => {
    process.env.WHATSAPP_API_TOKEN = "t";
    process.env.WHATSAPP_PHONE_ID = "1";
    process.env.WHATSAPP_TEMPLATE_CONFIRMED = "p";
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    await expect(sendClientConfirmationWhatsApp({ ...opts, phone: "abc" })).rejects.toThrow(/no válido/i);
    expect(f).not.toHaveBeenCalled();
  });
});
