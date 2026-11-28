/**
 * Una ficha del catálogo de aceites puede remitir a otro producto, con una etiqueta en CRM → Aceites:
 *   «ebook:<identificador>»    → se compra en esa guía digital (precio de CRM → Ebooks)
 *   «consulta:<identificador>» → se contrata en el asesoramiento (precio de CRM → Servicios)
 * La ficha del catálogo sigue siendo informativa: no tiene precio propio ni compra.
 */
export type OilLink = { kind: "ebook" | "consulta"; ref: string };

const LINK = /^(ebook|consulta):([a-z0-9_-]{1,100})$/i;

function parseTags(tags: string | null | undefined): string[] {
  try {
    const v = JSON.parse(tags ?? "[]");
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

export function oilLink(tags: string | null | undefined): OilLink | null {
  for (const t of parseTags(tags)) {
    const m = LINK.exec(t.trim());
    if (m) return { kind: m[1].toLowerCase() as OilLink["kind"], ref: m[2].toLowerCase() };
  }
  return null;
}

/** Etiquetas que se muestran en la ficha: sin las de enlace. */
export const visibleOilTags = (tags: string | null | undefined): string[] => parseTags(tags).filter((t) => !LINK.test(t.trim()));

export const OIL_ADVICE_URL = "/aceites-esenciales#asesoramiento";
export const OILS_NOT_INCLUDED = "Aceites esenciales no incluidos en el precio.";
