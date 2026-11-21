/** Secciones de la ficha de aceites, en el orden actual de la página. Clave estable + nombre en el editor. */
export interface FichaSectionDef { key: string; label: string }
export const FICHA_ACEITES: readonly FichaSectionDef[] = [
  { key: "breadcrumb", label: "Migas de pan" },
  { key: "hero", label: "Cabecera: imagen, beneficios y botones de consulta" },
  { key: "uso", label: "Información de uso" },
  { key: "faq", label: "Preguntas frecuentes" },
  { key: "cta", label: "Llamada a la acción final" },
];
