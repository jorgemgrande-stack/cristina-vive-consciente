/**
 * Aviso de nueva cita a Cristina por WhatsApp con CallMeBot (sin API de Meta).
 * Sin red ni BD: se simulan fetch y ./db.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn(async () => null) }));

const DATA = {
  firstName: "Ana",
  lastName: "García",
  phone: "+34600111222",
  email: "ana@example.com",
  serviceLabel: "Masaje Relajante — 45 min · a domicilio",
  preferredDate: "2026-10-08",
  preferredTime: "10:00",
  modality: "presencial",
  notes: "A domicilio — Calle Mayor 5, 40100 Segovia · tengo la espalda cargada",
  actionUrl: "https://cristinaviveconsciente.es/a/123.456.firma",
};

const okResponse = () => new Response("<html>Message queued. You will receive it in a few seconds</html>", { status: 200 });

let fetchMock: ReturnType<typeof vi.fn>;
const env = { ...process.env };

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

const load = () => import("./whatsapp");

describe("CallMeBot — aviso de nueva cita a Cristina", () => {
  it("envía el WhatsApp al número de Cristina con la clave, por la API de CallMeBot", async () => {
    const { notifyAdminNewBooking } = await load();
    const res = await notifyAdminNewBooking(DATA);
    expect(res.sent).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = new URL(fetchMock.mock.calls[0][0] as string);
    expect(url.origin + url.pathname).toBe("https://api.callmebot.com/whatsapp.php");
    expect(url.searchParams.get("phone")).toBe("34657165343");
    expect(url.searchParams.get("apikey")).toBe("clave-de-prueba-123");
  });

  it("el texto lleva solo servicio, día y hora y el enlace general al CRM", async () => {
    const { notifyAdminNewBooking } = await load();
    await notifyAdminNewBooking(DATA);
    const text = new URL(fetchMock.mock.calls[0][0] as string).searchParams.get("text")!;
    expect(text).toContain("Nueva solicitud de cita");
    expect(text).toContain("Masaje Relajante — 45 min · a domicilio");
    expect(text).toMatch(/jueves 8 de octubre, 10:00/);
    expect(text).toContain("https://cristinaviveconsciente.es/crm/citas");
  });

  it("NO envía a un tercero nombre, teléfono, email, dirección, notas ni el enlace firmado", async () => {
    const { notifyAdminNewBooking } = await load();
    await notifyAdminNewBooking(DATA);
    const text = new URL(fetchMock.mock.calls[0][0] as string).searchParams.get("text")!;
    for (const secreto of ["Ana", "García", "600111222", "example.com", "Calle Mayor", "espalda", "/a/123.456.firma"]) {
      expect(text).not.toContain(secreto);
    }
  });

  it("si CallMeBot responde con error (aunque sea HTTP 200), lanza para que el historial lo marque «fallida»", async () => {
    fetchMock.mockResolvedValueOnce(new Response("ERROR: apikey is invalid", { status: 200 }));
    const { notifyAdminNewBooking } = await load();
    await expect(notifyAdminNewBooking(DATA)).rejects.toThrow(/rechaz/i);
    fetchMock.mockResolvedValueOnce(new Response("down", { status: 503 }));
    await expect(notifyAdminNewBooking(DATA)).rejects.toThrow(/503/);
  });

  it("si no hay red, falla sin filtrar la clave en el mensaje de error", async () => {
    fetchMock.mockRejectedValueOnce(new Error("getaddrinfo ENOTFOUND https://api.callmebot.com/whatsapp.php?phone=34657165343&apikey=clave-de-prueba-123"));
    const { notifyAdminNewBooking } = await load();
    const err = await notifyAdminNewBooking(DATA).catch((e) => e as Error);
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).not.toContain("clave-de-prueba-123");
  });

  it("sin CALLMEBOT_APIKEY no se llama a CallMeBot (queda el enlace wa.me de siempre)", async () => {
    delete process.env.CALLMEBOT_APIKEY;
    const { notifyAdminNewBooking, isCallMeBotConfigured } = await load();
    expect(isCallMeBotConfigured()).toBe(false);
    const res = await notifyAdminNewBooking(DATA);
    expect(res.sent).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("solo avisa de citas: los avisos de lead y compra no pasan por CallMeBot", async () => {
    const { notifyAdminNewLead, notifyAdminNewPurchase } = await load();
    await notifyAdminNewLead({ firstName: "Luis", email: "luis@example.com", message: "hola" });
    await notifyAdminNewPurchase({ firstName: "Eva", email: "eva@example.com", productName: "Guía", amount: "12" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("describe una franja antigua o fecha rara sin romperse", async () => {
    const { generateCallMeBotBookingText } = await load();
    expect(generateCallMeBotBookingText({ serviceLabel: "X", preferredDate: "2026-10-10", preferredTime: "Mañana (10:00 – 13:00)" })).toContain("sábado 10 de octubre");
    expect(generateCallMeBotBookingText({ serviceLabel: "X", preferredDate: "pronto" })).toContain("pronto");
  });
});
