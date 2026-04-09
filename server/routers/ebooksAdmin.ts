/**
 * Router tRPC — Ebooks (Guías Digitales)
 * CRUD completo para gestión de ebooks desde el CRM.
 * El listado público no requiere autenticación.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  listEbooks,
  getEbookById,
  getEbookBySlug,
  createEbook,
  updateEbook,
  deleteEbook,
  toggleEbookStatus,
} from "../db";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx });
});

// ── Input schema ──────────────────────────────────────────────────────────────
const ebookInput = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9_]+$/, "Solo letras minúsculas, números y guiones bajos"),
  title: z.string().min(1).max(200),
  subtitle: z.string().max(300).optional().nullable(),
  description: z.string().optional().nullable(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Precio inválido"),
  priceCents: z.number().int().min(1),
  currency: z.string().length(3).default("EUR"),
  stripePriceId: z.string().max(100).optional().nullable(),
  pdfUrl: z.string().optional().nullable(),
  coverImage: z.string().optional().nullable(),
  galleryImages: z.string().optional().nullable(), // JSON array string
  downloadExpiryHours: z.number().int().min(1).default(72),
  crmTag: z.string().max(100).optional().nullable(),
  includesSession: z.boolean().default(false),
  status: z.enum(["active", "inactive"]).default("active"),
  sortOrder: z.number().int().min(0).default(0),
});

// ── Router ────────────────────────────────────────────────────────────────────
export const ebooksAdminRouter = router({
  // ── Público: listado de ebooks activos ────────────────────────────────────
  list: publicProcedure.query(async () => {
    return listEbooks(true); // solo activos
  }),

  // ── Público: obtener un ebook por slug ────────────────────────────────────
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const ebook = await getEbookBySlug(input.slug);
      if (!ebook || ebook.status !== "active") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ebook no encontrado" });
      }
      return ebook;
    }),

  // ── Admin: listado completo (activos e inactivos) ─────────────────────────
  listAdmin: adminProcedure.query(async () => {
    return listEbooks(false);
  }),

  // ── Admin: obtener un ebook por ID ────────────────────────────────────────
  get: adminProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ input }) => {
      const ebook = await getEbookById(input.id);
      if (!ebook) throw new TRPCError({ code: "NOT_FOUND", message: "Ebook no encontrado" });
      return ebook;
    }),

  // ── Admin: crear ebook ────────────────────────────────────────────────────
  create: adminProcedure
    .input(ebookInput)
    .mutation(async ({ input }) => {
      const id = await createEbook({
        slug: input.slug,
        title: input.title,
        subtitle: input.subtitle ?? null,
        description: input.description ?? null,
        price: input.price,
        priceCents: input.priceCents,
        currency: input.currency,
        stripePriceId: input.stripePriceId ?? null,
        pdfUrl: input.pdfUrl || null,
        coverImage: input.coverImage || null,
        galleryImages: input.galleryImages ?? null,
        downloadExpiryHours: input.downloadExpiryHours,
        crmTag: input.crmTag ?? null,
        includesSession: input.includesSession ? 1 : 0,
        status: input.status,
        sortOrder: input.sortOrder,
      });
      const ebook = await getEbookById(id);
      if (!ebook) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return ebook;
    }),

  // ── Admin: actualizar ebook ───────────────────────────────────────────────
  update: adminProcedure
    .input(z.object({ id: z.number().int(), data: ebookInput.partial() }))
    .mutation(async ({ input }) => {
      const existing = await getEbookById(input.id);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      const updateData: Record<string, any> = { ...input.data };
      if (input.data.includesSession !== undefined) {
        updateData.includesSession = input.data.includesSession ? 1 : 0;
      }
      if (input.data.pdfUrl === "") updateData.pdfUrl = null;
      if (input.data.coverImage === "") updateData.coverImage = null;
      await updateEbook(input.id, updateData);
      return getEbookById(input.id);
    }),

  // ── Admin: eliminar ebook ─────────────────────────────────────────────────
  delete: adminProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      const existing = await getEbookById(input.id);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      await deleteEbook(input.id);
      return { success: true };
    }),

  // ── Admin: activar / desactivar ───────────────────────────────────────────
  toggleStatus: adminProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      const newStatus = await toggleEbookStatus(input.id);
      return { status: newStatus };
    }),

  // ── Admin: reordenar ──────────────────────────────────────────────────────
  reorder: adminProcedure
    .input(z.array(z.object({ id: z.number().int(), sortOrder: z.number().int() })))
    .mutation(async ({ input }) => {
      await Promise.all(input.map(({ id, sortOrder }) => updateEbook(id, { sortOrder })));
      return { success: true };
    }),
});
