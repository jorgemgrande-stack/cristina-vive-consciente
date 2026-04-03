import { eq, desc, and, gte, lte, like, or, sql } from "drizzle-orm";
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

export async function createClient(data: InsertClient) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(clients).values(data);
  return result[0];
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
  let query = db.select({ invoice: invoices, client: { id: clients.id, firstName: clients.firstName, lastName: clients.lastName } }).from(invoices).leftJoin(clients, eq(invoices.clientId, clients.id)).$dynamic();
  if (conditions.length > 0) query = query.where(and(...conditions));
  return query.orderBy(desc(invoices.issuedAt));
}

export async function getInvoiceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select({ invoice: invoices, client: { id: clients.id, firstName: clients.firstName, lastName: clients.lastName, email: clients.email, address: clients.address, city: clients.city } }).from(invoices).leftJoin(clients, eq(invoices.clientId, clients.id)).where(eq(invoices.id, id)).limit(1);
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
