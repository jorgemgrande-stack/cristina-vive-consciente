/**
 * clientCareDb.ts — acceso a datos de la ficha integral de clientes.
 * Todas las operaciones sobre registros hijos filtran también por clientId (no se puede tocar otra ficha
 * cambiando un id). Ninguna función registra en consola el contenido de notas ni de datos sensibles.
 */
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import {
  appointments,
  clientConsents,
  clientNotes,
  clients,
  clientSensitiveRecords,
  crmAuditLog,
  invoices,
  services,
  sessionHistory,
} from "../drizzle/schema";
import { getDb } from "./db";
import { sortSessions } from "../shared/clientCare";

async function db() {
  const d = await getDb();
  if (!d) throw new Error("Database not available");
  return d;
}

// ─── Cliente ─────────────────────────────────────────────────────────────────
export async function getClientRow(clientId: number) {
  const rows = await (await db()).select().from(clients).where(eq(clients.id, clientId)).limit(1);
  return rows[0];
}

export async function updateClientProfile(
  clientId: number,
  data: { occupation?: string | null; customRate?: string | null; customRateNote?: string | null; rememberInfo?: string | null },
) {
  await (await db()).update(clients).set(data).where(eq(clients.id, clientId));
}

// ─── Servicios, citas y sesiones ─────────────────────────────────────────────
export async function listServicesBasic() {
  return (await db())
    .select({ id: services.id, name: services.name, type: services.type, durationMinutes: services.durationMinutes, status: services.status })
    .from(services);
}

export async function serviceExists(serviceId: number) {
  const rows = await (await db()).select({ id: services.id }).from(services).where(eq(services.id, serviceId)).limit(1);
  return rows.length > 0;
}

export async function listClientAppointments(clientId: number) {
  return (await db())
    .select({ id: appointments.id, scheduledAt: appointments.scheduledAt, status: appointments.status, serviceLabel: appointments.serviceLabel })
    .from(appointments)
    .where(eq(appointments.clientId, clientId));
}

export async function appointmentBelongsToClient(appointmentId: number, clientId: number) {
  const rows = await (await db())
    .select({ id: appointments.id })
    .from(appointments)
    .where(and(eq(appointments.id, appointmentId), eq(appointments.clientId, clientId)))
    .limit(1);
  return rows.length > 0;
}

/** Historial de sesiones: más recientes primero por fecha y hora pactada (ver sortSessions). */
export async function listSessions(clientId: number) {
  const rows = await (await db())
    .select({
      id: sessionHistory.id,
      clientId: sessionHistory.clientId,
      appointmentId: sessionHistory.appointmentId,
      sessionDate: sessionHistory.sessionDate,
      sessionTime: sessionHistory.sessionTime,
      serviceId: sessionHistory.serviceId,
      serviceName: services.name,
      durationMinutes: sessionHistory.durationMinutes,
      practicalNotes: sessionHistory.summary,
      clientPreferences: sessionHistory.clientPreferences,
      pendingNext: sessionHistory.nextSteps,
      // campos antiguos (sesiones anteriores a 0024), solo lectura
      protocols: sessionHistory.protocols,
      recommendedProducts: sessionHistory.recommendedProducts,
      supplements: sessionHistory.supplements,
      createdAt: sessionHistory.createdAt,
      editedAt: sessionHistory.editedAt,
      editedBy: sessionHistory.editedBy,
    })
    .from(sessionHistory)
    .leftJoin(services, eq(services.id, sessionHistory.serviceId))
    .where(eq(sessionHistory.clientId, clientId));
  return sortSessions(rows);
}

export async function getSession(sessionId: number, clientId: number) {
  const rows = await (await db())
    .select()
    .from(sessionHistory)
    .where(and(eq(sessionHistory.id, sessionId), eq(sessionHistory.clientId, clientId)))
    .limit(1);
  return rows[0];
}

export type SessionWrite = {
  sessionDate: number;
  /** Hora pactada «HH:MM» o null */
  sessionTime: string | null;
  serviceId: number | null;
  durationMinutes: number | null;
  summary: string | null;
  clientPreferences: string | null;
  nextSteps: string | null;
  appointmentId: number | null;
};

/** Siempre INSERT: una sesión nueva nunca sobrescribe otra. */
export async function insertSession(clientId: number, data: SessionWrite, userId: number) {
  const [res] = await (await db()).insert(sessionHistory).values({ clientId, ...data, createdBy: userId });
  return (res as { insertId: number }).insertId;
}

/** Edición explícita de UNA sesión de este cliente, con quién y cuándo. */
export async function updateSession(sessionId: number, clientId: number, data: SessionWrite, userId: number) {
  await (await db())
    .update(sessionHistory)
    .set({ ...data, editedAt: new Date(), editedBy: userId })
    .where(and(eq(sessionHistory.id, sessionId), eq(sessionHistory.clientId, clientId)));
}

// ─── Auditoría (sin contenido) ───────────────────────────────────────────────
export async function insertAudit(entry: { userId: number | null; action: string; entityType: string; entityId?: number | null; clientId?: number | null; fields?: string[] }) {
  await (await db()).insert(crmAuditLog).values({
    userId: entry.userId,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId ?? null,
    clientId: entry.clientId ?? null,
    fields: entry.fields?.length ? entry.fields.join(",").slice(0, 500) : null,
  });
}

export async function listAudit(clientId: number, limit = 100) {
  return (await db()).select().from(crmAuditLog).where(eq(crmAuditLog.clientId, clientId)).orderBy(desc(crmAuditLog.createdAt), desc(crmAuditLog.id)).limit(limit);
}

// ─── Datos de categoría especial (solo texto cifrado) ────────────────────────
type Module = "first_visit" | "emotional";

export async function listSensitive(clientId: number, module: Module) {
  return (await db())
    .select()
    .from(clientSensitiveRecords)
    .where(and(eq(clientSensitiveRecords.clientId, clientId), eq(clientSensitiveRecords.module, module)))
    .orderBy(desc(clientSensitiveRecords.recordDate), desc(clientSensitiveRecords.id));
}

export async function insertSensitive(clientId: number, module: Module, ciphertext: string, keyVersion: string, recordDate: number, userId: number) {
  const [res] = await (await db()).insert(clientSensitiveRecords).values({ clientId, module, ciphertext, keyVersion, recordDate, createdBy: userId, updatedBy: userId });
  return (res as { insertId: number }).insertId;
}

export async function updateSensitive(id: number, clientId: number, module: Module, ciphertext: string, keyVersion: string, recordDate: number, userId: number) {
  await (await db())
    .update(clientSensitiveRecords)
    .set({ ciphertext, keyVersion, recordDate, updatedBy: userId })
    .where(and(eq(clientSensitiveRecords.id, id), eq(clientSensitiveRecords.clientId, clientId), eq(clientSensitiveRecords.module, module)));
}

/** Borrado de los datos sensibles de un cliente (no requiere leerlos ni que el módulo esté activo). */
export async function deleteSensitiveForClient(clientId: number, module?: Module) {
  const d = await db();
  const cond = module
    ? and(eq(clientSensitiveRecords.clientId, clientId), eq(clientSensitiveRecords.module, module))
    : eq(clientSensitiveRecords.clientId, clientId);
  await d.delete(clientSensitiveRecords).where(cond);
}

export async function countSensitive(clientId: number) {
  const rows = await (await db()).select({ id: clientSensitiveRecords.id, module: clientSensitiveRecords.module }).from(clientSensitiveRecords).where(eq(clientSensitiveRecords.clientId, clientId));
  return { first_visit: rows.filter((r) => r.module === "first_visit").length, emotional: rows.filter((r) => r.module === "emotional").length };
}

// ─── Consentimientos ─────────────────────────────────────────────────────────
export async function listConsents(clientId: number) {
  return (await db()).select().from(clientConsents).where(eq(clientConsents.clientId, clientId)).orderBy(desc(clientConsents.grantedAt), desc(clientConsents.id));
}

export async function activeConsent(clientId: number, module: Module) {
  const rows = await (await db())
    .select()
    .from(clientConsents)
    .where(and(eq(clientConsents.clientId, clientId), eq(clientConsents.module, module), isNull(clientConsents.withdrawnAt)))
    .orderBy(desc(clientConsents.grantedAt))
    .limit(1);
  return rows[0];
}

export async function insertConsent(data: { clientId: number; module: Module; textVersion: string; method: string; grantedAt: number; recordedBy: number }) {
  const [res] = await (await db()).insert(clientConsents).values(data);
  return (res as { insertId: number }).insertId;
}

/**
 * Retirada: queda registrada (el consentimiento no se borra, sirve de prueba). Si los datos se conservan
 * por una obligación legal, queda marcada para revisión (reviewRequired).
 */
export async function withdrawConsent(consentId: number, clientId: number, module: Module, at: number, reviewRequired: boolean) {
  const [res] = await (await db())
    .update(clientConsents)
    .set({ withdrawnAt: at, reviewRequired })
    .where(and(eq(clientConsents.id, consentId), eq(clientConsents.clientId, clientId), eq(clientConsents.module, module), isNull(clientConsents.withdrawnAt)));
  return (res as { affectedRows: number }).affectedRows > 0;
}

/** Revisión periódica hecha: los datos del módulo siguen siendo necesarios. */
export async function markConsentReviewed(consentId: number, clientId: number, at: number) {
  await (await db())
    .update(clientConsents)
    .set({ reviewedAt: at })
    .where(and(eq(clientConsents.id, consentId), eq(clientConsents.clientId, clientId)));
}

/** Tras suprimir los datos de un módulo ya no queda nada que revisar. */
export async function clearReviewRequired(clientId: number, module: Module) {
  await (await db())
    .update(clientConsents)
    .set({ reviewRequired: false })
    .where(and(eq(clientConsents.clientId, clientId), eq(clientConsents.module, module)));
}

/** Consentimientos de todos los clientes con datos sensibles guardados (para la revisión periódica). */
export async function consentsWithData() {
  const d = await db();
  const withData = await d
    .selectDistinct({ clientId: clientSensitiveRecords.clientId, module: clientSensitiveRecords.module })
    .from(clientSensitiveRecords);
  if (withData.length === 0) return [];
  const has = new Set(withData.map((r) => `${r.clientId}:${r.module}`));
  const rows = await d
    .select({
      clientId: clientConsents.clientId,
      module: clientConsents.module,
      id: clientConsents.id,
      grantedAt: clientConsents.grantedAt,
      withdrawnAt: clientConsents.withdrawnAt,
      reviewedAt: clientConsents.reviewedAt,
      firstName: clients.firstName,
      lastName: clients.lastName,
    })
    .from(clientConsents)
    .innerJoin(clients, eq(clients.id, clientConsents.clientId))
    .orderBy(desc(clientConsents.grantedAt), desc(clientConsents.id));
  // El consentimiento más reciente de cada cliente y módulo, solo donde quedan datos
  const latest = new Map<string, (typeof rows)[number]>();
  for (const r of rows) {
    const k = `${r.clientId}:${r.module}`;
    if (has.has(k) && !latest.has(k)) latest.set(k, r);
  }
  return Array.from(latest.values());
}

export async function deleteConsentsForClient(clientId: number) {
  await (await db()).delete(clientConsents).where(eq(clientConsents.clientId, clientId));
}

// ─── Derechos: exportación y supresión de la ficha ───────────────────────────
export async function exportAdministrative(clientId: number) {
  const d = await db();
  const [client] = await d.select().from(clients).where(eq(clients.id, clientId)).limit(1);
  const [sessions, notes, appts, invs, consents] = await Promise.all([
    listSessions(clientId),
    d.select().from(clientNotes).where(eq(clientNotes.clientId, clientId)),
    d.select().from(appointments).where(eq(appointments.clientId, clientId)),
    d.select({ id: invoices.id, invoiceNumber: invoices.invoiceNumber, issuedAt: invoices.issuedAt, total: invoices.total, status: invoices.status }).from(invoices).where(eq(invoices.clientId, clientId)),
    listConsents(clientId),
  ]);
  return { client, sessions, notes, appointments: appts, invoices: invs, consents };
}

export async function countInvoices(clientId: number) {
  const rows = await (await db()).select({ id: invoices.id }).from(invoices).where(eq(invoices.clientId, clientId));
  return rows.length;
}

/** Borra sesiones, notas, datos sensibles y consentimientos, y vacía los campos de ficha. No toca citas ni facturas. */
export async function eraseCareData(clientId: number) {
  const d = await db();
  await d.delete(sessionHistory).where(eq(sessionHistory.clientId, clientId));
  await d.delete(clientNotes).where(eq(clientNotes.clientId, clientId));
  await deleteSensitiveForClient(clientId);
  await deleteConsentsForClient(clientId);
  await d.update(clients).set({ occupation: null, customRate: null, customRateNote: null, rememberInfo: null }).where(eq(clients.id, clientId));
}

export async function careCounts(clientId: number) {
  const d = await db();
  const [s, n, a] = await Promise.all([
    d.select({ id: sessionHistory.id }).from(sessionHistory).where(eq(sessionHistory.clientId, clientId)),
    d.select({ id: clientNotes.id }).from(clientNotes).where(eq(clientNotes.clientId, clientId)),
    d.select({ id: appointments.id }).from(appointments).where(and(eq(appointments.clientId, clientId), gt(appointments.scheduledAt, 0))),
  ]);
  return { sessions: s.length, notes: n.length, appointments: a.length, invoices: await countInvoices(clientId), sensitive: await countSensitive(clientId) };
}

