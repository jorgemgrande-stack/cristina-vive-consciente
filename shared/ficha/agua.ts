/** Secciones de la ficha de agua, en el orden actual de la página. Clave estable + nombre en el editor. */
export interface FichaSectionDef { key: string; label: string }
export const FICHA_AGUA: readonly FichaSectionDef[] = [
  { key: "breadcrumb", label: "Migas de pan" },
  { key: "hero", label: "Cabecera: galería, precio y botones" },
  { key: "descripcion", label: "Descripción completa" },
  { key: "beneficios", label: "Beneficios principales" },
  { key: "especificaciones", label: "Especificaciones técnicas" },
  { key: "instalacion", label: "Instalación, mantenimiento y garantía" },
  { key: "por-que", label: "Por qué elegirlo y para quién" },
  { key: "experto", label: "Bloque de la experta" },
  { key: "faq", label: "Preguntas frecuentes" },
  { key: "cta", label: "Llamada a la acción final" },
];
