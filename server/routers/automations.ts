/**
 * Automations Router — Cristina Vive Consciente
 * Gestión de leads desde el formulario de contacto público.
 * Acceso al panel de logs de automatizaciones (admin).
 * Procesamiento de secuencias de emails pendientes.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import {
  findClientByEmail,
  createClient,
  createAutomationLog,
  updateAutomationLog,
  listAutomationLogs,
  getAutomationStats,
  createLeadSequence,
  getPendingLeadSequences,
  updateLeadSequence,
  listLeadSequences,
} from "../db";
import {
  sendLeadWelcomeEmail,
  sendAdminLeadNotificationEmail,
  sendLeadSequenceEmail,
} from "../email";
import { notifyOwner } from "../_core/notification";

// ─── HELPER: Registrar log de automatización ──────────────────────────────────

async function logAutomation(opts: {
  event: "booking_confirmation" | "booking_admin" | "ebook_delivery" | "lead_welcome" | "lead_sequence_1" | "lead_sequence_2" | "lead_sequence_3" | "whatsapp_booking";
  channel?: "email" | "whatsapp" | "sms";
  recipientEmail?: string;
  recipientPhone?: string;
  clientId?: number;
  subject?: string;
  fn: () => Promise<void>;
}): Promise<void> {
  const logId = await createAutomationLog({
    event: opts.event,
    channel: opts.channel ?? "email",
    recipientEmail: opts.recipientEmail,
    recipientPhone: opts.recipientPhone,
    clientId: opts.clientId,
    subject: opts.subject,
    status: "pending",
  });

  try {
    await opts.fn();
    await updateAutomationLog(logId, { status: "sent", sentAt: Date.now() });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[Automation] Error in ${opts.event}:`, errorMessage);
    await updateAutomationLog(logId, { status: "failed", errorMessage });
  }
}

// ─── HELPER: Programar secuencia de emails para lead ─────────────────────────

async function scheduleLeadSequence(clientId: number, email: string, name: string): Promise<void> {
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  // Email 1: día 3 (ya se envió el de bienvenida inmediato)
  await createLeadSequence({
    clientId,
    clientEmail: email,
    clientName: name,
    sequenceStep: 2,
    scheduledAt: now + 3 * DAY,
    status: "pending",
  });

  // Email 2: día 7
  await createLeadSequence({
    clientId,
    clientEmail: email,
    clientName: name,
    sequenceStep: 3,
    scheduledAt: now + 7 * DAY,
    status: "pending",
  });
}

// ─── ROUTER ───────────────────────────────────────────────────────────────────

export const automationsRouter = router({
  /**
   * Envío del formulario de contacto público.
   * Crea/actualiza cliente como lead, envía email de bienvenida,
   * notifica al admin y programa la secuencia de 3 emails.
   */
  submitContact: publicProcedure
    .input(
      z.object({
        firstName: z.string().min(1, "El nombre es obligatorio"),
        lastName: z.string().min(1, "Los apellidos son obligatorios"),
        email: z.string().email("Email no válido"),
        phone: z.string().optional(),
        subject: z.string().optional(),
        message: z.string().optional(),
        acceptPrivacy: z.boolean().refine((v) => v === true, {
          message: "Debes aceptar la política de privacidad",
        }),
      })
    )
    .mutation(async ({ input }) => {
      const emailNormalized = input.email.trim().toLowerCase();
      const fullName = `${input.firstName.trim()} ${input.lastName.trim()}`;

      // 1. Buscar o crear cliente como lead
      let clientId: number;
      const existing = await findClientByEmail(emailNormalized);

      if (existing) {
        clientId = existing.id;
      } else {
        clientId = await createClient({
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          email: emailNormalized,
          phone: input.phone?.trim() ?? null,
          status: "lead",
          notes: input.message ? `Formulario de contacto: ${input.message}` : null,
        });
      }

      const leadData = {
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        email: emailNormalized,
        phone: input.phone?.trim(),
        subject: input.subject?.trim(),
        message: input.message?.trim(),
      };

      // 2. Email de bienvenida al lead (inmediato)
      logAutomation({
        event: "lead_welcome",
        recipientEmail: emailNormalized,
        clientId,
        subject: `Hola ${input.firstName}, me alegra que hayas contactado`,
        fn: () => sendLeadWelcomeEmail(leadData),
      }).catch(console.error);

      // 3. Notificación al admin
      logAutomation({
        event: "lead_welcome",
        recipientEmail: process.env.ADMIN_EMAIL ?? "",
        clientId,
        subject: `Nuevo lead — ${fullName}`,
        fn: () => sendAdminLeadNotificationEmail(leadData),
      }).catch(console.error);

      // 4. Notificación Manus
      notifyOwner({
        title: `Nuevo lead — ${fullName}`,
        content: `${fullName} (${emailNormalized}${input.phone ? ` · ${input.phone}` : ""}) ha contactado a través del formulario.${input.subject ? ` Asunto: ${input.subject}.` : ""}${input.message ? ` Mensaje: "${input.message}"` : ""}`,
      }).catch(console.error);

      // 5. Programar secuencia de emails (días 3 y 7)
      scheduleLeadSequence(clientId, emailNormalized, fullName).catch(console.error);

      return {
        success: true,
        message: "Hemos recibido tu mensaje. Cristina te responderá en las próximas 24–48 horas.",
      };
    }),

  /**
   * Procesar secuencias de emails pendientes.
   * Se llama desde el scheduler del servidor cada hora.
   * También disponible como endpoint admin para forzar el procesamiento.
   */
  processSequences: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    const pending = await getPendingLeadSequences();
    let processed = 0;
    let errors = 0;

    for (const seq of pending) {
      const step = seq.sequenceStep as 1 | 2 | 3;
      const firstName = seq.clientName.split(" ")[0];

      try {
        await logAutomation({
          event: `lead_sequence_${step}` as "lead_sequence_1" | "lead_sequence_2" | "lead_sequence_3",
          recipientEmail: seq.clientEmail,
          clientId: seq.clientId,
          subject: `Secuencia lead paso ${step}`,
          fn: () => sendLeadSequenceEmail(step, { email: seq.clientEmail, firstName }),
        });
        await updateLeadSequence(seq.id, { status: "sent", sentAt: Date.now() });
        processed++;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        await updateLeadSequence(seq.id, { status: "failed", errorMessage });
        errors++;
      }
    }

    return { processed, errors, total: pending.length };
  }),

  // ─── PANEL ADMIN ───────────────────────────────────────────────────────────

  /** Listar logs de automatizaciones (admin) */
  listLogs: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(500).default(100) }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return listAutomationLogs(input.limit);
    }),

  /** Estadísticas de automatizaciones (admin) */
  stats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    return getAutomationStats();
  }),

  /** Listar secuencias de leads (admin) */
  listSequences: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(500).default(100) }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return listLeadSequences(input.limit);
    }),
});
