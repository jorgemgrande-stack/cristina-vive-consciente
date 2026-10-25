/**
 * Ficha integral de clientes (router `care`).
 *
 * - Todo requiere sesión de administrador (rol admin), comprobado en el servidor en cada operación.
 * - Datos administrativos y prácticos: perfil del cliente y sesiones.
 * - Datos de salud o emocionales (Primera visita, Acompañamiento emocional): se guardan cifrados y solo con
 *   consentimiento explícito vigente de ese cliente para ese módulo, comprobado aquí antes de guardar. Sin
 *   clave de cifrado configurada (server/sensitive/config.ts) el servidor rechaza leerlos o guardarlos antes
 *   de tocar la base de datos.
 * - El registro de auditoría guarda quién, qué acción y qué campos; nunca contenido.
 * - Ningún error ni log incluye contenido de notas o datos sensibles.
 */
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  CONSENT_METHODS,
  CONSENT_TEXTS,
  changedFields,
  emotionalPayload,
  firstVisitPayload,
  lastVisit,
  nextAppointment,
  profileInput,
  retentionReview,
  servicesReceived,
  sessionInput,
  type SessionInput,
} from "../../shared/clientCare";
import * as care from "../clientCareDb";
import { allModulesReadiness, keyVersion, moduleReadiness, type SensitiveModule } from "../sensitive/config";
import { decryptPayload, encryptPayload } from "../sensitive/crypto";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx });
});

const MODULE_LABEL: Record<SensitiveModule, string> = {
  first_visit: "Primera visita",
  emotional: "Acompañamiento emocional",
};

/** Sin clave de cifrado no se puede leer ni guardar: se rechaza antes de validar la entrada o consultar datos. */
const sensitiveProcedure = (module: SensitiveModule) =>
  adminProcedure.use(async ({ ctx, next, getRawInput }) => {
    if (!moduleReadiness(module).enabled) {
      let clientId: number | null = null;
      try {
        const raw = (await getRawInput()) as { clientId?: unknown } | undefined;
        clientId = typeof raw?.clientId === "number" ? raw.clientId : null;
      } catch {
        /* sin entrada legible: se registra sin cliente */
      }
      await care.insertAudit({ userId: ctx.user.id, action: "denied_no_key", entityType: module, clientId }).catch(() => undefined);
      throw new TRPCError({ code: "FORBIDDEN", message: `«${MODULE_LABEL[module]}»: falta configurar la clave de cifrado en el servidor.` });
    }
    return next({ ctx });
  });

const clientIdInput = z.object({ clientId: z.number().int().positive() });
const moduleInput = clientIdInput.extend({ module: z.enum(["first_visit", "emotional"]) });

function requireReady(module: SensitiveModule) {
  if (!moduleReadiness(module).enabled) throw new TRPCError({ code: "FORBIDDEN", message: "Falta configurar la clave de cifrado en el servidor." });
}

async function requireClient(clientId: number) {
  const client = await care.getClientRow(clientId);
  if (!client) throw new TRPCError({ code: "NOT_FOUND", message: "Cliente no encontrado" });
  return client;
}

function decryptOrFail<T>(ciphertext: string, clientId: number, module: SensitiveModule): T {
  try {
    return decryptPayload<T>(ciphertext, clientId, module);
  } catch {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No se pudo descifrar el registro (clave o integridad)." });
  }
}

async function requireActiveConsent(clientId: number, module: SensitiveModule) {
  const consent = await care.activeConsent(clientId, module);
  if (!consent) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: `Falta el consentimiento explícito vigente del cliente para «${MODULE_LABEL[module]}».`,
    });
  }
  return consent;
}

async function toSessionWrite(clientId: number, input: SessionInput): Promise<care.SessionWrite> {
  if (input.serviceId && !(await care.serviceExists(input.serviceId))) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Servicio no válido" });
  }
  if (input.appointmentId && !(await care.appointmentBelongsToClient(input.appointmentId, clientId))) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "La cita no pertenece a este cliente" });
  }
  const t = (v?: string | null) => (v && v.trim() ? v.trim() : null);
  return {
    sessionDate: input.sessionDate,
    sessionTime: input.sessionTime ? input.sessionTime : null,
    serviceId: input.serviceId ?? null,
    durationMinutes: input.durationMinutes ?? null,
    summary: t(input.practicalNotes),
    clientPreferences: t(input.clientPreferences),
    nextSteps: t(input.pendingNext),
    appointmentId: input.appointmentId ?? null,
  };
}

// ─── Sensibles: genérico para leer / guardar ─────────────────────────────────
function sensitiveRouter(module: SensitiveModule, payload: typeof firstVisitPayload | typeof emotionalPayload) {
  const proc = sensitiveProcedure(module);
  return router({
    list: proc.input(clientIdInput).query(async ({ input, ctx }) => {
      await requireClient(input.clientId);
      const rows = await care.listSensitive(input.clientId, module);
      await care.insertAudit({ userId: ctx.user.id, action: "read", entityType: module, clientId: input.clientId });
      return rows.map((r) => ({
        id: r.id,
        recordDate: r.recordDate,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        data: decryptOrFail<Record<string, unknown>>(r.ciphertext, input.clientId, module),
      }));
    }),
    save: proc
      .input(clientIdInput.extend({ id: z.number().int().positive().optional(), recordDate: z.number().int().positive(), data: z.record(z.string(), z.unknown()) }))
      .mutation(async ({ input, ctx }) => {
        const parsed = payload.safeParse(input.data);
        // El mensaje de error no incluye el contenido recibido
        if (!parsed.success) throw new TRPCError({ code: "BAD_REQUEST", message: "Datos no válidos (revisa la longitud de los campos)." });
        await requireClient(input.clientId);
        await requireActiveConsent(input.clientId, module);
        const ciphertext = encryptPayload(parsed.data, input.clientId, module);
        let id = input.id;
        if (id) {
          await care.updateSensitive(id, input.clientId, module, ciphertext, keyVersion(), input.recordDate, ctx.user.id);
        } else {
          id = await care.insertSensitive(input.clientId, module, ciphertext, keyVersion(), input.recordDate, ctx.user.id);
        }
        // Nombres de los apartados con contenido; jamás el contenido
        const filled = Object.entries(parsed.data as Record<string, unknown>)
          .filter(([, v]) => (typeof v === "string" ? v.trim() : v && Object.values(v as object).some((x) => typeof x === "string" && x.trim())))
          .map(([k]) => k);
        await care.insertAudit({ userId: ctx.user.id, action: input.id ? "update" : "create", entityType: module, entityId: id, clientId: input.clientId, fields: filled });
        return { id };
      }),
  });
}

export const clientCareRouter = router({
  /** Estado de los módulos sensibles (sin valores de configuración). */
  modules: adminProcedure.query(() => allModulesReadiness().map(({ module, enabled, missing }) => ({ module, enabled, missing }))),

  summary: adminProcedure.input(clientIdInput).query(async ({ input }) => {
    const client = await requireClient(input.clientId);
    const [sessions, appts, services] = await Promise.all([care.listSessions(input.clientId), care.listClientAppointments(input.clientId), care.listServicesBasic()]);
    const latest = sessions[0];
    return {
      client: {
        id: client.id,
        firstName: client.firstName,
        lastName: client.lastName,
        phone: client.phone,
        email: client.email,
        status: client.status,
        occupation: client.occupation,
        customRate: client.customRate,
        customRateNote: client.customRateNote,
        rememberInfo: client.rememberInfo,
        legacyNotes: client.notes,
      },
      lastVisit: lastVisit(sessions),
      nextAppointment: nextAppointment(appts),
      servicesReceived: servicesReceived(sessions, services),
      latestSession: latest ? { id: latest.id, sessionDate: latest.sessionDate, sessionTime: latest.sessionTime, serviceName: latest.serviceName } : null,
      sessionsCount: sessions.length,
    };
  }),

  updateProfile: adminProcedure.input(clientIdInput.merge(profileInput)).mutation(async ({ input, ctx }) => {
    const client = await requireClient(input.clientId);
    const norm = (v?: string | null) => (v === undefined ? undefined : v && v.trim() ? v.trim() : null);
    const data = {
      occupation: norm(input.occupation),
      customRate: input.customRate === undefined ? undefined : input.customRate ? input.customRate.replace(",", ".") : null,
      customRateNote: norm(input.customRateNote),
      rememberInfo: norm(input.rememberInfo),
    };
    const before = { occupation: client.occupation, customRate: client.customRate === null ? null : Number(client.customRate).toFixed(2), customRateNote: client.customRateNote, rememberInfo: client.rememberInfo };
    const after = { ...data, customRate: data.customRate === undefined ? undefined : data.customRate === null ? null : Number(data.customRate).toFixed(2) };
    const fields = changedFields(before, after);
    if (fields.length === 0) return { changed: [] as string[] };
    await care.updateClientProfile(input.clientId, data);
    await care.insertAudit({ userId: ctx.user.id, action: "update", entityType: "client_profile", entityId: input.clientId, clientId: input.clientId, fields });
    return { changed: fields };
  }),

  sessions: router({
    list: adminProcedure.input(clientIdInput).query(async ({ input }) => {
      await requireClient(input.clientId);
      return care.listSessions(input.clientId);
    }),
    create: adminProcedure.input(clientIdInput.merge(sessionInput)).mutation(async ({ input, ctx }) => {
      await requireClient(input.clientId);
      const data = await toSessionWrite(input.clientId, input);
      const id = await care.insertSession(input.clientId, data, ctx.user.id);
      await care.insertAudit({ userId: ctx.user.id, action: "create", entityType: "session", entityId: id, clientId: input.clientId });
      return { id };
    }),
    update: adminProcedure
      .input(clientIdInput.merge(sessionInput).extend({ id: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        const current = await care.getSession(input.id, input.clientId);
        if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "Sesión no encontrada" });
        const data = await toSessionWrite(input.clientId, input);
        const fields = changedFields(
          { sessionDate: current.sessionDate, sessionTime: current.sessionTime, serviceId: current.serviceId, durationMinutes: current.durationMinutes, summary: current.summary, clientPreferences: current.clientPreferences, nextSteps: current.nextSteps, appointmentId: current.appointmentId },
          data as unknown as Record<string, unknown>,
        );
        if (fields.length === 0) return { changed: [] as string[] };
        await care.updateSession(input.id, input.clientId, data, ctx.user.id);
        await care.insertAudit({ userId: ctx.user.id, action: "update", entityType: "session", entityId: input.id, clientId: input.clientId, fields });
        return { changed: fields };
      }),
  }),

  audit: adminProcedure.input(clientIdInput).query(async ({ input }) => {
    await requireClient(input.clientId);
    return care.listAudit(input.clientId);
  }),

  firstVisit: sensitiveRouter("first_visit", firstVisitPayload),
  emotional: sensitiveRouter("emotional", emotionalPayload),

  consents: router({
    /** Historial de consentimientos del módulo (fechas, versión, forma): no contiene datos de salud. */
    list: adminProcedure.input(moduleInput).query(async ({ input }) => (await care.listConsents(input.clientId)).filter((c) => c.module === input.module)),
    /**
     * Registro del consentimiento explícito. Exige confirmar que el cliente ha recibido el texto vigente y lo
     * acepta expresamente (nunca se marca por defecto). Guarda fecha, versión del texto y forma de obtenerlo.
     */
    grant: adminProcedure
      .input(moduleInput.extend({ method: z.enum(CONSENT_METHODS), informed: z.literal(true) }))
      .mutation(async ({ input, ctx }) => {
        requireReady(input.module);
        await requireClient(input.clientId);
        if (await care.activeConsent(input.clientId, input.module)) throw new TRPCError({ code: "CONFLICT", message: "Ya hay un consentimiento vigente para este módulo." });
        const id = await care.insertConsent({ clientId: input.clientId, module: input.module, textVersion: CONSENT_TEXTS[input.module].version, method: input.method, grantedAt: Date.now(), recordedBy: ctx.user.id });
        await care.insertAudit({ userId: ctx.user.id, action: "consent_granted", entityType: input.module, entityId: id, clientId: input.clientId });
        return { id };
      }),
    /**
     * Retirada (siempre posible). Por defecto suprime en el acto los datos del módulo. Solo si hay una
     * obligación legal de conservarlos se mantienen, y quedan marcados para revisión.
     */
    withdraw: adminProcedure
      .input(moduleInput.extend({ consentId: z.number().int().positive(), keepForLegalObligation: z.boolean().default(false) }))
      .mutation(async ({ input, ctx }) => {
        await requireClient(input.clientId);
        const keep = input.keepForLegalObligation;
        if (!(await care.withdrawConsent(input.consentId, input.clientId, input.module, Date.now(), keep))) {
          throw new TRPCError({ code: "NOT_FOUND", message: "No hay un consentimiento vigente que retirar." });
        }
        await care.insertAudit({ userId: ctx.user.id, action: "consent_withdrawn", entityType: input.module, entityId: input.consentId, clientId: input.clientId });
        if (!keep) {
          await care.deleteSensitiveForClient(input.clientId, input.module);
          await care.insertAudit({ userId: ctx.user.id, action: "erase", entityType: input.module, clientId: input.clientId });
        }
        return { erased: !keep, reviewRequired: keep };
      }),
    /** Revisión periódica hecha: los datos siguen siendo necesarios para la finalidad. */
    markReviewed: adminProcedure.input(moduleInput).mutation(async ({ input, ctx }) => {
      const consent = await care.activeConsent(input.clientId, input.module);
      if (!consent) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Sin consentimiento vigente: los datos deben suprimirse, no revisarse." });
      await care.markConsentReviewed(consent.id, input.clientId, Date.now());
      await care.insertAudit({ userId: ctx.user.id, action: "retention_reviewed", entityType: input.module, entityId: consent.id, clientId: input.clientId });
      return { reviewed: true };
    }),
    /** Fichas cuyos datos de Primera visita o Acompañamiento toca revisar (sin contenido: nombre, módulo y motivo). */
    reviewsDue: adminProcedure.query(async () =>
      (await care.consentsWithData())
        .map((c) => ({ clientId: c.clientId, name: `${c.firstName} ${c.lastName}`.trim(), module: c.module, reason: retentionReview(c, true) }))
        .filter((c) => c.reason !== null),
    ),
  }),

  rights: router({
    /** Exportación de UN módulo (Primera visita o Acompañamiento) con su historial de consentimientos. */
    exportModule: adminProcedure.input(moduleInput).mutation(async ({ input, ctx }) => {
      requireReady(input.module);
      await requireClient(input.clientId);
      const [rows, consents] = await Promise.all([care.listSensitive(input.clientId, input.module), care.listConsents(input.clientId)]);
      await care.insertAudit({ userId: ctx.user.id, action: "export", entityType: input.module, clientId: input.clientId });
      return {
        exportedAt: new Date().toISOString(),
        clientId: input.clientId,
        module: input.module,
        consents: consents.filter((c) => c.module === input.module),
        records: rows.map((r) => ({ recordDate: r.recordDate, data: decryptOrFail(r.ciphertext, input.clientId, input.module) })),
      };
    }),
    /** Exportación estructurada de todo el cliente (art. 15/20). Sin clave de cifrado, los datos protegidos solo se cuentan. */
    export: adminProcedure.input(clientIdInput).mutation(async ({ input, ctx }) => {
      await requireClient(input.clientId);
      const admin = await care.exportAdministrative(input.clientId);
      const sensitive: Record<string, unknown> = {};
      const counts = await care.countSensitive(input.clientId);
      for (const module of ["first_visit", "emotional"] as const) {
        if (moduleReadiness(module).enabled) {
          const rows = await care.listSensitive(input.clientId, module);
          sensitive[module] = rows.map((r) => ({ recordDate: r.recordDate, data: decryptOrFail(r.ciphertext, input.clientId, module) }));
        } else {
          sensitive[module] = { blocked: true, records: counts[module] };
        }
      }
      await care.insertAudit({ userId: ctx.user.id, action: "export", entityType: "client", entityId: input.clientId, clientId: input.clientId });
      return { exportedAt: new Date().toISOString(), ...admin, sensitive };
    }),
    erasePreview: adminProcedure.input(clientIdInput).query(async ({ input }) => {
      await requireClient(input.clientId);
      return care.careCounts(input.clientId);
    }),
    /** Supresión de la ficha (sesiones, notas, datos sensibles, consentimientos). No toca citas ni facturas. */
    erase: adminProcedure.input(clientIdInput.extend({ confirmName: z.string() })).mutation(async ({ input, ctx }) => {
      const client = await requireClient(input.clientId);
      if (input.confirmName.trim().toLowerCase() !== `${client.firstName} ${client.lastName}`.trim().toLowerCase()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Escribe el nombre completo del cliente para confirmar." });
      }
      await care.eraseCareData(input.clientId);
      await care.insertAudit({ userId: ctx.user.id, action: "erase", entityType: "client_care", entityId: input.clientId, clientId: input.clientId });
      return { erased: true };
    }),
    /** Borra los datos de UN módulo (a petición, cuando dejan de ser necesarios o tras retirar el consentimiento). No necesita leerlos. */
    eraseModule: adminProcedure.input(moduleInput).mutation(async ({ input, ctx }) => {
      await requireClient(input.clientId);
      await care.deleteSensitiveForClient(input.clientId, input.module);
      await care.clearReviewRequired(input.clientId, input.module);
      await care.insertAudit({ userId: ctx.user.id, action: "erase", entityType: input.module, clientId: input.clientId });
      return { erased: true };
    }),
  }),
});
