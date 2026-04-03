/**
 * Seed: Migrar ebooks hardcodeados en products.ts a la tabla ebooks en BD
 */
import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config();

const db = await mysql.createConnection(process.env.DATABASE_URL);

const ebooks = [
  {
    slug: "agua",
    title: "Guía Digital del Agua",
    subtitle: "Transforma el agua que bebes",
    description: "Todo lo que necesitas saber sobre el agua estructurada: qué es, cómo funciona, cómo prepararla en casa y por qué puede transformar tu salud. Incluye protocolos prácticos y recomendaciones de uso diario. Incluye sesión de 30 minutos con Cristina para resolver tus dudas.",
    price: "12.00",
    priceCents: 1200,
    currency: "EUR",
    stripePriceId: null,
    pdfUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/ebook-agua_83415515.pdf",
    coverImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/hero-agua-BJHXyW4FibywwKgaqzvu2q.webp",
    galleryImages: JSON.stringify([
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/hero-agua-BJHXyW4FibywwKgaqzvu2q.webp",
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/hero-main-T6UmVzyg8XHyq4zLvU5RfZ.webp",
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/hero-consultas-VRAFvns5UX68Kqd64cBawH.webp"
    ]),
    downloadExpiryHours: 72,
    crmTag: "comprador_ebook_agua",
    includesSession: 1,
    status: "active",
    sortOrder: 1,
  },
  {
    slug: "aceites",
    title: "Guía de Aceites Esenciales",
    subtitle: "La sabiduría de las plantas en tu vida diaria",
    description: "Aprende a usar los aceites esenciales de forma segura y efectiva: aromaterapia, aplicación tópica, uso interno, combinaciones y protocolos para las situaciones más comunes del día a día. Una guía práctica para integrar el poder de las plantas en tu rutina de bienestar.",
    price: "7.00",
    priceCents: 700,
    currency: "EUR",
    stripePriceId: null,
    pdfUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/ebook-aceites_ac7d8e5a.pdf",
    coverImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/hero-aceites-cn5cmPNwkFkzA35ejtXJUa.webp",
    galleryImages: JSON.stringify([
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/hero-aceites-cn5cmPNwkFkzA35ejtXJUa.webp",
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/hero-main-T6UmVzyg8XHyq4zLvU5RfZ.webp",
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/hero-masajes-PUiFsGVb8gAs6i4s8VF7U8.webp"
    ]),
    downloadExpiryHours: 72,
    crmTag: "comprador_ebook_aceites",
    includesSession: 0,
    status: "active",
    sortOrder: 2,
  },
];

for (const ebook of ebooks) {
  // Verificar si ya existe
  const [existing] = await db.execute("SELECT id FROM ebooks WHERE slug = ?", [ebook.slug]);
  if (existing.length > 0) {
    console.log(`⏭  Ebook '${ebook.slug}' ya existe, actualizando...`);
    await db.execute(
      `UPDATE ebooks SET title=?, subtitle=?, description=?, price=?, priceCents=?, currency=?,
       stripePriceId=?, pdfUrl=?, coverImage=?, galleryImages=?, downloadExpiryHours=?,
       crmTag=?, includesSession=?, status=?, sortOrder=? WHERE slug=?`,
      [ebook.title, ebook.subtitle, ebook.description, ebook.price, ebook.priceCents,
       ebook.currency, ebook.stripePriceId, ebook.pdfUrl, ebook.coverImage,
       ebook.galleryImages, ebook.downloadExpiryHours, ebook.crmTag,
       ebook.includesSession, ebook.status, ebook.sortOrder, ebook.slug]
    );
  } else {
    console.log(`✅ Insertando ebook '${ebook.slug}'...`);
    await db.execute(
      `INSERT INTO ebooks (slug, title, subtitle, description, price, priceCents, currency,
       stripePriceId, pdfUrl, coverImage, galleryImages, downloadExpiryHours,
       crmTag, includesSession, status, sortOrder)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [ebook.slug, ebook.title, ebook.subtitle, ebook.description, ebook.price,
       ebook.priceCents, ebook.currency, ebook.stripePriceId, ebook.pdfUrl,
       ebook.coverImage, ebook.galleryImages, ebook.downloadExpiryHours,
       ebook.crmTag, ebook.includesSession, ebook.status, ebook.sortOrder]
    );
  }
}

const [rows] = await db.execute("SELECT id, slug, title, price FROM ebooks ORDER BY sortOrder");
console.log("\n📚 Ebooks en BD:");
rows.forEach(r => console.log(`  [${r.id}] ${r.slug} — ${r.title} — ${r.price}€`));

await db.end();
console.log("\n✅ Seed completado.");
