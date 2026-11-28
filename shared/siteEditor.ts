/**
 * Editar web — modelo compartido (cliente y servidor).
 *
 * Una página es una lista ordenada de bloques; cada bloque tiene un tipo, sus datos y un diseño de lista cerrada
 * (nada de CSS libre: respeta siempre la marca BION). El mismo renderizador (client/src/components/site/PageBlocksView.tsx)
 * pinta el lienzo del editor, la vista previa privada y la web pública. Los bloques «conectados» leen los datos de siempre
 * (Servicios, Aceites, Agua, Blog…) y no los copian: precios, duraciones y condiciones siguen viniendo de su fuente.
 *
 * Modelo inspirado en Elephant Studio (rama integration/elephant-source, 8c29f8f), reducido y adaptado a este sitio.
 */

import type { LabelDef } from "./labels/types";
import { MASAJES_LABELS } from "./labels/masajes";
import { AGUA_LABELS } from "./labels/agua";
import { ACEITES_LABELS } from "./labels/aceites";
import { CONTACTO_LABELS } from "./labels/contacto";
export type { LabelDef };

export type OnOff = "on" | "off";

// ─── Bloques ────────────────────────────────────────────────────────────────

export const BLOCK_TYPES = [
  "hero", "heading", "text", "image", "gallery", "button", "video", "columns", "section",
  "features", "cards", "faq", "testimonials", "cta", "separator", "form", "connected",
  "oil_orders", "service_offer", "resources",
] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

export interface GalleryImage { url: string; alt: string }
export interface FeatureItem { icon: string; title: string; text: string; /** Botón opcional bajo el texto */ buttonLabel?: string; buttonUrl?: string }
/** Recurso digital: el precio y la compra salen del ebook con ese slug (CRM → Ebooks) */
export interface ResourceItem { ebookSlug: string; title: string; text: string; buttonLabel: string }
export interface CardItem { imageUrl: string; imageAlt: string; title: string; text: string; buttonLabel: string; buttonUrl: string; /** Etiqueta pequeña sobre la imagen (opcional) */ badge: string }
export interface FaqItem { question: string; answer: string }
export interface TestimonialItem { quote: string; author: string; role: string }
export const FORM_FIELD_KINDS = ["text", "email", "phone", "textarea", "select", "checkbox"] as const;
export type FormFieldKind = (typeof FORM_FIELD_KINDS)[number];
export interface FormFieldItem {
  kind: FormFieldKind;
  label: string;
  placeholder: string;
  /** Opciones del selector, una por línea */
  options: string;
  required: OnOff;
  /** Qué dato del contacto es (para el CRM) */
  role: "none" | "name" | "email" | "phone";
}

export const SECTION_LAYOUTS = ["1", "1-1", "1-2", "2-1", "1-1-1", "1-2-1"] as const;
export type SectionLayout = (typeof SECTION_LAYOUTS)[number];
export const sectionColumnCount = (layout: string): number => layout.split("-").length;
export interface SectionColumn { blocks: PageBlock[] }
/** Una sección puede llevar otra dentro (un nivel); más profundidad no se admite. */
export const SECTION_MAX_DEPTH = 2;
/** Bloques que ocupan todo el ancho y no caben dentro de una columna. */
export const NOT_NESTABLE: readonly BlockType[] = ["hero"];

/**
 * Datos de origen que los bloques «conectados» pintan con la web de siempre. `page` = cuerpo de una página existente
 * sin su cabecera (que se edita como bloque «Cabecera»), `home_*` = módulos de la portada, `detail` = ficha de la
 * plantilla (consulta, masaje, sistema de agua, aceite o artículo).
 */
export const CONNECTED_SOURCES = [
  { value: "consultas", label: "Listado de consultas", note: "Datos de Servicios (precio, duración, condiciones)" },
  { value: "masajes", label: "Listado de masajes", note: "Datos de Servicios" },
  { value: "sistemas_agua", label: "Catálogo de sistemas de agua", note: "Datos de Agua → Productos" },
  { value: "aceites", label: "Catálogo de aceites esenciales", note: "Datos de Aceites → Productos" },
  { value: "guias", label: "Guías digitales (ebooks)", note: "Datos de Ebooks" },
  { value: "recomendados", label: "Productos recomendados", note: "Datos de Afiliados" },
  { value: "blog", label: "Listado del blog", note: "Artículos publicados" },
  { value: "contacto", label: "Formulario y datos de contacto", note: "Envío a automatizaciones/CRM" },
  { value: "privacidad", label: "Texto de la política de privacidad", note: "Texto legal en código (versiones de consentimiento enlazadas)" },
  { value: "cookies", label: "Texto de la política de cookies", note: "Texto legal en código" },
  { value: "detalle", label: "Ficha completa del elemento (servicio, producto, artículo)", note: "Solo en plantillas de ficha" },
  { value: "ficha", label: "Sección de la ficha (para reordenarla, ocultarla o cambiar su diseño)", note: "Solo en plantillas de ficha: los datos salen de la ficha del elemento" },
  { value: "home_slideshow", label: "Portada: presentación de imágenes", note: "Imágenes de Hero Inicio" },
  { value: "home_masajes", label: "Portada: masajes destacados", note: "Datos de Servicios" },
  { value: "home_agua", label: "Portada: sistemas de agua", note: "Datos de Agua" },
  { value: "home_blog", label: "Portada: últimas entradas del blog", note: "Artículos publicados" },
  { value: "home_guias", label: "Portada: carrusel de guías digitales", note: "Ebooks activos (Datos de Ebooks)" },
] as const;
export type ConnectedSource = (typeof CONNECTED_SOURCES)[number]["value"];
export const CONNECTED_VALUES = CONNECTED_SOURCES.map((s) => s.value) as readonly string[];

export interface BlockDataMap {
  /** Cabecera de página con imagen de fondo (como PageHero) */
  hero: { eyebrow: string; title: string; subtitle: string; imageUrl: string; imageAlt: string; buttonLabel: string; buttonUrl: string; secondaryLabel: string; secondaryUrl: string; height: "m" | "l" | "full"; breadcrumb: OnOff;
    /** Encuadre de la imagen (punto focal 0-100) en ordenador y, aparte, en móvil */
    imageX: number; imageY: number; imageXM: number; imageYM: number };
  heading: { eyebrow: string; title: string; subtitle: string; level: "h1" | "h2" | "h3"; align: "left" | "center" };
  text: { title: string; html: string; align: "left" | "center" };
  image: { url: string; alt: string; caption: string; size: "medium" | "wide"; /** Proporción y encuadre (punto focal 0-100) */ ratio: "auto" | "16:9" | "4:3" | "1:1"; imageX: number; imageY: number };
  gallery: { title: string; images: GalleryImage[]; layout: "grid" | "masonry" };
  button: { label: string; url: string; variant: "primary" | "outline"; align: "left" | "center" };
  video: { title: string; url: string; caption: string };
  columns: { title: string; html: string; imageUrl: string; imageAlt: string; imagePosition: "left" | "right"; buttonLabel: string; buttonUrl: string; imageX: number; imageY: number };
  section: { layout: SectionLayout; gap: "s" | "m" | "l"; valign: "top" | "center"; mobile: "stack" | "reverse"; width: "normal" | "wide"; columns: SectionColumn[] };
  features: { title: string; intro: string; columns: "2" | "3" | "4"; items: FeatureItem[] };
  cards: { title: string; intro: string; columns: "2" | "3" | "4"; items: CardItem[] };
  faq: { title: string; items: FaqItem[] };
  testimonials: { title: string; items: TestimonialItem[] };
  cta: { title: string; text: string; buttonLabel: string; buttonUrl: string; secondaryLabel: string; secondaryUrl: string };
  separator: { kind: "line" | "space" };
  /** Pedidos por contacto directo: pedido conjunto (con fecha límite) e individual, y condiciones */
  oil_orders: {
    title: string;
    groupTitle: string; groupText: string; groupMin: string; groupNote: string; groupHint: string;
    groupOpen: OnOff; groupDeadline: string; groupOpenLabel: string; groupOpenUrl: string; groupClosedLabel: string; groupClosedUrl: string;
    soloTitle: string; soloText: string; soloMin: string; soloNote: string; soloHint: string; soloLabel: string; soloUrl: string;
    conditionsTitle: string; /** Una condición por línea */ conditions: string; closing: string;
  };
  /** Servicio con lo que incluye, cómo funciona, precio y reserva (sin destino = reserva pendiente) */
  service_offer: {
    eyebrow: string; title: string; intro: string; includesTitle: string; /** Un punto por línea */ includes: string;
    howTitle: string; howText: string; priceLabel: string; priceNote: string; buttonLabel: string; buttonUrl: string; pendingText: string;
  };
  resources: { title: string; intro: string; items: ResourceItem[] };
  /** Formulario a medida: cada envío llega a Automatizaciones/CRM como contacto, con todas las respuestas */
  form: { title: string; intro: string; fields: FormFieldItem[]; submitLabel: string; successMessage: string; consentText: string };
  /** Contenido real de otra parte de la web. Los textos solo los usa la presentación de la portada (home_slideshow). */
  connected: { source: ConnectedSource; /** Solo con source «ficha»: qué sección de la ficha */ section: string; eyebrow: string; title: string; intro: string; buttonLabel: string; secondaryLabel: string; secondaryUrl: string };
}

// ─── Diseño del bloque (valores de lista cerrada) ───────────────────────────

export const BLOCK_BACKGROUNDS = ["none", "soft", "brand", "dark", "image"] as const;
export const BLOCK_OVERLAYS = ["dark", "light", "brand"] as const;
export const BLOCK_SPACINGS = ["0", "s", "m", "l", "xl"] as const;
export const BLOCK_ALIGNS = ["auto", "left", "center", "right"] as const;
export const BLOCK_WIDTHS = ["auto", "narrow", "medium", "wide"] as const;
export const BLOCK_MIN_HEIGHTS = ["auto", "40", "60", "80", "full"] as const;
export const BLOCK_ANIMATIONS = ["none", "fade", "up"] as const;
export const DEVICES = ["desktop", "tablet", "mobile"] as const;
export type Device = (typeof DEVICES)[number];

export interface BlockStyle {
  background: (typeof BLOCK_BACKGROUNDS)[number];
  bgImage: string;
  overlay: (typeof BLOCK_OVERLAYS)[number];
  padTop: (typeof BLOCK_SPACINGS)[number];
  padBottom: (typeof BLOCK_SPACINGS)[number];
  /** Alineación en escritorio y, aparte, en móvil */
  align: (typeof BLOCK_ALIGNS)[number];
  mobileAlign: (typeof BLOCK_ALIGNS)[number];
  /** Espacios más pequeños en móvil */
  mobileSpacing: "same" | "less";
  contentWidth: (typeof BLOCK_WIDTHS)[number];
  minHeight: (typeof BLOCK_MIN_HEIGHTS)[number];
  hideOn: Device[];
  anchor: string;
  animation: (typeof BLOCK_ANIMATIONS)[number];
}
export const DEFAULT_BLOCK_STYLE: BlockStyle = {
  background: "none", bgImage: "", overlay: "dark", padTop: "0", padBottom: "0", align: "auto", mobileAlign: "auto",
  mobileSpacing: "same", contentWidth: "auto", minHeight: "auto", hideOn: [], anchor: "", animation: "none",
};
export const ANCHOR_RE = /^[a-z0-9]([a-z0-9-]{0,38}[a-z0-9])?$/;

export interface PageBlockBase<K extends BlockType> {
  id: string;
  type: K;
  data: BlockDataMap[K];
  style?: BlockStyle;
  /** Oculto en la web pública pero conservado en el borrador */
  hidden?: boolean;
}
export type PageBlock = { [K in BlockType]: PageBlockBase<K> }[BlockType];
export type BlockOf<K extends BlockType> = Extract<PageBlock, { type: K }>;

export const PAGE_LIMITS = { blocks: 80, galleryImages: 24, html: 50_000, title: 200, short: 300, url: 1000, listItems: 30, long: 2000 } as const;

export function isDefaultStyle(s: Partial<BlockStyle> | undefined): boolean {
  if (!s) return true;
  return (Object.keys(DEFAULT_BLOCK_STYLE) as Array<keyof BlockStyle>).every((k) => {
    if (k === "hideOn") return !(s.hideOn ?? []).length;
    return (s[k] ?? DEFAULT_BLOCK_STYLE[k]) === DEFAULT_BLOCK_STYLE[k];
  });
}

/** URL de imagen apta para `background-image: url("…")`. */
export function cssUrl(url: string): string {
  return url.replace(/["'()\\\s]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0"));
}

export const BLOCK_CATALOG: ReadonlyArray<{ type: BlockType; label: string; description: string; group: "Estructura" | "Contenido" | "Conectados" }> = [
  { type: "hero", label: "Cabecera con imagen", description: "Imagen grande con título, subtítulo y botón", group: "Estructura" },
  { type: "section", label: "Sección con columnas", description: "Columnas con bloques dentro, distintas en escritorio y móvil", group: "Estructura" },
  { type: "separator", label: "Separador", description: "Una línea o un espacio entre secciones", group: "Estructura" },
  { type: "heading", label: "Título", description: "Un titular con antetítulo y subtítulo", group: "Contenido" },
  { type: "text", label: "Título y texto", description: "Párrafos con negrita, listas y enlaces", group: "Contenido" },
  { type: "image", label: "Imagen", description: "Una imagen con su descripción", group: "Contenido" },
  { type: "gallery", label: "Galería", description: "Varias imágenes en cuadrícula", group: "Contenido" },
  { type: "video", label: "Vídeo", description: "Un vídeo de YouTube o Vimeo", group: "Contenido" },
  { type: "button", label: "Botón", description: "Un botón que lleva a otra página", group: "Contenido" },
  { type: "columns", label: "Texto e imagen", description: "Texto a un lado e imagen al otro", group: "Contenido" },
  { type: "features", label: "Ventajas o servicios", description: "Rejilla de puntos fuertes con icono", group: "Contenido" },
  { type: "cards", label: "Tarjetas", description: "Tarjetas con imagen, texto y botón", group: "Contenido" },
  { type: "faq", label: "Preguntas frecuentes", description: "Preguntas que se despliegan", group: "Contenido" },
  { type: "testimonials", label: "Opiniones", description: "Lo que dicen tus clientes", group: "Contenido" },
  { type: "cta", label: "Llamada a la acción", description: "Un mensaje destacado con botones", group: "Contenido" },
  { type: "form", label: "Formulario", description: "Formulario configurable que llega a tu CRM", group: "Contenido" },
  { type: "oil_orders", label: "Pedidos de aceites", description: "Pedido conjunto e individual por contacto directo, con condiciones", group: "Contenido" },
  { type: "service_offer", label: "Servicio con precio", description: "Qué incluye, cómo funciona, precio y botón de reserva", group: "Contenido" },
  { type: "resources", label: "Guías y recursos", description: "Productos digitales con el precio y la compra de CRM → Ebooks", group: "Contenido" },
  { type: "connected", label: "Contenido conectado", description: "Listados y fichas con los datos reales (servicios, aceites, agua, blog…)", group: "Conectados" },
];
export const blockLabel = (type: string): string => BLOCK_CATALOG.find((b) => b.type === type)?.label ?? type;

export const FEATURE_ICONS = ["leaf", "heart", "sparkles", "droplets", "sun", "moon", "flower", "hand", "shield", "star", "clock", "map-pin"] as const;

export const newBlockId = (): string => "b" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-3);

const FIELD_DEFAULTS: FormFieldItem[] = [
  { kind: "text", label: "Nombre", placeholder: "", options: "", required: "on", role: "name" },
  { kind: "email", label: "Correo electrónico", placeholder: "", options: "", required: "on", role: "email" },
  { kind: "textarea", label: "Mensaje", placeholder: "", options: "", required: "on", role: "none" },
];

/** Datos iniciales de cada tipo de bloque. */
export function defaultBlockData<K extends BlockType>(type: K): BlockDataMap[K] {
  const d: { [T in BlockType]: BlockDataMap[T] } = {
    hero: { eyebrow: "", title: "Título de la página", subtitle: "", imageUrl: "", imageAlt: "", buttonLabel: "", buttonUrl: "", secondaryLabel: "", secondaryUrl: "", height: "m", breadcrumb: "on", imageX: 50, imageY: 50, imageXM: 50, imageYM: 50 },
    heading: { eyebrow: "", title: "Nuevo título", subtitle: "", level: "h2", align: "center" },
    text: { title: "", html: "<p>Escribe aquí tu texto.</p>", align: "left" },
    image: { url: "", alt: "", caption: "", size: "medium", ratio: "auto", imageX: 50, imageY: 50 },
    gallery: { title: "", images: [], layout: "grid" },
    button: { label: "Más información", url: "/contacto", variant: "primary", align: "center" },
    video: { title: "", url: "", caption: "" },
    columns: { title: "Título", html: "<p>Texto de la sección.</p>", imageUrl: "", imageAlt: "", imagePosition: "right", buttonLabel: "", buttonUrl: "", imageX: 50, imageY: 50 },
    section: { layout: "1-1", gap: "m", valign: "top", mobile: "stack", width: "normal", columns: [{ blocks: [] }, { blocks: [] }] },
    features: { title: "", intro: "", columns: "3", items: [{ icon: "leaf", title: "Ventaja", text: "Descripción breve." }] },
    cards: { title: "", intro: "", columns: "3", items: [{ imageUrl: "", imageAlt: "", title: "Tarjeta", text: "", buttonLabel: "", buttonUrl: "", badge: "" }] },
    faq: { title: "Preguntas frecuentes", items: [{ question: "¿Pregunta?", answer: "Respuesta." }] },
    testimonials: { title: "Opiniones", items: [{ quote: "Una opinión.", author: "Nombre", role: "" }] },
    cta: { title: "¿Hablamos?", text: "", buttonLabel: "Contactar", buttonUrl: "/contacto", secondaryLabel: "", secondaryUrl: "" },
    separator: { kind: "line" },
    oil_orders: {
      title: "Pedidos", groupTitle: "Pedidos conjuntos", groupText: "", groupMin: "", groupNote: "", groupHint: "",
      groupOpen: "off", groupDeadline: "", groupOpenLabel: "Solicitar pedido conjunto", groupOpenUrl: "/contacto", groupClosedLabel: "Consultar el próximo pedido", groupClosedUrl: "/contacto",
      soloTitle: "Pedidos individuales", soloText: "", soloMin: "", soloNote: "", soloHint: "", soloLabel: "Solicitar pedido individual", soloUrl: "/contacto",
      conditionsTitle: "Condiciones generales", conditions: "", closing: "",
    },
    service_offer: { eyebrow: "", title: "Servicio", intro: "", includesTitle: "¿Qué incluye?", includes: "", howTitle: "¿Cómo funciona?", howText: "", priceLabel: "", priceNote: "", buttonLabel: "Reservar", buttonUrl: "", pendingText: "La reserva online todavía no está disponible." },
    resources: { title: "Guías y recursos", intro: "", items: [] },
    form: { title: "Escríbeme", intro: "", fields: FIELD_DEFAULTS.map((f) => ({ ...f })), submitLabel: "Enviar", successMessage: "Gracias, te responderé lo antes posible.", consentText: "He leído y acepto la política de privacidad." },
    connected: { source: "consultas", section: "", eyebrow: "", title: "", intro: "", buttonLabel: "", secondaryLabel: "", secondaryUrl: "" },
  };
  return structuredClone(d[type]) as BlockDataMap[K];
}

export function createBlock<K extends BlockType>(type: K, data?: Partial<BlockDataMap[K]>): BlockOf<K> {
  return { id: newBlockId(), type, data: { ...defaultBlockData(type), ...(data ?? {}) } } as unknown as BlockOf<K>;
}

// ─── Árbol (secciones con columnas) ─────────────────────────────────────────

export interface Place { parent: string | null; col: number; index: number }
export interface Found { block: PageBlock; place: Place; depth: number }

export function walk(blocks: PageBlock[], visit: (f: Found) => void, parent: string | null = null, col = 0, depth = 0): void {
  blocks.forEach((block, index) => {
    visit({ block, place: { parent, col, index }, depth });
    if (block.type === "section") block.data.columns.forEach((c, ci) => walk(c.blocks, visit, block.id, ci, depth + 1));
  });
}
export function findBlock(blocks: PageBlock[], id: string): Found | null {
  let hit: Found | null = null;
  walk(blocks, (f) => { if (!hit && f.block.id === id) hit = f; });
  return hit;
}
export function countBlocks(blocks: PageBlock[]): number {
  let n = 0;
  walk(blocks, () => { n++; });
  return n;
}
/** Aplica `fn` al bloque con ese id (donde esté) y devuelve la lista nueva. */
export function mapBlock(blocks: PageBlock[], id: string, fn: (b: PageBlock) => PageBlock): PageBlock[] {
  return blocks.map((b) => {
    if (b.id === id) return fn(b);
    if (b.type === "section") return { ...b, data: { ...b.data, columns: b.data.columns.map((c) => ({ blocks: mapBlock(c.blocks, id, fn) })) } };
    return b;
  });
}
export function removeBlock(blocks: PageBlock[], id: string): PageBlock[] {
  return blocks
    .filter((b) => b.id !== id)
    .map((b) => (b.type === "section" ? { ...b, data: { ...b.data, columns: b.data.columns.map((c) => ({ blocks: removeBlock(c.blocks, id) })) } } : b));
}
function listAt(blocks: PageBlock[], place: Place): PageBlock[] | null {
  if (place.parent === null) return blocks;
  const f = findBlock(blocks, place.parent);
  return f && f.block.type === "section" ? (f.block.data.columns[place.col]?.blocks ?? null) : null;
}
/** Problema (en español) de colocar bloques ahí, o null si se puede. */
export function placeProblem(blocks: PageBlock[], place: Place, added: PageBlock[]): string | null {
  if (place.parent === null) return null;
  const f = findBlock(blocks, place.parent);
  if (!f || f.block.type !== "section") return "No encuentro esa sección.";
  if (f.depth + 1 >= SECTION_MAX_DEPTH && added.some((b) => b.type === "section")) return "Una sección solo puede llevar otra dentro (un nivel).";
  if (added.some((b) => NOT_NESTABLE.includes(b.type))) return "La cabecera con imagen ocupa todo el ancho: no cabe dentro de una columna.";
  return null;
}
export function insertBlocks(blocks: PageBlock[], place: Place, added: PageBlock[]): PageBlock[] {
  if (place.parent === null) {
    const next = [...blocks];
    next.splice(Math.min(Math.max(place.index, 0), next.length), 0, ...added);
    return next;
  }
  return mapBlock(blocks, place.parent, (b) => {
    if (b.type !== "section") return b;
    const columns = b.data.columns.map((c, ci) => {
      if (ci !== place.col) return c;
      const list = [...c.blocks];
      list.splice(Math.min(Math.max(place.index, 0), list.length), 0, ...added);
      return { blocks: list };
    });
    return { ...b, data: { ...b.data, columns } };
  });
}
export function moveBlock(blocks: PageBlock[], id: string, place: Place): PageBlock[] {
  const f = findBlock(blocks, id);
  if (!f) return blocks;
  // No se puede mover una sección dentro de sí misma
  if (f.block.type === "section" && place.parent && findBlock(f.block.data.columns.flatMap((c) => c.blocks), place.parent)) return blocks;
  if (place.parent === id) return blocks;
  let index = place.index;
  const same = f.place.parent === place.parent && f.place.col === place.col;
  if (same && f.place.index < index) index -= 1;
  const without = removeBlock(blocks, id);
  if (placeProblem(without, place, [f.block])) return blocks;
  return insertBlocks(without, { ...place, index }, [f.block]);
}
/** Mueve un bloque una posición arriba (-1) o abajo (1) dentro de su lista. */
export function shiftBlock(blocks: PageBlock[], id: string, dir: -1 | 1): PageBlock[] {
  const f = findBlock(blocks, id);
  if (!f) return blocks;
  const list = listAt(blocks, f.place);
  if (!list) return blocks;
  const to = f.place.index + dir;
  if (to < 0 || to >= list.length) return blocks;
  return moveBlock(blocks, id, { ...f.place, index: dir === 1 ? to + 1 : to });
}
/** Copia un bloque con ids nuevos (también los de dentro de una sección). */
export function cloneWithNewIds(b: PageBlock): PageBlock {
  const copy = structuredClone(b) as PageBlock;
  const renew = (x: PageBlock) => {
    x.id = newBlockId();
    if (x.type === "section") x.data.columns.forEach((c) => c.blocks.forEach(renew));
  };
  renew(copy);
  return copy;
}
export function duplicateBlock(blocks: PageBlock[], id: string): { blocks: PageBlock[]; newId: string | null } {
  const f = findBlock(blocks, id);
  if (!f) return { blocks, newId: null };
  const copy = cloneWithNewIds(f.block);
  return { blocks: insertBlocks(blocks, { ...f.place, index: f.place.index + 1 }, [copy]), newId: copy.id };
}
/** Ajusta el número de columnas de una sección a su reparto (conserva los bloques; los sobrantes pasan a la última). */
export function relayoutColumns(columns: SectionColumn[], layout: string): SectionColumn[] {
  const n = sectionColumnCount(layout);
  const next = columns.slice(0, n).map((c) => ({ blocks: [...c.blocks] }));
  while (next.length < n) next.push({ blocks: [] });
  for (const extra of columns.slice(n)) next[n - 1].blocks.push(...extra.blocks);
  return next;
}

// ─── Textos de páginas (SEO) y contenido de cada documento ──────────────────

export interface PageSeo { title: string; description: string; ogImage: string; noindex: boolean }
export const DEFAULT_SEO: PageSeo = { title: "", description: "", ogImage: "", noindex: false };

export interface PageContent { v: 1; seo: PageSeo; blocks: PageBlock[]; /** Ids de bloques ya cargados desde la web actual (la carga inicial no los repite ni los resucita si se borran) */ seed?: string[] }
export const emptyPageContent = (): PageContent => ({ v: 1, seo: { ...DEFAULT_SEO }, blocks: [] });

// ─── Ajustes globales ───────────────────────────────────────────────────────

export interface NavItem { label: string; url: string }
export interface FooterColumn { title: string; links: NavItem[] }
export interface SiteGlobal {
  identity: { logoUrl: string; logoAlt: string };
  announcement: { enabled: OnOff; text: string; linkLabel: string; linkUrl: string };
  header: {
    nav: NavItem[];
    /** Menú del móvil; vacío = el mismo que el de escritorio */
    mobileNav: NavItem[];
    /** Cuántas entradas del menú caben en escritorio (el resto solo en móvil) */
    desktopCount: number;
    contactLabel: string;
    contactUrl: string;
    /** Botón destacado: abre la reserva o va a un enlace */
    ctaLabel: string;
    ctaMode: "booking" | "link";
    ctaUrl: string;
  };
  footer: {
    about: string;
    columns: FooterColumn[];
    contactTitle: string;
    contactEmail: string;
    contactLine: string;
    ctaLabel: string;
    ctaUrl: string;
    instagram: string;
    facebook: string;
    youtube: string;
    copyright: string;
    legalLinks: NavItem[];
    showPrivateLink: OnOff;
  };
  whatsapp: { enabled: OnOff; number: string; tooltipTitle: string; tooltipText: string };
  /** Textos sueltos de la web (reserva, compra, avisos), por clave: ver LABEL_DEFS */
  labels: Record<string, string>;
}

export const DEFAULT_GLOBAL: SiteGlobal = {
  identity: { logoUrl: "/logo-bion.png", logoAlt: "BION — Cristina Vive Consciente" },
  announcement: { enabled: "off", text: "", linkLabel: "", linkUrl: "" },
  header: {
    nav: [
      { label: "Inicio", url: "/" }, { label: "Consultas", url: "/consultas" }, { label: "Masajes", url: "/masajes" },
      { label: "Sistemas de Agua", url: "/sistemas-agua" }, { label: "Aceites Esenciales", url: "/aceites-esenciales" },
      { label: "Guías Digitales", url: "/guias-digitales" }, { label: "Recomendados", url: "/recomendados" },
      { label: "Blog", url: "/blog" }, { label: "Contacto", url: "/contacto" },
    ],
    mobileNav: [],
    desktopCount: 7,
    contactLabel: "Contacto",
    contactUrl: "/contacto",
    ctaLabel: "Reservar consulta",
    ctaMode: "booking",
    ctaUrl: "/consultas",
  },
  footer: {
    about: "Un espacio de bienestar consciente donde la naturaleza y la sabiduría se unen para guiarte hacia tu mejor versión.",
    columns: [
      { title: "Servicios", links: [
        { label: "Consultas Holísticas", url: "/consultas" }, { label: "Masajes Terapéuticos", url: "/masajes" },
        { label: "Sistemas de Agua", url: "/sistemas-agua" }, { label: "Aceites Esenciales", url: "/aceites-esenciales" },
        { label: "Guías Digitales", url: "/guias-digitales" },
      ] },
      { title: "Explorar", links: [{ label: "Recomendados", url: "/recomendados" }, { label: "Blog", url: "/blog" }, { label: "Contacto", url: "/contacto" }] },
    ],
    contactTitle: "Contacto",
    contactEmail: "hola@cristinaviveconsciente.com",
    contactLine: "Consultas por cita previa",
    ctaLabel: "Reservar consulta",
    ctaUrl: "/consultas",
    instagram: "",
    facebook: "",
    youtube: "",
    copyright: "BION — Cristina Vive Consciente. Todos los derechos reservados.",
    legalLinks: [{ label: "Privacidad", url: "/privacidad" }, { label: "Cookies", url: "/politica-de-cookies" }],
    showPrivateLink: "on",
  },
  whatsapp: {
    enabled: "on",
    number: "",
    tooltipTitle: "¡Hola! Soy Cristina 🌿",
    tooltipText: "¿Tienes alguna pregunta? Escríbeme por WhatsApp y te respondo encantada.",
  },
  labels: {},
};

/** Textos editables de los procesos de reserva y compra y otros avisos: clave, dónde se ven y texto de serie. */
const BASE_LABELS: readonly LabelDef[] = [
  { key: "booking.successTitle", group: "Reserva de cita", where: "Ventana de reserva de consultas: título tras enviar la solicitud", text: "¡Solicitud recibida!" },
  { key: "booking.successTitleMassage", group: "Reserva de cita", where: "Ventana de reserva de masajes: título tras enviar la solicitud", text: "Solicitud recibida" },
  { key: "booking.submit", group: "Reserva de cita", where: "Botón de enviar la solicitud de cita", text: "Enviar solicitud" },
  { key: "order.paidTitle", group: "Compra y pedido", where: "Pedido pagado: título", text: "¡Pago confirmado!" },
  { key: "order.claimButton", group: "Compra y pedido", where: "Pedido por Bizum: botón para avisar del pago", text: "Ya he hecho el Bizum" },
  { key: "order.claimed", group: "Compra y pedido", where: "Pedido por Bizum: mensaje tras avisar del pago", text: "Gracias. Cristina ya sabe que has pagado y lo está comprobando. En cuanto lo confirme recibirás la guía en tu email.", long: true },
  { key: "ebook.thanksTitle", group: "Guías digitales", where: "Página de gracias tras la compra: título", text: "¡Gracias por tu compra!" },
  { key: "contact.toast", group: "Contacto", where: "Aviso tras enviar el formulario de contacto", text: "Mensaje enviado. Cristina te responderá en 24–48 horas.", long: true },
  { key: "notfound.title", group: "Otros", where: "Página no encontrada: título", text: "Página no encontrada" },
  { key: "notfound.text", group: "Otros", where: "Página no encontrada: texto", text: "Parece que esta página no existe o ha sido movida. Vuelve al inicio para seguir explorando.", long: true },
];
export const LABEL_DEFS: readonly LabelDef[] = [...BASE_LABELS, ...MASAJES_LABELS, ...AGUA_LABELS, ...ACEITES_LABELS, ...CONTACTO_LABELS];
export const labelText = (labels: Record<string, string> | undefined, key: string): string => {
  const own = labels?.[key];
  if (own !== undefined && own !== "") return own;
  return LABEL_DEFS.find((d) => d.key === key)?.text ?? "";
};

export interface GlobalContent { v: 1; global: SiteGlobal }

// ─── Registro de páginas y plantillas ───────────────────────────────────────

export const GLOBAL_KEY = "global";
export interface PageDef { docKey: string; label: string; kind: "page" | "template"; /** Ruta pública para abrir y previsualizar (ejemplo en plantillas) */ route: string; sitemap: boolean; note?: string }
export const SYSTEM_PAGES: readonly PageDef[] = [
  { docKey: "/", label: "Portada", kind: "page", route: "/", sitemap: true },
  { docKey: "/consultas", label: "Consultas", kind: "page", route: "/consultas", sitemap: true },
  { docKey: "/masajes", label: "Masajes", kind: "page", route: "/masajes", sitemap: true },
  { docKey: "/sistemas-agua", label: "Sistemas de Agua", kind: "page", route: "/sistemas-agua", sitemap: true },
  { docKey: "/aceites-esenciales", label: "Aceites Esenciales", kind: "page", route: "/aceites-esenciales", sitemap: true },
  { docKey: "/guias-digitales", label: "Guías Digitales", kind: "page", route: "/guias-digitales", sitemap: true },
  { docKey: "/recomendados", label: "Recomendados", kind: "page", route: "/recomendados", sitemap: true },
  { docKey: "/contacto", label: "Contacto", kind: "page", route: "/contacto", sitemap: true },
  { docKey: "/blog", label: "Blog", kind: "page", route: "/blog", sitemap: true },
  { docKey: "/privacidad", label: "Política de privacidad", kind: "page", route: "/privacidad", sitemap: false, note: "Página legal" },
  { docKey: "/politica-de-cookies", label: "Política de cookies", kind: "page", route: "/politica-de-cookies", sitemap: false, note: "Página legal" },
  { docKey: "tpl:/consultas/:slug", label: "Ficha de consulta", kind: "template", route: "/consultas/:slug", sitemap: false },
  { docKey: "tpl:/masajes/:slug", label: "Ficha de masaje", kind: "template", route: "/masajes/:slug", sitemap: false },
  { docKey: "tpl:/sistemas-agua/:slug", label: "Ficha de sistema de agua", kind: "template", route: "/sistemas-agua/:slug", sitemap: false },
  { docKey: "tpl:/aceites-esenciales/:slug", label: "Ficha de aceite esencial", kind: "template", route: "/aceites-esenciales/:slug", sitemap: false },
  { docKey: "tpl:/blog/:slug", label: "Artículo del blog", kind: "template", route: "/blog/:slug", sitemap: false },
];
export const systemPage = (docKey: string): PageDef | undefined => SYSTEM_PAGES.find((p) => p.docKey === docKey);

/** Rutas de primer nivel que ya usa la web: una página nueva no puede ocuparlas. */
export const RESERVED_SLUGS = [
  "crm", "admin", "api", "uploads", "consultas", "masajes", "sistemas-agua", "aceites-esenciales", "mi-consulta", "guias-digitales",
  "recomendados", "contacto", "blog", "ebooks", "pedido", "cita", "a", "privacidad", "politica-de-cookies", "sitemap.xml", "robots.txt", "404", "preview",
] as const;
export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export function slugProblem(slug: string): string | null {
  if (!slug) return "Escribe la dirección de la página.";
  if (!SLUG_RE.test(slug)) return "Usa solo minúsculas, números y guiones (por ejemplo: sobre-mi).";
  if (slug.length > 60) return "La dirección es demasiado larga (máximo 60 caracteres).";
  if ((RESERVED_SLUGS as readonly string[]).includes(slug)) return "Esa dirección ya la usa la web.";
  return null;
}
/** Convierte un título en dirección: «Sobre mí» → «sobre-mi». */
export function slugify(title: string): string {
  return title.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

/** Plantilla a la que pertenece una ruta de ficha, o null. */
export function templateKeyFor(path: string): string | null {
  const m = path.match(/^\/(consultas|masajes|sistemas-agua|aceites-esenciales|blog)\/[^/]+$/);
  return m ? `tpl:/${m[1]}/:slug` : null;
}
