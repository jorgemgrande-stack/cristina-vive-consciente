/**
 * siteImages.ts — registro único de las imágenes fijas de la web (heros, etc.).
 *
 * REGLA: las imágenes que el código necesita siempre viven en client/public/site/
 * (dentro del repositorio, se despliegan con la app). Nunca apuntar a CDN/URLs
 * externas: ya se perdieron una vez (CDN de Manus devolvía 403). El script
 * scripts/check-assets.mjs (parte de `pnpm check`) lo impide.
 *
 * Las imágenes editables desde el CRM (productos, blog, servicios...) van por
 * /crm/galeria → volumen persistente /uploads.
 */
export const SITE_IMAGES = {
  heroMain: "/site/hero-main.webp",
  heroConsultas: "/site/hero-consultas.webp",
  heroMasajes: "/site/hero-masajes.webp",
  heroAceites: "/site/hero-aceites.webp",
  heroAgua: "/site/hero-agua.webp",
  heroSistemasAgua: "/site/hero-sistemas-agua.webp",
  cristina: "/site/cristina-sobre-mi.webp",
  logo: "/logo-bion.png",
} as const;
