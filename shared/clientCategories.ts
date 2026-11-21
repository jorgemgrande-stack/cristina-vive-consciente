/** Categorías de cliente del CRM. Una persona puede tener varias. */
export const CLIENT_CATEGORIES = [
  { key: "acompanamiento", label: "Acompañamiento" },
  { key: "masajes_y_sanacion", label: "Masajes y sanación" },
  { key: "guias", label: "Guías" },
  { key: "productos", label: "Productos" },
  { key: "recursos_gratuitos", label: "Recursos gratuitos" },
] as const;

export type ClientCategoryKey = (typeof CLIENT_CATEGORIES)[number]["key"];
export const CLIENT_CATEGORY_KEYS = CLIENT_CATEGORIES.map((c) => c.key) as ClientCategoryKey[];
export const clientCategoryLabel = (key: string) => CLIENT_CATEGORIES.find((c) => c.key === key)?.label ?? key;
export const isClientCategory = (key: string): key is ClientCategoryKey => CLIENT_CATEGORY_KEYS.includes(key as ClientCategoryKey);
