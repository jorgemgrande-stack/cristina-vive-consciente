import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";
import { config } from "dotenv";

config();
const dryRun = process.argv.includes("--dry-run");
if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL.");
const columns = ["shippingAddress", "shippingCents", "shippedAt", "shippingTracking", "pendingPrintKey"];
const index = "orders_pendingPrintKey_unique";
const conn = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [[{ db }]] = await conn.query("SELECT DATABASE() AS db");
  console.log(`Base de datos: ${db}${dryRun ? " (dry-run)" : ""}`);
  const [existingColumns] = await conn.execute(
    "SELECT COLUMN_NAME AS name FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders'"
  );
  if (!existingColumns.length) throw new Error("No existe la tabla orders en esta base.");
  const [existingIndexes] = await conn.execute(
    "SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND INDEX_NAME = ? AND COLUMN_NAME = 'pendingPrintKey' AND NON_UNIQUE = 0",
    [index]
  );
  const matches = columns.filter(column => existingColumns.some(row => row.name === column)).length;
  if (matches === columns.length && existingIndexes.length) {
    console.log("0036 ya aplicada.");
  } else {
    if (matches || existingIndexes.length) throw new Error("Migración 0036 parcial. Revisa el esquema antes de continuar.");
    if (dryRun) console.log("0036 pendiente: añade cinco columnas y un índice a orders.");
    else {
      const sql = await readFile(new URL("../drizzle/0036_printed_story_orders.sql", import.meta.url), "utf8");
      await conn.query(sql);
      console.log("0036 aplicada.");
    }
  }
} finally {
  await conn.end();
}
