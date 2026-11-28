/**
 * Ajustes tras la revisión de Cristina. Repetible. No publica páginas ni cambia direcciones, precios o etiquetas.
 *  1. Ficha del pack: nombre y descripción.
 *  2. Ficha «Guía digital»: frase con enlace a Pedidos.
 *  3. CRM → Servicios (asesoramiento): plazo contado desde la confirmación de la selección.
 *  4. Borrador del editor de Aceites: el mismo plazo.
 * Uso (DESPUÉS del despliegue): DATABASE_URL=… npx tsx scripts/aceites-revision-cristina.ts [--dry-run]
 */
import mysql from "mysql2/promise";
import { config } from "dotenv";
import { PACK_DESCRIPTION, PACK_NAME, PACK_OLD_DESCRIPTION, PACK_OLD_NAME, alignDelivery, linkGuideToOrders } from "../shared/aceitesRevision";
import { AROMA_SERVICE_SLUG } from "../shared/aromaService";
import { normalizePageContent } from "../server/siteContent";

config();
const dry = process.argv.includes("--dry-run");
if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL.");
const conn = await mysql.createConnection(process.env.DATABASE_URL);
const q = async (sql: string, p: unknown[] = []) => (await conn.query(sql, p))[0] as any;
const write = async (sql: string, p: unknown[]) => {
  if (dry) return;
  const r = await q(sql, p);
  if (!r.affectedRows) throw new Error("El registro cambió mientras tanto: vuelve a ejecutar.");
};
const change = (what: string, before: string, after: string) => console.log(`${what}${dry ? " (no se escribe)" : ""}\n  antes:   ${before}\n  después: ${after}`);
try {
  console.log(`Base de datos: ${(await q("SELECT DATABASE() AS db"))[0].db}${dry ? " (dry-run)" : ""}`);

  // ── 1. Pack ──
  const [pack] = await q("SELECT id, name, descripcion FROM oil_products WHERE slug = 'pack-asesoramiento-aromaterapia-guia'");
  if (!pack) throw new Error("No existe la ficha del pack.");
  for (const [col, before, old, next] of [["name", pack.name, PACK_OLD_NAME, PACK_NAME], ["descripcion", pack.descripcion, PACK_OLD_DESCRIPTION, PACK_DESCRIPTION]] as const) {
    if (before === next) console.log(`Pack #${pack.id} · ${col}: ya está al día.`);
    else if (before !== old) console.log(`Pack #${pack.id} · ${col}: editado a mano, se respeta («${before}»).`);
    else {
      change(`Pack #${pack.id} · ${col}`, before, next);
      await write(`UPDATE oil_products SET ${col} = ? WHERE id = ? AND ${col} = ?`, [next, pack.id, before]);
    }
  }

  // ── 2. Guía ──
  const [guide] = await q("SELECT id, descripcion FROM oil_products WHERE slug = 'guia-digital-aceites-esenciales'");
  if (!guide) throw new Error("No existe la ficha «Guía digital de aceites esenciales».");
  const linked = linkGuideToOrders(guide.descripcion ?? "");
  if (linked === guide.descripcion) console.log(`Guía #${guide.id}: ya está al día.`);
  else {
    change(`Guía #${guide.id} · descripción`, guide.descripcion, linked);
    await write("UPDATE oil_products SET descripcion = ? WHERE id = ? AND descripcion = ?", [linked, guide.id, guide.descripcion]);
  }

  // ── 3. Servicio ──
  const [service] = await q("SELECT id, longDescription FROM services WHERE slug = ?", [AROMA_SERVICE_SLUG]);
  if (!service) throw new Error("No existe el servicio del asesoramiento.");
  const long = alignDelivery(service.longDescription ?? "");
  if (long === null) console.log(`Servicio #${service.id}: texto editado a mano; revisa el plazo en CRM → Servicios.`);
  else if (long === service.longDescription) console.log(`Servicio #${service.id}: ya está al día.`);
  else {
    change(`Servicio #${service.id} · descripción larga (solo la frase del plazo)`, "Una vez realizada tu selección, recibirás…", "Recibirás… en un plazo máximo de 10 días desde que me confirmes tu selección…");
    await write("UPDATE services SET longDescription = ? WHERE id = ? AND longDescription = ?", [long, service.id, service.longDescription]);
  }

  // ── 4. Borrador del editor ──
  const [doc] = await q("SELECT id, draftJson FROM site_documents WHERE docKey = '/aceites-esenciales'");
  const json = doc ? JSON.parse(doc.draftJson) : null;
  const block = json?.blocks.find((b: any) => b.id === "ac-asesoramiento");
  if (!block) console.log("Borrador: sin bloque de asesoramiento guardado; se ve el de serie.");
  else {
    const how = alignDelivery(String(block.data.howText ?? ""));
    if (how === null) console.log("Borrador: texto editado a mano; revisa el plazo en el editor.");
    else if (how === block.data.howText) console.log("Borrador: ya está al día.");
    else {
      console.log(`Borrador: se actualiza el plazo del bloque de asesoramiento.${dry ? " (no se escribe)" : ""}`);
      block.data.howText = how;
      await write("UPDATE site_documents SET draftJson = ?, draftUpdatedAt = NOW() WHERE id = ? AND draftJson = ?", [JSON.stringify(normalizePageContent(json)), doc.id, doc.draftJson]);
    }
  }
} finally {
  await conn.end();
}
process.exit(0);
