/**
 * apply-0024-client-management.mjs
 * Aplica drizzle/0024_client_management.sql de forma idempotente y SOLO ADITIVA:
 * añade cada columna o tabla únicamente si no existe. Nunca borra, renombra ni modifica datos.
 *
 * Uso (desde la carpeta con DATABASE_URL en el entorno o en .env):
 *   node scripts/apply-0024-client-management.mjs --dry-run   (solo muestra qué haría)
 *   node scripts/apply-0024-client-management.mjs             (aplica)
 * Reversión (manual y destructiva para lo añadido): drizzle/0024_client_management.down.sql
 */
import mysql2 from "mysql2/promise";
import fs from "node:fs";
import { config } from "dotenv";

config();
const DRY_RUN = process.argv.includes("--dry-run");

const COLUMNS = [
  ["clients", "occupation", "varchar(150) NULL"],
  ["clients", "customRate", "decimal(10,2) NULL"],
  ["clients", "customRateNote", "varchar(200) NULL"],
  ["clients", "rememberInfo", "text NULL"],
  ["session_history", "serviceId", "int NULL"],
  ["session_history", "durationMinutes", "int NULL"],
  ["session_history", "clientPreferences", "text NULL"],
  ["session_history", "editedAt", "timestamp NULL"],
  ["session_history", "editedBy", "int NULL"],
];
const TABLES = ["crm_audit_log", "client_sensitive_records", "client_consents"];

// Los CREATE TABLE se toman del propio archivo de migración (una sola fuente)
const sqlFile = fs.readFileSync(new URL("../drizzle/0024_client_management.sql", import.meta.url), "utf8");
const createFor = (table) => {
  const m = sqlFile.match(new RegExp("CREATE TABLE IF NOT EXISTS `" + table + "`[\\s\\S]*?\\n\\);"));
  if (!m) throw new Error(`No encuentro el CREATE TABLE de ${table} en 0024`);
  return m[0];
};

const conn = await mysql2.createConnection(process.env.DATABASE_URL);
try {
  const [[{ db }]] = await conn.query("SELECT DATABASE() AS db");
  console.log(`Base de datos: ${db}${DRY_RUN ? " (dry-run: no se escribe nada)" : ""}`);
  const [cols] = await conn.query(
    "SELECT TABLE_NAME AS t, COLUMN_NAME AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('clients','session_history')",
  );
  const have = new Set(cols.map((r) => `${r.t}.${r.c}`));
  const [tabs] = await conn.query("SELECT TABLE_NAME AS t FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()");
  const haveTables = new Set(tabs.map((r) => r.t));

  let pending = 0;
  for (const [table, column, type] of COLUMNS) {
    if (have.has(`${table}.${column}`)) { console.log(`  = ${table}.${column} ya existe`); continue; }
    pending++;
    const stmt = `ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${type}`;
    console.log(`  + ${stmt}`);
    if (!DRY_RUN) await conn.query(stmt);
  }
  for (const table of TABLES) {
    if (haveTables.has(table)) { console.log(`  = tabla ${table} ya existe`); continue; }
    pending++;
    console.log(`  + CREATE TABLE ${table}`);
    if (!DRY_RUN) await conn.query(createFor(table));
  }
  console.log(pending ? `${DRY_RUN ? "Pendientes" : "Aplicados"}: ${pending} cambios.` : "Nada que hacer: 0024 ya está aplicada.");
} finally {
  await conn.end();
}
