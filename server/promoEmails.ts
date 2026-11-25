/**
 * Correo de entrega de la promoción: bandeja de envíos con estado y reintentos.
 *
 *  - Se encola cuando el servidor TERMINA de entregar el PDF por primera vez a una persona (nunca bloquea la descarga).
 *  - Un correo por persona y promoción: clave «c:<ficha del CRM>» si está identificada, «e:<correo normalizado>» mientras el
 *    registro esté pendiente de vincular. Índice único (promoId, dedupeKey) + comprobación previa por ficha y por correo cubren
 *    descargas simultáneas, cambios de correo en la misma ficha y vinculaciones posteriores (la fila pasa de «e:» a «c:»).
 *  - Se envía con el mismo SMTP de la web (server/email.ts). Fallos transitorios: reintentos con espera creciente; permanentes
 *    o agotados: «failed». Nunca se reenvía una fila «sent».
 *  - Consultas y masajes solo si hay una autorización comercial expresa y vigente (tabla commercial_consents); con ella va el
 *    enlace de baja. Todas las personas reciben el correo del cuento tengan o no autorización.
 */
import crypto from "crypto";
import type { Express, Request, Response } from "express";
import express from "express";
import { and, eq, isNull, lte, or, sql } from "drizzle-orm";
import { getDb } from "./db";
import { commercialConsents, ebookPromoEmails, ebookPromoRegistrations, ebookPromos, ebooks, type CommercialConsent } from "../drizzle/schema";
import { ebookImages, matchesEbookSlug } from "../shared/ebookPage";
import { formatMadridDeadline, promoEmailScope } from "../shared/promo";
import { splitName } from "./clientImport";
import { isEmailConfigured, sendEmail } from "./email";
import { SITE_URL, escapeHtml } from "./ebookPages";
import { PRINTED_STORY_EBOOK_SLUG, parsePrintedStoryShippingCents } from "../shared/printedStory";
import { buildPromoStoryEmail } from "./emails/promoStory";

/** Esperas entre reintentos (ms) y máximo de intentos por correo. */
export const RETRY_DELAYS_MS = [60_000, 5 * 60_000, 30 * 60_000, 2 * 3_600_000];
export const MAX_ATTEMPTS = RETRY_DELAYS_MS.length + 1;
const STUCK_MS = 10 * 60_000;

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Base de datos no disponible");
  return db;
}
const isDup = (e: unknown) => /duplicate|ER_DUP_ENTRY/i.test(String((e as Error)?.message ?? "") + String((e as { cause?: Error })?.cause?.message ?? ""));
const abs = (u: string) => (/^https?:\/\//i.test(u) ? u : SITE_URL + (u.startsWith("/") ? "" : "/") + u);

// ── Autorización comercial ───────────────────────────────────────────────────

/**
 * Autorización comercial expresa y vigente (no retirada) de esta ficha o este correo. Con `promoId` también valen las
 * limitadas al correo de esa campaña; las de otra campaña no. Sin `promoId` solo valen las generales (sin alcance).
 */
export async function activeCommercialConsent(clientId: number | null, email: string, promoId?: number): Promise<CommercialConsent | null> {
  const db = await requireDb();
  const e = email.trim().toLowerCase();
  const scopeOk = promoId != null ? or(isNull(commercialConsents.scope), eq(commercialConsents.scope, promoEmailScope(promoId))) : isNull(commercialConsents.scope);
  const [c] = await db
    .select()
    .from(commercialConsents)
    .where(and(isNull(commercialConsents.withdrawnAt), scopeOk, clientId != null ? or(eq(commercialConsents.clientId, clientId), eq(commercialConsents.email, e)) : eq(commercialConsents.email, e)))
    .limit(1);
  return c ?? null;
}

/** Registra una autorización comercial expresa (la usarán los formularios o el CRM que la recojan). */
export async function grantCommercialConsent(i: { clientId: number | null; email: string; textVersion: string; method: string; scope?: string | null }): Promise<CommercialConsent> {
  const db = await requireDb();
  const token = crypto.randomBytes(32).toString("hex");
  await db.insert(commercialConsents).values({ clientId: i.clientId, email: i.email.trim().toLowerCase(), textVersion: i.textVersion, method: i.method, scope: i.scope ?? null, grantedAt: Date.now(), unsubscribeToken: token });
  const [c] = await db.select().from(commercialConsents).where(eq(commercialConsents.unsubscribeToken, token)).limit(1);
  return c;
}

/** Retira la autorización de ese enlace de baja (y las demás de la misma ficha o correo). */
export async function withdrawCommercialConsent(token: string): Promise<boolean> {
  if (!/^[a-f0-9]{64}$/.test(token)) return false;
  const db = await requireDb();
  const [c] = await db.select().from(commercialConsents).where(eq(commercialConsents.unsubscribeToken, token)).limit(1);
  if (!c) return false;
  const now = Date.now();
  await db.update(commercialConsents).set({ withdrawnAt: now }).where(and(isNull(commercialConsents.withdrawnAt), c.clientId != null ? or(eq(commercialConsents.clientId, c.clientId), eq(commercialConsents.email, c.email)) : eq(commercialConsents.email, c.email)));
  return true;
}

// ── Encolado (con deduplicación) ─────────────────────────────────────────────

/** Mutex en el proceso: dos descargas simultáneas de la misma persona se encolan una detrás de otra. */
let queue: Promise<unknown> = Promise.resolve();
function serialized<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

export function dedupeKey(clientId: number | null, email: string): string {
  return clientId != null ? `c:${clientId}` : `e:${email.trim().toLowerCase()}`;
}

/**
 * Encola el correo de la primera descarga válida de esta persona. No hace nada si la promoción no lo tiene activado
 * o si ya se encoló/envió uno a esa ficha o a ese correo. Devuelve true si se creó una fila nueva.
 */
export function enqueuePromoEmail(promoId: number, registrationId: number): Promise<boolean> {
  return serialized(async () => {
    const db = await requireDb();
    const [promo] = await db.select().from(ebookPromos).where(eq(ebookPromos.id, promoId)).limit(1);
    if (!promo || promo.sendDeliveryEmail !== 1) return false;
    const [reg] = await db.select().from(ebookPromoRegistrations).where(eq(ebookPromoRegistrations.id, registrationId)).limit(1);
    if (!reg) return false;
    const email = reg.email.trim().toLowerCase();
    // ¿Ya hay envío para esta ficha o para este correo en esta promoción? (cubre cambios de correo dentro de la misma ficha)
    const [prev] = await db
      .select({ id: ebookPromoEmails.id })
      .from(ebookPromoEmails)
      .where(and(eq(ebookPromoEmails.promoId, promoId), or(eq(ebookPromoEmails.email, email), eq(ebookPromoEmails.dedupeKey, dedupeKey(reg.clientId, email)), reg.clientId != null ? eq(ebookPromoEmails.clientId, reg.clientId) : undefined)))
      .limit(1);
    if (prev) return false;
    const consent = await activeCommercialConsent(reg.clientId, email, promoId);
    try {
      await db.insert(ebookPromoEmails).values({
        promoId,
        registrationId,
        clientId: reg.clientId,
        dedupeKey: dedupeKey(reg.clientId, email),
        email,
        name: reg.name,
        status: "pending",
        showServices: consent ? 1 : 0,
        nextAttemptAt: Date.now(),
      });
    } catch (e) {
      if (isDup(e)) return false; // otra petición ya lo encoló
      throw e;
    }
    return true;
  });
}

/** Al vincular un registro en revisión a una ficha, su envío pasa a depender de la ficha (no se vuelve a enviar a esa persona). */
export async function relinkPromoEmail(promoId: number, email: string, clientId: number): Promise<void> {
  const db = await requireDb();
  try {
    await db
      .update(ebookPromoEmails)
      .set({ clientId, dedupeKey: dedupeKey(clientId, email) })
      .where(and(eq(ebookPromoEmails.promoId, promoId), eq(ebookPromoEmails.email, email.trim().toLowerCase()), isNull(ebookPromoEmails.clientId)));
  } catch (e) {
    if (!isDup(e)) throw e; // la ficha ya tenía su envío: la fila del correo se queda como está
  }
}

// ── Envío con reintentos ─────────────────────────────────────────────────────

/** ¿El fallo merece reintento? Rechazos definitivos del servidor (5xx, destinatario inválido) no. */
export function isTransientMailError(err: unknown): boolean {
  const e = err as { responseCode?: number; code?: string; command?: string };
  if (typeof e?.responseCode === "number") return e.responseCode >= 400 && e.responseCode < 500; // 4xx: «inténtalo luego»; 5xx: rechazo definitivo
  if (e?.code === "EENVELOPE" || e?.code === "EMESSAGE") return false;
  return true; // conexión, tiempo de espera, DNS…
}

/** Envía una fila ya reservada. */
async function deliver(row: typeof ebookPromoEmails.$inferSelect): Promise<void> {
  const db = await requireDb();
  const [promo] = await db.select().from(ebookPromos).where(eq(ebookPromos.id, row.promoId)).limit(1);
  const [reg] = await db.select().from(ebookPromoRegistrations).where(eq(ebookPromoRegistrations.id, row.registrationId)).limit(1);
  const [ebook] = promo ? await db.select().from(ebooks).where(eq(ebooks.id, promo.ebookId)).limit(1) : [];
  if (!promo || !reg || !ebook) throw Object.assign(new Error("Promoción o registro no encontrado"), { code: "EMESSAGE" });
  // El enlace personal solo funciona mientras la campaña esté activa: después de cerrar no tiene sentido enviarlo
  if (Date.now() >= promo.endsAt) {
    await db.update(ebookPromoEmails).set({ status: "skipped", lastError: "Campaña cerrada: el enlace ya no funcionaría" }).where(eq(ebookPromoEmails.id, row.id));
    return;
  }
  // La autorización se vuelve a comprobar al enviar: si la retiró entre tanto, no se muestran las tarjetas
  const consent = await activeCommercialConsent(row.clientId, row.email, row.promoId);
  const cover = ebookImages(ebook)[0];
  const mail = buildPromoStoryEmail({
    name: splitName(row.name).firstName || row.name,
    ebookTitle: ebook.title,
    headline: promo.headline,
    coverUrl: cover ? abs(cover) : null,
    downloadUrl: `${SITE_URL}/api/promos/${promo.slug}/descarga?t=${reg.token}&s=correo`,
    expiryText: `Este enlace funciona hasta el ${formatMadridDeadline(promo.endsAt)} (hora peninsular).`,
    showServices: !!consent,
    printedShippingCents: ebook.status === "active" && matchesEbookSlug(ebook.slug, PRINTED_STORY_EBOOK_SLUG)
      ? parsePrintedStoryShippingCents(process.env.PRINTED_STORY_SHIPPING_CENTS)
      : null,
    unsubscribeUrl: consent ? `${SITE_URL}/baja?t=${consent.unsubscribeToken}` : undefined,
  });
  await sendEmail({ to: row.email, subject: mail.subject, html: mail.html, text: mail.text });
  await db.update(ebookPromoEmails).set({ status: "sent", sentAt: Date.now(), lastError: null, showServices: consent ? 1 : 0 }).where(eq(ebookPromoEmails.id, row.id));
}

/**
 * Procesa los envíos pendientes y vencidos. Cada fila se RESERVA con un UPDATE condicional (solo una ejecución la toma),
 * así que ni el temporizador ni el disparo inmediato pueden duplicar un correo. Los «sending» olvidados vuelven a pendientes.
 */
export async function processPromoEmails(opts: { now?: number; limit?: number } = {}): Promise<{ sent: number; retried: number; failed: number; skipped: number }> {
  const now = opts.now ?? Date.now();
  const res = { sent: 0, retried: 0, failed: 0, skipped: 0 };
  const db = await requireDb();
  await db.update(ebookPromoEmails).set({ status: "pending" }).where(and(eq(ebookPromoEmails.status, "sending"), lte(ebookPromoEmails.nextAttemptAt, now - STUCK_MS)));
  const due = await db
    .select()
    .from(ebookPromoEmails)
    .where(and(eq(ebookPromoEmails.status, "pending"), or(isNull(ebookPromoEmails.nextAttemptAt), lte(ebookPromoEmails.nextAttemptAt, now))))
    .limit(opts.limit ?? 20);
  for (const row of due) {
    const [claim] = await db
      .update(ebookPromoEmails)
      .set({ status: "sending", nextAttemptAt: now, attempts: sql`${ebookPromoEmails.attempts} + 1` })
      .where(and(eq(ebookPromoEmails.id, row.id), eq(ebookPromoEmails.status, "pending")));
    if (Number((claim as { affectedRows?: number }).affectedRows ?? 0) !== 1) continue; // otro proceso lo tomó
    const attempt = row.attempts + 1;
    try {
      if (!isEmailConfigured()) {
        await db.update(ebookPromoEmails).set({ status: "skipped", lastError: "Correo no configurado en este entorno (SMTP)" }).where(eq(ebookPromoEmails.id, row.id));
        res.skipped++;
        continue;
      }
      await deliver({ ...row, attempts: attempt });
      const [after] = await db.select({ status: ebookPromoEmails.status }).from(ebookPromoEmails).where(eq(ebookPromoEmails.id, row.id)).limit(1);
      if (after?.status === "skipped") res.skipped++;
      else res.sent++;
    } catch (err) {
      const msg = String((err as Error)?.message ?? err).slice(0, 280);
      if (isTransientMailError(err) && attempt < MAX_ATTEMPTS) {
        await db.update(ebookPromoEmails).set({ status: "pending", lastError: msg, nextAttemptAt: now + RETRY_DELAYS_MS[attempt - 1] }).where(eq(ebookPromoEmails.id, row.id));
        res.retried++;
      } else {
        await db.update(ebookPromoEmails).set({ status: "failed", lastError: msg }).where(eq(ebookPromoEmails.id, row.id));
        res.failed++;
      }
    }
  }
  return res;
}

/** Dispara el procesado sin esperar y sin que un fallo afecte a quien lo llama (la descarga ya terminó). */
export function kickPromoEmails(): void {
  void processPromoEmails().catch((e) => console.error("[promoEmails] error procesando la bandeja", e));
}

// ── Enlace de baja de información comercial ──────────────────────────────────

const page = (body: string) => `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Información comercial · Cristina Vive Consciente</title></head><body style="margin:0;background:#f3eee5;font-family:Georgia,serif;color:#28221a"><div style="max-width:480px;margin:60px auto;background:#fcfaf6;padding:32px;border:1px solid #e7ddcf">${body}</div></body></html>`;

export function registerUnsubscribeRoutes(app: Express) {
  // GET solo muestra la confirmación (los antivirus de correo abren los enlaces: no se da de baja a nadie sin pulsar)
  app.get("/baja", (req: Request, res: Response) => {
    const t = typeof req.query.t === "string" ? req.query.t : "";
    res.set({ "Cache-Control": "no-store" }).type("html").send(page(`<h1 style="font-weight:400;font-size:24px;margin:0 0 12px">Dejar de recibir información comercial</h1><p style="font-family:Arial,sans-serif;line-height:1.6">Seguirás recibiendo los correos de lo que solicites (como la entrega de un cuento), pero no información sobre consultas, masajes u otros servicios.</p><form method="post" action="/baja"><input type="hidden" name="t" value="${escapeHtml(t)}"><button style="background:#24482c;color:#fff;border:0;padding:12px 20px;font-size:15px;cursor:pointer">Confirmar baja</button></form>`));
  });
  app.post("/baja", express.urlencoded({ extended: false, limit: "2kb" }), async (req: Request, res: Response) => {
    const ok = await withdrawCommercialConsent(typeof req.body?.t === "string" ? req.body.t : "").catch(() => false);
    res.set({ "Cache-Control": "no-store" }).status(ok ? 200 : 404).type("html").send(page(ok ? `<h1 style="font-weight:400;font-size:24px;margin:0 0 12px">Listo</h1><p style="font-family:Arial,sans-serif">Ya no recibirás información comercial. Puedes escribirnos a hola@cristinaviveconsciente.es si necesitas algo más.</p>` : `<h1 style="font-weight:400;font-size:24px;margin:0 0 12px">Enlace no válido</h1><p style="font-family:Arial,sans-serif">Escribe a hola@cristinaviveconsciente.es y lo gestionamos.</p>`));
  });
}

