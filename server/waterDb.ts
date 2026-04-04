/**
 * waterDb.ts — Helpers de base de datos para el módulo Sistemas de Agua
 * Cristina Vive Consciente
 */

import { eq, desc, asc, and, like, or } from "drizzle-orm";
import { getDb } from "./db";
import {
  waterCategories,
  waterProducts,
  waterInquiries,
  type InsertWaterCategory,
  type InsertWaterProduct,
  type InsertWaterInquiry,
} from "../drizzle/schema";

// ─── CATEGORÍAS ───────────────────────────────────────────────────────────────

export async function listWaterCategories(onlyVisible = false) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const query = db
    .select()
    .from(waterCategories)
    .orderBy(asc(waterCategories.sortOrder), asc(waterCategories.name));
  if (onlyVisible) {
    return query.where(
      and(
        eq(waterCategories.visibleEnPublico, 1),
        eq(waterCategories.status, "active")
      )
    );
  }
  return query;
}

export async function getWaterCategoryById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db
    .select()
    .from(waterCategories)
    .where(eq(waterCategories.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function getWaterCategoryBySlug(slug: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db
    .select()
    .from(waterCategories)
    .where(eq(waterCategories.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}

export async function createWaterCategory(data: InsertWaterCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(waterCategories).values(data);
  return result[0].insertId as number;
}

export async function updateWaterCategory(id: number, data: Partial<InsertWaterCategory>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(waterCategories).set(data).where(eq(waterCategories.id, id));
}

export async function deleteWaterCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(waterCategories).where(eq(waterCategories.id, id));
}

// ─── PRODUCTOS ────────────────────────────────────────────────────────────────

export async function listWaterProducts(opts?: {
  onlyVisible?: boolean;
  categoryId?: number;
  onlyDestacados?: boolean;
  search?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [];

  if (opts?.onlyVisible) {
    conditions.push(eq(waterProducts.visibleEnPublico, 1));
    conditions.push(eq(waterProducts.status, "active"));
  }
  if (opts?.categoryId) {
    conditions.push(eq(waterProducts.categoryId, opts.categoryId));
  }
  if (opts?.onlyDestacados) {
    conditions.push(eq(waterProducts.destacadoEnHome, 1));
  }

  const query = db
    .select()
    .from(waterProducts)
    .orderBy(asc(waterProducts.sortOrder), asc(waterProducts.title));

  if (conditions.length > 0) {
    return query.where(and(...conditions));
  }
  return query;
}

export async function getWaterProductById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db
    .select()
    .from(waterProducts)
    .where(eq(waterProducts.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function getWaterProductBySlug(slug: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db
    .select()
    .from(waterProducts)
    .where(and(eq(waterProducts.slug, slug), eq(waterProducts.status, "active")))
    .limit(1);
  return rows[0] ?? null;
}

export async function createWaterProduct(data: InsertWaterProduct) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(waterProducts).values(data);
  return result[0].insertId as number;
}

export async function updateWaterProduct(id: number, data: Partial<InsertWaterProduct>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(waterProducts).set(data).where(eq(waterProducts.id, id));
}

export async function deleteWaterProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(waterProducts).where(eq(waterProducts.id, id));
}

export async function duplicateWaterProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const original = await getWaterProductById(id);
  if (!original) throw new Error("Producto no encontrado");

  const { id: _id, createdAt, updatedAt, ...rest } = original;
  const newSlug = `${rest.slug}-copia-${Date.now()}`;
  const newTitle = `${rest.title} (Copia)`;

  const result = await db.insert(waterProducts).values({
    ...rest,
    title: newTitle,
    slug: newSlug,
    status: "inactive",
    visibleEnPublico: 0,
  });
  return result[0].insertId as number;
}

// ─── SOLICITUDES DE RESERVA ───────────────────────────────────────────────────

export async function createWaterInquiry(data: InsertWaterInquiry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(waterInquiries).values(data);
  return result[0].insertId as number;
}

export async function listWaterInquiries(limit = 100) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(waterInquiries)
    .orderBy(desc(waterInquiries.createdAt))
    .limit(limit);
}

export async function updateWaterInquiry(id: number, data: Partial<InsertWaterInquiry>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(waterInquiries).set(data).where(eq(waterInquiries.id, id));
}
