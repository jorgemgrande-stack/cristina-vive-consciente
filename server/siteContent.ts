/**
 * Editar web (servidor): validación y saneado de todo lo que guarda el editor. Nada se confía al cliente: cada bloque se
 * reconstruye campo a campo con valores de lista cerrada, enlaces y fotos de direcciones seguras y texto con formato
 * pasado por una lista blanca (sin scripts, estilos ni eventos).
 */
import sanitizeHtml from "sanitize-html";
import { ACTION_RE } from "../shared/siteActions";
import { cleanDate } from "../shared/oilOrders";
import {
  ANCHOR_RE, BLOCK_ALIGNS, BLOCK_ANIMATIONS, BLOCK_BACKGROUNDS, BLOCK_MIN_HEIGHTS, BLOCK_OVERLAYS, BLOCK_SPACINGS, BLOCK_TYPES, BLOCK_WIDTHS,
  CONNECTED_VALUES, DEFAULT_BLOCK_STYLE, DEFAULT_GLOBAL, DEFAULT_SEO, DEVICES, FORM_FIELD_KINDS, PAGE_LIMITS, SECTION_LAYOUTS, SECTION_MAX_DEPTH,
  NOT_NESTABLE, defaultBlockData, isDefaultStyle, newBlockId, relayoutColumns, sectionColumnCount,
  type BlockStyle, type BlockType, type FormFieldItem, type GalleryImage, type NavItem, type PageBlock, type PageContent, type PageSeo, type SiteGlobal,
} from "../shared/siteEditor";

export class SiteContentError extends Error {}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

function str(v: unknown, max: number = PAGE_LIMITS.short): string {
  if (typeof v !== "string" && typeof v !== "number") return "";
  return String(v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, max);
}
function oneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
}
const onOff = (v: unknown, fallback: "on" | "off" = "off"): "on" | "off" => oneOf(v, ["on", "off"] as const, fallback);

/** Enlace: ruta de la web, ancla, http(s), correo o teléfono. Lo demás, vacío. */
export function safeLink(v: unknown): string {
  const s = str(v, PAGE_LIMITS.url).replace(/\s+/g, "");
  if (!s) return "";
  if (/^\/(?!\/)/.test(s) || s.startsWith("#")) return s;
  if (ACTION_RE.test(s)) return s;
  if (/^https?:\/\/[^\s]+$/i.test(s)) return s;
  if (/^(mailto|tel):[^\s]+$/i.test(s)) return s;
  if (/^www\.[a-z0-9.-]+\.[a-z]{2,}(\/\S*)?$/i.test(s)) return `https://${s}`;
  return "";
}
/** Imagen: ruta propia (/uploads/…, /logo-bion.png) o http(s). */
export function safeImage(v: unknown): string {
  const s = str(v, PAGE_LIMITS.url).replace(/\s+/g, "");
  if (!s) return "";
  if (/^\/(?!\/)/.test(s) || /^https?:\/\/[^\s]+$/i.test(s)) return s;
  return "";
}
/** Vídeo: solo YouTube o Vimeo. */
export function safeVideo(v: unknown): string {
  const s = safeLink(v);
  return /^https:\/\/(www\.)?(youtube\.com|youtu\.be|player\.vimeo\.com|vimeo\.com)\//i.test(s) ? s : "";
}

const HTML_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ["p", "br", "strong", "b", "em", "i", "u", "ul", "ol", "li", "a", "h2", "h3", "h4", "blockquote", "hr", "mark"],
  allowedAttributes: { a: ["href", "target", "rel"] },
  allowedSchemes: ["http", "https", "mailto", "tel", "action"],
  allowProtocolRelative: false,
  transformTags: {
    a: (tag, attribs) => {
      const href = safeLink(attribs.href);
      return { tagName: "a", attribs: href ? { href, ...(/^https?:/i.test(href) ? { target: "_blank", rel: "noopener noreferrer" } : {}) } : {} };
    },
  },
};
export function cleanHtml(v: unknown): string {
  return typeof v === "string" ? sanitizeHtml(v.slice(0, PAGE_LIMITS.html), HTML_OPTIONS).trim() : "";
}

// ─── Diseño ─────────────────────────────────────────────────────────────────

export function normalizeStyle(v: unknown): BlockStyle | undefined {
  if (!isObj(v)) return undefined;
  const d = DEFAULT_BLOCK_STYLE;
  const anchor = str(v.anchor, 40).toLowerCase();
  const style: BlockStyle = {
    background: oneOf(v.background, BLOCK_BACKGROUNDS, d.background),
    bgImage: safeImage(v.bgImage),
    overlay: oneOf(v.overlay, BLOCK_OVERLAYS, d.overlay),
    padTop: oneOf(v.padTop, BLOCK_SPACINGS, d.padTop),
    padBottom: oneOf(v.padBottom, BLOCK_SPACINGS, d.padBottom),
    align: oneOf(v.align, BLOCK_ALIGNS, d.align),
    mobileAlign: oneOf(v.mobileAlign, BLOCK_ALIGNS, d.mobileAlign),
    mobileSpacing: oneOf(v.mobileSpacing, ["same", "less"] as const, d.mobileSpacing),
    contentWidth: oneOf(v.contentWidth, BLOCK_WIDTHS, d.contentWidth),
    minHeight: oneOf(v.minHeight, BLOCK_MIN_HEIGHTS, d.minHeight),
    hideOn: Array.isArray(v.hideOn) ? DEVICES.filter((x) => (v.hideOn as unknown[]).includes(x)) : [],
    anchor: ANCHOR_RE.test(anchor) ? anchor : "",
    animation: oneOf(v.animation, BLOCK_ANIMATIONS, d.animation),
  };
  if (style.background !== "image") { style.bgImage = ""; style.overlay = d.overlay; }
  return isDefaultStyle(style) ? undefined : style;
}

// ─── Bloques ────────────────────────────────────────────────────────────────

const pct = (v: unknown): number => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 50; };
const list = <T,>(v: unknown, max: number, map: (x: Record<string, unknown>) => T): T[] =>
  (Array.isArray(v) ? v : []).filter(isObj).slice(0, max).map(map);

function normalizeData(type: BlockType, d: Record<string, unknown>, depth: number): Record<string, unknown> {
  const S = PAGE_LIMITS;
  switch (type) {
    case "hero":
      return {
        eyebrow: str(d.eyebrow), title: str(d.title, S.title), subtitle: str(d.subtitle, S.long), imageUrl: safeImage(d.imageUrl), imageAlt: str(d.imageAlt),
        buttonLabel: str(d.buttonLabel, 80), buttonUrl: safeLink(d.buttonUrl), secondaryLabel: str(d.secondaryLabel, 80), secondaryUrl: safeLink(d.secondaryUrl),
        height: oneOf(d.height, ["m", "l", "full"] as const, "m"), breadcrumb: onOff(d.breadcrumb, "on"),
        imageX: pct(d.imageX), imageY: pct(d.imageY), imageXM: pct(d.imageXM), imageYM: pct(d.imageYM),
      };
    case "heading":
      return { eyebrow: str(d.eyebrow), title: str(d.title, S.title), subtitle: str(d.subtitle, S.long), level: oneOf(d.level, ["h1", "h2", "h3"] as const, "h2"), align: oneOf(d.align, ["left", "center"] as const, "center") };
    case "text":
      return { title: str(d.title, S.title), html: cleanHtml(d.html), align: oneOf(d.align, ["left", "center"] as const, "left") };
    case "image":
      return { url: safeImage(d.url), alt: str(d.alt), caption: str(d.caption), size: oneOf(d.size, ["medium", "wide"] as const, "medium"), ratio: oneOf(d.ratio, ["auto", "16:9", "4:3", "1:1"] as const, "auto"), imageX: pct(d.imageX), imageY: pct(d.imageY) };
    case "gallery":
      return {
        title: str(d.title, S.title), layout: oneOf(d.layout, ["grid", "masonry"] as const, "grid"),
        images: list<GalleryImage>(d.images, S.galleryImages, (x) => ({ url: safeImage(x.url), alt: str(x.alt) })).filter((i) => i.url),
      };
    case "button":
      return { label: str(d.label, 80), url: safeLink(d.url), variant: oneOf(d.variant, ["primary", "outline"] as const, "primary"), align: oneOf(d.align, ["left", "center"] as const, "center") };
    case "video":
      return { title: str(d.title, S.title), url: safeVideo(d.url), caption: str(d.caption) };
    case "columns":
      return {
        title: str(d.title, S.title), html: cleanHtml(d.html), imageUrl: safeImage(d.imageUrl), imageAlt: str(d.imageAlt),
        imagePosition: oneOf(d.imagePosition, ["left", "right"] as const, "right"), buttonLabel: str(d.buttonLabel, 80), buttonUrl: safeLink(d.buttonUrl),
        imageX: pct(d.imageX), imageY: pct(d.imageY),
      };
    case "section": {
      const layout = oneOf(d.layout, SECTION_LAYOUTS, "1-1");
      const rawCols = Array.isArray(d.columns) ? d.columns : [];
      const columns = relayoutColumns(
        rawCols.slice(0, 4).map((c) => ({ blocks: isObj(c) ? normalizeList(c.blocks, depth + 1) : [] })),
        layout,
      );
      return { layout, gap: oneOf(d.gap, ["s", "m", "l"] as const, "m"), valign: oneOf(d.valign, ["top", "center"] as const, "top"), mobile: oneOf(d.mobile, ["stack", "reverse"] as const, "stack"), width: oneOf(d.width, ["normal", "wide"] as const, "normal"), columns };
    }
    case "features":
      return {
        title: str(d.title, S.title), intro: str(d.intro, S.long), columns: oneOf(d.columns, ["2", "3", "4"] as const, "3"),
        items: list(d.items, S.listItems, (x) => {
          const buttonLabel = str(x.buttonLabel, 80), buttonUrl = safeLink(x.buttonUrl);
          return { icon: str(x.icon, 30), title: str(x.title, S.title), text: str(x.text, S.long), ...(buttonLabel || buttonUrl ? { buttonLabel, buttonUrl } : {}) };
        }),
      };
    case "cards":
      return {
        title: str(d.title, S.title), intro: str(d.intro, S.long), columns: oneOf(d.columns, ["2", "3", "4"] as const, "3"),
        items: list(d.items, S.listItems, (x) => ({ imageUrl: safeImage(x.imageUrl), imageAlt: str(x.imageAlt), title: str(x.title, S.title), text: str(x.text, S.long), buttonLabel: str(x.buttonLabel, 80), buttonUrl: safeLink(x.buttonUrl), badge: str(x.badge, 40) })),
      };
    case "faq":
      return { title: str(d.title, S.title), items: list(d.items, S.listItems, (x) => ({ question: str(x.question, S.title), answer: str(x.answer, S.long) })).filter((i) => i.question) };
    case "testimonials":
      return { title: str(d.title, S.title), items: list(d.items, S.listItems, (x) => ({ quote: str(x.quote, S.long), author: str(x.author, 100), role: str(x.role, 100) })).filter((i) => i.quote) };
    case "cta":
      return { title: str(d.title, S.title), text: str(d.text, S.long), buttonLabel: str(d.buttonLabel, 80), buttonUrl: safeLink(d.buttonUrl), secondaryLabel: str(d.secondaryLabel, 80), secondaryUrl: safeLink(d.secondaryUrl) };
    case "separator":
      return { kind: oneOf(d.kind, ["line", "space"] as const, "line") };
    case "oil_orders": {
      const t = (k: string) => str(d[k], S.title);
      const long = (k: string) => str(d[k], S.long);
      return {
        title: t("title"),
        groupTitle: t("groupTitle"), groupText: long("groupText"), groupMin: str(d.groupMin, 40), groupNote: t("groupNote"), groupHint: t("groupHint"),
        groupOpen: onOff(d.groupOpen), groupDeadline: cleanDate(str(d.groupDeadline, 20)),
        groupOpenLabel: str(d.groupOpenLabel, 80), groupOpenUrl: safeLink(d.groupOpenUrl), groupClosedLabel: str(d.groupClosedLabel, 80), groupClosedUrl: safeLink(d.groupClosedUrl),
        soloTitle: t("soloTitle"), soloText: long("soloText"), soloMin: str(d.soloMin, 40), soloNote: t("soloNote"), soloHint: t("soloHint"),
        soloLabel: str(d.soloLabel, 80), soloUrl: safeLink(d.soloUrl),
        conditionsTitle: t("conditionsTitle"), conditions: long("conditions"), closing: long("closing"),
      };
    }
    case "service_offer":
      return {
        eyebrow: str(d.eyebrow), title: str(d.title, S.title), intro: str(d.intro, S.long), includesTitle: str(d.includesTitle, S.title), includes: str(d.includes, S.long),
        howTitle: str(d.howTitle, S.title), howText: str(d.howText, S.long), priceLabel: str(d.priceLabel, S.title), priceNote: str(d.priceNote, S.long),
        buttonLabel: str(d.buttonLabel, 80), buttonUrl: safeLink(d.buttonUrl), pendingText: str(d.pendingText, S.short),
        serviceSlug: str(d.serviceSlug, 100).toLowerCase().replace(/[^a-z0-9_]/g, ""), helpLabel: str(d.helpLabel, 80), helpUrl: safeLink(d.helpUrl),
      };
    case "resources":
      return {
        title: str(d.title, S.title), intro: str(d.intro, S.long),
        items: list(d.items, S.listItems, (x) => ({ ebookSlug: str(x.ebookSlug, 100).toLowerCase().replace(/[^a-z0-9_-]/g, ""), title: str(x.title, S.title), text: str(x.text, S.long), buttonLabel: str(x.buttonLabel, 80) })).filter((i) => i.title),
      };
    case "form":
      return {
        title: str(d.title, S.title), intro: str(d.intro, S.long), submitLabel: str(d.submitLabel, 80) || "Enviar",
        successMessage: str(d.successMessage, S.long), consentText: str(d.consentText, S.long),
        fields: list<FormFieldItem>(d.fields, 20, (x) => ({
          kind: oneOf(x.kind, FORM_FIELD_KINDS, "text"), label: str(x.label, 120), placeholder: str(x.placeholder, 120), options: str(x.options, 1000),
          required: onOff(x.required), role: oneOf(x.role, ["none", "name", "email", "phone"] as const, "none"),
        })).filter((f) => f.label),
      };
    case "connected":
      return {
        source: oneOf(d.source, CONNECTED_VALUES as readonly string[], "consultas"), section: str(d.section, 40).replace(/[^a-z0-9_-]/gi, ""), eyebrow: str(d.eyebrow, 100), title: str(d.title, S.title), intro: str(d.intro, S.long),
        buttonLabel: str(d.buttonLabel, 80), secondaryLabel: str(d.secondaryLabel, 80), secondaryUrl: safeLink(d.secondaryUrl),
      };
  }
}

function normalizeList(raw: unknown, depth: number): PageBlock[] {
  if (!Array.isArray(raw)) return [];
  const out: PageBlock[] = [];
  const seen = new Set<string>();
  for (const b of raw.slice(0, PAGE_LIMITS.blocks)) {
    if (!isObj(b) || !(BLOCK_TYPES as readonly string[]).includes(String(b.type))) continue;
    const type = b.type as BlockType;
    if (type === "section" && depth >= SECTION_MAX_DEPTH) continue;
    if (depth > 0 && NOT_NESTABLE.includes(type)) continue;
    let id = str(b.id, 40).replace(/[^a-zA-Z0-9_-]/g, "");
    if (!id || seen.has(id)) id = newBlockId();
    seen.add(id);
    const data = { ...defaultBlockData(type), ...normalizeData(type, isObj(b.data) ? b.data : {}, depth) };
    const block = { id, type, data } as unknown as PageBlock;
    const style = normalizeStyle(b.style);
    if (style) block.style = style;
    if (b.hidden === true) block.hidden = true;
    out.push(block);
  }
  return out;
}
export const normalizeBlocks = (raw: unknown): PageBlock[] => normalizeList(raw, 0);

export function normalizeSeo(v: unknown): PageSeo {
  if (!isObj(v)) return { ...DEFAULT_SEO };
  return { title: str(v.title, 120), description: str(v.description, 320), ogImage: safeImage(v.ogImage), noindex: v.noindex === true };
}

export function normalizePageContent(raw: unknown): PageContent {
  const o = isObj(raw) ? raw : {};
  const seed = Array.isArray(o.seed) ? o.seed.filter((x): x is string => typeof x === "string").map((x) => x.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40)).filter(Boolean).slice(0, 200) : undefined;
  return { v: 1, seo: normalizeSeo(o.seo), blocks: normalizeBlocks(o.blocks), ...(seed ? { seed } : {}) };
}

// ─── Ajustes globales ───────────────────────────────────────────────────────

const nav = (v: unknown, max = 20): NavItem[] => list(v, max, (x) => ({ label: str(x.label, 60), url: safeLink(x.url) })).filter((n) => n.label && n.url);
const phone = (v: unknown) => str(v, 20).replace(/[^0-9]/g, "");

export function normalizeGlobal(raw: unknown): SiteGlobal {
  const g = isObj(raw) ? raw : {};
  const D = DEFAULT_GLOBAL;
  const id = isObj(g.identity) ? g.identity : {};
  const an = isObj(g.announcement) ? g.announcement : {};
  const h = isObj(g.header) ? g.header : {};
  const f = isObj(g.footer) ? g.footer : {};
  const w = isObj(g.whatsapp) ? g.whatsapp : {};
  const labels: Record<string, string> = {};
  if (isObj(g.labels)) for (const [k, val] of Object.entries(g.labels).slice(0, 100)) if (/^[a-zA-Z0-9_.-]{1,60}$/.test(k)) { const t = str(val, 600); if (t) labels[k] = t; }
  const headerNav = nav(h.nav);
  const social = (x: unknown) => { const s = safeLink(x); return /^https:\/\//i.test(s) ? s : ""; };
  return {
    identity: { logoUrl: safeImage(id.logoUrl) || D.identity.logoUrl, logoAlt: str(id.logoAlt, 120) || D.identity.logoAlt },
    announcement: { enabled: onOff(an.enabled), text: str(an.text, 200), linkLabel: str(an.linkLabel, 60), linkUrl: safeLink(an.linkUrl) },
    header: {
      nav: headerNav.length ? headerNav : D.header.nav,
      mobileNav: nav(h.mobileNav),
      desktopCount: Math.min(Math.max(Math.trunc(Number(h.desktopCount)) || D.header.desktopCount, 1), 12),
      contactLabel: str(h.contactLabel, 40), contactUrl: safeLink(h.contactUrl),
      ctaLabel: str(h.ctaLabel, 40), ctaMode: oneOf(h.ctaMode, ["booking", "link"] as const, "booking"), ctaUrl: safeLink(h.ctaUrl),
    },
    footer: {
      about: str(f.about, 500),
      columns: list(f.columns, 4, (c) => ({ title: str(c.title, 60), links: nav(c.links, 12) })),
      contactTitle: str(f.contactTitle, 60), contactEmail: str(f.contactEmail, 120), contactLine: str(f.contactLine, 160),
      ctaLabel: str(f.ctaLabel, 40), ctaUrl: safeLink(f.ctaUrl),
      instagram: social(f.instagram), facebook: social(f.facebook), youtube: social(f.youtube),
      copyright: str(f.copyright, 200), legalLinks: nav(f.legalLinks, 8), showPrivateLink: onOff(f.showPrivateLink, "on"),
    },
    whatsapp: { enabled: onOff(w.enabled, "on"), number: phone(w.number), tooltipTitle: str(w.tooltipTitle, 80), tooltipText: str(w.tooltipText, 240) },
    labels,
  };
}

/** Texto de resumen de los bloques (búsqueda, comprobaciones de migración). */
export function plainText(blocks: PageBlock[]): string {
  const parts: string[] = [];
  const add = (...s: unknown[]) => s.forEach((x) => typeof x === "string" && x && parts.push(x.replace(/<[^>]+>/g, " ")));
  for (const b of blocks) {
    const d = b.data as unknown as Record<string, unknown>;
    add(d.title, d.subtitle, d.eyebrow, d.html, d.text, d.intro, d.label, d.buttonLabel);
    if (b.type === "oil_orders") add(...Object.values(b.data));
    if (b.type === "service_offer") add(b.data.includes, b.data.howText, b.data.priceLabel, b.data.priceNote);
    if (b.type === "section") b.data.columns.forEach((c) => parts.push(plainText(c.blocks)));
    for (const key of ["items", "plans"]) if (Array.isArray(d[key])) for (const it of d[key] as Record<string, unknown>[]) add(it.title, it.text, it.question, it.answer, it.quote);
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}
export { sectionColumnCount };
