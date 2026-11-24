/**
 * apply-0033-promo-registrations.mjs
 * Aplica drizzle/0033_promo_registrations.sql de forma idempotente y ADITIVA:
 *  - crea ebook_promo_registrations si no existe;
 *  - añade ebook_promo_events.registrationId y .confirmed si faltan;
 *  - amplía client_services.source con el valor «promo» si todavía no lo tiene (no toca ninguna fila).
 * Uso (con DATABASE_URL en el entorno o en .env):
 *   node scripts/apply-0033-promo-registrations.mjs --dry-run   (solo muestra qué haría)
 *   node scripts/apply-0033-promo-registrations.mjs             (aplica)
 * Reversión: drizzle/0033_promo_registrations.down.sql
 */
import fs from "fs";
import mysql2 from "mysql2/promise";
import { config } from "dotenv";

config();
const DRY_RUN = process.argv.includes("--dry-run");
const sql = fs.readFileSync(new URL("../drizzle/0033_promo_registrations.sql", import.meta.url), "utf8");
const statements = sql.replace(/^--.*$/gm, "").split(";").map((s) => s.trim()).filter(Boolean);

const conn = await mysql2.createConnection(process.env.DATABASE_URL);
try {
  const [[{ db }]] = await conn.query("SELECT DATABASE() AS db");
  console.log(`Base de datos: ${db}${DRY_RUN ? " (dry-run: no se escribe nada)" : ""}`);
  for (const [tbl] of [["ebook_promos"], ["ebook_promo_events"], ["client_services"]]) {
    const [r] = await conn.query("SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?", [tbl]);
    if (!r.length) throw new Error(`Falta la tabla ${tbl}: aplica antes las migraciones anteriores (0030, 0031).`);
  }
  for (const st of statements) {
    let skip = false;
    let label = st.slice(0, 70);
    if (/^CREATE TABLE/i.test(st)) {
      const t = /`(\w+)`/.exec(st)[1];
      label = `CREATE TABLE ${t}`;
      const [r] = await conn.query("SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?", [t]);
      skip = r.length > 0;
    } else if (/ADD COLUMN/i.test(st)) {
      const [, t, c] = /ALTER TABLE `(\w+)` ADD COLUMN `(\w+)`/i.exec(st);
      label = `${t}.${c}`;
      const [r] = await conn.query("SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?", [t, c]);
      skip = r.length > 0;
    } else if (/MODIFY COLUMN `source`/i.test(st)) {
      label = "client_services.source (+ promo)";
      const [r] = await conn.query("SELECT COLUMN_TYPE AS t FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'client_services' AND COLUMN_NAME = 'source'");
      skip = /'promo'/.test(r[0]?.t ?? "");
    }
    if (skip) { console.log(`  = ${label} ya está`); continue; }
    console.log(`  + ${label}`);
    if (!DRY_RUN) await conn.query(st);
  }
  console.log(DRY_RUN ? "Dry-run terminado." : "0033 aplicada.");
} finally {
  await conn.end();
}
