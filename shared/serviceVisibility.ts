/**
 * Visibilidad de los servicios en la web pública.
 *
 * - `status` (activo/inactivo): si el servicio se ofrece.
 * - `visibleEnPublico` (1/0): si se publica en la web. Un servicio activo con 0 («no publicado») no aparece en
 *   los listados, no tiene página de detalle ni entra en el sitemap y no se puede reservar desde la web; sí se
 *   usa en el CRM (sesiones, citas, facturas) como cualquier otro.
 */
type ServiceLike = { status: string; visibleEnPublico?: number | null };

/** ¿Se muestra en la web pública? (los servicios anteriores a 0026 no tienen la marca: cuentan como visibles) */
export const isPublicService = (s: ServiceLike | null | undefined): boolean => !!s && s.status === "active" && s.visibleEnPublico !== 0;
