export const PRINTED_STORY_EBOOK_SLUG = "los-cuatro-regalos-de-la-tierra";
export const PRINTED_STORY_ORDER_SLUG = "los-cuatro-regalos-de-la-tierra-impreso";
export const PRINTED_STORY_TYPE = "printed_book";
export const PRINTED_STORY_PRICE_CENTS = 1550;
export const PRINTED_STORY_SHIPS_FROM = "15 de diciembre de 2026";
export const PRINTED_STORY_SHIPS_AT = Date.parse("2026-12-15T00:00:00+01:00");

export type ShippingAddress = {
  street: string;
  details?: string;
  postalCode: string;
  city: string;
  province: string;
  country: "España";
};

export function parsePrintedStoryShippingCents(value: string | undefined): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const cents = Number(value);
  return Number.isSafeInteger(cents) && cents > 0 && cents <= 10000 ? cents : null;
}
