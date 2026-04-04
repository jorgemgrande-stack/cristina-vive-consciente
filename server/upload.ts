import multer from "multer";
import { Router } from "express";
import { storagePut } from "./storage";
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
