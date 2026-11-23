/**
 * Router tRPC — Ebooks → Promociones (solo admin).
 * Cristina crea, programa, duplica y mide campañas de descarga gratuita sin tocar código.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { clients, ebookPromoEvents, ebookPromoRegistrations, ebookPromos } from "../../drizzle/schema";
import { linkRegistrationToClient } from "../promoRegistrations";
import { promoState, type PromoStats } from "../../shared/promo";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx });
});

const promoInput = z.object({
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  name: z.string().min(1).max(200),
  ebookId: z.number().int().positive(),
  headline: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  bannerText: z.string().min(1).max(200),
  published: z.boolean(),
  startsAt: z.number().int().nullable(),
  endsAt: z.number().int(),
  donationEnabled: z.boolean(),
  donationConcept: z.string().min(1).max(60),
});

const toRow = (i: z.infer<typeof promoInput>) => ({
  ...i,
  published: i.published ? 1 : 0,
  donationEnabled: i.donationEnabled ? 1 : 0,
});

async function db() {
  const d = await getDb();
  if (!d) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de datos no disponible" });
  return d;
}

function checkDates(i: { startsAt: number | null; endsAt: number }) {
  if (i.startsAt != null && i.endsAt <= i.startsAt) throw new TRPCError({ code: "BAD_REQUEST", message: "El cierre debe ser posterior al inicio." });
}

async function uniqueSlug(base: string): Promise<string> {
  const d = await db();
  for (let n = 0; n < 50; n++) {
    const s = n === 0 ? base : `${base}-${n + 1}`;
    const [hit] = await d.select({ id: ebookPromos.id }).from(ebookPromos).where(eq(ebookPromos.slug, s)).limit(1);
    if (!hit) return s;
  }
  throw new TRPCError({ code: "CONFLICT", message: "No se pudo generar una URL libre." });
}

const isDup = (e: unknown) => /duplicate|ER_DUP_ENTRY/i.test(String((e as { message?: string; cause?: { message?: string } })?.message ?? "") + String((e as { cause?: { message?: string } })?.cause?.message ?? ""));

/**
 * Medición de una promoción (reutilizable en futuras campañas):
 *  - visitas: aperturas de la página pública; descargas: entregas válidas del PDF (incluye las repetidas de un mismo cliente);
 *  - clientes únicos: una vez por persona (email) y promoción entre quienes descargaron;
 *  - compartir: acciones observadas, no publicaciones confirmadas (salvo `confirmed`).
 */
export async function promoStats(promoId: number): Promise<PromoStats> {
  const d = await db();
  const rows = await d
    .select({ kind: ebookPromoEvents.kind, channel: ebookPromoEvents.channel, source: ebookPromoEvents.source, n: sql<number>`count(*)`, ok: sql<number>`sum(${ebookPromoEvents.confirmed})` })
    .from(ebookPromoEvents)
    .where(eq(ebookPromoEvents.promoId, promoId))
    .groupBy(ebookPromoEvents.kind, ebookPromoEvents.channel, ebookPromoEvents.source);
  const out: PromoStats = { views: 0, downloads: 0, uniqueClients: 0, downloadsInReview: 0, registrations: 0, review: 0, networks: {}, friends: {}, bySource: {} };
  for (const r of rows) {
    const n = Number(r.n);
    out.bySource[r.source] ??= { views: 0, downloads: 0 };
    if (r.kind === "view") { out.views += n; out.bySource[r.source].views += n; }
    else if (r.kind === "download") { out.downloads += n; out.bySource[r.source].downloads += n; }
    else if (r.channel?.startsWith("red_")) { const o = (out.networks[r.channel] ??= { count: 0, confirmed: 0 }); o.count += n; o.confirmed += Number(r.ok ?? 0); }
    else if (r.channel?.startsWith("amigo_")) { const o = (out.friends[r.channel] ??= { count: 0, confirmed: 0 }); o.count += n; o.confirmed += Number(r.ok ?? 0); }
  }
  // Clientes únicos: por ID de ficha del CRM (dos correos de la misma ficha = 1). Las descargas «en revisión» (sin ficha)
  // suman al total y pasan a clientes únicos cuando se vinculan a una ficha.
  const [u] = await d
    .select({ n: sql<number>`count(distinct ${ebookPromoRegistrations.clientId})` })
    .from(ebookPromoEvents)
    .innerJoin(ebookPromoRegistrations, eq(ebookPromoRegistrations.id, ebookPromoEvents.registrationId))
    .where(and(eq(ebookPromoEvents.promoId, promoId), eq(ebookPromoEvents.kind, "download"), isNotNull(ebookPromoRegistrations.clientId)));
  out.uniqueClients = Number(u?.n ?? 0);
  const [rv] = await d
    .select({ n: sql<number>`count(*)` })
    .from(ebookPromoEvents)
    .innerJoin(ebookPromoRegistrations, eq(ebookPromoRegistrations.id, ebookPromoEvents.registrationId))
    .where(and(eq(ebookPromoEvents.promoId, promoId), eq(ebookPromoEvents.kind, "download"), isNull(ebookPromoRegistrations.clientId)));
  out.downloadsInReview = Number(rv?.n ?? 0);
  const [g] = await d
    .select({ n: sql<number>`count(*)`, review: sql<number>`sum(${ebookPromoRegistrations.status} = 'review')` })
    .from(ebookPromoRegistrations)
    .where(eq(ebookPromoRegistrations.promoId, promoId));
  out.registrations = Number(g?.n ?? 0);
  out.review = Number(g?.review ?? 0);
  return out;
}

export const promosAdminRouter = router({
  /** Campañas con su estado actual (según la hora del servidor) y su medición. */
  list: adminProcedure.query(async () => {
    const d = await db();
    const now = Date.now();
    const promos = await d.select().from(ebookPromos).orderBy(desc(ebookPromos.endsAt));
    return Promise.all(promos.map(async (p) => ({ ...p, state: promoState(p, now), stats: await promoStats(p.id) })));
  }),

  /** Registros pendientes de identificar (varias fichas posibles): con los candidatos para elegir. */
  reviews: adminProcedure.input(z.object({ promoId: z.number().int() })).query(async ({ input }) => {
    const d = await db();
    const regs = await d.select().from(ebookPromoRegistrations).where(and(eq(ebookPromoRegistrations.promoId, input.promoId), eq(ebookPromoRegistrations.status, "review"), isNull(ebookPromoRegistrations.clientId))).orderBy(desc(ebookPromoRegistrations.id));
    const ids = Array.from(new Set(regs.flatMap((r) => (r.candidates ?? "").split(",").map(Number).filter(Boolean))));
    const cands = ids.length ? await d.select({ id: clients.id, firstName: clients.firstName, lastName: clients.lastName, email: clients.email, phone: clients.phone }).from(clients).where(inArray(clients.id, ids)) : [];
    return regs.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      createdAt: r.createdAt,
      candidates: (r.candidates ?? "").split(",").map(Number).filter(Boolean).map((id) => cands.find((c) => c.id === id)).filter(Boolean),
    }));
  }),

  /** Vincula un registro en revisión a la ficha elegida: categoría, recurso y clientes únicos. */
  linkRegistration: adminProcedure.input(z.object({ registrationId: z.number().int(), clientId: z.number().int() })).mutation(async ({ input }) => {
    try {
      return await linkRegistrationToClient(input.registrationId, input.clientId);
    } catch (e) {
      throw new TRPCError({ code: "BAD_REQUEST", message: (e as Error).message });
    }
  }),

  get: adminProcedure.input(z.object({ id: z.number().int() })).query(async ({ input }) => {
    const d = await db();
    const [p] = await d.select().from(ebookPromos).where(eq(ebookPromos.id, input.id)).limit(1);
    if (!p) throw new TRPCError({ code: "NOT_FOUND", message: "Promoción no encontrada" });
    return { ...p, state: promoState(p, Date.now()), stats: await promoStats(p.id) };
  }),

  create: adminProcedure.input(promoInput).mutation(async ({ input }) => {
    checkDates(input);
    const d = await db();
    try {
      const [r] = await d.insert(ebookPromos).values(toRow(input));
      return { id: Number((r as { insertId: number }).insertId) };
    } catch (e) {
      if (isDup(e)) throw new TRPCError({ code: "CONFLICT", message: "Ya existe una promoción con esa URL." });
      throw e;
    }
  }),

  update: adminProcedure.input(z.object({ id: z.number().int(), data: promoInput })).mutation(async ({ input }) => {
    checkDates(input.data);
    const d = await db();
    try {
      await d.update(ebookPromos).set(toRow(input.data)).where(eq(ebookPromos.id, input.id));
    } catch (e) {
      if (isDup(e)) throw new TRPCError({ code: "CONFLICT", message: "Ya existe una promoción con esa URL." });
      throw e;
    }
    return { ok: true };
  }),

  /** Copia la campaña como BORRADOR con su propia URL, para repetir el lanzamiento. */
  duplicate: adminProcedure.input(z.object({ id: z.number().int() })).mutation(async ({ input }) => {
    const d = await db();
    const [p] = await d.select().from(ebookPromos).where(eq(ebookPromos.id, input.id)).limit(1);
    if (!p) throw new TRPCError({ code: "NOT_FOUND", message: "Promoción no encontrada" });
    const slug = await uniqueSlug(`${p.slug.replace(/-copia(-\d+)?$/, "")}-copia`);
    const [r] = await d.insert(ebookPromos).values({
      slug,
      name: `${p.name} (copia)`,
      ebookId: p.ebookId,
      headline: p.headline,
      message: p.message,
      bannerText: p.bannerText,
      published: 0,
      startsAt: null,
      endsAt: p.endsAt,
      donationEnabled: p.donationEnabled,
      donationConcept: p.donationConcept,
    });
    return { id: Number((r as { insertId: number }).insertId), slug };
  }),

  delete: adminProcedure.input(z.object({ id: z.number().int() })).mutation(async ({ input }) => {
    const d = await db();
    await d.delete(ebookPromoEvents).where(eq(ebookPromoEvents.promoId, input.id));
    await d.delete(ebookPromos).where(eq(ebookPromos.id, input.id));
    return { ok: true };
  }),
});
