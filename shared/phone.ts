/**
 * phone.ts — teléfonos de contacto (puro, testeable; lo usan el formulario y el servidor).
 *
 * Cristina necesita SIEMPRE el teléfono del cliente. Se guarda en un formato único (+34693026894), que además sirve
 * para los enlaces `wa.me` (sin el «+»). Los números españoles de 9 cifras sin prefijo se completan con +34.
 */

/** "+34 693 02 68 94" → "+34693026894"; null si no parece un teléfono válido (8–15 cifras, 9 si es español sin prefijo). */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let s = String(raw).trim();
  if (!/^[+\d\s().\-]+$/.test(s)) return null; // solo cifras y separadores habituales
  const hadPlus = s.startsWith("+");
  s = s.replace(/[^\d]/g, "");
  if (!hadPlus && s.startsWith("00")) s = s.slice(2); // 0034… → 34…
  else if (!hadPlus && s.length === 9 && /^[6789]/.test(s)) return `+34${s}`; // español sin prefijo
  // Sin «+» ni «00» solo se admite un nº español de 9 cifras (6-9) o uno con prefijo 34: lo demás debe llevar «+»
  else if (!hadPlus && !(s.length === 11 && s.startsWith("34"))) return null;
  if (s.length < 8 || s.length > 15) return null;
  if (s.startsWith("34") && s.length !== 11) return null; // prefijo español con longitud incorrecta
  return `+${s}`;
}

export const isValidPhone = (raw: string | null | undefined): boolean => normalizePhone(raw) !== null;

/** Número para enlaces `wa.me` (solo cifras, con prefijo de país); null si no es válido. */
export function whatsappNumber(raw: string | null | undefined): string | null {
  const n = normalizePhone(raw);
  return n ? n.slice(1) : null;
}

/** "+34693026894" → "+34 693 02 68 94" (solo para mostrar). */
export function formatPhoneDisplay(raw: string | null | undefined): string {
  const n = normalizePhone(raw);
  if (!n) return raw ?? "";
  const m = n.match(/^\+34(\d{3})(\d{2})(\d{2})(\d{2})$/);
  return m ? `+34 ${m[1]} ${m[2]} ${m[3]} ${m[4]}` : n;
}
