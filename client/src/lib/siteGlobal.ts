/**
 * Ajustes globales de la web (logo, menú, pie, WhatsApp, textos) y modo de vista previa privada.
 * Los visitantes solo reciben lo publicado; la administradora, con `?__preview=1`, ve el borrador en la web real.
 */
import { useSearch } from "wouter";
import { DEFAULT_GLOBAL, labelText, type SiteGlobal } from "@shared/siteEditor";
import { trpc } from "@/lib/trpc";

/** ¿La URL pide la vista previa del borrador? (solo funciona con la sesión de administradora) */
export function usePreviewRequested(): boolean {
  const search = useSearch();
  return new URLSearchParams(search).get("__preview") === "1";
}

export function useIsAdmin(): boolean {
  const me = trpc.auth.me.useQuery(undefined, { staleTime: 60_000, retry: false });
  return me.data?.role === "admin";
}

/** Vista previa activa = pedida y con sesión de administradora. */
export function usePreviewMode(): boolean {
  const asked = usePreviewRequested();
  const admin = useIsAdmin();
  return asked && admin;
}

export function useSiteGlobal(): SiteGlobal {
  const preview = usePreviewMode();
  const published = trpc.site.global.useQuery(undefined, { staleTime: 30_000 });
  const draft = trpc.site.previewGlobal.useQuery(undefined, { enabled: preview, staleTime: 0 });
  if (preview && draft.data) return draft.data;
  return published.data ?? DEFAULT_GLOBAL;
}

/** Función de textos editables: `const L = useLabels(); L("booking.submit")`. */
export function useLabels(): (key: string) => string {
  const labels = useSiteGlobal().labels;
  return (key) => labelText(labels, key);
}

/** Texto editable de la web (reserva, compra, avisos): el editado en «Textos» o el de serie. */
export function useLabel(key: string): string {
  return labelText(useSiteGlobal().labels, key);
}

/** Enlaces internos usan wouter; externos, mailto y tel, un <a> normal. */
export const isExternalUrl = (url: string): boolean => /^(https?:|mailto:|tel:)/i.test(url);
