import { eq, desc, and, gte, lte, like, or, sql, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  clients,
  InsertClient,
  appointments,
  InsertAppointment,
  clientNotes,
  InsertClientNote,
  sessionHistory,
  InsertSessionHistory,
  invoices,
  InsertInvoice,
  affiliateProducts,
  InsertAffiliateProduct,
  affiliateCategories,
  InsertAffiliateCategory,
  automationLogs,
  InsertAutomationLog,
  leadSequences,
  InsertLeadSequence,
  services,
  InsertService,
  ebooks,
  type Ebook,
  type InsertEbook,
  calendarEvents,
  type InsertCalendarEvent,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ─── CLIENTS ────────────────────────────────────────────────────────────────────────────────
export async function getClients(search?: string, status?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [];
  if (status && status !== "all") conditions.push(eq(clients.status, status as any));
  if (search) {
    conditions.push(or(
      like(clients.firstName, `%${search}%`),
      like(clients.lastName, `%${search}%`),
      like(clients.email, `%${search}%`),
      like(clients.phone, `%${search}%`)
    ));
  }
  let query = db.select().from(clients).$dynamic();
  if (conditions.length > 0) query = query.where(and(...conditions));
  return query.orderBy(desc(clients.createdAt));
}

export async function getClientById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createClient(data: InsertClient): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(clients).values(data);
  const insertId = (result as any).insertId as number;
  if (!insertId) throw new Error("Failed to get insertId after creating client");
  return insertId;
}

export async function updateClient(id: number, data: Partial<InsertClient>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(clients).set(data).where(eq(clients.id, id));
}

export async function deleteClient(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(clients).where(eq(clients.id, id));
}

export async function findClientByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clients).where(eq(clients.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getClientsCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(clients);
  return result[0]?.count ?? 0;
}

// ─── APPOINTMENTS ──────────────────────────────────────────────────────────────────────
export async function getAppointments(filters?: { clientId?: number; status?: string; from?: number; to?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [];
  if (filters?.clientId) conditions.push(eq(appointments.clientId, filters.clientId));
  if (filters?.status && filters.status !== "all") conditions.push(eq(appointments.status, filters.status as any));
  if (filters?.from) conditions.push(gte(appointments.scheduledAt, filters.from));
  if (filters?.to) conditions.push(lte(appointments.scheduledAt, filters.to));
  let query = db.select({ appointment: appointments, client: { id: clients.id, firstName: clients.firstName, lastName: clients.lastName, email: clients.email, phone: clients.phone } }).from(appointments).leftJoin(clients, eq(appointments.clientId, clients.id)).$dynamic();
  if (conditions.length > 0) query = query.where(and(...conditions));
  return query.orderBy(desc(appointments.scheduledAt));
}

export async function getAppointmentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select({ appointment: appointments, client: { id: clients.id, firstName: clients.firstName, lastName: clients.lastName, email: clients.email, phone: clients.phone } }).from(appointments).leftJoin(clients, eq(appointments.clientId, clients.id)).where(eq(appointments.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createAppointment(data: InsertAppointment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(appointments).values(data);
  return result[0];
}

export async function updateAppointment(id: number, data: Partial<InsertAppointment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(appointments).set(data).where(eq(appointments.id, id));
}

export async function getTodayAppointments() {
  const db = await getDb();
  if (!db) return [];
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);
  return db.select({ appointment: appointments, client: { id: clients.id, firstName: clients.firstName, lastName: clients.lastName, phone: clients.phone } }).from(appointments).leftJoin(clients, eq(appointments.clientId, clients.id)).where(and(gte(appointments.scheduledAt, startOfDay.getTime()), lte(appointments.scheduledAt, endOfDay.getTime()))).orderBy(appointments.scheduledAt);
}

export async function getUpcomingAppointments(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  const now = Date.now();
  return db.select({ appointment: appointments, client: { id: clients.id, firstName: clients.firstName, lastName: clients.lastName, phone: clients.phone } }).from(appointments).leftJoin(clients, eq(appointments.clientId, clients.id)).where(and(gte(appointments.scheduledAt, now), or(eq(appointments.status, "pending"), eq(appointments.status, "confirmed")))).orderBy(appointments.scheduledAt).limit(limit);
}

// ─── CLIENT NOTES ────────────────────────────────────────────────────────────────────
export async function getClientNotes(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clientNotes).where(eq(clientNotes.clientId, clientId)).orderBy(desc(clientNotes.createdAt));
}

export async function createClientNote(data: InsertClientNote) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(clientNotes).values(data);
  return result[0];
}

export async function updateClientNote(id: number, data: Partial<InsertClientNote>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(clientNotes).set(data).where(eq(clientNotes.id, id));
}

export async function deleteClientNote(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(clientNotes).where(eq(clientNotes.id, id));
}

// ─── SESSION HISTORY ───────────────────────────────────────────────────────────────────
export async function getSessionHistory(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sessionHistory).where(eq(sessionHistory.clientId, clientId)).orderBy(desc(sessionHistory.sessionDate));
}

export async function createSessionHistory(data: InsertSessionHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(sessionHistory).values(data);
  return result[0];
}

export async function updateSessionHistory(id: number, data: Partial<InsertSessionHistory>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(sessionHistory).set(data).where(eq(sessionHistory.id, id));
}

// ─── INVOICES ─────────────────────────────────────────────────────────────────────────────
export async function getInvoices(clientId?: number, status?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [];
  if (clientId) conditions.push(eq(invoices.clientId, clientId));
  if (status && status !== "all") conditions.push(eq(invoices.status, status as any));
  let query = db.select({ invoice: invoices, client: { id: clients.id, firstName: clients.firstName, lastName: clients.lastName, email: clients.email } }).from(invoices).leftJoin(clients, eq(invoices.clientId, clients.id)).$dynamic();
  if (conditions.length > 0) query = query.where(and(...conditions));
  return query.orderBy(desc(invoices.issuedAt));
}

export async function getInvoiceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select({ invoice: invoices, client: { id: clients.id, firstName: clients.firstName, lastName: clients.lastName, email: clients.email, address: clients.address, postalCode: clients.postalCode, city: clients.city, province: clients.province, country: clients.country, nif: clients.nif, razonSocial: clients.razonSocial } }).from(invoices).leftJoin(clients, eq(invoices.clientId, clients.id)).where(eq(invoices.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createInvoice(data: InsertInvoice) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(invoices).values(data);
  return result[0];
}

export async function updateInvoice(id: number, data: Partial<InsertInvoice>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(invoices).set(data).where(eq(invoices.id, id));
}

export async function getNextInvoiceNumber(): Promise<string> {
  const db = await getDb();
  if (!db) return `BION-${new Date().getFullYear()}-001`;
  const result = await db.select({ invoiceNumber: invoices.invoiceNumber }).from(invoices).orderBy(desc(invoices.createdAt)).limit(1);
  const year = new Date().getFullYear();
  if (result.length === 0) return `BION-${year}-001`;
  const last = result[0].invoiceNumber;
  const match = last.match(/(\d+)$/);
  const next = match ? parseInt(match[1]) + 1 : 1;
  return `BION-${year}-${String(next).padStart(3, "0")}`;
}

// ─── DASHBOARD STATS ───────────────────────────────────────────────────────────────────
export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return { totalClients: 0, totalAppointments: 0, pendingAppointments: 0, completedThisMonth: 0 };
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
  const [totalClientsRes, totalAppRes, pendingRes, completedMonthRes] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(clients),
    db.select({ count: sql<number>`count(*)` }).from(appointments),
    db.select({ count: sql<number>`count(*)` }).from(appointments).where(or(eq(appointments.status, "pending"), eq(appointments.status, "confirmed"))),
    db.select({ count: sql<number>`count(*)` }).from(appointments).where(and(eq(appointments.status, "completed"), gte(appointments.scheduledAt, startOfMonth), lte(appointments.scheduledAt, endOfMonth))),
  ]);
  return {
    totalClients: totalClientsRes[0]?.count ?? 0,
    totalAppointments: totalAppRes[0]?.count ?? 0,
    pendingAppointments: pendingRes[0]?.count ?? 0,
    completedThisMonth: completedMonthRes[0]?.count ?? 0,
  };
}

// ─── ETIQUETADO DE CLIENTES (EBOOKS) ──────────────────────────────────────────
/**
 * Añade un tag/etiqueta al campo notes del cliente en el CRM.
 * Usado para marcar compradores de ebooks.
 */
export async function updateClientTag(clientId: number, tag: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  // Leer notes actuales y añadir el tag si no existe ya
  const rows = await db.select({ notes: clients.notes }).from(clients).where(eq(clients.id, clientId)).limit(1);
  const currentNotes = rows[0]?.notes ?? "";
  if (currentNotes.includes(tag)) return; // ya etiquetado
  const newNotes = currentNotes ? `${currentNotes}\n[TAG] ${tag}` : `[TAG] ${tag}`;
  await db.update(clients).set({ notes: newNotes }).where(eq(clients.id, clientId));
}

// ─── PRODUCTOS AFILIADOS ──────────────────────────────────────────────────────────────────────────────
export async function listAffiliateProducts(onlyActive = false) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(affiliateProducts)
    .orderBy(affiliateProducts.sortOrder, affiliateProducts.createdAt);
  return onlyActive ? rows.filter((r) => r.status === "active") : rows;
}

export async function getAffiliateProduct(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(affiliateProducts).where(eq(affiliateProducts.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createAffiliateProduct(data: InsertAffiliateProduct) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(affiliateProducts).values(data);
  const insertId = (result as unknown as [{ insertId: number }])[0]?.insertId ?? 0;
  return insertId;
}

export async function updateAffiliateProduct(id: number, data: Partial<InsertAffiliateProduct>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(affiliateProducts).set(data).where(eq(affiliateProducts.id, id));
}

export async function deleteAffiliateProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(affiliateProducts).where(eq(affiliateProducts.id, id));
}

export async function toggleAffiliateProductStatus(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const rows = await db.select({ status: affiliateProducts.status }).from(affiliateProducts).where(eq(affiliateProducts.id, id)).limit(1);
  const current = rows[0]?.status;
  if (!current) throw new Error("Product not found");
  const next = current === "active" ? "inactive" : "active";
  await db.update(affiliateProducts).set({ status: next }).where(eq(affiliateProducts.id, id));
  return next;
}

// ─── CATEGORÍAS DE AFILIADOS ──────────────────────────────────────────────────────
export async function listAffiliateCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(affiliateCategories).orderBy(affiliateCategories.sortOrder);
}

export async function getAffiliateCategoryById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(affiliateCategories).where(eq(affiliateCategories.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createAffiliateCategory(data: InsertAffiliateCategory) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(affiliateCategories).values(data);
  const insertId = (result as unknown as [{ insertId: number }])[0]?.insertId ?? 0;
  return insertId;
}

export async function updateAffiliateCategory(id: number, data: Partial<InsertAffiliateCategory>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(affiliateCategories).set(data).where(eq(affiliateCategories.id, id));
}

export async function deleteAffiliateCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(affiliateCategories).where(eq(affiliateCategories.id, id));
}

export async function toggleAffiliateCategoryStatus(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const rows = await db.select({ status: affiliateCategories.status }).from(affiliateCategories).where(eq(affiliateCategories.id, id)).limit(1);
  const current = rows[0]?.status;
  if (!current) throw new Error("Category not found");
  const next = current === "active" ? "inactive" : "active";
  await db.update(affiliateCategories).set({ status: next }).where(eq(affiliateCategories.id, id));
  return next;
}

// ─── AUTOMATIZACIONES — LOGS ──────────────────────────────────────────────────

export async function createAutomationLog(data: InsertAutomationLog): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.insert(automationLogs).values(data);
  return (result as unknown as [{ insertId: number }])[0]?.insertId ?? 0;
}

export async function updateAutomationLog(id: number, data: Partial<InsertAutomationLog>) {
  const db = await getDb();
  if (!db) return;
  await db.update(automationLogs).set(data).where(eq(automationLogs.id, id));
}

export async function listAutomationLogs(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(automationLogs)
    .orderBy(desc(automationLogs.createdAt))
    .limit(limit);
}

export async function getAutomationStats() {
  const db = await getDb();
  if (!db) return { total: 0, sent: 0, failed: 0, pending: 0 };
  const rows = await db.select().from(automationLogs);
  return {
    total: rows.length,
    sent: rows.filter((r) => r.status === "sent").length,
    failed: rows.filter((r) => r.status === "failed").length,
    pending: rows.filter((r) => r.status === "pending").length,
  };
}

// ─── AUTOMATIZACIONES — SECUENCIAS DE LEADS ──────────────────────────────────

export async function createLeadSequence(data: InsertLeadSequence): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.insert(leadSequences).values(data);
  return (result as unknown as [{ insertId: number }])[0]?.insertId ?? 0;
}

export async function getPendingLeadSequences() {
  const db = await getDb();
  if (!db) return [];
  const now = Date.now();
  return db
    .select()
    .from(leadSequences)
    .where(
      and(
        eq(leadSequences.status, "pending"),
        lte(leadSequences.scheduledAt, now)
      )
    )
    .orderBy(leadSequences.scheduledAt)
    .limit(50);
}

export async function updateLeadSequence(id: number, data: Partial<InsertLeadSequence>) {
  const db = await getDb();
  if (!db) return;
  await db.update(leadSequences).set(data).where(eq(leadSequences.id, id));
}

export async function listLeadSequences(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(leadSequences)
    .orderBy(desc(leadSequences.createdAt))
    .limit(limit);
}

export async function cancelLeadSequences(clientId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(leadSequences)
    .set({ status: "cancelled" })
    .where(and(eq(leadSequences.clientId, clientId), eq(leadSequences.status, "pending")));
}

// ─── SERVICIOS ────────────────────────────────────────────────────────────────

export async function listServices(onlyActive = false) {
  const db = await getDb();
  if (!db) return [];
  const query = db.select().from(services);
  if (onlyActive) {
    return query
      .where(eq(services.status, "active"))
      .orderBy(services.type, services.sortOrder);
  }
  return query.orderBy(services.type, services.sortOrder);
}

export async function getServiceById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(services).where(eq(services.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getServiceBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(services).where(eq(services.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export async function createService(data: InsertService): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(services).values(data);
  return (result as any).insertId as number;
}

export async function updateService(id: number, data: Partial<InsertService>) {
  const db = await getDb();
  if (!db) return;
  await db.update(services).set(data).where(eq(services.id, id));
}

export async function deleteService(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(services).where(eq(services.id, id));
}

export async function toggleServiceStatus(id: number): Promise<"active" | "inactive"> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const current = await getServiceById(id);
  if (!current) throw new Error("Service not found");
  const newStatus = current.status === "active" ? "inactive" : "active";
  await db.update(services).set({ status: newStatus }).where(eq(services.id, id));
  return newStatus;
}

// ─── EBOOKS ───────────────────────────────────────────────────────────────────
export async function listEbooks(onlyActive = false): Promise<Ebook[]> {
  const db = await getDb();
  if (!db) return [];
  if (onlyActive) {
    return db.select().from(ebooks).where(eq(ebooks.status, "active")).orderBy(asc(ebooks.sortOrder));
  }
  return db.select().from(ebooks).orderBy(asc(ebooks.sortOrder));
}

export async function getEbookById(id: number): Promise<Ebook | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(ebooks).where(eq(ebooks.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getEbookBySlug(slug: string): Promise<Ebook | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(ebooks).where(eq(ebooks.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export async function createEbook(data: Omit<InsertEbook, "id" | "createdAt" | "updatedAt">): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(ebooks).values(data as InsertEbook);
  return (result as any).insertId as number;
}

export async function updateEbook(id: number, data: Partial<InsertEbook>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(ebooks).set(data).where(eq(ebooks.id, id));
}

export async function deleteEbook(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(ebooks).where(eq(ebooks.id, id));
}

export async function toggleEbookStatus(id: number): Promise<"active" | "inactive"> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const current = await getEbookById(id);
  if (!current) throw new Error("Ebook not found");
  const newStatus = current.status === "active" ? "inactive" : "active";
  await db.update(ebooks).set({ status: newStatus }).where(eq(ebooks.id, id));
  return newStatus;
}

// ─── APPOINTMENTS — por token de reprogramación ───────────────────────────────

export async function getAppointmentByRescheduleToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select({ appointment: appointments, client: { id: clients.id, firstName: clients.firstName, lastName: clients.lastName, email: clients.email, phone: clients.phone } })
    .from(appointments)
    .leftJoin(clients, eq(appointments.clientId, clients.id))
    .where(eq(appointments.rescheduleToken, token))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── CALENDAR EVENTS ──────────────────────────────────────────────────────────

export async function getCalendarEvents(from: number, to: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(calendarEvents)
    .where(and(gte(calendarEvents.eventAt, from), lte(calendarEvents.eventAt, to)))
    .orderBy(asc(calendarEvents.eventAt));
}

export async function createCalendarEvent(data: InsertCalendarEvent): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(calendarEvents).values(data);
  return (result as any).insertId as number;
}

export async function updateCalendarEvent(id: number, data: Partial<InsertCalendarEvent>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(calendarEvents).set(data).where(eq(calendarEvents.id, id));
}

export async function deleteCalendarEvent(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
}
