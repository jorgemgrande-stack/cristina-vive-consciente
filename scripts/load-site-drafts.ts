/**
 * Carga inicial de la web actual en los borradores del editor «Editar web».
 *   npx tsx scripts/load-site-drafts.ts --dry-run                  (solo informa)
 *   npx tsx scripts/load-site-drafts.ts --backup-dir <carpeta>     (carga; guarda copia de cada borrador que cambie)
 * Usa DATABASE_URL. NO publica nada ni cambia lo que ven los visitantes. Repetible: no duplica ni pisa ediciones.
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { loadInitialDrafts } from "../server/siteSeedRun";

const dryRun = process.argv.includes("--dry-run");
const bi = process.argv.indexOf("--backup-dir");
const backupDir = bi > 0 ? path.resolve(process.argv[bi + 1]) : null;
if (!dryRun && !backupDir) throw new Error("Indica --backup-dir <carpeta> (o --dry-run).");
if (backupDir) fs.mkdirSync(backupDir, { recursive: true });

const url = process.env.DATABASE_URL ?? "";
console.log(`Base de datos: ${url.replace(/^[a-z]+:\/\/[^@]*@/, "***@").replace(/\?.*$/, "")}${dryRun ? " (simulacro: no se escribe nada)" : ""}`);

const results = await loadInitialDrafts({
  dryRun,
  backup: (doc) => {
    const file = path.join(backupDir!, `${doc.id}-${doc.docKey.replace(/[^a-z0-9]+/gi, "_")}.json`);
    fs.writeFileSync(file, JSON.stringify(doc, null, 2), "utf8");
    console.log(`  copia → ${file}`);
  },
});
for (const r of results) console.log(`${r.action.padEnd(18)} ${r.docKey.padEnd(34)} ejemplos retirados=${r.removedExamples} añadidos=${r.added.length} conservados=${r.kept}${r.backedUp ? " (copia guardada)" : ""}`);
console.log(`Total: ${results.length} documentos · cargados/completados: ${results.filter((r) => r.action !== "unchanged").length}`);
process.exit(0);
