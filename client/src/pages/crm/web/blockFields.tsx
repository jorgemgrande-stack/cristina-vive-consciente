/**
 * Editar web — formularios de cada bloque (contenido y diseño). Todo en español y con valores de lista cerrada.
 */
import { useEffect, useRef, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Bold, Italic, Link2, List, ListOrdered, Plus, Trash2 } from "lucide-react";
import {
  BLOCK_CATALOG, CONNECTED_SOURCES, DEFAULT_BLOCK_STYLE, DEVICES, FEATURE_ICONS, type BlockStyle, type BlockType, type PageBlock,
} from "@shared/siteEditor";
import { ImageUploader } from "@/components/ImageUploader";
import { ImageField, FocusPicker } from "./media";
import { SITE_ACTIONS } from "@shared/siteActions";
import { FICHA_SECTIONS } from "@shared/fichaSections";
import { sanitizeClientHtml } from "@/components/site/PageBlocksView";
import { inputCls, labelCls } from "./shared";

// ─── Esquema de campos ──────────────────────────────────────────────────────

export type FieldDef =
  | { key: string; label: string; kind: "text" | "textarea" | "rich" | "image" | "url" | "date"; hint?: string }
  | { key: string; label: string; kind: "focus"; imageKey: string; xKey: string; yKey: string }
  | { key: string; label: string; kind: "select"; options: ReadonlyArray<readonly [string, string]> }
  | { key: string; label: string; kind: "list"; itemLabel: string; fields: FieldDef[]; max: number; blank: Record<string, unknown> };

const opt = <T extends string>(...pairs: Array<[T, string]>) => pairs as ReadonlyArray<readonly [string, string]>;
const ICON_OPTIONS = FEATURE_ICONS.map((i) => [i, i] as const);

export const BLOCK_FIELDS: Record<BlockType, FieldDef[]> = {
  hero: [
    { key: "eyebrow", label: "Antetítulo (pequeño, sobre el título)", kind: "text" },
    { key: "title", label: "Título", kind: "text" },
    { key: "subtitle", label: "Texto bajo el título", kind: "textarea" },
    { key: "imageUrl", label: "Imagen de fondo", kind: "image" },
    { key: "imageAlt", label: "Descripción de la imagen (accesibilidad)", kind: "text" },
    { key: "buttonLabel", label: "Texto del botón (opcional)", kind: "text" },
    { key: "buttonUrl", label: "Enlace del botón", kind: "url" },
    { key: "secondaryLabel", label: "Segundo botón (opcional)", kind: "text" },
    { key: "secondaryUrl", label: "Enlace del segundo botón", kind: "url" },
    { key: "imageX", label: "Encuadre de la imagen en ordenador", kind: "focus", imageKey: "imageUrl", xKey: "imageX", yKey: "imageY" },
    { key: "imageXM", label: "Encuadre de la imagen en móvil", kind: "focus", imageKey: "imageUrl", xKey: "imageXM", yKey: "imageYM" },
    { key: "height", label: "Altura", kind: "select", options: opt(["m", "Normal"], ["l", "Alta"], ["full", "Pantalla completa"]) },
    { key: "breadcrumb", label: "Migas de pan (Inicio › Página)", kind: "select", options: opt(["on", "Mostrar"], ["off", "Ocultar"]) },
  ],
  heading: [
    { key: "eyebrow", label: "Antetítulo", kind: "text" },
    { key: "title", label: "Título", kind: "text" },
    { key: "subtitle", label: "Subtítulo", kind: "textarea" },
    { key: "level", label: "Nivel", kind: "select", options: opt(["h1", "Principal (H1)"], ["h2", "Sección (H2)"], ["h3", "Subsección (H3)"]) },
    { key: "align", label: "Alineación", kind: "select", options: opt(["center", "Centrado"], ["left", "A la izquierda"]) },
  ],
  text: [
    { key: "title", label: "Título (opcional)", kind: "text" },
    { key: "html", label: "Texto", kind: "rich" },
    { key: "align", label: "Alineación", kind: "select", options: opt(["left", "A la izquierda"], ["center", "Centrado"]) },
  ],
  image: [
    { key: "url", label: "Imagen", kind: "image" },
    { key: "alt", label: "Descripción (accesibilidad)", kind: "text" },
    { key: "caption", label: "Pie de foto", kind: "text" },
    { key: "size", label: "Tamaño", kind: "select", options: opt(["medium", "Mediano"], ["wide", "Ancho"]) },
    { key: "ratio", label: "Proporción (recorta la imagen para encajarla)", kind: "select", options: opt(["auto", "La de la imagen"], ["16:9", "Panorámica 16:9"], ["4:3", "Clásica 4:3"], ["1:1", "Cuadrada"]) },
    { key: "imageX", label: "Encuadre", kind: "focus", imageKey: "url", xKey: "imageX", yKey: "imageY" },
  ],
  gallery: [
    { key: "title", label: "Título (opcional)", kind: "text" },
    { key: "layout", label: "Disposición", kind: "select", options: opt(["grid", "Cuadrícula"], ["masonry", "Mosaico"]) },
    { key: "images", label: "Imágenes", kind: "list", itemLabel: "Imagen", max: 24, blank: { url: "", alt: "" }, fields: [{ key: "url", label: "Imagen", kind: "image" }, { key: "alt", label: "Descripción", kind: "text" }] },
  ],
  button: [
    { key: "label", label: "Texto del botón", kind: "text" },
    { key: "url", label: "Enlace", kind: "url" },
    { key: "variant", label: "Estilo", kind: "select", options: opt(["primary", "Relleno"], ["outline", "Con borde"]) },
    { key: "align", label: "Posición", kind: "select", options: opt(["center", "Centrado"], ["left", "A la izquierda"]) },
  ],
  video: [
    { key: "title", label: "Título (opcional)", kind: "text" },
    { key: "url", label: "Enlace del vídeo (YouTube o Vimeo)", kind: "url" },
    { key: "caption", label: "Pie del vídeo", kind: "text" },
  ],
  columns: [
    { key: "title", label: "Título", kind: "text" },
    { key: "html", label: "Texto", kind: "rich" },
    { key: "imageUrl", label: "Imagen", kind: "image" },
    { key: "imageAlt", label: "Descripción de la imagen", kind: "text" },
    { key: "imageX", label: "Encuadre de la imagen", kind: "focus", imageKey: "imageUrl", xKey: "imageX", yKey: "imageY" },
    { key: "imagePosition", label: "Posición de la imagen", kind: "select", options: opt(["right", "A la derecha"], ["left", "A la izquierda"]) },
    { key: "buttonLabel", label: "Texto del botón (opcional)", kind: "text" },
    { key: "buttonUrl", label: "Enlace del botón", kind: "url" },
  ],
  section: [
    { key: "layout", label: "Reparto de columnas", kind: "select", options: opt(["1", "Una columna"], ["1-1", "Dos iguales"], ["1-2", "Un tercio + dos tercios"], ["2-1", "Dos tercios + un tercio"], ["1-1-1", "Tres iguales"], ["1-2-1", "Estrecha + ancha + estrecha"]) },
    { key: "gap", label: "Separación entre columnas", kind: "select", options: opt(["s", "Pequeña"], ["m", "Media"], ["l", "Grande"]) },
    { key: "valign", label: "Alineación vertical", kind: "select", options: opt(["top", "Arriba"], ["center", "Centrada"]) },
    { key: "mobile", label: "En el móvil", kind: "select", options: opt(["stack", "Una debajo de otra"], ["reverse", "La primera columna al final"]) },
    { key: "width", label: "Ancho", kind: "select", options: opt(["normal", "Normal"], ["wide", "Ancho"]) },
  ],
  features: [
    { key: "title", label: "Título", kind: "text" },
    { key: "intro", label: "Introducción", kind: "textarea" },
    { key: "columns", label: "Columnas en escritorio", kind: "select", options: opt(["2", "2"], ["3", "3"], ["4", "4"]) },
    { key: "items", label: "Elementos", kind: "list", itemLabel: "Elemento", max: 30, blank: { icon: "leaf", title: "Nuevo", text: "" }, fields: [{ key: "icon", label: "Icono", kind: "select", options: ICON_OPTIONS }, { key: "title", label: "Título", kind: "text" }, { key: "text", label: "Texto", kind: "textarea" }, { key: "buttonLabel", label: "Texto del botón (opcional)", kind: "text" }, { key: "buttonUrl", label: "Enlace del botón", kind: "url" }] },
  ],
  cards: [
    { key: "title", label: "Título", kind: "text" },
    { key: "intro", label: "Introducción", kind: "textarea" },
    { key: "columns", label: "Columnas en escritorio", kind: "select", options: opt(["2", "2"], ["3", "3"], ["4", "4"]) },
    { key: "items", label: "Tarjetas", kind: "list", itemLabel: "Tarjeta", max: 30, blank: { imageUrl: "", imageAlt: "", title: "Nueva tarjeta", text: "", buttonLabel: "", buttonUrl: "", badge: "" }, fields: [{ key: "imageUrl", label: "Imagen", kind: "image" }, { key: "badge", label: "Etiqueta sobre la imagen (opcional)", kind: "text" }, { key: "imageAlt", label: "Descripción de la imagen", kind: "text" }, { key: "title", label: "Título", kind: "text" }, { key: "text", label: "Texto", kind: "textarea" }, { key: "buttonLabel", label: "Texto del botón", kind: "text" }, { key: "buttonUrl", label: "Enlace del botón", kind: "url" }] },
  ],
  faq: [
    { key: "title", label: "Título", kind: "text" },
    { key: "items", label: "Preguntas", kind: "list", itemLabel: "Pregunta", max: 30, blank: { question: "¿Pregunta?", answer: "" }, fields: [{ key: "question", label: "Pregunta", kind: "text" }, { key: "answer", label: "Respuesta", kind: "textarea" }] },
  ],
  testimonials: [
    { key: "title", label: "Título", kind: "text" },
    { key: "items", label: "Opiniones", kind: "list", itemLabel: "Opinión", max: 30, blank: { quote: "", author: "", role: "" }, fields: [{ key: "quote", label: "Opinión", kind: "textarea" }, { key: "author", label: "Nombre", kind: "text" }, { key: "role", label: "Detalle (opcional)", kind: "text" }] },
  ],
  cta: [
    { key: "title", label: "Título", kind: "text" },
    { key: "text", label: "Texto", kind: "textarea" },
    { key: "buttonLabel", label: "Botón principal", kind: "text" },
    { key: "buttonUrl", label: "Enlace del botón principal", kind: "url" },
    { key: "secondaryLabel", label: "Botón secundario (opcional)", kind: "text" },
    { key: "secondaryUrl", label: "Enlace del botón secundario", kind: "url" },
  ],
  separator: [{ key: "kind", label: "Tipo", kind: "select", options: opt(["line", "Línea"], ["space", "Espacio en blanco"]) }],
  oil_orders: [
    { key: "title", label: "Título del apartado", kind: "text" },
    { key: "groupTitle", label: "Pedido conjunto · título", kind: "text" },
    { key: "groupText", label: "Pedido conjunto · texto", kind: "textarea" },
    { key: "groupOpen", label: "Pedido conjunto · estado", kind: "select", options: opt(["off", "Cerrado"], ["on", "Abierto (hasta la fecha límite)"]) },
    { key: "groupDeadline", label: "Pedido conjunto · fecha límite (incluida, hora de Madrid)", kind: "date" },
    { key: "groupMin", label: "Pedido conjunto · importe mínimo", kind: "text" },
    { key: "groupNote", label: "Pedido conjunto · nota sobre el envío", kind: "text" },
    { key: "groupHint", label: "Pedido conjunto · frase cuando no está abierto", kind: "text" },
    { key: "groupOpenLabel", label: "Pedido conjunto · botón cuando está abierto", kind: "text" },
    { key: "groupOpenUrl", label: "Pedido conjunto · destino cuando está abierto", kind: "url" },
    { key: "groupClosedLabel", label: "Pedido conjunto · botón cuando está cerrado", kind: "text" },
    { key: "groupClosedUrl", label: "Pedido conjunto · destino cuando está cerrado", kind: "url" },
    { key: "soloTitle", label: "Pedido individual · título", kind: "text" },
    { key: "soloText", label: "Pedido individual · texto", kind: "textarea" },
    { key: "soloMin", label: "Pedido individual · importe mínimo", kind: "text" },
    { key: "soloNote", label: "Pedido individual · nota sobre el envío", kind: "text" },
    { key: "soloHint", label: "Pedido individual · frase final", kind: "text" },
    { key: "soloLabel", label: "Pedido individual · botón", kind: "text" },
    { key: "soloUrl", label: "Pedido individual · destino", kind: "url" },
    { key: "conditionsTitle", label: "Condiciones · título", kind: "text" },
    { key: "conditions", label: "Condiciones (una por línea)", kind: "textarea" },
    { key: "closing", label: "Frase de cierre", kind: "textarea" },
  ],
  service_offer: [
    { key: "eyebrow", label: "Antetítulo", kind: "text" },
    { key: "title", label: "Título", kind: "text" },
    { key: "intro", label: "Introducción", kind: "textarea" },
    { key: "includesTitle", label: "Título de «qué incluye»", kind: "text" },
    { key: "includes", label: "Qué incluye (un punto por línea)", kind: "textarea" },
    { key: "howTitle", label: "Título de «cómo funciona»", kind: "text" },
    { key: "howText", label: "Cómo funciona", kind: "textarea" },
    { key: "serviceSlug", label: "Consulta vinculada (identificador en CRM → Servicios). De ella salen el precio y la reserva", kind: "text" },
    { key: "priceLabel", label: "Línea del precio ({precio} = el de CRM → Servicios)", kind: "text" },
    { key: "priceNote", label: "Qué cubre el precio", kind: "textarea" },
    { key: "buttonLabel", label: "Texto del botón", kind: "text" },
    { key: "buttonUrl", label: "Destino si no hay consulta publicada (vacío = botón inactivo)", kind: "url" },
    { key: "pendingText", label: "Aviso mientras no hay destino", kind: "text" },
    { key: "helpLabel", label: "Enlace para dudas (texto, opcional)", kind: "text" },
    { key: "helpUrl", label: "Enlace para dudas (destino)", kind: "url" },
  ],
  resources: [
    { key: "title", label: "Título", kind: "text" },
    { key: "intro", label: "Introducción", kind: "textarea" },
    { key: "items", label: "Recursos", kind: "list", itemLabel: "Recurso", max: 30, blank: { ebookSlug: "", title: "Nuevo recurso", text: "", buttonLabel: "Adquirir guía" }, fields: [
      { key: "title", label: "Título", kind: "text" },
      { key: "text", label: "Descripción", kind: "textarea" },
      { key: "ebookSlug", label: "Identificador del ebook (CRM → Ebooks). El precio y la compra salen de él", kind: "text" },
      { key: "buttonLabel", label: "Texto del botón", kind: "text" },
    ] },
  ],
  form: [
    { key: "title", label: "Título", kind: "text" },
    { key: "intro", label: "Texto de introducción", kind: "textarea" },
    { key: "fields", label: "Campos", kind: "list", itemLabel: "Campo", max: 20, blank: { kind: "text", label: "Campo", placeholder: "", options: "", required: "off", role: "none" }, fields: [
      { key: "label", label: "Pregunta o etiqueta", kind: "text" },
      { key: "kind", label: "Tipo", kind: "select", options: opt(["text", "Texto corto"], ["email", "Correo electrónico"], ["phone", "Teléfono"], ["textarea", "Texto largo"], ["select", "Desplegable"], ["checkbox", "Casilla"]) },
      { key: "placeholder", label: "Texto de ayuda", kind: "text" },
      { key: "options", label: "Opciones del desplegable (una por línea)", kind: "textarea" },
      { key: "required", label: "¿Obligatorio?", kind: "select", options: opt(["on", "Sí"], ["off", "No"]) },
      { key: "role", label: "Dato del contacto en el CRM", kind: "select", options: opt(["none", "Ninguno"], ["name", "Nombre"], ["email", "Correo"], ["phone", "Teléfono"]) },
    ] },
    { key: "submitLabel", label: "Texto del botón de enviar", kind: "text" },
    { key: "successMessage", label: "Mensaje tras enviar", kind: "textarea" },
    { key: "consentText", label: "Texto de la casilla de privacidad", kind: "text" },
  ],
  connected: [
    { key: "source", label: "Qué contenido muestra", kind: "select", options: CONNECTED_SOURCES.map((s) => [s.value, s.label] as const) },
  ],
};

/** Textos editables del catálogo de aceites (bloque conectado). */
const OILS_FIELDS: FieldDef[] = [
  { key: "title", label: "Título del catálogo", kind: "text" },
  { key: "intro", label: "Texto introductorio (deja una línea en blanco entre párrafos)", kind: "textarea" },
  { key: "buttonLabel", label: "Botón general", kind: "text" },
  { key: "secondaryUrl", label: "Destino del botón general", kind: "url" },
];

/** Campos extra del bloque conectado de la presentación de la portada. */
const SLIDESHOW_FIELDS: FieldDef[] = [
  { key: "eyebrow", label: "Antetítulo", kind: "text" },
  { key: "title", label: "Título grande", kind: "text" },
  { key: "intro", label: "Texto bajo el título", kind: "textarea" },
  { key: "buttonLabel", label: "Botón principal (abre la reserva)", kind: "text" },
  { key: "secondaryLabel", label: "Botón secundario", kind: "text" },
  { key: "secondaryUrl", label: "Enlace del botón secundario", kind: "url" },
];

// ─── Editor de texto con formato ────────────────────────────────────────────

export function RichTextEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const last = useRef(value);
  useEffect(() => {
    if (ref.current && value !== last.current) { ref.current.innerHTML = sanitizeClientHtml(value); last.current = value; }
  }, [value]);
  useEffect(() => { if (ref.current) ref.current.innerHTML = sanitizeClientHtml(value); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const emit = () => {
    const html = sanitizeClientHtml(ref.current?.innerHTML ?? "");
    last.current = html;
    onChange(html);
  };
  const cmd = (name: string, arg?: string) => { ref.current?.focus(); document.execCommand(name, false, arg); emit(); };
  const link = () => {
    const url = window.prompt("Dirección del enlace (por ejemplo /contacto o https://…)");
    if (url) cmd("createLink", url);
  };
  const btn = "p-1.5 border border-[oklch(0.88_0.015_75)] bg-white hover:bg-[oklch(0.96_0.006_85)]";
  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-1" role="toolbar" aria-label="Formato del texto">
        <button type="button" className={btn} onClick={() => cmd("bold")} aria-label="Negrita"><Bold size={13} /></button>
        <button type="button" className={btn} onClick={() => cmd("italic")} aria-label="Cursiva"><Italic size={13} /></button>
        <button type="button" className={btn} onClick={() => cmd("insertUnorderedList")} aria-label="Lista"><List size={13} /></button>
        <button type="button" className={btn} onClick={() => cmd("insertOrderedList")} aria-label="Lista numerada"><ListOrdered size={13} /></button>
        <button type="button" className={`${btn} text-xs px-2`} onClick={() => cmd("formatBlock", "h3")}>Subtítulo</button>
        <button type="button" className={`${btn} text-xs px-2`} onClick={() => cmd("formatBlock", "p")}>Párrafo</button>
        <button type="button" className={btn} onClick={link} aria-label="Enlace"><Link2 size={13} /></button>
      </div>
      <div ref={ref} contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" aria-label="Texto" onInput={emit} onBlur={emit} className={`${inputCls} min-h-[120px] cvc-prose`} />
    </div>
  );
}

// ─── Campos ─────────────────────────────────────────────────────────────────

function Field({ def, value, onChange }: { def: FieldDef; value: unknown; onChange: (v: unknown) => void }) {
  const id = `fld-${def.key}-${Math.random().toString(36).slice(2, 7)}`;
  switch (def.kind) {
    case "text":
      return <div><label className={labelCls} htmlFor={id}>{def.label}</label><input id={id} className={inputCls} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} /></div>;
    case "url": {
      const v = String(value ?? "");
      const isAction = v.startsWith("action:");
      return (
        <div>
          <label className={labelCls} htmlFor={id}>{def.label}</label>
          <select aria-label={`Tipo de destino de: ${def.label}`} className={`${inputCls} mb-1`} value={isAction ? v : "url"} onChange={(e) => onChange(e.target.value === "url" ? "" : e.target.value)}>
            <option value="url">Una dirección o enlace</option>
            {SITE_ACTIONS.map((a) => <option key={a.value} value={`action:${a.value}`}>Acción: {a.label}</option>)}
          </select>
          {!isAction && <input id={id} className={inputCls} value={v} onChange={(e) => onChange(e.target.value)} placeholder="/contacto, #ancla o https://…" />}
        </div>
      );
    }
    case "date":
      return <div><label className={labelCls} htmlFor={id}>{def.label}</label><input id={id} type="date" className={inputCls} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} /></div>;
    case "textarea":
      return <div><label className={labelCls} htmlFor={id}>{def.label}</label><textarea id={id} rows={3} className={inputCls} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} /></div>;
    case "rich":
      return <div><span className={labelCls}>{def.label}</span><RichTextEditor value={String(value ?? "")} onChange={onChange} /></div>;
    case "image":
      return <div><span className={labelCls}>{def.label}</span><ImageField value={String(value ?? "")} onChange={(u) => onChange(u)} /></div>;
    case "focus":
      return null; // se pinta desde ContentFields (necesita la imagen y las dos coordenadas)
    case "select":
      return <div><label className={labelCls} htmlFor={id}>{def.label}</label><select id={id} className={inputCls} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>{def.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>;
    case "list": {
      const items = (Array.isArray(value) ? value : []) as Record<string, unknown>[];
      const set = (next: Record<string, unknown>[]) => onChange(next);
      const move = (i: number, d: -1 | 1) => { const n = [...items]; const j = i + d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; set(n); };
      return (
        <div>
          <span className={labelCls}>{def.label}</span>
          <div className="space-y-3">
            {items.map((it, i) => (
              <div key={i} className="border border-[oklch(0.9_0.012_75)] bg-[oklch(0.985_0.004_85)] p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-body text-[oklch(0.45_0.02_55)]">
                  <span style={{ fontWeight: 500 }}>{def.itemLabel} {i + 1}</span>
                  <span className="flex gap-1">
                    <button type="button" className="p-1 hover:bg-white" onClick={() => move(i, -1)} aria-label="Subir"><ArrowUp size={12} /></button>
                    <button type="button" className="p-1 hover:bg-white" onClick={() => move(i, 1)} aria-label="Bajar"><ArrowDown size={12} /></button>
                    <button type="button" className="p-1 hover:bg-white text-red-700" onClick={() => set(items.filter((_, k) => k !== i))} aria-label="Quitar"><Trash2 size={12} /></button>
                  </span>
                </div>
                {def.fields.map((f) => <Field key={f.key} def={f} value={it[f.key]} onChange={(v) => set(items.map((x, k) => (k === i ? { ...x, [f.key]: v } : x)))} />)}
              </div>
            ))}
          </div>
          {items.length < def.max && (
            <button type="button" className="mt-2 inline-flex items-center gap-1 text-xs px-3 py-1.5 border border-[oklch(0.85_0.015_75)] bg-white hover:bg-[oklch(0.97_0.006_85)]" onClick={() => set([...items, structuredClone(def.blank)])}>
              <Plus size={12} /> Añadir {def.itemLabel.toLowerCase()}
            </button>
          )}
        </div>
      );
    }
  }
}

export function ContentFields({ block, onChange, detailKind }: { block: PageBlock; onChange: (data: Record<string, unknown>) => void; detailKind?: string | null }) {
  const data = block.data as unknown as Record<string, unknown>;
  const isSlideshow = block.type === "connected" && data.source === "home_slideshow";
  const isOils = block.type === "connected" && data.source === "aceites";
  const defs = [...BLOCK_FIELDS[block.type], ...(isSlideshow ? SLIDESHOW_FIELDS : []), ...(isOils ? OILS_FIELDS : [])];
  const note = block.type === "connected" ? CONNECTED_SOURCES.find((s) => s.value === data.source)?.note : null;
  return (
    <div className="space-y-4">
      {defs.map((d) =>
        d.kind === "focus" ? (
          <FocusPicker key={d.key} label={d.label} url={String(data[d.imageKey] ?? "")} x={Number(data[d.xKey] ?? 50)} y={Number(data[d.yKey] ?? 50)} onChange={(x, y) => onChange({ ...data, [d.xKey]: x, [d.yKey]: y })} />
        ) : (
          <Field key={d.key} def={d} value={data[d.key]} onChange={(v) => onChange({ ...data, [d.key]: v })} />
        ),
      )}
      {block.type === "connected" && data.source === "ficha" && (
        <div>
          <label className={labelCls} htmlFor="ficha-sec">Sección de la ficha</label>
          <select id="ficha-sec" className={inputCls} value={String(data.section ?? "")} onChange={(e) => onChange({ ...data, section: e.target.value })}>
            <option value="">Elige una sección…</option>
            {(FICHA_SECTIONS[detailKind ?? ""] ?? []).map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
      )}
      {note && <p className="text-xs font-body text-[oklch(0.45_0.02_55)] bg-[oklch(0.96_0.02_148)] p-3">{note}. Los datos no se copian: se editan en su propia sección del panel y aquí solo eliges dónde y cómo se muestran.</p>}
    </div>
  );
}

// ─── Diseño ─────────────────────────────────────────────────────────────────

const SPACES = [["0", "Ninguno"], ["s", "Pequeño"], ["m", "Medio"], ["l", "Grande"], ["xl", "Muy grande"]] as const;
const ALIGNS = [["auto", "Automática"], ["left", "Izquierda"], ["center", "Centro"], ["right", "Derecha"]] as const;
const DEVICE_LABEL: Record<string, string> = { desktop: "Ordenador", tablet: "Tableta", mobile: "Móvil" };

function Sel<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: ReadonlyArray<readonly [string, string]>; onChange: (v: T) => void }) {
  const id = `sel-${label}`;
  return <div><label className={labelCls} htmlFor={id}>{label}</label><select id={id} className={inputCls} value={value} onChange={(e) => onChange(e.target.value as T)}>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>;
}

export function DesignFields({ block, onChange }: { block: PageBlock; onChange: (style: BlockStyle) => void }) {
  const st: BlockStyle = { ...DEFAULT_BLOCK_STYLE, ...(block.style ?? {}) };
  const set = <K extends keyof BlockStyle>(k: K, v: BlockStyle[K]) => onChange({ ...st, [k]: v });
  const Group = ({ title, children }: { title: string; children: ReactNode }) => <fieldset className="border-t border-[oklch(0.92_0.01_75)] pt-3 space-y-3"><legend className="text-[0.7rem] uppercase tracking-widest text-[oklch(0.5_0.02_60)] font-body pr-2">{title}</legend>{children}</fieldset>;
  return (
    <div className="space-y-4">
      <Group title="Fondo">
        <Sel label="Fondo" value={st.background} onChange={(v) => set("background", v)} options={[["none", "Sin fondo"], ["soft", "Beige suave"], ["brand", "Verde BION"], ["dark", "Oscuro"], ["image", "Imagen"]]} />
        {st.background === "image" && (
          <>
            <div><span className={labelCls}>Imagen de fondo</span><ImageUploader value={st.bgImage} onChange={(u) => set("bgImage", u)} label="" /></div>
            <Sel label="Capa sobre la imagen (para que se lea el texto)" value={st.overlay} onChange={(v) => set("overlay", v)} options={[["dark", "Oscura"], ["light", "Clara"], ["brand", "Verde"]]} />
          </>
        )}
      </Group>
      <Group title="Espacios">
        <Sel label="Espacio superior" value={st.padTop} onChange={(v) => set("padTop", v)} options={SPACES} />
        <Sel label="Espacio inferior" value={st.padBottom} onChange={(v) => set("padBottom", v)} options={SPACES} />
        <Sel label="Altura mínima" value={st.minHeight} onChange={(v) => set("minHeight", v)} options={[["auto", "Automática"], ["40", "40 % de la pantalla"], ["60", "60 %"], ["80", "80 %"], ["full", "Pantalla completa"]]} />
        <Sel label="Ancho del contenido" value={st.contentWidth} onChange={(v) => set("contentWidth", v)} options={[["auto", "Automático"], ["narrow", "Estrecho"], ["medium", "Medio"], ["wide", "Ancho"]]} />
      </Group>
      <Group title="Alineación y móvil">
        <Sel label="Alineación del texto en ordenador y tableta" value={st.align} onChange={(v) => set("align", v)} options={ALIGNS} />
        <Sel label="Alineación del texto en móvil" value={st.mobileAlign} onChange={(v) => set("mobileAlign", v)} options={ALIGNS} />
        <Sel label="Espacios en móvil" value={st.mobileSpacing} onChange={(v) => set("mobileSpacing", v)} options={[["same", "Los mismos"], ["less", "A la mitad"]]} />
        <div>
          <span className={labelCls}>Ocultar en</span>
          <div className="flex flex-wrap gap-3">
            {DEVICES.map((d) => (
              <label key={d} className="inline-flex items-center gap-1.5 text-sm font-body">
                <input type="checkbox" checked={st.hideOn.includes(d)} onChange={(e) => set("hideOn", e.target.checked ? [...st.hideOn, d] : st.hideOn.filter((x) => x !== d))} />
                {DEVICE_LABEL[d]}
              </label>
            ))}
          </div>
        </div>
      </Group>
      <Group title="Otros">
        <Sel label="Animación al aparecer" value={st.animation} onChange={(v) => set("animation", v)} options={[["none", "Ninguna"], ["fade", "Aparecer"], ["up", "Subir suavemente"]]} />
        <div><label className={labelCls} htmlFor="anchor">Ancla (para enlazar con #nombre)</label><input id="anchor" className={inputCls} value={st.anchor} onChange={(e) => set("anchor", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="reservar" /></div>
      </Group>
    </div>
  );
}

export const catalogLabel = (type: string) => BLOCK_CATALOG.find((b) => b.type === type)?.label ?? type;
