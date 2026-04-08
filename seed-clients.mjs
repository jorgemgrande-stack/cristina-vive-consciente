import { createConnection } from "mysql2/promise";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dotenv from "dotenv";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const clients = JSON.parse(readFileSync(join(__dirname, "clients_seed.json"), "utf-8"));

async function seed() {
  const conn = await createConnection(process.env.DATABASE_URL);

  console.log(`\n👥 Insertando ${clients.length} clientes...\n`);
  let inserted = 0, skipped = 0;

  for (const c of clients) {
    // Evitar duplicados por email o por nombre+apellido
    const [existing] = await conn.execute(
      "SELECT id FROM clients WHERE (email = ? AND email IS NOT NULL AND email != '') OR (firstName = ? AND lastName = ?)",
      [c.email || "", c.firstName, c.lastName]
    );
    if (existing.length > 0) {
      console.log(`  ⏭️  Ya existe: ${c.firstName} ${c.lastName}`);
      skipped++;
      continue;
    }

    await conn.execute(
      `INSERT INTO clients
        (firstName, lastName, email, phone, status, birthDate, address, postalCode,
         city, province, country, nif, razonSocial, notes, referredBy, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        c.firstName,
        c.lastName,
        c.email || null,
        c.phone || null,
        c.status || "active",
        c.birthDate || null,
        c.address || null,
        c.postalCode || null,
        c.city || null,
        c.province || null,
        c.country || "España",
        c.nif || null,
        c.razonSocial || null,
        c.notes || null,
        c.referredBy || null,
        c.createdAt ? new Date(c.createdAt) : new Date(),
      ]
    );
    console.log(`  ✅ ${c.firstName} ${c.lastName}`);
    inserted++;
  }

  await conn.end();
  console.log(`\n${"─".repeat(50)}`);
  console.log(`✅ Clientes insertados: ${inserted}`);
  console.log(`⏭️  Omitidos (ya existían): ${skipped}\n`);
}

seed().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
