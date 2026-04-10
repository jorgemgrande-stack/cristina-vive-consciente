/**
 * Gallery router — lista y elimina archivos subidos al disco local
 */
import fs from "fs";
import path from "path";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";

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
    return files;
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
      fs.unlinkSync(filePath);
      return { success: true };
    }),
});
