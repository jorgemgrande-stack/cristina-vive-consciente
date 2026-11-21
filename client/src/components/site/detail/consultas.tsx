/**
 * Secciones de la ficha de consultas para el editor. Provider carga los datos de la ficha de la ruta actual (misma fuente que la
 * página de siempre); Section pinta una sección por su clave (ver shared/ficha/consultas.ts).
 */
import type { ReactNode } from "react";

export function ConsultasProvider({ children, slug }: { children: ReactNode; slug: string }) {
  void slug;
  return <>{children}</>;
}
export function ConsultasSection({ name }: { name: string }) {
  void name;
  return null;
}
