/**
 * Unificar una ficha duplicada con la que se conserva.
 *
 * Solo traslada lo que es seguro: historial importado, notas y categorías. Se detiene (sin escribir nada) si:
 *  - la ficha a retirar tiene filas en CUALQUIER otra tabla (citas, pedidos, facturas, sesiones, consentimientos…);
 *  - los datos de las dos fichas se contradicen (valores distintos y ambos con contenido; el email y el nombre se
 *    comparan sin mayúsculas ni espacios de más).
 * No rellena ni sobrescribe campos de la ficha que se conserva. Antes de retirar la duplicada verifica el traslado
 * dentro de la misma transacción: si algo no cuadra, se deshace todo.
 */
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import { clientCategories, clientNotes, clientPriorItems, clients } from "../drizzle/schema";

export const MOVABLE_TABLES = ["client_categories", "client_notes", "client_prior_items"] as const;

const COMPARE_FIELDS = ["firstName", "lastName", "email", "phone", "status", "birthDate", "address", "postalCode", "city", "province", "country", "nif", "razonSocial", "notes", "referredBy", "occupation", "customRate", "customRateNote", "rememberInfo"] as const;
const CASE_INSENSITIVE = new Set(["firstName", "lastName", "email"]);
const filled = (v: unknown) => v !== null && v !== undefined && String(v).trim() !== "";
const canon = (k: string, v: unknown) => {
  const t = String(v ?? "").replace(/\s+/g, " ").trim();
  return CASE_INSENSITIVE.has(k) ? t.toLowerCase() : t;
};

export interface MergeAnalysis {
  keepId: number;
  dropId: number;
  /** Filas por tabla de la ficha a retirar (solo las que tienen datos) */
  dropRefs: Record<string, number>;
  /** Tablas con filas de la ficha a retirar que NO se trasladan: bloquean la unificación */
  unexpectedRefs: Record<string, number>;
  conflicts: { field: string; keep: unknown; drop: unknown }[];
  /** Campos con valor solo en la ficha a retirar (no se trasladan: se avisa) */
  onlyInDrop: string[];
  move: { priorItems: number[]; notes: number[]; categories: string[] };
  skipped: { priorItems: number[]; notes: number[] };
  ok: boolean;
}

async function referencingTables(): Promise<string[]> {
  const db = await getDb();
  const [rows] = (await db!.execute(
    sql`select distinct TABLE_NAME as t from information_schema.COLUMNS where TABLE_SCHEMA = database() and COLUMN_NAME = 'clientId'`,
  )) as unknown as [{ t: string }[]];
  return rows.map((r) => r.t).filter((t) => /^[a-z0-9_]+$/i.test(t));
}

export async function analyzeMerge(keepId: number, dropId: number): Promise<MergeAnalysis> {
  const db = await getDb();
  if (!db) throw new Error("Base de datos no disponible");
  if (keepId === dropId) throw new Error("Las dos fichas son la misma");
  const [keep] = await db.select().from(clients).where(eq(clients.id, keepId)).limit(1);
  const [drop] = await db.select().from(clients).where(eq(clients.id, dropId)).limit(1);
  if (!keep || !drop) throw new Error("Alguna de las fichas no existe");

  const dropRefs: Record<string, number> = {};
  for (const t of await referencingTables()) {
    const [res] = (await db.execute(sql.raw(`select count(*) as n from \`${t}\` where clientId = ${Number(dropId)}`))) as unknown as [{ n: number }[]];
    const n = Number(res[0]?.n ?? 0);
    if (n) dropRefs[t] = n;
  }
  const unexpectedRefs = Object.fromEntries(Object.entries(dropRefs).filter(([t]) => !(MOVABLE_TABLES as readonly string[]).includes(t)));

  const conflicts: MergeAnalysis["conflicts"] = [];
  const onlyInDrop: string[] = [];
  for (const f of COMPARE_FIELDS) {
    const a = (keep as any)[f], b = (drop as any)[f];
    if (filled(a) && filled(b) && canon(f, a) !== canon(f, b)) conflicts.push({ field: f, keep: a, drop: b });
    else if (!filled(a) && filled(b)) onlyInDrop.push(f);
  }

  const keepPrior = new Set((await db.select({ k: clientPriorItems.sourceKey }).from(clientPriorItems).where(eq(clientPriorItems.clientId, keepId))).map((r) => r.k));
  const keepNotes = new Set((await db.select({ k: clientNotes.sourceKey }).from(clientNotes).where(eq(clientNotes.clientId, keepId))).map((r) => r.k).filter(Boolean));
  const dropPrior = await db.select().from(clientPriorItems).where(eq(clientPriorItems.clientId, dropId));
  const dropNotes = await db.select().from(clientNotes).where(eq(clientNotes.clientId, dropId));
  const keepCats = new Set((await db.select({ c: clientCategories.category }).from(clientCategories).where(eq(clientCategories.clientId, keepId))).map((r) => r.c));
  const dropCats = (await db.select({ c: clientCategories.category }).from(clientCategories).where(eq(clientCategories.clientId, dropId))).map((r) => r.c);

  const move = {
    priorItems: dropPrior.filter((p) => !keepPrior.has(p.sourceKey)).map((p) => p.id),
    notes: dropNotes.filter((n) => !n.sourceKey || !keepNotes.has(n.sourceKey)).map((n) => n.id),
    categories: dropCats.filter((c) => !keepCats.has(c)),
  };
  const skipped = {
    priorItems: dropPrior.filter((p) => keepPrior.has(p.sourceKey)).map((p) => p.id),
    notes: dropNotes.filter((n) => n.sourceKey && keepNotes.has(n.sourceKey)).map((n) => n.id),
  };
  return { keepId, dropId, dropRefs, unexpectedRefs, conflicts, onlyInDrop, move, skipped, ok: Object.keys(unexpectedRefs).length === 0 && conflicts.length === 0 };
}

export interface MergeResult {
  moved: { priorItems: number; notes: number; categories: number };
  removedClient: number;
}

/** Traslada, verifica y retira la duplicada en una transacción. Si no cuadra, lanza y se deshace. */
export async function applyMerge(keepId: number, dropId: number, backup?: (snapshot: unknown) => void): Promise<MergeResult> {
  const a = await analyzeMerge(keepId, dropId);
  if (!a.ok) throw new Error(`No se unifica: ${Object.keys(a.unexpectedRefs).length ? "la ficha a retirar tiene vínculos en " + Object.keys(a.unexpectedRefs).join(", ") + ". " : ""}${a.conflicts.length ? "Datos contradictorios en " + a.conflicts.map((c) => c.field).join(", ") + "." : ""}`);
  const db = (await getDb())!;
  return db.transaction(async (tx) => {
    // Copia previa de la ficha a retirar y de lo que cuelga de ella
    const [drop] = await tx.select().from(clients).where(eq(clients.id, dropId));
    const snapshot = {
      client: drop,
      priorItems: await tx.select().from(clientPriorItems).where(eq(clientPriorItems.clientId, dropId)),
      notes: await tx.select().from(clientNotes).where(eq(clientNotes.clientId, dropId)),
      categories: await tx.select().from(clientCategories).where(eq(clientCategories.clientId, dropId)),
    };
    backup?.(snapshot);

    for (const id of a.move.priorItems) await tx.update(clientPriorItems).set({ clientId: keepId }).where(and(eq(clientPriorItems.id, id), eq(clientPriorItems.clientId, dropId)));
    for (const id of a.move.notes) await tx.update(clientNotes).set({ clientId: keepId }).where(and(eq(clientNotes.id, id), eq(clientNotes.clientId, dropId)));
    for (const category of a.move.categories) await tx.insert(clientCategories).values({ clientId: keepId, category });

    // Verificación del traslado ANTES de retirar nada
    const keepPrior = await tx.select().from(clientPriorItems).where(eq(clientPriorItems.clientId, keepId));
    const keepNotes = await tx.select().from(clientNotes).where(eq(clientNotes.clientId, keepId));
    const keepCats = new Set((await tx.select().from(clientCategories).where(eq(clientCategories.clientId, keepId))).map((c) => c.category));
    for (const p of snapshot.priorItems) if (!keepPrior.some((k) => k.sourceKey === p.sourceKey && k.content === p.content)) throw new Error(`Verificación: falta el historial ${p.sourceKey} en la ficha que se conserva`);
    for (const n of snapshot.notes) if (!keepNotes.some((k) => k.content === n.content)) throw new Error("Verificación: falta una nota en la ficha que se conserva");
    for (const c of snapshot.categories) if (!keepCats.has(c.category)) throw new Error(`Verificación: falta la categoría ${c.category}`);
    const keys = keepPrior.map((p) => p.sourceKey);
    if (new Set(keys).size !== keys.length) throw new Error("Verificación: historial duplicado");

    // Lo que queda de la duplicada (lo repetido que no se trasladó) y la propia ficha
    await tx.delete(clientPriorItems).where(eq(clientPriorItems.clientId, dropId));
    await tx.delete(clientNotes).where(eq(clientNotes.clientId, dropId));
    await tx.delete(clientCategories).where(eq(clientCategories.clientId, dropId));
    await tx.delete(clients).where(eq(clients.id, dropId));
    const still = await tx.select({ id: clients.id }).from(clients).where(eq(clients.id, dropId));
    if (still.length) throw new Error("Verificación: la ficha duplicada sigue existiendo");
    return { moved: { priorItems: a.move.priorItems.length, notes: a.move.notes.length, categories: a.move.categories.length }, removedClient: dropId };
  });
}
