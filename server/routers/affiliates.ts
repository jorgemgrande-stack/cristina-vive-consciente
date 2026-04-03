/**
 * Router tRPC — Productos Afiliados
 * CRUD completo para gestión de productos afiliados en el CRM.
 * El listado público no requiere autenticación.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  listAffiliateProducts,
  getAffiliateProduct,
  createAffiliateProduct,
  updateAffiliateProduct,
  deleteAffiliateProduct,
  toggleAffiliateProductStatus,
} from "../db";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx });
});

const productInput = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  category: z.string().min(1).max(100),
  affiliateUrl: z.string().url(),
  provider: z.string().max(100).optional(),
  status: z.enum(["active", "inactive"]).default("active"),
  sortOrder: z.number().int().min(0).default(0),
});

export const affiliatesRouter = router({
  // ── Público: listado de productos activos ──────────────────────────────────
  list: publicProcedure
    .input(z.object({ category: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const products = await listAffiliateProducts(true); // solo activos
      if (input?.category) {
        return products.filter((p) => p.category === input.category);
      }
      return products;
    }),

  // ── Admin: listado completo (activos + inactivos) ──────────────────────────
  listAdmin: adminProcedure.query(async () => {
    return listAffiliateProducts(false);
  }),

  // ── Admin: obtener uno ─────────────────────────────────────────────────────
  get: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const product = await getAffiliateProduct(input.id);
      if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Producto no encontrado" });
      return product;
    }),

  // ── Admin: crear ───────────────────────────────────────────────────────────
  create: adminProcedure
    .input(productInput)
    .mutation(async ({ input, ctx }) => {
      const id = await createAffiliateProduct({
        ...input,
        description: input.description ?? null,
        imageUrl: input.imageUrl || null,
        provider: input.provider ?? null,
        createdBy: ctx.user.id,
      });
      return { id };
    }),

  // ── Admin: editar ──────────────────────────────────────────────────────────
  update: adminProcedure
    .input(z.object({ id: z.number(), data: productInput }))
    .mutation(async ({ input }) => {
      const existing = await getAffiliateProduct(input.id);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Producto no encontrado" });
      await updateAffiliateProduct(input.id, {
        ...input.data,
        description: input.data.description ?? null,
        imageUrl: input.data.imageUrl || null,
        provider: input.data.provider ?? null,
      });
      return { success: true };
    }),

  // ── Admin: activar/desactivar ──────────────────────────────────────────────
  toggleStatus: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const newStatus = await toggleAffiliateProductStatus(input.id);
      return { status: newStatus };
    }),

  // ── Admin: eliminar ────────────────────────────────────────────────────────
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const existing = await getAffiliateProduct(input.id);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Producto no encontrado" });
      await deleteAffiliateProduct(input.id);
      return { success: true };
    }),

  // ── Admin: reordenar ───────────────────────────────────────────────────────
  reorder: adminProcedure
    .input(z.array(z.object({ id: z.number(), sortOrder: z.number() })))
    .mutation(async ({ input }) => {
      await Promise.all(
        input.map(({ id, sortOrder }) => updateAffiliateProduct(id, { sortOrder }))
      );
      return { success: true };
    }),
});
