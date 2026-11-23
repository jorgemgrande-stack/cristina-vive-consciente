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

export function promoSource(): string {
  try {
    return detectPromoSource(window.location.search, document.referrer);
  } catch {
    return "directo";
  }
}

/** Medición agregada y anónima: solo tipo de evento, canal y origen (sin IP ni datos personales). */
export function trackPromo(slug: string, kind: "view" | "share", extra: { channel?: string } = {}) {
  try {
    void fetch(`/api/promos/${encodeURIComponent(slug)}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({ kind, source: promoSource(), ...extra }),
    });
  } catch {
    /* la medición nunca debe romper la página */
  }
}
