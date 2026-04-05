/**
 * water.ts — Router tRPC para el módulo Sistemas de Agua
 * Cristina Vive Consciente
 *
 * Endpoints públicos:
 *   water.listCategories        → categorías visibles
 *   water.listProducts          → productos visibles con filtros
 *   water.getProduct            → detalle de producto por slug
 *   water.submitInquiry         → formulario "Reservar sistema"
 *
 * Endpoints admin:
 *   water.admin.listCategories  → todas las categorías
 *   water.admin.createCategory  → crear categoría
 *   water.admin.updateCategory  → editar categoría
 *   water.admin.deleteCategory  → eliminar categoría
 *   water.admin.listProducts    → todos los productos con filtros
 *   water.admin.createProduct   → crear producto
 *   water.admin.updateProduct   → editar producto
 *   water.admin.deleteProduct   → eliminar producto
 *   water.admin.duplicateProduct → duplicar producto
 *   water.admin.listInquiries   → listar solicitudes de reserva
 *   water.admin.updateInquiry   → actualizar estado de solicitud
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import {
  listWaterCategories,
  getWaterCategoryById,
  createWaterCategory,
  updateWaterCategory,
  deleteWaterCategory,
  listWaterProducts,
  getWaterProductById,
  getWaterProductBySlug,
  createWaterProduct,
  updateWaterProduct,
  deleteWaterProduct,
  duplicateWaterProduct,
  createWaterInquiry,
  listWaterInquiries,
  updateWaterInquiry,
} from "../waterDb";
import { notifyOwner } from "../_core/notification";
import { notifyAdminNewLead } from "../whatsapp";

// ─── SCHEMAS DE VALIDACIÓN ────────────────────────────────────────────────────

const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
  shortDescription: z.string().optional(),
  imageUrl: z.string().optional(),
  icon: z.string().optional(),
  sortOrder: z.number().int().default(0),
  visibleEnPublico: z.number().int().min(0).max(1).default(1),
  status: z.enum(["active", "inactive"]).default("active"),
});

// Helper: acepta string, string vacío, null o undefined — normaliza a undefined para no persistir basura
const optStr = () => z.string().nullable().optional().transform((v) => (v === null || v === "" ? undefined : v));
const optJson = (fallback = "[]") =>
  z.string().nullable().optional().transform((v) => (v === null || v === undefined ? fallback : v === "" ? fallback : v));

const productSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
  subtitle: optStr(),
  categoryId: z.number().int().nullable().optional().transform((v) => v ?? undefined),
  secondaryCategories: optJson(), // JSON array
  shortDescription: optStr(),
  longDescription: optStr(),
  claimsHighlighted: optJson(), // JSON array
  benefits: optJson(), // JSON array
  forWhom: optStr(),
  priceVisible: optStr(),
  priceFrom: optStr(),
  priceOrientative: optStr(),
  mainImage: optStr(),
  galleryImages: optJson(), // JSON array
  badge: optStr(),
  badgeColor: optStr(),
  technicalSpecs: optJson(), // JSON array [{key, value}]
  installationText: optStr(),
  maintenanceText: optStr(),
  warrantyText: optStr(),
  bulletAdvantages: optJson(), // JSON array
  whyChooseBlock: optStr(),
  expertBlock: optStr(),
  faqBlock: optJson(), // JSON [{q,a}]
  testimonialsBlock: optJson(), // JSON [{name,text,rating}]
  trustBlock: optStr(),
  ctaPrimaryLabel: optStr(),
  ctaSecondaryLabel: optStr(),
  seoTitle: optStr(),
  seoDescription: optStr(),
  sortOrder: z.number().int().default(0),
  visibleEnPublico: z.number().int().min(0).max(1).default(1),
  destacadoEnHome: z.number().int().min(0).max(1).default(0),
  productoPrincipal: z.number().int().min(0).max(1).default(0),
  status: z.enum(["active", "inactive"]).default("active"),
});

const inquirySchema = z.object({
  firstName: z.string().min(1, "El nombre es obligatorio"),
  lastName: z.string().min(1, "Los apellidos son obligatorios"),
  phone: z.string().min(6, "El teléfono es obligatorio"),
  email: z.string().email("Email no válido"),
  province: z.string().optional(),
  city: z.string().optional(),
  housingType: z.string().optional(),
  productId: z.number().int().optional(),
  productName: z.string().optional(),
  observations: z.string().optional(),
  acceptPrivacy: z.boolean().refine((v) => v === true, {
    message: "Debes aceptar la política de privacidad",
  }),
});

// ─── ROUTER ───────────────────────────────────────────────────────────────────

export const waterRouter = router({
  // ─── PÚBLICO ──────────────────────────────────────────────────────────────

  /** Listar categorías visibles */
  listCategories: publicProcedure.query(() => listWaterCategories(true)),

  /** Listar productos visibles con filtros opcionales */
  listProducts: publicProcedure
    .input(
      z.object({
        categoryId: z.number().int().optional(),
        onlyDestacados: z.boolean().optional(),
      }).optional()
    )
    .query(({ input }) =>
      listWaterProducts({
        onlyVisible: true,
        categoryId: input?.categoryId,
        onlyDestacados: input?.onlyDestacados,
      })
    ),

  /** Detalle de producto por slug */
  getProduct: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const product = await getWaterProductBySlug(input.slug);
      if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Producto no encontrado" });
      return product;
    }),

  /** Formulario "Reservar sistema" */
  submitInquiry: publicProcedure
    .input(inquirySchema)
    .mutation(async ({ input }) => {
      const inquiryId = await createWaterInquiry({
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        phone: input.phone.trim(),
        email: input.email.trim().toLowerCase(),
        province: input.province?.trim() ?? null,
        city: input.city?.trim() ?? null,
        housingType: input.housingType?.trim() ?? null,
        productId: input.productId ?? null,
        productName: input.productName?.trim() ?? null,
        observations: input.observations?.trim() ?? null,
        acceptPrivacy: input.acceptPrivacy ? 1 : 0,
        status: "new",
      });

      const fullName = `${input.firstName.trim()} ${input.lastName.trim()}`;

      // Notificación Manus al propietario
      notifyOwner({
        title: `Nueva solicitud de sistema de agua — ${fullName}`,
        content: `${fullName} (${input.email}${input.phone ? ` · ${input.phone}` : ""}) ha solicitado información sobre ${input.productName ?? "sistemas de agua"}.${input.province ? ` Provincia: ${input.province}.` : ""}${input.housingType ? ` Vivienda: ${input.housingType}.` : ""}${input.observations ? ` Observaciones: "${input.observations}"` : ""}`,
      }).catch(console.error);

      // Notificación WhatsApp al admin
      notifyAdminNewLead({
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        phone: input.phone.trim(),
        email: input.email.trim().toLowerCase(),
        interest: input.productName ? `Sistema de agua: ${input.productName}` : "Sistema de agua",
        message: input.observations?.trim(),
      }).catch(console.error);

      return {
        success: true,
        inquiryId,
        message: "Hemos recibido tu solicitud. Cristina te contactará en las próximas 24–48 horas para orientarte en la elección del sistema ideal.",
      };
    }),

  // ─── ADMIN ────────────────────────────────────────────────────────────────

  admin: router({
    // Categorías
    listCategories: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return listWaterCategories(false);
    }),

    createCategory: protectedProcedure
      .input(categorySchema)
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return createWaterCategory(input);
      }),

    updateCategory: protectedProcedure
      .input(z.object({ id: z.number().int(), data: categorySchema.partial() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        await updateWaterCategory(input.id, input.data);
        return { success: true };
      }),

    deleteCategory: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        await deleteWaterCategory(input.id);
        return { success: true };
      }),

    // Productos
    listProducts: protectedProcedure
      .input(
        z.object({
          categoryId: z.number().int().optional(),
          onlyVisible: z.boolean().optional(),
          onlyDestacados: z.boolean().optional(),
          search: z.string().optional(),
        }).optional()
      )
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return listWaterProducts({
          categoryId: input?.categoryId,
          onlyVisible: input?.onlyVisible,
          onlyDestacados: input?.onlyDestacados,
          search: input?.search,
        });
      }),

    createProduct: protectedProcedure
      .input(productSchema)
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return createWaterProduct({ ...input, createdBy: ctx.user.id });
      }),

    updateProduct: protectedProcedure
      .input(z.object({ id: z.number().int(), data: productSchema.partial() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        await updateWaterProduct(input.id, input.data);
        return { success: true };
      }),

    deleteProduct: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        await deleteWaterProduct(input.id);
        return { success: true };
      }),

    duplicateProduct: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const newId = await duplicateWaterProduct(input.id);
        return { success: true, newId };
      }),

    // Solicitudes de reserva
    listInquiries: protectedProcedure
      .input(z.object({ limit: z.number().int().min(1).max(500).default(100) }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return listWaterInquiries(input.limit);
      }),

    updateInquiry: protectedProcedure
      .input(
        z.object({
          id: z.number().int(),
          status: z.enum(["new", "contacted", "qualified", "closed"]).optional(),
          internalNotes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const { id, ...data } = input;
        await updateWaterInquiry(id, data);
        return { success: true };
      }),
  }),
});
