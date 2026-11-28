/**
 * «Guía básica de aceites esenciales» de punta a punta contra MySQL de pruebas: en borrador no se vende; activa, el precio
 * mostrado es el que se cobra; pendiente o cancelado no descarga; confirmar dos veces no duplica la entrega.
 * Solo corre con SITE_TEST_DATABASE_URL.
 */
import { describe, expect, it, vi } from "vitest";

const sent = vi.hoisted(() => ({ delivery: [] as any[] }));
vi.mock("./email", () => ({
  sendOrderReceivedEmail: vi.fn(async () => undefined),
  sendOrderAdminEmail: vi.fn(async () => undefined),
  sendEbookDeliveryEmail: vi.fn(async (d: any) => { sent.delivery.push(d); }),
  sendPrintedStoryConfirmation: vi.fn(async () => undefined),
}));
vi.mock("./whatsapp", () => ({ notifyAdminNewOrder: vi.fn(async () => undefined), notifyAdminNewPurchase: vi.fn(async () => undefined) }));

const URL = process.env.SITE_TEST_DATABASE_URL;
const d = describe.runIf(!!URL && /(_test|test_)/.test(URL ?? ""));

d("Guía básica de aceites: borrador → venta → descarga", () => {
  it("no se vende sin publicar y solo el pago confirmado habilita el PDF, una vez", async () => {
    process.env.DATABASE_URL = URL;
    const { ordersRouter, findPaidOrderByDownloadToken } = await import("./routers/orders");
    const { ebooksRouter } = await import("./routers/ebooks");
    const dbm = await import("./db");
    const schema = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const conn = (await dbm.getDb())!;
    const tag = `acg${Date.now()}`;
    const slug = `guia-${tag}`;
    const email = (n: string) => `${n}.${tag}@mail.test`;
    const ctx = { user: null, req: { headers: {}, ip: `10.2.0.${Math.floor(Math.random() * 200)}` }, res: {} } as any;
    const pub = ordersRouter.createCaller(ctx);
    const site = ebooksRouter.createCaller(ctx);
    const admin = ordersRouter.createCaller({ user: { id: 1, role: "admin" }, req: {}, res: {} } as any);
    const [ins] = (await conn.insert(schema.ebooks).values({ slug, title: "Guía básica de aceites esenciales", price: "14.90", priceCents: 1490, status: "inactive" } as any)) as any;
    const row = async (ref: string) => (await conn.select().from(schema.orders).where(eq(schema.orders.reference, ref)))[0];
    try {
      // Borrador sin PDF: se ve el precio, no se puede comprar
      expect(await site.resources({ slugs: [slug] })).toMatchObject([{ priceCents: 1490, available: false }]);
      await expect(pub.create({ productSlug: slug, name: "Ana Pérez", email: email("a") })).rejects.toThrow("no está disponible");
      // Activo pero todavía sin PDF: el bloque sigue sin ofrecer la compra
      await conn.update(schema.ebooks).set({ status: "active" }).where(eq(schema.ebooks.id, ins.insertId));
      expect((await site.resources({ slugs: [slug] }))[0].available).toBe(false);

      await conn.update(schema.ebooks).set({ pdfUrl: "/uploads/prueba.pdf" }).where(eq(schema.ebooks.id, ins.insertId));
      const [shown] = await site.resources({ slugs: [slug] });
      expect(shown.available).toBe(true);
      const order = await pub.create({ productSlug: slug, name: "Ana Pérez", email: email("a") });
      expect(order.amountCents).toBe(shown.priceCents); // se cobra lo que se muestra
      expect((await pub.create({ productSlug: slug, name: "Ana Pérez", email: email("a") })).reference).toBe(order.reference);

      // Pendiente: sin token de descarga
      let o = await row(order.reference);
      expect([o.status, o.downloadToken]).toEqual(["pending", null]);
      expect(sent.delivery).toHaveLength(0);

      expect(await admin.confirmPayment({ id: o.id })).toMatchObject({ alreadyPaid: false, emailSent: true });
      expect((await admin.confirmPayment({ id: o.id })).alreadyPaid).toBe(true);
      expect(sent.delivery).toHaveLength(1);
      o = await row(order.reference);
      expect(o.downloadToken).toBeTruthy();
      expect(await findPaidOrderByDownloadToken(o.downloadToken!)).toBeTruthy();
      expect(await findPaidOrderByDownloadToken("token-inventado")).toBeNull();

      // Pedido cancelado (pago fallido): nunca habilita el PDF
      const other = await pub.create({ productSlug: slug, name: "Luis Gil", email: email("b") });
      const c = await row(other.reference);
      await admin.cancel({ id: c.id });
      expect((await row(other.reference)).downloadToken).toBeNull();
      expect(sent.delivery).toHaveLength(1);
    } finally {
      for (const n of ["a", "b"]) await conn.delete(schema.orders).where(eq(schema.orders.customerEmail, email(n)));
      await conn.delete(schema.ebooks).where(eq(schema.ebooks.id, ins.insertId));
    }
  }, 30000);
});
