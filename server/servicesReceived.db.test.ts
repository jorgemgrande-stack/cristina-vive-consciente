/**
 * Servicios recibidos contra MySQL de pruebas (SITE_TEST_DATABASE_URL, con las migraciones 0024-0030):
 *  1. una cita realizada deja UNA sola sesión (aunque se marque dos veces) y respeta lo ya escrito
 *  2. Cristina registra una guía gratuita con los desplegables dependientes del catálogo
 *  3. un pedido pagado se vincula por email (existente / nueva / varias coincidencias), se registra una vez
 *     y la clienta se encuentra filtrando por producto
 */
import { describe, expect, it } from "vitest";

const URL = process.env.SITE_TEST_DATABASE_URL;
const d = describe.runIf(!!URL && /(_test|test_)/.test(URL ?? ""));

d("Servicios recibidos con base de datos", () => {
  it("cita realizada → una sola sesión; guía gratuita; compra enlazada y filtrable por producto", async () => {
    process.env.DATABASE_URL = URL;
    const dbm = await import("./db");
    const sr = await import("./servicesReceivedDb");
    const schema = await import("../drizzle/schema");
    const { eq, inArray, like, and } = await import("drizzle-orm");
    const { childrenOf, pathTo } = await import("../shared/serviceCatalog");
    const conn = (await dbm.getDb())!;
    const tag = `srt${Date.now()}`;
    const mail = (n: string) => `${n}@${tag}.test`;
    const created: { clients: number[]; orders: number[]; nodes: number[] } = { clients: [], orders: [], nodes: [] };

    const newClient = async (first: string, email: string | null) => {
      const [r] = (await conn.insert(schema.clients).values({ firstName: first, lastName: tag, email })) as any;
      created.clients.push(r.insertId);
      return r.insertId as number;
    };
    const newOrder = async (ref: string, email: string, status: "paid" | "pending" = "paid") => {
      const [r] = (await conn.insert(schema.orders).values({
        reference: ref, productType: "ebook", productSlug: `${tag}-agua`, productTitle: "Guía Digital del Agua", amountCents: 1200,
        customerName: `Vanessa Porras ${tag}`, customerEmail: email, status, paidAt: Date.now(),
      })) as any;
      created.orders.push(r.insertId);
      return r.insertId as number;
    };

    try {
      // Catálogo mínimo: Recursos gratuitos → Guía; Productos → Ebooks → Guía Digital del Agua
      const rec = (await sr.createCatalogNode({ parentId: null, kind: "category", name: `Recursos ${tag}` })).id;
      const guia = (await sr.createCatalogNode({ parentId: rec, kind: "item", name: `Guía del agua ${tag}` })).id;
      const prod = (await sr.createCatalogNode({ parentId: null, kind: "category", name: `Productos ${tag}` })).id;
      const ebooks = (await sr.createCatalogNode({ parentId: prod, kind: "group", name: `Ebooks ${tag}` })).id;
      const agua = (await sr.createCatalogNode({ parentId: ebooks, kind: "item", name: "Guía Digital del Agua", priceCents: 1200 })).id;
      created.nodes.push(rec, guia, prod, ebooks, agua);
      await conn.update(schema.serviceCatalog).set({ ebookSlug: `${tag}-agua` }).where(eq(schema.serviceCatalog.id, agua));
      // desplegables dependientes: categoría → tipo → artículo
      const tree = await sr.listCatalog();
      expect(childrenOf(tree, prod).map((n) => n.name)).toEqual([`Ebooks ${tag}`]);
      expect(childrenOf(tree, ebooks).map((n) => n.name)).toEqual(["Guía Digital del Agua"]);
      expect(pathTo(tree, agua).map((n) => n.name)).toEqual([`Productos ${tag}`, `Ebooks ${tag}`, "Guía Digital del Agua"]);

      // ── 1. Cita completada: una sola vez ──
      const cid = await newClient("Cita", mail("cita"));
      const [ap] = (await conn.insert(schema.appointments).values({ clientId: cid, serviceType: "masaje", serviceLabel: `Masaje ${tag}`, scheduledAt: Date.UTC(2026, 10, 20, 9, 30), durationMinutes: 60, status: "completed" })) as any;
      const first = await sr.ensureSessionForAppointment(ap.insertId, 1);
      expect(first.created).toBe(true);
      // Cristina añade observaciones y pendiente; marcar de nuevo la cita no duplica ni pisa
      await conn.update(schema.sessionHistory).set({ summary: "Prefiere presión suave", nextSteps: "Revisar cuello" }).where(eq(schema.sessionHistory.id, first.sessionId!));
      expect((await sr.ensureSessionForAppointment(ap.insertId, 1)).created).toBe(false);
      const sessions = await conn.select().from(schema.sessionHistory).where(eq(schema.sessionHistory.appointmentId, ap.insertId));
      expect(sessions).toHaveLength(1);
      expect(sessions[0]).toMatchObject({ summary: "Prefiere presión suave", nextSteps: "Revisar cuello", sessionTime: "10:30", clientId: cid });
      // una cita NO realizada no genera sesión
      const [ap2] = (await conn.insert(schema.appointments).values({ clientId: cid, serviceType: "masaje", scheduledAt: Date.now() + 1e9, status: "confirmed" })) as any;
      expect((await sr.ensureSessionForAppointment(ap2.insertId)).created).toBe(false);

      // ── 2. Guía gratuita registrada a mano ──
      await sr.createClientService(cid, { nodeId: guia, paymentStatus: "free", amountCents: null, receivedAt: Date.now() }, 1);
      const mine = await sr.listClientServices(cid);
      expect(mine).toHaveLength(1);
      expect(mine[0]).toMatchObject({ pathLabel: `Recursos ${tag} → Guía del agua ${tag}`, paymentStatus: "free", source: "manual" });
      await expect(sr.deleteClientService(mine[0].id, cid + 999)).rejects.toThrow();

      // ── 3a. Pedido con UNA ficha por email (mayúsculas distintas) ──
      const existing = await newClient("Existente", `Vanessa.${tag}@Mail.TEST`);
      const o1 = await newOrder(`T${tag}`.slice(0, 20), `vanessa.${tag}@mail.test`);
      const l1 = await sr.linkOrderToClient(o1);
      expect(l1).toMatchObject({ status: "linked", clientId: existing, recorded: true });
      expect((await sr.linkOrderToClient(o1)).recorded).toBe(false); // repetir no duplica
      const rows = await sr.listClientServices(existing);
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ pathLabel: `Productos ${tag} → Ebooks ${tag} → Guía Digital del Agua`, amountCents: 1200, paymentStatus: "paid", source: "order", orderId: o1 });
      // filtro por producto: por artículo, por tipo y por categoría, una sola vez
      const find = async (id: number) => (await dbm.getClients(undefined, undefined, undefined, id)).filter((c) => c.lastName === tag);
      expect((await find(agua)).map((c) => c.id)).toEqual([existing]);
      expect((await find(ebooks)).map((c) => c.id)).toEqual([existing]);
      expect((await find(prod)).map((c) => c.id)).toEqual([existing]);
      expect((await find(guia)).map((c) => c.id)).toEqual([cid]);

      // ── 3b. Sin ficha: se crea ──
      const o2 = await newOrder(`U${tag}`.slice(0, 20), mail("nueva"));
      const l2 = await sr.linkOrderToClient(o2);
      expect(l2.status).toBe("created");
      created.clients.push(l2.clientId!);
      const [nc] = await conn.select().from(schema.clients).where(eq(schema.clients.id, l2.clientId!));
      expect(nc).toMatchObject({ firstName: "Vanessa", email: mail("nueva") });

      // ── 3c. Varias coincidencias: queda para revisión y no se registra nada ──
      const a = await newClient("DupA", mail("dup"));
      const b = await newClient("DupB", mail("dup"));
      const o3 = await newOrder(`V${tag}`.slice(0, 20), mail("dup"));
      const l3 = await sr.linkOrderToClient(o3);
      expect(l3).toMatchObject({ status: "review", clientId: null, recorded: false });
      expect(l3.candidates.sort()).toEqual([a, b].sort());
      expect((await sr.listClientServices(a)).length + (await sr.listClientServices(b)).length).toBe(0);
      const [ord3] = await conn.select().from(schema.orders).where(eq(schema.orders.id, o3));
      expect(ord3).toMatchObject({ clientId: null, clientLinkStatus: "review" });
      // Cristina elige la ficha
      expect(await sr.resolveOrderReview(o3, b)).toMatchObject({ status: "linked", clientId: b, recorded: true });
      expect((await sr.listClientServices(b))).toHaveLength(1);

      // un pedido pendiente no se vincula
      const o4 = await newOrder(`W${tag}`.slice(0, 20), mail("pend"), "pending");
      await expect(sr.linkOrderToClient(o4)).rejects.toThrow(/pagados/);
    } finally {
      if (created.clients.length) {
        await conn.delete(schema.clientServices).where(inArray(schema.clientServices.clientId, created.clients));
        const appts = await conn.select({ id: schema.appointments.id }).from(schema.appointments).where(inArray(schema.appointments.clientId, created.clients));
        if (appts.length) await conn.delete(schema.sessionHistory).where(inArray(schema.sessionHistory.appointmentId, appts.map((x) => x.id)));
        await conn.delete(schema.appointments).where(inArray(schema.appointments.clientId, created.clients));
        await conn.delete(schema.clients).where(inArray(schema.clients.id, created.clients));
      }
      await conn.delete(schema.orders).where(like(schema.orders.customerEmail, `%${tag}%`));
      await conn.delete(schema.serviceCatalog).where(like(schema.serviceCatalog.name, `%${tag}%`));
      await conn.delete(schema.serviceCatalog).where(and(eq(schema.serviceCatalog.ebookSlug, `${tag}-agua`)));
    }
  }, 60_000);
});
