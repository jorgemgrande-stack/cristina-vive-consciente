/**
 * apply-0031-ebook-promos.mjs
 * Aplica drizzle/0031_ebook_promos.sql de forma idempotente y SOLO ADITIVA (crea las tablas si no existen).
 * Uso (con DATABASE_URL en el entorno o en .env):
 *   node scripts/apply-0031-ebook-promos.mjs --dry-run   (solo muestra qué haría)
 *   node scripts/apply-0031-ebook-promos.mjs             (aplica)
 * Reversión: drizzle/0031_ebook_promos.down.sql
 */
import fs from "fs";
import mysql2 from "mysql2/promise";
import { config } from "dotenv";

config();
const DRY_RUN = process.argv.includes("--dry-run");
const sql = fs.readFileSync(new URL("../drizzle/0031_ebook_promos.sql", import.meta.url), "utf8");
const statements = sql.replace(/^--.*$/gm, "").split(";").map((s) => s.trim()).filter(Boolean);

const conn = await mysql2.createConnection(process.env.DATABASE_URL);
try {
  const [[{ db }]] = await conn.query("SELECT DATABASE() AS db");
  console.log(`Base de datos: ${db}${DRY_RUN ? " (dry-run: no se escribe nada)" : ""}`);
  for (const st of statements) {
    const name = /`(\w+)`/.exec(st)?.[1];
    const [rows] = await conn.query("SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?", [name]);
    if (rows.length) { console.log(`  = ${name} ya existe`); continue; }
    console.log(`  + CREATE TABLE ${name}`);
    if (!DRY_RUN) await conn.query(st);
  }
  console.log(DRY_RUN ? "Dry-run terminado." : "0031 aplicada.");
} finally {
  await conn.end();
}
