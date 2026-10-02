/**
 * relocate-images-2026-10.mjs
 * Recoloca imágenes tras la caída del CDN de Manus (403) y la pérdida de archivos antiguos.
 *  - ebooks: portada y galería → imágenes fijas de /site/ (versionadas en el repo); pdfUrl muerto → NULL
 *  - afiliados: 6 productos con archivo perdido → imagen equivalente ya presente en la galería
 * Idempotente. Uso: node scripts/relocate-images-2026-10.mjs [--dry-run]
 */
import mysql2 from "mysql2/promise";
import { config } from "dotenv";
config();

const DRY = process.argv.includes("--dry-run");
const IMG = "/uploads/crm-uploads/images/";
const AFF = {
  16: "1775850882227-umh77g4f.png", // HSN Glicina en polvo
  28: "1775850890490-emejbq8i.png", // Sirope de coco Naturgreen
  50: "1775850903996-sa3f0q3s.png", // Stevia Samskara
  60: "1775850908170-9iqll2iw.jpg", // Azúcar de coco El Granero
  76: "1775850913419-ayfimrgj.png", // Miel bosque Miel de león
  81: "1775850916299-inj5pxg9.png", // Miel flores Miel de león
};
const EBOOKS = {
  agua: { cover: "/site/hero-agua.webp", gallery: ["/site/hero-agua.webp", "/site/hero-main.webp", "/site/hero-consultas.webp"] },
  aceites: { cover: "/site/hero-aceites.webp", gallery: ["/site/hero-aceites.webp", "/site/hero-main.webp", "/site/hero-masajes.webp"] },
};

const c = await mysql2.createConnection(process.env.DATABASE_URL);
const run = async (sql, params) => {
  if (DRY) return console.log("[dry-run]", sql, params);
  const [r] = await c.execute(sql, params);
  console.log("OK", r.affectedRows, "fila(s) —", sql.slice(0, 60), params);
};
try {
  for (const [slug, e] of Object.entries(EBOOKS)) {
    await run("UPDATE ebooks SET coverImage = ?, galleryImages = ?, pdfUrl = NULL WHERE slug = ?", [e.cover, JSON.stringify(e.gallery), slug]);
  }
  for (const [id, file] of Object.entries(AFF)) {
    await run("UPDATE affiliate_products SET imageUrl = ? WHERE id = ?", [IMG + file, Number(id)]);
  }
} finally {
  await c.end();
}
