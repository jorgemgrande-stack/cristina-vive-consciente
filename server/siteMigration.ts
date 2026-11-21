/**
 * Migración repetible de las páginas actuales al editor: cada página original se traduce a bloques con sus textos,
 * imágenes, enlaces y URL actuales. Es determinista (ids estables) y SOLO crea borradores: la web sigue sirviendo la
 * página de siempre hasta que Cristina publique cada una tras revisarla en la vista previa.
 *
 * Los listados, catálogos y fichas se enlazan como bloques «conectados» (siguen leyendo Servicios, Agua, Aceites, Ebooks,
 * Afiliados y Blog): nada de eso se copia aquí.
 */
import { SITE_IMAGES } from "../client/src/lib/siteImages";
import { createBlock, type BlockDataMap, type BlockStyle, type BlockType, type PageBlock, type PageContent } from "../shared/siteEditor";
import { normalizePageContent } from "./siteContent";

function B<K extends BlockType>(id: string, type: K, data: Partial<BlockDataMap[K]>, style?: Partial<BlockStyle>): PageBlock {
  const block = createBlock(type, data) as PageBlock;
  block.id = id;
  if (style) block.style = { background: "none", bgImage: "", overlay: "dark", padTop: "0", padBottom: "0", align: "auto", mobileAlign: "auto", mobileSpacing: "same", contentWidth: "auto", minHeight: "auto", hideOn: [], anchor: "", animation: "none", ...style };
  return block;
}

const conn = (id: string, source: BlockDataMap["connected"]["source"], extra: Partial<BlockDataMap["connected"]> = {}) => B(id, "connected", { source, ...extra });
const hero = (id: string, d: Partial<BlockDataMap["hero"]>) => B(id, "hero", { breadcrumb: "on", ...d });
const seo = (title: string, description: string) => ({ title, description, ogImage: "", noindex: false });

const HOME: PageBlock[] = [
  conn("home-slideshow", "home_slideshow", {
    eyebrow: "Consulta naturópata", title: "VIVE CONSCIENTE", intro: "Diseño hojas de ruta personalizadas para tu salud.",
    buttonLabel: "Reservar consulta", secondaryLabel: "Conocer servicios", secondaryUrl: "/consultas",
  }),
  B("home-strip", "text", { html: "<p><strong>Comprensión del síntoma · Entorno y salud ambiental · Educación para la salud · Guías y recursos</strong></p>", align: "center" }, { background: "brand", padTop: "s", padBottom: "s", align: "center" }),
  conn("home-masajes", "home_masajes"),
  B("home-servicios-intro", "heading", { eyebrow: "Mis servicios", title: "Un camino hacia tu bienestar integral", subtitle: "Cada servicio está diseñado para nutrir cuerpo, mente y espíritu desde la sabiduría de la naturaleza.", level: "h2", align: "left" }, { padTop: "l" }),
  B("home-servicios", "cards", {
    title: "", intro: "", columns: "2",
    items: [
      { imageUrl: SITE_IMAGES.heroConsultas, imageAlt: "Consultas", title: "Consultas", text: "Sesiones personalizadas para guiarte hacia el equilibrio físico, emocional y espiritual.", buttonLabel: "Descubrir", buttonUrl: "/consultas" },
      { imageUrl: SITE_IMAGES.heroMasajes, imageAlt: "Masaje y equilibrio energético", title: "Masaje y equilibrio energético", text: "Un espacio de reconexión y calma para el sistema nervioso, favoreciendo el equilibrio entre cuerpo, mente y espíritu.", buttonLabel: "Descubrir", buttonUrl: "/masajes" },
      { imageUrl: SITE_IMAGES.heroAgua, imageAlt: "Sistemas de Agua", title: "Sistemas de Agua", text: "Asesoramiento en filtros. Soluciones para purificar y vitalizar el agua que bebes.", buttonLabel: "Descubrir", buttonUrl: "/sistemas-agua" },
      { imageUrl: SITE_IMAGES.heroAceites, imageAlt: "Aceites Esenciales", title: "Aceites Esenciales", text: "Descubre sus propiedades, usos y diferentes formas de incorporarlos de manera consciente a tu día a día.", buttonLabel: "Descubrir", buttonUrl: "/aceites-esenciales" },
    ],
  }, { padBottom: "m" }),
  B("home-btn-guias", "button", { label: "Guías Digitales", url: "/guias-digitales", variant: "outline", align: "left" }),
  B("home-btn-recomendados", "button", { label: "Productos Recomendados", url: "/recomendados", variant: "outline", align: "left" }, { padBottom: "l" }),
  B("home-sobre-mi", "columns", {
    title: "Cristina, tu guía de bienestar",
    html: "<p><strong>Sobre mí</strong></p><p>Soy Cristina Battistelli, naturópata y apasionada por la salud desde una visión integrativa.</p><p>Desde siempre he sido una buscadora, movida por una profunda curiosidad por la naturaleza, la salud y todo aquello que aún nos queda por comprender sobre el ser humano. Esa búsqueda me llevó a explorar la alimentación ecológica, la naturopatía y diferentes tradiciones de medicina ancestral, ampliando poco a poco mi forma de entender la salud y reforzando mi confianza en la capacidad del cuerpo humano para recuperar el equilibrio cuando se le ofrecen las condiciones adecuadas.</p><p>Lo que siempre ha sido una pasión acabó convirtiéndose en mi profesión. Desde entonces no he dejado de estudiar, formarme e integrar conocimientos que amplíen mi manera de entender la salud. Me gusta cuestionar, aprender de diferentes disciplinas y quedarme siempre con aquello que pueda aportar un valor real a las personas que acompaño.</p><p>Con el tiempo entendí que la salud no depende únicamente de la alimentación. En ella influyen muchos otros factores: el entorno en el que vivimos, los hábitos, el sistema nervioso, las emociones, la epigenética y la forma en la que cada persona vive su propia historia.</p><p>No creo en soluciones universales. Cada proceso es único, por eso acompaño a cada persona desde una visión global y diseño una hoja de ruta personalizada, adaptada a sus necesidades.</p>",
    imageUrl: SITE_IMAGES.cristina, imageAlt: "Cristina — Bienestar Holístico", imagePosition: "left", buttonLabel: "Conectar conmigo", buttonUrl: "/contacto",
  }, { background: "soft", padTop: "l", padBottom: "l" }),
  B("home-valores-intro", "heading", { eyebrow: "Mi filosofía", title: "Los pilares de mi práctica", subtitle: "", level: "h2", align: "center" }, { padTop: "l" }),
  B("home-valores", "features", {
    title: "", intro: "", columns: "3",
    items: [
      { icon: "heart", title: "Consciencia", text: "Cada decisión que tomamos sobre nuestra salud es un acto de amor propio. Te acompaño a despertar esa consciencia." },
      { icon: "leaf", title: "Naturaleza", text: "Los remedios más poderosos están en la naturaleza. Aprendo a escucharla y a integrarla en tu vida cotidiana." },
      { icon: "sparkles", title: "Integralidad", text: "El cuerpo, la mente y el espíritu son uno. Mi enfoque holístico atiende a la persona en su totalidad." },
    ],
  }, { padBottom: "l" }),
  conn("home-agua", "home_agua"),
  conn("home-blog", "home_blog"),
  B("home-testimonios", "testimonials", {
    title: "Lo que dicen mis clientas",
    items: [
      { quote: "Cristina cambió mi relación con mi cuerpo. Sus consultas me dieron herramientas que uso cada día para sentirme mejor.", author: "María L.", role: "Clienta de consultas" },
      { quote: "Los masajes son una experiencia transformadora. Salgo completamente renovada, como si hubiera descansado días enteros.", author: "Ana G.", role: "Clienta de masajes" },
      { quote: "Gracias a los aceites esenciales y las guías de Cristina, mi familia vive de forma mucho más natural y consciente.", author: "Laura M.", role: "Clienta de aceites" },
    ],
  }, { background: "dark", padTop: "l", padBottom: "l" }),
  B("home-cta", "cta", {
    title: "¿Lista para vivir conscientemente?", text: "Da el primer paso hacia una vida más natural, equilibrada y plena. Estoy aquí para acompañarte en cada etapa de tu camino.",
    buttonLabel: "Reservar consulta", buttonUrl: "/consultas", secondaryLabel: "Escribirme", secondaryUrl: "/contacto",
  }, { background: "soft", padTop: "l", padBottom: "l" }),
];

const PAGES: Record<string, { seo: ReturnType<typeof seo>; blocks: PageBlock[] }> = {
  "/": { seo: seo("", ""), blocks: HOME },
  "/consultas": { seo: seo("", ""), blocks: [
    hero("hero", { eyebrow: "Salud consciente", title: "Consultas", subtitle: "Regularmente visita esta sección para descubrir nuevas consultas y asesorías dentro del marco de la salud consciente.", imageUrl: SITE_IMAGES.heroConsultas, imageAlt: "Consultas" }),
    conn("listado", "consultas"),
  ] },
  "/masajes": { seo: seo("", ""), blocks: [
    hero("hero", { eyebrow: "Terapia corporal", title: "Masajes Terapéuticos", subtitle: "Técnica combinada de equilibrio energético y masaje Aromatouch con 8 aceites esenciales de grado terapéutico.", imageUrl: SITE_IMAGES.heroMasajes, imageAlt: "Masajes terapéuticos" }),
    conn("listado", "masajes"),
  ] },
  "/sistemas-agua": { seo: seo("", ""), blocks: [
    hero("hero", { eyebrow: "Sistemas de Agua", title: "El agua que bebes define tu salud", subtitle: "No todos los sistemas de agua son iguales. Cristina Battistelli te ayuda a elegir el sistema ideal para tu hogar, tu agua y tu estilo de vida, con acompañamiento experto desde la elección hasta la instalación.", imageUrl: SITE_IMAGES.heroSistemasAgua, buttonLabel: "Solicitar asesoramiento", buttonUrl: "/contacto", height: "l" }),
    conn("catalogo", "sistemas_agua"),
  ] },
  "/aceites-esenciales": { seo: seo("", ""), blocks: [
    hero("hero", { eyebrow: "Aromaterapia terapéutica", title: "Aceites Esenciales con propósito", subtitle: "Los aceites esenciales son herramientas terapéuticas potentes. Su uso correcto requiere personalización profesional.", imageUrl: SITE_IMAGES.heroAceites, buttonLabel: "Reservar consulta con Cristina", buttonUrl: "/consultas", height: "l" }),
    B("autoridad", "text", { title: "", html: "<blockquote>Cada aceite tiene su momento, su dosis y su persona.</blockquote><p>Como terapeuta holística certificada, acompaño a cada persona en el uso consciente y seguro de los aceites esenciales. No existe una fórmula universal: existe la tuya.</p><p><strong>Cristina</strong> · Terapeuta holística · Aromaterapia</p>", align: "center" }, { background: "dark", padTop: "m", padBottom: "m", contentWidth: "medium" }),
    conn("catalogo", "aceites"),
  ] },
  "/guias-digitales": { seo: seo("", ""), blocks: [
    hero("hero", { eyebrow: "Recursos digitales", title: "Guías Digitales", subtitle: "Conocimiento práctico y profundo para transformar tu vida desde casa.", imageUrl: SITE_IMAGES.heroConsultas }),
    conn("guias", "guias"),
  ] },
  "/recomendados": { seo: seo("", ""), blocks: [
    hero("hero", { eyebrow: "Selección personal", title: "Productos Recomendados", subtitle: "Solo recomiendo lo que uso o usaría yo personalmente. Cada producto ha pasado por mi propio filtro de confianza.", imageUrl: SITE_IMAGES.heroAceites }),
    conn("productos", "recomendados"),
  ] },
  "/contacto": { seo: seo("", ""), blocks: [
    hero("hero", { eyebrow: "Hablemos", title: "Contacto", subtitle: "Estoy aquí para acompañarte. Escríbeme y encontraremos el mejor camino juntas.", imageUrl: SITE_IMAGES.heroConsultas }),
    conn("contacto", "contacto"),
  ] },
  "/blog": { seo: seo("", ""), blocks: [
    hero("hero", { title: "Blog", subtitle: "Reflexiones, guías y conocimiento para vivir con más consciencia y bienestar", imageUrl: SITE_IMAGES.heroMain, breadcrumb: "off" }),
    conn("articulos", "blog"),
  ] },
  "/privacidad": { seo: seo("", ""), blocks: [conn("texto-legal", "privacidad")] },
  "/politica-de-cookies": { seo: seo("", ""), blocks: [conn("texto-legal", "cookies")] },
  "tpl:/consultas/:slug": { seo: seo("", ""), blocks: [conn("ficha", "detalle")] },
  "tpl:/masajes/:slug": { seo: seo("", ""), blocks: [conn("ficha", "detalle")] },
  "tpl:/sistemas-agua/:slug": { seo: seo("", ""), blocks: [conn("ficha", "detalle")] },
  "tpl:/aceites-esenciales/:slug": { seo: seo("", ""), blocks: [conn("ficha", "detalle")] },
  "tpl:/blog/:slug": { seo: seo("", ""), blocks: [conn("ficha", "detalle")] },
};

/** Contenido migrado de una página original, o null si no la conocemos. Siempre igual (repetible). */
export function migratedContent(docKey: string): PageContent | null {
  const p = PAGES[docKey];
  if (!p) return null;
  return normalizePageContent({ v: 1, seo: p.seo, blocks: structuredClone(p.blocks) });
}
export const MIGRATABLE_KEYS = Object.keys(PAGES);
