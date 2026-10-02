/**
 * apply-services-home-price.mjs
 * Aplica drizzle/0021_services_home_price.sql de forma idempotente:
 *  1) añade la columna services.homePrice si no existe,
 *  2) rellena 100 € (Relajante) y 110 € (Terapéutico 60 min) SOLO si siguen en NULL.
 * No toca ninguna otra fila ni columna. Aditivo: el código anterior ignora la columna nueva.
 *
 * Uso (desde la carpeta que tiene el .env con DATABASE_URL):
 *   node scripts/apply-services-home-price.mjs --dry-run   (solo lee y muestra qué haría)
 *   node scripts/apply-services-home-price.mjs             (aplica)
 */
import mysql2 from 'mysql2/promise';
import { config } from 'dotenv';

config();
const DRY_RUN = process.argv.includes('--dry-run');
const SEED = [
  ['masaje_relajante_navas_de_rio_frio_segovia', 100.0],
  ['masaje_terapeutico_navas_de_rio_frio_segovia', 110.0],
];

const conn = await mysql2.createConnection(process.env.DATABASE_URL);
try {
  const [db] = await conn.query('SELECT DATABASE() AS db');
  console.log('Base de datos:', db[0].db);
  const [cols] = await conn.query(
    "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'services' AND COLUMN_NAME = 'homePrice'",
  );
  const exists = cols.length > 0;
  console.log('Columna services.homePrice:', exists ? 'ya existe' : 'NO existe');

  if (!exists) {
    if (DRY_RUN) console.log('[dry-run] ALTER TABLE services ADD COLUMN homePrice decimal(10,2) NULL');
    else {
      await conn.query('ALTER TABLE `services` ADD COLUMN `homePrice` decimal(10,2) NULL');
      console.log('Columna añadida.');
    }
  }

  for (const [slug, price] of SEED) {
    if (DRY_RUN && !exists) {
      console.log(`[dry-run] UPDATE homePrice=${price} WHERE slug='${slug}' (si sigue en NULL)`);
      continue;
    }
    const [res] = await conn.execute('UPDATE `services` SET `homePrice` = ? WHERE `slug` = ? AND `homePrice` IS NULL', [price, slug]);
    console.log(`${slug}: ${res.affectedRows ? `homePrice=${price}` : 'sin cambios (ya tenía valor o no existe)'}`);
  }

  if (!DRY_RUN || exists) {
    const [rows] = await conn.query("SELECT id, slug, type, price, homePrice FROM services WHERE type = 'masaje' ORDER BY id");
    console.table(rows);
  }
} finally {
  await conn.end();
}
