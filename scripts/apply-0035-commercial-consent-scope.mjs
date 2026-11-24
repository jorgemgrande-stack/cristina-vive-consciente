/**
 * apply-0035-commercial-consent-scope.mjs
 * Aplica drizzle/0035_commercial_consent_scope.sql de forma idempotente y ADITIVA: añade commercial_consents.scope si falta.
 * Uso (con DATABASE_URL en el entorno o en .env):
 *   node scripts/apply-0035-commercial-consent-scope.mjs --dry-run   (solo muestra qué haría)
 *   node scripts/apply-0035-commercial-consent-scope.mjs             (aplica)
 * Reversión: drizzle/0035_commercial_consent_scope.down.sql
 */
import mysql2 from "mysql2/promise";
import { config } from "dotenv";

config();
const DRY_RUN = process.argv.includes("--dry-run");
const conn = await mysql2.createConnection(process.env.DATABASE_URL);
try {
  const [[{ db }]] = await conn.query("SELECT DATABASE() AS db");
  console.log(`Base de datos: ${db}${DRY_RUN ? " (dry-run: no se escribe nada)" : ""}`);
  const [t] = await conn.query("SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'commercial_consents'");
  if (!t.length) throw new Error("Falta commercial_consents: aplica antes la migración 0034.");
  const [c] = await conn.query("SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'commercial_consents' AND COLUMN_NAME = 'scope'");
  if (c.length) {
    console.log("  = commercial_consents.scope ya está");
  } else {
    console.log("  + commercial_consents.scope");
    if (!DRY_RUN) await conn.query("ALTER TABLE `commercial_consents` ADD COLUMN `scope` varchar(80) NULL");
  }
  console.log(DRY_RUN ? "Dry-run terminado." : "0035 aplicada.");
} finally {
  await conn.end();
}
