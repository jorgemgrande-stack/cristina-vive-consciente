/**
 * Seed: Migrar las 12 categorías existentes de productos afiliados
 * a la nueva tabla affiliate_categories.
 * Ejecutar: node seed-categorias.mjs
 */

import { createConnection } from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config();

const categories = [
  { name: "Suplementos y Remedios Naturales", description: "Suplementos, vitaminas y remedios naturales para la salud" },
  { name: "Champús y Geles", description: "Productos de higiene capilar y corporal naturales" },
  { name: "Gominolas y Caramelos", description: "Dulces naturales sin azúcar refinado" },
  { name: "Aceites y Vinagre", description: "Aceites y vinagres de calidad ecológica" },
  { name: "Endulzantes Naturales", description: "Alternativas naturales al azúcar refinado" },
  { name: "Bebidas y Refrescos", description: "Bebidas saludables y refrescos naturales" },
  { name: "Cremas Solares", description: "Protección solar natural y ecológica" },
  { name: "Pastas Dentífricas", description: "Higiene bucal natural y libre de tóxicos" },
  { name: "Desodorantes", description: "Desodorantes naturales sin aluminio" },
  { name: "Limpieza del Hogar", description: "Productos de limpieza ecológicos y biodegradables" },
  { name: "Cosmética Natural", description: "Cosmética libre de tóxicos y respetuosa con la piel" },
  { name: "Bebés y Niños", description: "Productos seguros y naturales para los más pequeños" },
];

function toSlug(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  const conn = await createConnection(process.env.DATABASE_URL);
  console.log("✅ Conectado a la base de datos");

  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    const slug = toSlug(cat.name);

    // Verificar si ya existe
    const [existing] = await conn.execute(
      "SELECT id FROM affiliate_categories WHERE slug = ?",
      [slug]
    );

    if (existing.length > 0) {
      console.log(`⏭  Ya existe: ${cat.name}`);
      skipped++;
      continue;
    }

    await conn.execute(
      "INSERT INTO affiliate_categories (name, slug, description, sortOrder, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, 'active', NOW(), NOW())",
      [cat.name, slug, cat.description, i]
    );
    console.log(`✅ Creada: ${cat.name}`);
    inserted++;
  }

  await conn.end();
  console.log(`\n🎉 Migración completada: ${inserted} creadas, ${skipped} ya existían`);
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
