/**
 * PageBlocksView — pinta una lista de bloques. Es el ÚNICO renderizador: lo usan el lienzo del editor, la vista previa
 * privada y la web pública, así que lo que Cristina ve al editar es lo que ve el visitante.
 *
 * Diseño "Luz Botánica": tipografías y colores de la marca; los valores de diseño de cada bloque son de lista cerrada.
 */
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, ChevronDown, Clock, Droplets, Flower2, Hand, Heart, Leaf, MapPin, Moon, Shield, Sparkles, Star, Sun } from "lucide-react";
import { cssUrl, type BlockOf, type BlockStyle, type PageBlock, DEFAULT_BLOCK_STYLE, sectionColumnCount } from "@shared/siteEditor";
import { trpc } from "@/lib/trpc";
import SiteLink from "./SiteLink";
import { actionName } from "@shared/siteActions";
import { dispatchSiteAction } from "@/lib/siteActions";
import { FICHA_REGISTRY } from "./detail";
import { EmbedProvider } from "./embed";
import { HomeBlog, HomeSlideshow, HomeWater, HOME_SLIDESHOW_DEFAULTS } from "./HomeSections";
import { HomeGuias } from "./HomeGuias";
import BookingModal from "@/components/BookingModal";
import HomeMasajes from "@/components/HomeMasajes";
import Consultas from "@/pages/Consultas";
import Masajes from "@/pages/Masajes";
import SistemasAgua from "@/pages/SistemasAgua";
import OilCatalog from "@/components/oils/OilCatalog";
import { OilOrdersBlock, ResourcesBlock, ServiceOfferBlock } from "./OfferBlocks";
import { aceitesBlocks } from "@shared/aceitesPage";
import GuiasDigitales from "@/pages/GuiasDigitales";
import Recomendados from "@/pages/Recomendados";
import Blog from "@/pages/Blog";
import Contacto from "@/pages/Contacto";
import ConsultaDetalle from "@/pages/ConsultaDetalle";
import MasajeDetalle from "@/pages/MasajeDetalle";
import SistemaAguaDetalle from "@/pages/SistemaAguaDetalle";
import AceiteDetalle from "@/pages/AceiteDetalle";
import BlogPost from "@/pages/BlogPost";
import Privacidad from "@/pages/Privacidad";
import PoliticaCookies from "@/pages/PoliticaCookies";

const ICONS: Record<string, ReactNode> = {
  leaf: <Leaf size={22} />, heart: <Heart size={22} />, sparkles: <Sparkles size={22} />, droplets: <Droplets size={22} />, sun: <Sun size={22} />,
  moon: <Moon size={22} />, flower: <Flower2 size={22} />, hand: <Hand size={22} />, shield: <Shield size={22} />, star: <Star size={22} />,
  clock: <Clock size={22} />, "map-pin": <MapPin size={22} />,
};

// ─── Texto con formato: defensa en profundidad (el servidor ya lo sanea al guardar) ──
const ALLOWED = new Set(["P", "BR", "STRONG", "B", "EM", "I", "U", "UL", "OL", "LI", "A", "H2", "H3", "H4", "BLOCKQUOTE", "HR", "MARK"]);
export function sanitizeClientHtml(html: string): string {
  if (typeof document === "undefined") return html.replace(/<[^>]*>/g, "");
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  const clean = (node: Element) => {
    for (const child of Array.from(node.children)) {
      if (!ALLOWED.has(child.tagName)) { child.replaceWith(...Array.from(child.childNodes)); continue; }
      for (const a of Array.from(child.attributes)) {
        const ok = child.tagName === "A" && (a.name === "href" || a.name === "target" || a.name === "rel");
        if (!ok) child.removeAttribute(a.name);
      }
      if (child.tagName === "A") {
        const href = child.getAttribute("href") ?? "";
        if (!/^(\/(?!\/)|#|https?:|mailto:|tel:|action:)/i.test(href)) child.removeAttribute("href");
      }
      clean(child);
    }
  };
  // Las etiquetas no permitidas se desenvuelven; script y style se eliminan con su contenido
  doc.body.querySelectorAll("script,style,iframe,object,embed,link,meta").forEach((n) => n.remove());
  clean(doc.body);
  return doc.body.innerHTML;
}

/** Vista previa o lienzo: ninguna acción comercial ni envío funciona (los formularios, botones y enlaces quedan inactivos). */
export function PreviewShield({ children, active }: { children: ReactNode; active: boolean }) {
  if (!active) return <>{children}</>;
  const stop = (e: { preventDefault: () => void; stopPropagation: () => void; target: EventTarget }) => {
    const el = e.target as HTMLElement;
    if (el.closest?.("[data-preview-allow]")) return;
    e.preventDefault();
    e.stopPropagation();
  };
  return (
    <div data-preview-shield onClickCapture={stop} onSubmitCapture={stop} onKeyDownCapture={(e) => { if (e.key === "Enter") stop(e); }}>
      {children}
    </div>
  );
}

// ─── Diseño del bloque ──────────────────────────────────────────────────────

const PAD: Record<string, string> = { "0": "0px", s: "24px", m: "48px", l: "80px", xl: "112px" };

function BlockFrame({ block, children, inEditor }: { block: PageBlock; children: ReactNode; inEditor?: boolean }) {
  const st: BlockStyle = { ...DEFAULT_BLOCK_STYLE, ...(block.style ?? {}) };
  const cls = ["cvc-block"];
  if (st.mobileSpacing === "less") cls.push("cvc-less");
  if (st.background === "soft") cls.push("cvc-bg-soft");
  if (st.background === "brand") cls.push("cvc-bg-brand");
  if (st.background === "dark") cls.push("cvc-bg-dark");
  if (st.background === "image" && st.bgImage) cls.push("cvc-bg-image");
  if (st.minHeight !== "auto") cls.push(`cvc-minh-${st.minHeight}`);
  if (st.align !== "auto") cls.push(`cvc-d-${st.align}`);
  if (st.mobileAlign !== "auto") cls.push(`cvc-m-${st.mobileAlign}`);
  for (const d of st.hideOn) cls.push(`cvc-hide-${d}`);
  // En el editor las animaciones de aparición se desactivan: el bloque siempre se ve entero
  if (!inEditor && st.animation !== "none") cls.push(`cvc-anim-${st.animation}`);
  const style: CSSProperties = { ["--pt" as string]: PAD[st.padTop], ["--pb" as string]: PAD[st.padBottom] };
  if (st.background === "image" && st.bgImage) style.backgroundImage = `url("${cssUrl(st.bgImage)}")`;
  const width = st.contentWidth !== "auto" ? `cvc-w-${st.contentWidth}` : "";
  return (
    <div id={st.anchor || undefined} className={cls.join(" ")} style={style} data-block-id={block.id} data-block-type={block.type}>
      {st.background === "image" && st.bgImage && <div className={`cvc-overlay cvc-overlay-${st.overlay}`} />}
      <div className={`relative ${width}`}>{children}</div>
    </div>
  );
}

// ─── Piezas ─────────────────────────────────────────────────────────────────

const Eyebrow = ({ text }: { text: string }) =>
  text ? <p className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-3 font-body" style={{ fontWeight: 500 }}>{text}</p> : null;

function Btn({ label, url, variant = "primary", light }: { label: string; url: string; variant?: "primary" | "outline"; light?: boolean }) {
  // «Mi consulta ({n})» ya no existe: un borrador antiguo que aún lo lleve no pinta el botón
  const text = label.includes("{n}") ? "" : label;
  if (!text || !url) return null;
  return (
    <SiteLink href={url} className={light ? "btn-outline !text-white !border-white/60" : variant === "primary" ? "btn-primary" : "btn-outline"} style={{ textDecoration: "none" }}>
      {text}
      {variant === "primary" && <ArrowRight size={15} />}
    </SiteLink>
  );
}

function Rich({ html, className = "" }: { html: string; className?: string }) {
  // Enlaces «action:…» (abrir reserva, preferencias de cookies…) dentro del texto con formato
  const onClick = (e: React.MouseEvent) => {
    const a = (e.target as HTMLElement).closest("a");
    const name = a ? actionName(a.getAttribute("href") ?? "") : null;
    if (name) { e.preventDefault(); dispatchSiteAction(name); }
  };
  return html ? <div onClick={onClick} className={`cvc-prose ${className}`} dangerouslySetInnerHTML={{ __html: sanitizeClientHtml(html) }} /> : null;
}

function embedVideo(url: string): string {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/i);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  return vm ? `https://player.vimeo.com/video/${vm[1]}` : "";
}

const GRID: Record<string, string> = { "2": "md:grid-cols-2", "3": "md:grid-cols-2 lg:grid-cols-3", "4": "md:grid-cols-2 lg:grid-cols-4" };
const SECTION_COLS: Record<string, string> = {
  "1": "md:grid-cols-1", "1-1": "md:grid-cols-2", "1-2": "md:grid-cols-[1fr_2fr]", "2-1": "md:grid-cols-[2fr_1fr]", "1-1-1": "md:grid-cols-3", "1-2-1": "md:grid-cols-[1fr_2fr_1fr]",
};

/** Cabecera de página (como PageHero, con los mismos tamaños y degradado). */
function HeroBlock({ b, title }: { b: BlockOf<"hero">; title: string }) {
  const d = b.data;
  const [location] = useLocation();
  const h = d.height === "full" ? "min-h-screen" : d.height === "l" ? "min-h-[70vh]" : "min-h-[55vh]";
  const crumbs = d.breadcrumb === "on" && location !== "/";
  // Foto clara y con mucho detalle en Aceites: velo algo más oscuro y antetítulo claro para que se lea
  const strong = location === "/aceites-esenciales";
  return (
    <section className={`relative ${h} flex items-end overflow-hidden`}>
      <div className="absolute inset-0 bg-[oklch(0.18_0.018_55)]">
        {d.imageUrl && (
          <>
            <img src={d.imageUrl} alt={d.imageAlt || d.title} className="cvc-hero-img w-full h-full object-cover" style={{ ["--ox" as string]: `${d.imageX}%`, ["--oy" as string]: `${d.imageY}%`, ["--oxm" as string]: `${d.imageXM}%`, ["--oym" as string]: `${d.imageYM}%` }} />
          </>
        )}
        <div className="absolute inset-0" style={{ background: strong
          ? "linear-gradient(to top, oklch(0.18 0.018 55 / 0.9) 0%, oklch(0.18 0.018 55 / 0.72) 60%, oklch(0.18 0.018 55 / 0.4) 100%)"
          : "linear-gradient(to top, oklch(0.18 0.018 55 / 0.85) 0%, oklch(0.18 0.018 55 / 0.5) 50%, oklch(0.18 0.018 55 / 0.2) 100%)" }} />
      </div>
      <div className="container relative z-10 pb-14 pt-32">
        {crumbs && (
          <nav className="flex items-center gap-1.5 mb-5 text-white/60 text-xs tracking-widest uppercase font-body" style={{ letterSpacing: "0.1em" }}>
            <Link href="/" className="no-underline text-white/60 hover:text-white">Inicio</Link>
            <span className="text-white/40">›</span>
            <span className="text-white/90">{title || d.title}</span>
          </nav>
        )}
        {d.eyebrow && <p className={`${strong ? "text-[oklch(0.92_0.07_148)]" : "text-[oklch(0.72_0.06_148)]"} text-xs tracking-[0.2em] uppercase mb-3 font-body`} style={{ fontWeight: 500 }}>{d.eyebrow}</p>}
        <h1 className="text-white font-display mb-4" style={{ fontWeight: 400, maxWidth: "600px" }}>{d.title}</h1>
        {d.subtitle && <p className="text-white/75 text-base md:text-lg font-body leading-relaxed mb-6" style={{ fontWeight: 300, maxWidth: "500px" }}>{d.subtitle}</p>}
        <div className="flex flex-wrap gap-4">
          <Btn label={d.buttonLabel} url={d.buttonUrl} />
          <Btn label={d.secondaryLabel} url={d.secondaryUrl} variant="outline" light />
        </div>
      </div>
    </section>
  );
}

function FormBlock({ b, path, blockId }: { b: BlockOf<"form">; path: string; blockId: string }) {
  const d = b.data;
  const [values, setValues] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const submit = trpc.site.submitForm.useMutation({ onSuccess: () => setSent(true), onError: (e) => setError(e.message) });
  if (sent) return <p className="text-center font-body text-[oklch(0.35_0.07_148)] py-8" role="status">{d.successMessage || "Gracias."}</p>;
  return (
    <form
      className="max-w-xl mx-auto space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError("");
        submit.mutate({ path, blockId, answers: values, consent, website: values.__hp });
      }}
    >
      {d.title && <h2 className="font-display text-[oklch(0.18_0.018_55)] text-center mb-2" style={{ fontWeight: 400 }}>{d.title}</h2>}
      {d.intro && <p className="text-center font-body text-[oklch(0.45_0.02_55)] mb-4" style={{ fontWeight: 300 }}>{d.intro}</p>}
      {d.fields.map((f, i) => {
        const id = `f-${blockId}-${i}`;
        const common = "w-full border border-[oklch(0.88_0.015_75)] bg-white px-3 py-2.5 text-sm font-body text-[oklch(0.18_0.018_55)]";
        const set = (v: string) => setValues((x) => ({ ...x, [String(i)]: v }));
        return (
          <div key={i}>
            {f.kind !== "checkbox" && <label htmlFor={id} className="block text-xs uppercase tracking-widest font-body mb-1.5 text-[oklch(0.35_0.02_55)]" style={{ fontWeight: 500 }}>{f.label}{f.required === "on" ? " *" : ""}</label>}
            {f.kind === "textarea" ? (
              <textarea id={id} rows={5} required={f.required === "on"} placeholder={f.placeholder} className={common} onChange={(e) => set(e.target.value)} />
            ) : f.kind === "select" ? (
              <select id={id} required={f.required === "on"} className={common} onChange={(e) => set(e.target.value)} defaultValue="">
                <option value="" disabled>{f.placeholder || "Elige una opción"}</option>
                {f.options.split("\n").map((o) => o.trim()).filter(Boolean).map((o) => <option key={o}>{o}</option>)}
              </select>
            ) : f.kind === "checkbox" ? (
              <label className="flex items-start gap-2 text-sm font-body text-[oklch(0.35_0.02_55)]">
                <input id={id} type="checkbox" required={f.required === "on"} onChange={(e) => set(e.target.checked ? "Sí" : "")} className="mt-1" />
                {f.label}
              </label>
            ) : (
              <input id={id} type={f.kind === "email" ? "email" : f.kind === "phone" ? "tel" : "text"} required={f.required === "on"} placeholder={f.placeholder} className={common} onChange={(e) => set(e.target.value)} />
            )}
          </div>
        );
      })}
      {/* Trampa para robots: una persona nunca la ve ni la rellena */}
      <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" onChange={(e) => setValues((x) => ({ ...x, __hp: e.target.value }))} />
      <label className="flex items-start gap-2 text-xs font-body text-[oklch(0.42_0.02_55)]">
        <input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
        <span>{d.consentText || "He leído y acepto la política de privacidad."} <Link href="/privacidad" className="underline">Política de privacidad</Link></span>
      </label>
      {error && <p className="text-sm text-red-700 font-body" role="alert">{error}</p>}
      <div className="text-center">
        <button type="submit" disabled={submit.isPending} className="btn-primary disabled:opacity-60">{submit.isPending ? "Enviando…" : d.submitLabel}</button>
      </div>
    </form>
  );
}

export type DetailKey = "consultas" | "masajes" | "sistemas-agua" | "aceites-esenciales" | "blog" | null;

function Connected({ b, detail, inEditor }: { b: BlockOf<"connected">; detail: DetailKey; inEditor?: boolean }) {
  const [booking, setBooking] = useState(false);
  const d = b.data;
  const wrap = (node: ReactNode, hideHero = true) => <EmbedProvider hideHero={hideHero}>{node}</EmbedProvider>;
  switch (d.source) {
    case "consultas": return wrap(<Consultas />);
    case "masajes": return wrap(<Masajes />);
    case "sistemas_agua": return wrap(<SistemasAgua />);
    case "aceites": {
      // Un bloque guardado antes de tener textos propios usa los de serie
      const base = (aceitesBlocks().find((x) => x.id === "catalogo") as BlockOf<"connected">).data;
      return <OilCatalog title={d.title || base.title} intro={d.intro || base.intro} buttonLabel={d.buttonLabel || base.buttonLabel} buttonUrl={d.secondaryUrl || base.secondaryUrl} />;
    }
    case "guias": return wrap(<GuiasDigitales />);
    case "recomendados": return wrap(<Recomendados />);
    case "blog": return wrap(<Blog />);
    case "contacto": return wrap(<Contacto />);
    case "privacidad": return wrap(<Privacidad />);
    case "cookies": return wrap(<PoliticaCookies />);
    case "ficha": {
      if (inEditor && !FICHA_REGISTRY[detail ?? ""]) return null;
      const entry = FICHA_REGISTRY[detail ?? ""];
      return entry ? <entry.Section name={d.section} /> : null;
    }
    case "detalle": {
      if (inEditor) return <div className="container py-16 text-center border-2 border-dashed border-[oklch(0.8_0.03_148)] bg-[oklch(0.97_0.01_148)] font-body text-sm text-[oklch(0.4_0.05_148)]">Aquí se mostrará la ficha del elemento (nombre, precio, duración, condiciones y botón de reserva), con los datos de su propia sección. Puedes añadir bloques antes y después.</div>;
      const Detail = { consultas: ConsultaDetalle, masajes: MasajeDetalle, "sistemas-agua": SistemaAguaDetalle, "aceites-esenciales": AceiteDetalle, blog: BlogPost }[detail ?? "consultas"];
      return wrap(<Detail />, false);
    }
    case "home_masajes": return <HomeMasajes />;
    case "home_agua": return <HomeWater />;
    case "home_blog": return <HomeBlog />;
    case "home_guias": return <HomeGuias />;
    case "home_slideshow":
      return (
        <>
          <BookingModal isOpen={booking} onClose={() => setBooking(false)} />
          <HomeSlideshow
            eyebrow={d.eyebrow || HOME_SLIDESHOW_DEFAULTS.eyebrow}
            title={d.title || HOME_SLIDESHOW_DEFAULTS.title}
            subtitle={d.intro || HOME_SLIDESHOW_DEFAULTS.subtitle}
            primaryLabel={d.buttonLabel || HOME_SLIDESHOW_DEFAULTS.primaryLabel}
            secondaryLabel={d.secondaryLabel || HOME_SLIDESHOW_DEFAULTS.secondaryLabel}
            secondaryUrl={d.secondaryUrl || HOME_SLIDESHOW_DEFAULTS.secondaryUrl}
            onBook={() => setBooking(true)}
          />
        </>
      );
  }
}

// ─── Un bloque ──────────────────────────────────────────────────────────────

export interface ViewCtx {
  /** Ruta de la página que se pinta (para formularios y miga de pan) */
  path: string;
  title: string;
  detail: DetailKey;
  /** Dentro del lienzo del editor */
  inEditor?: boolean;
}

export function BlockView({ block, ctx, wrapper }: { block: PageBlock; ctx: ViewCtx; wrapper?: (b: PageBlock, node: ReactNode) => ReactNode }) {
  return <BlockFrame block={block} inEditor={ctx.inEditor}>{renderInner(block, ctx, wrapper)}</BlockFrame>;
}

function renderInner(block: PageBlock, ctx: ViewCtx, wrapper?: (b: PageBlock, node: ReactNode) => ReactNode): ReactNode {
  switch (block.type) {
    case "hero": return <HeroBlock b={block} title={ctx.title} />;
    case "heading": {
      const d = block.data;
      const Tag = d.level;
      return (
        <div className={`container py-8 ${d.align === "center" ? "text-center" : ""}`}>
          <Eyebrow text={d.eyebrow} />
          {d.title && <Tag className="font-display text-[oklch(0.18_0.018_55)] mb-3" style={{ fontWeight: 400 }}>{d.title}</Tag>}
          {d.subtitle && <p className="font-body text-[oklch(0.45_0.02_55)] max-w-2xl inline-block leading-relaxed" style={{ fontWeight: 300 }}>{d.subtitle}</p>}
        </div>
      );
    }
    case "text": {
      const d = block.data;
      return (
        <div className={`container py-8 ${d.align === "center" ? "text-center" : ""}`}>
          <div className="max-w-3xl mx-auto">
            {d.title && <h2 className="font-display text-[oklch(0.18_0.018_55)] mb-4" style={{ fontWeight: 400 }}>{d.title}</h2>}
            <Rich html={d.html} />
          </div>
        </div>
      );
    }
    case "image": {
      const d = block.data;
      if (!d.url) return <div className="container py-8 text-center text-sm text-[oklch(0.55_0.04_75)] font-body">Imagen sin elegir</div>;
      return (
        <figure className={`container py-8 ${d.size === "wide" ? "" : "max-w-3xl"}`}>
          <img src={d.url} alt={d.alt} loading="lazy" className={d.ratio === "auto" ? "w-full h-auto" : "w-full object-cover"} style={d.ratio === "auto" ? undefined : { aspectRatio: d.ratio.replace(":", " / "), objectPosition: `${d.imageX}% ${d.imageY}%` }} />
          {d.caption && <figcaption className="mt-2 text-center text-xs text-[oklch(0.52_0.02_60)] font-body">{d.caption}</figcaption>}
        </figure>
      );
    }
    case "gallery": {
      const d = block.data;
      return (
        <div className="container py-8">
          {d.title && <h2 className="font-display text-center text-[oklch(0.18_0.018_55)] mb-8" style={{ fontWeight: 400 }}>{d.title}</h2>}
          <div className={d.layout === "masonry" ? "columns-2 md:columns-3 gap-3 [&>img]:mb-3" : "grid grid-cols-2 md:grid-cols-3 gap-3"}>
            {d.images.map((im, i) => <img key={i} src={im.url} alt={im.alt} loading="lazy" className={d.layout === "masonry" ? "w-full" : "w-full aspect-[4/3] object-cover"} />)}
          </div>
        </div>
      );
    }
    case "button": {
      const d = block.data;
      return <div className={`container py-6 flex ${d.align === "center" ? "justify-center" : "justify-start"}`}><Btn label={d.label} url={d.url} variant={d.variant} /></div>;
    }
    case "video": {
      const d = block.data;
      const src = embedVideo(d.url);
      return (
        <div className="container py-8 max-w-3xl">
          {d.title && <h2 className="font-display text-center text-[oklch(0.18_0.018_55)] mb-6" style={{ fontWeight: 400 }}>{d.title}</h2>}
          {src ? <div className="aspect-video"><iframe src={src} title={d.title || "Vídeo"} loading="lazy" allowFullScreen className="w-full h-full border-0" /></div> : <p className="text-center text-sm text-[oklch(0.55_0.04_75)] font-body">Vídeo sin elegir</p>}
          {d.caption && <p className="mt-2 text-center text-xs text-[oklch(0.52_0.02_60)] font-body">{d.caption}</p>}
        </div>
      );
    }
    case "columns": {
      const d = block.data;
      const img = d.imageUrl ? <img src={d.imageUrl} alt={d.imageAlt} loading="lazy" className="w-full h-full object-cover min-h-[240px]" style={{ objectPosition: `${d.imageX}% ${d.imageY}%` }} /> : null;
      return (
        <div className="container py-10">
          <div className={`grid md:grid-cols-2 gap-10 items-center ${d.imagePosition === "left" ? "" : ""}`}>
            <div className={d.imagePosition === "left" ? "md:order-2" : ""}>
              {d.title && <h2 className="font-display text-[oklch(0.18_0.018_55)] mb-4" style={{ fontWeight: 400 }}>{d.title}</h2>}
              <Rich html={d.html} />
              {d.buttonLabel && <div className="mt-6"><Btn label={d.buttonLabel} url={d.buttonUrl} /></div>}
            </div>
            {img && <div className={d.imagePosition === "left" ? "md:order-1" : ""}>{img}</div>}
          </div>
        </div>
      );
    }
    case "section": {
      const d = block.data;
      const gap = d.gap === "s" ? "gap-4" : d.gap === "l" ? "gap-14" : "gap-8";
      const n = sectionColumnCount(d.layout);
      return (
        <div className={d.width === "wide" ? "container max-w-6xl py-6" : "container py-6"}>
          <div className={`grid grid-cols-1 ${SECTION_COLS[d.layout]} ${gap} ${d.valign === "center" ? "items-center" : "items-start"}`}>
            {d.columns.slice(0, n).map((c, i) => (
              <div key={i} className={d.mobile === "reverse" ? `flex flex-col ${i === 0 ? "order-last md:order-none" : ""}` : ""}>
                {ctx.inEditor && c.blocks.length === 0 && (
                  <div data-section-col={`${block.id}:${i}`} className="border-2 border-dashed border-[oklch(0.8_0.03_148)] text-center text-xs font-body text-[oklch(0.45_0.05_148)] py-8 px-3">Columna {i + 1} vacía: púlsala y elige un bloque en «Añadir»</div>
                )}
                {c.blocks.map((cb) => (wrapper ? <div key={cb.id}>{wrapper(cb, <BlockView block={cb} ctx={ctx} wrapper={wrapper} />)}</div> : <BlockView key={cb.id} block={cb} ctx={ctx} />))}
              </div>
            ))}
          </div>
        </div>
      );
    }
    case "features": {
      const d = block.data;
      const boxed = d.items.some((it) => it.buttonLabel);
      // Sin título de bloque, cada elemento es un apartado (H2) para no saltar niveles de encabezado
      const ItemTitle = d.title ? "h3" : "h2";
      return (
        <div className="container py-10">
          {(d.title || d.intro) && <div className="text-center mb-10">{d.title && <h2 className="font-display text-[oklch(0.18_0.018_55)] mb-3" style={{ fontWeight: 400 }}>{d.title}</h2>}{d.intro && <p className="font-body text-[oklch(0.45_0.02_55)] max-w-2xl mx-auto" style={{ fontWeight: 300 }}>{d.intro}</p>}</div>}
          <div className={`grid grid-cols-1 ${GRID[d.columns]} ${boxed ? "gap-4" : "gap-8"}`}>
            {d.items.map((it, i) => (
              <div key={i} className={boxed ? "bg-white border border-[oklch(0.9_0.012_78)] p-5 flex flex-col text-left" : "text-center md:text-left"}>
                <div className={`text-[oklch(0.52_0.08_148)] mb-3 flex ${boxed ? "" : "justify-center md:justify-start"}`} aria-hidden="true">{ICONS[it.icon] ?? <Leaf size={22} />}</div>
                <ItemTitle className="font-display text-[oklch(0.18_0.018_55)] mb-2" style={{ fontWeight: 400, fontSize: "1.2rem" }}>{it.title}</ItemTitle>
                <p className="font-body text-sm text-[oklch(0.4_0.02_55)] leading-relaxed" style={{ fontWeight: 300 }}>{it.text}</p>
                {it.buttonLabel && it.buttonUrl && (
                  <div className="mt-auto pt-4">
                    <SiteLink href={it.buttonUrl} className="btn-outline w-full justify-center text-center min-h-11" style={{ textDecoration: "none", paddingInline: "0.75rem" }}>{it.buttonLabel}</SiteLink>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }
    case "cards": {
      const d = block.data;
      return (
        <div className="container py-10">
          <div className="text-center mb-10">{d.title && <h2 className="font-display text-[oklch(0.18_0.018_55)] mb-3" style={{ fontWeight: 400 }}>{d.title}</h2>}{d.intro && <p className="font-body text-[oklch(0.45_0.02_55)] max-w-2xl mx-auto" style={{ fontWeight: 300 }}>{d.intro}</p>}</div>
          <div className={`grid grid-cols-1 ${GRID[d.columns]} gap-6`}>
            {d.items.map((it, i) => (
              <div key={i} className="card-natural bg-white overflow-hidden flex flex-col">
                {it.imageUrl && (
                  <div className="relative">
                    <img src={it.imageUrl} alt={it.imageAlt || it.title} loading="lazy" className="w-full h-48 object-cover" />
                    {it.badge && <span className="absolute top-3 left-3 px-3 py-1 bg-[oklch(0.985_0.006_85)]/90 text-[oklch(0.52_0.08_148)] text-[0.65rem] tracking-widest uppercase font-body" style={{ fontWeight: 500 }}>{it.badge}</span>}
                  </div>
                )}
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="font-display text-[oklch(0.18_0.018_55)] mb-2" style={{ fontWeight: 400, fontSize: "1.25rem" }}>{it.title}</h3>
                  {it.text && <p className="font-body text-sm text-[oklch(0.45_0.02_55)] leading-relaxed mb-4" style={{ fontWeight: 300 }}>{it.text}</p>}
                  {it.buttonLabel && it.buttonUrl && <div className="mt-auto"><Btn label={it.buttonLabel} url={it.buttonUrl} variant="outline" /></div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    case "faq": return <Faq b={block} />;
    case "testimonials": {
      const d = block.data;
      return (
        <div className="container py-12">
          {d.title && <h2 className="font-display text-center text-[oklch(0.18_0.018_55)] mb-10" style={{ fontWeight: 400 }}>{d.title}</h2>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {d.items.map((t, i) => (
              <blockquote key={i} className="bg-white border border-[oklch(0.92_0.01_75)] p-6">
                <p className="font-body text-[oklch(0.35_0.02_55)] leading-relaxed mb-4 italic" style={{ fontWeight: 300 }}>“{t.quote}”</p>
                <footer className="font-body text-sm"><span className="text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 500 }}>{t.author}</span>{t.role && <span className="text-[oklch(0.52_0.02_60)]"> · {t.role}</span>}</footer>
              </blockquote>
            ))}
          </div>
        </div>
      );
    }
    case "cta": {
      const d = block.data;
      return (
        <div className="container py-12 text-center">
          <div className="max-w-2xl mx-auto">
            {d.title && <h2 className="font-display text-[oklch(0.18_0.018_55)] mb-4" style={{ fontWeight: 400 }}>{d.title}</h2>}
            {d.text && <p className="font-body text-[oklch(0.45_0.02_55)] leading-relaxed mb-8" style={{ fontWeight: 300 }}>{d.text}</p>}
            <div className="flex flex-wrap justify-center gap-4">
              <Btn label={d.buttonLabel} url={d.buttonUrl} />
              <Btn label={d.secondaryLabel} url={d.secondaryUrl} variant="outline" />
            </div>
          </div>
        </div>
      );
    }
    case "separator":
      return block.data.kind === "line" ? <div className="container py-4"><hr className="border-[oklch(0.88_0.015_75)]" /></div> : <div className="h-12" aria-hidden="true" />;
    case "form": return <div className="container py-10"><FormBlock b={block} path={ctx.path} blockId={block.id} /></div>;
    case "connected": return <Connected b={block} detail={ctx.detail} inEditor={ctx.inEditor} />;
    case "oil_orders": return <OilOrdersBlock b={block} />;
    case "service_offer": return <ServiceOfferBlock b={block} />;
    case "resources": return <ResourcesBlock b={block} />;
  }
}

function Faq({ b }: { b: BlockOf<"faq"> }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="container py-10 max-w-3xl">
      {b.data.title && <h2 className="font-display text-center text-[oklch(0.18_0.018_55)] mb-8" style={{ fontWeight: 400 }}>{b.data.title}</h2>}
      <div className="divide-y divide-[oklch(0.9_0.01_75)] border-y border-[oklch(0.9_0.01_75)]">
        {b.data.items.map((it, i) => (
          <div key={i}>
            <button className="w-full flex items-center justify-between gap-4 py-4 text-left font-body text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 500 }} aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
              {it.question}
              <ChevronDown size={16} className={`transition-transform flex-shrink-0 ${open === i ? "rotate-180" : ""}`} />
            </button>
            {open === i && <p className="pb-4 font-body text-sm text-[oklch(0.42_0.02_55)] leading-relaxed" style={{ fontWeight: 300 }}>{it.answer}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Al llegar con «#ancla» (desde otra página o recargando) el contenido aún se está pintando: se vuelve a colocar mientras
 * la altura cambia, durante unos segundos y solo si la persona no ha empezado a desplazarse.
 */
function useScrollToHash(enabled: boolean) {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!enabled || !id) return;
    const go = () => document.getElementById(id)?.scrollIntoView({ behavior: "instant" as ScrollBehavior });
    const observer = new ResizeObserver(go);
    const stop = () => { observer.disconnect(); clearTimeout(timer); for (const e of ["wheel", "touchstart", "keydown"]) window.removeEventListener(e, stop); };
    const timer = setTimeout(stop, 4000);
    for (const e of ["wheel", "touchstart", "keydown"]) window.addEventListener(e, stop, { passive: true });
    observer.observe(document.body);
    go();
    return stop;
  }, [enabled]);
}

/** Lista de bloques de una página. */
export default function PageBlocksView({ blocks, ctx }: { blocks: PageBlock[]; ctx: ViewCtx }) {
  useScrollToHash(!ctx.inEditor);
  return <>{blocks.map((b) => <BlockView key={b.id} block={b} ctx={ctx} />)}</>;
}
