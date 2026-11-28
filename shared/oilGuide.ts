/**
 * La ficha «Guía digital de aceites esenciales» es el mismo PDF que el ebook «aceites», y comprarlo suelto no incluye
 * soporte grupal (confirmado por Cristina). Esto quita esa promesa y deja el resto del texto como está.
 */
const PROMISE = /incluye soporte grupal y /i;

export function removeGroupSupport(description: string): string {
  const out = description.replace(PROMISE, "incluye ");
  // Si el texto se ha reescrito y sigue hablando del soporte, no se adivina: lo corrige una persona
  if (/soporte\s+grupal/i.test(out)) throw new Error("La descripción menciona el soporte grupal con otras palabras: corrígela a mano en CRM → Aceites y vuelve a ejecutar.");
  return out;
}
