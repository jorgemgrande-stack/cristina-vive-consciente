/**
 * Router tRPC — Ebooks → Promociones (solo admin).
 * Cristina crea, programa, duplica y mide campañas de descarga gratuita sin tocar código.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { asc, desc, eq, sql } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { ebookPromoEvents, ebookPromos } from "../../drizzle/schema";
import { promoState } from "../../shared/promo";

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

export const promosAdminRouter = router({
  /** Campañas con su estado actual (según la hora del servidor) y su medición. */
  list: adminProcedure.query(async () => {
    const d = await db();
    const now = Date.now();
    const promos = await d.select().from(ebookPromos).orderBy(desc(ebookPromos.endsAt));
    const events = await d
      .select({ promoId: ebookPromoEvents.promoId, kind: ebookPromoEvents.kind, source: ebookPromoEvents.source, n: sql<number>`count(*)` })
      .from(ebookPromoEvents)
      .groupBy(ebookPromoEvents.promoId, ebookPromoEvents.kind, ebookPromoEvents.source)
      .orderBy(asc(ebookPromoEvents.promoId));
    return promos.map((p) => {
      const ev = events.filter((e) => e.promoId === p.id);
      const total = (k: string) => ev.filter((e) => e.kind === k).reduce((a, e) => a + Number(e.n), 0);
      const bySource: Record<string, { view: number; download: number; share: number }> = {};
      for (const e of ev) {
        bySource[e.source] ??= { view: 0, download: 0, share: 0 };
        bySource[e.source][e.kind] += Number(e.n);
      }
      return { ...p, state: promoState(p, now), views: total("view"), downloads: total("download"), shares: total("share"), bySource };
    });
  }),

  get: adminProcedure.input(z.object({ id: z.number().int() })).query(async ({ input }) => {
    const d = await db();
    const [p] = await d.select().from(ebookPromos).where(eq(ebookPromos.id, input.id)).limit(1);
    if (!p) throw new TRPCError({ code: "NOT_FOUND", message: "Promoción no encontrada" });
    return { ...p, state: promoState(p, Date.now()) };
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
