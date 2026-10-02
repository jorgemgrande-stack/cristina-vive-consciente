/**
 * apply-health-claims-rewrite.mjs
 * Sustituye en la base de datos las afirmaciones de salud auditadas (scripts/health-claims-rewrite.json).
 *
 * SEGURIDAD
 * - Por defecto es un SIMULACRO: lee y muestra qué cambiaría; no escribe nada.
 * - Solo cambia un campo si su valor actual es EXACTAMENTE el que se auditó (huella SHA-1). Si alguien lo ha editado
 *   desde entonces, se omite y se avisa (así no se pisa trabajo nuevo). La condición se comprueba también dentro del UPDATE.
 * - Antes de escribir guarda una copia de los valores anteriores en health-claims-backup-<fecha>.json (en la carpeta actual).
 * - Solo toca los campos listados; ninguna otra fila ni columna.
 *
 * USO (desde la carpeta que tiene el .env con DATABASE_URL):
 *   node scripts/apply-health-claims-rewrite.mjs                     → simulacro
 *   node scripts/apply-health-claims-rewrite.mjs --apply             → aplica
 *   node scripts/apply-health-claims-rewrite.mjs --restore <copia>   → deshace una aplicación (simulacro; añade --apply para escribir)
 *   Opcional: --blog-draft   → pasa a «borrador» (reversible desde el CRM) los artículos del blog con las afirmaciones de salud
 *             más serias, hasta que se revisen (ver docs/AUDITORIA_AFIRMACIONES_SALUD.md). No se reescriben ni se borran.
 *   Opcional: --deactivate-kinesiologia  → además desactiva (status = inactive) el servicio id 6 «Testaje Kinesiológico para
 *             Homeopatía» (elegir «remedios y dosis» no se puede reformular: ver docs/AUDITORIA_AFIRMACIONES_SALUD.md).
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import mysql2 from 'mysql2/promise';
import { config } from 'dotenv';

config();
const APPLY = process.argv.includes('--apply');
const restoreIdx = process.argv.indexOf('--restore');
const RESTORE = restoreIdx > -1 ? process.argv[restoreIdx + 1] : null;
const DEACTIVATE_KINESIO = process.argv.includes('--deactivate-kinesiologia');
const BLOG_DRAFT = process.argv.includes('--blog-draft');
// Artículos con afirmaciones de enfermedad/tratamiento/causalidad: 7 azúcar, 8 medicina, 10 agrotóxicos,
// 11 transgénicos, 15 protectores solares, 17 cúrcuma, 18 ketchup
const BLOG_DRAFT_IDS = [7, 8, 10, 11, 15, 17, 18];

const TABLES = new Set(['services', 'oil_products', 'oil_categories', 'water_products', 'ebooks', 'affiliate_products']);
const IDENT = /^[A-Za-z][A-Za-z0-9_]*$/;
const sha1 = (s) => crypto.createHash('sha1').update(s, 'utf8').digest('hex');

const here = path.dirname(fileURLToPath(import.meta.url));
const { entries } = JSON.parse(fs.readFileSync(path.join(here, 'health-claims-rewrite.json'), 'utf8'));
for (const e of entries) {
  if (!TABLES.has(e.table) || !IDENT.test(e.field)) throw new Error(`Entrada no válida: ${e.table}.${e.field}`);
}

// La conexión al proxy de Railway puede cortarse (ECONNRESET): se reconecta y se reintenta cada consulta.
let conn = await mysql2.createConnection({ uri: process.env.DATABASE_URL, enableKeepAlive: true });
async function run(kind, sql, params) {
  for (let attempt = 1; ; attempt++) {
    try {
      return kind === 'e' ? await conn.execute(sql, params) : await conn.query(sql, params);
    } catch (err) {
      const transient = ['ECONNRESET', 'PROTOCOL_CONNECTION_LOST', 'ETIMEDOUT', 'EPIPE'].includes(err.code);
      if (!transient || attempt >= 5) throw err;
      console.log(`  (conexión cortada: ${err.code}; reintento ${attempt}/4)`);
      try { await conn.end(); } catch {}
      await new Promise((r) => setTimeout(r, 1000 * attempt));
      conn = await mysql2.createConnection({ uri: process.env.DATABASE_URL, enableKeepAlive: true });
    }
  }
}
const stats = { applied: 0, already: 0, changed: 0, missing: 0 };
const skipped = [];
try {
  const [db] = await run('q', 'SELECT DATABASE() AS db');
  console.log('Base de datos:', db[0].db);
  console.log(RESTORE ? `Modo: DESHACER desde ${RESTORE}` : 'Modo: aplicar sustituciones');
  console.log(APPLY ? '*** ESCRIBE EN LA BASE DE DATOS ***' : 'SIMULACRO: no se escribe nada (añade --apply para aplicar)');

  if (RESTORE) {
    const backup = JSON.parse(fs.readFileSync(RESTORE, 'utf8')).entries;
    for (const b of backup) {
      const [rows] = await run('q', `SELECT \`${b.field}\` AS v FROM \`${b.table}\` WHERE id = ?`, [b.id]);
      if (!rows.length) { stats.missing++; continue; }
      if (rows[0].v === b.original) { stats.already++; continue; }
      if (sha1(rows[0].v ?? '') !== sha1(b.applied)) { stats.changed++; skipped.push(`${b.table}#${b.id}.${b.field} (editado después de aplicar)`); continue; }
      if (APPLY) await run('e', `UPDATE \`${b.table}\` SET \`${b.field}\` = ? WHERE id = ?`, [b.original, b.id]);
      stats.applied++;
    }
  } else {
    const backup = [];
    for (const e of entries) {
      const [rows] = await run('q', `SELECT \`${e.field}\` AS v FROM \`${e.table}\` WHERE id = ?`, [e.id]);
      if (!rows.length) { stats.missing++; skipped.push(`${e.table}#${e.id} no existe`); continue; }
      const current = rows[0].v;
      if (current === e.to) { stats.already++; continue; }
      if (typeof current !== 'string' || sha1(current) !== e.fromSha1) {
        stats.changed++;
        skipped.push(`${e.table}#${e.id} «${e.label}» · ${e.field}: ha cambiado desde la auditoría (revisar a mano)`);
        continue;
      }
      backup.push({ table: e.table, id: e.id, field: e.field, original: current, applied: e.to });
      if (APPLY) {
        // El guard SHA1(columna) = huella evita pisar una edición hecha entre la lectura y la escritura
        const [res] = await run('e', 
          `UPDATE \`${e.table}\` SET \`${e.field}\` = ? WHERE id = ? AND SHA1(\`${e.field}\`) = ?`,
          [e.to, e.id, e.fromSha1],
        );
        if (res.affectedRows !== 1) { stats.changed++; skipped.push(`${e.table}#${e.id}.${e.field}: no se pudo actualizar (cambió durante la ejecución)`); backup.pop(); continue; }
      }
      stats.applied++;
    }
    if (APPLY && backup.length) {
      const file = path.resolve(`health-claims-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
      fs.writeFileSync(file, JSON.stringify({ createdAt: new Date().toISOString(), entries: backup }, null, 2));
      console.log('Copia de los valores anteriores guardada en:', file);
    }
  }

  if (DEACTIVATE_KINESIO && !RESTORE) {
    const [rows] = await run('q', "SELECT id, name, status FROM services WHERE id = 6 AND slug = 'kinesiologia'");
    if (!rows.length) console.log('Kinesiología: no encontrada.');
    else if (rows[0].status === 'inactive') console.log('Kinesiología: ya estaba desactivada.');
    else if (APPLY) { await run('e', "UPDATE services SET status = 'inactive' WHERE id = 6 AND slug = 'kinesiologia'"); console.log(`Kinesiología «${rows[0].name}»: desactivada (reversible desde el CRM).`); }
    else console.log(`[simulacro] Se desactivaría «${rows[0].name}».`);
  }

  if (BLOG_DRAFT && !RESTORE) {
    const [posts] = await run('q', `SELECT id, title, status FROM blog_posts WHERE id IN (${BLOG_DRAFT_IDS.join(',')})`);
    for (const post of posts) {
      if (post.status !== 'published') { console.log(`Blog #${post.id} «${post.title}»: ya no está publicado (${post.status}).`); continue; }
      if (APPLY) {
        await run('e', "UPDATE blog_posts SET status = 'draft' WHERE id = ? AND status = 'published'", [post.id]);
        console.log(`Blog #${post.id} «${post.title}»: pasado a borrador.`);
      } else console.log(`[simulacro] Blog #${post.id} «${post.title}»: pasaría a borrador.`);
    }
  }

  console.log(`\nResultado: ${APPLY ? 'aplicados' : 'se aplicarían'} ${stats.applied} · ya aplicados ${stats.already} · modificados desde la auditoría (omitidos) ${stats.changed} · inexistentes ${stats.missing}`);
  skipped.forEach((s) => console.log(' -', s));
} finally {
  await conn.end();
}
