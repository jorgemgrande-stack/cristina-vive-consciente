/**
 * Promociones de ebooks (descarga gratuita por tiempo limitado). Lógica compartida entre servidor y web:
 * el SERVIDOR es quien decide si una campaña está activa; la web solo la pinta y cuenta atrás con la hora del servidor.
 */
export type PromoState = "draft" | "scheduled" | "active" | "ended";

export interface PromoTiming {
  published: number | boolean;
  startsAt: number | null; // ms UTC; null = desde que se publica
  endsAt: number; // ms UTC; la campaña termina exactamente en este instante
}

export function promoState(p: PromoTiming, now: number): PromoState {
  if (!p.published) return "draft";
  if (p.startsAt != null && now < p.startsAt) return "scheduled";
  if (now >= p.endsAt) return "ended";
  return "active";
}

/** Bizum de Cristina para el donativo voluntario. */
export const PROMO_BIZUM_DISPLAY = "+34 657 165 343";
export const PROMO_BIZUM_COPY = "+34657165343";
export const PROMO_TZ = "Europe/Madrid";
export const promoPath = (slug: string) => `/promocion/${slug}`;

// ── Hora peninsular española ────────────────────────────────────────────────
const partsIn = (ms: number) => {
  const f = new Intl.DateTimeFormat("en-GB", { timeZone: PROMO_TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  const o: Record<string, string> = {};
  for (const p of f.formatToParts(new Date(ms))) o[p.type] = p.value;
  return o;
};

/** "2026-11-26T23:59" (hora de Madrid) → ms UTC. */
export function madridLocalToMs(local: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local.trim());
  if (!m) return NaN;
  const asUtc = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  let ms = asUtc;
  for (let i = 0; i < 3; i++) {
    const p = partsIn(ms);
    const shown = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
    ms += asUtc - shown;
  }
  return ms;
}

/** ms UTC → "2026-11-26T23:59" (hora de Madrid), para <input type="datetime-local">. */
export function msToMadridLocal(ms: number): string {
  const p = partsIn(ms);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

/** «jueves 26 de noviembre a las 23:59» (hora peninsular). */
export function formatMadridDeadline(ms: number): string {
  const d = new Intl.DateTimeFormat("es-ES", { timeZone: PROMO_TZ, weekday: "long", day: "numeric", month: "long" }).format(new Date(ms)).replace(",", "");
  const t = new Intl.DateTimeFormat("es-ES", { timeZone: PROMO_TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(ms));
  return `${d} a las ${t}`;
}

/** Cuenta atrás a partir de los ms restantes. */
export function countdownParts(remainingMs: number) {
  const s = Math.max(0, Math.floor(remainingMs / 1000));
  return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60 };
}

// ── Difusión ────────────────────────────────────────────────────────────────
export function promoShareMessage(title: string, endsAt: number, url: string): string {
  return `Te regalo este cuento ilustrado de Cristina: «${title}». Puedes descargarlo gratis hasta el ${formatMadridDeadline(endsAt)} (hora peninsular): ${url}`;
}
export const whatsappShareUrl = (message: string) => `https://wa.me/?text=${encodeURIComponent(message)}`;

/** Origen de la visita para medir campañas: ?utm_source= / ?ref= o, si no, el dominio de referencia. Solo datos agregados. */
export function detectPromoSource(search: string, referrer: string): string {
  const clean = (v: string | null) => {
    const s = (v ?? "").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 30);
    return s || null;
  };
  const q = new URLSearchParams(search);
  const explicit = clean(q.get("utm_source")) ?? clean(q.get("ref"));
  if (explicit) return explicit;
  let host = "";
  try { host = new URL(referrer).hostname.toLowerCase(); } catch { /* sin referencia */ }
  if (!host) return "directo";
  if (/instagram\.com$/.test(host)) return "instagram";
  if (/(whatsapp\.com|wa\.me)$/.test(host)) return "whatsapp";
  if (/(facebook\.com|fb\.com)$/.test(host)) return "facebook";
  if (/google\./.test(host)) return "google";
  if (/cristinaviveconsciente\./.test(host)) return "web";
  return "otros";
}

export const PROMO_SOURCE_RE = /^[a-z0-9_-]{1,30}$/;
