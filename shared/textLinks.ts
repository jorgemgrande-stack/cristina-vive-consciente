/**
 * Enlaces dentro de un texto plano del CRM, con la forma [texto](/ruta). Solo rutas de la propia web:
 * cualquier otra dirección se deja escrita tal cual. No genera HTML.
 */
export type TextPart = string | { label: string; href: string };

const LINK = /\[([^\[\]]+)\]\((\/(?![\/\\])[^\s()]*)\)/g;

export function splitLinks(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let last = 0;
  for (const m of Array.from(text.matchAll(LINK))) {
    if (m.index! > last) parts.push(text.slice(last, m.index));
    parts.push({ label: m[1], href: m[2] });
    last = m.index! + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
