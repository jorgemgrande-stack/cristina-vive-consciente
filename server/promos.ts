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
import { ebookPromoEvents, ebookPromoRegistrations, ebookPromos, ebooks, type EbookPromo } from "../drizzle/schema";
import { isNull, lte, or } from "drizzle-orm";
import { findRegistrationByToken, registerPromoDownload, validateRegistration } from "./promoRegistrations";
import { enqueuePromoEmail, kickPromoEmails } from "./promoEmails";
import { clientIp } from "./_core/adminAuth";
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

export async function recordPromoEvent(promoId: number, kind: "view" | "download" | "share", source: string, channel?: string | null, extra: { registrationId?: number | null; confirmed?: boolean } = {}) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(ebookPromoEvents).values({ promoId, kind, source, channel: channel ?? null, registrationId: extra.registrationId ?? null, confirmed: extra.confirmed ? 1 : 0 });
  } catch (err) {
    console.error("[promos] no se pudo registrar el evento", err);
  }
}

const cleanSource = (v: unknown) => (typeof v === "string" && PROMO_SOURCE_RE.test(v) ? v : "directo");
/** Canales observables: «red_*» = compartir en redes, «amigo_*» = enviar a un amigo. */
const cleanChannel = (v: unknown) => (typeof v === "string" && /^(red|amigo)_[a-z]{1,20}$/.test(v) ? v : null);

/** Límite sencillo por IP para el formulario (evita altas masivas): 15 envíos por hora. */
const attempts = new Map<string, number[]>();
function tooManyAttempts(key: string, now = Date.now()) {
  const list = (attempts.get(key) ?? []).filter((t) => now - t < 3_600_000);
  list.push(now);
  attempts.set(key, list);
  return list.length > 15;
}

/** Ventana en la que repetir la misma entrega (doble clic, reintento técnico) no suma otra descarga. */
export const DOWNLOAD_DEDUPE_MS = 60_000;

/** Reserva el turno de descarga de un registro: UPDATE condicional atómico. true = esta petición es la que cuenta. */
export async function claimDownload(registrationId: number, now: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const [r] = await db
    .update(ebookPromoRegistrations)
    .set({ lastDownloadAt: now })
    .where(and(eq(ebookPromoRegistrations.id, registrationId), or(isNull(ebookPromoRegistrations.lastDownloadAt), lte(ebookPromoRegistrations.lastDownloadAt, now - DOWNLOAD_DEDUPE_MS))));
  return Number((r as { affectedRows?: number }).affectedRows ?? 0) === 1;
}

/** Devuelve el turno si la entrega falló (solo si sigue siendo el nuestro). */
export async function releaseDownload(registrationId: number, claimedAt: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(ebookPromoRegistrations).set({ lastDownloadAt: null }).where(and(eq(ebookPromoRegistrations.id, registrationId), eq(ebookPromoRegistrations.lastDownloadAt, claimedAt))).catch(() => undefined);
}

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
    const channel = kind === "share" ? cleanChannel(req.body?.channel) : null;
    if (kind === "share" && !channel) return res.status(204).end();
    await recordPromoEvent(row.promo.id, kind, cleanSource(req.body?.source), channel, { confirmed: kind === "share" && channel === "red_nativo" && req.body?.confirmed === true });
    res.status(204).end();
  });

  /** Formulario: valida en el servidor, da de alta/clasifica en el CRM y entrega el token de descarga de esta promoción. */
  app.post("/api/promos/:slug/registro", express.json({ limit: "4kb" }), async (req: Request, res: Response) => {
    res.set(NO_STORE);
    const row = await getPromoBySlug(req.params.slug).catch(() => null);
    if (!row || !row.ebook?.pdfUrl || promoState(row.promo, Date.now()) !== "active") return res.status(410).json({ error: "ended", message: "La descarga gratuita ha terminado." });
    if (tooManyAttempts(clientIp(req as never))) return res.status(429).json({ error: "rate", message: "Demasiados intentos. Prueba más tarde." });
    const v = validateRegistration(req.body ?? {});
    if (!v.ok) return res.status(400).json({ error: "invalid", errors: v.errors });
    try {
      const r = await registerPromoDownload(row.promo, row.ebook, { name: v.name, email: v.email, phone: v.phone, source: cleanSource(req.body?.source) });
      res.json({ token: r.token });
    } catch (err) {
      console.error("[promos] no se pudo guardar el registro", err);
      res.status(500).json({ error: "save", message: "No hemos podido guardar tus datos. Inténtalo de nuevo." });
    }
  });

  /**
   * Ruta protegida: exige haber completado el formulario (token) y que la campaña esté ACTIVA en este instante.
   * Cuenta una descarga solo cuando el servidor entrega el PDF desde el principio: no suman HEAD, peticiones parciales
   * (Range que no empieza en 0) ni la misma entrega repetida durante un minuto (doble clic, reintento técnico).
   */
  app.get("/api/promos/:slug/descarga", async (req: Request, res: Response) => {
    res.set(NO_STORE);
    const row = await getPromoBySlug(req.params.slug).catch(() => null);
    const now = Date.now();
    // Solo se entrega con la campaña ACTIVA en este instante (hora del servidor), aunque se conserve el enlace
    if (!row || !row.ebook?.pdfUrl || promoState(row.promo, now) !== "active") {
      return res.status(410).type("text/plain; charset=utf-8").send("La descarga gratuita ha terminado.");
    }
    const reg = await findRegistrationByToken(row.promo.id, typeof req.query.t === "string" ? req.query.t : "").catch(() => null);
    if (!reg) return res.status(403).type("text/plain; charset=utf-8").send("Completa el formulario para descargar el cuento.");
    const file = resolveUploadFile(row.ebook.pdfUrl);
    if (!file) return res.status(404).type("text/plain; charset=utf-8").send("El archivo no está disponible. Escribe a Cristina.");

    // Cuenta solo la entrega completa desde el principio (sin Range, o «bytes=0-»): no suman HEAD, peticiones parciales ni repeticiones
    const range = req.headers.range;
    const countable = req.method === "GET" && (!range || /^bytes=0-$/.test(range));
    // Reserva atómica (una sola sentencia UPDATE): de varias peticiones simultáneas solo una obtiene el turno
    const claimed = countable ? await claimDownload(reg.id, now) : false;
    if (claimed) {
      res.once("finish", () => {
        // «finish»: el servidor terminó de enviar el PDF. Solo una entrega correcta (200, o 206 completa) suma
        if (res.statusCode === 200 || res.statusCode === 206) {
          void recordPromoEvent(row.promo.id, "download", reg.source, null, { registrationId: reg.id })
            // Primera entrega correcta a esa persona: se encola el correo del cuento (sin esperar y sin afectar a la descarga)
            .then(() => enqueuePromoEmail(row.promo.id, reg.id))
            .then((queued) => { if (queued) kickPromoEmails(); })
            .catch((e) => console.error("[promos] no se pudo encolar el correo de entrega", e));
        }
        else void releaseDownload(reg.id, now);
      });
      // Conexión cortada antes de terminar (entrega fallida): no suma y se libera el turno para el reintento
      res.once("close", () => { if (!res.writableFinished) void releaseDownload(reg.id, now); });
    }
    res.sendFile(file, { cacheControl: false, headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${ebookUrlSlug(row.ebook.slug)}.pdf"`, ...NO_STORE } }, (err) => {
      if (err && !res.headersSent) res.status(500).end();
    });
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
