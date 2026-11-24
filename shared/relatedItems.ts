/**
 * «También te puede interesar» en la ficha de un ebook: ebooks, sistemas de agua, masajes y consultas públicos y activos,
 * con la ruta de su ficha pública. Los datos ya vienen filtrados (activos/visibles) por los listados públicos de cada tipo.
 */
import { ebookImages, ebookPath, ebookPriceLabel, matchesEbookSlug } from "./ebookPage";
import { formatEuros } from "./booking";

export type RelatedKind = "ebook" | "agua" | "consulta" | "masaje";
export interface RelatedItem {
  key: string;
  kind: RelatedKind;
  title: string;
  image: string | null;
  price: string | null;
  href: string;
}

export const RELATED_KIND_LABEL: Record<RelatedKind, string> = {
  ebook: "Ebook",
  agua: "Sistema de agua",
  consulta: "Consulta",
  masaje: "Masaje",
};

interface Sources {
  currentSlug: string;
  ebooks: { slug: string; title: string; price: string | number; coverImage: string | null; galleryImages: string | null }[];
  services: { slug: string; name: string; type: string; imageUrl: string | null; price: string | number | null }[];
  water: { slug: string; title: string; mainImage: string | null; priceVisible: string | null }[];
}

export function buildRelatedItems(s: Sources): RelatedItem[] {
  const out: RelatedItem[] = [];
  const seen = new Set<string>();
  const push = (it: RelatedItem) => {
    if (!it.title || seen.has(it.href)) return;
    seen.add(it.href);
    out.push(it);
  };
  for (const e of s.ebooks) {
    if (matchesEbookSlug(s.currentSlug, e.slug)) continue; // el que se está viendo no se repite
    push({ key: `ebook-${e.slug}`, kind: "ebook", title: e.title, image: ebookImages(e)[0] ?? null, price: ebookPriceLabel(e.price), href: ebookPath(e.slug) });
  }
  for (const v of s.services) {
    if (v.type !== "consulta" && v.type !== "masaje") continue; // los demás tipos no tienen ficha pública
    const price = v.price != null && Number(v.price) > 0 ? formatEuros(v.price) : null;
    push({ key: `${v.type}-${v.slug}`, kind: v.type, title: v.name, image: v.imageUrl, price, href: `/${v.type === "masaje" ? "masajes" : "consultas"}/${v.slug}` });
  }
  for (const w of s.water) push({ key: `agua-${w.slug}`, kind: "agua", title: w.title, image: w.mainImage, price: w.priceVisible || null, href: `/sistemas-agua/${w.slug}` });
  return out;
}
