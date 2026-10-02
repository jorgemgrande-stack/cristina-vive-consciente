import multer from "multer";
import { Router } from "express";
import fs from "fs";
import path from "path";
import zlib from "zlib";
import { storagePut, getUploadDir } from "./storage";
import { sdk } from "./_core/sdk";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`));
    }
  },
});

function randomSuffix() {
  return Math.random().toString(36).slice(2, 10);
}

export const uploadRouter = Router();

// POST /api/upload — sube un archivo al S3 y devuelve la URL pública
uploadRouter.post(
  "/",
  async (req, res, next) => {
    // Verificar autenticación (solo admins)
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user || user.role !== "admin") {
        res.status(401).json({ error: "No autorizado" });
        return;
      }
      next();
    } catch {
      res.status(401).json({ error: "No autorizado" });
    }
  },
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No se recibió ningún archivo" });
        return;
      }

      const { originalname, mimetype, buffer } = req.file;
      const ext = originalname.split(".").pop() ?? "bin";
      const folder = mimetype.startsWith("image/") ? "images" : "files";
      const key = `crm-uploads/${folder}/${Date.now()}-${randomSuffix()}.${ext}`;

      const { url } = await storagePut(key, buffer, mimetype);

      res.json({ url, key, name: originalname, size: buffer.length, mimetype });
    } catch (err) {
      console.error("[Upload] Error:", err);
      res.status(500).json({ error: "Error al subir el archivo" });
    }
  }
);

// ── Copia de seguridad ───────────────────────────────────────────────────────
// GET /api/upload/backup — descarga todo /uploads como .tar.gz (solo admin).
// Los archivos viven en un volumen de Railway: descargar una copia periódica
// (p. ej. una vez al mes y antes de tocar la infraestructura) evita perderlos.
function tarHeader(name: string, size: number, mtime: number): Buffer {
  const h = Buffer.alloc(512);
  h.write(name.slice(0, 100), 0, "utf8");
  h.write("0000644\0", 100);
  h.write("0000000\0", 108);
  h.write("0000000\0", 116);
  h.write(size.toString(8).padStart(11, "0") + "\0", 124);
  h.write(Math.floor(mtime / 1000).toString(8).padStart(11, "0") + "\0", 136);
  h.write("        ", 148); // checksum provisional (8 espacios)
  h.write("0", 156);
  h.write("ustar\0" + "00", 257);
  let sum = 0;
  for (let i = 0; i < h.length; i++) sum += h[i];
  h.write(sum.toString(8).padStart(6, "0") + "\0 ", 148);
  return h;
}

function listFiles(dir: string): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listFiles(full));
    else if (e.isFile()) out.push(full);
  }
  return out;
}

uploadRouter.get("/backup", async (req, res) => {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user || user.role !== "admin") {
      res.status(401).json({ error: "No autorizado" });
      return;
    }
  } catch {
    res.status(401).json({ error: "No autorizado" });
    return;
  }

  const base = getUploadDir();
  if (!fs.existsSync(base)) {
    res.status(404).json({ error: "No hay archivos que respaldar" });
    return;
  }
  const stamp = new Date().toISOString().slice(0, 10);
  res.setHeader("Content-Type", "application/gzip");
  res.setHeader("Content-Disposition", `attachment; filename="uploads-backup-${stamp}.tar.gz"`);

  const gz = zlib.createGzip();
  gz.pipe(res);
  const write = (b: Buffer) => new Promise<void>((ok) => (gz.write(b) ? ok() : gz.once("drain", ok)));
  try {
    for (const file of listFiles(base)) {
      const st = fs.statSync(file);
      const rel = path.relative(base, file).replace(/\\/g, "/");
      await write(tarHeader(rel, st.size, st.mtimeMs));
      await write(fs.readFileSync(file));
      const pad = (512 - (st.size % 512)) % 512;
      if (pad) await write(Buffer.alloc(pad));
    }
    await write(Buffer.alloc(1024));
  } catch (err) {
    console.error("[Backup] Error:", err);
  } finally {
    gz.end();
  }
});
