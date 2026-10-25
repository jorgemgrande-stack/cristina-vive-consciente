/**
 * apply-0027-session-time.mjs
 * Aplica drizzle/0027_session_time.sql de forma idempotente y SOLO ADITIVA: añade
 * session_history.sessionTime (hora pactada, opcional) si no existe. No borra, renombra ni modifica datos.
 *
 * Uso (con DATABASE_URL en el entorno o en .env):
 *   node scripts/apply-0027-session-time.mjs --dry-run   (solo muestra qué haría)
 *   node scripts/apply-0027-session-time.mjs             (aplica)
 * Reversión: drizzle/0027_session_time.down.sql
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
    "SELECT COLUMN_NAME AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'session_history'",
  );
  if (cols.length === 0) throw new Error("No existe la tabla session_history");
  if (cols.some((r) => r.c === "sessionTime")) {
    console.log("  = session_history.sessionTime ya existe\nNada que hacer: 0027 ya está aplicada.");
  } else {
    const stmt = "ALTER TABLE `session_history` ADD COLUMN `sessionTime` varchar(5) NULL";
    console.log(`  + ${stmt}`);
    if (!DRY_RUN) await conn.query(stmt);
    console.log(`${DRY_RUN ? "Pendiente" : "Aplicado"}: 1 cambio.`);
  }
} finally {
  await conn.end();
}
