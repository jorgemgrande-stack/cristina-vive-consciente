/**
 * Bookings Router — Capa pública de solicitud de citas
 * Permite a usuarios sin autenticar solicitar una cita.
 * Reutiliza las tablas clients y appointments del CRM.
 * Las citas se crean con status "pending" para que Cristina las gestione desde el CRM.
 */
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { createClient, createAppointment, findClientByEmail } from "../db";
import { notifyOwner } from "../_core/notification";

const SERVICE_LABELS: Record<string, string> = {
  consulta_acompanamiento: "Consulta de Acompañamiento",
  consulta_naturopata: "Consulta Naturópata",
  consulta_breve: "Consulta Breve",
  consulta_express: "Consulta Express",
  biohabitabilidad: "Biohabitabilidad",
  kinesiologia: "Kinesiología",
  masaje: "Masaje Terapéutico",
  otro: "Otro",
};

export const bookingsRouter = router({
  /**
   * Solicitud pública de cita.
   * 1. Busca si el cliente ya existe por email.
   * 2. Si no existe, lo crea como "lead".
   * 3. Crea la cita con status "pending".
   * 4. Notifica al admin.
   */
  request: publicProcedure
    .input(
      z.object({
        // Datos del solicitante
        firstName: z.string().min(1, "El nombre es obligatorio"),
        lastName: z.string().min(1, "Los apellidos son obligatorios"),
        email: z.string().email("Email no válido"),
        phone: z.string().optional(),
        // Datos de la cita
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
        preferredDate: z.string().min(1, "La fecha preferida es obligatoria"), // ISO string
        preferredTime: z.string().optional(), // "HH:MM"
        modality: z.enum(["presencial", "telefono", "zoom", "whatsapp"]).default("zoom"),
        message: z.string().optional(), // Mensaje libre del usuario
      })
    )
    .mutation(async ({ input }) => {
      // 1. Buscar o crear cliente (deduplicación por email, case-insensitive)
      let clientId: number;
      const emailNormalized = input.email.trim().toLowerCase();

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
        });
      }

      // 2. Construir timestamp de la cita con validación
      const dateStr = input.preferredDate;
      const timeStr = input.preferredTime ?? "12:00";
      const scheduledAt = new Date(`${dateStr}T${timeStr}:00`).getTime();
      if (isNaN(scheduledAt)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Fecha u hora no válida" });
      }

      // 3. Crear la cita con status pending
      const serviceLabel = SERVICE_LABELS[input.serviceType] ?? input.serviceType;
      await createAppointment({
        clientId,
        serviceType: input.serviceType,
        serviceLabel,
        scheduledAt,
        modality: input.modality,
        status: "pending",
        internalNotes: input.message
          ? `Mensaje del solicitante: ${input.message}`
          : null,
      });

      // 4. Notificar al admin (no bloqueante)
      try {
        await notifyOwner({
          title: "Nueva solicitud de cita",
          content: `${input.firstName} ${input.lastName} (${input.email}) ha solicitado una cita de ${serviceLabel} para el ${dateStr} a las ${timeStr}. Modalidad: ${input.modality}.${input.message ? ` Mensaje: "${input.message}"` : ""}`,
        });
      } catch {
        // Notificación no crítica, no bloquear la respuesta
      }

      return { success: true };
    }),
});
