/**
 * Ebooks Router — Cristina Vive Consciente
 *
 * Endpoints:
 * - ebooks.list          → lista pública de ebooks disponibles
 * - ebooks.createCheckout → crea Stripe Checkout Session (requiere Stripe configurado)
 * - ebooks.getDownload   → descarga segura por token (sin auth)
 *
 * Webhook Stripe: /api/stripe/webhook (registrado en server/_core/index.ts)
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { ebookPurchases } from "../../drizzle/schema";
import { eq, and, gt } from "drizzle-orm";
import { getAllEbooks, getEbook } from "../ebooks/products";
import { getEbookBySlug } from "../db";
import { notifyOwner } from "../_core/notification";
import { sendEbookDeliveryEmail } from "../email";
import { findClientByEmail, updateClientTag } from "../db";
import { notifyAdminNewPurchase } from "../whatsapp";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? "";

function getStripe() {
  if (!STRIPE_SECRET_KEY) return null;
  // Lazy import to avoid crash when key is not configured
  const Stripe = require("stripe");
  return new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
}

export const ebooksRouter = router({
  /**
   * Lista pública de ebooks disponibles
   */
  list: publicProcedure.query(() => {
    return getAllEbooks().map((e) => ({
      id: e.id,
      title: e.title,
      subtitle: e.subtitle,
      description: e.description,
      price: e.price,
      currency: e.currency,
      coverImage: e.coverImage,
      includesSession: e.includesSession,
      available: !!e.stripePriceId, // solo disponible si tiene Price en Stripe
    }));
  }),

  /**
   * Crea una Stripe Checkout Session para comprar un ebook.
   * Devuelve la URL de Stripe Checkout para redirigir al usuario.
   */
  createCheckout: publicProcedure
    .input(
      z.object({
        ebookId: z.string().min(1), // slug dinámico (agua, aceites, o cualquier slug de la BD)
        customerEmail: z.string().email().optional(),
        origin: z.string().url(), // window.location.origin desde el frontend
      })
    )
    .mutation(async ({ input }) => {
      // Primero buscar en la tabla ebooks (BD dinámica)
      let ebookTitle = "";
      let ebookStripePriceId: string | null = null;
      let ebookIncludesSession = false;
      let ebookDownloadExpiryHours = 72;

      const dbEbook = await getEbookBySlug(input.ebookId);
      if (dbEbook && dbEbook.status === "active") {
        ebookTitle = dbEbook.title;
        ebookStripePriceId = dbEbook.stripePriceId;
        ebookIncludesSession = dbEbook.includesSession === 1;
        ebookDownloadExpiryHours = dbEbook.downloadExpiryHours;
      } else {
        // Fallback: buscar en el catálogo estático (retrocompatibilidad)
        const staticEbook = getEbook(input.ebookId as "agua" | "aceites");
        if (!staticEbook) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Ebook no encontrado" });
        }
        ebookTitle = staticEbook.title;
        ebookStripePriceId = staticEbook.stripePriceId;
        ebookIncludesSession = staticEbook.includesSession;
        ebookDownloadExpiryHours = staticEbook.downloadExpiryHours;
      }

      const stripe = getStripe();
      if (!stripe) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "El sistema de pagos no está configurado todavía. Por favor, contacta con Cristina directamente.",
        });
      }

      if (!ebookStripePriceId) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Este ebook no está disponible para compra en este momento.",
        });
      }

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price: ebookStripePriceId,
            quantity: 1,
          },
        ],
        customer_email: input.customerEmail,
        allow_promotion_codes: true,
        metadata: {
          ebook_id: input.ebookId,
          ebook_title: ebookTitle,
        },
        success_url: `${input.origin}/ebooks/gracias?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${input.origin}/guias-digitales`,
      });

      return { checkoutUrl: session.url };
    }),

  /**
   * Descarga segura de ebook por token.
   * El token expira a las 72h y tiene límite de descargas.
   */
  download: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de datos no disponible" });

      const now = Date.now();
      const rows = await db
        .select()
        .from(ebookPurchases)
        .where(
          and(
            eq(ebookPurchases.downloadToken, input.token),
            eq(ebookPurchases.status, "completed"),
            gt(ebookPurchases.downloadExpiresAt, now)
          )
        )
        .limit(1);

      const purchase = rows[0];
      if (!purchase) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Enlace de descarga no válido o expirado. Contacta con Cristina si necesitas ayuda.",
        });
      }

      const ebook = getEbook(purchase.ebookId);
      if (!ebook?.pdfUrl) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "El archivo PDF no está disponible en este momento. Contacta con Cristina.",
        });
      }

      // Incrementar contador de descargas
      await db
        .update(ebookPurchases)
        .set({ downloadCount: (purchase.downloadCount ?? 0) + 1 })
        .where(eq(ebookPurchases.id, purchase.id));

      return {
        pdfUrl: ebook.pdfUrl,
        title: ebook.title,
        expiresAt: purchase.downloadExpiresAt,
      };
    }),

  /**
   * Verificar estado de una compra por session_id de Stripe
   * (para la página de éxito)
   */
  verifyPurchase: publicProcedure
    .input(z.object({ sessionId: z.string().min(1) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de datos no disponible" });

      const rows = await db
        .select()
        .from(ebookPurchases)
        .where(eq(ebookPurchases.stripeSessionId, input.sessionId))
        .limit(1);

      const purchase = rows[0];
      if (!purchase) {
        return { found: false, status: null, downloadToken: null };
      }

      return {
        found: true,
        status: purchase.status,
        downloadToken: purchase.status === "completed" ? purchase.downloadToken : null,
        ebookTitle: purchase.ebookTitle,
        customerEmail: purchase.customerEmail,
      };
    }),
});

/**
 * Procesar evento de Stripe: checkout.session.completed
 * Llamado desde el webhook handler en server/_core/index.ts
 */
export async function handleStripeCheckoutCompleted(session: any): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("[Ebooks] DB not available for webhook processing");
    return;
  }

  const ebookId = session.metadata?.ebook_id;
  const ebookTitle = session.metadata?.ebook_title;
  const customerEmail = session.customer_email ?? session.customer_details?.email ?? "";
  const customerName = session.customer_details?.name ?? "";
  const amountCents = session.amount_total ?? 0;

  if (!ebookId || !customerEmail) {
    console.warn("[Ebooks] Missing ebook_id or customer_email in session metadata");
    return;
  }

  const ebook = getEbook(ebookId);
  if (!ebook) {
    console.warn("[Ebooks] Unknown ebook_id:", ebookId);
    return;
  }

  // Generar token de descarga único
  const downloadToken = nanoid(48);
  const downloadExpiresAt = Date.now() + ebook.downloadExpiryHours * 60 * 60 * 1000;

  // Buscar cliente en CRM para vincular
  let clientId: number | null = null;
  try {
    const client = await findClientByEmail(customerEmail.toLowerCase());
    if (client) {
      clientId = client.id;
      // Etiquetar cliente en CRM
      await updateClientTag(client.id, ebook.crmTag);
    }
  } catch (err) {
    console.warn("[Ebooks] Could not link/tag CRM client:", err);
  }

  // Registrar la compra en DB
  await db.insert(ebookPurchases).values({
    stripeSessionId: session.id,
    stripePaymentIntentId: session.payment_intent ?? null,
    customerEmail: customerEmail.toLowerCase(),
    customerName: customerName || null,
    ebookId,
    ebookTitle: ebookTitle ?? ebook.title,
    amountCents,
    currency: (session.currency ?? "eur").toUpperCase(),
    downloadToken,
    downloadExpiresAt,
    downloadCount: 0,
    status: "completed",
    clientId,
  });

  // Enviar email de entrega al cliente
  try {
    await sendEbookDeliveryEmail({
      customerEmail,
      customerName,
      ebookTitle: ebookTitle ?? ebook.title,
      downloadToken,
      downloadExpiresAt,
      includesSession: ebook.includesSession,
    });
    // Marcar email como enviado
    await db
      .update(ebookPurchases)
      .set({ emailSentAt: Date.now() })
      .where(eq(ebookPurchases.stripeSessionId, session.id));
  } catch (err) {
    console.error("[Ebooks] Error sending delivery email:", err);
  }

  // Notificar al admin via WhatsApp
  notifyAdminNewPurchase({
    firstName: customerName?.split(" ")[0] ?? "Cliente",
    lastName: customerName?.split(" ").slice(1).join(" ") ?? "",
    email: customerEmail,
    productName: ebookTitle ?? ebook.title,
    amount: `${(amountCents / 100).toFixed(2)}€`,
  }).catch((err) => {
    console.warn("[WhatsApp] Error notifying admin (purchase):", err);
  });

  // Notificar al admin via Manus
  try {
    await notifyOwner({
      title: `Nueva venta de ebook — ${ebookTitle ?? ebook.title}`,
      content: `${customerName || customerEmail} ha comprado "${ebookTitle ?? ebook.title}" por ${(amountCents / 100).toFixed(2)}€. Email de entrega enviado a ${customerEmail}.`,
    });
  } catch {
    // No crítico
  }

  console.log(`[Ebooks] Purchase completed: ${ebookId} → ${customerEmail} (token: ${downloadToken.substring(0, 8)}...)`);
}
