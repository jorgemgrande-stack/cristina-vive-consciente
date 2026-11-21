/**
 * Importación de clientas desde hojas anteriores (CLIENTAS-ES) — Cristina Vive Consciente
 *
 * Dos pasos separados y repetibles:
 *  1. planImport(): cruce EN SECO contra el CRM (no escribe nada). Devuelve qué haría con cada persona.
 *  2. applyPlan(): escribe solo los casos claros. Repetirla no duplica fichas, categorías, notas ni historial.
 *
 * No crea pedidos, facturas ni citas, no toca secuencias ni envía comunicaciones: solo escribe en
 * clients, client_categories, client_notes y client_prior_items.
 */
import { and, eq } from "drizzle-orm";
import { getDb } from "./db";
import { clients, clientCategories, clientNotes, clientPriorItems, clientServices, orders } from "../drizzle/schema";
import { CLIENT_CATEGORY_KEYS, isClientCategory } from "../shared/clientCategories";

export interface SourceRecord {
  sourceRow: number;
  fullName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  servicesAndPurchases: string | null;
  categories: string[];
  note: { sourceCell: string; type: string; content: string; commercialExtract: boolean } | null;
  reviewFlags: string[];
}

export interface ImportFile {
  source: { filename: string; sheet: string };
  rules: {
    addToAllPreexistingClients: string[];
    fallbackForImportedClientsWithoutHistory: string[];
    sourceDuplicateGroups: number[][];
    possibleDuplicateGroupsToReview: number[][];
  };
  records: SourceRecord[];
}

export interface ExistingClient {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  categories: string[];
  noteKeys: string[];
  priorKeys: string[];
}

export interface PlanPerson {
  rows: number[];
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  categories: string[];
  notes: { key: string; cell: string; content: string }[];
  prior: { key: string; content: string }[];
  warnings: string[];
}

export type PlanItem =
  | (PlanPerson & { action: "create" })
  | (PlanPerson & {
      action: "update";
      clientId: number;
      matchedBy: "email" | "teléfono" | "email y teléfono";
      /** Lo que realmente cambiaría en la ficha (vacío = ya estaba todo, no se toca) */
      add: { categories: string[]; notes: string[]; prior: string[]; fields: string[] };
      changed: boolean;
    })
  | (PlanPerson & { action: "pending"; reason: string; candidates?: number[] })
  /** Fila resuelta a mano (nota «fila N resuelta» en una ficha): no se importa ni queda pendiente */
  | (PlanPerson & { action: "resolved"; clientId: number });

/** Clave de la nota que deja constancia de que una fila del archivo está resuelta. */
export const resolvedKey = (row: number) => `CLIENTAS-ES:F${row}-resuelta`;

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export function normalizeEmail(raw: string | null | undefined): string | null {
  const v = (raw ?? "").trim().toLowerCase();
  return /^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/.test(v) ? v : null;
}

export function normalizePhone(raw: string | null | undefined): string | null {
  let d = (raw ?? "").replace(/\D/g, "");
  if (d.startsWith("0034")) d = d.slice(4);
  else if (d.startsWith("34") && d.length === 11) d = d.slice(2);
  return d.length >= 9 ? d : null;
}

const COMPOUND_FIRST = new Set(["maria jose", "maria del", "maria jesus", "maria luisa", "maria carmen", "ana belen", "jose miguel", "jose luis", "juan carlos", "jose maria", "miguel angel", "maria teresa", "maria isabel"]);

export function splitName(full: string): { firstName: string; lastName: string } {
  const t = full.trim().replace(/\s+/g, " ").split(" ");
  if (t.length === 1) return { firstName: t[0], lastName: "" };
  const k = t.length > 2 && COMPOUND_FIRST.has(norm(`${t[0]} ${t[1]}`)) ? 2 : 1;
  return { firstName: t.slice(0, k).join(" "), lastName: t.slice(k).join(" ") };
}

/** ¿Pueden ser la misma persona? Comparten al menos una palabra del nombre (sin tildes ni mayúsculas). */
export function namesCompatible(a: string, b: string): boolean {
  const ta = new Set(norm(a).split(/\s+/).filter((x) => x.length >= 3));
  return norm(b).split(/\s+/).some((x) => x.length >= 3 && ta.has(x));
}

/** Consolida primero los grupos duplicados declarados en el archivo (una persona = una sola ficha). */
function consolidate(records: SourceRecord[], groups: number[][]): { people: PlanPerson[]; byRow: Map<number, PlanPerson> } {
  const rowToGroup = new Map<number, number[]>();
  for (const g of groups) for (const r of g) rowToGroup.set(r, g);
  const done = new Set<number>();
  const people: PlanPerson[] = [];
  const byRow = new Map<number, PlanPerson>();
  const bySrc = new Map(records.map((r) => [r.sourceRow, r]));
  for (const rec of records) {
    if (done.has(rec.sourceRow)) continue;
    const rows = (rowToGroup.get(rec.sourceRow) ?? [rec.sourceRow]).filter((r) => bySrc.has(r)).sort((a, b) => a - b);
    const recs = rows.map((r) => bySrc.get(r)!);
    rows.forEach((r) => done.add(r));
    const first = <T,>(f: (r: SourceRecord) => T | null | undefined) => recs.map(f).find((v) => v != null && v !== "") ?? null;
    const warnings: string[] = [];
    const rawEmail = first((r) => r.email);
    const email = normalizeEmail(rawEmail);
    if (rawEmail && !email) warnings.push(`fila ${rec.sourceRow}: el email de origen no es válido y no se guarda`);
    const phone = normalizePhone(first((r) => r.phone));
    const categories = Array.from(new Set(recs.flatMap((r) => r.categories))).filter(isClientCategory);
    const person: PlanPerson = {
      rows,
      name: first((r) => r.fullName) ?? "",
      email,
      phone,
      address: first((r) => r.address),
      categories,
      notes: recs.filter((r) => r.note?.content?.trim()).map((r) => ({ key: `CLIENTAS-ES:${r.note!.sourceCell}`, cell: r.note!.sourceCell, content: r.note!.content.trim() })),
      prior: recs.filter((r) => r.servicesAndPurchases?.trim()).map((r) => ({ key: `CLIENTAS-ES:F${r.sourceRow}`, content: r.servicesAndPurchases!.trim() })),
      warnings,
    };
    people.push(person);
    rows.forEach((r) => byRow.set(r, person));
  }
  return { people, byRow };
}

export function planImport(file: ImportFile, existing: ExistingClient[]): PlanItem[] {
  const { people } = consolidate(file.records, file.rules.sourceDuplicateGroups);
  const doubtful = new Set(file.rules.possibleDuplicateGroupsToReview.flat());
  const fallback = file.rules.fallbackForImportedClientsWithoutHistory.filter(isClientCategory);

  const byEmail = new Map<string, ExistingClient[]>();
  const byPhone = new Map<string, ExistingClient[]>();
  for (const c of existing) {
    const e = normalizeEmail(c.email);
    const p = normalizePhone(c.phone);
    if (e) byEmail.set(e, [...(byEmail.get(e) ?? []), c]);
    if (p) byPhone.set(p, [...(byPhone.get(p) ?? []), c]);
  }

  // Contactos repetidos entre filas distintas del archivo que no están declaradas como duplicado
  const seen = new Map<string, PlanPerson[]>();
  for (const p of people) for (const k of [p.email && `e:${p.email}`, p.phone && `p:${p.phone}`]) if (k) seen.set(k, [...(seen.get(k) ?? []), p]);

  // Filas resueltas a mano: la constancia vive en la BD (nota con clave «CLIENTAS-ES:F<fila>-resuelta»)
  const resolvedRows = new Map<number, number>();
  for (const c of existing) for (const k of c.noteKeys) { const m = /^CLIENTAS-ES:F(\d+)-resuelta$/.exec(k); if (m) resolvedRows.set(Number(m[1]), c.id); }

  return people.map((p): PlanItem => {
    const done = p.rows.map((r) => resolvedRows.get(r)).find((id) => id !== undefined);
    if (done !== undefined) return { ...p, action: "resolved", clientId: done };
    if (p.rows.some((r) => doubtful.has(r))) return { ...p, action: "pending", reason: "Posible persona repetida en otra fila: hay que confirmar la identidad antes de unirlas" };
    if (!p.email && !p.phone) return { ...p, action: "pending", reason: "Sin email ni teléfono utilizables: no se puede cruzar ni evitar duplicados" };
    const dup = [p.email && `e:${p.email}`, p.phone && `p:${p.phone}`].some((k) => k && (seen.get(k)?.length ?? 0) > 1);
    if (dup) return { ...p, action: "pending", reason: "Comparte email o teléfono con otra fila del archivo no declarada como duplicado" };

    const cand = new Map<number, { c: ExistingClient; by: Set<string> }>();
    for (const c of p.email ? byEmail.get(p.email) ?? [] : []) cand.set(c.id, { c, by: new Set(["email"]) });
    for (const c of p.phone ? byPhone.get(p.phone) ?? [] : []) cand.set(c.id, { c, by: new Set<string>(Array.from(cand.get(c.id)?.by ?? []).concat("teléfono")) });

    if (cand.size === 0) {
      const categories = p.categories.length ? p.categories : fallback;
      return { ...p, categories, action: "create" };
    }
    if (cand.size > 1) return { ...p, action: "pending", reason: "Coincide con más de una ficha del CRM", candidates: Array.from(cand.keys()) };
    const { c, by } = Array.from(cand.values())[0];
    if (!namesCompatible(p.name, `${c.firstName} ${c.lastName}`)) {
      return { ...p, action: "pending", reason: `Coincide por ${Array.from(by).join(" y ")} con una ficha de nombre distinto`, candidates: [c.id] };
    }
    const add = {
      categories: p.categories.filter((k) => !c.categories.includes(k)),
      notes: p.notes.filter((n) => !c.noteKeys.includes(n.key)).map((n) => n.key),
      prior: p.prior.filter((n) => !c.priorKeys.includes(n.key)).map((n) => n.key),
      fields: [
        !c.email && p.email ? "email" : null,
        !c.phone && p.phone ? "teléfono" : null,
        !c.address?.trim() && p.address ? "dirección" : null,
      ].filter(Boolean) as string[],
    };
    const warnings = [...p.warnings];
    if (c.email && p.email && normalizeEmail(c.email) !== p.email) warnings.push("el email del archivo difiere del de la ficha: se conserva el de la ficha");
    if (c.phone && p.phone && normalizePhone(c.phone) !== p.phone) warnings.push("el teléfono del archivo difiere del de la ficha: se conserva el de la ficha");
    return {
      ...p,
      warnings,
      action: "update",
      clientId: c.id,
      matchedBy: by.size === 2 ? "email y teléfono" : (Array.from(by)[0] as "email" | "teléfono"),
      add,
      changed: add.categories.length + add.notes.length + add.prior.length + add.fields.length > 0,
    };
  });
}

/** Lee del CRM lo necesario para el cruce (solo lectura). */
export async function loadExisting(): Promise<ExistingClient[]> {
  const db = await getDb();
  if (!db) throw new Error("Base de datos no disponible");
  const soft = <T,>(p: Promise<T[]>) => p.catch(() => [] as T[]); // 0029 sin aplicar: se trata como vacío
  const [cl, cats, notes, prior] = await Promise.all([
    db.select({ id: clients.id, firstName: clients.firstName, lastName: clients.lastName, email: clients.email, phone: clients.phone, address: clients.address }).from(clients),
    soft(db.select().from(clientCategories)),
    soft(db.select({ clientId: clientNotes.clientId, k: clientNotes.sourceKey }).from(clientNotes)),
    soft(db.select({ clientId: clientPriorItems.clientId, k: clientPriorItems.sourceKey }).from(clientPriorItems)),
  ]);
  const group = <T extends { clientId: number }>(rows: T[], f: (r: T) => string | null) => {
    const m = new Map<number, string[]>();
    for (const r of rows) { const v = f(r); if (v) m.set(r.clientId, [...(m.get(r.clientId) ?? []), v]); }
    return m;
  };
  const gc = group(cats, (r) => (r as any).category);
  const gn = group(notes, (r) => r.k);
  const gp = group(prior, (r) => r.k);
  return cl.map((c) => ({
    id: c.id, firstName: c.firstName, lastName: c.lastName, email: c.email, phone: c.phone, address: c.address,
    categories: gc.get(c.id) ?? [], noteKeys: gn.get(c.id) ?? [], priorKeys: gp.get(c.id) ?? [],
  }));
}

export interface ApplyReport {
  created: number;
  updated: number;
  unchanged: number;
  notesAdded: number;
  priorAdded: number;
  categoriesAdded: number;
  pending: { rows: number[]; reason: string }[];
  resolved: number[][];
}

/** Escribe solo los casos claros. Idempotente: cada escritura comprueba antes si ya existe. */
export async function applyPlan(plan: PlanItem[]): Promise<ApplyReport> {
  const db = await getDb();
  if (!db) throw new Error("Base de datos no disponible");
  const rep: ApplyReport = { created: 0, updated: 0, unchanged: 0, notesAdded: 0, priorAdded: 0, categoriesAdded: 0, pending: [], resolved: [] };
  for (const item of plan) {
    if (item.action === "pending") { rep.pending.push({ rows: item.rows, reason: item.reason }); continue; }
    if (item.action === "resolved") { rep.resolved.push(item.rows); continue; }
    await db.transaction(async (tx) => {
      let clientId: number;
      let touched = false;
      if (item.action === "create") {
        const { firstName, lastName } = splitName(item.name);
        const [r] = await tx.insert(clients).values({ firstName, lastName, email: item.email, phone: item.phone, address: item.address, status: "active" });
        clientId = (r as any).insertId as number;
        rep.created++;
        touched = true;
      } else {
        clientId = item.clientId;
        const [cur] = await tx.select({ email: clients.email, phone: clients.phone, address: clients.address }).from(clients).where(eq(clients.id, clientId)).limit(1);
        const patch: Partial<typeof clients.$inferInsert> = {};
        if (!cur.email && item.email) patch.email = item.email;
        if (!cur.phone && item.phone) patch.phone = item.phone;
        if (!cur.address?.trim() && item.address) patch.address = item.address;
        if (Object.keys(patch).length) { await tx.update(clients).set(patch).where(eq(clients.id, clientId)); touched = true; }
      }
      for (const category of item.categories) {
        if (!CLIENT_CATEGORY_KEYS.includes(category as any)) continue;
        const [x] = await tx.select().from(clientCategories).where(and(eq(clientCategories.clientId, clientId), eq(clientCategories.category, category))).limit(1);
        if (!x) { await tx.insert(clientCategories).values({ clientId, category }); rep.categoriesAdded++; touched = true; }
      }
      for (const n of item.notes) {
        const [x] = await tx.select().from(clientNotes).where(and(eq(clientNotes.clientId, clientId), eq(clientNotes.sourceKey, n.key))).limit(1);
        if (!x) {
          await tx.insert(clientNotes).values({ clientId, type: "general", content: n.content, source: `Importada de CLIENTAS-ES · celda ${n.cell}`, sourceKey: n.key });
          rep.notesAdded++; touched = true;
        }
      }
      for (const h of item.prior) {
        const [x] = await tx.select().from(clientPriorItems).where(and(eq(clientPriorItems.clientId, clientId), eq(clientPriorItems.sourceKey, h.key))).limit(1);
        if (!x) {
          await tx.insert(clientPriorItems).values({ clientId, content: h.content, source: "Importada de CLIENTAS-ES", sourceKey: h.key });
          rep.priorAdded++; touched = true;
        }
      }
      if (item.action === "update") { if (touched) rep.updated++; else rep.unchanged++; }
    });
  }
  return rep;
}

/**
 * Marca una fila del archivo como resuelta: deja una nota en la ficha («corresponde a esta ficha y al pedido X») y
 * NO importa la fila ni crea otro registro de compra. Exige que el pedido esté pagado, vinculado a esa ficha y con
 * un único registro en Servicios. Repetirla no duplica la nota.
 */
export async function markRowResolved(row: number, clientId: number, orderRef: string, rowText: string): Promise<{ created: boolean }> {
  const db = await getDb();
  if (!db) throw new Error("Base de datos no disponible");
  const [cl] = await db.select({ id: clients.id }).from(clients).where(eq(clients.id, clientId)).limit(1);
  if (!cl) throw new Error(`No existe la ficha #${clientId}`);
  const [o] = await db.select().from(orders).where(eq(orders.reference, orderRef)).limit(1);
  if (!o) throw new Error(`No existe el pedido ${orderRef}`);
  if (o.status !== "paid") throw new Error("El pedido no está pagado");
  if (o.clientId !== clientId) throw new Error(`El pedido no está vinculado a la ficha #${clientId}`);
  const reg = await db.select({ id: clientServices.id }).from(clientServices).where(eq(clientServices.orderId, o.id));
  if (reg.length !== 1) throw new Error(`El pedido debe tener exactamente 1 registro en Servicios (tiene ${reg.length})`);
  const key = resolvedKey(row);
  const [x] = await db.select({ id: clientNotes.id }).from(clientNotes).where(and(eq(clientNotes.clientId, clientId), eq(clientNotes.sourceKey, key))).limit(1);
  if (x) return { created: false };
  await db.insert(clientNotes).values({
    clientId,
    type: "general",
    content: `Fila ${row} de CLIENTAS-ES («${rowText}») resuelta: corresponde a esta ficha y al pedido ${orderRef}. La compra ya consta en Servicios (un único registro); no se vuelve a importar.`,
    source: `Importada de CLIENTAS-ES · fila ${row} (resuelta)`,
    sourceKey: key,
  });
  return { created: true };
}
