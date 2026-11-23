/**
 * Promociones de ebooks en la web. El estado lo decide el servidor (hora del servidor); el navegador solo cuenta atrás
 * con la diferencia entre ambos relojes y vuelve a preguntar al llegar al cierre.
 */
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { detectPromoSource, promoState, type PromoState } from "@shared/promo";

export interface ActivePromo {
  slug: string;
  bannerText: string;
  endsAt: number;
  path: string;
}
export interface PublicPromo {
  slug: string;
  state: PromoState;
  serverNow: number;
  startsAt: number | null;
  endsAt: number;
  headline: string;
  message: string;
  bannerText: string;
  donationEnabled: boolean;
  donationConcept: string;
  ebook: { title: string; synopsis: string | null; author: string | null; edition: string | null; subtitle: string | null; cover: string | null; price: string; fichaPath: string } | null;
}

async function getJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(String(res.status));
  return (await res.json()) as T;
}

/** Hora actual según el servidor: Date.now() corregido con la diferencia medida en la última respuesta. */
export function useServerClock(serverNow: number | undefined) {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    if (serverNow != null) setOffset(serverNow - Date.now());
  }, [serverNow]);
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
  return Date.now() + offset;
}

/** Aviso de la campaña activa (portada y Guías digitales). Desaparece solo al llegar el cierre. */
export function useActivePromo(): ActivePromo | null {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["promo-active"],
    queryFn: () => getJson<{ active: ActivePromo | null; serverNow: number }>("/api/promos/active"),
    refetchInterval: 60_000,
    staleTime: 0,
    gcTime: 0,
  });
  const now = useServerClock(data?.serverNow);
  const active = data?.active ?? null;
  const over = !!active && now >= active.endsAt;
  useEffect(() => {
    if (over) qc.invalidateQueries({ queryKey: ["promo-active"] });
  }, [over, qc]);
  return active && !over ? active : null;
}

export function usePublicPromo(slug: string) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["promo", slug],
    queryFn: () => getJson<PublicPromo>(`/api/promos/${encodeURIComponent(slug)}`),
    refetchInterval: 60_000,
    staleTime: 0,
    gcTime: 0,
  });
  const now = useServerClock(q.data?.serverNow);
  const promo = q.data ?? null;
  // Estado «en vivo»: se recalcula cada segundo con la hora del servidor; al cambiar de fase se vuelve a preguntar
  const state: PromoState | null = promo ? promoState({ published: 1, startsAt: promo.startsAt, endsAt: promo.endsAt }, now) : null;
  useEffect(() => {
    if (promo && state && state !== promo.state) qc.invalidateQueries({ queryKey: ["promo", slug] });
  }, [state, promo, qc, slug]);
  return { ...q, promo, state, now };
}

/**
 * Procedencia de la visita (campaña + canal del enlace, o el sitio de referencia). Se guarda al abrir la ficha y se
 * conserva durante el paso al formulario y a la descarga, aunque se recargue la página.
 */
export function promoSource(slug = "promo"): string {
  const key = `promo-src-${slug}`;
  let fresh = "directo";
  try {
    fresh = detectPromoSource(window.location.search, document.referrer);
  } catch {
    /* sin ventana */
  }
  try {
    if (fresh !== "directo" && fresh !== "web") {
      sessionStorage.setItem(key, fresh);
      return fresh;
    }
    const kept = sessionStorage.getItem(key);
    if (kept) return kept;
  } catch {
    /* sin almacenamiento */
  }
  return fresh;
}

export interface RegisterErrors {
  name?: string;
  email?: string;
  phone?: string;
  form?: string;
}

/** Envía el formulario de descarga: el servidor valida, guarda en el CRM y devuelve el token de la ruta protegida. */
export async function registerPromo(
  slug: string,
  data: { name: string; email: string; phone: string },
): Promise<{ token: string } | { errors: RegisterErrors; ended?: boolean }> {
  try {
    const res = await fetch(`/api/promos/${encodeURIComponent(slug)}/registro`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, source: promoSource(slug) }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok && typeof body.token === "string") return { token: body.token };
    if (res.status === 410) return { errors: { form: "La descarga gratuita ha terminado." }, ended: true };
    if (res.status === 400 && body.errors) return { errors: body.errors };
    return { errors: { form: body.message ?? "No hemos podido guardar tus datos. Inténtalo de nuevo." } };
  } catch {
    return { errors: { form: "No hemos podido guardar tus datos. Revisa tu conexión e inténtalo de nuevo." } };
  }
}

/** Medición agregada y anónima: solo tipo de evento, canal y origen (sin IP ni datos personales). */
export function trackPromo(slug: string, kind: "view" | "share", extra: { channel?: string; confirmed?: boolean } = {}) {
  try {
    void fetch(`/api/promos/${encodeURIComponent(slug)}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({ kind, source: promoSource(slug), ...extra }),
    });
  } catch {
    /* la medición nunca debe romper la página */
  }
}
