/**
 * Alta de la consulta «Asesoramiento personalizado de aromaterapia» con las mismas reglas que CRM → Servicios, y enlace
 * del bloque del editor de Aceites con ella (solo ese bloque y solo los campos que nadie haya cambiado).
 * Repetible: si el servicio ya existe no lo toca. Uso: DATABASE_URL=… npx tsx scripts/alta-asesoramiento.ts [--dry-run]
 */
import mysql from "mysql2/promise";
import { config } from "dotenv";
import { AROMA_SERVICE } from "../shared/aromaService";
import { aceitesBlocks } from "../shared/aceitesPage";

config();
const dry = process.argv.includes("--dry-run");
if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL.");
const conn = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [[{ db }]] = (await conn.query("SELECT DATABASE() AS db")) as any;
  console.log(`Base de datos: ${db}${dry ? " (dry-run)" : ""}`);

  const [found] = (await conn.query("SELECT id, slug, name, price, status, visibleEnPublico FROM services WHERE slug = ? OR name LIKE '%aromaterapia%'", [AROMA_SERVICE.slug])) as any;
  if (found.length) console.log(`Servicio: ya existe → ${found.map((s: any) => `#${s.id} ${s.slug} «${s.name}» ${s.price} € ${s.status}${s.visibleEnPublico ? "" : " (oculto)"}`).join("; ")}`);
  else {
    console.log(`Servicio: se crea «${AROMA_SERVICE.name}» (${AROMA_SERVICE.price} €, online)${dry ? " (no se escribe)" : ""}.`);
    if (!dry) {
      const { servicesRouter } = await import("../server/routers/services");
      const { id } = await servicesRouter.createCaller({ user: { id: 1, role: "admin" }, req: {}, res: {} } as any).create(AROMA_SERVICE);
      console.log(`Servicio creado con id ${id}.`);
    }
  }

  const [[doc]] = (await conn.query("SELECT id, draftJson FROM site_documents WHERE docKey = '/aceites-esenciales'")) as any;
  if (!doc) console.log("Borrador: la página no está en el editor; se ve la de serie.");
  else {
    const json = JSON.parse(doc.draftJson);
    const block = json.blocks.find((b: any) => b.id === "ac-asesoramiento");
    const next = (aceitesBlocks().find((b) => b.id === "ac-asesoramiento") as any).data;
    // Valores que puso la versión anterior: solo se sustituyen si siguen tal cual
    const previous: Record<string, (v: unknown) => boolean> = {
      priceLabel: (v) => v === "Precio del servicio: 90 €",
      buttonUrl: (v) => typeof v === "string" && v.startsWith("https://wa.me/34657165343"),
      serviceSlug: (v) => !v,
      helpLabel: (v) => !v,
      helpUrl: (v) => !v,
    };
    const changed: string[] = [], kept: string[] = [];
    for (const [key, untouched] of Object.entries(previous)) {
      if (!block || block.data[key] === next[key]) continue;
      if (untouched(block.data[key])) { block.data[key] = next[key]; changed.push(key); } else kept.push(key);
    }
    console.log(`Borrador: ${!block ? "no tiene el bloque de asesoramiento" : changed.length ? `se actualizan ${changed.join(", ")}` : "ya está al día"}${kept.length ? ` · se respetan ediciones en ${kept.join(", ")}` : ""}${dry && changed.length ? " (no se escribe)" : ""}.`);
    if (!dry && changed.length) {
      const [r] = (await conn.execute("UPDATE site_documents SET draftJson = ?, draftUpdatedAt = NOW() WHERE id = ? AND draftJson = ?", [JSON.stringify(json), doc.id, doc.draftJson])) as any;
      if (!r.affectedRows) throw new Error("El borrador cambió mientras tanto: vuelve a ejecutar.");
    }
  }
} finally {
  await conn.end();
}
process.exit(0);
