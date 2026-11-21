import { useEffect } from "react";
import { OPEN_COOKIE_SETTINGS_EVENT } from "@/lib/consent";
import type { SiteAction } from "@shared/siteActions";

export const SITE_ACTION_EVENT = "cvc:site-action";

/** Dispara una acción especial de botón (ver shared/siteActions.ts). */
export function dispatchSiteAction(name: SiteAction): void {
  if (name === "cookie-settings") window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT));
  else window.dispatchEvent(new CustomEvent(SITE_ACTION_EVENT, { detail: name }));
}

/** Escucha una acción especial mientras el componente está montado. */
export function useSiteAction(name: SiteAction, handler: () => void): void {
  useEffect(() => {
    const on = (e: Event) => { if ((e as CustomEvent<string>).detail === name) handler(); };
    window.addEventListener(SITE_ACTION_EVENT, on);
    return () => window.removeEventListener(SITE_ACTION_EVENT, on);
  });
}
