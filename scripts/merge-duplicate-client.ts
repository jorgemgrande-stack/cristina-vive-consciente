/**
 * Unifica una ficha duplicada con la que se conserva (historial importado, notas y categorías).
 *   npx tsx scripts/merge-duplicate-client.ts <fichaQueSeConserva> <fichaDuplicada> --dry-run
 *   npx tsx scripts/merge-duplicate-client.ts <conserva> <duplicada> --apply [--backup-dir <carpeta>]
 * Se detiene sin escribir si la duplicada tiene vínculos en otras tablas o los datos se contradicen.
 * La salida no muestra datos personales.
 */
import fs from "node:fs";
import { config } from "dotenv";
config();

const keepId = Number(process.argv[2]);
const dropId = Number(process.argv[3]);
const apply = process.argv.includes("--apply");
if (!keepId || !dropId || (!apply && !process.argv.includes("--dry-run"))) {
  console.error("Uso: merge-duplicate-client.ts <conserva> <duplicada> --dry-run | --apply [--backup-dir <carpeta>]");
  process.exit(1);
}
const { analyzeMerge, applyMerge } = await import("../server/mergeClients");
const a = await analyzeMerge(keepId, dropId);
console.log(`Conserva #${a.keepId} · retira #${a.dropId}`);
console.log("Filas de la duplicada por tabla:", JSON.stringify(a.dropRefs));
console.log("Vínculos no trasladables (bloquean):", JSON.stringify(a.unexpectedRefs));
console.log("Datos contradictorios (bloquean):", a.conflicts.length ? a.conflicts.map((c) => c.field).join(", ") : "ninguno");
console.log("Campos con valor solo en la duplicada (bloquean: que Cristina decida qué conservar):", a.onlyInDrop.length ? a.onlyInDrop.join(", ") : "ninguno");
console.log("Se trasladaría:", JSON.stringify(a.move), "· ya existían en la que se conserva:", JSON.stringify(a.skipped));
console.log(a.ok ? "→ Todo coincide: se puede unificar." : "→ NO se puede unificar: revisar antes.");
if (apply) {
  if (!a.ok) process.exit(2);
  const dir = process.argv.includes("--backup-dir") ? process.argv[process.argv.indexOf("--backup-dir") + 1] : null;
  const res = await applyMerge(keepId, dropId, (snapshot) => {
    if (dir) {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(`${dir}/ficha-${dropId}-antes-de-unificar.json`, JSON.stringify(snapshot, null, 2));
      console.log(`Copia previa de la ficha #${dropId} en ${dir}`);
    }
  });
  console.log("UNIFICADO:", JSON.stringify(res));
}
process.exit(0);
