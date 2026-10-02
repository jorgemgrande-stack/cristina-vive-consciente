/**
 * seed-masaje-relajante.mjs
 * Crea/actualiza el servicio "Masaje Relajante" en la tabla `services`.
 * Idempotente: INSERT ... ON DUPLICATE KEY UPDATE por slug.
 * Uso: node seed-masaje-relajante.mjs            (DATABASE_URL del .env)
 *      node seed-masaje-relajante.mjs --dry-run  (solo muestra lo que haría, sin escribir)
 */
import mysql2 from 'mysql2/promise';
import { config } from 'dotenv';

config();

const DRY_RUN = process.argv.includes('--dry-run');

const SERVICE = {
  slug: 'masaje_relajante_navas_de_rio_frio_segovia',
  name: 'Masaje Relajante',
  shortDescription:
    'Un espacio de calma y desconexión para liberar las tensiones del día a día y disfrutar de una experiencia de bienestar corporal.',
  longDescription: [
    'La sesión comienza con un pequeño ritual sensorial de bienvenida, en el que podrás descubrir tres aromas naturales y elegir aquel que más te guste.',
    'A continuación, disfrutarás de un masaje relajante de cuerpo completo, realizado mediante movimientos lentos, fluidos y envolventes, combinando diferentes maniobras y adaptando la presión a tus preferencias.',
    'La combinación del tacto, el ritmo pausado y la aromaterapia invita a desconectar del exterior, favorecer la relajación y disfrutar plenamente del momento presente.',
    'Modalidad: en consulta, en Navas de Riofrío (Segovia), o a domicilio. Para el servicio a domicilio, consultar tarifas y disponibilidad.',
  ].join('\n\n'),
  price: '70.00',
  durationMinutes: 45,
  durationLabel: '45 min',
  type: 'masaje',
  modality: 'presencial',
  imageUrl: null,
  detailImage: null,
  includes: [
    'Ritual sensorial de bienvenida con tres aromas naturales',
    'Masaje relajante de cuerpo completo (45 min)',
    'Presión adaptada a tus preferencias',
    'En consulta: 70 € · A domicilio: 100 €',
  ],
  benefits: [
    'Un momento de calma y desconexión',
    'Movimientos lentos, fluidos y envolventes',
    'Aromaterapia adaptada a tus gustos',
    'Opción de masaje sin fragancias',
  ],
  contraindications:
    'La utilización de aceites esenciales se adapta a las preferencias y sensibilidades individuales, con posibilidad de realizar el masaje sin fragancias.',
  featured: 0,
  status: 'active',
};

const conn = await mysql2.createConnection(process.env.DATABASE_URL);
try {
  // sortOrder: detrás de los masajes existentes (mínimo 2)
  const [rows] = await conn.execute(
    "SELECT COALESCE(MAX(sortOrder), 0) AS maxOrder FROM services WHERE type = 'masaje' AND slug <> ?",
    [SERVICE.slug]
  );
  const sortOrder = Math.max(2, Number(rows[0].maxOrder) + 1);
  console.log(`sortOrder calculado: ${sortOrder}`);

  if (DRY_RUN) {
    console.log('[dry-run] No se escribe nada. Datos:', { ...SERVICE, sortOrder });
  } else {
    await conn.execute(
      `INSERT INTO services
        (slug, name, shortDescription, longDescription, price, durationMinutes, durationLabel, type, modality,
         imageUrl, detailImage, benefits, includes, contraindications, featured, status, sortOrder)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         shortDescription = VALUES(shortDescription),
         longDescription = VALUES(longDescription),
         price = VALUES(price),
         durationMinutes = VALUES(durationMinutes),
         durationLabel = VALUES(durationLabel),
         type = VALUES(type),
         modality = VALUES(modality),
         benefits = VALUES(benefits),
         includes = VALUES(includes),
         contraindications = VALUES(contraindications),
         featured = VALUES(featured),
         status = VALUES(status),
         sortOrder = VALUES(sortOrder)`,
      [
        SERVICE.slug, SERVICE.name, SERVICE.shortDescription, SERVICE.longDescription, SERVICE.price,
        SERVICE.durationMinutes, SERVICE.durationLabel, SERVICE.type, SERVICE.modality,
        SERVICE.imageUrl, SERVICE.detailImage,
        JSON.stringify(SERVICE.benefits), JSON.stringify(SERVICE.includes), SERVICE.contraindications,
        SERVICE.featured, SERVICE.status, sortOrder,
      ]
    );
    console.log('✓ Servicio upserted:', SERVICE.slug);
  }

  const [check] = await conn.execute(
    "SELECT id, slug, name, type, modality, price, status, sortOrder FROM services WHERE type = 'masaje' ORDER BY sortOrder"
  );
  console.table(check);
} finally {
  await conn.end();
}
