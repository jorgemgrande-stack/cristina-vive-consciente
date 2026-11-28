/**
 * PASO APARTE, pendiente de la confirmación de Cristina: enlaza la ficha del catálogo «Guía digital de aceites
 * esenciales» con el ebook «aceites» (la ficha pasa a mostrar su precio y a llevar a su compra).
 * Antes de ejecutarlo, Cristina debe confirmar que es el mismo PDF y si la compra incluye el soporte grupal que
 * menciona la ficha (la descripción del ebook no lo dice).
 * Repetible. Uso: DATABASE_URL=… npx tsx scripts/aceites-enlazar-guia.ts --dry-run
 *                 DATABASE_URL=… npx tsx scripts/aceites-enlazar-guia.ts --confirmado-por-cristina
 */
import mysql from "mysql2/promise";
import { config } from "dotenv";
import { oilLink } from "../shared/oilLinks";

config();
const dry = process.argv.includes("--dry-run");
const confirmed = process.argv.includes("--confirmado-por-cristina");
if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL.");
if (!dry && !confirmed) throw new Error("Falta la confirmación de Cristina: usa --dry-run para ver el cambio, o --confirmado-por-cristina cuando ella lo confirme.");
const conn = await mysql.createConnection(process.env.DATABASE_URL);
const q = async (sql: string, p: unknown[] = []) => (await conn.query(sql, p))[0] as any;
try {
  console.log(`Base de datos: ${(await q("SELECT DATABASE() AS db"))[0].db}${dry ? " (dry-run)" : ""}`);
  const [ebook] = await q("SELECT priceCents, status, pdfUrl, description FROM ebooks WHERE slug = 'aceites'");
  if (!ebook) throw new Error("No existe el ebook «aceites»: no se enlaza nada.");
  const [guide] = await q("SELECT id, tags, descripcion FROM oil_products WHERE slug = 'guia-digital-aceites-esenciales'");
  if (!guide) throw new Error("No existe la ficha «Guía digital de aceites esenciales».");
  console.log(`Ebook «aceites»: ${ebook.priceCents / 100} €, ${ebook.status}, ${ebook.pdfUrl ? "con" : "SIN"} PDF.\n  ${ebook.description ?? "(sin descripción)"}`);
  console.log(`Ficha del catálogo (#${guide.id}):\n  ${guide.descripcion ?? "(sin descripción)"}`);
  if (oilLink(guide.tags)) console.log("La ficha ya está enlazada: nada que hacer.");
  else {
    console.log(`Se añade la etiqueta ebook:aceites a la ficha${dry ? " (no se escribe)" : ""}.`);
    if (!dry) await q("UPDATE oil_products SET tags = ? WHERE id = ?", [JSON.stringify([...JSON.parse(guide.tags || "[]"), "ebook:aceites"]), guide.id]);
  }
} finally {
  await conn.end();
}
process.exit(0);
