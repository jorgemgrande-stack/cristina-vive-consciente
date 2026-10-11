/**
 * Pedidos de guías digitales pagados por Bizum — Cristina Vive Consciente.
 *
 * El Bizum a un teléfono particular no tiene API ni webhook, así que el pago NO se puede verificar desde la web:
 *   1. El cliente crea el pedido (estado "pending") y recibe la referencia que debe poner en el concepto del Bizum.
 *   2. Cristina recibe un WhatsApp (CallMeBot) + email con el pedido.
 *   3. Cristina ve el Bizum en su banco y pulsa «Confirmar pago» en el CRM → estado "paid".
 *   4. Solo entonces se genera el token de descarga y se envía la guía por email.
 * Nada se entrega sin esa confirmación humana.
 */
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { findClientByEmail, getDb, getEbookBySlug, updateClientTag } from "../db";
import { orders, type Order } from "../../drizzle/schema";
import { getEbook } from "../ebooks/products";
import { sendEbookDeliveryEmail, sendOrderAdminEmail, sendOrderReceivedEmail } from "../email";
import { notifyAdminNewOrder } from "../whatsapp";
import { normalizePhone } from "../../shared/phone";
import {
  BIZUM_PHONE,
  BIZUM_PHONE_DISPLAY,
  bizumAmount,
  formatEuros,
  generateOrderReference,
  isValidOrderReference,
} from "../../shared/orders";

// ─── Catálogo ────────────────────────────────────────────────────────────────

export interface OrderableEbook {
  slug: string;
  title: string;
  priceCents: number;
  includesSession: boolean;
  downloadExpiryHours: number;
  crmTag: string | null;
  pdfUrl: string | null;
}

/** Guía por slug: tabla `ebooks` (CRM) y, si no está, el catálogo estático antiguo. Solo guías activas. */
export async function resolveEbook(slug: string): Promise<OrderableEbook | null> {
  const dbEbook = await getEbookBySlug(slug);
  if (dbEbook) {
    if (dbEbook.status !== "active") return null;
    return {
      slug: dbEbook.slug,
      title: dbEbook.title,
      priceCents: dbEbook.priceCents,
      includesSession: dbEbook.includesSession === 1,
      downloadExpiryHours: dbEbook.downloadExpiryHours,
      crmTag: dbEbook.crmTag,
      pdfUrl: dbEbook.pdfUrl,
    };
  }
  const st = getEbook(slug);
  if (!st) return null;
  return {
    slug: st.id,
    title: st.title,
    priceCents: st.priceCents,
    includesSession: st.includesSession,
    downloadExpiryHours: st.downloadExpiryHours,
    crmTag: st.crmTag,
    pdfUrl: st.pdfUrl,
  };
}

// ─── Antiabuso ───────────────────────────────────────────────────────────────

const MAX_PENDING_PER_EMAIL = 3;
const IP_WINDOW_MS = 60 * 60 * 1000;
const MAX_ORDERS_PER_IP_WINDOW = 8;
const ipHits = new Map<string, number[]>();

/** Cada pedido envía un WhatsApp a Cristina: se limita por IP para que nadie pueda inundarla. */
function throttleIp(ip: string): void {
  const now = Date.now();
  const hits = (ipHits.get(ip) ?? []).filter((t) => now - t < IP_WINDOW_MS);
  if (hits.length >= MAX_ORDERS_PER_IP_WINDOW) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Demasiados pedidos seguidos. Inténtalo más tarde o escribe a Cristina.",
    });
  }
  hits.push(now);
  ipHits.set(ip, hits);
}

function clientIp(req: any): string {
  const fwd = String(req?.headers?.["x-forwarded-for"] ?? "").split(",")[0]?.trim();
  return fwd || req?.ip || req?.socket?.remoteAddress || "unknown";
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function requireDb() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de datos no disponible" });
  return db;
}

async function getByReference(reference: string): Promise<Order | undefined> {
  const db = await requireDb();
  const rows = await db.select().from(orders).where(eq(orders.reference, reference)).limit(1);
  return rows[0];
}

/** Datos públicos del pedido: sin email, teléfono ni token. */
function publicView(o: Order) {
  return {
    reference: o.reference,
    status: o.status,
    productTitle: o.productTitle,
    amountCents: o.amountCents,
    amountLabel: formatEuros(o.amountCents),
    bizumAmount: bizumAmount(o.amountCents),
    bizumPhone: BIZUM_PHONE,
    bizumPhoneDisplay: BIZUM_PHONE_DISPLAY,
    customerFirstName: o.customerName.split(" ")[0] ?? "",
    claimed: !!o.customerClaimedAt,
  };
}

/** Genera el token, marca el pedido como entregable y envía el email con el enlace. */
async function deliver(order: Order, ebook: OrderableEbook | null): Promise<{ emailSent: boolean; error?: string }> {
  // Sin PDF subido no se envía ningún enlace (el cliente vería «PDF no disponible» tras pagar).
  if (!ebook?.pdfUrl) {
    return { emailSent: false, error: "La guía todavía no tiene PDF subido (CRM → Ebooks). Súbelo y pulsa «Enviar guía»." };
  }
  const db = await requireDb();
  const hours = ebook?.downloadExpiryHours ?? 72;
  const downloadToken = order.downloadToken ?? nanoid(48);
  const downloadExpiresAt = Date.now() + hours * 60 * 60 * 1000;
  await db.update(orders).set({ downloadToken, downloadExpiresAt }).where(eq(orders.id, order.id));
  try {
    await sendEbookDeliveryEmail({
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      ebookTitle: order.productTitle,
      downloadToken,
      downloadExpiresAt,
      includesSession: order.includesSession === 1,
    });
    await db.update(orders).set({ deliveryEmailSentAt: Date.now() }).where(eq(orders.id, order.id));
    return { emailSent: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Orders] Error enviando la guía del pedido ${order.reference}:`, msg);
    return { emailSent: false, error: msg };
  }
}

// ─── Router ──────────────────────────────────────────────────────────────────

export const ordersRouter = router({
  /** Público: crea el pedido y devuelve la referencia para el Bizum. Idempotente por email+guía pendiente. */
  create: publicProcedure
    .input(
      z.object({
        productSlug: z.string().min(1).max(100),
        name: z.string().trim().min(2).max(120).regex(/^[^<>]*$/, "Nombre no válido"),
        email: z.string().trim().toLowerCase().email().max(320),
        phone: z.string().trim().max(30).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const ebook = await resolveEbook(input.productSlug);
      if (!ebook) throw new TRPCError({ code: "NOT_FOUND", message: "Esta guía no está disponible." });
      if (ebook.priceCents <= 0) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Esta guía no tiene precio." });

      let phone: string | null = null;
      if (input.phone) {
        phone = normalizePhone(input.phone);
        if (!phone) throw new TRPCError({ code: "BAD_REQUEST", message: "Teléfono no válido." });
      }

      const db = await requireDb();

      // Mismo email + misma guía ya pendiente → se reutiliza (doble clic, recarga, reintento).
      const existing = await db
        .select()
        .from(orders)
        .where(and(eq(orders.customerEmail, input.email), eq(orders.productSlug, ebook.slug), eq(orders.status, "pending")))
        .limit(1);
      if (existing[0]) return { ...publicView(existing[0]), reused: true };

      const pending = await db
        .select({ n: sql<number>`count(*)` })
        .from(orders)
        .where(and(eq(orders.customerEmail, input.email), eq(orders.status, "pending")));
      if (Number(pending[0]?.n ?? 0) >= MAX_PENDING_PER_EMAIL) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Ya tienes varios pedidos pendientes de pago. Escribe a Cristina por WhatsApp.",
        });
      }
      throttleIp(clientIp(ctx.req));

      let clientId: number | null = null;
      try {
        clientId = (await findClientByEmail(input.email))?.id ?? null;
      } catch {
        /* no crítico */
      }

      let order: Order | undefined;
      for (let attempt = 0; attempt < 5 && !order; attempt++) {
        const reference = generateOrderReference();
        try {
          await db.insert(orders).values({
            reference,
            productType: "ebook",
            productSlug: ebook.slug,
            productTitle: ebook.title,
            amountCents: ebook.priceCents,
            currency: "EUR",
            customerName: input.name,
            customerEmail: input.email,
            customerPhone: phone,
            paymentMethod: "bizum",
            status: "pending",
            includesSession: ebook.includesSession ? 1 : 0,
            clientId,
          });
          order = await getByReference(reference);
        } catch (err) {
          if (!/duplicate/i.test(String((err as Error)?.message))) throw err; // colisión de referencia → reintenta
        }
      }
      if (!order) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No se pudo crear el pedido. Inténtalo de nuevo." });
      }

      // Avisos (no bloqueantes): cliente por email, Cristina por email y WhatsApp.
      const created = order;
      const mail = {
        reference: created.reference,
        customerName: created.customerName,
        customerEmail: created.customerEmail,
        customerPhone: created.customerPhone,
        productTitle: created.productTitle,
        amountCents: created.amountCents,
      };
      const warn = (what: string) => (err: unknown) =>
        console.warn(`[Orders] ${what} (${created.reference}):`, err instanceof Error ? err.message : err);
      sendOrderReceivedEmail(mail).catch(warn("email cliente"));
      sendOrderAdminEmail(mail).catch(warn("email admin"));
      notifyAdminNewOrder({
        reference: created.reference,
        productTitle: created.productTitle,
        amount: formatEuros(created.amountCents),
      }).catch(warn("WhatsApp admin"));

      return { ...publicView(created), reused: false };
    }),

  /** Público: estado de un pedido por su referencia (sin datos personales). */
  get: publicProcedure.input(z.object({ reference: z.string().max(20) })).query(async ({ input }) => {
    const ref = input.reference.trim().toUpperCase();
    if (!isValidOrderReference(ref)) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido no encontrado" });
    const order = await getByReference(ref);
    if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido no encontrado" });
    return publicView(order);
  }),

  /**
   * Público: «Ya he hecho el Bizum». NO confirma nada (la web no puede verificarlo): solo marca el pedido y
   * vuelve a avisar a Cristina, que lo comprueba en su banco. Una sola vez por pedido.
   */
  claimPaid: publicProcedure.input(z.object({ reference: z.string().max(20) })).mutation(async ({ input }) => {
    const ref = input.reference.trim().toUpperCase();
    if (!isValidOrderReference(ref)) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido no encontrado" });
    const order = await getByReference(ref);
    if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido no encontrado" });
    if (order.status === "pending" && !order.customerClaimedAt) {
      const db = await requireDb();
      const [res]: any = await db
        .update(orders)
        .set({ customerClaimedAt: Date.now() })
        .where(and(eq(orders.id, order.id), eq(orders.status, "pending"), sql`${orders.customerClaimedAt} is null`));
      if ((res?.affectedRows ?? 1) > 0) {
        notifyAdminNewOrder(
          { reference: order.reference, productTitle: order.productTitle, amount: formatEuros(order.amountCents) },
          "claimed"
        ).catch((err) =>
          console.warn(`[Orders] WhatsApp admin (claimed) ${order.reference}:`, err instanceof Error ? err.message : err)
        );
      }
    }
    return { ok: true };
  }),

  // ─── Admin (CRM) ───────────────────────────────────────────────────────────

  list: adminProcedure
    .input(z.object({ status: z.enum(["pending", "paid", "cancelled"]).optional() }).optional())
    .query(async ({ input }) => {
      const db = await requireDb();
      const where = input?.status ? eq(orders.status, input.status) : undefined;
      const rows = await db.select().from(orders).where(where).orderBy(desc(orders.createdAt), desc(orders.id)).limit(500);
      return rows.map(({ downloadToken: _t, ...o }) => o);
    }),

  pendingCount: adminProcedure.query(async () => {
    const db = await requireDb();
    const rows = await db.select({ n: sql<number>`count(*)` }).from(orders).where(eq(orders.status, "pending"));
    return { count: Number(rows[0]?.n ?? 0) };
  }),

  /** Cristina ha visto el Bizum en su banco: marca como pagado y entrega la guía (una sola vez). */
  confirmPayment: adminProcedure.input(z.object({ id: z.number().int() })).mutation(async ({ input, ctx }) => {
    const db = await requireDb();
    const [order] = await db.select().from(orders).where(eq(orders.id, input.id)).limit(1);
    if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido no encontrado" });
    if (order.status === "paid") return { alreadyPaid: true, emailSent: !!order.deliveryEmailSentAt };

    // UPDATE condicionado: si dos pulsaciones coinciden, solo una gana y solo se envía un email.
    const [res]: any = await db
      .update(orders)
      .set({ status: "paid", paidAt: Date.now(), paidByUserId: ctx.user.id, cancelledAt: null })
      .where(and(eq(orders.id, order.id), ne(orders.status, "paid")));
    if ((res?.affectedRows ?? 0) === 0) return { alreadyPaid: true, emailSent: !!order.deliveryEmailSentAt };

    const ebook = await resolveEbook(order.productSlug).catch(() => null);
    if (ebook?.crmTag) {
      try {
        const client = await findClientByEmail(order.customerEmail);
        if (client) {
          await updateClientTag(client.id, ebook.crmTag);
          if (!order.clientId) await db.update(orders).set({ clientId: client.id }).where(eq(orders.id, order.id));
        }
      } catch (err) {
        console.warn("[Orders] No se pudo etiquetar al cliente:", err);
      }
    }
    const [fresh] = await db.select().from(orders).where(eq(orders.id, order.id)).limit(1);
    const out = await deliver(fresh ?? order, ebook);
    return { alreadyPaid: false, ...out };
  }),

  /** Reenvía la guía (nuevo plazo de descarga) de un pedido ya pagado. */
  resendDelivery: adminProcedure.input(z.object({ id: z.number().int() })).mutation(async ({ input }) => {
    const db = await requireDb();
    const [order] = await db.select().from(orders).where(eq(orders.id, input.id)).limit(1);
    if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido no encontrado" });
    if (order.status !== "paid") throw new TRPCError({ code: "BAD_REQUEST", message: "Solo se puede reenviar un pedido pagado." });
    const ebook = await resolveEbook(order.productSlug).catch(() => null);
    return deliver(order, ebook);
  }),

  /** Cancela un pedido pendiente (no se ha cobrado). Un pedido pagado no se cancela desde aquí. */
  cancel: adminProcedure.input(z.object({ id: z.number().int() })).mutation(async ({ input }) => {
    const db = await requireDb();
    const [res]: any = await db
      .update(orders)
      .set({ status: "cancelled", cancelledAt: Date.now() })
      .where(and(eq(orders.id, input.id), eq(orders.status, "pending")));
    if ((res?.affectedRows ?? 0) === 0) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Solo se puede cancelar un pedido pendiente." });
    }
    return { ok: true };
  }),
});

/** Descarga por token de un pedido pagado (la usa `ebooks.download`). */
export async function findPaidOrderByDownloadToken(
  token: string
): Promise<{ order: Order; pdfUrl: string | null } | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(orders)
    .where(and(eq(orders.downloadToken, token), eq(orders.status, "paid")))
    .limit(1);
  const order = rows[0];
  if (!order || !order.downloadExpiresAt || order.downloadExpiresAt < Date.now()) return null;
  const ebook = await resolveEbook(order.productSlug).catch(() => null);
  await db
    .update(orders)
    .set({ downloadCount: (order.downloadCount ?? 0) + 1 })
    .where(eq(orders.id, order.id));
  return { order, pdfUrl: ebook?.pdfUrl ?? null };
}
