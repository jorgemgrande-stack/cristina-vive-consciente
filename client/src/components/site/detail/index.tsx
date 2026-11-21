import type { ReactNode } from "react";
import { ConsultasProvider, ConsultasSection } from "./consultas";
import { MasajesProvider, MasajesSection } from "./masajes";
import { AguaProvider, AguaSection } from "./agua";
import { AceitesProvider, AceitesSection } from "./aceites";
import { BlogProvider, BlogSection } from "./blog";

export type FichaProviderProps = { children: ReactNode; slug: string };
type Entry = { Provider: (p: FichaProviderProps) => ReactNode; Section: (p: { name: string }) => ReactNode };
/** Fichas editables por tipo (primer segmento de la ruta). */
export const FICHA_REGISTRY: Record<string, Entry> = {
  consultas: { Provider: ConsultasProvider, Section: ConsultasSection },
  masajes: { Provider: MasajesProvider, Section: MasajesSection },
  "sistemas-agua": { Provider: AguaProvider, Section: AguaSection },
  "aceites-esenciales": { Provider: AceitesProvider, Section: AceitesSection },
  blog: { Provider: BlogProvider, Section: BlogSection },
};

/** Carga la ficha de `slug` (o de la ruta actual si no se indica) para las secciones que haya dentro. */
export function FichaScope({ kind, slug, children }: { kind: string | null; slug: string; children: ReactNode }) {
  const entry = kind ? FICHA_REGISTRY[kind] : undefined;
  return entry ? <entry.Provider slug={slug}>{children}</entry.Provider> : <>{children}</>;
}
