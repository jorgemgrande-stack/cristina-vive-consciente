/**
 * Prepara la publicación de la nueva sección de Aceites Esenciales. NO publica nada.
 *  1. Guarda el borrador actual de /aceites-esenciales en su historial y pone como borrador el contenido nuevo.
 *  2. Crea, si no existe, el ebook «Guía básica de aceites esenciales» (14,90 €) como BORRADOR sin PDF.
 * Repetible. Uso: DATABASE_URL=… npx tsx scripts/prepare-aceites.ts [--dry-run]
 */
import mysql from "mysql2/promise";
import { config } from "dotenv";
import { ACEITES_GUIDE_SLUG, aceitesContent } from "../shared/aceitesPage";
import { matchesEbookSlug } from "../shared/ebookPage";
import { normalizePageContent } from "../server/siteContent";

config();
const dry = process.argv.includes("--dry-run");
if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL.");
const conn = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [[{ db }]] = (await conn.query("SELECT DATABASE() AS db")) as any;
  console.log(`Base de datos: ${db}${dry ? " (dry-run)" : ""}`);

  const next = JSON.stringify(normalizePageContent(aceitesContent()));
  const [docs] = (await conn.query("SELECT id, draftJson, servedFrom FROM site_documents WHERE docKey = '/aceites-esenciales'")) as any;
  const doc = docs[0];
  if (!doc) console.log("Borrador: la página aún no existe en el editor; se verá el contenido de serie. Nada que hacer.");
  else if (doc.draftJson === next) console.log("Borrador: ya preparado.");
  else {
    if (doc.servedFrom === "cms") console.log("AVISO: la página tiene una versión publicada desde el editor; seguirá visible hasta que se publique el borrador.");
    console.log(`Borrador: se guarda el actual en el historial y se sustituye por el nuevo${dry ? " (no se escribe)" : ""}.`);
    if (!dry) {
      await conn.beginTransaction();
      await conn.execute("INSERT INTO site_document_versions (documentId, contentJson, action, note) VALUES (?, ?, 'migrate', ?)", [doc.id, doc.draftJson, "Borrador anterior a la reorganización de Aceites"]);
      await conn.execute("UPDATE site_documents SET draftJson = ?, draftUpdatedAt = NOW() WHERE id = ?", [next, doc.id]);
      await conn.commit();
    }
  }

  const [ebooks] = (await conn.query("SELECT id, slug, status, priceCents, pdfUrl FROM ebooks")) as any;
  const guide = ebooks.find((e: any) => matchesEbookSlug(ACEITES_GUIDE_SLUG, e.slug));
  if (guide) console.log(`Guía: ya existe (${guide.slug}, ${guide.status}, ${guide.priceCents} céntimos, ${guide.pdfUrl ? "con" : "sin"} PDF).`);
  else {
    console.log(`Guía: se crea como borrador sin PDF${dry ? " (no se escribe)" : ""}.`);
    if (!dry) await conn.execute(
      "INSERT INTO ebooks (slug, title, subtitle, price, priceCents, status) VALUES (?, 'Guía básica de aceites esenciales', 'PDF digital', '14.90', 1490, 'inactive')",
      [ACEITES_GUIDE_SLUG],
    );
  }
} finally {
  await conn.end();
}
