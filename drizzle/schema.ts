import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  bigint,
  boolean,
  index,
  uniqueIndex,
  mediumtext,
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
  postalCode: varchar("postalCode", { length: 20 }),
  city: varchar("city", { length: 100 }),
  province: varchar("province", { length: 100 }),
  country: varchar("country", { length: 100 }).default("España"),
  nif: varchar("nif", { length: 20 }),
  razonSocial: varchar("razonSocial", { length: 200 }),
  notes: text("notes"),
  referredBy: varchar("referredBy", { length: 200 }),
  // ── Ficha (0024): datos generales y prácticos, opcionales. Nunca datos de salud ni emocionales. ──
  occupation: varchar("occupation", { length: 150 }),
  /** Tarifa particular acordada (€), si existe */
  customRate: decimal("customRate", { precision: 10, scale: 2 }),
  customRateNote: varchar("customRateNote", { length: 200 }),
  /** «Información para recordar»: preferencias prácticas (sin diagnósticos, salud, familia ni vida sexual) */
  rememberInfo: text("rememberInfo"),
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
  /** Motivo de cancelación (relleno cuando status = cancelled) */
  cancellationReason: text("cancellationReason"),
  /** Token único para que el cliente seleccione entre slots propuestos */
  rescheduleToken: varchar("rescheduleToken", { length: 100 }),
  /** JSON array de {date: "YYYY-MM-DD", time: "HH:MM"} — slots propuestos por admin */
  proposedSlots: text("proposedSlots"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy"),
});

// ─── HISTORIAL DE CITAS (trazabilidad) ───────────────────────────────────────
/**
 * Registro de lo que ocurre con cada solicitud: alta, cambios de estado y envío de
 * notificaciones (con su resultado). Tabla aislada: si aún no existe en la BD, el código
 * lo tolera (ver logAppointmentEvent / getAppointmentEvents en server/db.ts).
 * SQL de creación: drizzle/0020_appointment_events.sql (aplicar a mano; NO está en el journal).
 * NO guardar datos personales ni de salud aquí (solo tipo de evento, estados y resultado).
 */
export const appointmentEvents = mysqlTable("appointment_events", {
  id: int("id").autoincrement().primaryKey(),
  appointmentId: int("appointmentId").notNull(),
  /** request_submitted | status_changed | notification */
  type: varchar("type", { length: 40 }).notNull(),
  fromStatus: varchar("fromStatus", { length: 20 }),
  toStatus: varchar("toStatus", { length: 20 }),
  /** email | whatsapp | owner (solo para type = notification) */
  channel: varchar("channel", { length: 20 }),
  /** client | admin (a quién iba dirigida la notificación; sin direcciones) */
  audience: varchar("audience", { length: 20 }),
  /** sent | failed | skipped (notificaciones) */
  result: varchar("result", { length: 20 }),
  /** Plantilla/acción: request_received, accepted, cancelled, reschedule_proposed... o error resumido */
  detail: varchar("detail", { length: 500 }),
  /** Usuario admin que realizó la acción (null = cliente/sistema) */
  actorUserId: int("actorUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AppointmentEvent = typeof appointmentEvents.$inferSelect;
export type InsertAppointmentEvent = typeof appointmentEvents.$inferInsert;

// ─── GALERÍA DE IMÁGENES DE SERVICIOS ─────────────────────────────────────────
/**
 * Imágenes de la ficha de un servicio (masajes). El orden y la portada se gestionan desde el CRM.
 * Tabla nueva y aislada (migración 0022): el código tolera que todavía no exista y, mientras tanto,
 * muestra la galería por defecto (imageUrl + detailImage + sala). Quitar una imagen solo borra la fila,
 * nunca el archivo del disco.
 */
export const serviceImages = mysqlTable("service_images", {
  id: int("id").autoincrement().primaryKey(),
  serviceId: int("serviceId").notNull(),
  /** Ruta propia: /uploads/… (subida del CRM) o /site/… (imagen fija del sitio) */
  url: varchar("url", { length: 500 }).notNull(),
  /** Texto alternativo (accesibilidad y SEO) */
  alt: varchar("alt", { length: 300 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  /** 1 = portada (foto principal de la ficha y de la tarjeta) */
  isCover: int("isCover").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ServiceImage = typeof serviceImages.$inferSelect;
export type InsertServiceImage = typeof serviceImages.$inferInsert;

// ─── EVENTOS DE CALENDARIO ────────────────────────────────────────────────────
export const calendarEvents = mysqlTable("calendar_events", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  notes: text("notes"),
  eventAt: bigint("eventAt", { mode: "number" }).notNull(),
  durationMinutes: int("durationMinutes").default(60),
  /** Tipo de evento para colorearlo en el calendario */
  type: mysqlEnum("type", [
    "bloqueo",      // Bloqueo de agenda (vacaciones, no disponible)
    "formacion",    // Formación / evento profesional
    "recordatorio", // Recordatorio / tarea pendiente
    "reunion",      // Reunión, llamada, gestión
    "personal",     // Nota personal
  ]).default("recordatorio").notNull(),
  /** Color CSS opcional para override visual */
  color: varchar("color", { length: 30 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy"),
});

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = typeof calendarEvents.$inferInsert;

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;

// ─── NOTAS DE CLIENTE ─────────────────────────────────────────────────────────
export const clientNotes = mysqlTable("client_notes", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  appointmentId: int("appointmentId"),
  type: mysqlEnum("type", ["general", "sesion", "seguimiento", "observacion", "alerta"]).default("general").notNull(),
  content: text("content").notNull(),
  /** Origen visible de la nota importada, p. ej. «Importada de CLIENTAS-ES · celda E51» (0029). Vacío en las notas escritas a mano. */
  source: varchar("source", { length: 120 }),
  /** Clave estable del origen («CLIENTAS-ES:E51»): permite repetir la importación sin duplicar notas. */
  sourceKey: varchar("sourceKey", { length: 80 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy"),
}, (t) => [uniqueIndex("client_notes_source_uq").on(t.clientId, t.sourceKey)]);

export type ClientNote = typeof clientNotes.$inferSelect;
export type InsertClientNote = typeof clientNotes.$inferInsert;

// ─── CATEGORÍAS DE CLIENTE (0029) ─────────────────────────────────────────────
/** Una persona puede tener varias categorías (catálogo en shared/clientCategories.ts). */
export const clientCategories = mysqlTable("client_categories", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  category: varchar("category", { length: 40 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [uniqueIndex("client_categories_uq").on(t.clientId, t.category), index("client_categories_cat_idx").on(t.category)]);

export type ClientCategory = typeof clientCategories.$inferSelect;

// ─── SERVICIOS Y COMPRAS ANTERIORES (0029) ────────────────────────────────────
/** Historial informativo importado de hojas anteriores. No genera pedidos, facturas ni citas. */
export const clientPriorItems = mysqlTable("client_prior_items", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  content: text("content").notNull(),
  source: varchar("source", { length: 120 }).notNull(),
  sourceKey: varchar("sourceKey", { length: 80 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [uniqueIndex("client_prior_items_uq").on(t.clientId, t.sourceKey)]);

export type ClientPriorItem = typeof clientPriorItems.$inferSelect;

// ─── CATÁLOGO DE SERVICIOS RECIBIDOS (0030) ───────────────────────────────────
/** Árbol editable: categoría → (tipo) → artículo. Archivar oculta del desplegable sin perder el historial. */
export const serviceCatalog = mysqlTable("service_catalog", {
  id: int("id").autoincrement().primaryKey(),
  parentId: int("parentId"),
  kind: mysqlEnum("kind", ["category", "group", "item"]).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  /** Si el artículo es una guía de la web (ebooks.slug), los pedidos se enlazan por aquí */
  ebookSlug: varchar("ebookSlug", { length: 100 }),
  priceCents: int("priceCents"),
  sortOrder: int("sortOrder").default(0).notNull(),
  archived: int("archived").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => [index("service_catalog_parent_idx").on(t.parentId)]);

export type ServiceCatalogNode = typeof serviceCatalog.$inferSelect;

/** Servicios recibidos por una clienta (compras de la web y recursos registrados a mano). */
export const clientServices = mysqlTable("client_services", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  categoryId: int("categoryId"),
  groupId: int("groupId"),
  itemId: int("itemId"),
  /** Ruta tal como estaba al registrar: «Productos → Ebooks → Guía Digital del Agua» */
  pathLabel: varchar("pathLabel", { length: 400 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  amountCents: int("amountCents"),
  paymentStatus: mysqlEnum("paymentStatus", ["free", "paid", "pending"]).default("free").notNull(),
  receivedAt: bigint("receivedAt", { mode: "number" }).notNull(),
  notes: text("notes"),
  source: mysqlEnum("source", ["manual", "order", "promo"]).default("manual").notNull(),
  orderId: int("orderId"),
  /** «order:123»: una compra se registra una sola vez por ficha */
  sourceKey: varchar("sourceKey", { length: 80 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy"),
}, (t) => [uniqueIndex("client_services_source_uq").on(t.clientId, t.sourceKey), index("client_services_client_idx").on(t.clientId)]);

export type ClientService = typeof clientServices.$inferSelect;

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
  /** Hora pactada de la sesión, «HH:MM» en 24 h (0027). Opcional: las sesiones antiguas no la tienen.
   *  No es la hora de creación ni de edición de la nota. */
  sessionTime: varchar("sessionTime", { length: 5 }),
  // ── Sesiones (0024). `summary` = observaciones prácticas; `nextSteps` = cuestiones pendientes. ──
  /** Servicio real del sistema (services.id); null en sesiones antiguas */
  serviceId: int("serviceId"),
  /** Texto del servicio cuando la sesión viene de una cita que no se pudo enlazar a un servicio (0030) */
  serviceLabel: varchar("serviceLabel", { length: 200 }),
  durationMinutes: int("durationMinutes"),
  /** Preferencias o comentarios relevantes del cliente (prácticos, no de salud) */
  clientPreferences: text("clientPreferences"),
  /** Trazabilidad mínima de la última edición (el detalle, sin contenido, va a crm_audit_log) */
  editedAt: timestamp("editedAt"),
  editedBy: int("editedBy"),
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

// ─── LÍNEAS DE FACTURA ────────────────────────────────────────────────────────
export const invoiceItems = mysqlTable("invoice_items", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoiceId").notNull(),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).default("1").notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = typeof invoiceItems.$inferInsert;

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
    "whatsapp_booking",       // WhatsApp de reserva al admin
    "whatsapp_lead",          // WhatsApp de nuevo lead al admin
    "whatsapp_purchase",      // WhatsApp de nueva compra al admin
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
  /** Precio del servicio a domicilio (€). NULL = no se ofrece a domicilio. Solo masajes. */
  homePrice: decimal("homePrice", { precision: 10, scale: 2 }),
  /** Duración en minutos */
  durationMinutes: int("durationMinutes").default(60),
  /** Texto de duración legible (e.g. '60 min', 'Mínimo 60 min', 'Consulta inicial + 21 días') */
  durationLabel: varchar("durationLabel", { length: 100 }),
  /** Tipo de servicio para agrupar en el frontend */
  type: mysqlEnum("type", ["consulta", "masaje", "otro"]).default("consulta").notNull(),
  /** Modalidad disponible */
  modality: mysqlEnum("modality", ["online", "presencial", "ambos"]).default("ambos").notNull(),
  imageUrl: text("imageUrl"),
  /** Imagen adicional para la página de detalle */
  detailImage: text("detailImage"),
  /** Descripción larga para la página de detalle (puede incluir HTML básico) */
  longDescription: text("longDescription"),
  /** Beneficios del servicio (JSON array de strings) */
  benefits: text("benefits"),
  /** Qué incluye la sesión (JSON array de strings) */
  includes: text("includes"),
  /** Contraindicaciones o notas importantes */
  contraindications: text("contraindications"),
  /** Mostrar como destacado / más popular */
  featured: int("featured").default(0).notNull(),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  /** 1 = publicado en la web; 0 = no publicado (solo CRM: sin listado, ficha, sitemap ni reserva web). Migración 0026 */
  visibleEnPublico: int("visibleEnPublico").default(1).notNull(),
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
  /** Sinopsis breve para la ficha */
  synopsis: text("synopsis"),
  /** Autoría y edición, para la ficha (ej. «Noviembre de 2026») */
  author: varchar("author", { length: 200 }),
  edition: varchar("edition", { length: 100 }),
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

// ─── SISTEMAS DE AGUA — CATEGORÍAS ───────────────────────────────────────────
export const waterCategories = mysqlTable("water_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  shortDescription: varchar("shortDescription", { length: 500 }),
  imageUrl: text("imageUrl"),
  /** Icono o emoji representativo */
  icon: varchar("icon", { length: 50 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  /** 1 = visible en la parte pública */
  visibleEnPublico: int("visibleEnPublico").default(1).notNull(),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WaterCategory = typeof waterCategories.$inferSelect;
export type InsertWaterCategory = typeof waterCategories.$inferInsert;

// ─── SISTEMAS DE AGUA — PRODUCTOS ────────────────────────────────────────────
export const waterProducts = mysqlTable("water_products", {
  id: int("id").autoincrement().primaryKey(),
  // Identificación
  title: varchar("title", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  subtitle: varchar("subtitle", { length: 300 }),
  // Categorías
  categoryId: int("categoryId"),                          // categoría principal
  secondaryCategories: text("secondaryCategories"),       // JSON array de IDs
  // Textos comerciales
  shortDescription: varchar("shortDescription", { length: 500 }),
  longDescription: text("longDescription"),
  claimsHighlighted: text("claimsHighlighted"),           // JSON array de strings
  benefits: text("benefits"),                             // JSON array de strings
  forWhom: text("forWhom"),                               // Para quién es ideal
  // Precio
  priceVisible: varchar("priceVisible", { length: 100 }), // "1.995,00 €"
  priceFrom: varchar("priceFrom", { length: 100 }),       // "Desde X €" (opcional)
  priceOrientative: varchar("priceOrientative", { length: 200 }),
  // Imágenes
  mainImage: text("mainImage"),
  galleryImages: text("galleryImages"),                   // JSON array de URLs
  // Badge comercial
  badge: varchar("badge", { length: 100 }),               // "Premium", "Recomendado", etc.
  badgeColor: varchar("badgeColor", { length: 50 }),      // color CSS opcional
  // Ficha técnica
  technicalSpecs: text("technicalSpecs"),                 // JSON array de {key, value}
  // Instalación, mantenimiento, garantía
  installationText: text("installationText"),
  maintenanceText: text("maintenanceText"),
  warrantyText: text("warrantyText"),
  // Bloques dinámicos (JSON arrays)
  bulletAdvantages: text("bulletAdvantages"),             // bullets de ventajas
  whyChooseBlock: text("whyChooseBlock"),                 // bloque "por qué elegir"
  expertBlock: text("expertBlock"),                       // bloque acompañamiento experto
  faqBlock: text("faqBlock"),                             // preguntas frecuentes JSON [{q,a}]
  testimonialsBlock: text("testimonialsBlock"),           // testimonios JSON [{name,text,rating}]
  trustBlock: text("trustBlock"),                         // bloque de confianza/autoridad
  // CTAs
  ctaPrimaryLabel: varchar("ctaPrimaryLabel", { length: 100 }).default("Reservar sistema"),
  ctaSecondaryLabel: varchar("ctaSecondaryLabel", { length: 100 }).default("Conocer más detalles"),
  // SEO
  seoTitle: varchar("seoTitle", { length: 200 }),
  seoDescription: varchar("seoDescription", { length: 400 }),
  // Flags
  sortOrder: int("sortOrder").default(0).notNull(),
  visibleEnPublico: int("visibleEnPublico").default(1).notNull(),
  destacadoEnHome: int("destacadoEnHome").default(0).notNull(),
  productoPrincipal: int("productoPrincipal").default(0).notNull(),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy"),
});

export type WaterProduct = typeof waterProducts.$inferSelect;
export type InsertWaterProduct = typeof waterProducts.$inferInsert;

// ─── SISTEMAS DE AGUA — SOLICITUDES DE RESERVA ───────────────────────────────
export const waterInquiries = mysqlTable("water_inquiries", {
  id: int("id").autoincrement().primaryKey(),
  // Datos del solicitante
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 30 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  province: varchar("province", { length: 100 }),
  city: varchar("city", { length: 100 }),
  housingType: varchar("housingType", { length: 100 }),   // piso, casa, chalet, etc.
  // Producto de interés
  productId: int("productId"),
  productName: varchar("productName", { length: 200 }),
  // Mensaje
  observations: text("observations"),
  // Consentimiento legal
  acceptPrivacy: int("acceptPrivacy").default(0).notNull(),
  // Estado CRM
  status: mysqlEnum("status", ["new", "contacted", "qualified", "closed"]).default("new").notNull(),
  internalNotes: text("internalNotes"),
  // Vinculación CRM
  clientId: int("clientId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WaterInquiry = typeof waterInquiries.$inferSelect;
export type InsertWaterInquiry = typeof waterInquiries.$inferInsert;

// ─── ACEITES ESENCIALES — CATEGORÍAS ─────────────────────────────────────────
export const oilCategories = mysqlTable("oil_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  description: varchar("description", { length: 500 }),
  imageUrl: text("imageUrl"),
  icon: varchar("icon", { length: 50 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OilCategory = typeof oilCategories.$inferSelect;
export type InsertOilCategory = typeof oilCategories.$inferInsert;

// ─── ACEITES ESENCIALES — PRODUCTOS ──────────────────────────────────────────
export const oilProducts = mysqlTable("oil_products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  /** Categoría principal (nombre de la categoría) */
  category: varchar("category", { length: 100 }).notNull().default("aceites-esenciales"),
  /** Tipo de producto */
  tipoProducto: mysqlEnum("tipoProducto", ["aceite", "mezcla", "base", "pack", "accesorio"]).default("aceite").notNull(),
  descripcion: text("descripcion"),
  /** JSON array de strings — beneficios clave */
  beneficios: text("beneficios"),
  /** JSON array de strings — indicaciones de uso */
  indicaciones: text("indicaciones"),
  usoGeneral: text("usoGeneral"),
  /** Mensaje personalizado de consulta que aparece en la ficha */
  mensajeConsulta: text("mensajeConsulta"),
  imagen: text("imagen"),
  /** JSON array de strings — etiquetas para filtrado */
  tags: text("tags"),
  /** 1 = producto destacado */
  destacado: int("destacado").default(0).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  /** 1 = visible en la parte pública */
  visibleEnPublico: int("visibleEnPublico").default(1).notNull(),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy"),
});

export type OilProduct = typeof oilProducts.$inferSelect;
export type InsertOilProduct = typeof oilProducts.$inferInsert;

// ─── ACEITES ESENCIALES — CONSULTAS ──────────────────────────────────────────
export const oilConsultations = mysqlTable("oil_consultations", {
  id: int("id").autoincrement().primaryKey(),
  nombre: varchar("nombre", { length: 200 }).notNull(),
  email: varchar("email", { length: 200 }).notNull(),
  telefono: varchar("telefono", { length: 30 }),
  mensaje: text("mensaje"),
  /** JSON array de objetos {id, name, slug} — productos seleccionados */
  productsList: text("productsList"),
  status: mysqlEnum("status", ["new", "contacted", "qualified", "closed"]).default("new").notNull(),
  internalNotes: text("internalNotes"),
  /** Vinculación con cliente del CRM */
  clientId: int("clientId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OilConsultation = typeof oilConsultations.$inferSelect;
export type InsertOilConsultation = typeof oilConsultations.$inferInsert;

// ─── BLOG ─────────────────────────────────────────────────────────────────────
export const blogCategories = mysqlTable("blog_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  description: text("description"),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type BlogCategory = typeof blogCategories.$inferSelect;
export type InsertBlogCategory = typeof blogCategories.$inferInsert;

export const blogPosts = mysqlTable("blog_posts", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 220 }).notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content"),
  coverImage: text("coverImage"),
  /** Imagen centrada que aparece después del extracto en el artículo */
  featuredImage: text("featuredImage"),
  /** Nombre del autor del artículo */
  author: varchar("author", { length: 150 }),
  /** Fecha real en la que se escribió el artículo (editable manualmente) */
  writtenAt: timestamp("writtenAt"),
  categoryId: int("categoryId"),
  /** Tiempo estimado de lectura en minutos */
  readTimeMinutes: int("readTimeMinutes").default(5),
  /** 1 = destacado (aparece en hero/featured) */
  featured: int("featured").default(0).notNull(),
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy"),
});
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;

// ── BLOG COMMENTS ────────────────────────────────────────────────────────────
export const blogComments = mysqlTable("blog_comments", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  authorName: varchar("authorName", { length: 100 }).notNull(),
  content: text("content").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BlogComment = typeof blogComments.$inferSelect;
export type InsertBlogComment = typeof blogComments.$inferInsert;

// ── HERO IMAGES ──────────────────────────────────────────────────────────────
export const heroImages = mysqlTable("hero_images", {
  id: int("id").autoincrement().primaryKey(),
  url: text("url").notNull(),
  key: varchar("key", { length: 500 }).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type HeroImage = typeof heroImages.$inferSelect;
export type InsertHeroImage = typeof heroImages.$inferInsert;

// ─── PEDIDOS (guías digitales pagadas por Bizum) ──────────────────────────────
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  /** Referencia corta que el cliente pone en el concepto del Bizum (p. ej. GUIA-K7P3Q9). */
  reference: varchar("reference", { length: 20 }).notNull().unique(),
  productType: varchar("productType", { length: 20 }).default("ebook").notNull(),
  productSlug: varchar("productSlug", { length: 100 }).notNull(),
  productTitle: varchar("productTitle", { length: 200 }).notNull(),
  amountCents: int("amountCents").notNull(),
  currency: varchar("currency", { length: 3 }).default("EUR").notNull(),
  customerName: varchar("customerName", { length: 200 }).notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 30 }),
  paymentMethod: varchar("paymentMethod", { length: 20 }).default("bizum").notNull(),
  status: mysqlEnum("status", ["pending", "paid", "cancelled"]).default("pending").notNull(),
  /** El cliente ha pulsado «Ya he hecho el Bizum» (no es una confirmación: solo la comprueba Cristina). */
  customerClaimedAt: bigint("customerClaimedAt", { mode: "number" }),
  paidAt: bigint("paidAt", { mode: "number" }),
  paidByUserId: int("paidByUserId"),
  cancelledAt: bigint("cancelledAt", { mode: "number" }),
  /** Solo existe una vez confirmado el pago. */
  downloadToken: varchar("downloadToken", { length: 100 }).unique(),
  downloadExpiresAt: bigint("downloadExpiresAt", { mode: "number" }),
  downloadCount: int("downloadCount").default(0).notNull(),
  deliveryEmailSentAt: bigint("deliveryEmailSentAt", { mode: "number" }),
  includesSession: int("includesSession").default(0).notNull(),
  clientId: int("clientId"),
  /** Cómo se vinculó a la ficha (0030): linked = ficha existente, created = ficha nueva, review = varias coincidencias, a revisar */
  clientLinkStatus: varchar("clientLinkStatus", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// ─── Ficha de clientes (0024) ─────────────────────────────────────────────────

/**
 * Registro de accesos y cambios de la ficha. NUNCA guarda contenido de notas ni datos sensibles:
 * solo quién, qué acción, sobre qué registro y los NOMBRES de los campos modificados.
 */
export const crmAuditLog = mysqlTable(
  "crm_audit_log",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId"),
    action: varchar("action", { length: 40 }).notNull(),
    entityType: varchar("entityType", { length: 40 }).notNull(),
    entityId: int("entityId"),
    clientId: int("clientId"),
    fields: varchar("fields", { length: 500 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => [index("crm_audit_log_clientId_idx").on(t.clientId)],
);
export type CrmAuditLog = typeof crmAuditLog.$inferSelect;

/**
 * Datos de categoría especial (ficha de primera visita y acompañamiento emocional), separados de los
 * administrativos y CIFRADOS en la aplicación (AES-256-GCM): la columna solo contiene texto cifrado.
 * Acceso bloqueado en el servidor mientras el módulo no esté habilitado (server/sensitive/config.ts).
 */
export const clientSensitiveRecords = mysqlTable(
  "client_sensitive_records",
  {
    id: int("id").autoincrement().primaryKey(),
    clientId: int("clientId").notNull(),
    module: mysqlEnum("module", ["first_visit", "emotional"]).notNull(),
    ciphertext: mediumtext("ciphertext").notNull(),
    keyVersion: varchar("keyVersion", { length: 20 }).notNull(),
    /** Fecha de la anotación (acompañamiento) o de la ficha */
    recordDate: bigint("recordDate", { mode: "number" }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    createdBy: int("createdBy"),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    updatedBy: int("updatedBy"),
  },
  (t) => [index("client_sensitive_records_client_module_idx").on(t.clientId, t.module)],
);
export type ClientSensitiveRecord = typeof clientSensitiveRecords.$inferSelect;

/**
 * Consentimientos explícitos por módulo: fecha, versión del texto informado, forma de obtención y retirada.
 * Retirar uno bloquea nuevos tratamientos de ese módulo y marca los datos existentes para revisión.
 */
export const clientConsents = mysqlTable(
  "client_consents",
  {
    id: int("id").autoincrement().primaryKey(),
    clientId: int("clientId").notNull(),
    module: mysqlEnum("module", ["first_visit", "emotional"]).notNull(),
    textVersion: varchar("textVersion", { length: 40 }).notNull(),
    method: varchar("method", { length: 40 }).notNull(),
    grantedAt: bigint("grantedAt", { mode: "number" }).notNull(),
    withdrawnAt: bigint("withdrawnAt", { mode: "number" }),
    reviewRequired: boolean("reviewRequired").default(false).notNull(),
    /** Última revisión periódica de la necesidad de conservar los datos del módulo (0025) */
    reviewedAt: bigint("reviewedAt", { mode: "number" }),
    recordedBy: int("recordedBy"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => [index("client_consents_client_module_idx").on(t.clientId, t.module)],
);
export type ClientConsent = typeof clientConsents.$inferSelect;

/**
 * Editar web (0028). Cada página, plantilla de ficha o los ajustes globales son un «documento» con borrador y una versión
 * publicada; cada publicación o restauración añade una versión al historial. `servedFrom` decide qué sirve la web pública:
 * la página de siempre en código (`legacy`) o el documento publicado (`cms`).
 */
export const siteDocuments = mysqlTable(
  "site_documents",
  {
    id: int("id").autoincrement().primaryKey(),
    /** Ruta pública ("/consultas"), plantilla ("tpl:/consultas/:slug") o "global" */
    docKey: varchar("docKey", { length: 191 }).notNull().unique(),
    kind: mysqlEnum("kind", ["page", "template", "global"]).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    servedFrom: mysqlEnum("servedFrom", ["legacy", "cms"]).default("legacy").notNull(),
    draftJson: mediumtext("draftJson").notNull(),
    draftUpdatedAt: timestamp("draftUpdatedAt").defaultNow().notNull(),
    draftUpdatedBy: int("draftUpdatedBy"),
    publishedVersionId: int("publishedVersionId"),
    publishedAt: timestamp("publishedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [index("site_documents_kind_idx").on(t.kind)],
);
export type SiteDocument = typeof siteDocuments.$inferSelect;

export const siteDocumentVersions = mysqlTable(
  "site_document_versions",
  {
    id: int("id").autoincrement().primaryKey(),
    documentId: int("documentId").notNull(),
    contentJson: mediumtext("contentJson").notNull(),
    action: mysqlEnum("action", ["publish", "restore", "migrate"]).notNull(),
    note: varchar("note", { length: 200 }),
    createdBy: int("createdBy"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => [index("site_document_versions_doc_idx").on(t.documentId)],
);
export type SiteDocumentVersion = typeof siteDocumentVersions.$inferSelect;

/** Redirecciones editables desde el panel (se suman a redirects.json, que sigue siendo la base). */
export const siteRedirects = mysqlTable("site_redirects", {
  id: int("id").autoincrement().primaryKey(),
  fromPath: varchar("fromPath", { length: 300 }).notNull().unique(),
  toPath: varchar("toPath", { length: 500 }).notNull(),
  /** 1 = creada sola al cambiar la dirección de una página */
  auto: int("auto").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SiteRedirect = typeof siteRedirects.$inferSelect;

// ─── PROMOCIONES DE EBOOKS (descarga gratuita por tiempo limitado) ───────────
export const ebookPromos = mysqlTable("ebook_promos", {
  id: int("id").autoincrement().primaryKey(),
  /** URL propia: /promocion/:slug */
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  /** Nombre interno para Cristina */
  name: varchar("name", { length: 200 }).notNull(),
  ebookId: int("ebookId").notNull(),
  /** Titular; el salto de línea separa la parte normal de la que va en cursiva */
  headline: varchar("headline", { length: 200 }).notNull(),
  message: text("message").notNull(),
  /** Texto del aviso de la portada y de Guías digitales */
  bannerText: varchar("bannerText", { length: 200 }).notNull(),
  published: int("published").default(0).notNull(),
  /** ms UTC; null = desde que se publica */
  startsAt: bigint("startsAt", { mode: "number" }),
  /** ms UTC; la descarga gratuita termina exactamente en este instante */
  endsAt: bigint("endsAt", { mode: "number" }).notNull(),
  donationEnabled: int("donationEnabled").default(1).notNull(),
  donationConcept: varchar("donationConcept", { length: 60 }).default("Regalo Tierra").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type EbookPromo = typeof ebookPromos.$inferSelect;

/** Medición agregada y anónima (sin IP, sin correo): visitas, descargas iniciadas y clics en compartir. */
export const ebookPromoEvents = mysqlTable("ebook_promo_events", {
  id: int("id").autoincrement().primaryKey(),
  promoId: int("promoId").notNull(),
  kind: mysqlEnum("kind", ["view", "download", "share"]).notNull(),
  channel: varchar("channel", { length: 30 }),
  source: varchar("source", { length: 30 }).default("directo").notNull(),
  /** Registro (formulario) que hizo la descarga */
  registrationId: int("registrationId"),
  /** 1 = la plataforma confirmó la acción (p. ej. el menú de compartir del móvil devolvió «compartido») */
  confirmed: int("confirmed").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Quien completa el formulario de descarga. El token abre la ruta protegida de descarga de esa promoción. */
export const ebookPromoRegistrations = mysqlTable("ebook_promo_registrations", {
  id: int("id").autoincrement().primaryKey(),
  promoId: int("promoId").notNull(),
  /** Ficha del CRM; null si la identidad quedó en revisión */
  clientId: int("clientId"),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 30 }).notNull(),
  source: varchar("source", { length: 30 }).default("directo").notNull(),
  status: mysqlEnum("status", ["linked", "created", "review"]).notNull(),
  /** ids de fichas candidatas separados por coma (solo en revisión) */
  candidates: varchar("candidates", { length: 200 }),
  token: varchar("token", { length: 64 }).notNull().unique(),
  /** ms de la última entrega reservada: cierra la puerta de forma atómica a las peticiones repetidas o simultáneas */
  lastDownloadAt: bigint("lastDownloadAt", { mode: "number" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type EbookPromoRegistration = typeof ebookPromoRegistrations.$inferSelect;
