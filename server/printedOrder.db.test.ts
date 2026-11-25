/**
 * Reserva de la edición impresa de punta a punta contra MySQL de pruebas (con la migración 0036):
 * oferta con el slug de la BD («_»), pedido con dirección y desglose, reintento sin duplicar, confirmación manual
 * (sin enlace al PDF), pendiente de envío y bloqueo del envío antes del 15 de diciembre de 2026.
 * Solo corre con SITE_TEST_DATABASE_URL.
 */
import { describe, expect, it, vi } from "vitest";

const sent = vi.hoisted(() => ({ received: [] as any[], printed: [] as any[], delivery: [] as any[] }));
vi.mock("./email", () => ({
  sendOrderReceivedEmail: vi.fn(async (d: any) => { sent.received.push(d); }),
  sendOrderAdminEmail: vi.fn(async () => undefined),
  sendEbookDeliveryEmail: vi.fn(async (d: any) => { sent.delivery.push(d); }),
  sendPrintedStoryConfirmation: vi.fn(async (d: any) => { sent.printed.push(d); }),
}));
vi.mock("./whatsapp", () => ({ notifyAdminNewOrder: vi.fn(async () => undefined) }));

const URL = process.env.SITE_TEST_DATABASE_URL;
const d = describe.runIf(!!URL && /(_test|test_)/.test(URL ?? ""));

d("Reserva impresa: crear → reintentar → confirmar", () => {
  it("guarda la dirección, no duplica, confirma sin PDF y deja el envío pendiente", async () => {
    process.env.DATABASE_URL = URL;
    process.env.PRINTED_STORY_SHIPPING_CENTS = "450";
    const { ordersRouter, findPaidOrderByDownloadToken } = await import("./routers/orders");
    const dbm = await import("./db");
    const schema = await import("../drizzle/schema");
    const { eq, like } = await import("drizzle-orm");
    const conn = (await dbm.getDb())!;
    const tag = `imp${Date.now()}`;
    const email = `ana.${tag}@mail.test`;
    const slug = "los_cuatro_regalos_de_la_tierra";
    const pub = ordersRouter.createCaller({ user: null, req: { headers: {}, ip: `10.1.0.${Math.floor(Math.random() * 200)}` }, res: {} } as any);
    const admin = ordersRouter.createCaller({ user: { id: 1, role: "admin" }, req: {}, res: {} } as any);
    const address = { street: "Calle Mayor 1", details: "2º B", postalCode: "40001", city: "Segovia", province: "Segovia" };
    const input = { productSlug: "los-cuatro-regalos-de-la-tierra", printed: true as const, name: "Ana Pérez", email, phone: "600123456", shipping: address };

    const [ins] = (await conn.insert(schema.ebooks).values({ slug, title: "Los cuatro regalos de la Tierra", price: "9.90", priceCents: 990, status: "active" } as any)) as any;
    try {
      // La oferta aparece aunque el slug de la BD lleve «_»
      expect(await pub.printedStoryOffer()).toEqual({ shippingCents: 450 });

      const first = await pub.create(input);
      expect(first.amountCents).toBe(2000);
      expect(first.amountLabel).toMatch(/20,00/);
      expect(first.isPrinted).toBe(true);
      const again = await pub.create(input); // reintento (doble clic / recarga)
      expect(again.reference).toBe(first.reference);
      expect((again as any).reused).toBe(true);
      const rows = await conn.select().from(schema.orders).where(eq(schema.orders.customerEmail, email));
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ productType: "printed_book", status: "pending", shippingCents: 450, amountCents: 2000 });
      expect(rows[0].shippingAddress).toMatchObject({ ...address, country: "España" });
      expect(sent.received).toHaveLength(1);
      expect(sent.received[0]).toMatchObject({ printed: true, shippingCents: 450, amountCents: 2000 });

      // Dirección fuera de la península / sin teléfono: no se crea nada
      await expect(pub.create({ ...input, shipping: { ...address, postalCode: "38001" } })).rejects.toThrow(/peninsular/);
      await expect(pub.create({ ...input, phone: undefined })).rejects.toThrow(/teléfono/);
      expect(await conn.select().from(schema.orders).where(eq(schema.orders.customerEmail, email))).toHaveLength(1);

      // El CRM ve la dirección
      const list = await admin.list({ status: "pending" });
      const mine = list.find((o: any) => o.reference === first.reference) as any;
      expect(mine.shippingAddress.street).toBe("Calle Mayor 1");
      expect(mine).not.toHaveProperty("pendingPrintKey");

      // Confirmación manual: pagado, sin enlace al PDF, correo de reserva (no el de la guía)
      const paid = await admin.confirmPayment({ id: rows[0].id });
      expect(paid).toMatchObject({ alreadyPaid: false, emailSent: true, printed: true });
      expect((await admin.confirmPayment({ id: rows[0].id })).alreadyPaid).toBe(true);
      expect(sent.printed).toHaveLength(1);
      expect(sent.delivery).toHaveLength(0);
      const [o] = await conn.select().from(schema.orders).where(eq(schema.orders.id, rows[0].id));
      expect(o).toMatchObject({ status: "paid", pendingPrintKey: null, shippedAt: null });
      expect(o.downloadToken).toBeNull();
      expect(await findPaidOrderByDownloadToken(o.downloadToken ?? "x")).toBeNull();

      // Pendiente de envío: no se puede marcar como enviado antes del 15/12/2026
      if (Date.now() < Date.parse("2026-12-15T00:00:00+01:00")) {
        await expect(admin.markPrintedShipped({ id: o.id })).rejects.toThrow(/15 de diciembre/);
      }
      expect((await conn.select().from(schema.orders).where(eq(schema.orders.id, o.id)))[0].shippedAt).toBeNull();
    } finally {
      await conn.delete(schema.clientServices).where(like(schema.clientServices.notes as any, `%${tag}%`)).catch(() => undefined);
      await conn.delete(schema.orders).where(eq(schema.orders.customerEmail, email));
      await conn.delete(schema.ebooks).where(eq(schema.ebooks.id, ins.insertId));
    }
  }, 30000);
});
