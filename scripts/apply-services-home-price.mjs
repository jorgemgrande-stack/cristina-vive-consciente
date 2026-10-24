/**
 * apply-services-home-price.mjs
 * Precio a domicilio de los masajes en la fuente de verdad (services.homePrice, editable en el CRM).
 * Idempotente:
 *  1) añade la columna services.homePrice si no existe (drizzle/0021_services_home_price.sql),
 *  2) fija 120 € a domicilio en Relajante y Terapéutico (precio confirmado por Cristina el 2026-10-24) si
 *     siguen en NULL o con los valores provisionales de 0021 (100 € / 110 €, nunca vigentes en producción),
 *  3) corrige en los textos del CRM las frases que contradicen ese precio («A domicilio: 100 €», «consultar
 *     tarifas»). La reserva a domicilio se acuerda por WhatsApp: el formulario solo reserva en consulta.
 * No toca precios en consulta (70 € / 80 €) ni ninguna otra fila o columna.
 *
 * ORDEN: ejecutar DESPUÉS de desplegar el código con HOME_BOOKING_VIA_FORM = false. Con el código anterior,
 * un homePrice no nulo hace que el formulario ofrezca reservar a domicilio.
 *
 * Uso (desde la carpeta que tiene el .env con DATABASE_URL):
 *   node scripts/apply-services-home-price.mjs --dry-run   (solo lee y muestra qué haría)
 *   node scripts/apply-services-home-price.mjs             (aplica)
 */
import mysql2 from 'mysql2/promise';
import { config } from 'dotenv';

config();
const DRY_RUN = process.argv.includes('--dry-run');
const HOME_PRICE = 120.0;
const PROVISIONAL = [100.0, 110.0];
const SLUGS = ['masaje_relajante_navas_de_rio_frio_segovia', 'masaje_terapeutico_navas_de_rio_frio_segovia'];
const HOME_SENTENCE = 'A domicilio: 120 €; la disponibilidad y la reserva se acuerdan con Cristina por WhatsApp.';
const TEXT_FIXES = {
  longDescription: [
    ['Para el servicio a domicilio, consultar tarifas y disponibilidad.', HOME_SENTENCE],
    ['Para domicilio consultar tarifas.', HOME_SENTENCE],
  ],
  includes: [['En consulta: 70 € · A domicilio: 100 €', 'En consulta: 70 € · A domicilio: 120 € (reserva por WhatsApp)']],
};

const conn = await mysql2.createConnection(process.env.DATABASE_URL);
try {
  const [db] = await conn.query('SELECT DATABASE() AS db');
  console.log('Base de datos:', db[0].db, DRY_RUN ? '(dry-run: no se escribe nada)' : '');
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

  for (const slug of SLUGS) {
    const [rows] = await conn.execute(
      `SELECT id, price, ${exists ? 'homePrice' : 'NULL AS homePrice'}, longDescription, includes FROM services WHERE slug = ?`,
      [slug],
    );
    if (!rows.length) {
      console.log(`${slug}: no existe, se omite`);
      continue;
    }
    const row = rows[0];
    const changes = {};

    const current = row.homePrice == null ? null : Number(row.homePrice);
    if (current === null || PROVISIONAL.includes(current)) changes.homePrice = HOME_PRICE;
    else if (current !== HOME_PRICE) console.log(`${slug}: homePrice=${current} distinto de 120 y no provisional → NO se toca (revisar en el CRM)`);

    for (const [field, fixes] of Object.entries(TEXT_FIXES)) {
      let text = row[field] ?? '';
      for (const [from, to] of fixes) if (text.includes(from)) text = text.split(from).join(to);
      if (text !== (row[field] ?? '')) changes[field] = text;
    }

    if (!Object.keys(changes).length) {
      console.log(`${slug}: sin cambios (ya actualizado)`);
      continue;
    }
    console.log(`${slug}: ${DRY_RUN ? '[dry-run] cambiaría' : 'actualiza'} ${Object.keys(changes).join(', ')}`);
    for (const [k, v] of Object.entries(changes)) console.log(`   ${k}: ${JSON.stringify(row[k])} → ${JSON.stringify(v)}`);
    if (!DRY_RUN) {
      const sets = Object.keys(changes).map((k) => `\`${k}\` = ?`).join(', ');
      await conn.execute(`UPDATE \`services\` SET ${sets} WHERE id = ?`, [...Object.values(changes), row.id]);
    }
  }

  if (exists) {
    const [rows] = await conn.query("SELECT id, slug, price, homePrice FROM services WHERE type = 'masaje' ORDER BY id");
    console.table(rows);
  }
} finally {
  await conn.end();
}
