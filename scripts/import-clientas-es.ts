/**
 * Importa CLIENTAS-ES al CRM (categorías, notas e historial informativo).
 *   npx tsx scripts/import-clientas-es.ts <archivo.json> --dry-run   → cruce en seco, no escribe nada
 *   npx tsx scripts/import-clientas-es.ts <archivo.json> --apply     → escribe solo los casos claros
 * Usa DATABASE_URL. Repetible: no duplica fichas, categorías, notas ni historial.
 * La salida solo lleva filas de origen y motivos (sin nombres, emails ni teléfonos).
 */
import fs from "node:fs";
import { config } from "dotenv";
config();

const file = process.argv[2];
const apply = process.argv.includes("--apply");
if (!file || (!apply && !process.argv.includes("--dry-run"))) {
  console.error("Uso: import-clientas-es.ts <archivo.json> --dry-run | --apply");
  process.exit(1);
}
const { planImport, loadExisting, applyPlan } = await import("../server/clientImport");
const data = JSON.parse(fs.readFileSync(file, "utf8"));
const existing = await loadExisting();
const plan = planImport(data, existing);
const by = (a: string) => plan.filter((p) => p.action === a);
const rows = (l: typeof plan) => l.map((p) => p.rows.join("+")).join(", ");
const upd = plan.filter((p) => p.action === "update") as Extract<(typeof plan)[number], { action: "update" }>[];

console.log(`CRM: ${existing.length} fichas · archivo: ${data.records.length} filas → ${plan.length} personas`);
console.log(`\nALTAS (${by("create").length}): filas ${rows(by("create"))}`);
console.log(`\nCOINCIDEN CON UNA FICHA (${upd.length}) — con cambios: ${upd.filter((u) => u.changed).length}, sin cambios: ${upd.filter((u) => !u.changed).length}`);
for (const u of upd) console.log(`  fila ${u.rows.join("+")} ↔ ficha #${u.clientId} por ${u.matchedBy}` + (u.changed ? ` · añade: ${[u.add.categories.length && `categorías ${u.add.categories.join("/")}`, u.add.notes.length && `${u.add.notes.length} nota(s)`, u.add.prior.length && `${u.add.prior.length} historial`, u.add.fields.length && `campos ${u.add.fields.join("/")}`].filter(Boolean).join("; ")}` : " · sin cambios") + (u.warnings.length ? ` · AVISO: ${u.warnings.join("; ")}` : ""));
console.log(`\nPENDIENTES (${by("pending").length}):`);
for (const p of by("pending") as Extract<(typeof plan)[number], { action: "pending" }>[]) console.log(`  fila ${p.rows.join("+")}: ${p.reason}${p.candidates ? ` (fichas ${p.candidates.join(", ")})` : ""}`);
const warn = plan.filter((p) => p.action !== "update" && p.warnings.length);
if (warn.length) { console.log("\nAVISOS:"); for (const w of warn) console.log(`  filas ${w.rows.join("+")}: ${w.warnings.join("; ")}`); }
const totals = {
  notas: plan.filter((p) => p.action !== "pending").reduce((n, p) => n + p.notes.length, 0),
  historial: plan.filter((p) => p.action !== "pending").reduce((n, p) => n + p.prior.length, 0),
};
console.log(`\nPrevisto (casos claros): ${totals.notas} notas y ${totals.historial} elementos de historial en total (las ya existentes no se repiten).`);

if (apply) {
  const dir = process.argv.includes("--backup-dir") ? process.argv[process.argv.indexOf("--backup-dir") + 1] : null;
  if (dir) {
    const touched = upd.filter((u) => u.changed).map((u) => existing.find((c) => c.id === u.clientId)!);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(`${dir}/fichas-antes-de-importar.json`, JSON.stringify(touched, null, 2));
    console.log(`Copia previa de ${touched.length} fichas en ${dir}`);
  }
  const rep = await applyPlan(plan);
  console.log("\nIMPORTADO:", JSON.stringify({ altas: rep.created, fichasActualizadas: rep.updated, fichasSinCambios: rep.unchanged, notasAñadidas: rep.notesAdded, historialAñadido: rep.priorAdded, categoríasAñadidas: rep.categoriesAdded, pendientes: rep.pending.length }));
}
process.exit(0);
