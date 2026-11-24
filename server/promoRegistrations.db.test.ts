/**
 * Descarga promocional: validación en el servidor y alta/clasificación en el CRM.
 * La parte con base de datos corre solo con SITE_TEST_DATABASE_URL.
 */
import { describe, expect, it } from "vitest";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { validateRegistration } from "./promoRegistrations";

describe("validación del formulario (servidor)", () => {
  it("acepta nombre y apellidos, email y teléfono; normaliza email y teléfono", () => {
    const v = validateRegistration({ name: "  Ana   López  ", email: " ANA@Correo.ES ", phone: "600 123 456" });
    expect(v).toEqual({ ok: true, name: "Ana López", email: "ana@correo.es", phone: "+34600123456" });
  });
  it("rechaza lo que falta o no es válido, con un mensaje por campo", () => {
    const v = validateRegistration({ name: "Ana", email: "no-es-email", phone: "123" });
    expect(v.ok).toBe(false);
    if (!v.ok) expect(Object.keys(v.errors).sort()).toEqual(["email", "name", "phone"]);
    expect(validateRegistration({}).ok).toBe(false);
    expect(validateRegistration({ name: "Ana López", email: "a@b.es", phone: 600123456 as never }).ok).toBe(false);
  });
});

const URL = process.env.SITE_TEST_DATABASE_URL;
const d = describe.runIf(!!URL && /(_test|test_)/.test(URL ?? ""));

d("alta y clasificación en el CRM (BD de pruebas)", () => {
  it("cliente nuevo, existente, conflicto, idempotencia, simultaneidad y endpoint /registro", async () => {
    process.env.DATABASE_URL = URL;
    const { default: express } = await import("express");
    const { registerPromoDownload } = await import("./promoRegistrations");
    const { registerPromoRoutes } = await import("./promos");
    const dbm = await import("./db");
    const s = await import("../drizzle/schema");
    const { and, eq, inArray, like } = await import("drizzle-orm");
    const conn = (await dbm.getDb())!;
    const tag = `pr${Date.now()}`;
    const now = Date.now();

    const [er] = await conn.insert(s.ebooks).values({ slug: `${tag}_cuento`, title: "Cuento de prueba", price: "9.90", priceCents: 990, status: "active", pdfUrl: "/uploads/x.pdf" });
    const ebookId = Number((er as { insertId: number }).insertId);
    await conn.insert(s.ebookPromos).values({ slug: `${tag}-promo`, name: "Promo", ebookId, headline: "H", message: "M", bannerText: "B", published: 1, endsAt: now + 3_600_000 });
    await conn.insert(s.ebookPromos).values({ slug: `${tag}-fin`, name: "Promo fin", ebookId, headline: "H", message: "M", bannerText: "B", published: 1, endsAt: now - 1000 });
    const [promo] = await conn.select().from(s.ebookPromos).where(eq(s.ebookPromos.slug, `${tag}-promo`));
    const [ebook] = await conn.select().from(s.ebooks).where(eq(s.ebooks.id, ebookId));
    const input = (name: string, email: string, phone: string, source = "directo") => ({ name, email, phone, source });
    const createdIds: number[] = [];
    const mkClient = async (v: Partial<typeof s.clients.$inferInsert>) => {
      const [r] = await conn.insert(s.clients).values({ firstName: "X", lastName: "Y", status: "active", ...v });
      const id = Number((r as { insertId: number }).insertId);
      createdIds.push(id);
      return id;
    };
    const cats = async (id: number) => (await conn.select().from(s.clientCategories).where(eq(s.clientCategories.clientId, id))).map((c) => c.category).sort();
    const resources = (id: number) => conn.select().from(s.clientServices).where(eq(s.clientServices.clientId, id));

    try {
      // 1) Persona nueva: ficha + «Recursos gratuitos» + recurso gratuito (sin pedido, factura ni pago)
      const r1 = await registerPromoDownload(promo, ebook, input("Lucía Prado Gil", `${tag}.nueva@t.es`, "+34611000001", "red_facebook"));
      expect(r1).toMatchObject({ status: "created", resourceCreated: true, categoryAdded: true });
      createdIds.push(r1.clientId!);
      const [c1] = await conn.select().from(s.clients).where(eq(s.clients.id, r1.clientId!));
      expect(c1).toMatchObject({ firstName: "Lucía", lastName: "Prado Gil", email: `${tag}.nueva@t.es`, phone: "+34611000001" });
      expect(await cats(r1.clientId!)).toEqual(["recursos_gratuitos"]);
      const res1 = await resources(r1.clientId!);
      expect(res1).toHaveLength(1);
      expect(res1[0]).toMatchObject({ name: "Descarga de promoción · Cuento de prueba", paymentStatus: "free", amountCents: null, source: "promo", orderId: null, sourceKey: `promo:${promo.id}` });
      expect(res1[0].pathLabel).toBe("Recursos gratuitos → Descarga de promoción · Cuento de prueba");
      expect(res1[0].notes).toContain("red_facebook");
      expect(await conn.select().from(s.orders).where(eq(s.orders.clientId, r1.clientId!))).toHaveLength(0);

      // 2) Segunda descarga de la misma persona: reutiliza la ficha y NO duplica el recurso; registro nuevo (nuevo token)
      const r1b = await registerPromoDownload(promo, ebook, input("Lucía Prado Gil", `${tag}.NUEVA@t.es`, "611 000 001"));
      expect(r1b).toMatchObject({ status: "linked", clientId: r1.clientId, resourceCreated: false, categoryAdded: false });
      expect(r1b.token).not.toBe(r1.token);
      expect(await resources(r1.clientId!)).toHaveLength(1);

      // 3) Cliente existente con otras categorías y datos: se conservan; se añade Recursos gratuitos
      const ex = await mkClient({ firstName: "Marta", lastName: "Soto", email: `${tag}.marta@t.es`, phone: null, city: "Segovia" });
      await conn.insert(s.clientCategories).values({ clientId: ex, category: "acompanamiento" });
      const r2 = await registerPromoDownload(promo, ebook, input("Marta Soto Ruiz", `${tag}.marta@t.es`, "+34622000002"));
      expect(r2).toMatchObject({ status: "linked", clientId: ex, resourceCreated: true, categoryAdded: true });
      expect(await cats(ex)).toEqual(["acompanamiento", "recursos_gratuitos"]);
      const [c2] = await conn.select().from(s.clients).where(eq(s.clients.id, ex));
      expect(c2).toMatchObject({ firstName: "Marta", lastName: "Soto", city: "Segovia", phone: "+34622000002" }); // solo se rellena el teléfono vacío

      // 4) Existente identificado solo por teléfono (formato distinto), con su email conservado
      const ph = await mkClient({ firstName: "Pablo", lastName: "Mena", email: `${tag}.pablo@t.es`, phone: "633 00 00 03" });
      const r3 = await registerPromoDownload(promo, ebook, input("Pablo Mena", `${tag}.otro@t.es`, "+34633000003"));
      expect(r3).toMatchObject({ status: "linked", clientId: ph });
      expect((await conn.select().from(s.clients).where(eq(s.clients.id, ph)))[0].email).toBe(`${tag}.pablo@t.es`);

      // 5) Conflicto: el email apunta a una ficha y el teléfono a otra → no se toca nada, queda en revisión con candidatos
      const a = await mkClient({ firstName: "Eva", lastName: "Ros", email: `${tag}.eva@t.es` });
      const b = await mkClient({ firstName: "Eva", lastName: "Ros", phone: "+34644000004" });
      const r4 = await registerPromoDownload(promo, ebook, input("Eva Ros", `${tag}.eva@t.es`, "+34644000004"));
      expect(r4.status).toBe("review");
      expect(r4.clientId).toBeNull();
      expect(r4.resourceCreated).toBe(false);
      expect(await cats(a)).toEqual([]);
      expect(await cats(b)).toEqual([]);
      const [reg4] = await conn.select().from(s.ebookPromoRegistrations).where(eq(s.ebookPromoRegistrations.id, r4.registrationId));
      expect(reg4.candidates!.split(",").map(Number).sort()).toEqual([a, b].sort());
      // …y una ficha con ese email pero de nombre distinto también es conflicto (no se mezcla a otra persona)
      const r5 = await registerPromoDownload(promo, ebook, input("Carlos Vega", `${tag}.eva@t.es`, "+34655000005"));
      expect(r5.status).toBe("review");
      expect(await conn.select().from(s.clients).where(like(s.clients.email, `${tag}.eva@%`))).toHaveLength(1);

      // 6) Solicitudes simultáneas de la misma persona nueva: una ficha, una categoría y un recurso
      const burst = await Promise.all(Array.from({ length: 6 }, () => registerPromoDownload(promo, ebook, input("Irene Costa Lara", `${tag}.irene@t.es`, "+34666000006"))));
      const ids = new Set(burst.map((x) => x.clientId));
      expect(ids.size).toBe(1);
      const ireneId = Array.from(ids)[0]!;
      createdIds.push(ireneId);
      expect(await conn.select().from(s.clients).where(eq(s.clients.email, `${tag}.irene@t.es`))).toHaveLength(1);
      expect(await cats(ireneId)).toEqual(["recursos_gratuitos"]);
      expect(await resources(ireneId)).toHaveLength(1);
      expect(burst.filter((x) => x.resourceCreated)).toHaveLength(1);

      // 7) Endpoint HTTP: valida en el servidor, guarda y entrega token; terminada → 410; el recurso aparece una sola vez
      const app = express();
      registerPromoRoutes(app);
      const server = http.createServer(app);
      await new Promise<void>((r) => server.listen(0, r));
      const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
      const post = (slug: string, body: unknown) => fetch(`${url}/api/promos/${slug}/registro`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      try {
        const bad = await post(`${tag}-promo`, { name: "Ana", email: "x", phone: "1" });
        expect(bad.status).toBe(400);
        expect(Object.keys((await bad.json()).errors).sort()).toEqual(["email", "name", "phone"]);
        const ok = await post(`${tag}-promo`, { name: "Rosa Tena Gil", email: `${tag}.rosa@t.es`, phone: "677000007", source: "amigo_whatsapp" });
        expect(ok.status).toBe(200);
        const { token } = await ok.json();
        expect(token).toMatch(/^[a-f0-9]{64}$/);
        const [rosa] = await conn.select().from(s.clients).where(eq(s.clients.email, `${tag}.rosa@t.es`));
        createdIds.push(rosa.id);
        expect(rosa.phone).toBe("+34677000007");
        expect(await resources(rosa.id)).toHaveLength(1);
        expect((await post(`${tag}-fin`, { name: "Rosa Tena Gil", email: `${tag}.rosa@t.es`, phone: "677000007" })).status).toBe(410);
        expect((await post(`${tag}-noexiste`, { name: "Rosa Tena Gil", email: `${tag}.rosa@t.es`, phone: "677000007" })).status).toBe(410);
      } finally {
        await new Promise<void>((r) => server.close(() => r()));
      }
    } finally {
      const promos = await conn.select({ id: s.ebookPromos.id }).from(s.ebookPromos).where(like(s.ebookPromos.slug, `${tag}%`));
      const emails = (await conn.select({ id: s.clients.id }).from(s.clients).where(like(s.clients.email, `${tag}%`))).map((c) => c.id);
      const all = Array.from(new Set([...createdIds, ...emails]));
      if (all.length) {
        await conn.delete(s.clientServices).where(inArray(s.clientServices.clientId, all));
        await conn.delete(s.clientCategories).where(inArray(s.clientCategories.clientId, all));
        await conn.delete(s.clients).where(inArray(s.clients.id, all));
      }
      for (const p of promos) await conn.delete(s.ebookPromoRegistrations).where(eq(s.ebookPromoRegistrations.promoId, p.id));
      await conn.delete(s.serviceCatalog).where(like(s.serviceCatalog.slug, `promo-${tag}%`));
      await conn.delete(s.ebookPromos).where(like(s.ebookPromos.slug, `${tag}%`));
      await conn.delete(s.ebooks).where(and(eq(s.ebooks.id, ebookId)));
    }
  }, 90_000);
});
