/**
 * Contexto de incrustación: cuando una página de siempre (listado de consultas, catálogo de aceites…) se pinta dentro del
 * bloque «conectado» de una página del editor, ya no pone su propio Layout (cabecera y pie los pone la página del editor)
 * ni su cabecera con imagen (esa es un bloque «Cabecera» editable).
 */
import { createContext, useContext, type ReactNode } from "react";

interface Embed { embedded: boolean; hideHero: boolean }
const EmbedContext = createContext<Embed>({ embedded: false, hideHero: false });
export const useEmbed = () => useContext(EmbedContext);

export function EmbedProvider({ hideHero = true, children }: { hideHero?: boolean; children: ReactNode }) {
  return <EmbedContext.Provider value={{ embedded: true, hideHero }}>{children}</EmbedContext.Provider>;
}

/** Envuelve la cabecera con imagen propia de una página de siempre: desaparece cuando la página va incrustada. */
export function LegacyHero({ children }: { children: ReactNode }) {
  const { hideHero } = useEmbed();
  return hideHero ? null : <>{children}</>;
}
