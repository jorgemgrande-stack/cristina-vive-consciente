/** Secciones de la ficha de masajes, en el orden actual de la página. Clave estable + nombre en el editor. */
export interface FichaSectionDef { key: string; label: string }
export const FICHA_MASAJES: readonly FichaSectionDef[] = [
  { key: "cabecera", label: "Cabecera: título, galería y bloque de reserva" },
  { key: "descripcion", label: "Sobre esta sesión (descripción)" },
  { key: "experiencia", label: "La experiencia (qué incluye)" },
  { key: "beneficios", label: "Qué ofrece (beneficios)" },
  { key: "consideraciones", label: "Consideraciones importantes (contraindicaciones)" },
  { key: "como_reservar", label: "Cómo reservar (3 pasos)" },
  { key: "faq", label: "Preguntas frecuentes" },
  { key: "donde_cuando", label: "Dónde y cuándo" },
  { key: "barra_reserva", label: "Barra de reserva fija (móvil)" },
];
