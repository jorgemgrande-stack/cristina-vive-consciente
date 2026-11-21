/** Secciones de la ficha de consultas, en el orden actual de la página. Clave estable + nombre en el editor. */
export interface FichaSectionDef { key: string; label: string }
export const FICHA_CONSULTAS: readonly FichaSectionDef[] = [
  { key: "cabecera", label: "Cabecera de la ficha (imagen, título, precio)" },
  { key: "descripcion", label: "Descripción" },
  { key: "imagen-detalle", label: "Imagen de detalle" },
  { key: "beneficios", label: "Ideal para (beneficios)" },
  { key: "notas", label: "Notas importantes (contraindicaciones)" },
  { key: "faq", label: "Preguntas frecuentes" },
  { key: "reserva", label: "Reserva (precio, qué incluye y botón)" },
  { key: "volver", label: "Enlace «Ver todas las consultas»" },
];
