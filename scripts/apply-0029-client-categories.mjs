/**
 * apply-0029-client-categories.mjs
 * Aplica drizzle/0029_client_categories.sql de forma idempotente y SOLO ADITIVA.
 * En la primera aplicación (cuando client_categories todavía no existe) asigna «Recursos gratuitos»
 * a TODOS los clientes que ya están en el CRM en ese momento. Si se repite, no hace nada más.
 *
 *   node scripts/apply-0029-client-categories.mjs --dry-run
 *   node scripts/apply-0029-client-categories.mjs
 * Reversión: drizzle/0029_client_categories.down.sql
 */
import mysql2 from "mysql2/promise";
import { config } from "dotenv";

config();
const DRY_RUN = process.argv.includes("--dry-run");
const conn = await mysql2.createConnection(process.env.DATABASE_URL);
const has = async (table, col) => {
  const [r] = await conn.query(
    "SELECT COLUMN_NAME c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?" + (col ? " AND COLUMN_NAME = ?" : ""),
    col ? [table, col] : [table],
  );
  return r.length > 0;
};
try {
  const [[{ db }]] = await conn.query("SELECT DATABASE() AS db");
  console.log(`Base de datos: ${db}${DRY_RUN ? " (dry-run: no se escribe nada)" : ""}`);
  const run = async (sql) => { console.log("  +", sql.replace(/\s+/g, " ").slice(0, 110)); if (!DRY_RUN) await conn.query(sql); };
  const firstTime = !(await has("client_categories"));
  const sqlText = (await import("node:fs")).readFileSync(new URL("../drizzle/0029_client_categories.sql", import.meta.url), "utf8");
  const stmts = sqlText.split(/;\s*\n/).map((s) => s.replace(/^--.*$/gm, "").trim()).filter(Boolean);
  let changes = 0;
  for (const st of stmts) {
    if (/^CREATE TABLE IF NOT EXISTS `client_categories`/.test(st) && !firstTime) continue;
    if (/^CREATE TABLE IF NOT EXISTS `client_prior_items`/.test(st) && (await has("client_prior_items"))) continue;
    if (/ADD COLUMN `source`/.test(st) && (await has("client_notes", "source"))) continue;
    if (/ADD COLUMN `sourceKey`/.test(st) && (await has("client_notes", "sourceKey"))) continue;
    if (/ADD UNIQUE KEY `client_notes_source_uq`/.test(st)) {
      const [i] = await conn.query("SHOW INDEX FROM client_notes WHERE Key_name = 'client_notes_source_uq'");
      if (i.length) continue;
    }
    await run(st); changes++;
  }
  const [[{ n }]] = await conn.query("SELECT COUNT(*) n FROM clients");
  if (firstTime) {
    console.log(`  + Recursos gratuitos para los ${n} clientes existentes`);
    if (!DRY_RUN) await conn.query("INSERT IGNORE INTO client_categories (clientId, category) SELECT id, 'recursos_gratuitos' FROM clients");
    changes++;
  }
  console.log(changes ? `${DRY_RUN ? "Pendiente" : "Aplicado"}: ${changes} cambio(s).` : "Nada que hacer: 0029 ya está aplicada.");
} finally {
  await conn.end();
}
