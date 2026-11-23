/**
 * Ficha pública de cada ebook (/guias-digitales/:slug): URL, galería, contenido incluido y SEO.
 * Lo usan el servidor (404, metaetiquetas, sitemap) y la web, para que digan lo mismo.
 */
export interface EbookPageData {
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  price: string | number;
  coverImage: string | null;
  galleryImages: string | null;
  includesSession: number;
  downloadExpiryHours?: number | null;
}

/** Los slugs de la BD pueden llevar «_» (los_cuatro_regalos_de_la_tierra); en la URL se usa «-». */
export const ebookUrlSlug = (slug: string) => slug.trim().toLowerCase().replace(/_/g, "-");
export const ebookPath = (slug: string) => `/guias-digitales/${ebookUrlSlug(slug)}`;
/** ¿La parte de la URL corresponde a este ebook? (acepta «-» y «_») */
export const matchesEbookSlug = (urlPart: string, slug: string) => ebookUrlSlug(urlPart) === ebookUrlSlug(slug);

export const ebookPriceLabel = (price: string | number) => {
  const n = Number(price);
  return Number.isInteger(n) ? `${n}€` : `${n.toFixed(2).replace(".", ",")}€`;
};

/** Portada primero y después las imágenes del carrusel (sin repetir). */
export function ebookImages(e: Pick<EbookPageData, "coverImage" | "galleryImages">): string[] {
  let gallery: string[] = [];
  try {
    const parsed = JSON.parse(e.galleryImages ?? "[]");
    if (Array.isArray(parsed)) gallery = parsed.filter((u): u is string => typeof u === "string" && !!u);
  } catch {}
  return Array.from(new Set([e.coverImage, ...gallery].filter((u): u is string => !!u)));
}

/** Contenido incluido: solo lo que está configurado para ese ebook. */
export function ebookIncludes(e: Pick<EbookPageData, "slug" | "includesSession">): { key: string; text: string }[] {
  const items = [{ key: "pdf", text: "Ebook en PDF descargable" }];
  if (e.includesSession === 1) items.push({ key: "session", text: "Sesión de asesoramiento de 30 minutos con Cristina" });
  if (e.slug === "agua") items.push({ key: "discount", text: "Código descuento en sistemas recomendados" });
  return items;
}

/** Texto plano de una descripción, recortado sin cortar palabras. */
export function plainSnippet(text: string | null | undefined, max = 155): string {
  const t = (text ?? "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  return cut.slice(0, Math.max(cut.lastIndexOf(" "), 60)).replace(/[,.;:\s]+$/, "") + "…";
}

export interface EbookSeo {
  title: string;
  description: string;
  canonical: string;
  image: string | null;
}

export function ebookSeo(e: EbookPageData, siteUrl: string): EbookSeo {
  const base = siteUrl.replace(/\/+$/, "");
  const abs = (u: string) => (/^https?:\/\//i.test(u) ? u : base + (u.startsWith("/") ? "" : "/") + u);
  const image = ebookImages(e)[0] ?? null;
  return {
    title: `${e.title} | Cristina Vive Consciente`,
    description: plainSnippet(e.subtitle ? `${e.subtitle}. ${e.description ?? ""}` : e.description) || `${e.title}: ebook de Cristina Vive Consciente.`,
    canonical: base + ebookPath(e.slug),
    image: image ? abs(image) : null,
  };
}
