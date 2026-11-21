/**
 * Regla de coincidencia por email a lo largo de TODO el flujo: crear pedido → confirmar pago.
 * Con dos fichas con el mismo email, el pedido queda en «Ficha por revisar» y la compra no se asigna a ninguna.
 * Solo corre con SITE_TEST_DATABASE_URL (BD de pruebas con las migraciones hasta la 0030).
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("./email", () => ({
  sendOrderReceivedEmail: vi.fn(async () => undefined),
  sendOrderAdminEmail: vi.fn(async () => undefined),
  sendEbookDeliveryEmail: vi.fn(async () => undefined),
}));
vi.mock("./whatsapp", () => ({ notifyAdminNewOrder: vi.fn(async () => undefined) }));

const URL = process.env.SITE_TEST_DATABASE_URL;
const d = describe.runIf(!!URL && /(_test|test_)/.test(URL ?? ""));

d("Pedido por email: crear → confirmar pago", () => {
  it("dos fichas con el mismo email: queda por revisar y no se asigna a ninguna; una o ninguna: se vincula o se crea", async () => {
    process.env.DATABASE_URL = URL;
    const { ordersRouter } = await import("./routers/orders");
    const sr = await import("./servicesReceivedDb");
    const dbm = await import("./db");
    const schema = await import("../drizzle/schema");
    const { eq, inArray, like } = await import("drizzle-orm");
    const conn = (await dbm.getDb())!;
    const tag = `oer${Date.now()}`;
    const mail = (n: string) => `${n}.${tag}@mail.test`;
    const pub = ordersRouter.createCaller({ user: null, req: { headers: {}, ip: `10.0.0.${Math.floor(Math.random() * 200)}` }, res: {} } as any);
    const admin = ordersRouter.createCaller({ user: { id: 1, role: "admin" }, req: {}, res: {} } as any);
    const clientIds: number[] = [];
    const newClient = async (first: string, email: string) => {
      const [r] = (await conn.insert(schema.clients).values({ firstName: first, lastName: tag, email })) as any;
      clientIds.push(r.insertId);
      return r.insertId as number;
    };
    const orderRow = async (ref: string) => (await conn.select().from(schema.orders).where(eq(schema.orders.reference, ref)))[0];
    const purchases = async (ids: number[]) => (await conn.select().from(schema.clientServices).where(inArray(schema.clientServices.clientId, ids))).length;

    try {
      // ── Dos fichas con el mismo email (mayúsculas distintas) ──
      const a = await newClient("Ana", mail("dup").toUpperCase().replace("@MAIL.TEST", "@mail.test"));
      const b = await newClient("Ana2", mail("dup"));
      const created = await pub.create({ productSlug: "agua", name: "Vanessa Porras", email: mail("dup") });
      let o = await orderRow(created.reference);
      expect(o.clientId).toBeNull(); // al CREAR no se asigna ninguna de las dos
      expect(o.status).toBe("pending");

      const paid = await admin.confirmPayment({ id: o.id });
      expect(paid.alreadyPaid).toBe(false);
      expect((paid as any).clientLink).toBe("review");
      o = await orderRow(created.reference);
      expect(o).toMatchObject({ status: "paid", clientId: null, clientLinkStatus: "review" });
      expect(await purchases([a, b])).toBe(0); // la compra no está en ninguna ficha
      // confirmar otra vez no cambia nada
      expect((await admin.confirmPayment({ id: o.id })).alreadyPaid).toBe(true);
      expect(await purchases([a, b])).toBe(0);

      // Cristina elige la ficha → se registra una sola vez
      await sr.resolveOrderReview(o.id, b);
      expect(await purchases([a])).toBe(0);
      expect(await purchases([b])).toBe(1);

      // ── Pedido antiguo cuya ficha se puso al crearlo (primera coincidencia) con varias fichas: se revisa ──
      const [legacy] = (await conn.insert(schema.orders).values({
        reference: `L${tag}`.slice(0, 20), productType: "ebook", productSlug: "agua", productTitle: "Guía Digital del Agua", amountCents: 1200,
        customerName: "Vanessa Porras", customerEmail: mail("dup"), status: "paid", paidAt: Date.now(), clientId: a,
      })) as any;
      expect(await sr.linkOrderToClient(legacy.insertId)).toMatchObject({ status: "review", clientId: null, recorded: false });
      expect(await purchases([a])).toBe(0);

      // ── Una sola ficha: se vincula al confirmar el pago ──
      const one = await newClient("Unica", mail("uno"));
      const c1 = await pub.create({ productSlug: "agua", name: "Una Sola", email: mail("uno") });
      expect((await orderRow(c1.reference)).clientId).toBe(one);
      expect((await admin.confirmPayment({ id: (await orderRow(c1.reference)).id }) as any).clientLink).toBe("linked");
      expect(await purchases([one])).toBe(1);

      // ── Ninguna ficha: se crea al confirmar el pago ──
      const c0 = await pub.create({ productSlug: "agua", name: "Nueva Persona", email: mail("nadie") });
      expect((await orderRow(c0.reference)).clientId).toBeNull();
      const r0 = (await admin.confirmPayment({ id: (await orderRow(c0.reference)).id })) as any;
      expect(r0.clientLink).toBe("created");
      const created0 = await orderRow(c0.reference);
      expect(created0.clientId).not.toBeNull();
      clientIds.push(created0.clientId!);
      expect(await purchases([created0.clientId!])).toBe(1);
    } finally {
      if (clientIds.length) {
        await conn.delete(schema.clientServices).where(inArray(schema.clientServices.clientId, clientIds));
        await conn.delete(schema.clients).where(inArray(schema.clients.id, clientIds));
      }
      await conn.delete(schema.orders).where(like(schema.orders.customerEmail, `%${tag}%`));
    }
  }, 60_000);
});
