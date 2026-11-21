/**
 * Carga inicial de la web actual en el editor, como BORRADORES (nunca publica ni cambia lo que ven los visitantes).
 *
 * Es no destructiva y repetible:
 *  - Un borrador vacío, o solo con bloques de EJEMPLO (datos idénticos a los de un bloque recién añadido, p. ej. una
 *    cabecera «Título de la página»), se sustituye por el contenido migrado. Antes de escribir se guarda copia.
 *  - Un borrador con ediciones reales las conserva: los bloques de ejemplo se retiran, los bloques migrados que ya están
 *    cubiertos por uno real (mismo id, misma fuente conectada o cabecera ya existente) se respetan, y se añade lo que falta.
 *  - `seed` guarda los ids ya cargados: repetir la carga no duplica ni vuelve a añadir lo que Cristina haya borrado.
 */
import { GLOBAL_KEY, SYSTEM_PAGES, defaultBlockData, type PageBlock, type PageContent } from "../shared/siteEditor";
import { migratedContent } from "./siteMigration";

const stable = (v: unknown): string => JSON.stringify(v, (_k, x) => (x && typeof x === "object" && !Array.isArray(x) ? Object.fromEntries(Object.entries(x as object).sort(([a], [b]) => a.localeCompare(b))) : x));

/** ¿Es un bloque de ejemplo, sin tocar? (sus datos son idénticos a los de un bloque nuevo y no tiene diseño propio). */
export function isExampleBlock(b: PageBlock): boolean {
  if (b.style || b.hidden) return false;
  return stable(b.data) === stable(defaultBlockData(b.type));
}

export interface SeedReport {
  action: "created" | "replaced-examples" | "merged" | "unchanged";
  removedExamples: number;
  added: string[];
  kept: number;
}

/** ¿El bloque migrado ya está cubierto por uno real del borrador? */
function covering(m: PageBlock, real: PageBlock[]): PageBlock | undefined {
  const byId = real.find((r) => r.id === m.id);
  if (byId) return byId;
  if (m.type === "hero") return real.find((r) => r.type === "hero");
  if (m.type === "connected") return real.find((r) => r.type === "connected" && r.data.source === m.data.source && r.data.section === m.data.section);
  return undefined;
}

/** Fusiona el borrador existente con el contenido migrado sin perder ediciones reales. Pura. */
export function mergeSeed(existing: PageContent | null, migrated: PageContent): { content: PageContent; report: SeedReport } {
  const migratedIds = migrated.blocks.map((b) => b.id);
  if (!existing || existing.blocks.length === 0) {
    return { content: { ...migrated, seed: migratedIds }, report: { action: "created", removedExamples: 0, added: migratedIds, kept: 0 } };
  }
  const alreadySeeded = new Set(existing.seed ?? []);
  const seo = { ...existing.seo };
  if (!seo.title && !seo.description && !seo.ogImage) Object.assign(seo, migrated.seo);

  // Con carga previa: solo se añade lo migrado que nunca se cargó y no está ya en el borrador
  if (existing.seed) {
    const have = new Set(existing.blocks.map((b) => b.id));
    const missing = migrated.blocks.filter((m) => !alreadySeeded.has(m.id) && !have.has(m.id) && !covering(m, existing.blocks));
    const next: PageContent = { ...existing, seo, blocks: [...existing.blocks, ...missing], seed: Array.from(new Set([...Array.from(alreadySeeded), ...migratedIds])) };
    const same = stable(next) === stable(existing);
    return { content: next, report: { action: same ? "unchanged" : "merged", removedExamples: 0, added: missing.map((b) => b.id), kept: existing.blocks.length } };
  }

  // Borrador anterior a la carga: separar ejemplos de ediciones reales
  const real = existing.blocks.filter((b) => !isExampleBlock(b));
  const removedExamples = existing.blocks.length - real.length;
  if (real.length === 0) {
    return { content: { ...migrated, seo: { ...migrated.seo }, seed: migratedIds }, report: { action: "replaced-examples", removedExamples, added: migratedIds, kept: 0 } };
  }
  const used = new Set<string>();
  const blocks: PageBlock[] = [];
  const added: string[] = [];
  for (const m of migrated.blocks) {
    const cover = covering(m, real);
    if (cover) { if (!used.has(cover.id)) { blocks.push(cover); used.add(cover.id); } } else { blocks.push(m); added.push(m.id); }
  }
  for (const r of real) if (!used.has(r.id)) blocks.push(r); // lo que Cristina añadió por su cuenta, al final
  return { content: { ...existing, seo, blocks, seed: migratedIds }, report: { action: "merged", removedExamples, added, kept: real.length } };
}

/** Claves de todas las páginas y plantillas que se cargan (los ajustes globales se crean aparte con sus valores actuales). */
export const SEED_KEYS: readonly string[] = SYSTEM_PAGES.map((p) => p.docKey);
export { GLOBAL_KEY, migratedContent };
