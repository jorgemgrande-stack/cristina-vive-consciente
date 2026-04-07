/**
 * oils.ts — Router tRPC para el módulo Aceites Esenciales
 * Cristina Vive Consciente
 *
 * Endpoints públicos:
 *   oils.listCategories      → categorías activas
 *   oils.listProducts        → productos visibles con filtros
 *   oils.getProduct          → detalle de producto por slug
 *   oils.submitConsultation  → formulario "Solicitar consulta personalizada"
 *
 * Endpoints admin:
 *   oils.admin.listCategories / createCategory / updateCategory / deleteCategory
 *   oils.admin.listProducts / createProduct / updateProduct / deleteProduct
 *   oils.admin.listConsultations / updateConsultation
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import {
  listOilCategories,
  getOilCategoryById,
  createOilCategory,
  updateOilCategory,
  deleteOilCategory,
  listOilProducts,
  getOilProductBySlug,
  createOilProduct,
  updateOilProduct,
  deleteOilProduct,
  createOilConsultation,
  listOilConsultations,
  updateOilConsultation,
} from "../oilsDb";
import { notifyOwner } from "../_core/notification";
import { notifyAdminNewLead } from "../whatsapp";

// ─── SCHEMAS ──────────────────────────────────────────────────────────────────

const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  sortOrder: z.number().int().default(0),
  status: z.enum(["active", "inactive"]).default("active"),
});

const optStr = () =>
  z.string().nullable().optional().transform((v) => (v === null || v === "" ? undefined : v));
const optJson = (fallback = "[]") =>
  z.string().nullable().optional().transform((v) =>
    v === null || v === undefined || v === "" ? fallback : v
  );

const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  category: z.string().min(1),
  tipoProducto: z.enum(["aceite", "mezcla", "base", "pack", "accesorio"]).default("aceite"),
  descripcion: optStr(),
  beneficios: optJson(),
  indicaciones: optJson(),
  usoGeneral: optStr(),
  mensajeConsulta: optStr(),
  imagen: optStr(),
  tags: optJson(),
  destacado: z.number().int().min(0).max(1).default(0),
  sortOrder: z.number().int().default(0),
  visibleEnPublico: z.number().int().min(0).max(1).default(1),
  status: z.enum(["active", "inactive"]).default("active"),
});

const consultationSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  email: z.string().email("Email no válido"),
  telefono: z.string().optional(),
  mensaje: z.string().optional(),
  /** JSON array de {id, name, slug} */
  productsList: z.string().optional(),
});

// ─── ROUTER ───────────────────────────────────────────────────────────────────

export const oilsRouter = router({
  // ─── PÚBLICO ────────────────────────────────────────────────────────────────

  listCategories: publicProcedure.query(() => listOilCategories(true)),

  listProducts: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        tipoProducto: z.string().optional(),
        tag: z.string().optional(),
        onlyDestacados: z.boolean().optional(),
        search: z.string().optional(),
      }).optional()
    )
    .query(({ input }) =>
      listOilProducts({
        onlyVisible: true,
        category: input?.category,
        tipoProducto: input?.tipoProducto,
        tag: input?.tag,
        onlyDestacados: input?.onlyDestacados,
        search: input?.search,
      })
    ),

  getProduct: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const product = await getOilProductBySlug(input.slug);
      if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Producto no encontrado" });
      return product;
    }),

  submitConsultation: publicProcedure
    .input(consultationSchema)
    .mutation(async ({ input }) => {
      const consultationId = await createOilConsultation({
        nombre: input.nombre.trim(),
        email: input.email.trim().toLowerCase(),
        telefono: input.telefono?.trim() ?? null,
        mensaje: input.mensaje?.trim() ?? null,
        productsList: input.productsList ?? "[]",
        status: "new",
      });

      // Parsear lista de productos para el mensaje
      let productsText = "";
      try {
        const products: { name: string }[] = JSON.parse(input.productsList ?? "[]");
        if (products.length > 0) {
          productsText = `\n\nProductos seleccionados:\n${products.map((p) => `• ${p.name}`).join("\n")}`;
        }
      } catch {
        // ignore
      }

      // Notificación Manus al propietario
      notifyOwner({
        title: `Nueva consulta de aceites esenciales — ${input.nombre.trim()}`,
        content: `${input.nombre.trim()} (${input.email}${input.telefono ? ` · ${input.telefono}` : ""}) ha solicitado una consulta personalizada sobre aceites esenciales.${productsText}${input.mensaje ? `\n\nMensaje: "${input.mensaje}"` : ""}`,
      }).catch(console.error);

      // Notificación WhatsApp al admin
      notifyAdminNewLead({
        firstName: input.nombre.trim().split(" ")[0] ?? input.nombre.trim(),
        lastName: input.nombre.trim().split(" ").slice(1).join(" ") ?? "",
        phone: input.telefono?.trim() ?? "",
        email: input.email.trim().toLowerCase(),
        interest: `Consulta aceites esenciales${productsText ? ` (${JSON.parse(input.productsList ?? "[]").length} productos)` : ""}`,
        message: input.mensaje?.trim(),
      }).catch(console.error);

      return {
        success: true,
        consultationId,
        message:
          "Hemos recibido tu consulta. Cristina revisará los productos que has seleccionado y te contactará en las próximas 24–48 horas con una propuesta personalizada.",
      };
    }),

  // ─── ADMIN ──────────────────────────────────────────────────────────────────

  admin: router({
    // Categorías
    listCategories: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return listOilCategories(false);
    }),

    createCategory: protectedProcedure
      .input(categorySchema)
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const id = await createOilCategory({
          name: input.name,
          slug: input.slug,
          description: input.description ?? null,
          imageUrl: input.imageUrl ?? null,
          icon: input.icon ?? null,
          sortOrder: input.sortOrder,
          status: input.status,
        });
        return { success: true, id };
      }),

    updateCategory: protectedProcedure
      .input(z.object({ id: z.number().int(), data: categorySchema.partial() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        await updateOilCategory(input.id, input.data);
        return { success: true };
      }),

    deleteCategory: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        await deleteOilCategory(input.id);
        return { success: true };
      }),

    // Productos
    listProducts: protectedProcedure
      .input(
        z.object({
          category: z.string().optional(),
          tipoProducto: z.string().optional(),
          onlyVisible: z.boolean().optional(),
          onlyDestacados: z.boolean().optional(),
          search: z.string().optional(),
        }).optional()
      )
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return listOilProducts({
          category: input?.category,
          tipoProducto: input?.tipoProducto,
          onlyVisible: input?.onlyVisible,
          onlyDestacados: input?.onlyDestacados,
          search: input?.search,
        });
      }),

    createProduct: protectedProcedure
      .input(productSchema)
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const id = await createOilProduct({ ...input, createdBy: ctx.user.id });
        return { success: true, id };
      }),

    updateProduct: protectedProcedure
      .input(z.object({ id: z.number().int(), data: productSchema.partial() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        await updateOilProduct(input.id, input.data);
        return { success: true };
      }),

    deleteProduct: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        await deleteOilProduct(input.id);
        return { success: true };
      }),

    // Consultas
    listConsultations: protectedProcedure
      .input(z.object({ limit: z.number().int().min(1).max(500).default(100) }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return listOilConsultations(input.limit);
      }),

    updateConsultation: protectedProcedure
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
        await updateOilConsultation(id, data);
        return { success: true };
      }),
  }),
});
