/**
 * Correo de entrega del cuento: plantilla, deduplicación por persona y promoción, reintentos, disparo solo con entrega correcta
 * del PDF y tarjetas de servicios solo con autorización comercial vigente. La parte con BD corre con SITE_TEST_DATABASE_URL.
 */
import { describe, expect, it, vi } from "vitest";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { AddressInfo } from "node:net";
import { buildPromoStoryEmail, renderTemplate } from "./emails/promoStory";

const base = {
  name: "Ana",
  ebookTitle: "Los cuatro regalos de la Tierra",
  headline: "Hay regalos que\nno se envuelven.",
  coverUrl: "https://cristinaviveconsciente.es/uploads/portada.jpg",
  downloadUrl: "https://cristinaviveconsciente.es/api/promos/x/descarga?t=abc&s=correo",
  expiryText: "Este enlace funciona hasta el jueves 26 de noviembre a las 23:59 (hora peninsular).",
};

describe("plantilla del correo", () => {
  it("asunto, portada, botón, nota de Cristina y plazo; sin tarjetas ni baja si no hay autorización; sin adjuntos", () => {
    const m = buildPromoStoryEmail({ ...base, showServices: false });
    expect(m.subject).toBe("Tu cuento de regalo · Los cuatro regalos de la Tierra");
    expect(m.html).toContain('src="https://cristinaviveconsciente.es/uploads/portada.jpg"');
    expect(m.html).toContain("Descargar mi cuento");
    expect(m.html).toContain('href="https://cristinaviveconsciente.es/api/promos/x/descarga?t=abc&amp;s=correo"');
    expect(m.html).toContain("Hola, Ana:");
    expect(m.html).toContain("jueves 26 de noviembre a las 23:59");
    expect(m.html).toContain('<em style="color:#315839;">no se envuelven.</em>');
    expect(m.html).toContain("background-color:#f3eee5"); // fondo crema de la plantilla
    expect(m.html).not.toContain("¿Te apetece conocer mi trabajo?");
    expect(m.html).not.toContain("Ver consultas");
    expect(m.html).not.toContain("instagram.com"); // Instagram, tarjetas y baja solo con autorización comercial
    expect(m.text).not.toContain("instagram");
    expect(m.html).not.toContain("Dejar de recibir información comercial");
    expect(m.html).not.toMatch(/\{\{|\}\}/);
    expect(m.text).toContain("Descargar mi cuento:");
  });
  it("con autorización: tarjetas de consultas y masajes y enlace de baja", () => {
    const m = buildPromoStoryEmail({ ...base, showServices: true, unsubscribeUrl: "https://cristinaviveconsciente.es/baja?t=zzz" });
    expect(m.html).toContain("¿Te apetece conocer mi trabajo?");
    expect(m.html).toContain("https://cristinaviveconsciente.es/consultas");
    expect(m.html).toContain("https://cristinaviveconsciente.es/masajes");
    expect(m.html).toContain("https://cristinaviveconsciente.es/baja?t=zzz");
    expect(m.html).toContain("Seguir a Cristina en Instagram");
    expect(m.html).toContain("https://www.instagram.com/cristina.viveconsciente/");
    // Orden: botón del cuento → firma → Instagram → Consultas y Masajes → baja
    const at = (t: string) => m.html.indexOf(t);
    expect(at("Descargar mi cuento")).toBeLessThan(at("Un abrazo"));
    expect(at("Un abrazo")).toBeLessThan(at("Seguir a Cristina en Instagram"));
    expect(at("Seguir a Cristina en Instagram")).toBeLessThan(at("Ver consultas"));
    expect(at("Ver masajes")).toBeLessThan(at("Dejar de recibir información comercial"));
    expect(m.text).toContain("https://www.instagram.com/cristina.viveconsciente/");
    expect(m.text).toContain("Dejar de recibir información comercial");
  });
  it("escapa el nombre y no deja huecos sin portada", () => {
    const m = buildPromoStoryEmail({ ...base, name: '<b>"Ana"</b>', coverUrl: null, showServices: false });
    expect(m.html).toContain("Hola, &lt;b&gt;&quot;Ana&quot;&lt;/b&gt;:");
    expect(m.html).not.toContain('class="column cover"');
    expect(renderTemplate("{{#if a}}X{{/if}}{{b}}", { a: false, b: "<" })).toBe("&lt;");
  });
});

const URL = process.env.SITE_TEST_DATABASE_URL;
const d = describe.runIf(!!URL && /(_test|test_)/.test(URL ?? ""));

d("bandeja de envíos (BD de pruebas)", () => {
  it("un correo por persona, reintentos sin duplicar, disparo solo con entrega correcta y tarjetas solo con autorización", async () => {
    process.env.DATABASE_URL = URL;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "promo-mail-"));
    process.env.UPLOAD_DIR = dir;
    fs.mkdirSync(path.join(dir, "files"), { recursive: true });
    fs.writeFileSync(path.join(dir, "files", "grande.pdf"), Buffer.concat([Buffer.from("%PDF-1.4 grande\n"), Buffer.alloc(24 * 1024 * 1024, 65)]));

    const nodemailer = (await import("nodemailer")).default;
    const { __setMailTransportForTests } = await import("./email");
    const sent: { to: string; subject: string; html: string; text: string; attachments?: unknown[] }[] = [];
    let failWith: unknown = null;
    const json = nodemailer.createTransport({ jsonTransport: true });
    __setMailTransportForTests({
      sendMail: async (o: unknown) => {
        if (failWith) throw failWith;
        const info = (await json.sendMail(o as never)) as { message: string };
        const msg = JSON.parse(info.message);
        const first = Array.isArray(msg.to) ? msg.to[0] : msg.to;
        sent.push({ ...msg, to: typeof first === "string" ? first : first?.address });
        return info;
      },
    });

    const { default: express } = await import("express");
    const { registerPromoRoutes } = await import("./promos");
    const pe = await import("./promoEmails");
    const { linkRegistrationToClient } = await import("./promoRegistrations");
    const dbm = await import("./db");
    const s = await import("../drizzle/schema");
    const { eq, inArray, like } = await import("drizzle-orm");
    const conn = (await dbm.getDb())!;
    const tag = `pm${Date.now()}`;
    const now = Date.now();

    const [er] = await conn.insert(s.ebooks).values({ slug: `${tag}_cuento`, title: "Cuento de prueba", price: "9.90", priceCents: 990, status: "active", pdfUrl: "/uploads/files/grande.pdf", coverImage: "/uploads/portada.jpg" });
    const ebookId = Number((er as { insertId: number }).insertId);
    const mkPromo = async (slug: string, over: Partial<typeof s.ebookPromos.$inferInsert> = {}) => {
      await conn.insert(s.ebookPromos).values({ slug: `${tag}-${slug}`, name: "P", ebookId, headline: "Hay regalos que\nno se envuelven.", message: "M", bannerText: "B", published: 1, endsAt: now + 3_600_000, sendDeliveryEmail: 1, ...over });
      return (await conn.select().from(s.ebookPromos).where(eq(s.ebookPromos.slug, `${tag}-${slug}`)))[0];
    };
    const clientIds: number[] = [];
    const mkClient = async (email: string) => {
      const [r] = await conn.insert(s.clients).values({ firstName: "C", lastName: tag, email, status: "active" });
      const id = Number((r as { insertId: number }).insertId);
      clientIds.push(id);
      return id;
    };
    let tokN = 0;
    const mkReg = async (promoId: number, email: string, clientId: number | null, status: "linked" | "created" | "review" = "linked") => {
      const token = (++tokN).toString(16).padStart(64, "0");
      await conn.insert(s.ebookPromoRegistrations).values({ promoId, clientId, name: "Marta Soto", email, phone: "+34600000001", source: "red_x", status, token });
      return (await conn.select().from(s.ebookPromoRegistrations).where(eq(s.ebookPromoRegistrations.token, token)))[0];
    };
    const rows = (promoId: number) => conn.select().from(s.ebookPromoEmails).where(eq(s.ebookPromoEmails.promoId, promoId));

    try {
      const promo = await mkPromo("a");
      const off = await mkPromo("off", { sendDeliveryEmail: 0 });

      // 1) Deduplicación: mismo correo, misma ficha con dos correos, y simultaneidad
      const c1 = await mkClient(`${tag}.c1@t.es`);
      const r1 = await mkReg(promo.id, `${tag}.c1@t.es`, c1);
      const r1b = await mkReg(promo.id, `${tag}.c1.otro@t.es`, c1); // cambio de correo en la misma ficha
      const r1c = await mkReg(promo.id, `${tag}.C1@t.es`, c1); // mismo correo con otras mayúsculas
      const burst = await Promise.all([r1, r1, r1b, r1c, r1, r1b].map((r) => pe.enqueuePromoEmail(promo.id, r.id)));
      expect(burst.filter(Boolean)).toHaveLength(1);
      expect(await rows(promo.id)).toHaveLength(1);
      // sin activar en la promoción: no se encola nada
      const rOff = await mkReg(off.id, `${tag}.off@t.es`, null, "created");
      expect(await pe.enqueuePromoEmail(off.id, rOff.id)).toBe(false);

      // 2) Registro en revisión (sin ficha): clave por correo; al vincular pasa a depender de la ficha y no se repite
      const rRev = await mkReg(promo.id, `${tag}.rev@t.es`, null, "review");
      expect(await pe.enqueuePromoEmail(promo.id, rRev.id)).toBe(true);
      expect(await pe.enqueuePromoEmail(promo.id, rRev.id)).toBe(false);
      const c2 = await mkClient(`${tag}.c2@t.es`);
      await linkRegistrationToClient(rRev.id, c2);
      const rev = (await rows(promo.id)).find((r) => r.email === `${tag}.rev@t.es`)!;
      expect(rev).toMatchObject({ clientId: c2, dedupeKey: `c:${c2}` });
      const r2 = await mkReg(promo.id, `${tag}.c2.nuevo@t.es`, c2); // la ficha vinculada descarga luego con otro correo
      expect(await pe.enqueuePromoEmail(promo.id, r2.id)).toBe(false);
      expect(await rows(promo.id)).toHaveLength(2);

      // 3) Envío: tres procesadores a la vez → un solo correo por fila; sin adjuntos y con el enlace personal
      const results = await Promise.all([pe.processPromoEmails(), pe.processPromoEmails(), pe.processPromoEmails()]);
      expect(results.reduce((a, r) => a + r.sent, 0)).toBe(2);
      expect(sent).toHaveLength(2);
      const m1 = sent.find((m) => m.to === `${tag}.c1@t.es`)!;
      expect(m1.subject).toBe("Tu cuento de regalo · Cuento de prueba");
      expect(m1.attachments ?? []).toHaveLength(0);
      expect(m1.html).toContain(`/api/promos/${tag}-a/descarga?t=${r1.token}`);
      expect(m1.html).toContain("hasta el");
      expect(m1.html).not.toContain("¿Te apetece conocer mi trabajo?");
      expect(m1.html).not.toContain("instagram.com");
      expect((await rows(promo.id)).every((r) => r.status === "sent" && r.attempts === 1)).toBe(true);
      expect((await pe.processPromoEmails()).sent).toBe(0); // nada que reenviar

      // 4) Reintentos: fallo transitorio → pendiente con espera; luego se envía una sola vez. Permanente → fallido sin reintento
      const c3 = await mkClient(`${tag}.c3@t.es`);
      const r3 = await mkReg(promo.id, `${tag}.c3@t.es`, c3);
      await pe.enqueuePromoEmail(promo.id, r3.id);
      failWith = Object.assign(new Error("421 try later"), { responseCode: 421 });
      expect(await pe.processPromoEmails()).toMatchObject({ sent: 0, retried: 1 });
      let row3 = (await rows(promo.id)).find((r) => r.email === `${tag}.c3@t.es`)!;
      expect(row3).toMatchObject({ status: "pending", attempts: 1 });
      expect(row3.nextAttemptAt!).toBeGreaterThan(Date.now());
      expect((await pe.processPromoEmails()).retried).toBe(0); // todavía no toca
      failWith = null;
      const before = sent.length;
      expect((await pe.processPromoEmails({ now: Date.now() + 120_000 })).sent).toBe(1);
      expect(sent.length).toBe(before + 1);
      const c4 = await mkClient(`${tag}.c4@t.es`);
      const r4 = await mkReg(promo.id, `${tag}.c4@t.es`, c4);
      await pe.enqueuePromoEmail(promo.id, r4.id);
      failWith = Object.assign(new Error("550 no such user"), { responseCode: 550 });
      expect(await pe.processPromoEmails()).toMatchObject({ failed: 1, retried: 0 });
      failWith = null;
      expect((await rows(promo.id)).find((r) => r.email === `${tag}.c4@t.es`)).toMatchObject({ status: "failed", attempts: 1 });

      // 5) Autorización comercial: solo quien la tiene (y vigente) ve las tarjetas y el enlace de baja
      const c5 = await mkClient(`${tag}.c5@t.es`);
      const consent = await pe.grantCommercialConsent({ clientId: c5, email: `${tag}.c5@t.es`, textVersion: "v1", method: "prueba" });
      const r5 = await mkReg(promo.id, `${tag}.c5@t.es`, c5);
      await pe.enqueuePromoEmail(promo.id, r5.id);
      await pe.processPromoEmails();
      const m5 = sent.find((m) => m.to === `${tag}.c5@t.es`)!;
      expect(m5.html).toContain("¿Te apetece conocer mi trabajo?");
      expect(m5.html).toContain("Seguir a Cristina en Instagram");
      expect(m5.html).toContain(`/baja?t=${consent.unsubscribeToken}`);
      // retirada por el enlace de baja (GET solo confirma; POST retira) → la siguiente persona de esa ficha ya no las ve
      const app0 = express();
      pe.registerUnsubscribeRoutes(app0);
      const srv0 = http.createServer(app0);
      await new Promise<void>((r) => srv0.listen(0, r));
      const b0 = `http://127.0.0.1:${(srv0.address() as AddressInfo).port}`;
      try {
        expect(await (await fetch(`${b0}/baja?t=${consent.unsubscribeToken}`)).text()).toContain("Confirmar baja");
        expect(await pe.activeCommercialConsent(c5, `${tag}.c5@t.es`)).not.toBeNull(); // un GET no da de baja
        const out = await fetch(`${b0}/baja`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: `t=${consent.unsubscribeToken}` });
        expect(out.status).toBe(200);
        expect(await pe.activeCommercialConsent(c5, `${tag}.c5@t.es`)).toBeNull();
        expect((await fetch(`${b0}/baja`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "t=nope" })).status).toBe(404);
      } finally {
        await new Promise<void>((r) => srv0.close(() => r()));
      }

      // 6) Campaña cerrada: el enlace ya no funcionaría → no se envía
      const closed = await mkPromo("cerrada", { endsAt: now + 100 });
      const c6 = await mkClient(`${tag}.c6@t.es`);
      const r6 = await mkReg(closed.id, `${tag}.c6@t.es`, c6);
      await pe.enqueuePromoEmail(closed.id, r6.id);
      await pe.processPromoEmails({ now: now + 5_000 });
      expect((await rows(closed.id))[0]).toMatchObject({ status: "skipped" });

      // 7) Disparo desde la descarga real: interrumpida → nada; completa → un correo; la descarga no depende del correo
      const app = express();
      registerPromoRoutes(app);
      const server = http.createServer(app);
      await new Promise<void>((r) => server.listen(0, r));
      const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
      try {
        const c7 = await mkClient(`${tag}.c7@t.es`);
        const r7 = await mkReg(promo.id, `${tag}.c7@t.es`, c7);
        const dl = `${url}/api/promos/${tag}-a/descarga?t=${r7.token}`;
        const emailsFor = async (email: string) => (await rows(promo.id)).filter((r) => r.email === email);
        await new Promise<void>((resolve) => {
          const req = http.get(dl, (res) => { res.once("data", () => { req.destroy(); resolve(); }); });
          req.on("error", () => resolve());
        });
        await new Promise((r) => setTimeout(r, 700));
        expect(await emailsFor(`${tag}.c7@t.es`)).toHaveLength(0); // descarga interrumpida: no hay correo
        const sentBefore = sent.length;
        const two = await Promise.all([fetch(dl), fetch(dl)]);
        for (const r of two) expect((await r.arrayBuffer()).byteLength).toBeGreaterThan(24 * 1024 * 1024);
        await vi.waitFor(async () => expect((await emailsFor(`${tag}.c7@t.es`))[0]?.status).toBe("sent"));
        await new Promise((r) => setTimeout(r, 400));
        expect(await emailsFor(`${tag}.c7@t.es`)).toHaveLength(1); // dos descargas simultáneas, un solo envío
        expect(sent.length).toBe(sentBefore + 1);
        // el correo falla, pero la descarga de otra persona sigue siendo inmediata y completa
        failWith = Object.assign(new Error("421 caído"), { responseCode: 421 });
        const c8 = await mkClient(`${tag}.c8@t.es`);
        const r8 = await mkReg(promo.id, `${tag}.c8@t.es`, c8);
        const resp = await fetch(`${url}/api/promos/${tag}-a/descarga?t=${r8.token}`);
        expect(resp.status).toBe(200);
        expect((await resp.arrayBuffer()).byteLength).toBeGreaterThan(24 * 1024 * 1024);
        await vi.waitFor(async () => expect((await emailsFor(`${tag}.c8@t.es`))[0]?.status).toBe("pending")); // queda para reintento
        failWith = null;
      } finally {
        await new Promise<void>((r) => server.close(() => r()));
      }
    } finally {
      __setMailTransportForTests(null);
      const promos = await conn.select({ id: s.ebookPromos.id }).from(s.ebookPromos).where(like(s.ebookPromos.slug, `${tag}%`));
      const pids = promos.map((p) => p.id);
      if (pids.length) {
        await conn.delete(s.ebookPromoEmails).where(inArray(s.ebookPromoEmails.promoId, pids));
        await conn.delete(s.ebookPromoEvents).where(inArray(s.ebookPromoEvents.promoId, pids));
        await conn.delete(s.ebookPromoRegistrations).where(inArray(s.ebookPromoRegistrations.promoId, pids));
      }
      if (clientIds.length) {
        await conn.delete(s.commercialConsents).where(inArray(s.commercialConsents.clientId, clientIds));
        await conn.delete(s.clientServices).where(inArray(s.clientServices.clientId, clientIds));
        await conn.delete(s.clientCategories).where(inArray(s.clientCategories.clientId, clientIds));
        await conn.delete(s.clients).where(inArray(s.clients.id, clientIds));
      }
      await conn.delete(s.serviceCatalog).where(like(s.serviceCatalog.slug, `promo-${tag}%`));
      await conn.delete(s.ebookPromos).where(like(s.ebookPromos.slug, `${tag}%`));
      await conn.delete(s.ebooks).where(eq(s.ebooks.id, ebookId));
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }, 180_000);
});
