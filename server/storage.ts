// Disk-based storage — saves uploaded files to UPLOAD_DIR (default: <project>/uploads)
// In Railway: set UPLOAD_DIR=/app/uploads and mount a Volume at that path for persistence.

import fs from "fs";
import path from "path";

function getUploadDir(): string {
  if (process.env.UPLOAD_DIR) {
    return path.resolve(process.env.UPLOAD_DIR);
  }
  // Dev fallback: <project_root>/uploads (two levels up from dist/index.js or server/storage.ts)
  return path.resolve(import.meta.dirname, "..", "..", "uploads");
}

export function getPublicUploadBase(): string {
  return "/uploads";
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  _contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = relKey.replace(/^\/+/, "");
  const uploadDir = getUploadDir();
  const filePath = path.join(uploadDir, key);

  // Ensure target directory exists
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  // Write file to disk
  fs.writeFileSync(filePath, data as Buffer);

  const url = `/uploads/${key}`;
  return { key, url };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = relKey.replace(/^\/+/, "");
  return { key, url: `/uploads/${key}` };
}
