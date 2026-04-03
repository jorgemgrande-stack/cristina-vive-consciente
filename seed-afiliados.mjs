/**
 * seed-afiliados.mjs
 * Migración de productos afiliados desde Shopify → base de datos local
 * Uso: node seed-afiliados.mjs
 */

import { createConnection } from "mysql2/promise";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dotenv from "dotenv";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

// Limpiar nombres de producto (quitan precios incrustados en el nombre de Shopify)
function cleanName(name) {
  return name
    .replace(/\s+\d+[\.,]?\d*\s*€/g, "")
    .replace(/\s+\d+€/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

const productos = JSON.parse(
  readFileSync("/tmp/productos_afiliados.json", "utf-8")
);

async function seed() {
  const conn = await createConnection(process.env.DATABASE_URL);

  console.log(`\n🌱 Iniciando migración de ${productos.length} productos afiliados...\n`);

  const stats = {};
  let inserted = 0;
  let skipped = 0;

  for (const p of productos) {
    const nombre = cleanName(p.nombre);
    const categoria = p.categoria;

    if (!stats[categoria]) stats[categoria] = { inserted: 0, skipped: 0 };

    // Verificar si ya existe (por nombre + categoría)
    const [existing] = await conn.execute(
      "SELECT id FROM affiliate_products WHERE name = ? AND category = ?",
      [nombre, categoria]
    );

    if (existing.length > 0) {
      stats[categoria].skipped++;
      skipped++;
      continue;
    }

    // Limpiar imagen URL (Shopify añade parámetros, quedarnos con la base)
    let imagenUrl = p.imagen_url || "";
    if (imagenUrl.includes("?")) {
      imagenUrl = imagenUrl.split("?")[0];
    }

    // Limpiar enlace afiliado
    let enlace = p.enlace_afiliado || "";

    await conn.execute(
      `INSERT INTO affiliate_products 
        (name, description, imageUrl, category, affiliateUrl, provider, status, sortOrder, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, 'active', ?, NOW(), NOW())`,
      [
        nombre,
        p.descripcion || "",
        imagenUrl,
        categoria,
        enlace,
        p.proveedor || "",
        p.orden || 1,
      ]
    );

    stats[categoria].inserted++;
    inserted++;
  }

  await conn.end();

  console.log("📊 Resumen por categoría:");
  console.log("─".repeat(60));
  for (const [cat, s] of Object.entries(stats)) {
    const total = s.inserted + s.skipped;
    console.log(`  ${cat.padEnd(40)} ${s.inserted} insertados, ${s.skipped} ya existían`);
  }
  console.log("─".repeat(60));
  console.log(`\n✅ Total insertados: ${inserted}`);
  console.log(`⏭️  Total omitidos (ya existían): ${skipped}`);
  console.log("\n⚠️  Categorías pendientes de completar manualmente:");
  console.log("  - Cereales, Pan y Pasta (0 productos en Shopify)");
  console.log("  - Legumbres y Semillas (0 productos en Shopify)");
  console.log("  - Iluminación y Biorritmos (0 productos en Shopify)");
  console.log("\n✅ El módulo sigue siendo de AFILIACIÓN — sin carrito ni checkout.\n");
}

seed().catch((err) => {
  console.error("❌ Error durante la migración:", err);
  process.exit(1);
});
