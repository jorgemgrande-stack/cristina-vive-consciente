/**
 * Script de importación de clientes desde CSV de Shopify
 * Uso: node import-customers.mjs
 *
 * Limpieza aplicada:
 * - Omite filas sin email Y sin teléfono (sin forma de contacto)
 * - Omite emails de spam/prueba (protonmail.com con patrón mail+números, inscrlab.com, ilovemyemail.net)
 * - Omite emails claramente de prueba (123Hannah..., tall.bay386...)
 * - Deduplica por email (conserva el registro con más gasto)
 * - Limpia el prefijo ' de los IDs de Shopify
 * - Normaliza teléfonos (quita el prefijo ' de Shopify)
 */

import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const mysql = require("mysql2/promise");

// ── Leer y parsear CSV ────────────────────────────────────────────────────────
const csvPath = "/home/ubuntu/upload/customers_export.csv";
const raw = fs.readFileSync(csvPath, "utf-8");

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

const lines = raw.split("\n").filter((l) => l.trim());
const headers = parseCSVLine(lines[0]);
const rows = lines.slice(1).map((line) => {
  const values = parseCSVLine(line);
  const obj = {};
  headers.forEach((h, i) => {
    obj[h] = (values[i] || "").replace(/^'/, "").trim(); // quitar prefijo '
  });
  return obj;
});

// ── Detectar spam / prueba ────────────────────────────────────────────────────
function isSpamEmail(email) {
  if (!email) return false;
  const lower = email.toLowerCase();
  // Emails de prueba con patrón mail+números@protonmail.com
  if (/^mail\d+@protonmail\.com$/.test(lower)) return true;
  // Spam conocido
  if (lower.includes("inscrlab.com")) return true;
  if (lower.includes("ilovemyemail.net")) return true;
  if (lower.startsWith("123hannah")) return true;
  if (lower.startsWith("tall.bay386")) return true;
  return false;
}

// ── Normalizar teléfono ───────────────────────────────────────────────────────
function normalizePhone(phone) {
  if (!phone) return null;
  // Quitar prefijo ' y espacios
  return phone.replace(/^'+/, "").replace(/\s+/g, "").trim() || null;
}

// ── Construir nombre completo ─────────────────────────────────────────────────
function buildName(firstName, lastName) {
  const parts = [firstName, lastName].filter(Boolean);
  return parts.join(" ").trim() || null;
}

// ── Procesar filas ────────────────────────────────────────────────────────────
const processed = [];
const skipped = { spam: 0, noContact: 0 };

for (const row of rows) {
  const email = row["Email"] || "";
  const phone =
    normalizePhone(row["Phone"]) ||
    normalizePhone(row["Default Address Phone"]);
  const firstName = row["First Name"] || "";
  const lastName = row["Last Name"] || "";
  const name = buildName(firstName, lastName);
  const totalSpent = parseFloat(row["Total Spent"] || "0");
  const totalOrders = parseInt(row["Total Orders"] || "0", 10);
  const city = row["Default Address City"] || "";
  const province = row["Default Address Province Code"] || "";
  const country = row["Default Address Country Code"] || "ES";
  const zip = row["Default Address Zip"] || "";
  const address1 = row["Default Address Address1"] || "";
  const address2 = row["Default Address Address2"] || "";
  const tags = row["Tags"] || "";
  const note = row["Note"] || "";
  const shopifyId = row["Customer ID"] || "";

  // Omitir spam
  if (isSpamEmail(email)) {
    skipped.spam++;
    continue;
  }

  // Omitir sin ninguna forma de contacto
  if (!email && !phone) {
    skipped.noContact++;
    continue;
  }

  // Determinar tag CRM
  let crmTag = "shopify";
  if (tags.toLowerCase().includes("newsletter")) crmTag = "newsletter";
  if (totalOrders > 0) crmTag = "cliente";

  // Construir dirección
  const addressParts = [address1, address2, city, zip, province, country]
    .filter(Boolean)
    .join(", ");

  processed.push({
    shopifyId,
    name: name || email.split("@")[0] || "Sin nombre",
    email: email.toLowerCase() || null,
    phone,
    address: addressParts || null,
    city: city || null,
    tags: crmTag,
    notes: [
      note ? `Nota Shopify: ${note}` : null,
      totalOrders > 0 ? `Pedidos en Shopify: ${totalOrders} (${totalSpent}€)` : null,
      shopifyId ? `ID Shopify: ${shopifyId}` : null,
    ]
      .filter(Boolean)
      .join(" | ") || null,
    status: "active",
    source: "shopify",
    totalSpent,
    totalOrders,
  });
}

// ── Deduplicar por email ──────────────────────────────────────────────────────
const byEmail = new Map();
const noEmailList = [];

for (const c of processed) {
  if (c.email) {
    const existing = byEmail.get(c.email);
    if (!existing || c.totalSpent > existing.totalSpent) {
      byEmail.set(c.email, c);
    }
  } else {
    noEmailList.push(c);
  }
}

const finalList = [...byEmail.values(), ...noEmailList];

console.log(`\n📊 Resumen de procesamiento:`);
console.log(`   Total filas CSV: ${rows.length}`);
console.log(`   Omitidos (spam/prueba): ${skipped.spam}`);
console.log(`   Omitidos (sin contacto): ${skipped.noContact}`);
console.log(`   Duplicados eliminados: ${processed.length - finalList.length}`);
console.log(`   ✅ Clientes a importar: ${finalList.length}\n`);

// ── Ver columnas de la tabla clients ─────────────────────────────────────────
async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  // Ver columnas disponibles
  const [cols] = await conn.query("DESCRIBE clients");
  const colNames = cols.map((c) => c.Field);
  console.log("Columnas disponibles en clients:", colNames);

  // Ver cuántos clientes hay ya
  const [existing] = await conn.query("SELECT COUNT(*) as cnt FROM clients");
  console.log(`Clientes existentes en BD: ${existing[0].cnt}`);

  // Obtener emails existentes para no duplicar
  const [existingEmails] = await conn.query(
    "SELECT email FROM clients WHERE email IS NOT NULL"
  );
  const existingEmailSet = new Set(
    existingEmails.map((r) => r.email?.toLowerCase()).filter(Boolean)
  );
  console.log(`Emails ya en BD: ${existingEmailSet.size}`);

  // Filtrar los que ya existen
  const toInsert = finalList.filter(
    (c) => !c.email || !existingEmailSet.has(c.email.toLowerCase())
  );
  console.log(`Clientes nuevos a insertar: ${toInsert.length}`);

  if (toInsert.length === 0) {
    console.log("✅ No hay clientes nuevos que insertar.");
    await conn.end();
    return;
  }

  // Insertar en lotes de 20
  let inserted = 0;
  let errors = 0;
  const batchSize = 20;

  for (let i = 0; i < toInsert.length; i += batchSize) {
    const batch = toInsert.slice(i, i + batchSize);
    for (const c of batch) {
      try {
        // Mapear campos según columnas disponibles
        // Separar nombre en firstName y lastName
        const nameParts = (c.name || "").split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        const fields = {};
        if (colNames.includes("firstName")) fields.firstName = firstName;
        if (colNames.includes("lastName")) fields.lastName = lastName;
        if (colNames.includes("email")) fields.email = c.email;
        if (colNames.includes("phone")) fields.phone = c.phone;
        if (colNames.includes("address")) fields.address = c.address;
        if (colNames.includes("city")) fields.city = c.city;
        if (colNames.includes("notes")) fields.notes = c.notes;
        if (colNames.includes("status")) {
          // Mapear: clientes con pedidos = active, newsletter/leads = lead
          fields.status = c.totalOrders > 0 ? "active" : "lead";
        }
        // NO incluir createdAt/updatedAt (tienen DEFAULT CURRENT_TIMESTAMP)

        const keys = Object.keys(fields);
        const vals = Object.values(fields);
        const placeholders = keys.map(() => "?").join(", ");
        const sql = `INSERT INTO clients (${keys.join(", ")}) VALUES (${placeholders})`;
        await conn.query(sql, vals);
        inserted++;
      } catch (err) {
        errors++;
        console.error(`  ❌ Error insertando ${c.email || c.phone}: ${err.message}`);
      }
    }
    process.stdout.write(`\r   Progreso: ${Math.min(i + batchSize, toInsert.length)}/${toInsert.length}`);
  }

  console.log(`\n\n✅ Importación completada:`);
  console.log(`   Insertados: ${inserted}`);
  console.log(`   Errores: ${errors}`);

  // Verificar total final
  const [finalCount] = await conn.query("SELECT COUNT(*) as cnt FROM clients");
  console.log(`   Total clientes en BD ahora: ${finalCount[0].cnt}`);

  await conn.end();
}

main().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});
