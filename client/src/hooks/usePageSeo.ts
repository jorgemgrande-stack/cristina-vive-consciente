import { useEffect } from "react";
import type { PageSeo } from "@shared/siteEditor";

function setMeta(selector: string, create: () => HTMLMetaElement, content: string | null) {
  let tag = document.querySelector<HTMLMetaElement>(selector);
  const prev = tag?.content ?? null;
  const existed = !!tag;
  if (content === null || content === "") return () => {};
  if (!tag) { tag = create(); document.head.appendChild(tag); }
  tag.content = content;
  return () => { if (!tag) return; if (existed && prev !== null) tag.content = prev; else tag.remove(); };
}
const named = (name: string) => () => { const m = document.createElement("meta"); m.setAttribute("name", name); return m; };
const prop = (p: string) => () => { const m = document.createElement("meta"); m.setAttribute("property", p); return m; };

/** SEO de una página del editor: título, descripción, imagen social y noindex. Se restaura al salir. */
export function usePageSeo(seo: PageSeo | null) {
  const { title, description, ogImage, noindex } = seo ?? { title: "", description: "", ogImage: "", noindex: false };
  useEffect(() => {
    if (!seo) return;
    const prevTitle = document.title;
    if (title) document.title = title;
    const undo = [
      setMeta('meta[name="description"]', named("description"), description),
      setMeta('meta[property="og:title"]', prop("og:title"), title),
      setMeta('meta[property="og:description"]', prop("og:description"), description),
      setMeta('meta[property="og:image"]', prop("og:image"), ogImage ? new URL(ogImage, window.location.origin).href : ""),
      setMeta('meta[name="robots"]', named("robots"), noindex ? "noindex, nofollow" : ""),
    ];
    return () => { document.title = prevTitle; undo.forEach((u) => u()); };
  }, [seo !== null, title, description, ogImage, noindex]);
}
