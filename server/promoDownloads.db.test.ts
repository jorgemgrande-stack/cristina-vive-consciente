/**
 * Descargas de la promoción: entrega fallida, peticiones simultáneas y clientes únicos por ficha del CRM.
 * Corre solo con SITE_TEST_DATABASE_URL.
 */
import { describe, expect, it, vi } from "vitest";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { AddressInfo } from "node:net";

const URL = process.env.SITE_TEST_DATABASE_URL;
const d = describe.runIf(!!URL && /(_test|test_)/.test(URL ?? ""));

d("conteo de descargas (BD de pruebas)", () => {
  it("una entrega fallida no suma, las simultáneas suman una vez, una posterior vuelve a sumar y los únicos se cuentan por ficha", async () => {
    process.env.DATABASE_URL = URL;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "promo-dl-"));
    process.env.UPLOAD_DIR = dir;
    fs.mkdirSync(path.join(dir, "files"), { recursive: true });
    // PDF grande (24 MB) para poder cortar la conexión a mitad de la entrega
    fs.writeFileSync(path.join(dir, "files", "grande.pdf"), Buffer.concat([Buffer.from("%PDF-1.4 grande\n"), Buffer.alloc(24 * 1024 * 1024, 65)]));

    const { default: express } = await import("express");
    const { registerPromoRoutes } = await import("./promos");
    const { promoStats } = await import("./routers/promosAdmin");
    const { linkRegistrationToClient } = await import("./promoRegistrations");
    const dbm = await import("./db");
    const s = await import("../drizzle/schema");
    const { eq, inArray, like } = await import("drizzle-orm");
    const conn = (await dbm.getDb())!;
    const tag = `pd${Date.now()}`;
    const now = Date.now();

    const [er] = await conn.insert(s.ebooks).values({ slug: `${tag}_cuento`, title: "Cuento de prueba", price: "9.90", priceCents: 990, status: "active", pdfUrl: "/uploads/files/grande.pdf" });
    const ebookId = Number((er as { insertId: number }).insertId);
    await conn.insert(s.ebookPromos).values({ slug: `${tag}-p`, name: "P", ebookId, headline: "H", message: "M", bannerText: "B", published: 1, endsAt: now + 3_600_000 });
    const [promo] = await conn.select().from(s.ebookPromos).where(eq(s.ebookPromos.slug, `${tag}-p`));
    const clientIds: number[] = [];
    const mkClient = async (email: string) => {
      const [r] = await conn.insert(s.clients).values({ firstName: "C", lastName: tag, email, status: "active" });
      const id = Number((r as { insertId: number }).insertId);
      clientIds.push(id);
      return id;
    };
    try {
      const c1 = await mkClient(`${tag}.uno@t.es`);
      const c2 = await mkClient(`${tag}.dos@t.es`);
      const tok = (n: number) => String(n).repeat(64).slice(0, 64);
      // Dos correos distintos vinculados a la MISMA ficha (c1) y un registro en revisión (sin ficha)
      await conn.insert(s.ebookPromoRegistrations).values([
        { promoId: promo.id, clientId: c1, name: "Uno Uno", email: `${tag}.uno@t.es`, phone: "+34600000001", source: "red_x", status: "linked", token: tok(1) },
        { promoId: promo.id, clientId: c1, name: "Uno Uno", email: `${tag}.uno.b@t.es`, phone: "+34600000001", source: "amigo_enlace", status: "linked", token: tok(2) },
        { promoId: promo.id, clientId: null, name: "Rev Rev", email: `${tag}.rev@t.es`, phone: "+34600000009", source: "directo", status: "review", candidates: `${c1},${c2}`, token: tok(3) },
      ]);
      const regs = await conn.select().from(s.ebookPromoRegistrations).where(eq(s.ebookPromoRegistrations.promoId, promo.id));
      const reg = (n: number) => regs.find((r) => r.token === tok(n))!;
      const downloads = async (registrationId: number) => (await conn.select().from(s.ebookPromoEvents).where(eq(s.ebookPromoEvents.registrationId, registrationId))).filter((e) => e.kind === "download").length;

      const app = express();
      registerPromoRoutes(app);
      const server = http.createServer(app);
      await new Promise<void>((r) => server.listen(0, r));
      const port = (server.address() as AddressInfo).port;
      const base = `http://127.0.0.1:${port}`;
      const dl = (n: number, init?: RequestInit) => fetch(`${base}/api/promos/${tag}-p/descarga?t=${tok(n)}`, init);
      try {
        // 1) Entrega fallida: el cliente corta la conexión a mitad → no suma, y el reintento posterior sí cuenta
        await new Promise<void>((resolve) => {
          const req = http.get(`${base}/api/promos/${tag}-p/descarga?t=${tok(1)}`, (res) => {
            res.once("data", () => { req.destroy(); resolve(); });
          });
          req.on("error", () => resolve());
        });
        await new Promise((r) => setTimeout(r, 600));
        expect(await downloads(reg(1).id)).toBe(0);
        await vi.waitFor(async () => {
          const [r] = await conn.select().from(s.ebookPromoRegistrations).where(eq(s.ebookPromoRegistrations.id, reg(1).id));
          expect(r.lastDownloadAt).toBeNull(); // el turno se liberó
        });

        // 2) Cuatro peticiones simultáneas de la misma entrega: suma una sola vez (reserva atómica)
        const burst = await Promise.all([1, 2, 3, 4].map(async () => {
          const r = await dl(1);
          return (await r.arrayBuffer()).byteLength;
        }));
        expect(burst.every((b) => b > 24 * 1024 * 1024)).toBe(true);
        await vi.waitFor(async () => expect(await downloads(reg(1).id)).toBe(1));
        await new Promise((r) => setTimeout(r, 400));
        expect(await downloads(reg(1).id)).toBe(1);

        // 3) Una descarga posterior válida (fuera de la ventana de repetición) vuelve a sumar
        const later = vi.spyOn(Date, "now").mockReturnValue(Date.now() + 120_000);
        try {
          await (await dl(1)).arrayBuffer();
        } finally {
          later.mockRestore();
        }
        await vi.waitFor(async () => expect(await downloads(reg(1).id)).toBe(2));

        // 4) Otro correo de la misma ficha y un registro en revisión: todos suman al total
        await (await dl(2)).arrayBuffer();
        await (await dl(3)).arrayBuffer();
        await vi.waitFor(async () => expect((await promoStats(promo.id)).downloads).toBe(4));
        let st = await promoStats(promo.id);
        expect(st.uniqueClients).toBe(1); // dos correos, una sola ficha
        expect(st.downloadsInReview).toBe(1); // la del registro en revisión no cuenta como cliente único todavía

        // 5) Al vincular el registro en revisión a una ficha, pasa a clientes únicos
        await linkRegistrationToClient(reg(3).id, c2);
        st = await promoStats(promo.id);
        expect(st).toMatchObject({ downloads: 4, uniqueClients: 2, downloadsInReview: 0 });
        expect(await conn.select().from(s.clientServices).where(eq(s.clientServices.clientId, c2))).toHaveLength(1);
        await expect(linkRegistrationToClient(reg(3).id, c1)).rejects.toThrow(/ya está vinculado/);
        // atribución por canal de las descargas
        expect(st.bySource.red_x?.downloads).toBe(2);
        expect(st.bySource.amigo_enlace?.downloads).toBe(1);
      } finally {
        await new Promise<void>((r) => server.close(() => r()));
      }
    } finally {
      await conn.delete(s.clientServices).where(inArray(s.clientServices.clientId, clientIds));
      await conn.delete(s.clientCategories).where(inArray(s.clientCategories.clientId, clientIds));
      await conn.delete(s.clients).where(inArray(s.clients.id, clientIds));
      await conn.delete(s.ebookPromoEvents).where(eq(s.ebookPromoEvents.promoId, promo.id));
      await conn.delete(s.ebookPromoRegistrations).where(eq(s.ebookPromoRegistrations.promoId, promo.id));
      await conn.delete(s.serviceCatalog).where(like(s.serviceCatalog.slug, `promo-${tag}%`));
      await conn.delete(s.ebookPromos).where(like(s.ebookPromos.slug, `${tag}%`));
      await conn.delete(s.ebooks).where(eq(s.ebooks.id, ebookId));
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }, 120_000);
});
