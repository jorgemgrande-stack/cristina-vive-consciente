/** Secciones de la ficha de blog, en el orden actual de la página. Clave estable + nombre en el editor. */
export interface FichaSectionDef { key: string; label: string }
export const FICHA_BLOG: readonly FichaSectionDef[] = [
  { key: "cabecera", label: "Imagen de cabecera" },
  { key: "meta", label: "Categoría, fecha, autor y lectura" },
  { key: "titulo", label: "Título del artículo" },
  { key: "extracto", label: "Extracto" },
  { key: "imagen-destacada", label: "Imagen destacada" },
  { key: "contenido", label: "Contenido del artículo" },
  { key: "comentarios", label: "Comentarios" },
  { key: "volver", label: "Enlace «Volver a todos los artículos»" },
];
