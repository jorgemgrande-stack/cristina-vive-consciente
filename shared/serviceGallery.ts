/**
 * serviceGallery.ts — galería de imágenes de una ficha de servicio (puro, testeable).
 *
 * Las imágenes personalizadas viven en la tabla `service_images` (editable desde el CRM). Mientras un
 * servicio no tenga ninguna (o la tabla aún no exista en la base de datos), se muestra una galería por
 * defecto formada por las imágenes que el servicio ya tenía (`imageUrl`, `detailImage`) y, en los masajes,
 * la foto de la sala. Nunca se repite una misma imagen.
 */

/** Foto de la sala (copia fija dentro del repo). Es una imagen ilustrativa, no una foto real del local. */
export const SALA_IMAGE = {
  url: "/site/sala-masaje.webp",
  alt: "Sala de masajes con camilla, toallas, plantas y estantería de madera con aceites, junto a una ventana con vistas a un pinar (imagen ilustrativa)",
  caption: "La sala (imagen ilustrativa)",
};

export type GalleryImage = {
  /** id de la fila en `service_images`; null en las imágenes de la galería por defecto */
  id: number | null;
  url: string;
  alt: string;
  caption?: string;
  isCover: boolean;
};

export type ServiceImageRow = { id: number; url: string; alt?: string | null; sortOrder: number; isCover: number | boolean };
export type GalleryService = { name: string; type?: string | null; imageUrl?: string | null; detailImage?: string | null };

/** Máximo de imágenes por servicio. */
export const MAX_SERVICE_IMAGES = 20;

/** Clave para detectar duplicados: ruta sin dominio ni parámetros. */
export function imageKey(url: string): string {
  return url.trim().replace(/^https?:\/\/[^/]+/i, "").split(/[?#]/)[0].toLowerCase();
}

/** Solo rutas propias: /uploads/… (subidas del CRM) o /site/… (imágenes fijas del sitio). Sin «..». */
export function isAllowedImageUrl(url: string): boolean {
  return /^\/(uploads|site)\/[A-Za-z0-9_\-./%]+$/.test(url) && !url.includes("..") && url.length <= 500;
}

/** Texto alternativo por defecto cuando el CRM no tiene uno. */
export function defaultAlt(serviceName: string, index: number): string {
  return index === 0 ? `${serviceName} — foto principal` : `${serviceName} — imagen ${index + 1}`;
}

/** Galería por defecto de un servicio sin imágenes personalizadas. */
export function defaultGallery(service: GalleryService): GalleryImage[] {
  const out: GalleryImage[] = [];
  const seen = new Set<string>();
  const push = (url: string | null | undefined, alt: string, caption?: string) => {
    if (!url) return;
    const k = imageKey(url);
    if (seen.has(k)) return;
    seen.add(k);
    out.push({ id: null, url, alt, caption, isCover: out.length === 0 });
  };
  push(service.imageUrl, `${service.name} — foto principal`);
  push(service.detailImage, `${service.name} — detalle de la sesión`);
  if (service.type === "masaje") push(SALA_IMAGE.url, SALA_IMAGE.alt, SALA_IMAGE.caption);
  return out;
}

/** Galería que se muestra: la personalizada (portada primero, luego por orden) o la de por defecto. */
export function buildServiceGallery(service: GalleryService, rows: ServiceImageRow[]): { images: GalleryImage[]; custom: boolean } {
  if (rows.length === 0) return { images: defaultGallery(service), custom: false };
  const seen = new Set<string>();
  const sorted = [...rows].sort((a, b) => Number(!!b.isCover) - Number(!!a.isCover) || a.sortOrder - b.sortOrder || a.id - b.id);
  const images: GalleryImage[] = [];
  for (const r of sorted) {
    const k = imageKey(r.url);
    if (seen.has(k)) continue;
    seen.add(k);
    images.push({
      id: r.id,
      url: r.url,
      alt: r.alt?.trim() || defaultAlt(service.name, images.length),
      caption: imageKey(r.url) === imageKey(SALA_IMAGE.url) ? SALA_IMAGE.caption : undefined,
      isCover: images.length === 0,
    });
  }
  return { images, custom: true };
}
