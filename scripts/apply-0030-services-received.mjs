/**
 * apply-0030-services-received.mjs
 * Aplica drizzle/0030_services_received.sql de forma idempotente y SOLO ADITIVA, y siembra el catálogo inicial:
 *   Recursos gratuitos → Guía del agua · Guía de aceites · Guía de preparacionismo
 *   Productos → Aceites (productos activos de Aceites esenciales) · Ebooks (guías activas)
 *   Acompañamiento · Masajes y sanación (vacías, las rellena Cristina)
 * El catálogo se puede editar después desde el CRM; este script no pisa nada que ya exista (clave: slug).
 *
 *   node scripts/apply-0030-services-received.mjs --dry-run
 *   node scripts/apply-0030-services-received.mjs
 * Reversión: drizzle/0030_services_received.down.sql
 */
import fs from "node:fs";
import mysql2 from "mysql2/promise";
import { config } from "dotenv";

config();
const DRY = process.argv.includes("--dry-run");
const conn = await mysql2.createConnection(process.env.DATABASE_URL);
const q = async (sql, p) => (await conn.query(sql, p))[0];
const hasTable = async (t) => (await q("SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?", [t])).length > 0;
const hasCol = async (t, c) => (await q("SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?", [t, c])).length > 0;
let changes = 0;
const log = (m) => console.log("  +", m);
try {
  const [[{ db }]] = await conn.query("SELECT DATABASE() AS db");
  console.log(`Base de datos: ${db}${DRY ? " (dry-run: no se escribe nada)" : ""}`);
  const sql = fs.readFileSync(new URL("../drizzle/0030_services_received.sql", import.meta.url), "utf8");
  const stmts = sql.split(/;\s*\n/).map((s) => s.replace(/^--.*$/gm, "").trim()).filter(Boolean);
  for (const st of stmts) {
    const t = st.match(/CREATE TABLE IF NOT EXISTS `(\w+)`/)?.[1];
    const a = st.match(/ALTER TABLE `(\w+)` ADD COLUMN `(\w+)`/);
    if (t && (await hasTable(t))) continue;
    if (a && (await hasCol(a[1], a[2]))) continue;
    log(st.replace(/\s+/g, " ").slice(0, 90));
    if (!DRY) await conn.query(st);
    changes++;
  }
  // Índice único «una sesión por cita», solo si no hay duplicados
  if (await hasCol("session_history", "appointmentId")) {
    const idx = await q("SHOW INDEX FROM session_history WHERE Key_name = 'session_history_appointment_uq'");
    if (!idx.length) {
      const dups = await q("SELECT appointmentId FROM session_history WHERE appointmentId IS NOT NULL GROUP BY appointmentId HAVING COUNT(*) > 1");
      if (dups.length) console.log(`  ! Hay ${dups.length} cita(s) con más de una sesión: no se crea el índice único (el código evita el duplicado).`);
      else {
        log("UNIQUE session_history(appointmentId)");
        if (!DRY) await conn.query("ALTER TABLE `session_history` ADD UNIQUE KEY `session_history_appointment_uq` (`appointmentId`)");
        changes++;
      }
    }
  }

  // ── Catálogo inicial ──
  const catalogExists = await hasTable("service_catalog");
  const find = async (slug) => (catalogExists ? (await q("SELECT id FROM service_catalog WHERE slug = ?", [slug]))[0]?.id ?? null : null);
  const ensure = async (slug, kind, name, parentId, extra = {}) => {
    const id = await find(slug);
    if (id) return id;
    log(`catálogo: ${kind} «${name}»`);
    changes++;
    if (DRY) return -1;
    const [r] = await conn.query(
      "INSERT INTO service_catalog (parentId, kind, name, slug, ebookSlug, priceCents, sortOrder) VALUES (?,?,?,?,?,?,?)",
      [parentId, kind, name, slug, extra.ebookSlug ?? null, extra.priceCents ?? null, extra.sortOrder ?? 0],
    );
    return r.insertId;
  };
  const rec = await ensure("recursos_gratuitos", "category", "Recursos gratuitos", null, { sortOrder: 1 });
  await ensure("recursos-guia-del-agua", "item", "Guía del agua", rec, { sortOrder: 1 });
  await ensure("recursos-guia-de-aceites", "item", "Guía de aceites", rec, { sortOrder: 2 });
  await ensure("recursos-guia-de-preparacionismo", "item", "Guía de preparacionismo", rec, { sortOrder: 3 });
  const prod = await ensure("productos", "category", "Productos", null, { sortOrder: 2 });
  const aceites = await ensure("productos-aceites", "group", "Aceites", prod, { sortOrder: 1 });
  const ebooksG = await ensure("productos-ebooks", "group", "Ebooks", prod, { sortOrder: 2 });
  await ensure("acompanamiento", "category", "Acompañamiento", null, { sortOrder: 3 });
  await ensure("masajes_y_sanacion", "category", "Masajes y sanación", null, { sortOrder: 4 });
  if (await hasTable("ebooks")) {
    for (const e of await q("SELECT slug, title, priceCents FROM ebooks WHERE status = 'active' ORDER BY sortOrder, id"))
      await ensure(`ebook-${e.slug}`, "item", e.title, ebooksG, { ebookSlug: e.slug, priceCents: e.priceCents });
  }
  if (await hasTable("oil_products")) {
    for (const o of await q("SELECT slug, name FROM oil_products WHERE status = 'active' AND tipoProducto IN ('aceite','mezcla','base') ORDER BY name"))
      await ensure(`aceite-${o.slug}`.slice(0, 120), "item", o.name, aceites);
  }
  console.log(changes ? `${DRY ? "Pendiente" : "Aplicado"}: ${changes} cambio(s).` : "Nada que hacer: 0030 ya está aplicada.");
} finally {
  await conn.end();
}
