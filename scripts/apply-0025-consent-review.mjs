/**
 * apply-0025-consent-review.mjs
 * Aplica drizzle/0025_consent_review.sql de forma idempotente y SOLO ADITIVA: añade
 * client_consents.reviewedAt si no existe. No borra, renombra ni modifica datos.
 *
 * Uso (con DATABASE_URL en el entorno o en .env):
 *   node scripts/apply-0025-consent-review.mjs --dry-run   (solo muestra qué haría)
 *   node scripts/apply-0025-consent-review.mjs             (aplica)
 * Reversión: drizzle/0025_consent_review.down.sql
 */
import mysql2 from "mysql2/promise";
import { config } from "dotenv";

config();
const DRY_RUN = process.argv.includes("--dry-run");

const conn = await mysql2.createConnection(process.env.DATABASE_URL);
try {
  const [[{ db }]] = await conn.query("SELECT DATABASE() AS db");
  console.log(`Base de datos: ${db}${DRY_RUN ? " (dry-run: no se escribe nada)" : ""}`);
  const [cols] = await conn.query(
    "SELECT COLUMN_NAME AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'client_consents'",
  );
  if (cols.length === 0) throw new Error("No existe client_consents: aplica antes la migración 0024");
  if (cols.some((r) => r.c === "reviewedAt")) {
    console.log("  = client_consents.reviewedAt ya existe\nNada que hacer: 0025 ya está aplicada.");
  } else {
    const stmt = "ALTER TABLE `client_consents` ADD COLUMN `reviewedAt` bigint NULL";
    console.log(`  + ${stmt}`);
    if (!DRY_RUN) await conn.query(stmt);
    console.log(`${DRY_RUN ? "Pendiente" : "Aplicado"}: 1 cambio.`);
  }
} finally {
  await conn.end();
}
