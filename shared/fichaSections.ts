import { FICHA_CONSULTAS } from "./ficha/consultas";
import { FICHA_MASAJES } from "./ficha/masajes";
import { FICHA_AGUA } from "./ficha/agua";
import { FICHA_ACEITES } from "./ficha/aceites";
import { FICHA_BLOG } from "./ficha/blog";

export interface FichaSectionDef { key: string; label: string }
/** Secciones de cada ficha por tipo (primer segmento de la ruta), en el orden actual de la web. */
export const FICHA_SECTIONS: Record<string, readonly FichaSectionDef[]> = {
  consultas: FICHA_CONSULTAS,
  masajes: FICHA_MASAJES,
  "sistemas-agua": FICHA_AGUA,
  "aceites-esenciales": FICHA_ACEITES,
  blog: FICHA_BLOG,
};
