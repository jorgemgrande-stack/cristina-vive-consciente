import { createConnection } from "mysql2/promise";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dotenv from "dotenv";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(join(__dirname, "blog_export.json"), "utf-8"));

async function seed() {
  const conn = await createConnection(process.env.DATABASE_URL);

  // 1. Insertar categorías y guardar slug → id
  console.log(`\n📂 Insertando ${data.categories.length} categorías...\n`);
  const categoryMap = {};

  for (const cat of data.categories) {
    const [existing] = await conn.execute(
      "SELECT id FROM blog_categories WHERE slug = ?", [cat.slug]
    );
    if (existing.length > 0) {
      categoryMap[cat.slug] = existing[0].id;
      console.log(`  ⏭️  Ya existe: ${cat.name}`);
      continue;
    }
    const [result] = await conn.execute(
      `INSERT INTO blog_categories (name, slug, description, sortOrder, createdAt)
       VALUES (?, ?, ?, ?, NOW())`,
      [cat.name, cat.slug, cat.description || "", cat.sortOrder ?? 0]
    );
    categoryMap[cat.slug] = result.insertId;
    console.log(`  ✅ Creada: ${cat.name}`);
  }

  // 2. Insertar posts
  console.log(`\n📝 Insertando ${data.posts.length} artículos...\n`);
  let inserted = 0, skipped = 0;

  for (const post of data.posts) {
    const [existing] = await conn.execute(
      "SELECT id FROM blog_posts WHERE slug = ?", [post.slug]
    );
    if (existing.length > 0) {
      console.log(`  ⏭️  Ya existe: ${post.title}`);
      skipped++;
      continue;
    }

    const categoryId = categoryMap[post.categorySlug] ?? null;

    await conn.execute(
      `INSERT INTO blog_posts
        (title, slug, excerpt, content, coverImage, featuredImage, author,
         writtenAt, categoryId, readTimeMinutes, featured, status, sortOrder,
         publishedAt, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        post.title,
        post.slug,
        post.excerpt || "",
        post.content || "",
        post.coverImage || "",
        post.featuredImage || "",
        post.author || "Cristina",
        post.writtenAt ? new Date(post.writtenAt) : null,
        categoryId,
        post.readTimeMinutes ?? 5,
        post.featured ?? 0,
        post.status ?? "published",
        post.sortOrder ?? 0,
        post.publishedAt ? new Date(post.publishedAt) : null,
      ]
    );
    console.log(`  ✅ Insertado: ${post.title}`);
    inserted++;
  }

  await conn.end();

  console.log(`\n${"─".repeat(50)}`);
  console.log(`✅ Artículos insertados: ${inserted}`);
  console.log(`⏭️  Omitidos (ya existían): ${skipped}`);
  console.log(`📂 Categorías mapeadas: ${Object.keys(categoryMap).length}\n`);
}

seed().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
