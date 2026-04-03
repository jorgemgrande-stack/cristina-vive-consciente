/**
 * Router tRPC — Productos Afiliados + Categorías
 * CRUD completo para gestión de productos y categorías de afiliados en el CRM.
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
  listAffiliateCategories,
  getAffiliateCategoryById,
  createAffiliateCategory,
  updateAffiliateCategory,
  deleteAffiliateCategory,
  toggleAffiliateCategoryStatus,
} from "../db";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx });
});

// ── Helpers ──────────────────────────────────────────────────────────────────
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ── Schemas ───────────────────────────────────────────────────────────────────
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

const categoryInput = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  sortOrder: z.number().int().min(0).default(0),
  status: z.enum(["active", "inactive"]).default("active"),
});

// ── Router principal ──────────────────────────────────────────────────────────
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

  // ── Público: listado de categorías activas ─────────────────────────────────
  listCategories: publicProcedure.query(async () => {
    const cats = await listAffiliateCategories();
    return cats.filter((c) => c.status === "active");
  }),

  // ── Admin: listado completo (activos + inactivos) ──────────────────────────
  listAdmin: adminProcedure.query(async () => {
    return listAffiliateProducts(false);
  }),

  // ── Admin: obtener un producto ─────────────────────────────────────────────
  get: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const product = await getAffiliateProduct(input.id);
      if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Producto no encontrado" });
      return product;
    }),

  // ── Admin: crear producto ──────────────────────────────────────────────────
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

  // ── Admin: editar producto ─────────────────────────────────────────────────
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

  // ── Admin: activar/desactivar producto ────────────────────────────────────
  toggleStatus: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const newStatus = await toggleAffiliateProductStatus(input.id);
      return { status: newStatus };
    }),

  // ── Admin: eliminar producto ───────────────────────────────────────────────
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const existing = await getAffiliateProduct(input.id);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Producto no encontrado" });
      await deleteAffiliateProduct(input.id);
      return { success: true };
    }),

  // ── Admin: reordenar productos ─────────────────────────────────────────────
  reorder: adminProcedure
    .input(z.array(z.object({ id: z.number(), sortOrder: z.number() })))
    .mutation(async ({ input }) => {
      await Promise.all(
        input.map(({ id, sortOrder }) => updateAffiliateProduct(id, { sortOrder }))
      );
      return { success: true };
    }),

  // ════════════════════════════════════════════════════════════════════════════
  // CATEGORÍAS
  // ════════════════════════════════════════════════════════════════════════════

  // ── Admin: listado completo de categorías ──────────────────────────────────
  listCategoriesAdmin: adminProcedure.query(async () => {
    return listAffiliateCategories();
  }),

  // ── Admin: obtener una categoría ──────────────────────────────────────────
  getCategory: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const cat = await getAffiliateCategoryById(input.id);
      if (!cat) throw new TRPCError({ code: "NOT_FOUND", message: "Categoría no encontrada" });
      return cat;
    }),

  // ── Admin: crear categoría ─────────────────────────────────────────────────
  createCategory: adminProcedure
    .input(categoryInput)
    .mutation(async ({ input }) => {
      const slug = toSlug(input.name);
      const id = await createAffiliateCategory({
        name: input.name,
        slug,
        description: input.description ?? null,
        sortOrder: input.sortOrder,
        status: input.status,
      });
      return { id };
    }),

  // ── Admin: editar categoría ────────────────────────────────────────────────
  updateCategory: adminProcedure
    .input(z.object({ id: z.number(), data: categoryInput }))
    .mutation(async ({ input }) => {
      const existing = await getAffiliateCategoryById(input.id);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Categoría no encontrada" });
      const slug = toSlug(input.data.name);
      await updateAffiliateCategory(input.id, {
        name: input.data.name,
        slug,
        description: input.data.description ?? null,
        sortOrder: input.data.sortOrder,
        status: input.data.status,
      });
      return { success: true };
    }),

  // ── Admin: activar/desactivar categoría ───────────────────────────────────
  toggleCategoryStatus: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const newStatus = await toggleAffiliateCategoryStatus(input.id);
      return { status: newStatus };
    }),

  // ── Admin: eliminar categoría ──────────────────────────────────────────────
  deleteCategory: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const existing = await getAffiliateCategoryById(input.id);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Categoría no encontrada" });
      await deleteAffiliateCategory(input.id);
      return { success: true };
    }),

  // ── Admin: reordenar categorías ────────────────────────────────────────────
  reorderCategories: adminProcedure
    .input(z.array(z.object({ id: z.number(), sortOrder: z.number() })))
    .mutation(async ({ input }) => {
      await Promise.all(
        input.map(({ id, sortOrder }) => updateAffiliateCategory(id, { sortOrder }))
      );
      return { success: true };
    }),
});
