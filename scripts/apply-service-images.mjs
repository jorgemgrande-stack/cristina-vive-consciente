/**
 * apply-service-images.mjs
 * Crea la tabla `service_images` (migración 0022) si no existe. Idempotente y aditivo: no toca ninguna otra tabla
 * ni inserta datos.
 *
 * Uso (desde la carpeta que tiene el .env con DATABASE_URL):
 *   node scripts/apply-service-images.mjs --dry-run   (solo lee y muestra qué haría)
 *   node scripts/apply-service-images.mjs             (aplica)
 */
import mysql2 from 'mysql2/promise';
import { config } from 'dotenv';

config();
const DRY_RUN = process.argv.includes('--dry-run');

const conn = await mysql2.createConnection(process.env.DATABASE_URL);
try {
  const [db] = await conn.query('SELECT DATABASE() AS db');
  console.log('Base de datos:', db[0].db);
  const [t] = await conn.query(
    "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'service_images'",
  );
  if (t.length) {
    console.log('La tabla service_images ya existe. Nada que hacer.');
  } else if (DRY_RUN) {
    console.log('[dry-run] CREATE TABLE service_images (...)');
  } else {
    await conn.query(`CREATE TABLE IF NOT EXISTS \`service_images\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`serviceId\` int NOT NULL,
      \`url\` varchar(500) NOT NULL,
      \`alt\` varchar(300),
      \`sortOrder\` int NOT NULL DEFAULT 0,
      \`isCover\` int NOT NULL DEFAULT 0,
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      CONSTRAINT \`service_images_id\` PRIMARY KEY(\`id\`),
      INDEX \`service_images_serviceId_idx\` (\`serviceId\`)
    )`);
    console.log('Tabla service_images creada.');
  }
} finally {
  await conn.end();
}
