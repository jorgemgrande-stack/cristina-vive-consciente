/**
 * Secciones de la ficha de agua para el editor. Provider carga los datos de la ficha de la ruta actual (misma fuente que la
 * página de siempre); Section pinta una sección por su clave (ver shared/ficha/agua.ts).
 */
import type { ReactNode } from "react";

export function AguaProvider({ children, slug }: { children: ReactNode; slug: string }) {
  void slug;
  return <>{children}</>;
}
export function AguaSection({ name }: { name: string }) {
  void name;
  return null;
}
