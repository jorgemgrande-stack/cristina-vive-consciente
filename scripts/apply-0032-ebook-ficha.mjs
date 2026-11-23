/**
 * apply-0032-ebook-ficha.mjs
 * Aplica drizzle/0032_ebook_ficha.sql de forma idempotente y SOLO ADITIVA: añade a ebooks las columnas opcionales
 * synopsis, author y edition si no existen. No borra, renombra ni modifica datos.
 * Uso (con DATABASE_URL en el entorno o en .env):
 *   node scripts/apply-0032-ebook-ficha.mjs --dry-run   (solo muestra qué haría)
 *   node scripts/apply-0032-ebook-ficha.mjs             (aplica)
 * Reversión: drizzle/0032_ebook_ficha.down.sql
 */
import mysql2 from "mysql2/promise";
import { config } from "dotenv";

config();
const DRY_RUN = process.argv.includes("--dry-run");
const COLUMNS = [
  ["synopsis", "ALTER TABLE `ebooks` ADD COLUMN `synopsis` text NULL"],
  ["author", "ALTER TABLE `ebooks` ADD COLUMN `author` varchar(200) NULL"],
  ["edition", "ALTER TABLE `ebooks` ADD COLUMN `edition` varchar(100) NULL"],
];

const conn = await mysql2.createConnection(process.env.DATABASE_URL);
try {
  const [[{ db }]] = await conn.query("SELECT DATABASE() AS db");
  console.log(`Base de datos: ${db}${DRY_RUN ? " (dry-run: no se escribe nada)" : ""}`);
  const [cols] = await conn.query("SELECT COLUMN_NAME AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ebooks'");
  if (cols.length === 0) throw new Error("No existe la tabla ebooks");
  for (const [name, stmt] of COLUMNS) {
    if (cols.some((r) => r.c === name)) { console.log(`  = ebooks.${name} ya existe`); continue; }
    console.log(`  + ${stmt}`);
    if (!DRY_RUN) await conn.query(stmt);
  }
  console.log(DRY_RUN ? "Dry-run terminado." : "0032 aplicada.");
} finally {
  await conn.end();
}
