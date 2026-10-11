/**
 * orders.ts — pedidos de guías digitales pagados por Bizum (puro, testeable; lo usan servidor y cliente).
 *
 * El Bizum a un teléfono particular no tiene API ni webhook: la web NO puede saber si el pago ha llegado.
 * Por eso el pedido queda «pendiente» hasta que Cristina lo confirma a mano en el CRM tras ver el Bizum en su banco.
 */
import { CRISTINA_WHATSAPP_NUMBER } from "./booking";
import { formatPhoneDisplay } from "./phone";

/** Teléfono que recibe los Bizum (el mismo número de Cristina que el WhatsApp). */
export const BIZUM_PHONE = `+${CRISTINA_WHATSAPP_NUMBER}`;
export const BIZUM_PHONE_DISPLAY = formatPhoneDisplay(BIZUM_PHONE);

export const ORDER_STATUSES = ["pending", "paid", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pendiente de pago",
  paid: "Pagado",
  cancelled: "Cancelado",
};

// Sin 0/O/1/I/L para que se pueda dictar y copiar sin errores.
const REF_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const REF_RE = /^GUIA-[A-HJKMNP-Z2-9]{6}$/;

/** Referencia aleatoria «GUIA-XXXXXX» (6 de 31 símbolos: ~887 M combinaciones, no se puede adivinar). */
export function generateOrderReference(random: (max: number) => number = (m) => Math.floor(Math.random() * m)): string {
  let s = "";
  for (let i = 0; i < 6; i++) s += REF_ALPHABET[random(REF_ALPHABET.length)];
  return `GUIA-${s}`;
}

export function isValidOrderReference(ref: string): boolean {
  return REF_RE.test(ref);
}

/** 1200 → "12,00 €"; los enteros sin decimales ("12 €"). */
export function formatEuros(cents: number): string {
  const n = cents / 100;
  const txt = Number.isInteger(n) ? String(n) : n.toFixed(2).replace(".", ",");
  return `${txt} €`;
}

/** Importe para pedir en el Bizum: siempre con dos decimales y punto, como lo teclea la app del banco ("12.00"). */
export function bizumAmount(cents: number): string {
  return (cents / 100).toFixed(2);
}
