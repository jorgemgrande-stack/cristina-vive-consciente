/**
 * Promociones de ebooks: estado según la hora, hora peninsular, origen de la visita y servidor (descarga, cierre, caché).
 * La parte con base de datos corre solo con SITE_TEST_DATABASE_URL.
 */
import { describe, expect, it, vi } from "vitest";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { AddressInfo } from "node:net";
import { countdownParts, detectPromoSource, formatMadridDeadline, madridLocalToMs, msToMadridLocal, promoShareMessage, promoState, whatsappShareUrl } from "../shared/promo";

const END = Date.UTC(2026, 10, 26, 22, 59); // jueves 26 de noviembre de 2026, 23:59 hora peninsular (CET, UTC+1)

describe("estado de la campaña", () => {
  const p = { published: 1, startsAt: null, endsAt: END };
  it("borrador, programada, activa y terminada; el cierre es exacto", () => {
    expect(promoState({ ...p, published: 0 }, END - 1000)).toBe("draft");
    expect(promoState({ ...p, startsAt: END - 5000 }, END - 6000)).toBe("scheduled");
    expect(promoState({ ...p, startsAt: END - 5000 }, END - 5000)).toBe("active");
    expect(promoState(p, END - 1)).toBe("active");
    expect(promoState(p, END)).toBe("ended");
    expect(promoState(p, END + 86_400_000)).toBe("ended");
  });
});

describe("hora peninsular", () => {
  it("26/11/2026 23:59 en Madrid son las 22:59 UTC", () => {
    expect(madridLocalToMs("2026-11-26T23:59")).toBe(END);
    expect(msToMadridLocal(END)).toBe("2026-11-26T23:59");
  });
  it("respeta el horario de verano (UTC+2) y el cambio de hora", () => {
    expect(madridLocalToMs("2026-07-15T12:00")).toBe(Date.UTC(2026, 6, 15, 10, 0));
    expect(msToMadridLocal(Date.UTC(2026, 6, 15, 10, 0))).toBe("2026-07-15T12:00");
    expect(madridLocalToMs("2026-10-25T04:00")).toBe(Date.UTC(2026, 9, 25, 3, 0)); // tras el cambio a UTC+1
  });
  it("texto del plazo y entrada inválida", () => {
    expect(formatMadridDeadline(END)).toBe("jueves 26 de noviembre a las 23:59");
    expect(Number.isNaN(madridLocalToMs("mañana"))).toBe(true);
  });
  it("cuenta atrás en días, horas, minutos y segundos", () => {
    expect(countdownParts(2 * 86400_000 + 8 * 3600_000 + 36 * 60_000 + 14_000)).toEqual({ days: 2, hours: 8, minutes: 36, seconds: 14 });
    expect(countdownParts(-5000)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  });
});

describe("difusión y origen", () => {
  it("el mensaje de WhatsApp incluye el plazo y el enlace, y es editable (wa.me?text=)", () => {
    const msg = promoShareMessage("Los cuatro regalos de la Tierra", END, "https://x.es/promocion/a?utm_source=whatsapp");
    expect(msg).toContain("jueves 26 de noviembre a las 23:59");
    expect(msg).toContain("https://x.es/promocion/a?utm_source=whatsapp");
    expect(whatsappShareUrl(msg).startsWith("https://wa.me/?text=")).toBe(true);
    expect(decodeURIComponent(whatsappShareUrl(msg).split("text=")[1])).toBe(msg);
  });
  it("origen: utm_source / ref y, si no, el dominio de referencia", () => {
    expect(detectPromoSource("?utm_source=Instagram", "")).toBe("instagram");
    expect(detectPromoSource("?ref=ana-lopez", "")).toBe("ana-lopez");
    expect(detectPromoSource("", "https://l.instagram.com/")).toBe("instagram");
    expect(detectPromoSource("", "https://api.whatsapp.com/")).toBe("whatsapp");
    expect(detectPromoSource("", "https://www.google.es/")).toBe("google");
    expect(detectPromoSource("", "https://blog.otro.com/")).toBe("otros");
    expect(detectPromoSource("", "")).toBe("directo");
    expect(detectPromoSource("?utm_source=<script>", "")).toBe("script"); // se limpia
  });
});

const URL = process.env.SITE_TEST_DATABASE_URL;
const d = describe.runIf(!!URL && /(_test|test_)/.test(URL ?? ""));

d("servidor con base de datos de pruebas", () => {
  it("descarga solo con la campaña activa (hora del servidor), sin caché, y bloqueo exacto al cierre", async () => {
    process.env.DATABASE_URL = URL;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "promo-"));
    process.env.UPLOAD_DIR = dir;
    fs.mkdirSync(path.join(dir, "crm-uploads", "files"), { recursive: true });
    fs.writeFileSync(path.join(dir, "crm-uploads", "files", "cuento.pdf"), "%PDF-1.4 cuento de prueba");

    const { default: express } = await import("express");
    const { registerPromoRoutes, registerPromoPages } = await import("./promos");
    const dbm = await import("./db");
    const s = await import("../drizzle/schema");
    const { like, eq } = await import("drizzle-orm");
    const conn = (await dbm.getDb())!;
    const tag = `pt${Date.now()}`;
    const now = Date.now();
    const TEMPLATE = `<!doctype html><html><head><title>genérico</title></head><body><div id="root"></div></body></html>`;

    const [er] = await conn.insert(s.ebooks).values({ slug: `${tag}_cuento`, title: "Cuento de prueba", price: "9.90", priceCents: 990, status: "active", pdfUrl: "/uploads/crm-uploads/files/cuento.pdf", coverImage: "/uploads/c.jpg" });
    const ebookId = Number((er as { insertId: number }).insertId);
    const base = { name: "t", ebookId, headline: "Hay regalos que\nno se envuelven.", message: "Mensaje", bannerText: "Aviso" };
    const mk = (slug: string, over: Partial<typeof s.ebookPromos.$inferInsert>) => conn.insert(s.ebookPromos).values({ ...base, slug: `${tag}-${slug}`, published: 1, endsAt: now + 3_600_000, ...over });
    try {
      await mk("activa", {});
      await mk("borrador", { published: 0 });
      await mk("programada", { startsAt: now + 60_000 });
      await mk("terminada", { endsAt: now - 1000 });

      const app = express();
      registerPromoRoutes(app);
      registerPromoPages(app, async () => TEMPLATE);
      const server = http.createServer(app);
      await new Promise<void>((r) => server.listen(0, r));
      const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
      try {
        // Datos públicos: sin la URL del PDF y sin caché
        const pub = await fetch(`${url}/api/promos/${tag}-activa`);
        expect(pub.status).toBe(200);
        expect(pub.headers.get("cache-control")).toContain("no-store");
        const body = await pub.json();
        expect(body.state).toBe("active");
        expect(JSON.stringify(body)).not.toContain("pdf");
        expect(body.ebook.price).toBe("9,90€");
        expect((await fetch(`${url}/api/promos/${tag}-borrador`)).status).toBe(404);
        expect((await (await fetch(`${url}/api/promos/${tag}-terminada`)).json()).state).toBe("ended");
        expect((await (await fetch(`${url}/api/promos/${tag}-programada`)).json()).state).toBe("scheduled");

        // Descarga: activa sí; borrador, programada y terminada no
        const ok = await fetch(`${url}/api/promos/${tag}-activa/descarga?s=instagram`);
        expect(ok.status).toBe(200);
        expect(ok.headers.get("content-type")).toContain("application/pdf");
        expect(ok.headers.get("content-disposition")).toContain("attachment");
        expect(ok.headers.get("cache-control")).toContain("no-store");
        expect(await ok.text()).toContain("%PDF-1.4");
        for (const slug of ["borrador", "programada", "terminada", "no-existe"]) {
          const r = await fetch(`${url}/api/promos/${tag}-${slug}/descarga`);
          expect(r.status, slug).toBe(410);
          expect(r.headers.get("cache-control")).toContain("no-store");
        }

        // Aviso: solo la activa
        const act = await (await fetch(`${url}/api/promos/active`)).json();
        expect(act.active.slug.startsWith(tag)).toBe(true);
        expect(act.active.path).toBe(`/promocion/${act.active.slug}`);

        // El cierre llega mientras alguien conserva el enlace: con el reloj del servidor pasado el cierre, 410 y sin aviso
        const spy = vi.spyOn(Date, "now").mockReturnValue(now + 3_600_001);
        try {
          expect((await fetch(`${url}/api/promos/${tag}-activa/descarga`)).status).toBe(410);
          expect((await (await fetch(`${url}/api/promos/${tag}-activa`)).json()).state).toBe("ended");
          const after = await (await fetch(`${url}/api/promos/active`)).json();
          expect(after.active?.slug?.startsWith(tag) ?? false).toBe(false);
        } finally {
          spy.mockRestore();
        }

        // Medición agregada
        await fetch(`${url}/api/promos/${tag}-activa/event`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "view", source: "whatsapp" }) });
        await fetch(`${url}/api/promos/${tag}-activa/event`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "share", source: "directo", channel: "whatsapp" }) });
        await fetch(`${url}/api/promos/${tag}-activa/event`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "download", source: "x" }) }); // no se acepta desde el navegador
        const [promo] = await conn.select().from(s.ebookPromos).where(eq(s.ebookPromos.slug, `${tag}-activa`));
        const ev = await conn.select().from(s.ebookPromoEvents).where(eq(s.ebookPromoEvents.promoId, promo.id));
        expect(ev.map((e) => `${e.kind}:${e.source}:${e.channel ?? ""}`).sort()).toEqual(["download:instagram:", "share:directo:whatsapp", "view:whatsapp:"]);

        // Página: SEO con la portada, 404 para borrador/inexistente, sigue viva tras el cierre
        const page = await (await fetch(`${url}/promocion/${tag}-activa`)).text();
        expect(page).toContain("<title>Descarga gratis «Cuento de prueba» | Cristina Vive Consciente</title>");
        expect(page).toContain('property="og:image"');
        expect(page).not.toContain("genérico");
        expect((await fetch(`${url}/promocion/${tag}-borrador`)).status).toBe(404);
        expect((await fetch(`${url}/promocion/${tag}-terminada`)).status).toBe(200);
      } finally {
        await new Promise<void>((r) => server.close(() => r()));
      }
    } finally {
      const ids = (await conn.select({ id: s.ebookPromos.id }).from(s.ebookPromos).where(like(s.ebookPromos.slug, `${tag}%`))).map((r) => r.id);
      for (const id of ids) await conn.delete(s.ebookPromoEvents).where(eq(s.ebookPromoEvents.promoId, id));
      await conn.delete(s.ebookPromos).where(like(s.ebookPromos.slug, `${tag}%`));
      await conn.delete(s.ebooks).where(like(s.ebooks.slug, `${tag}%`));
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }, 60_000);
});
