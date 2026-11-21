/**
 * apply-0028-site-editor.mjs
 * Aplica drizzle/0028_site_editor.sql de forma idempotente y SOLO ADITIVA: crea las tres tablas de «Editar web»
 * únicamente si no existen. No toca ninguna tabla existente.
 *
 * Uso (con DATABASE_URL en el entorno o en .env):
 *   node scripts/apply-0028-site-editor.mjs --dry-run   (solo muestra qué haría)
 *   node scripts/apply-0028-site-editor.mjs             (aplica)
 * Reversión: drizzle/0028_site_editor.down.sql
 */
import mysql2 from "mysql2/promise";
import fs from "node:fs";
import { config } from "dotenv";

config();
const DRY_RUN = process.argv.includes("--dry-run");
const sql = fs.readFileSync(new URL("../drizzle/0028_site_editor.sql", import.meta.url), "utf8");
const stmts = sql.match(/CREATE TABLE IF NOT EXISTS `(\w+)`[\s\S]*?\n\);/g) ?? [];
if (stmts.length !== 3) throw new Error(`Esperaba 3 CREATE TABLE y hay ${stmts.length}`);

const conn = await mysql2.createConnection(process.env.DATABASE_URL);
try {
  const [[{ db }]] = await conn.query("SELECT DATABASE() AS db");
  console.log(`Base de datos: ${db}${DRY_RUN ? " (dry-run: no se escribe nada)" : ""}`);
  const [tabs] = await conn.query("SELECT TABLE_NAME AS t FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()");
  const have = new Set(tabs.map((r) => r.t));
  let pending = 0;
  for (const stmt of stmts) {
    const name = stmt.match(/`(\w+)`/)[1];
    if (have.has(name)) { console.log(`  = ${name} ya existe`); continue; }
    console.log(`  + CREATE TABLE ${name}`);
    pending++;
    if (!DRY_RUN) await conn.query(stmt);
  }
  console.log(pending ? `${DRY_RUN ? "Pendiente" : "Aplicado"}: ${pending} tabla(s).` : "Nada que hacer: 0028 ya está aplicada.");
} finally {
  await conn.end();
}
