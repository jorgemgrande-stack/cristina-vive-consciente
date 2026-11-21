/** Ejecuta la carga inicial de la web actual en los borradores del editor (ver siteSeed.ts). */
import { GLOBAL_KEY, systemPage, type PageContent } from "../shared/siteEditor";
import type { SiteDocument } from "../drizzle/schema";
import { contentOf, ensureDocument, getDocument, saveDraft } from "./siteDb";
import { SEED_KEYS, mergeSeed, migratedContent, type SeedReport } from "./siteSeed";

export interface SeedResult extends SeedReport { docKey: string; label: string; backedUp: boolean }

/**
 * Carga (o completa) los borradores de todas las páginas, plantillas y ajustes globales. Nunca publica ni cambia
 * `servedFrom`: los visitantes siguen viendo lo mismo. `backup` recibe el borrador previo de cada documento que va a
 * cambiar y debe guardarlo antes de que se escriba nada. Con `dryRun` solo informa.
 */
export async function loadInitialDrafts(opts: { dryRun?: boolean; backup?: (doc: SiteDocument) => void | Promise<void> } = {}): Promise<SeedResult[]> {
  const out: SeedResult[] = [];
  for (const key of SEED_KEYS) {
    const migrated = migratedContent(key);
    if (!migrated) continue;
    const doc = await getDocument(key);
    const existing = doc ? (contentOf(doc) as PageContent) : null;
    const { content, report } = mergeSeed(existing, migrated);
    let backedUp = false;
    if (report.action !== "unchanged") {
      if (doc && !opts.dryRun) { await opts.backup?.(doc); backedUp = !!opts.backup; }
      if (!opts.dryRun) await saveDraft(key, content, null);
    }
    out.push({ docKey: key, label: systemPage(key)?.label ?? key, backedUp, ...report });
  }
  // Ajustes globales: se crean con los valores actuales de la web (si ya existen, no se tocan)
  const g = await getDocument(GLOBAL_KEY);
  if (!g && !opts.dryRun) await ensureDocument(GLOBAL_KEY);
  out.push({ docKey: GLOBAL_KEY, label: "Ajustes del sitio", action: g ? "unchanged" : "created", removedExamples: 0, added: g ? [] : ["global"], kept: 0, backedUp: false });
  return out;
}
