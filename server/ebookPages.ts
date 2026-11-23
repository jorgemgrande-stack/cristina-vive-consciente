/**
 * Fichas públicas de ebooks (/guias-digitales/:slug) servidas con SEO real:
 *  - 404 para slugs inexistentes o ebooks inactivos (la web, además, muestra su página de «no encontrada»);
 *  - 301 a la URL canónica si se entra con «_» (los_cuatro_regalos…) en lugar de «-»;
 *  - título, descripción, URL canónica e imagen para compartir en el HTML que reciben los rastreadores
 *    (WhatsApp, Google…), que no ejecutan JavaScript.
 */
import type { Express, Request, Response } from "express";
import { listEbooks } from "./db";
import { ebookPath, ebookSeo, ebookUrlSlug, matchesEbookSlug, type EbookPageData } from "../shared/ebookPage";

export const SITE_URL = (process.env.SITE_URL || "https://cristinaviveconsciente.es").replace(/\/+$/, "");

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Quita las etiquetas de SEO genéricas del index.html para sustituirlas por las del ebook. */
function stripGenericSeo(html: string): string {
  return html
    .replace(/<title>[\s\S]*?<\/title>\s*/i, "")
    .replace(/<meta\s+name="description"[^>]*>\s*/gi, "")
    .replace(/<meta\s+property="og:(title|description|type|image|url)"[^>]*>\s*/gi, "")
    .replace(/<meta\s+name="twitter:[^"]*"[^>]*>\s*/gi, "")
    .replace(/<link\s+rel="canonical"[^>]*>\s*/gi, "");
}

export function injectEbookSeo(html: string, ebook: EbookPageData): string {
  const seo = ebookSeo(ebook, SITE_URL);
  const tags = [
    `<title>${esc(seo.title)}</title>`,
    `<meta name="description" content="${esc(seo.description)}" />`,
    `<link rel="canonical" href="${esc(seo.canonical)}" />`,
    `<meta property="og:type" content="product" />`,
    `<meta property="og:site_name" content="Cristina Vive Consciente" />`,
    `<meta property="og:title" content="${esc(seo.title)}" />`,
    `<meta property="og:description" content="${esc(seo.description)}" />`,
    `<meta property="og:url" content="${esc(seo.canonical)}" />`,
    ...(seo.image ? [`<meta property="og:image" content="${esc(seo.image)}" />`] : []),
    `<meta name="twitter:card" content="${seo.image ? "summary_large_image" : "summary"}" />`,
    `<meta name="twitter:title" content="${esc(seo.title)}" />`,
    `<meta name="twitter:description" content="${esc(seo.description)}" />`,
    ...(seo.image ? [`<meta name="twitter:image" content="${esc(seo.image)}" />`] : []),
    `<script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      name: ebook.title,
      description: seo.description,
      ...(seo.image ? { image: seo.image } : {}),
      offers: { "@type": "Offer", url: seo.canonical, priceCurrency: "EUR", price: Number(ebook.price).toFixed(2), availability: "https://schema.org/InStock" },
    }).replace(/</g, "\\u003c")}</script>`,
  ].join("\n    ");
  const clean = stripGenericSeo(html);
  return clean.includes("</head>") ? clean.replace("</head>", `    ${tags}\n  </head>`) : tags + clean;
}

/** Marca la respuesta de «no encontrada» como no indexable. */
export function injectNoindex(html: string): string {
  const tag = `<meta name="robots" content="noindex, nofollow" />`;
  return html.includes("</head>") ? html.replace("</head>", `    ${tag}\n  </head>`) : html;
}

export type EbookPageResult =
  | { kind: "redirect"; to: string }
  | { kind: "found"; ebook: EbookPageData }
  | { kind: "notFound" };

/** Resuelve la ruta contra los ebooks ACTIVOS. */
export async function resolveEbookPage(urlPart: string): Promise<EbookPageResult> {
  const slugPart = decodeURIComponent(urlPart).trim();
  const ebook = (await listEbooks(true)).find((e) => e.status === "active" && matchesEbookSlug(slugPart, e.slug));
  if (!ebook) return { kind: "notFound" };
  if (slugPart !== ebookUrlSlug(ebook.slug)) return { kind: "redirect", to: ebookPath(ebook.slug) };
  return { kind: "found", ebook };
}

/**
 * Registra GET /guias-digitales/:slug. getTemplate devuelve el index.html (el de dist en producción, el transformado
 * por Vite en desarrollo). Se registra ANTES del «fallback» que sirve index.html para todo.
 */
export function registerEbookPages(app: Express, getTemplate: (req: Request) => Promise<string>) {
  app.get(/^\/guias-digitales\/([^/]+)\/?$/, async (req: Request, res: Response, next) => {
    try {
      const result = await resolveEbookPage(req.params[0]);
      if (result.kind === "redirect") return res.redirect(301, result.to);
      const html = await getTemplate(req);
      if (result.kind === "notFound") return res.status(404).set({ "Content-Type": "text/html; charset=utf-8" }).end(injectNoindex(html));
      return res.status(200).set({ "Content-Type": "text/html; charset=utf-8" }).end(injectEbookSeo(html, result.ebook));
    } catch (err) {
      next(err);
    }
  });
}
