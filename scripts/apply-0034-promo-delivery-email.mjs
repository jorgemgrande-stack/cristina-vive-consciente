/**
 * apply-0034-promo-delivery-email.mjs
 * Aplica drizzle/0034_promo_delivery_email.sql de forma idempotente y ADITIVA:
 *  - crea ebook_promo_emails y commercial_consents si no existen;
 *  - añade ebook_promos.sendDeliveryEmail (0 = apagado) si falta.
 * No toca ninguna fila existente.
 * Uso (con DATABASE_URL en el entorno o en .env):
 *   node scripts/apply-0034-promo-delivery-email.mjs --dry-run   (solo muestra qué haría)
 *   node scripts/apply-0034-promo-delivery-email.mjs             (aplica)
 * Reversión: drizzle/0034_promo_delivery_email.down.sql
 */
import fs from "fs";
import mysql2 from "mysql2/promise";
import { config } from "dotenv";

config();
const DRY_RUN = process.argv.includes("--dry-run");
const sql = fs.readFileSync(new URL("../drizzle/0034_promo_delivery_email.sql", import.meta.url), "utf8");
const statements = sql.replace(/^--.*$/gm, "").split(";").map((s) => s.trim()).filter(Boolean);

const conn = await mysql2.createConnection(process.env.DATABASE_URL);
try {
  const [[{ db }]] = await conn.query("SELECT DATABASE() AS db");
  console.log(`Base de datos: ${db}${DRY_RUN ? " (dry-run: no se escribe nada)" : ""}`);
  const [r0] = await conn.query("SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ebook_promos'");
  if (!r0.length) throw new Error("Falta ebook_promos: aplica antes las migraciones 0031 y 0033.");
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
    }
    if (skip) { console.log(`  = ${label} ya está`); continue; }
    console.log(`  + ${label}`);
    if (!DRY_RUN) await conn.query(st);
  }
  console.log(DRY_RUN ? "Dry-run terminado." : "0034 aplicada.");
} finally {
  await conn.end();
}
