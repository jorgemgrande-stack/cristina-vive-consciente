/**
 * Router tRPC — Servicios (Consultas y Masajes)
 * CRUD completo para gestión de servicios desde el CRM.
 * El listado público no requiere autenticación.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  listServices,
  getServiceById,
  getServiceBySlug,
  createService,
  updateService,
  deleteService,
  toggleServiceStatus,
} from "../db";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx });
});

// ── Schemas ───────────────────────────────────────────────────────────────────
const serviceInput = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9_]+$/, "Solo letras minúsculas, números y guiones bajos"),
  name: z.string().min(1).max(200),
  shortDescription: z.string().max(500).optional(),
  description: z.string().optional(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/).optional().nullable(),
  durationMinutes: z.number().int().min(1).default(60),
  durationLabel: z.string().max(100).optional(),
  type: z.enum(["consulta", "masaje", "otro"]).default("consulta"),
  modality: z.enum(["online", "presencial", "ambos"]).default("ambos"),
  imageUrl: z.string().url().optional().nullable().or(z.literal("")),
  featured: z.boolean().default(false),
  status: z.enum(["active", "inactive"]).default("active"),
  sortOrder: z.number().int().min(0).default(0),
});

// ── Router ────────────────────────────────────────────────────────────────────
export const servicesRouter = router({
  // ── Público: listado de servicios activos ──────────────────────────────────
  list: publicProcedure
    .input(z.object({ type: z.enum(["consulta", "masaje", "otro"]).optional() }).optional())
    .query(async ({ input }) => {
      const all = await listServices(true); // solo activos
      if (input?.type) {
        return all.filter((s) => s.type === input.type);
      }
      return all;
    }),

  // ── Público: obtener un servicio por slug (para reservas) ──────────────────
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const service = await getServiceBySlug(input.slug);
      if (!service || service.status !== "active") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Servicio no encontrado" });
      }
      return service;
    }),

  // ── Admin: listado completo (activos + inactivos) ──────────────────────────
  listAdmin: adminProcedure.query(async () => {
    return listServices(false);
  }),

  // ── Admin: obtener un servicio ─────────────────────────────────────────────
  get: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const service = await getServiceById(input.id);
      if (!service) throw new TRPCError({ code: "NOT_FOUND", message: "Servicio no encontrado" });
      return service;
    }),

  // ── Admin: crear servicio ──────────────────────────────────────────────────
  create: adminProcedure
    .input(serviceInput)
    .mutation(async ({ input, ctx }) => {
      const id = await createService({
        slug: input.slug,
        name: input.name,
        shortDescription: input.shortDescription ?? null,
        description: input.description ?? null,
        price: input.price ?? null,
        durationMinutes: input.durationMinutes,
        durationLabel: input.durationLabel ?? null,
        type: input.type,
        modality: input.modality,
        imageUrl: input.imageUrl || null,
        featured: input.featured ? 1 : 0,
        status: input.status,
        sortOrder: input.sortOrder,
        createdBy: ctx.user.id,
      });
      return { id };
    }),

  // ── Admin: editar servicio ─────────────────────────────────────────────────
  update: adminProcedure
    .input(z.object({ id: z.number(), data: serviceInput }))
    .mutation(async ({ input }) => {
      const existing = await getServiceById(input.id);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Servicio no encontrado" });
      await updateService(input.id, {
        slug: input.data.slug,
        name: input.data.name,
        shortDescription: input.data.shortDescription ?? null,
        description: input.data.description ?? null,
        price: input.data.price ?? null,
        durationMinutes: input.data.durationMinutes,
        durationLabel: input.data.durationLabel ?? null,
        type: input.data.type,
        modality: input.data.modality,
        imageUrl: input.data.imageUrl || null,
        featured: input.data.featured ? 1 : 0,
        status: input.data.status,
        sortOrder: input.data.sortOrder,
      });
      return { success: true };
    }),

  // ── Admin: activar/desactivar servicio ────────────────────────────────────
  toggleStatus: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const newStatus = await toggleServiceStatus(input.id);
      return { status: newStatus };
    }),

  // ── Admin: eliminar servicio ───────────────────────────────────────────────
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const existing = await getServiceById(input.id);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Servicio no encontrado" });
      await deleteService(input.id);
      return { success: true };
    }),

  // ── Admin: reordenar servicios ─────────────────────────────────────────────
  reorder: adminProcedure
    .input(z.array(z.object({ id: z.number(), sortOrder: z.number() })))
    .mutation(async ({ input }) => {
      await Promise.all(
        input.map(({ id, sortOrder }) => updateService(id, { sortOrder }))
      );
      return { success: true };
    }),
});
