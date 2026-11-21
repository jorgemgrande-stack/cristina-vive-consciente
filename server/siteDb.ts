/**
 * Editar web — persistencia: borradores, publicación, historial, restauración, páginas nuevas y redirecciones.
 * La web pública solo lee la versión publicada (`readPublished*`); el borrador solo lo ve la administradora.
 */
import { and, desc, eq, inArray, like } from "drizzle-orm";
import { getDb } from "./db";
import { siteDocuments, siteDocumentVersions, siteRedirects, type SiteDocument } from "../drizzle/schema";
import {
  DEFAULT_GLOBAL, GLOBAL_KEY, SYSTEM_PAGES, emptyPageContent, slugProblem, systemPage, templateKeyFor,
  type GlobalContent, type PageBlock, type PageContent, type SiteGlobal,
} from "../shared/siteEditor";
import { normalizeGlobal, normalizePageContent } from "./siteContent";

export class SiteEditorError extends Error {}

async function db() {
  const d = await getDb();
  if (!d) throw new SiteEditorError("No hay conexión con la base de datos.");
  return d;
}

const parse = (json: string | null | undefined): unknown => {
  try { return json ? JSON.parse(json) : null; } catch { return null; }
};

export const contentOf = (doc: Pick<SiteDocument, "kind" | "draftJson">): PageContent | GlobalContent =>
  doc.kind === "global" ? { v: 1, global: normalizeGlobal((parse(doc.draftJson) as GlobalContent | null)?.global) } : normalizePageContent(parse(doc.draftJson));

function initialJson(docKey: string): string {
  return JSON.stringify(docKey === GLOBAL_KEY ? ({ v: 1, global: DEFAULT_GLOBAL } satisfies GlobalContent) : emptyPageContent());
}
const kindOf = (docKey: string): "page" | "template" | "global" =>
  docKey === GLOBAL_KEY ? "global" : docKey.startsWith("tpl:") ? "template" : "page";

/** Fila del documento; la crea vacía si es una página del sistema o los ajustes globales y aún no existe. */
export async function ensureDocument(docKey: string): Promise<SiteDocument> {
  const d = await db();
  const [row] = await d.select().from(siteDocuments).where(eq(siteDocuments.docKey, docKey)).limit(1);
  if (row) return row;
  const def = systemPage(docKey);
  if (!def && docKey !== GLOBAL_KEY) throw new SiteEditorError("Esa página no existe.");
  await d.insert(siteDocuments).values({
    docKey, kind: kindOf(docKey), title: def?.label ?? "Ajustes del sitio", servedFrom: "legacy", draftJson: initialJson(docKey),
  }).onDuplicateKeyUpdate({ set: { docKey } });
  const [created] = await d.select().from(siteDocuments).where(eq(siteDocuments.docKey, docKey)).limit(1);
  return created;
}

export async function getDocument(docKey: string): Promise<SiteDocument | null> {
  const d = await db();
  const [row] = await d.select().from(siteDocuments).where(eq(siteDocuments.docKey, docKey)).limit(1);
  return row ?? null;
}

async function publishedContentJson(doc: SiteDocument): Promise<string | null> {
  if (!doc.publishedVersionId) return null;
  const d = await db();
  const [v] = await d.select().from(siteDocumentVersions).where(eq(siteDocumentVersions.id, doc.publishedVersionId)).limit(1);
  return v?.contentJson ?? null;
}

export interface DocSummary {
  docKey: string; label: string; kind: "page" | "template" | "global"; route: string;
  servedFrom: "legacy" | "cms"; custom: boolean; published: boolean; draftChanged: boolean; publishedAt: Date | null; draftUpdatedAt: Date | null;
}

export async function listDocuments(): Promise<DocSummary[]> {
  const d = await db();
  const rows = await d.select().from(siteDocuments);
  const byKey = new Map(rows.map((r) => [r.docKey, r]));
  const versionIds = rows.map((r) => r.publishedVersionId).filter((x): x is number => !!x);
  const versions = versionIds.length ? await d.select().from(siteDocumentVersions).where(inArray(siteDocumentVersions.id, versionIds)) : [];
  const vById = new Map(versions.map((v) => [v.id, v]));
  const summarize = (docKey: string, label: string, kind: DocSummary["kind"], route: string, custom: boolean): DocSummary => {
    const r = byKey.get(docKey);
    const pub = r?.publishedVersionId ? vById.get(r.publishedVersionId) : undefined;
    return {
      docKey, label: r?.title ?? label, kind, route, custom, servedFrom: r?.servedFrom ?? "legacy", published: !!pub,
      draftChanged: r ? (pub ? normalizedEqual(r.draftJson, pub.contentJson) === false : r.draftJson !== initialJson(docKey)) : false,
      publishedAt: r?.publishedAt ?? null, draftUpdatedAt: r?.draftUpdatedAt ?? null,
    };
  };
  const out: DocSummary[] = SYSTEM_PAGES.map((p) => summarize(p.docKey, p.label, p.kind, p.route, false));
  out.push(summarize(GLOBAL_KEY, "Ajustes del sitio", "global", "/", false));
  for (const r of rows) if (r.kind === "page" && !systemPage(r.docKey)) out.push(summarize(r.docKey, r.title, "page", r.docKey, true));
  return out;
}

const normalizedEqual = (a: string, b: string): boolean => {
  try { return JSON.stringify(JSON.parse(a)) === JSON.stringify(JSON.parse(b)); } catch { return a === b; }
};

export async function readDraft(docKey: string) {
  const doc = await ensureDocument(docKey);
  return { doc, content: contentOf(doc) };
}

export async function saveDraft(docKey: string, raw: unknown, userId: number | null): Promise<{ content: PageContent | GlobalContent; savedAt: Date }> {
  const doc = await ensureDocument(docKey);
  const content: PageContent | GlobalContent = doc.kind === "global" ? { v: 1, global: normalizeGlobal((raw as GlobalContent | undefined)?.global) } : normalizePageContent(raw);
  const d = await db();
  const savedAt = new Date();
  await d.update(siteDocuments).set({ draftJson: JSON.stringify(content), draftUpdatedAt: savedAt, draftUpdatedBy: userId }).where(eq(siteDocuments.id, doc.id));
  return { content, savedAt };
}

/** Publica el borrador: guarda una versión en el historial y la sirve en la web. */
export async function publishDraft(docKey: string, userId: number | null, note?: string) {
  const doc = await ensureDocument(docKey);
  const d = await db();
  const content = JSON.stringify(contentOf(doc));
  const [ins] = await d.insert(siteDocumentVersions).values({ documentId: doc.id, contentJson: content, action: "publish", note: note?.slice(0, 200) || null, createdBy: userId });
  const versionId = Number((ins as unknown as { insertId: number }).insertId);
  await d.update(siteDocuments).set({ publishedVersionId: versionId, publishedAt: new Date(), servedFrom: "cms" }).where(eq(siteDocuments.id, doc.id));
  invalidateSiteCache();
  return { versionId };
}

/** La web vuelve a servir la página de siempre (código) sin borrar borrador ni historial. */
export async function serveLegacy(docKey: string) {
  const doc = await ensureDocument(docKey);
  if (kindOf(docKey) === "global") throw new SiteEditorError("Los ajustes del sitio no tienen versión en código.");
  if (!systemPage(docKey)) throw new SiteEditorError("Solo las páginas originales tienen una versión en código.");
  const d = await db();
  await d.update(siteDocuments).set({ servedFrom: "legacy" }).where(eq(siteDocuments.id, doc.id));
  invalidateSiteCache();
}

export async function listVersions(docKey: string) {
  const doc = await getDocument(docKey);
  if (!doc) return [];
  const d = await db();
  const rows = await d.select({
    id: siteDocumentVersions.id, action: siteDocumentVersions.action, note: siteDocumentVersions.note, createdAt: siteDocumentVersions.createdAt, createdBy: siteDocumentVersions.createdBy,
  }).from(siteDocumentVersions).where(eq(siteDocumentVersions.documentId, doc.id)).orderBy(desc(siteDocumentVersions.id)).limit(50);
  return rows.map((r) => ({ ...r, current: r.id === doc.publishedVersionId }));
}

/** Restaura una versión anterior: pasa a ser el borrador y, por defecto, se publica como versión nueva. */
export async function restoreVersion(docKey: string, versionId: number, userId: number | null, publish = true) {
  const doc = await getDocument(docKey);
  if (!doc) throw new SiteEditorError("Esa página no existe.");
  const d = await db();
  const [v] = await d.select().from(siteDocumentVersions).where(and(eq(siteDocumentVersions.id, versionId), eq(siteDocumentVersions.documentId, doc.id))).limit(1);
  if (!v) throw new SiteEditorError("No encuentro esa versión.");
  await d.update(siteDocuments).set({ draftJson: v.contentJson, draftUpdatedAt: new Date(), draftUpdatedBy: userId }).where(eq(siteDocuments.id, doc.id));
  if (publish) {
    const [ins] = await d.insert(siteDocumentVersions).values({ documentId: doc.id, contentJson: v.contentJson, action: "restore", note: `Restaurada la versión #${v.id}`, createdBy: userId });
    await d.update(siteDocuments).set({ publishedVersionId: Number((ins as unknown as { insertId: number }).insertId), publishedAt: new Date(), servedFrom: "cms" }).where(eq(siteDocuments.id, doc.id));
    invalidateSiteCache();
  }
}

// ─── Lectura pública (solo lo publicado) ────────────────────────────────────

/** Quita los bloques ocultos (también dentro de secciones): el visitante nunca los recibe. */
export function stripHidden(blocks: PageBlock[]): PageBlock[] {
  return blocks.filter((b) => !b.hidden).map((b) => (b.type === "section" ? { ...b, data: { ...b.data, columns: b.data.columns.map((c) => ({ blocks: stripHidden(c.blocks) })) } } : b));
}

const cache = new Map<string, { at: number; value: unknown }>();
const CACHE_MS = 20_000;
export function invalidateSiteCache() { cache.clear(); }
async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value as T;
  const value = await load();
  cache.set(key, { at: Date.now(), value });
  return value;
}

export type PublicPage = { docKey: string; title: string; kind: "page" | "template"; content: PageContent; /** Versión publicada que se está mostrando (trazabilidad de textos legales) */ versionId: number | null; publishedAt: Date | null };

async function loadPublished(docKey: string): Promise<{ doc: SiteDocument; json: string } | null> {
  const doc = await getDocument(docKey);
  if (!doc || doc.servedFrom !== "cms") return null;
  const json = await publishedContentJson(doc);
  return json ? { doc, json } : null;
}

/** Página publicada que corresponde a una ruta (página, ficha con plantilla o página nueva), o null. */
export async function readPublishedPage(path: string): Promise<PublicPage | null> {
  const clean = path.length > 1 ? path.replace(/\/+$/, "") : path;
  return cached(`page:${clean}`, async () => {
    const direct = await loadPublished(clean);
    const hit = direct ?? (templateKeyFor(clean) ? await loadPublished(templateKeyFor(clean)!) : null);
    if (!hit) return null;
    const content = normalizePageContent(parse(hit.json));
    return { docKey: hit.doc.docKey, title: hit.doc.title, kind: hit.doc.kind === "template" ? "template" : "page", content: { ...content, blocks: stripHidden(content.blocks) }, versionId: hit.doc.publishedVersionId, publishedAt: hit.doc.publishedAt } as PublicPage;
  });
}

/** Versión publicada de los textos legales (null = se muestra el texto original en código). */
export async function legalVersions(): Promise<{ privacy: number | null; cookies: number | null }> {
  return cached("legal", async () => {
    const get = async (key: string) => { const d = await getDocument(key); return d && d.servedFrom === "cms" ? d.publishedVersionId : null; };
    return { privacy: await get("/privacidad"), cookies: await get("/politica-de-cookies") };
  });
}

export async function readPublishedGlobal(): Promise<SiteGlobal> {
  return cached("global", async () => {
    const hit = await loadPublished(GLOBAL_KEY);
    return hit ? normalizeGlobal((parse(hit.json) as GlobalContent | null)?.global) : DEFAULT_GLOBAL;
  });
}

/** Rutas de páginas nuevas publicadas, para el mapa del sitio. */
export async function publishedCustomPaths(): Promise<{ path: string; lastmod: Date | null }[]> {
  const d = await getDb();
  if (!d) return [];
  const rows = await d.select().from(siteDocuments).where(and(eq(siteDocuments.kind, "page"), eq(siteDocuments.servedFrom, "cms"), like(siteDocuments.docKey, "/%")));
  const out: { path: string; lastmod: Date | null }[] = [];
  for (const r of rows) {
    const sys = systemPage(r.docKey);
    if (sys && !sys.sitemap) continue;
    const json = await publishedContentJson(r);
    if (!json) continue;
    if (normalizePageContent(parse(json)).seo.noindex) continue;
    if (!sys) out.push({ path: r.docKey, lastmod: r.publishedAt });
  }
  return out;
}
/** Rutas de sistema con noindex publicado (se excluyen del mapa del sitio). */
export async function noindexSystemPaths(): Promise<Set<string>> {
  const d = await getDb();
  const out = new Set<string>();
  if (!d) return out;
  const rows = await d.select().from(siteDocuments).where(and(eq(siteDocuments.kind, "page"), eq(siteDocuments.servedFrom, "cms")));
  for (const r of rows) {
    if (!systemPage(r.docKey)) continue;
    const json = await publishedContentJson(r);
    if (json && normalizePageContent(parse(json)).seo.noindex) out.add(r.docKey);
  }
  return out;
}

// ─── Páginas nuevas ─────────────────────────────────────────────────────────

export async function createCustomPage(title: string, slug: string, userId: number | null, withDraft?: PageContent) {
  const problem = slugProblem(slug);
  if (problem) throw new SiteEditorError(problem);
  const cleanTitle = title.trim().slice(0, 200);
  if (!cleanTitle) throw new SiteEditorError("Escribe el título de la página.");
  const docKey = `/${slug}`;
  const d = await db();
  if (await getDocument(docKey)) throw new SiteEditorError("Ya existe una página con esa dirección.");
  if (await redirectFor(docKey)) throw new SiteEditorError("Esa dirección tiene una redirección: elimínala antes si quieres usarla.");
  const content = withDraft ?? {
    ...emptyPageContent(),
    seo: { title: cleanTitle, description: "", ogImage: "", noindex: false },
    blocks: [
      { id: "b" + Math.random().toString(36).slice(2, 10), type: "hero", data: { eyebrow: "", title: cleanTitle, subtitle: "", imageUrl: "", imageAlt: "", buttonLabel: "", buttonUrl: "", height: "m", breadcrumb: "on" } },
    ] as PageBlock[],
  };
  await d.insert(siteDocuments).values({ docKey, kind: "page", title: cleanTitle, servedFrom: "legacy", draftJson: JSON.stringify(normalizePageContent(content)), draftUpdatedBy: userId });
  return { docKey };
}

/** Cambia la dirección de una página nueva y deja una redirección 301 desde la anterior. */
export async function renameCustomPage(docKey: string, newSlug: string) {
  if (systemPage(docKey) || docKey === GLOBAL_KEY || docKey.startsWith("tpl:")) throw new SiteEditorError("Las páginas originales no cambian de dirección.");
  const problem = slugProblem(newSlug);
  if (problem) throw new SiteEditorError(problem);
  const to = `/${newSlug}`;
  if (to === docKey) return { docKey };
  const d = await db();
  if (await getDocument(to)) throw new SiteEditorError("Ya existe una página con esa dirección.");
  const doc = await getDocument(docKey);
  if (!doc) throw new SiteEditorError("Esa página no existe.");
  await d.update(siteDocuments).set({ docKey: to }).where(eq(siteDocuments.id, doc.id));
  // Si alguien redirigía a la dirección antigua, ahora apunta a la nueva (sin cadenas)
  await d.update(siteRedirects).set({ toPath: to }).where(eq(siteRedirects.toPath, docKey));
  await d.delete(siteRedirects).where(eq(siteRedirects.fromPath, to));
  await d.insert(siteRedirects).values({ fromPath: docKey, toPath: to, auto: 1 }).onDuplicateKeyUpdate({ set: { toPath: to } });
  invalidateSiteCache();
  invalidateRedirects();
  return { docKey: to };
}

export async function renameDocumentTitle(docKey: string, title: string) {
  const doc = await ensureDocument(docKey);
  const t = title.trim().slice(0, 200);
  if (!t) throw new SiteEditorError("Escribe un título.");
  const d = await db();
  await d.update(siteDocuments).set({ title: t }).where(eq(siteDocuments.id, doc.id));
  invalidateSiteCache();
}

export async function deleteCustomPage(docKey: string) {
  if (systemPage(docKey) || docKey === GLOBAL_KEY || docKey.startsWith("tpl:")) throw new SiteEditorError("Las páginas originales no se pueden eliminar.");
  const doc = await getDocument(docKey);
  if (!doc) return;
  const d = await db();
  await d.delete(siteDocumentVersions).where(eq(siteDocumentVersions.documentId, doc.id));
  await d.delete(siteDocuments).where(eq(siteDocuments.id, doc.id));
  invalidateSiteCache();
}

// ─── Redirecciones ──────────────────────────────────────────────────────────

export function normalizeRedirectPath(raw: string): string {
  let p = raw.trim();
  try { if (/^https?:\/\//i.test(p)) p = new URL(p).pathname; } catch { /* se valida abajo */ }
  p = p.split(/[?#]/)[0];
  return p.length > 1 ? p.replace(/\/+$/, "") : p;
}
export function redirectProblem(from: string, to: string): string | null {
  if (!/^\/[^\s]*$/.test(from) || from === "/") return "La dirección de origen debe empezar por / y no puede ser la portada.";
  if (/^\/(crm|admin|api|uploads)(\/|$)/.test(from)) return "Esa dirección es interna y no se puede redirigir.";
  if (!/^(\/(?!\/)[^\s]*|https?:\/\/[^\s]+)$/.test(to)) return "El destino debe ser una ruta de la web (/contacto) o una dirección completa.";
  if (from.toLowerCase() === to.toLowerCase()) return "El origen y el destino no pueden ser iguales.";
  return null;
}
export async function redirectFor(fromPath: string) {
  const d = await db();
  const [row] = await d.select().from(siteRedirects).where(eq(siteRedirects.fromPath, fromPath.toLowerCase())).limit(1);
  return row ?? null;
}
export async function listRedirects() {
  const d = await db();
  return d.select().from(siteRedirects).orderBy(desc(siteRedirects.id));
}
export async function addRedirect(fromRaw: string, toRaw: string) {
  const from = normalizeRedirectPath(fromRaw).toLowerCase();
  const to = toRaw.trim();
  const problem = redirectProblem(from, to);
  if (problem) throw new SiteEditorError(problem);
  const d = await db();
  // Evita bucles A→B y B→A
  const back = await redirectFor(to.toLowerCase());
  if (back && back.toPath.toLowerCase() === from) throw new SiteEditorError("Esa redirección crearía un bucle con otra existente.");
  await d.insert(siteRedirects).values({ fromPath: from, toPath: to, auto: 0 }).onDuplicateKeyUpdate({ set: { toPath: to, auto: 0 } });
  invalidateRedirects();
}
export async function removeRedirect(id: number) {
  const d = await db();
  await d.delete(siteRedirects).where(eq(siteRedirects.id, id));
  invalidateRedirects();
}

let redirectCache: { at: number; map: Map<string, string> } | null = null;
export function invalidateRedirects() { redirectCache = null; }
/** Mapa de redirecciones editables (se refresca cada minuto o al cambiar). */
export async function redirectMap(): Promise<Map<string, string>> {
  if (redirectCache && Date.now() - redirectCache.at < 60_000) return redirectCache.map;
  const d = await getDb();
  const map = new Map<string, string>();
  if (d) for (const r of await d.select().from(siteRedirects)) map.set(r.fromPath.toLowerCase(), r.toPath);
  redirectCache = { at: Date.now(), map };
  return map;
}
