/**
 * Promociones de ebooks: descarga gratuita por tiempo limitado.
 *
 * El SERVIDOR decide si la campaña está activa en el momento de cada petición (hora del servidor, nunca la del navegador):
 *  - GET  /api/promos/active             → aviso de la portada y de Guías digitales (solo si hay una campaña activa)
 *  - GET  /api/promos/:slug              → datos públicos de la campaña (sin la URL del PDF)
 *  - POST /api/promos/:slug/event        → visitas y clics en compartir (medición agregada y anónima)
 *  - GET  /api/promos/:slug/descarga     → entrega el PDF SOLO mientras la campaña está activa (410 después)
 *  - GET  /promocion/:slug               → la página, con título y portada para compartir en el HTML inicial
 * Todas las respuestas llevan Cache-Control: no-store para que ninguna caché mantenga viva la descarga tras el cierre.
 */
import fs from "fs";
import path from "path";
import express, { type Express, type Request, type Response } from "express";
import { and, asc, eq } from "drizzle-orm";
import { getDb } from "./db";
import { getUploadDir } from "./storage";
import { ebookPromoEvents, ebookPromos, ebooks, type EbookPromo } from "../drizzle/schema";
import { ebookImages, ebookPath, ebookPriceLabel, ebookUrlSlug } from "../shared/ebookPage";
import { PROMO_SOURCE_RE, promoPath, promoState, type PromoState } from "../shared/promo";
import { SITE_URL, injectNoindex, stripGenericSeo, escapeHtml } from "./ebookPages";

const NO_STORE = { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0", Pragma: "no-cache", Expires: "0" };

export interface PromoRow {
  promo: EbookPromo;
  ebook: typeof ebooks.$inferSelect | null;
}

export async function getPromoBySlug(slug: string): Promise<PromoRow | null> {
  const db = await getDb();
  if (!db) return null;
  const [promo] = await db.select().from(ebookPromos).where(eq(ebookPromos.slug, slug)).limit(1);
  if (!promo) return null;
  const [ebook] = await db.select().from(ebooks).where(eq(ebooks.id, promo.ebookId)).limit(1);
  return { promo, ebook: ebook ?? null };
}

/** Datos que ve el público: nunca la URL del PDF. */
export function publicPromo(row: PromoRow, now: number) {
  const { promo, ebook } = row;
  const state: PromoState = promoState(promo, now);
  return {
    slug: promo.slug,
    state,
    serverNow: now,
    startsAt: promo.startsAt,
    endsAt: promo.endsAt,
    headline: promo.headline,
    message: promo.message,
    bannerText: promo.bannerText,
    donationEnabled: promo.donationEnabled === 1,
    donationConcept: promo.donationConcept,
    ebook: ebook
      ? { title: ebook.title, synopsis: ebook.synopsis, author: ebook.author, edition: ebook.edition, subtitle: ebook.subtitle, cover: ebookImages(ebook)[0] ?? null, price: ebookPriceLabel(ebook.price), fichaPath: ebookPath(ebook.slug) }
      : null,
  };
}

/** La campaña activa que termina antes (la más urgente), o null. */
export async function getActivePromo(now: number): Promise<PromoRow | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(ebookPromos).where(eq(ebookPromos.published, 1)).orderBy(asc(ebookPromos.endsAt));
  for (const promo of rows) {
    if (promoState(promo, now) !== "active") continue;
    const [ebook] = await db.select().from(ebooks).where(and(eq(ebooks.id, promo.ebookId), eq(ebooks.status, "active"))).limit(1);
    if (ebook?.pdfUrl) return { promo, ebook };
  }
  return null;
}

export async function recordPromoEvent(promoId: number, kind: "view" | "download" | "share", source: string, channel?: string | null) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(ebookPromoEvents).values({ promoId, kind, source, channel: channel ?? null });
  } catch (err) {
    console.error("[promos] no se pudo registrar el evento", err);
  }
}

const cleanSource = (v: unknown) => (typeof v === "string" && PROMO_SOURCE_RE.test(v) ? v : "directo");
const cleanChannel = (v: unknown) => (typeof v === "string" && /^[a-z]{1,20}$/.test(v) ? v : null);

/** Ruta absoluta del PDF dentro de la carpeta de subidas; null si no es un archivo de subidas válido. */
export function resolveUploadFile(pdfUrl: string): string | null {
  if (!pdfUrl.startsWith("/uploads/")) return null;
  const root = getUploadDir();
  const abs = path.resolve(root, decodeURIComponent(pdfUrl.slice("/uploads/".length)));
  if (abs !== root && !abs.startsWith(root + path.sep)) return null; // sin salir de la carpeta
  return fs.existsSync(abs) ? abs : null;
}

export function injectPromoSeo(html: string, p: ReturnType<typeof publicPromo>): string {
  const title = `Descarga gratis «${p.ebook?.title ?? "el cuento"}» | Cristina Vive Consciente`;
  const desc = p.message.replace(/\s+/g, " ").trim().slice(0, 200);
  const url = SITE_URL + promoPath(p.slug);
  const img = p.ebook?.cover ? (/^https?:\/\//i.test(p.ebook.cover) ? p.ebook.cover : SITE_URL + (p.ebook.cover.startsWith("/") ? "" : "/") + p.ebook.cover) : null;
  const tags = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(desc)}" />`,
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Cristina Vive Consciente" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(desc)}" />`,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
    ...(img ? [`<meta property="og:image" content="${escapeHtml(img)}" />`] : []),
    `<meta name="twitter:card" content="${img ? "summary_large_image" : "summary"}" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(desc)}" />`,
    ...(img ? [`<meta name="twitter:image" content="${escapeHtml(img)}" />`] : []),
  ].join("\n    ");
  const clean = stripGenericSeo(html);
  return clean.includes("</head>") ? clean.replace("</head>", `    ${tags}\n  </head>`) : tags + clean;
}

export function registerPromoRoutes(app: Express) {
  // ── API pública ───────────────────────────────────────────────────────────
  app.get("/api/promos/active", async (_req: Request, res: Response) => {
    res.set(NO_STORE);
    const now = Date.now();
    const row = await getActivePromo(now).catch(() => null);
    if (!row) return res.json({ active: null, serverNow: now });
    res.json({ active: { slug: row.promo.slug, bannerText: row.promo.bannerText, endsAt: row.promo.endsAt, path: promoPath(row.promo.slug) }, serverNow: now });
  });

  app.get("/api/promos/:slug", async (req: Request, res: Response) => {
    res.set(NO_STORE);
    const row = await getPromoBySlug(req.params.slug).catch(() => null);
    const now = Date.now();
    if (!row || promoState(row.promo, now) === "draft") return res.status(404).json({ error: "not_found" });
    res.json(publicPromo(row, now));
  });

  app.post("/api/promos/:slug/event", express.json({ limit: "2kb" }), async (req: Request, res: Response) => {
    res.set(NO_STORE);
    const row = await getPromoBySlug(req.params.slug).catch(() => null);
    const kind = req.body?.kind;
    if (!row || promoState(row.promo, Date.now()) === "draft" || (kind !== "view" && kind !== "share")) return res.status(204).end();
    await recordPromoEvent(row.promo.id, kind, cleanSource(req.body?.source), kind === "share" ? cleanChannel(req.body?.channel) : null);
    res.status(204).end();
  });

  app.get("/api/promos/:slug/descarga", async (req: Request, res: Response) => {
    res.set(NO_STORE);
    const row = await getPromoBySlug(req.params.slug).catch(() => null);
    const now = Date.now();
    // Solo se entrega con la campaña ACTIVA en este instante (hora del servidor), aunque se conserve el enlace
    if (!row || !row.ebook?.pdfUrl || promoState(row.promo, now) !== "active") {
      return res.status(410).type("text/plain; charset=utf-8").send("La descarga gratuita ha terminado.");
    }
    const file = resolveUploadFile(row.ebook.pdfUrl);
    if (!file) return res.status(404).type("text/plain; charset=utf-8").send("El archivo no está disponible. Escribe a Cristina.");
    await recordPromoEvent(row.promo.id, "download", cleanSource(req.query.s));
    res.set({ "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${ebookUrlSlug(row.ebook.slug)}.pdf"` });
    fs.createReadStream(file).on("error", () => res.destroy()).pipe(res);
  });
}

/** GET /promocion/:slug con título y portada en el HTML inicial. Se registra antes del «fallback» que sirve index.html. */
export function registerPromoPages(app: Express, getTemplate: (req: Request) => Promise<string>) {
  {
    app.get(/^\/promocion\/([^/]+)\/?$/, async (req: Request, res: Response, next) => {
      try {
        const row = await getPromoBySlug(decodeURIComponent(req.params[0])).catch(() => null);
        const html = await getTemplate(req);
        const now = Date.now();
        res.set({ ...NO_STORE, "Content-Type": "text/html; charset=utf-8" });
        if (!row || promoState(row.promo, now) === "draft") return res.status(404).end(injectNoindex(html));
        return res.status(200).end(injectPromoSeo(html, publicPromo(row, now)));
      } catch (err) {
        next(err);
      }
    });
  }
}
