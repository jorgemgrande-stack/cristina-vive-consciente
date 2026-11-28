/**
 * Pedidos de aceites (por contacto directo): estado del pedido conjunto según la fecha límite, en hora de Madrid.
 * «Abierto» exige estado abierto Y fecha límite sin vencer (el día indicado cuenta entero).
 */
export const OIL_ORDERS_TZ = "Europe/Madrid";

/** Fecha de hoy («AAAA-MM-DD») en la zona horaria de la web. */
export function todayIn(tz: string = OIL_ORDERS_TZ, now: number = Date.now()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(now));
}

/** «AAAA-MM-DD» que existe en el calendario, o cadena vacía. También acepta «DD/MM/AAAA». */
export function cleanDate(v: string): string {
  const s = (v ?? "").trim();
  const es = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  const iso = es ? `${es[3]}-${es[2].padStart(2, "0")}-${es[1].padStart(2, "0")}` : s;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return "";
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3] ? m[0] : "";
}

export type GroupOrderState = "open" | "closed" | "expired" | "no_date";

export function groupOrderState(open: "on" | "off", deadline: string, now: number = Date.now()): GroupOrderState {
  const date = cleanDate(deadline);
  if (open !== "on") return "closed";
  if (!date) return "no_date";
  return todayIn(OIL_ORDERS_TZ, now) <= date ? "open" : "expired";
}

export function formatDeadline(deadline: string): string {
  const date = cleanDate(deadline);
  if (!date) return "";
  return new Intl.DateTimeFormat("es-ES", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${date}T12:00:00Z`));
}
