/**
 * Decisiones de Cristina sobre el catálogo y los pedidos de aceites. Repetible. No publica páginas.
 *  1. Ficha «Guía digital de aceites esenciales»: etiqueta ebook:aceites (precio y compra de ese ebook).
 *  2. «Asesoría para perros»: oculta del catálogo (se conserva y se reactiva desde CRM → Aceites).
 *  3. Crea la ficha «Pack asesoramiento personalizado de aromaterapia + guía básica» (consulta:asesoramiento_aromaterapia).
 *  4. Borrador del editor: pedidos y tarjeta de pedidos, solo donde nadie haya cambiado el texto.
 * Uso: DATABASE_URL=… npx tsx scripts/aceites-decisiones.ts [--dry-run]   (después del despliegue)
 */
import mysql from "mysql2/promise";
import { config } from "dotenv";
import { aceitesBlocks } from "../shared/aceitesPage";
import { AROMA_SERVICE_SLUG } from "../shared/aromaService";
import { oilLink } from "../shared/oilLinks";
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

  const [ebook] = await q("SELECT slug, priceCents, status, pdfUrl FROM ebooks WHERE slug = 'aceites'");
  if (!ebook) throw new Error("No existe el ebook «aceites»: no se enlaza nada.");
  note(`Ebook «aceites»: ${ebook.priceCents / 100} €, ${ebook.status}, ${ebook.pdfUrl ? "con" : "SIN"} PDF (no se modifica).`, false);

  const [guide] = await q("SELECT id, tags, tipoProducto FROM oil_products WHERE slug = 'guia-digital-aceites-esenciales'");
  if (!guide) note("Guía del catálogo: NO existe la ficha.", false);
  else if (oilLink(guide.tags)) note(`Guía del catálogo (#${guide.id}): ya enlazada, tipo ${guide.tipoProducto}.`, false);
  else {
    note(`Guía del catálogo (#${guide.id}, ${guide.tipoProducto}): se añade la etiqueta ebook:aceites.`);
    if (!dry) await q("UPDATE oil_products SET tags = ? WHERE id = ?", [JSON.stringify([...JSON.parse(guide.tags || "[]"), "ebook:aceites"]), guide.id]);
  }

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
    if (orders && "groupMin" in orders.data) {
      // Textos de la versión anterior: un campo que ya no los tenga se considera editado por Cristina y se conserva
      const before: Record<string, string> = {
        title: "Pedidos de aceites esenciales", groupTitle: "Pedidos conjuntos",
        groupText: "A lo largo del año organizo pedidos agrupados de aceites esenciales y accesorios. Esta modalidad permite realizar compras de menor importe y centralizar la preparación de los envíos.",
        groupHint: "Consulta cuándo realizamos el próximo pedido", soloTitle: "Pedidos individuales",
        soloText: "Si necesitas adquirir o reponer tus aceites esenciales fuera de las fechas de pedidos conjuntos, puedes solicitar un pedido individual a partir de un importe mínimo de compra.",
        soloHint: "Si ya conoces los aceites que necesitas, no es necesario contratar un asesoramiento previo", soloLabel: "Solicitar pedido individual",
        closing: "Todos los pedidos se gestionarán mediante contacto directo conmigo, previa confirmación de disponibilidad, importe y condiciones",
      };
      const data = { ...next("ac-pedidos") };
      for (const [key, old] of Object.entries(before)) if (orders.data[key] !== undefined && orders.data[key] !== old) { data[key] = orders.data[key]; kept.push(`pedidos.${key}`); }
      orders.data = data;
      changed.push("bloque de pedidos");
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
