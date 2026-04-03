import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  bigint,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── CLIENTES (CRM) ───────────────────────────────────────────────────────────
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 30 }),
  status: mysqlEnum("status", ["active", "inactive", "lead"]).default("active").notNull(),
  birthDate: varchar("birthDate", { length: 20 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  notes: text("notes"),
  referredBy: varchar("referredBy", { length: 200 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy"),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

// ─── CITAS ────────────────────────────────────────────────────────────────────
export const appointments = mysqlTable("appointments", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  serviceType: mysqlEnum("serviceType", [
    "consulta_acompanamiento",
    "consulta_naturopata",
    "consulta_breve",
    "consulta_express",
    "biohabitabilidad",
    "kinesiologia",
    "masaje",
    "otro",
  ]).notNull(),
  serviceLabel: varchar("serviceLabel", { length: 200 }),
  scheduledAt: bigint("scheduledAt", { mode: "number" }).notNull(),
  durationMinutes: int("durationMinutes").default(60),
  modality: mysqlEnum("modality", ["presencial", "telefono", "zoom", "whatsapp"]).default("zoom"),
  status: mysqlEnum("status", ["pending", "confirmed", "completed", "cancelled", "rescheduled"]).default("pending").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("EUR"),
  internalNotes: text("internalNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy"),
});

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;

// ─── NOTAS DE CLIENTE ─────────────────────────────────────────────────────────
export const clientNotes = mysqlTable("client_notes", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  appointmentId: int("appointmentId"),
  type: mysqlEnum("type", ["general", "sesion", "seguimiento", "observacion", "alerta"]).default("general").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy"),
});

export type ClientNote = typeof clientNotes.$inferSelect;
export type InsertClientNote = typeof clientNotes.$inferInsert;

// ─── HISTORIAL DE SESIONES ────────────────────────────────────────────────────
export const sessionHistory = mysqlTable("session_history", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  appointmentId: int("appointmentId"),
  summary: text("summary"),
  protocols: text("protocols"),
  nextSteps: text("nextSteps"),
  recommendedProducts: text("recommendedProducts"),
  supplements: text("supplements"),
  sessionDate: bigint("sessionDate", { mode: "number" }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy"),
});

export type SessionHistory = typeof sessionHistory.$inferSelect;
export type InsertSessionHistory = typeof sessionHistory.$inferInsert;

// ─── FACTURAS ─────────────────────────────────────────────────────────────────
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  appointmentId: int("appointmentId"),
  invoiceNumber: varchar("invoiceNumber", { length: 50 }).notNull().unique(),
  status: mysqlEnum("status", ["draft", "sent", "paid", "cancelled"]).default("draft").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("EUR"),
  concept: text("concept").notNull(),
  notes: text("notes"),
  issuedAt: bigint("issuedAt", { mode: "number" }).notNull(),
  dueAt: bigint("dueAt", { mode: "number" }),
  paidAt: bigint("paidAt", { mode: "number" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy"),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

// ─── COMPRAS DE EBOOKS ────────────────────────────────────────────────────────
export const ebookPurchases = mysqlTable("ebook_purchases", {
  id: int("id").autoincrement().primaryKey(),
  // Identificadores Stripe (fuente de verdad)
  stripeSessionId: varchar("stripeSessionId", { length: 200 }).notNull().unique(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 200 }),
  // Datos del comprador
  customerEmail: varchar("customerEmail", { length: 320 }).notNull(),
  customerName: varchar("customerName", { length: 200 }),
  // Producto comprado
  ebookId: varchar("ebookId", { length: 50 }).notNull(), // 'agua' | 'aceites'
  ebookTitle: varchar("ebookTitle", { length: 200 }).notNull(),
  amountCents: int("amountCents").notNull(), // en céntimos (ej: 1200 = 12€)
  currency: varchar("currency", { length: 3 }).default("EUR"),
  // Enlace de descarga
  downloadToken: varchar("downloadToken", { length: 100 }).notNull().unique(), // token seguro
  downloadExpiresAt: bigint("downloadExpiresAt", { mode: "number" }).notNull(), // timestamp ms
  downloadCount: int("downloadCount").default(0),
  // Estado
  status: mysqlEnum("status", ["pending", "completed", "refunded"]).default("pending").notNull(),
  emailSentAt: bigint("emailSentAt", { mode: "number" }), // timestamp ms
  // Referencia al cliente CRM (si existe)
  clientId: int("clientId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EbookPurchase = typeof ebookPurchases.$inferSelect;
export type InsertEbookPurchase = typeof ebookPurchases.$inferInsert;
// ─── CATEGORÍAS DE AFILIADOS ────────────────────────────────────────────────
export const affiliateCategories = mysqlTable("affiliate_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  description: text("description"),
  sortOrder: int("sortOrder").default(0).notNull(),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AffiliateCategory = typeof affiliateCategories.$inferSelect;
export type InsertAffiliateCategory = typeof affiliateCategories.$inferInsert;

// ─── PRODUCTOS AFILIADOS ──────────────────────────────────────────────────────
export const affiliateProducts = mysqlTable("affiliate_products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  imageUrl: text("imageUrl"),
  category: varchar("category", { length: 100 }).notNull(),
  affiliateUrl: text("affiliateUrl").notNull(),
  provider: varchar("provider", { length: 100 }),
  /** true si el enlace apunta a un proveedor externo (afiliado), false si es producto propio */
  isAffiliate: int("isAffiliate").default(0).notNull(),
  /** URL original de la ficha en Shopify (para referencia) */
  sourceUrl: text("sourceUrl"),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy"),
});

export type AffiliateProduct = typeof affiliateProducts.$inferSelect;
export type InsertAffiliateProduct = typeof affiliateProducts.$inferInsert;

// ─── LOGS DE AUTOMATIZACIONES ─────────────────────────────────────────────────
export const automationLogs = mysqlTable("automation_logs", {
  id: int("id").autoincrement().primaryKey(),
  // Tipo de evento que disparó la automatización
  event: mysqlEnum("event", [
    "booking_confirmation",   // Confirmación de reserva al cliente
    "booking_admin",          // Notificación de reserva al admin
    "ebook_delivery",         // Entrega de ebook
    "lead_welcome",           // Bienvenida a nuevo lead
    "lead_sequence_1",        // Secuencia lead: email 1 (inmediato)
    "lead_sequence_2",        // Secuencia lead: email 2 (día 3)
    "lead_sequence_3",        // Secuencia lead: email 3 (día 7)
    "whatsapp_booking",       // WhatsApp de reserva (futuro)
  ]).notNull(),
  // Canal de comunicación
  channel: mysqlEnum("channel", ["email", "whatsapp", "sms"]).default("email").notNull(),
  // Destinatario
  recipientEmail: varchar("recipientEmail", { length: 320 }),
  recipientPhone: varchar("recipientPhone", { length: 30 }),
  // Referencia al cliente CRM
  clientId: int("clientId"),
  // Estado del envío
  status: mysqlEnum("status", ["sent", "failed", "pending", "skipped"]).default("pending").notNull(),
  // Metadatos del envío
  subject: varchar("subject", { length: 300 }),
  errorMessage: text("errorMessage"),
  sentAt: bigint("sentAt", { mode: "number" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AutomationLog = typeof automationLogs.$inferSelect;
export type InsertAutomationLog = typeof automationLogs.$inferInsert;

// ─── SECUENCIAS DE EMAILS PARA LEADS ─────────────────────────────────────────
export const leadSequences = mysqlTable("lead_sequences", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  clientEmail: varchar("clientEmail", { length: 320 }).notNull(),
  clientName: varchar("clientName", { length: 200 }).notNull(),
  // Qué email de la secuencia es este
  sequenceStep: int("sequenceStep").notNull(), // 1, 2, 3
  // Cuándo debe enviarse (timestamp ms)
  scheduledAt: bigint("scheduledAt", { mode: "number" }).notNull(),
  // Estado
  status: mysqlEnum("status", ["pending", "sent", "failed", "cancelled"]).default("pending").notNull(),
  sentAt: bigint("sentAt", { mode: "number" }),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LeadSequence = typeof leadSequences.$inferSelect;
export type InsertLeadSequence = typeof leadSequences.$inferInsert;

// ─── SERVICIOS (CONSULTAS Y MASAJES) ───────────────────────────────────────────────
export const services = mysqlTable("services", {
  id: int("id").autoincrement().primaryKey(),
  /** Identificador único interno para conectar con el sistema de reservas (e.g. 'consulta_naturopata') */
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  shortDescription: varchar("shortDescription", { length: 500 }),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }),
  /** Duración en minutos */
  durationMinutes: int("durationMinutes").default(60),
  /** Texto de duración legible (e.g. '60 min', 'Mínimo 60 min', 'Consulta inicial + 21 días') */
  durationLabel: varchar("durationLabel", { length: 100 }),
  /** Tipo de servicio para agrupar en el frontend */
  type: mysqlEnum("type", ["consulta", "masaje", "otro"]).default("consulta").notNull(),
  /** Modalidad disponible */
  modality: mysqlEnum("modality", ["online", "presencial", "ambos"]).default("ambos").notNull(),
  imageUrl: text("imageUrl"),
  /** Mostrar como destacado / más popular */
  featured: int("featured").default(0).notNull(),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy"),
});

export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;

// ─── EBOOKS (GUÍAS DIGITALES) ─────────────────────────────────────────────────
export const ebooks = mysqlTable("ebooks", {
  id: int("id").autoincrement().primaryKey(),
  /** Identificador único para conectar con Stripe y el sistema de compras (e.g. 'agua', 'aceites') */
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 200 }).notNull(),
  subtitle: varchar("subtitle", { length: 300 }),
  description: text("description"),
  /** Precio en euros (e.g. '12.00') */
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  /** Precio en céntimos para Stripe */
  priceCents: int("priceCents").notNull(),
  currency: varchar("currency", { length: 3 }).default("EUR").notNull(),
  /** ID del Price en Stripe */
  stripePriceId: varchar("stripePriceId", { length: 100 }),
  /** URL del PDF en S3/CDN */
  pdfUrl: text("pdfUrl"),
  /** Imagen de portada principal */
  coverImage: text("coverImage"),
  /** Imágenes adicionales del carrusel (JSON array de URLs, máximo 3) */
  galleryImages: text("galleryImages"),
  /** Horas de validez del enlace de descarga */
  downloadExpiryHours: int("downloadExpiryHours").default(72).notNull(),
  /** Tag para etiquetar al cliente en el CRM tras la compra */
  crmTag: varchar("crmTag", { length: 100 }),
  /** Si incluye sesión de 30 min con Cristina (0=no, 1=sí) */
  includesSession: int("includesSession").default(0).notNull(),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Ebook = typeof ebooks.$inferSelect;
export type InsertEbook = typeof ebooks.$inferInsert;
