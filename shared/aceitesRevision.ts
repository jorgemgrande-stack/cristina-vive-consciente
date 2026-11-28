/**
 * Textos de los ajustes tras la revisión de Cristina y cómo aplicarlos a lo ya guardado (CRM y borrador del editor).
 * Cada función es repetible y no adivina: si el texto se ha reescrito, avisa para corregirlo a mano.
 */
export const PACK_NAME = "Asesoramiento de aromaterapia con guía incluida";
export const PACK_OLD_NAME = "Pack asesoramiento personalizado de aromaterapia + guía básica";
export const PACK_OLD_DESCRIPTION = "Consulta online individual para preparar tu botiquín de aromaterapia, con la guía básica de aceites esenciales incluida. Los aceites esenciales y los gastos de envío se abonan aparte.";
export const PACK_DESCRIPTION = "Consulta online individual para preparar tu botiquín de aromaterapia. Incluye la guía básica de aceites esenciales y tu PDF personalizado con los usos y aplicaciones de los aceites que elijas. Los aceites esenciales y los gastos de envío se abonan aparte.";

export const GUIDE_ORDERS_SENTENCE = "Si quieres adquirir alguno de los aceites de la guía, puedes [consultar las modalidades de pedido](/aceites-esenciales#pedidos).";
const PURCHASE_PHRASE = /, incluye posibilidad de compra a través de mí\./i;

/** Ficha «Guía digital»: la mención a la «posibilidad de compra a través de mí» pasa a la frase con enlace a Pedidos. */
export function linkGuideToOrders(description: string): string {
  if (description.includes(GUIDE_ORDERS_SENTENCE)) return description;
  if (!PURCHASE_PHRASE.test(description)) throw new Error("No encuentro la frase de la compra en la descripción de la guía: corrígela a mano en CRM → Aceites.");
  return description.replace(PURCHASE_PHRASE, `. ${GUIDE_ORDERS_SENTENCE}`);
}

export const DELIVERY_OLD = "Una vez realizada tu selección, recibirás tu documento personalizado en PDF en un plazo máximo de 10 días y, si lo deseas, puedo encargarme de gestionar la compra.";
export const DELIVERY_NEW = "Recibirás tu documento personalizado en PDF en un plazo máximo de 10 días desde que me confirmes tu selección y, si lo deseas, puedo encargarme de gestionar la compra.";

/** El plazo se cuenta desde la confirmación de la selección. `null`: el texto está reescrito y no se toca. */
export function alignDelivery(text: string): string | null {
  if (text.includes(DELIVERY_NEW)) return text;
  return text.includes(DELIVERY_OLD) ? text.replace(DELIVERY_OLD, DELIVERY_NEW) : null;
}
