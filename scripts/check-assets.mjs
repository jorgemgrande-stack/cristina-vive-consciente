/**
 * check-assets.mjs — guarda anti-pérdida de imágenes.
 * Falla si el código fuente referencia imágenes/PDF alojados fuera de la app
 * (CDN de terceros que pueden desaparecer, como pasó con el CDN de Manus).
 *
 * Las imágenes fijas van en client/public/site/ (ver client/src/lib/siteImages.ts)
 * y las editables en /crm/galeria (volumen persistente /uploads).
 *
 * Uso: node scripts/check-assets.mjs   (se ejecuta dentro de `pnpm check`)
 */
import fs from "fs";
import path from "path";

const ROOTS = ["client/src", "client/index.html", "server"];
const EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".html", ".css"]);
const SKIP = [/ComponentShowcase.tsx$/, /\.test\.tsx?$/, /node_modules/];
const BANNED = /https?:\/\/[^\s"'`)]*(?:cloudfront\.net|manuscdn|\.(?:png|jpe?g|webp|avif|gif|svg|pdf)(?:\?[^\s"'`)]*)?)/gi;
// Dominios externos permitidos explícitamente (iconos de pago, etc.). Vacío a propósito.
const ALLOWED = ["cristinaviveconsciente.es", "example.com"];

function* walk(p) {
  if (!fs.existsSync(p)) return;
  const st = fs.statSync(p);
  if (st.isFile()) { yield p; return; }
  for (const e of fs.readdirSync(p)) yield* walk(path.join(p, e));
}

const problems = [];
for (const root of ROOTS) {
  for (const f of walk(root)) {
    if (!EXTS.has(path.extname(f)) || SKIP.some((r) => r.test(f))) continue;
    fs.readFileSync(f, "utf8").split("\n").forEach((line, i) => {
      for (const m of line.matchAll(BANNED)) {
        if (ALLOWED.some((a) => m[0].includes(a))) continue;
        problems.push(`${f}:${i + 1}  ${m[0].slice(0, 110)}`);
      }
    });
  }
}

if (problems.length) {
  console.error("✖ Referencias a imágenes/PDF externos (pueden desaparecer):\n  " + problems.join("\n  "));
  console.error("\nSolución: copia el archivo a client/public/site/ (fijas) o súbelo en /crm/galeria (editables).");
  process.exit(1);
}
console.log("✔ Sin referencias a imágenes/PDF externos.");
