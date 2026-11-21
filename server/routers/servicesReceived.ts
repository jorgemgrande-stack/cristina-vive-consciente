/** Servicios recibidos (ficha), catálogo editable y revisión de pedidos sin ficha clara. */
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import {
  clientsByEmail,
  createCatalogNode,
  createClientService,
  deleteClientService,
  listCatalog,
  listClientServices,
  resolveOrderReview,
  setCatalogArchived,
  updateCatalogNode,
  updateClientService,
} from "../servicesReceivedDb";
import { getDb } from "../db";
import { orders } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const fail = (e: unknown): never => {
  throw new TRPCError({ code: "BAD_REQUEST", message: e instanceof Error ? e.message : "No se pudo completar la acción" });
};
const run = async <T>(fn: () => Promise<T>): Promise<T> => {
  try {
    return await fn();
  } catch (e) {
    return fail(e);
  }
};

const cents = z.number().int().min(0).max(10_000_000).nullable();
const payment = z.enum(["free", "paid", "pending"]);

export const servicesReceivedRouter = router({
  catalog: router({
    /** Todo el árbol, con los archivados (la ficha filtra los archivados en los desplegables). */
    tree: adminProcedure.query(() => listCatalog()),
    create: adminProcedure
      .input(z.object({ parentId: z.number().int().nullable(), kind: z.enum(["category", "group", "item"]), name: z.string().trim().min(1).max(200), priceCents: cents.optional() }))
      .mutation(({ input }) => run(() => createCatalogNode(input))),
    update: adminProcedure
      .input(z.object({ id: z.number().int(), name: z.string().trim().min(1).max(200).optional(), priceCents: cents.optional(), sortOrder: z.number().int().optional() }))
      .mutation(({ input }) => {
        const { id, ...patch } = input;
        return run(async () => (await updateCatalogNode(id, patch), { ok: true }));
      }),
    setArchived: adminProcedure
      .input(z.object({ id: z.number().int(), archived: z.boolean() }))
      .mutation(({ input }) => run(async () => (await setCatalogArchived(input.id, input.archived), { ok: true }))),
  }),

  list: adminProcedure.input(z.object({ clientId: z.number().int() })).query(({ input }) => listClientServices(input.clientId)),

  create: adminProcedure
    .input(
      z.object({
        clientId: z.number().int(),
        nodeId: z.number().int(),
        paymentStatus: payment,
        amountCents: cents,
        receivedAt: z.number().int(),
        notes: z.string().max(2000).nullable().optional(),
      }),
    )
    .mutation(({ input, ctx }) => {
      const { clientId, ...rest } = input;
      return run(() => createClientService(clientId, rest, ctx.user.id));
    }),

  update: adminProcedure
    .input(z.object({ id: z.number().int(), clientId: z.number().int(), paymentStatus: payment.optional(), amountCents: cents.optional(), receivedAt: z.number().int().optional(), notes: z.string().max(2000).nullable().optional() }))
    .mutation(({ input }) => {
      const { id, clientId, ...patch } = input;
      return run(async () => (await updateClientService(id, clientId, patch), { ok: true }));
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number().int(), clientId: z.number().int() }))
    .mutation(({ input }) => run(async () => (await deleteClientService(input.id, input.clientId), { ok: true }))),

  /** Fichas con el mismo email que un pedido en revisión. */
  orderCandidates: adminProcedure.input(z.object({ orderId: z.number().int() })).query(async ({ input }) => {
    const db = await getDb();
    const [o] = db ? await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1) : [];
    if (!o) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido no encontrado" });
    return clientsByEmail(o.customerEmail);
  }),

  /** Cristina elige la ficha correcta de un pedido que tenía varias coincidencias. */
  linkOrder: adminProcedure
    .input(z.object({ orderId: z.number().int(), clientId: z.number().int() }))
    .mutation(({ input }) => run(() => resolveOrderReview(input.orderId, input.clientId))),
});
