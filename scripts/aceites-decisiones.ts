/**
 * Decisiones de Cristina sobre el catálogo y los pedidos de aceites. Repetible. No publica páginas.
 *  (El enlace de la ficha «Guía digital de aceites esenciales» con su ebook va aparte: aceites-enlazar-guia.ts.)
 *  1. «Asesoría para perros»: oculta del catálogo (se conserva y se reactiva desde CRM → Aceites).
 *  2. Crea la ficha «Pack asesoramiento personalizado de aromaterapia + guía básica» (consulta:asesoramiento_aromaterapia).
 *  3. Borrador del editor: pedidos y tarjeta de pedidos, solo donde nadie haya cambiado el texto.
 * Uso: DATABASE_URL=… npx tsx scripts/aceites-decisiones.ts [--dry-run]   (después del despliegue)
 */
import mysql from "mysql2/promise";
import { config } from "dotenv";
import { aceitesBlocks } from "../shared/aceitesPage";
import { AROMA_SERVICE_SLUG } from "../shared/aromaService";
import { migrateOrdersBlock } from "../shared/oilOrdersMigration";
import { normalizePageContent } from "../server/siteContent";

export const PACK_SLUG = "pack-asesoramiento-aromaterapia-guia";

config();
const dry = process.argv.includes("--dry-run");
if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL.");
const conn = await mysql.createConnection(process.env.DATABASE_URL);
const note = (s: string, writes = true) => console.log(`${s}${dry && writes ? " (no se escribe)" : ""}`);
const q = async (sql: string, p: unknown[] = []) => (await conn.query(sql, p))[0] as any;
try {
  note(`Base de datos: ${(await q("SELECT DATABASE() AS db"))[0].db}${dry ? " (dry-run)" : ""}`, false);

  const [dogs] = await q("SELECT id, visibleEnPublico FROM oil_products WHERE slug = 'asesoria-aceites-esenciales-perros'");
  if (!dogs) note("Asesoría para perros: NO existe la ficha.", false);
  else if (!dogs.visibleEnPublico) note(`Asesoría para perros (#${dogs.id}): ya oculta.`, false);
  else {
    note(`Asesoría para perros (#${dogs.id}): se oculta del catálogo público.`);
    if (!dry) await q("UPDATE oil_products SET visibleEnPublico = 0 WHERE id = ?", [dogs.id]);
  }

  const [bomb] = await q("SELECT id, tipoProducto, visibleEnPublico, status FROM oil_products WHERE slug = 'pack-recovery-bomb'");
  note(bomb ? `Pack Recovery Bomb (#${bomb.id}): tipo ${bomb.tipoProducto}, ${bomb.visibleEnPublico && bomb.status === "active" ? "visible" : "oculto"} (no se modifica).` : "Pack Recovery Bomb: NO existe.", false);

  const [pack] = await q("SELECT id, visibleEnPublico FROM oil_products WHERE slug = ?", [PACK_SLUG]);
  if (pack) note(`Pack de asesoramiento (#${pack.id}): ya existe.`, false);
  else {
    note("Pack de asesoramiento: se crea en Kits y packs.");
    if (!dry) {
      const { oilsRouter } = await import("../server/routers/oils");
      const { id } = await oilsRouter.createCaller({ user: { id: 1, role: "admin" }, req: {}, res: {} } as any).admin.createProduct({
        name: "Pack asesoramiento personalizado de aromaterapia + guía básica",
        slug: PACK_SLUG,
        category: "aceites-esenciales",
        tipoProducto: "pack",
        descripcion: "Consulta online individual para preparar tu botiquín de aromaterapia, con la guía básica de aceites esenciales incluida. Los aceites esenciales y los gastos de envío se abonan aparte.",
        imagen: "/site/hero-aceites.webp",
        tags: JSON.stringify(["pack", "asesoramiento", `consulta:${AROMA_SERVICE_SLUG}`]),
        sortOrder: 3,
      }) as { id: number };
      console.log(`Pack creado con id ${id}.`);
    }
  }

  // ── Borrador del editor ──
  const [doc] = await q("SELECT id, draftJson FROM site_documents WHERE docKey = '/aceites-esenciales'");
  if (!doc) note("Borrador: la página no está en el editor; se ve la de serie.", false);
  else {
    const json = JSON.parse(doc.draftJson);
    const code = aceitesBlocks() as any[];
    const next = (id: string) => code.find((b) => b.id === id).data;
    const changed: string[] = [], kept: string[] = [];

    const orders = json.blocks.find((b: any) => b.id === "ac-pedidos");
    if (orders) {
      const r = migrateOrdersBlock(orders.data, next("ac-pedidos"));
      if (r.changed) { orders.data = r.data; changed.push("bloque de pedidos"); }
      kept.push(...r.kept.map((k) => `pedidos.${k}`));
    }

    const cards = json.blocks.find((b: any) => b.id === "ac-servicios");
    const card = cards?.data.items.find((i: any) => i.buttonUrl === "#pedidos");
    const wanted = next("ac-servicios").items.find((i: any) => i.buttonUrl === "#pedidos").text;
    if (card && card.text !== wanted) {
      if (card.text === "Consulta cuándo se abre el próximo pedido conjunto o solicita un pedido individual si necesitas reponer tus aceites.") { card.text = wanted; changed.push("tarjeta de pedidos"); }
      else kept.push("tarjeta de pedidos");
    }

    note(`Borrador: ${changed.length ? `se actualiza ${changed.join(" y ")}` : "ya está al día"}${kept.length ? ` · se respetan ediciones en ${kept.join(", ")}` : ""}.`, changed.length > 0);
    if (!dry && changed.length) {
      const r = await q("UPDATE site_documents SET draftJson = ?, draftUpdatedAt = NOW() WHERE id = ? AND draftJson = ?", [JSON.stringify(normalizePageContent(json)), doc.id, doc.draftJson]);
      if (!r.affectedRows) throw new Error("El borrador cambió mientras tanto: vuelve a ejecutar.");
    }
  }
} finally {
  await conn.end();
}
process.exit(0);
