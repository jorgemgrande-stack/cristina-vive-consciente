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
  acceptAppointment,
  assertTransition,
  cancelAppointmentWithReason,
  proposeAppointmentSlots,
  selectProposedSlot,
  trackNotification,
} from "../bookingActions";
import {
  ACCEPTABLE_FROM,
  APPOINTMENT_SERVICE_TYPES,
  CANCELLABLE_FROM,
  PROPOSABLE_FROM,
  canTransition,
  madridLocalToEpoch,
  validateRequestedDate,
  type AppointmentStatus,
} from "../bookingRules";
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
  getAppointmentEvents,
  logAppointmentEvent,
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
  deleteInvoice,
  replaceInvoiceItems,
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
        serviceType: z.string().optional(),
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

  /** Historial de la cita: alta, cambios de estado y notificaciones (con su resultado). */
  events: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getAppointmentEvents(input.id)),

  today: adminProcedure.query(() => getTodayAppointments()),

  upcoming: adminProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(({ input }) => getUpcomingAppointments(input.limit)),

  create: adminProcedure
    .input(
      z.object({
        clientId: z.number(),
        serviceType: z.enum(APPOINTMENT_SERVICE_TYPES),
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
        serviceType: z.enum(APPOINTMENT_SERVICE_TYPES).optional(),
        serviceLabel: z.string().optional(),
        scheduledAt: z.number().optional(),
        durationMinutes: z.number().optional(),
        modality: z.enum(["presencial", "telefono", "zoom", "whatsapp"]).optional(),
        status: z.enum(["pending", "confirmed", "completed", "cancelled", "rescheduled"]).optional(),
        price: z.string().optional(),
        internalNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      // Cambio manual de estado (desplegable del listado): no envía emails, pero queda registrado.
      const before = data.status ? await getAppointmentById(id) : undefined;
      await updateAppointment(id, data);
      if (data.status && before && before.appointment.status !== data.status) {
        await logAppointmentEvent({
          appointmentId: id,
          type: "status_changed",
          fromStatus: before.appointment.status,
          toStatus: data.status,
          detail: "Cambio manual (sin notificación al cliente)",
          actorUserId: ctx.user.id,
        });
      }
      return { success: true };
    }),

  /** Acepta una solicitud pendiente → confirmed + emails. Solo desde "pending". */
  accept: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input, ctx }) => acceptAppointment(input.id, ctx.user.id)),

  /** Rechaza/cancela una cita con motivo → cancelled + emails. No sobre citas ya completadas o canceladas. */
  cancelWithReason: adminProcedure
    .input(z.object({ id: z.number(), reason: z.string().min(1) }))
    .mutation(({ input, ctx }) => cancelAppointmentWithReason(input.id, input.reason, ctx.user.id)),

  /** Propone nuevas fechas → rescheduled + token de un solo uso + email al cliente */
  proposeSlots: adminProcedure
    .input(
      z.object({
        id: z.number(),
        slots: z.array(z.object({ date: z.string(), time: z.string() })).min(1).max(5),
      })
    )
    .mutation(({ input, ctx }) => proposeAppointmentSlots(input.id, input.slots, ctx.user.id)),

  /** Público: el cliente selecciona un slot propuesto (misma lógica que bookings.selectSlot) */
  selectSlot: publicProcedure
    .input(z.object({ token: z.string(), slotIndex: z.number().min(0).max(4) }))
    .mutation(async ({ input }) => {
      await selectProposedSlot(input.token, input.slotIndex);
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
        items: z
          .array(
            z.object({
              description: z.string().min(1),
              quantity: z.string(),
              unitPrice: z.string(),
              amount: z.string(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { items, ...invoiceData } = input;
      const invoiceNumber = await getNextInvoiceNumber();
      const invoiceId = await createInvoice({ ...invoiceData, invoiceNumber, createdBy: ctx.user.id });
      if (items && items.length > 0) {
        await replaceInvoiceItems(invoiceId, items);
      }
      return { success: true, invoiceNumber, id: invoiceId };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        clientId: z.number().optional(),
        concept: z.string().optional(),
        subtotal: z.string().optional(),
        tax: z.string().optional(),
        total: z.string().optional(),
        status: z.enum(["draft", "sent", "paid", "cancelled"]).optional(),
        notes: z.string().optional(),
        issuedAt: z.number().optional(),
        dueAt: z.number().optional(),
        paidAt: z.number().optional(),
        items: z
          .array(
            z.object({
              description: z.string().min(1),
              quantity: z.string(),
              unitPrice: z.string(),
              amount: z.string(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, items, ...data } = input;
      await updateInvoice(id, data);
      if (items !== undefined) {
        await replaceInvoiceItems(id, items);
      }
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const inv = await getInvoiceById(input.id);
      if (!inv) throw new TRPCError({ code: "NOT_FOUND", message: "Factura no encontrada" });
      await deleteInvoice(input.id);
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
