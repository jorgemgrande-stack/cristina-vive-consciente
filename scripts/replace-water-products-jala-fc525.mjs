/**
 * replace-water-products-jala-fc525.mjs
 * Sustituye el catálogo de Sistemas de Agua: oculta Awaes Direct Premium y Óptima
 * Compact (no se borran, solo se ocultan) y da de alta Jala 2.0 y FC 525.
 * Ejecutar: node scripts/replace-water-products-jala-fc525.mjs
 */

import "dotenv/config";
import mysql from "mysql2/promise";

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log("🙈 Ocultando productos actuales (Awaes Direct Premium, Óptima Compact)...");
const [hideResult] = await connection.execute(
  `UPDATE water_products SET visibleEnPublico = 0, destacadoEnHome = 0
   WHERE slug IN ('awaes-direct-premium', 'optima-compact')`
);
console.log(`  ✅ ${hideResult.affectedRows} producto(s) ocultado(s)\n`);

// ─── CATEGORÍA NUEVA: FUENTES ──────────────────────────────────────────────────
console.log("📁 Comprobando categoría 'Fuentes'...");
let fuentesCategoryId;
const [existingCat] = await connection.execute(
  "SELECT id FROM water_categories WHERE slug = ?",
  ["fuentes"]
);
if (existingCat.length > 0) {
  fuentesCategoryId = existingCat[0].id;
  console.log(`  ⏭  Ya existe (id: ${fuentesCategoryId})\n`);
} else {
  const [catResult] = await connection.execute(
    `INSERT INTO water_categories (name, slug, shortDescription, icon, sortOrder, visibleEnPublico, status, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      "Fuentes",
      "fuentes",
      "Fuentes de agua fría, natural y caliente para oficinas, comercios y espacios de uso continuado.",
      "🚰",
      5,
      1,
      "active",
    ]
  );
  fuentesCategoryId = catResult.insertId;
  console.log(`  ✅ Categoría "Fuentes" creada (id: ${fuentesCategoryId})\n`);
}

const [osmosisCat] = await connection.execute(
  "SELECT id FROM water_categories WHERE slug = 'osmosis-inversa'"
);
const osmosisCategoryId = osmosisCat[0]?.id ?? null;

// ─── PRODUCTOS NUEVOS ───────────────────────────────────────────────────────────

const products = [
  {
    title: "Jala 2.0",
    slug: "jala-2-0",
    subtitle: "Purificador de flujo directo con remineralización y pH equilibrado",
    categoryId: osmosisCategoryId,
    shortDescription:
      "Jala 2.0 es un purificador de flujo directo que ofrece agua de máxima calidad, libre de residuos físicos, microplásticos, químicos y bacteriológicos.",
    longDescription:
      "Jala 2.0 es un purificador de flujo directo que ofrece agua de máxima calidad, libre de residuos físicos, microplásticos, químicos y bacteriológicos.\n\nGracias a su filtro remineralizador, el agua obtiene un pH equilibrado de 5,5, ideal para beber, cocinar y mejorar el sabor de los alimentos. Su sistema automático de limpieza, su detector digital de calidad y su grifo inteligente convierten este equipo en una solución eficiente, segura y muy cómoda para cualquier hogar.",
    claimsHighlighted: JSON.stringify([
      "Produce agua saludable al instante, sin acumulación",
      "Filtro remineralizador con pH equilibrado de 5,5",
      "Limpieza automática de membrana cada 24 horas",
      "Detector de fugas Aquastop",
      "Menor rechazo de agua: solo 0,7 L por litro producido",
      "Equipo compacto y de diseño moderno",
    ]),
    benefits: JSON.stringify([
      "Produce agua saludable al instante sin acumulación, evitando bacterias y virus.",
      "Limpieza automática de membrana cada 24 horas para prolongar su vida útil.",
      "Detector de fugas Aquastop que bloquea el equipo ante cualquier incidencia.",
      "Menor rechazo de agua: solo 0,7 L por litro producido.",
      "Mejora el sabor de alimentos, bebidas y preparaciones culinarias.",
      "Equipo compacto, fácil de instalar y de diseño moderno.",
    ]),
    forWhom:
      "Ideal para cocinas y hogares que buscan agua de máxima pureza, con buen sabor y pH equilibrado, en un equipo compacto y de instalación sencilla.",
    priceVisible: null,
    priceOrientative: "Consulta precio y disponibilidad con Cristina.",
    badge: null,
    badgeColor: null,
    technicalSpecs: JSON.stringify([
      { key: "Tipo de sistema", value: "Ósmosis de flujo directo" },
      { key: "Capacidad de membrana", value: "800 GPD" },
      { key: "Producción", value: "2,2 L/min en tiempo real" },
      { key: "Sistema de purificación", value: "Intelligent Purify con medidor digital de calidad del agua" },
      { key: "Etapas", value: "Sedimentos y químicos → membrana RO → remineralización" },
      { key: "Grifo", value: "Acero inoxidable con aviso LED de cambio de filtros" },
      { key: "Dimensiones", value: "38 cm (alto) × 39 cm (fondo) × 13 cm (ancho)" },
    ]),
    ctaPrimaryLabel: "Solicitar presupuesto",
    ctaSecondaryLabel: "Conocer más detalles",
    seoTitle: "Jala 2.0 — Purificador de agua de flujo directo | Cristina Vive Consciente",
    seoDescription:
      "Jala 2.0, purificador de ósmosis de flujo directo con remineralización y pH equilibrado. Agua de máxima calidad, libre de residuos, microplásticos y químicos.",
    sortOrder: 1,
    visibleEnPublico: 1,
    destacadoEnHome: 1,
    productoPrincipal: 1,
    status: "active",
  },
  {
    title: "FC 525",
    slug: "fc-525",
    subtitle: "Fuente de ultrafiltración con agua fría, natural y caliente",
    categoryId: fuentesCategoryId,
    shortDescription:
      "La FC 525 UF es una fuente de ultrafiltración robusta y funcional que ofrece agua fría, natural y caliente con una alta capacidad de acumulación.",
    longDescription:
      "La FC 525 UF es una fuente de ultrafiltración robusta y funcional que ofrece agua fría, natural y caliente con una alta capacidad de acumulación.\n\nDiseñada para oficinas, comercios y espacios de uso continuado, combina comodidad, seguridad e higiene en un equipo estable y de larga duración.",
    claimsHighlighted: JSON.stringify([
      "Agua fría, natural y caliente en un solo equipo",
      "Ultrafiltración de alto rendimiento",
      "Alta capacidad de acumulación para uso intensivo",
      "Protección higiénica en la salida de los grifos",
      "Compatible con botellas y recipientes grandes",
    ]),
    benefits: JSON.stringify([
      "Agua purificada mediante ultrafiltración de alto rendimiento.",
      "Tres temperaturas para beber, cocinar o preparar bebidas calientes.",
      "Alta capacidad de depósito y enfriamiento para uso intensivo.",
      "Protección higiénica en la salida de los grifos.",
      "Compatible con botellas y recipientes grandes.",
    ]),
    forWhom:
      "Diseñada para oficinas, comercios y espacios de uso continuado que necesitan agua fría, natural y caliente con alta capacidad e higiene garantizada.",
    priceVisible: null,
    priceOrientative: "Consulta precio y disponibilidad con Cristina.",
    badge: null,
    badgeColor: null,
    technicalSpecs: JSON.stringify([
      { key: "Control térmico", value: "Termostato 4–13 °C" },
      { key: "Sistema", value: "Ultrafiltración" },
      { key: "Capacidad total", value: "5 L (4 L agua fría / 1 L caliente)" },
      { key: "Refrigeración", value: "Bomba de calor" },
      { key: "Potencia compresor", value: "85 W" },
      { key: "Potencia calentamiento", value: "400 W" },
      { key: "Presión de entrada", value: "1–6 bar" },
      { key: "Temperatura de entrada", value: "5–40 °C" },
      { key: "Alimentación", value: "220–240 VAC" },
      { key: "Dimensiones", value: "126 cm alto × 39 cm fondo × 30 cm ancho" },
      { key: "Peso", value: "25 kg" },
    ]),
    ctaPrimaryLabel: "Solicitar presupuesto",
    ctaSecondaryLabel: "Conocer más detalles",
    seoTitle: "FC 525 — Fuente de agua por ultrafiltración | Cristina Vive Consciente",
    seoDescription:
      "FC 525 UF, fuente de ultrafiltración con agua fría, natural y caliente. Ideal para oficinas, comercios y espacios de uso continuado.",
    sortOrder: 2,
    visibleEnPublico: 1,
    destacadoEnHome: 1,
    productoPrincipal: 0,
    status: "active",
  },
];

console.log("📦 Insertando productos nuevos...");
for (const p of products) {
  const [existing] = await connection.execute("SELECT id FROM water_products WHERE slug = ?", [p.slug]);
  if (existing.length > 0) {
    console.log(`  ⏭  "${p.title}" ya existe (id: ${existing[0].id}), no se reinserta`);
    continue;
  }

  const [result] = await connection.execute(
    `INSERT INTO water_products
     (title, slug, subtitle, categoryId, shortDescription, longDescription,
      claimsHighlighted, benefits, forWhom, priceVisible, priceOrientative,
      badge, badgeColor, technicalSpecs, ctaPrimaryLabel, ctaSecondaryLabel,
      seoTitle, seoDescription, sortOrder, visibleEnPublico, destacadoEnHome,
      productoPrincipal, status, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      p.title, p.slug, p.subtitle, p.categoryId, p.shortDescription, p.longDescription,
      p.claimsHighlighted, p.benefits, p.forWhom, p.priceVisible, p.priceOrientative,
      p.badge, p.badgeColor, p.technicalSpecs, p.ctaPrimaryLabel, p.ctaSecondaryLabel,
      p.seoTitle, p.seoDescription, p.sortOrder, p.visibleEnPublico, p.destacadoEnHome,
      p.productoPrincipal, p.status,
    ]
  );
  console.log(`  ✅ "${p.title}" creado (id: ${result.insertId}, slug: /sistemas-agua/${p.slug})`);
}

await connection.end();
console.log("\n✨ Listo.");
