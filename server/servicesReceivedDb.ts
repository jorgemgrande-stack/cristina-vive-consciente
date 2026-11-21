/**
 * Servicios recibidos — catálogo, registro por clienta, vínculo de pedidos y sesiones desde citas.
 * Todo es idempotente: una compra o una cita realizada deja UNA sola entrada en el historial.
 */
import { and, asc, eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import { appointments, clients, clientServices, orders, serviceCatalog, services, sessionHistory, type Order } from "../drizzle/schema";
import { allowedChildKinds, pathLabel, pathTo, slugify, type CatalogKind, type CatalogNode, type PaymentStatus } from "../shared/serviceCatalog";

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Base de datos no disponible");
  return db;
}

// ─── Catálogo ────────────────────────────────────────────────────────────────

export async function listCatalog(): Promise<CatalogNode[]> {
  const db = await requireDb();
  return (await db.select().from(serviceCatalog).orderBy(asc(serviceCatalog.sortOrder), asc(serviceCatalog.name))) as CatalogNode[];
}

async function uniqueSlug(base: string): Promise<string> {
  const db = await requireDb();
  for (let i = 0; i < 50; i++) {
    const slug = i === 0 ? base : `${base}-${i + 1}`;
    const [x] = await db.select({ id: serviceCatalog.id }).from(serviceCatalog).where(eq(serviceCatalog.slug, slug)).limit(1);
    if (!x) return slug;
  }
  return `${base}-${Date.now()}`;
}

export async function createCatalogNode(input: { parentId: number | null; kind: CatalogKind; name: string; priceCents?: number | null; ebookSlug?: string | null }) {
  const db = await requireDb();
  const nodes = await listCatalog();
  const parent = input.parentId ? nodes.find((n) => n.id === input.parentId) ?? null : null;
  if (input.parentId && !parent) throw new Error("El elemento superior no existe");
  if (!allowedChildKinds(parent).includes(input.kind)) throw new Error("Ese elemento no puede crearse ahí");
  const name = input.name.trim();
  if (!name) throw new Error("Escribe un nombre");
  const siblings = nodes.filter((n) => n.parentId === (parent?.id ?? null));
  if (siblings.some((n) => n.name.trim().toLowerCase() === name.toLowerCase())) throw new Error("Ya existe un elemento con ese nombre aquí");
  const slug = await uniqueSlug(slugify(parent ? `${parent.name}-${name}` : name));
  const [r] = await db.insert(serviceCatalog).values({
    parentId: parent?.id ?? null,
    kind: input.kind,
    name,
    slug,
    ebookSlug: input.ebookSlug ?? null,
    priceCents: input.kind === "item" ? input.priceCents ?? null : null,
    sortOrder: (siblings.reduce((m, n) => Math.max(m, n.sortOrder), 0) || 0) + 1,
  });
  return { id: (r as any).insertId as number };
}

export async function updateCatalogNode(id: number, patch: { name?: string; priceCents?: number | null; sortOrder?: number }) {
  const db = await requireDb();
  const set: Partial<typeof serviceCatalog.$inferInsert> = {};
  if (patch.name !== undefined) {
    if (!patch.name.trim()) throw new Error("Escribe un nombre");
    set.name = patch.name.trim();
  }
  if (patch.priceCents !== undefined) set.priceCents = patch.priceCents;
  if (patch.sortOrder !== undefined) set.sortOrder = patch.sortOrder;
  if (Object.keys(set).length) await db.update(serviceCatalog).set(set).where(eq(serviceCatalog.id, id));
}

/** Archivar oculta el elemento (y lo que cuelga de él) de los desplegables; el historial no se toca. */
export async function setCatalogArchived(id: number, archived: boolean) {
  const db = await requireDb();
  await db.update(serviceCatalog).set({ archived: archived ? 1 : 0 }).where(eq(serviceCatalog.id, id));
}

// ─── Servicios de la clienta ─────────────────────────────────────────────────

export async function listClientServices(clientId: number) {
  const db = await requireDb();
  return db.select().from(clientServices).where(eq(clientServices.clientId, clientId)).orderBy(sql`${clientServices.receivedAt} desc`, sql`${clientServices.id} desc`);
}

/** Ruta y niveles de un nodo del catálogo (artículo, tipo o categoría). */
async function resolveNode(nodeId: number) {
  const nodes = await listCatalog();
  const path = pathTo(nodes, nodeId);
  if (!path.length) throw new Error("El artículo no existe en el catálogo");
  const last = path[path.length - 1];
  return {
    categoryId: path.find((n) => n.kind === "category")?.id ?? null,
    groupId: path.find((n) => n.kind === "group")?.id ?? null,
    itemId: last.kind === "item" ? last.id : null,
    pathLabel: pathLabel(path),
    name: last.name,
    node: last,
  };
}

export interface ServiceInput {
  nodeId: number;
  paymentStatus: PaymentStatus;
  amountCents: number | null;
  receivedAt: number;
  notes?: string | null;
}

export async function createClientService(clientId: number, input: ServiceInput, userId: number | null) {
  const db = await requireDb();
  const r = await resolveNode(input.nodeId);
  const [res] = await db.insert(clientServices).values({
    clientId,
    categoryId: r.categoryId,
    groupId: r.groupId,
    itemId: r.itemId,
    pathLabel: r.pathLabel,
    name: r.name,
    amountCents: input.amountCents,
    paymentStatus: input.paymentStatus,
    receivedAt: input.receivedAt,
    notes: input.notes?.trim() || null,
    source: "manual",
    createdBy: userId,
  });
  return { id: (res as any).insertId as number };
}

export async function updateClientService(id: number, clientId: number, patch: { paymentStatus?: PaymentStatus; amountCents?: number | null; receivedAt?: number; notes?: string | null }) {
  const db = await requireDb();
  const set: Partial<typeof clientServices.$inferInsert> = {};
  if (patch.paymentStatus) set.paymentStatus = patch.paymentStatus;
  if (patch.amountCents !== undefined) set.amountCents = patch.amountCents;
  if (patch.receivedAt !== undefined) set.receivedAt = patch.receivedAt;
  if (patch.notes !== undefined) set.notes = patch.notes?.trim() || null;
  if (Object.keys(set).length) await db.update(clientServices).set(set).where(and(eq(clientServices.id, id), eq(clientServices.clientId, clientId)));
}

/** Solo se borran los registros hechos a mano; las compras de la web se conservan como constancia. */
export async function deleteClientService(id: number, clientId: number) {
  const db = await requireDb();
  const [row] = await db.select().from(clientServices).where(and(eq(clientServices.id, id), eq(clientServices.clientId, clientId))).limit(1);
  if (!row) throw new Error("Registro no encontrado");
  if (row.source !== "manual") throw new Error("Las compras de la web no se pueden eliminar desde aquí");
  await db.delete(clientServices).where(eq(clientServices.id, id));
}

// ─── Pedidos → ficha y Servicios recibidos ───────────────────────────────────

/** Artículo del catálogo de una guía: por ebookSlug; si no existe, se crea en Productos → Ebooks. */
async function ensureEbookNode(order: Pick<Order, "productSlug" | "productTitle" | "amountCents">): Promise<number> {
  const db = await requireDb();
  const [found] = await db.select().from(serviceCatalog).where(eq(serviceCatalog.ebookSlug, order.productSlug)).limit(1);
  if (found) return found.id;
  let [ebooksGroup] = await db.select().from(serviceCatalog).where(eq(serviceCatalog.slug, "productos-ebooks")).limit(1);
  if (!ebooksGroup) {
    let [productos] = await db.select().from(serviceCatalog).where(eq(serviceCatalog.slug, "productos")).limit(1);
    if (!productos) {
      const [p] = await db.insert(serviceCatalog).values({ parentId: null, kind: "category", name: "Productos", slug: "productos", sortOrder: 2 });
      productos = { id: (p as any).insertId } as any;
    }
    const [g] = await db.insert(serviceCatalog).values({ parentId: productos.id, kind: "group", name: "Ebooks", slug: "productos-ebooks", sortOrder: 2 });
    ebooksGroup = { id: (g as any).insertId } as any;
  }
  const slug = await uniqueSlug(`ebook-${slugify(order.productSlug)}`);
  const [i] = await db.insert(serviceCatalog).values({ parentId: ebooksGroup.id, kind: "item", name: order.productTitle, slug, ebookSlug: order.productSlug, priceCents: order.amountCents });
  return (i as any).insertId as number;
}

/** Registra la compra en Servicios recibidos UNA sola vez (clave «order:ID» por ficha). */
export async function recordOrderPurchase(order: Order, clientId: number): Promise<{ created: boolean }> {
  const db = await requireDb();
  const key = `order:${order.id}`;
  const [exists] = await db.select({ id: clientServices.id }).from(clientServices).where(and(eq(clientServices.clientId, clientId), eq(clientServices.sourceKey, key))).limit(1);
  if (exists) return { created: false };
  const r = await resolveNode(await ensureEbookNode(order));
  try {
    await db.insert(clientServices).values({
      clientId,
      categoryId: r.categoryId,
      groupId: r.groupId,
      itemId: r.itemId,
      pathLabel: r.pathLabel,
      name: order.productTitle,
      amountCents: order.amountCents,
      paymentStatus: order.status === "paid" ? "paid" : "pending",
      receivedAt: order.paidAt ?? Date.now(),
      source: "order",
      orderId: order.id,
      sourceKey: key,
    });
  } catch (err) {
    if (/duplicate/i.test(String((err as Error)?.message))) return { created: false };
    throw err;
  }
  return { created: true };
}

const norm = (s: string) => s.trim().toLowerCase();

export function splitCustomerName(full: string): { firstName: string; lastName: string } {
  const t = full.trim().replace(/\s+/g, " ").split(" ");
  return t.length === 1 ? { firstName: t[0], lastName: "" } : { firstName: t[0], lastName: t.slice(1).join(" ") };
}

export async function clientsByEmail(email: string) {
  const db = await requireDb();
  return db
    .select({ id: clients.id, firstName: clients.firstName, lastName: clients.lastName, email: clients.email, phone: clients.phone })
    .from(clients)
    .where(sql`lower(trim(${clients.email})) = ${norm(email)}`);
}

export type LinkResult = { status: "linked" | "created" | "review"; clientId: number | null; recorded: boolean; candidates: number[] };

/**
 * Vincula un pedido pagado a una ficha por email: una coincidencia → la usa; ninguna → crea la ficha;
 * varias → no vincula nada y lo deja para revisión. No envía emails ni toca el pago.
 */
export async function linkOrderToClient(orderId: number): Promise<LinkResult> {
  const db = await requireDb();
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) throw new Error("Pedido no encontrado");
  if (order.status !== "paid") throw new Error("Solo se vinculan pedidos pagados");

  let clientId = order.clientId;
  let status: LinkResult["status"] = "linked";
  let candidates: number[] = [];
  if (!clientId) {
    const found = await clientsByEmail(order.customerEmail);
    candidates = found.map((c) => c.id);
    if (found.length > 1) {
      await db.update(orders).set({ clientLinkStatus: "review" }).where(eq(orders.id, orderId));
      return { status: "review", clientId: null, recorded: false, candidates };
    }
    if (found.length === 1) clientId = found[0].id;
    else {
      const { firstName, lastName } = splitCustomerName(order.customerName);
      const [r] = await db.insert(clients).values({ firstName, lastName, email: norm(order.customerEmail), phone: order.customerPhone ?? null, status: "active" });
      clientId = (r as any).insertId as number;
      status = "created";
    }
    await db.update(orders).set({ clientId, clientLinkStatus: status }).where(eq(orders.id, orderId));
  } else if (!order.clientLinkStatus) {
    await db.update(orders).set({ clientLinkStatus: "linked" }).where(eq(orders.id, orderId));
  } else {
    status = order.clientLinkStatus === "created" ? "created" : "linked";
  }
  const { created } = await recordOrderPurchase(order, clientId!);
  return { status, clientId, recorded: created, candidates };
}

/** Cristina elige la ficha correcta cuando había varias coincidencias. */
export async function resolveOrderReview(orderId: number, clientId: number): Promise<LinkResult> {
  const db = await requireDb();
  const [c] = await db.select({ id: clients.id }).from(clients).where(eq(clients.id, clientId)).limit(1);
  if (!c) throw new Error("Ficha no encontrada");
  await db.update(orders).set({ clientId, clientLinkStatus: "linked" }).where(eq(orders.id, orderId));
  return linkOrderToClient(orderId);
}

// ─── Citas realizadas → historial ────────────────────────────────────────────

const SERVICE_TYPE_LABELS: Record<string, string> = {
  consulta_acompanamiento: "Consulta de acompañamiento",
  consulta_naturopata: "Consulta de naturopatía",
  consulta_breve: "Consulta breve",
  consulta_express: "Consulta exprés",
  biohabitabilidad: "Biohabitabilidad",
  kinesiologia: "Kinesiología",
  masaje: "Masaje",
  otro: "Sesión",
};

function madridTime(ms: number): string {
  return new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit", hour12: false }).format(ms);
}

/**
 * Una cita realizada deja UNA sola sesión en el historial (clave: appointmentId). Cristina añade después las
 * observaciones prácticas y lo pendiente. Si la cita se vuelve a marcar, no se duplica ni se pisa lo escrito.
 */
export async function ensureSessionForAppointment(appointmentId: number, userId: number | null = null): Promise<{ created: boolean; sessionId: number | null }> {
  const db = await requireDb();
  const [a] = await db.select().from(appointments).where(eq(appointments.id, appointmentId)).limit(1);
  if (!a || a.status !== "completed") return { created: false, sessionId: null };
  const [existing] = await db.select({ id: sessionHistory.id }).from(sessionHistory).where(eq(sessionHistory.appointmentId, appointmentId)).limit(1);
  if (existing) return { created: false, sessionId: existing.id };
  const label = (a.serviceLabel?.trim() || SERVICE_TYPE_LABELS[a.serviceType] || "Sesión").slice(0, 200);
  const [svc] = await db.select({ id: services.id }).from(services).where(sql`lower(trim(${services.name})) = ${norm(label)}`).limit(1);
  try {
    const [r] = await db.insert(sessionHistory).values({
      clientId: a.clientId,
      appointmentId,
      sessionDate: a.scheduledAt,
      sessionTime: madridTime(a.scheduledAt),
      serviceId: svc?.id ?? null,
      serviceLabel: svc ? null : label,
      durationMinutes: a.durationMinutes ?? null,
      createdBy: userId,
    });
    return { created: true, sessionId: (r as any).insertId as number };
  } catch (err) {
    if (/duplicate/i.test(String((err as Error)?.message))) return { created: false, sessionId: null };
    throw err;
  }
}
