/**
 * create-masaje-integrativo-tantrico.mjs
 * Crea el servicio «Masaje Integrativo Tántrico 60 min» (120 €) como masaje NO PUBLICADO en la web
 * (visibleEnPublico = 0): no aparece en listados, ficha, sitemap ni reserva online; sí en el CRM.
 *
 * - Copia las características del «Masaje Integrativo 60 min» existente (tipo, modalidad, duración), sin
 *   copiar textos ni imágenes. Sin precio a domicilio.
 * - Idempotente: si ya existe un servicio con ese slug, no hace nada. Solo inserta una fila; no modifica ninguna.
 * - Requiere la migración 0026 (scripts/apply-0026-services-visible.mjs).
 *
 * Uso (con DATABASE_URL en el entorno o en .env):
 *   node scripts/create-masaje-integrativo-tantrico.mjs --dry-run
 *   node scripts/create-masaje-integrativo-tantrico.mjs
 */
import mysql2 from "mysql2/promise";
import { config } from "dotenv";

config();
const DRY_RUN = process.argv.includes("--dry-run");

const SLUG = "masaje_integrativo_tantrico_60";
const NAME = "Masaje Integrativo Tántrico 60 min";
const PRICE = "120.00";
const MINUTES = 60;
// Referencia de «mismas características»: el Masaje Integrativo 60 min (slug histórico «terapeutico»)
const REFERENCE_SLUG = "masaje_terapeutico_navas_de_rio_frio_segovia";

const conn = await mysql2.createConnection(process.env.DATABASE_URL);
try {
  const [[{ db }]] = await conn.query("SELECT DATABASE() AS db");
  console.log(`Base de datos: ${db}${DRY_RUN ? " (dry-run: no se escribe nada)" : ""}`);

  const [cols] = await conn.query(
    "SELECT COLUMN_NAME AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'services' AND COLUMN_NAME = 'visibleEnPublico'",
  );
  if (cols.length === 0) throw new Error("Falta la migración 0026 (services.visibleEnPublico): aplícala antes");

  const [existing] = await conn.query("SELECT id, name, status, visibleEnPublico FROM services WHERE slug = ?", [SLUG]);
  if (existing.length) {
    const e = existing[0];
    console.log(`  = Ya existe (id ${e.id}, «${e.name}», ${e.status}, ${e.visibleEnPublico ? "publicado" : "no publicado"}). Nada que hacer.`);
  } else {
    const [[ref]] = await conn.query("SELECT type, modality, durationLabel FROM services WHERE slug = ?", [REFERENCE_SLUG]);
    const [[{ maxOrder }]] = await conn.query("SELECT COALESCE(MAX(sortOrder), 0) AS maxOrder FROM services WHERE type = 'masaje'");
    const row = {
      slug: SLUG,
      name: NAME,
      price: PRICE,
      homePrice: null,
      durationMinutes: MINUTES,
      durationLabel: ref?.durationLabel || "60 min",
      type: "masaje",
      modality: ref?.modality || "presencial",
      featured: 0,
      status: "active",
      visibleEnPublico: 0,
      sortOrder: Number(maxOrder) + 1,
    };
    console.log(`  + INSERT services ${JSON.stringify(row)}`);
    if (!DRY_RUN) {
      const [res] = await conn.query("INSERT INTO services SET ?", [row]);
      console.log(`Creado: id ${res.insertId}.`);
    } else {
      console.log("Pendiente: 1 servicio.");
    }
  }
} finally {
  await conn.end();
}
