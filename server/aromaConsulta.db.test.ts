/**
 * Consulta de aromaterapia de punta a punta contra MySQL de pruebas: se da de alta con las reglas de CRM → Servicios,
 * aparece en el listado público, la solicitud online queda como cita con su nombre, duración y precio, y se rechaza la
 * presencial. Sin avisos reales. Solo corre con SITE_TEST_DATABASE_URL.
 */
import { describe, expect, it, vi } from "vitest";
import { AROMA_SERVICE, AROMA_SERVICE_SLUG } from "../shared/aromaService";
import { allowsInPerson } from "../shared/booking";

const sent = vi.hoisted(() => ({ admin: [] as any[] }));
vi.mock("./email", async (orig) => ({
  ...(await orig<Record<string, unknown>>()),
  isEmailConfigured: () => true,
  isAdminEmailConfigured: () => true,
  sendClientConfirmationEmail: vi.fn(async () => undefined),
  sendAdminNotificationEmail: vi.fn(async (d: any) => { sent.admin.push(d); }),
}));
vi.mock("./whatsapp", async (orig) => ({ ...(await orig<Record<string, unknown>>()), notifyAdminNewBooking: vi.fn(async () => undefined) }));
vi.mock("./_core/notification", () => ({ notifyOwner: vi.fn(async () => true) }));

const URL = process.env.SITE_TEST_DATABASE_URL;
const d = describe.runIf(!!URL && /(_test|test_)/.test(URL ?? ""));

it("solo los servicios online excluyen la modalidad presencial", () => {
  expect(allowsInPerson({ modality: "online" })).toBe(false);
  expect(allowsInPerson({ modality: "ambos" })).toBe(true);
  expect(allowsInPerson(undefined)).toBe(true);
});

d("Consulta de aromaterapia: alta → listado → solicitud de cita", () => {
  it("usa el circuito habitual y la cita queda asociada al servicio", async () => {
    process.env.DATABASE_URL = URL;
    const { servicesRouter } = await import("./routers/services");
    const { bookingsRouter } = await import("./routers/bookings");
    const dbm = await import("./db");
    const schema = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const conn = (await dbm.getDb())!;
    const slug = `${AROMA_SERVICE_SLUG}_${Date.now()}`;
    const email = `${slug}@mail.test`;
    const admin = servicesRouter.createCaller({ user: { id: 1, role: "admin" }, req: {}, res: {} } as any);
    const pub = servicesRouter.createCaller({ user: null, req: { headers: {} }, res: {} } as any);
    const book = bookingsRouter.createCaller({ user: null, req: { headers: {}, ip: "10.3.0.1" }, res: {} } as any);
    const { id } = await admin.create({ ...AROMA_SERVICE, slug });
    try {
      const listed = (await pub.list({ type: "consulta" })).find((s) => s.slug === slug)!;
      expect(listed).toMatchObject({ name: AROMA_SERVICE.name, price: "90.00", modality: "online", durationMinutes: 60 });
      expect((await pub.getBySlug({ slug }))!.id).toBe(id);

      const date = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
      const input = { firstName: "Ana", lastName: "Pérez", email, phone: "600123456", serviceType: slug, preferredDate: date, preferredTime: "11:00" };
      await expect(book.request({ ...input, modality: "presencial" })).rejects.toThrow(/online/);

      expect(await book.request({ ...input, modality: "zoom" })).toMatchObject({ status: "pending" });
      const [client] = await conn.select().from(schema.clients).where(eq(schema.clients.email, email));
      const rows = await conn.select().from(schema.appointments).where(eq(schema.appointments.clientId, client.id));
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ serviceType: "otro", modality: "zoom", status: "pending", price: "90.00", durationMinutes: 60 });
      expect(rows[0].serviceLabel).toContain(AROMA_SERVICE.name);
      const events = await conn.select().from(schema.appointmentEvents).where(eq(schema.appointmentEvents.appointmentId, rows[0].id));
      expect(events.some((e) => e.detail?.includes(`Solicitud web: ${slug}`))).toBe(true);
      await vi.waitFor(() => expect(sent.admin[0]?.serviceLabel).toContain(AROMA_SERVICE.name));

      // Si Cristina cambia el precio en el CRM, es el que ve la web
      await admin.update({ id, data: { ...AROMA_SERVICE, slug, price: "95.00" } });
      expect((await pub.list({ type: "consulta" })).find((s) => s.slug === slug)!.price).toBe("95.00");
    } finally {
      const [client] = await conn.select().from(schema.clients).where(eq(schema.clients.email, email));
      if (client) {
        for (const a of await conn.select().from(schema.appointments).where(eq(schema.appointments.clientId, client.id))) {
          await conn.delete(schema.appointmentEvents).where(eq(schema.appointmentEvents.appointmentId, a.id));
        }
        await conn.delete(schema.appointments).where(eq(schema.appointments.clientId, client.id));
        await conn.delete(schema.clients).where(eq(schema.clients.id, client.id));
      }
      await conn.delete(schema.services).where(eq(schema.services.id, id));
    }
  }, 30000);
});
