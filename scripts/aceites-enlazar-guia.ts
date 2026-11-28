/**
 * PASO APARTE: enlaza la ficha del catálogo «Guía digital de aceites esenciales» con el ebook «aceites» y retira de su
 * descripción la promesa de soporte grupal. Los dos cambios se escriben a la vez, o ninguno.
 * Cristina ha confirmado que es el mismo PDF, que la compra suelta no incluye soporte grupal y que se entrega sin coste
 * adicional con el asesoramiento de aromaterapia. La bandera de confirmación se usa cuando se autorice publicar.
 * Repetible. Uso: DATABASE_URL=… npx tsx scripts/aceites-enlazar-guia.ts --dry-run
 *                 DATABASE_URL=… npx tsx scripts/aceites-enlazar-guia.ts --confirmado-por-cristina
 */
import mysql from "mysql2/promise";
import { config } from "dotenv";
import { removeGroupSupport } from "../shared/oilGuide";
import { oilLink } from "../shared/oilLinks";

config();
const dry = process.argv.includes("--dry-run");
const confirmed = process.argv.includes("--confirmado-por-cristina");
if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL.");
if (!dry && !confirmed) throw new Error("Falta la confirmación: usa --dry-run para ver el cambio, o --confirmado-por-cristina cuando se autorice publicar.");
const conn = await mysql.createConnection(process.env.DATABASE_URL);
const q = async (sql: string, p: unknown[] = []) => (await conn.query(sql, p))[0] as any;
try {
  console.log(`Base de datos: ${(await q("SELECT DATABASE() AS db"))[0].db}${dry ? " (dry-run)" : ""}`);
  const [ebook] = await q("SELECT priceCents, status, pdfUrl FROM ebooks WHERE slug = 'aceites'");
  if (!ebook) throw new Error("No existe el ebook «aceites»: no se enlaza nada.");
  const [guide] = await q("SELECT id, tags, descripcion FROM oil_products WHERE slug = 'guia-digital-aceites-esenciales'");
  if (!guide) throw new Error("No existe la ficha «Guía digital de aceites esenciales».");
  console.log(`Ebook «aceites»: ${ebook.priceCents / 100} €, ${ebook.status}, ${ebook.pdfUrl ? "con" : "SIN"} PDF (no se modifica).`);

  const link = oilLink(guide.tags);
  if (link && !(link.kind === "ebook" && link.ref === "aceites")) throw new Error(`La ficha ya remite a «${link.kind}:${link.ref}»: revísala en CRM → Aceites.`);
  const before: string = guide.descripcion ?? "";
  const after = removeGroupSupport(before);
  const tags = link ? guide.tags : JSON.stringify([...JSON.parse(guide.tags || "[]"), "ebook:aceites"]);

  console.log(`Ficha #${guide.id} · enlace: ${link ? "ya enlazada" : "se añade la etiqueta ebook:aceites"}.`);
  if (after === before) console.log(`Ficha #${guide.id} · descripción: ya no menciona el soporte grupal.`);
  else console.log(`Ficha #${guide.id} · descripción:\n  antes:   ${before}\n  después: ${after}`);

  if (link && after === before) console.log("Nada que hacer.");
  else if (dry) console.log("Simulación: no se escribe nada.");
  else {
    // Un solo UPDATE (ambos cambios o ninguno), y solo si nadie ha tocado la ficha entretanto
    const r = await q("UPDATE oil_products SET tags = ?, descripcion = ? WHERE id = ? AND tags <=> ? AND descripcion <=> ?", [tags, after, guide.id, guide.tags, guide.descripcion]);
    if (!r.affectedRows) throw new Error("La ficha cambió mientras tanto: vuelve a ejecutar.");
    console.log("Aplicado.");
  }
} finally {
  await conn.end();
}
process.exit(0);
