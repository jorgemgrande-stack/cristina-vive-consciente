/**
 * Acciones especiales de botón y enlace (en lugar de una dirección): abren una ventana o muestran una sección que ya
 * existe en la web. Se escriben como «action:nombre» y se editan con un selector, nunca como código.
 */
export const SITE_ACTIONS = [
  { value: "booking", label: "Abrir la ventana de reserva de cita" },
  { value: "booking-masaje", label: "Abrir la reserva de un masaje" },
  { value: "water-advice", label: "Abrir la solicitud de asesoramiento de agua" },
  { value: "toggle-technique", label: "Mostrar u ocultar «Cómo funciona» (masajes)" },
  { value: "cookie-settings", label: "Abrir las preferencias de cookies" },
] as const;
export type SiteAction = (typeof SITE_ACTIONS)[number]["value"];
export const ACTION_RE = new RegExp(`^action:(${SITE_ACTIONS.map((a) => a.value).join("|")})$`);
export const isActionHref = (href: string): boolean => ACTION_RE.test(href);
export const actionName = (href: string): SiteAction | null => (ACTION_RE.test(href) ? (href.slice(7) as SiteAction) : null);
