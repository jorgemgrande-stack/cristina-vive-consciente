/**
 * seed-services.mjs
 * Migra los servicios existentes (consultas y masajes) a la nueva tabla `services`.
 * Se puede ejecutar varias veces de forma segura (INSERT IGNORE / ON DUPLICATE KEY).
 */
import mysql2 from 'mysql2/promise';
import { config } from 'dotenv';

config();

const SERVICES = [
  // ── CONSULTAS ────────────────────────────────────────────────────────────────
  {
    slug: 'consulta_acompanamiento',
    name: 'Consulta + Acompañamiento 21 días',
    shortDescription: 'Consulta integral con acompañamiento continuo hasta la implementación de un hábito.',
    description: 'Esta consulta incluye el contenido descrito en la consulta naturopata de 60 min y tiene un valor añadido que es clave: el acompañamiento continuo hasta la implementación de un hábito, este tipo de seguimiento ofrece a los clientes apoyo cercano mientras hacen los cambios, lo que aumenta su compromiso y resultados. Es una consulta integral donde se ven un compendio de diferentes cuestiones que conforman la biohabitabilidad.\n\nEste servicio integral incluye una consulta inicial en la que evaluaremos tu caso a fondo, con un estudio personalizado y recomendaciones concretas. Además, contarás con 21 días de seguimiento por WhatsApp donde te acompañaré a través de audios y/o por escrito para resolver dudas que vayan surgiendo. También recibirás lista de compra recomendada basada en tu dieta y cambios que consideremos oportunos, con recomendaciones de todo tipo de productos saludables y libres de tóxicos en áreas como: alimentación, utensilios de cocina, productos de limpieza, textil, cosmética, higiene electromagnética y lumínica.\n\nAdemás un PDF donde también incluiremos pautas de suplementación ideal para acompañar este estilo de vida.',
    price: '140.00',
    durationMinutes: 90,
    durationLabel: 'Consulta inicial + 21 días seguimiento',
    type: 'consulta',
    modality: 'ambos',
    imageUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/hero-consultas-VRAFvns5UX68Kqd64cBawH.webp',
    featured: 1,
    status: 'active',
    sortOrder: 1,
  },
  {
    slug: 'consulta_naturopata',
    name: 'Consulta Naturópata',
    shortDescription: 'Estudio del caso con anamnesis, análisis de dieta y recomendaciones personalizadas.',
    description: 'Sesión que dura mínimo 1 h y en función de la necesidad pudiendo ser más, donde se realiza un estudio del caso con anamnesis y análisis de dieta. Valoraremos posible mineralograma o análisis complementarios. Se requiere un registro de dieta 7 días antes de la consulta, donde el cliente interesado anotará lo que come y bebe durante este tiempo, de manera que podamos hacer cambios estructurales si así fuera conveniente.',
    price: '90.00',
    durationMinutes: 60,
    durationLabel: 'Mínimo 60 min',
    type: 'consulta',
    modality: 'ambos',
    imageUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/hero-consultas-VRAFvns5UX68Kqd64cBawH.webp',
    featured: 0,
    status: 'active',
    sortOrder: 2,
  },
  {
    slug: 'consulta_breve',
    name: 'Consulta Breve Naturopatía 30 min',
    shortDescription: 'Opción pensada para resolver dudas puntuales de forma rápida y económica.',
    description: 'Opción pensada para resolver dudas puntuales de forma rápida y económica. En esta consulta aclaramos inquietudes específicas sin necesidad de realizar anamnesis ni estudio de caso.\n\nSe realiza por vía telefónica o, si lo prefieres, por escrito (WhatsApp o email). La consulta es ideal para quienes necesitan una orientación breve y efectiva en una sola sesión. Las dudas se envían con antelación para optimizar el tiempo.',
    price: '30.00',
    durationMinutes: 30,
    durationLabel: '30 min',
    type: 'consulta',
    modality: 'online',
    imageUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/hero-consultas-VRAFvns5UX68Kqd64cBawH.webp',
    featured: 0,
    status: 'active',
    sortOrder: 3,
  },
  {
    slug: 'consulta_express',
    name: 'Consulta Express 20 min',
    shortDescription: 'Consulta rápida de orientación para una duda concreta.',
    description: 'Consulta express de 20 minutos para resolver una duda concreta o recibir orientación rápida sobre un tema específico de salud natural.',
    price: '20.00',
    durationMinutes: 20,
    durationLabel: '20 min',
    type: 'consulta',
    modality: 'online',
    imageUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/hero-consultas-VRAFvns5UX68Kqd64cBawH.webp',
    featured: 0,
    status: 'active',
    sortOrder: 4,
  },
  {
    slug: 'biohabitabilidad',
    name: 'Biohabitabilidad',
    shortDescription: 'Estudio del entorno doméstico para reducir tóxicos y mejorar la calidad del hogar.',
    description: 'Estudio integral del entorno doméstico para detectar y reducir fuentes de contaminación electromagnética, química y biológica. Incluye análisis del hogar y recomendaciones personalizadas para crear un espacio más saludable.',
    price: null,
    durationMinutes: 90,
    durationLabel: 'A consultar',
    type: 'consulta',
    modality: 'presencial',
    imageUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/hero-consultas-VRAFvns5UX68Kqd64cBawH.webp',
    featured: 0,
    status: 'active',
    sortOrder: 5,
  },
  {
    slug: 'kinesiologia',
    name: 'Kinesiología',
    shortDescription: 'Técnica de diagnóstico y equilibrio energético a través del músculo.',
    description: 'La kinesiología es una técnica que utiliza el músculo como indicador del estado energético del organismo. Permite detectar desequilibrios y trabajar sobre ellos de forma natural y no invasiva.',
    price: null,
    durationMinutes: 60,
    durationLabel: '60 min',
    type: 'consulta',
    modality: 'presencial',
    imageUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/hero-consultas-VRAFvns5UX68Kqd64cBawH.webp',
    featured: 0,
    status: 'active',
    sortOrder: 6,
  },
  // ── MASAJES ──────────────────────────────────────────────────────────────────
  {
    slug: 'masaje',
    name: 'Masaje Terapéutico',
    shortDescription: 'Técnica combinada de equilibrio energético + masaje con 8 aceites esenciales de grado terapéutico.',
    description: 'En la primera parte del masaje recuperamos el equilibrio del campo electromagnético, reconectando cuerpo, mente y espíritu. La sanación energética restaura el flujo de energía primordial.\n\nEn la segunda parte del masaje usaremos la técnica aromatouch, aplicada a través de los meridianos. Contrarresta el estrés, apoya el sistema inmunológico, para la inflamación, el dolor y el desequilibrio de los sistemas del organismo.',
    price: null,
    durationMinutes: 60,
    durationLabel: '1 hora',
    type: 'masaje',
    modality: 'presencial',
    imageUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/hero-masajes-PUiFsGVb8gAs6i4s8VF7U8.webp',
    featured: 1,
    status: 'active',
    sortOrder: 1,
  },
];

async function main() {
  const conn = await mysql2.createConnection(process.env.DATABASE_URL);
  
  console.log('Migrando servicios a la tabla services...\n');
  
  let inserted = 0;
  let skipped = 0;
  
  for (const s of SERVICES) {
    try {
      const [result] = await conn.execute(
        `INSERT INTO services 
          (slug, name, shortDescription, description, price, durationMinutes, durationLabel, type, modality, imageUrl, featured, status, sortOrder)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           shortDescription = VALUES(shortDescription),
           description = VALUES(description),
           price = VALUES(price),
           durationMinutes = VALUES(durationMinutes),
           durationLabel = VALUES(durationLabel),
           type = VALUES(type),
           modality = VALUES(modality),
           imageUrl = VALUES(imageUrl),
           featured = VALUES(featured),
           status = VALUES(status),
           sortOrder = VALUES(sortOrder)`,
        [
          s.slug, s.name, s.shortDescription, s.description,
          s.price, s.durationMinutes, s.durationLabel,
          s.type, s.modality, s.imageUrl, s.featured, s.status, s.sortOrder
        ]
      );
      
      if (result.affectedRows === 1) {
        console.log(`✓ Insertado: ${s.name}`);
        inserted++;
      } else if (result.affectedRows === 2) {
        console.log(`↺ Actualizado: ${s.name}`);
        skipped++;
      } else {
        console.log(`○ Sin cambios: ${s.name}`);
        skipped++;
      }
    } catch (err) {
      console.error(`✗ Error en ${s.slug}: ${err.message}`);
    }
  }
  
  await conn.end();
  
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Completado: ${inserted} insertados, ${skipped} actualizados/sin cambios`);
  
  // Verificar
  const conn2 = await mysql2.createConnection(process.env.DATABASE_URL);
  const [rows] = await conn2.execute('SELECT id, slug, name, type, price, status FROM services ORDER BY type, sortOrder');
  console.log('\nServicios en BD:');
  for (const r of rows) {
    console.log(`  [${r.type}] ${r.name} — ${r.price ? r.price + '€' : 'precio a consultar'} (${r.status})`);
  }
  await conn2.end();
}

main().catch(console.error);
