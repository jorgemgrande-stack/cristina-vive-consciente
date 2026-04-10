/**
 * CRM Router — Cristina Vive Consciente
 * Gestión de clientes, citas, notas, historial y facturas
 */
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { generateInvoicePdf } from "../invoicePdf";
import {
  sendInvoiceEmail,
  sendAppointmentAcceptedEmail,
  sendAppointmentAcceptedAdminEmail,
  sendAppointmentCancelledEmail,
  sendAppointmentCancelledAdminEmail,
  sendRescheduleProposalEmail,
} from "../email";
import {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  getTodayAppointments,
  getUpcomingAppointments,
  getAppointmentByRescheduleToken,
  getClientNotes,
  createClientNote,
  updateClientNote,
  deleteClientNote,
  getSessionHistory,
  createSessionHistory,
  updateSessionHistory,
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  getNextInvoiceNumber,
  getDashboardStats,
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "../db";
import crypto from "crypto";

// Admin middleware
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acceso restringido a administradores" });
  }
  return next({ ctx });
});

// ─── CLIENTS ──────────────────────────────────────────────────────────────────
const clientsRouter = router({
  list: adminProcedure
    .input(z.object({ search: z.string().optional(), status: z.string().optional() }))
    .query(({ input }) => getClients(input.search, input.status)),

  get: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const client = await getClientById(input.id);
      if (!client) throw new TRPCError({ code: "NOT_FOUND", message: "Cliente no encontrado" });
      return client;
    }),

  create: adminProcedure
    .input(
      z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional(),
        status: z.enum(["active", "inactive", "lead"]).optional(),
        birthDate: z.string().optional(),
        address: z.string().optional(),
        postalCode: z.string().optional(),
        city: z.string().optional(),
        province: z.string().optional(),
        country: z.string().optional(),
        nif: z.string().optional(),
        razonSocial: z.string().optional(),
        notes: z.string().optional(),
        referredBy: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await createClient({ ...input, createdBy: ctx.user.id, email: input.email || undefined });
      return { success: true };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional(),
        status: z.enum(["active", "inactive", "lead"]).optional(),
        birthDate: z.string().optional(),
        address: z.string().optional(),
        postalCode: z.string().optional(),
        city: z.string().optional(),
        province: z.string().optional(),
        country: z.string().optional(),
        nif: z.string().optional(),
        razonSocial: z.string().optional(),
        notes: z.string().optional(),
        referredBy: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateClient(id, data);
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteClient(input.id);
      return { success: true };
    }),
});

// ─── APPOINTMENTS ─────────────────────────────────────────────────────────────
const appointmentsRouter = router({
  list: adminProcedure
    .input(
      z.object({
        clientId: z.number().optional(),
        status: z.string().optional(),
        from: z.number().optional(),
        to: z.number().optional(),
      })
    )
    .query(({ input }) => getAppointments(input)),

  get: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const appt = await getAppointmentById(input.id);
      if (!appt) throw new TRPCError({ code: "NOT_FOUND", message: "Cita no encontrada" });
      return appt;
    }),

  today: adminProcedure.query(() => getTodayAppointments()),

  upcoming: adminProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(({ input }) => getUpcomingAppointments(input.limit)),

  create: adminProcedure
    .input(
      z.object({
        clientId: z.number(),
        serviceType: z.enum([
          "consulta_acompanamiento",
          "consulta_naturopata",
          "consulta_breve",
          "consulta_express",
          "biohabitabilidad",
          "kinesiologia",
          "masaje",
          "otro",
        ]),
        serviceLabel: z.string().optional(),
        scheduledAt: z.number(),
        durationMinutes: z.number().optional(),
        modality: z.enum(["presencial", "telefono", "zoom", "whatsapp"]).optional(),
        status: z.enum(["pending", "confirmed", "completed", "cancelled", "rescheduled"]).optional(),
        price: z.string().optional(),
        internalNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await createAppointment({ ...input, createdBy: ctx.user.id });
      return { success: true };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        serviceType: z.enum([
          "consulta_acompanamiento",
          "consulta_naturopata",
          "consulta_breve",
          "consulta_express",
          "biohabitabilidad",
          "kinesiologia",
          "masaje",
          "otro",
        ]).optional(),
        serviceLabel: z.string().optional(),
        scheduledAt: z.number().optional(),
        durationMinutes: z.number().optional(),
        modality: z.enum(["presencial", "telefono", "zoom", "whatsapp"]).optional(),
        status: z.enum(["pending", "confirmed", "completed", "cancelled", "rescheduled"]).optional(),
        price: z.string().optional(),
        internalNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateAppointment(id, data);
      return { success: true };
    }),

  /** Acepta una cita pendiente → confirmed + emails */
  accept: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const row = await getAppointmentById(input.id);
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Cita no encontrada" });
      const { appointment: appt, client } = row;
      await updateAppointment(input.id, { status: "confirmed" });

      const emailData = {
        clientFirstName: client?.firstName ?? "Cliente",
        clientEmail: client?.email ?? "",
        serviceLabel: appt.serviceLabel ?? appt.serviceType,
        scheduledAt: appt.scheduledAt,
        modality: appt.modality ?? "zoom",
      };

      if (client?.email) {
        sendAppointmentAcceptedEmail(emailData).catch((e) =>
          console.warn("[Email] accept client:", e)
        );
      }
      sendAppointmentAcceptedAdminEmail({
        ...emailData,
        clientLastName: client?.lastName ?? "",
        clientPhone: client?.phone ?? undefined,
      }).catch((e) => console.warn("[Email] accept admin:", e));

      return { success: true };
    }),

  /** Cancela una cita con motivo → cancelled + emails */
  cancelWithReason: adminProcedure
    .input(z.object({ id: z.number(), reason: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const row = await getAppointmentById(input.id);
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Cita no encontrada" });
      const { appointment: appt, client } = row;
      await updateAppointment(input.id, { status: "cancelled", cancellationReason: input.reason });

      const emailData = {
        clientFirstName: client?.firstName ?? "Cliente",
        clientEmail: client?.email ?? "",
        serviceLabel: appt.serviceLabel ?? appt.serviceType,
        scheduledAt: appt.scheduledAt,
        modality: appt.modality ?? "zoom",
        cancellationReason: input.reason,
      };

      if (client?.email) {
        sendAppointmentCancelledEmail(emailData).catch((e) =>
          console.warn("[Email] cancel client:", e)
        );
      }
      sendAppointmentCancelledAdminEmail({
        ...emailData,
        clientLastName: client?.lastName ?? "",
      }).catch((e) => console.warn("[Email] cancel admin:", e));

      return { success: true };
    }),

  /** Propone nuevas fechas → rescheduled + genera token + envía email al cliente */
  proposeSlots: adminProcedure
    .input(
      z.object({
        id: z.number(),
        slots: z.array(z.object({ date: z.string(), time: z.string() })).min(1).max(5),
      })
    )
    .mutation(async ({ input }) => {
      const row = await getAppointmentById(input.id);
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Cita no encontrada" });
      const { appointment: appt, client } = row;

      const token = crypto.randomBytes(24).toString("hex");
      await updateAppointment(input.id, {
        status: "rescheduled",
        rescheduleToken: token,
        proposedSlots: JSON.stringify(input.slots),
      });

      const emailData = {
        clientFirstName: client?.firstName ?? "Cliente",
        clientEmail: client?.email ?? "",
        serviceLabel: appt.serviceLabel ?? appt.serviceType,
        scheduledAt: appt.scheduledAt,
        modality: appt.modality ?? "zoom",
        proposedSlots: input.slots,
        rescheduleToken: token,
      };

      if (client?.email) {
        sendRescheduleProposalEmail(emailData).catch((e) =>
          console.warn("[Email] proposeSlots:", e)
        );
      }

      return { success: true, token };
    }),

  /** Público: el cliente selecciona un slot propuesto */
  selectSlot: publicProcedure
    .input(z.object({ token: z.string(), slotIndex: z.number().min(0).max(4) }))
    .mutation(async ({ input }) => {
      const row = await getAppointmentByRescheduleToken(input.token);
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Enlace no válido o expirado" });
      const { appointment: appt } = row;

      const slots: Array<{ date: string; time: string }> = appt.proposedSlots
        ? JSON.parse(appt.proposedSlots)
        : [];
      if (!slots[input.slotIndex]) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Opción no válida" });
      }

      const chosen = slots[input.slotIndex];
      const [year, month, day] = chosen.date.split("-").map(Number);
      const [hour, minute] = chosen.time.split(":").map(Number);
      const newScheduledAt = new Date(year, month - 1, day, hour, minute).getTime();

      // Nueva cita pending con la fecha elegida, limpia el token
      await updateAppointment(appt.id, {
        scheduledAt: newScheduledAt,
        status: "pending",
        rescheduleToken: null as any,
        proposedSlots: null as any,
      });

      return { success: true };
    }),
});

// ─── CLIENT NOTES ─────────────────────────────────────────────────────────────
const notesRouter = router({
  list: adminProcedure
    .input(z.object({ clientId: z.number() }))
    .query(({ input }) => getClientNotes(input.clientId)),

  create: adminProcedure
    .input(
      z.object({
        clientId: z.number(),
        appointmentId: z.number().optional(),
        type: z.enum(["general", "sesion", "seguimiento", "observacion", "alerta"]).optional(),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await createClientNote({ ...input, createdBy: ctx.user.id });
      return { success: true };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        content: z.string().min(1).optional(),
        type: z.enum(["general", "sesion", "seguimiento", "observacion", "alerta"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateClientNote(id, data);
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteClientNote(input.id);
      return { success: true };
    }),
});

// ─── SESSION HISTORY ──────────────────────────────────────────────────────────
const sessionsRouter = router({
  list: adminProcedure
    .input(z.object({ clientId: z.number() }))
    .query(({ input }) => getSessionHistory(input.clientId)),

  create: adminProcedure
    .input(
      z.object({
        clientId: z.number(),
        appointmentId: z.number().optional(),
        summary: z.string().optional(),
        protocols: z.string().optional(),
        nextSteps: z.string().optional(),
        recommendedProducts: z.string().optional(),
        supplements: z.string().optional(),
        sessionDate: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await createSessionHistory({ ...input, createdBy: ctx.user.id });
      return { success: true };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        summary: z.string().optional(),
        protocols: z.string().optional(),
        nextSteps: z.string().optional(),
        recommendedProducts: z.string().optional(),
        supplements: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateSessionHistory(id, data);
      return { success: true };
    }),
});

// ─── INVOICES ─────────────────────────────────────────────────────────────────
const invoicesRouter = router({
  list: adminProcedure
    .input(z.object({ clientId: z.number().optional(), status: z.string().optional() }))
    .query(({ input }) => getInvoices(input.clientId, input.status)),

  get: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const inv = await getInvoiceById(input.id);
      if (!inv) throw new TRPCError({ code: "NOT_FOUND", message: "Factura no encontrada" });
      return inv;
    }),

  nextNumber: adminProcedure.query(() => getNextInvoiceNumber()),

  create: adminProcedure
    .input(
      z.object({
        clientId: z.number(),
        appointmentId: z.number().optional(),
        concept: z.string().min(1),
        subtotal: z.string(),
        tax: z.string().optional(),
        total: z.string(),
        notes: z.string().optional(),
        issuedAt: z.number(),
        dueAt: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const invoiceNumber = await getNextInvoiceNumber();
      await createInvoice({ ...input, invoiceNumber, createdBy: ctx.user.id });
      return { success: true, invoiceNumber };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["draft", "sent", "paid", "cancelled"]).optional(),
        notes: z.string().optional(),
        paidAt: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateInvoice(id, data);
      return { success: true };
    }),

  sendByEmail: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const inv = await getInvoiceById(input.id);
      if (!inv) throw new TRPCError({ code: "NOT_FOUND", message: "Factura no encontrada" });

      // Determinar email del destinatario
      const toEmail = (inv as any).client?.email ?? (inv as any).clientEmail ?? null;
      if (!toEmail) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "El cliente no tiene email registrado",
        });
      }

      const invoice = (inv as any).invoice ?? inv;
      const client = (inv as any).client;

      // Generar PDF en memoria
      const pdfBuffer = await generateInvoicePdf(input.id);

      // Enviar email con PDF adjunto
      await sendInvoiceEmail({
        to: toEmail,
        clientName: client ? `${client.firstName} ${client.lastName}` : ((inv as any).clientName ?? "Cliente"),
        invoiceNumber: invoice.invoiceNumber,
        concept: invoice.concept ?? "",
        total: invoice.total ?? "0",
        issuedAt: invoice.issuedAt,
        pdfBuffer,
      });

      // Marcar como enviada si estaba en borrador
      if (invoice.status === "draft") {
        await updateInvoice(input.id, { status: "sent" });
      }

      return { success: true, sentTo: toEmail };
    }),
});

// ─── CALENDAR EVENTS ──────────────────────────────────────────────────────────
const calendarEventsRouter = router({
  list: adminProcedure
    .input(z.object({ from: z.number(), to: z.number() }))
    .query(({ input }) => getCalendarEvents(input.from, input.to)),

  create: adminProcedure
    .input(
      z.object({
        title: z.string().min(1),
        notes: z.string().optional(),
        eventAt: z.number(),
        durationMinutes: z.number().optional(),
        type: z.enum(["bloqueo", "formacion", "recordatorio", "reunion", "personal"]).optional(),
        color: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const id = await createCalendarEvent({ ...input, createdBy: ctx.user.id });
      return { success: true, id };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        notes: z.string().optional(),
        eventAt: z.number().optional(),
        durationMinutes: z.number().optional(),
        type: z.enum(["bloqueo", "formacion", "recordatorio", "reunion", "personal"]).optional(),
        color: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateCalendarEvent(id, data);
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteCalendarEvent(input.id);
      return { success: true };
    }),
});

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
const dashboardRouter = router({
  stats: adminProcedure.query(() => getDashboardStats()),
  todayAppointments: adminProcedure.query(() => getTodayAppointments()),
  upcomingAppointments: adminProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(({ input }) => getUpcomingAppointments(input.limit ?? 8)),
});

// ─── EXPORT ───────────────────────────────────────────────────────────────────
export const crmRouter = router({
  dashboard: dashboardRouter,
  clients: clientsRouter,
  appointments: appointmentsRouter,
  notes: notesRouter,
  sessions: sessionsRouter,
  invoices: invoicesRouter,
  calendarEvents: calendarEventsRouter,
});
