/**
 * Gallery router — lista y elimina archivos subidos al disco local
 * Protege automáticamente los archivos que están referenciados en la BD.
 */
import fs from "fs";
import path from "path";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  affiliateProducts,
  services,
  ebooks,
  waterCategories,
  waterProducts,
  oilCategories,
  oilProducts,
  blogPosts,
  heroImages,
} from "../../drizzle/schema";

/**
 * Returns the set of all `/uploads/...` paths currently referenced in the DB.
 * These files must not be deleted from the gallery.
 */
async function getUsedUploadUrls(): Promise<Set<string>> {
  const db = await getDb();
  if (!db) return new Set();

  const normalize = (v: string | null | undefined): string | null => {
    if (!v) return null;
    // Accept both "/uploads/..." and full https:// URLs
    const match = v.match(/\/uploads\/.+/);
    return match ? match[0] : null;
  };

  const rows = await Promise.allSettled([
    db.select({ v: affiliateProducts.imageUrl }).from(affiliateProducts),
    db.select({ v: services.imageUrl }).from(services),
    db.select({ v: ebooks.coverImage }).from(ebooks),
    db.select({ v: waterCategories.imageUrl }).from(waterCategories),
    db.select({ v: waterProducts.mainImage, g: waterProducts.galleryImages }).from(waterProducts),
    db.select({ v: oilCategories.imageUrl }).from(oilCategories),
    db.select({ v: oilProducts.imagen }).from(oilProducts),
    db.select({ v: blogPosts.coverImage }).from(blogPosts),
    db.select({ v: heroImages.url }).from(heroImages),
  ]);

  const usedUrls = new Set<string>();
  for (const row of rows) {
    if (row.status === "fulfilled") {
      for (const r of row.value) {
        const rec = r as any;
        const n = normalize(rec.v);
        if (n) usedUrls.add(n);
        // Handle JSON array fields (e.g. waterProducts.galleryImages)
        if (rec.g) {
          try {
            const arr: string[] = JSON.parse(rec.g);
            for (const item of arr) {
              const ni = normalize(item);
              if (ni) usedUrls.add(ni);
            }
          } catch { /* ignore malformed JSON */ }
        }
      }
    }
  }
  return usedUrls;
}

/**
 * Recoge TODAS las URLs de imagen/archivo guardadas en BD con su origen (tabla.campo).
 * Sirve para el chequeo de integridad: detectar archivos referenciados que ya no existen
 * en disco y URLs externas (CDN de terceros) que pueden desaparecer.
 */
export async function collectImageRefs(): Promise<Map<string, string[]>> {
  const db = await getDb();
  const refs = new Map<string, string[]>();
  if (!db) return refs;

  const push = (src: string, v: unknown) => {
    if (typeof v !== "string" || !v) return;
    let items: unknown[] = [v];
    if (v.trim().startsWith("[")) {
      try { items = JSON.parse(v); } catch { /* ignore malformed JSON */ }
    }
    for (const it of items) {
      if (typeof it === "string" && (it.startsWith("/uploads/") || /^https?:\/\//.test(it))) {
        refs.set(it, [...(refs.get(it) ?? []), src]);
      }
    }
  };

  const jobs: Array<[string, Promise<any[]>]> = [
    ["afiliados", db.select({ a: affiliateProducts.imageUrl }).from(affiliateProducts)],
    ["servicios", db.select({ a: services.imageUrl, b: services.detailImage }).from(services)],
    ["ebooks", db.select({ a: ebooks.coverImage, b: ebooks.galleryImages, c: ebooks.pdfUrl }).from(ebooks)],
    ["agua-categorías", db.select({ a: waterCategories.imageUrl }).from(waterCategories)],
    ["agua-productos", db.select({ a: waterProducts.mainImage, b: waterProducts.galleryImages }).from(waterProducts)],
    ["aceites-categorías", db.select({ a: oilCategories.imageUrl }).from(oilCategories)],
    ["aceites-productos", db.select({ a: oilProducts.imagen }).from(oilProducts)],
    ["blog", db.select({ a: blogPosts.coverImage }).from(blogPosts)],
    ["hero-home", db.select({ a: heroImages.url }).from(heroImages)],
  ];
  for (const [src, job] of jobs) {
    try {
      for (const row of await job) for (const v of Object.values(row)) push(src, v);
    } catch { /* tabla no disponible: se ignora */ }
  }
  return refs;
}

function getUploadDir(): string {
  return process.env.UPLOAD_DIR
    ? path.resolve(process.env.UPLOAD_DIR)
    : path.resolve(import.meta.dirname, "..", "..", "uploads");
}

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".svg"]);

function walkDir(dir: string, baseDir: string): Array<{
  url: string;
  filename: string;
  key: string;
  size: number;
  createdAt: string;
  type: "image" | "file";
}> {
  if (!fs.existsSync(dir)) return [];
  const results: ReturnType<typeof walkDir> = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath, baseDir));
    } else if (entry.isFile()) {
      const stat = fs.statSync(fullPath);
      const relKey = path.relative(baseDir, fullPath).replace(/\\/g, "/");
      const ext = path.extname(entry.name).toLowerCase();
      results.push({
        url: `/uploads/${relKey}`,
        filename: entry.name,
        key: relKey,
        size: stat.size,
        createdAt: stat.birthtime.toISOString(),
        type: IMAGE_EXTS.has(ext) ? "image" : "file",
      });
    }
  }
  return results;
}

export const galleryRouter = router({
  list: protectedProcedure.query(async () => {
    const uploadDir = getUploadDir();
    const files = walkDir(uploadDir, uploadDir);
    // Most recent first
    files.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const usedUrls = await getUsedUploadUrls();
    return files.map((f) => ({
      ...f,
      inUse: usedUrls.has(f.url),
    }));
  }),

  /**
   * Chequeo de integridad: imágenes/PDF referenciados en la BD que ya no existen en disco
   * y URLs externas que pueden desaparecer. Se muestra como aviso en /crm/galeria.
   */
  integrity: protectedProcedure.query(async () => {
    const uploadDir = getUploadDir();
    const refs = await collectImageRefs();
    const missing: Array<{ url: string; usedBy: string[] }> = [];
    const external: Array<{ url: string; usedBy: string[] }> = [];
    for (const [url, usedBy] of Array.from(refs.entries())) {
      const uniq = Array.from(new Set(usedBy));
      if (url.startsWith("/uploads/")) {
        const file = path.join(uploadDir, url.replace(/^\/uploads\//, ""));
        if (!file.startsWith(uploadDir) || !fs.existsSync(file)) missing.push({ url, usedBy: uniq });
      } else {
        external.push({ url, usedBy: uniq });
      }
    }
    return { total: refs.size, missing, external };
  }),

  delete: protectedProcedure
    .input(z.object({ key: z.string() }))
    .mutation(async ({ input }) => {
      // Safety: prevent path traversal
      const clean = path.normalize(input.key).replace(/^(\.\.(\/|\\|$))+/, "");
      const uploadDir = getUploadDir();
      const filePath = path.join(uploadDir, clean);

      // Must be inside uploadDir
      if (!filePath.startsWith(uploadDir + path.sep) && filePath !== uploadDir) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Ruta no permitida" });
      }
      if (!fs.existsSync(filePath)) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Archivo no encontrado" });
      }

      // Block deletion of images referenced in the DB
      const fileUrl = `/uploads/${clean.replace(/\\/g, "/")}`;
      const usedUrls = await getUsedUploadUrls();
      if (usedUrls.has(fileUrl)) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Este archivo está siendo usado en la web y no puede eliminarse.",
        });
      }

      fs.unlinkSync(filePath);
      return { success: true };
    }),
});
