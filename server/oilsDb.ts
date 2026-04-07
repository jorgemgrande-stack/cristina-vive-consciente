/**
 * oilsDb.ts — Helpers de base de datos para el módulo Aceites Esenciales
 * Cristina Vive Consciente
 */

import { eq, and, desc, asc } from "drizzle-orm";
import { getDb } from "./db";
import {
  oilCategories,
  oilProducts,
  oilConsultations,
  type InsertOilCategory,
  type InsertOilProduct,
  type InsertOilConsultation,
} from "../drizzle/schema";

// ─── CATEGORÍAS ───────────────────────────────────────────────────────────────

export async function listOilCategories(onlyActive = false) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const query = db.select().from(oilCategories).orderBy(asc(oilCategories.sortOrder), asc(oilCategories.name));
  if (onlyActive) {
    return query.where(eq(oilCategories.status, "active"));
  }
  return query;
}

export async function getOilCategoryById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db.select().from(oilCategories).where(eq(oilCategories.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createOilCategory(data: InsertOilCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(oilCategories).values(data);
  return (result[0] as { insertId: number }).insertId;
}

export async function updateOilCategory(id: number, data: Partial<InsertOilCategory>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(oilCategories).set({ ...data, updatedAt: new Date() }).where(eq(oilCategories.id, id));
}

export async function deleteOilCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(oilCategories).where(eq(oilCategories.id, id));
}

// ─── PRODUCTOS ────────────────────────────────────────────────────────────────

export async function listOilProducts(opts: {
  onlyVisible?: boolean;
  category?: string;
  tipoProducto?: string;
  tag?: string;
  onlyDestacados?: boolean;
  search?: string;
} = {}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let rows = await db
    .select()
    .from(oilProducts)
    .orderBy(asc(oilProducts.sortOrder), asc(oilProducts.name));

  if (opts.onlyVisible) rows = rows.filter((r) => r.visibleEnPublico === 1 && r.status === "active");
  if (opts.category) rows = rows.filter((r) => r.category === opts.category);
  if (opts.tipoProducto) rows = rows.filter((r) => r.tipoProducto === opts.tipoProducto);
  if (opts.onlyDestacados) rows = rows.filter((r) => r.destacado === 1);
  if (opts.tag) {
    rows = rows.filter((r) => {
      try {
        const tags: string[] = JSON.parse(r.tags ?? "[]");
        return tags.some((t) => t.toLowerCase().includes(opts.tag!.toLowerCase()));
      } catch {
        return false;
      }
    });
  }
  if (opts.search) {
    const q = opts.search.toLowerCase();
    rows = rows.filter((r) => r.name.toLowerCase().includes(q));
  }

  return rows;
}

export async function getOilProductById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db.select().from(oilProducts).where(eq(oilProducts.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getOilProductBySlug(slug: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db.select().from(oilProducts).where(eq(oilProducts.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export async function createOilProduct(data: InsertOilProduct) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(oilProducts).values(data);
  return (result[0] as { insertId: number }).insertId;
}

export async function updateOilProduct(id: number, data: Partial<InsertOilProduct>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(oilProducts).set({ ...data, updatedAt: new Date() }).where(eq(oilProducts.id, id));
}

export async function deleteOilProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(oilProducts).where(eq(oilProducts.id, id));
}

/**
 * Intercambia el sortOrder de dos productos para reordenarlos.
 * idA sube (se mueve hacia arriba) y idB baja.
 */
export async function reorderOilProducts(idA: number, sortA: number, idB: number, sortB: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Intercambiar los sortOrder de los dos productos
  await db.update(oilProducts).set({ sortOrder: sortB, updatedAt: new Date() }).where(eq(oilProducts.id, idA));
  await db.update(oilProducts).set({ sortOrder: sortA, updatedAt: new Date() }).where(eq(oilProducts.id, idB));
}

// ─── CONSULTAS ────────────────────────────────────────────────────────────────

export async function createOilConsultation(data: InsertOilConsultation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(oilConsultations).values(data);
  return (result[0] as { insertId: number }).insertId;
}

export async function listOilConsultations(limit = 100) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(oilConsultations).orderBy(desc(oilConsultations.createdAt)).limit(limit);
}

export async function updateOilConsultation(id: number, data: Partial<InsertOilConsultation>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(oilConsultations).set({ ...data, updatedAt: new Date() }).where(eq(oilConsultations.id, id));
}
