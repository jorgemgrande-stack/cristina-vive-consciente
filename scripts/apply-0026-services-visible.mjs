/**
 * apply-0026-services-visible.mjs
 * Aplica drizzle/0026_services_visible.sql de forma idempotente y SOLO ADITIVA: añade
 * services.visibleEnPublico (valor 1 = visible) si no existe. No borra, renombra ni modifica datos.
 *
 * Uso (con DATABASE_URL en el entorno o en .env):
 *   node scripts/apply-0026-services-visible.mjs --dry-run   (solo muestra qué haría)
 *   node scripts/apply-0026-services-visible.mjs             (aplica)
 * Reversión: drizzle/0026_services_visible.down.sql
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
    "SELECT COLUMN_NAME AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'services'",
  );
  if (cols.length === 0) throw new Error("No existe la tabla services");
  if (cols.some((r) => r.c === "visibleEnPublico")) {
    console.log("  = services.visibleEnPublico ya existe\nNada que hacer: 0026 ya está aplicada.");
  } else {
    const stmt = "ALTER TABLE `services` ADD COLUMN `visibleEnPublico` int NOT NULL DEFAULT 1";
    console.log(`  + ${stmt}`);
    if (!DRY_RUN) await conn.query(stmt);
    console.log(`${DRY_RUN ? "Pendiente" : "Aplicado"}: 1 cambio.`);
  }
} finally {
  await conn.end();
}
