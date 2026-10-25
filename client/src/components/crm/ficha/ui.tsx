/**
 * Piezas visuales comunes de la ficha de cliente (estilo "Luz Botánica" del CRM, pensado primero para móvil).
 */
import type { ReactNode } from "react";

export const card = "bg-white border border-[oklch(0.92_0.01_80)] p-4 sm:p-5";
export const label = "block text-[0.65rem] text-[oklch(0.38_0.02_55)] font-body uppercase tracking-wider mb-1.5";
export const input =
  "w-full px-3 py-2.5 text-[15px] sm:text-sm bg-white border border-[oklch(0.88_0.015_75)] text-[oklch(0.18_0.018_55)] focus:outline-none focus:border-[oklch(0.52_0.08_148)] transition-colors font-body";
export const help = "text-[0.7rem] text-[oklch(0.52_0.02_60)] font-body leading-relaxed mt-1";
export const btnPrimary =
  "inline-flex items-center justify-center gap-1.5 min-h-[42px] px-4 py-2 bg-[oklch(0.52_0.08_148)] text-white text-xs font-body uppercase tracking-wider hover:bg-[oklch(0.38_0.07_148)] transition-colors disabled:opacity-60";
export const btnGhost =
  "inline-flex items-center justify-center gap-1.5 min-h-[42px] px-4 py-2 border border-[oklch(0.88_0.015_75)] text-[oklch(0.38_0.02_55)] text-xs font-body uppercase tracking-wider hover:border-[oklch(0.52_0.08_148)] transition-colors disabled:opacity-60";

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <p className="text-[0.65rem] text-[oklch(0.52_0.02_60)] font-body uppercase tracking-widest" style={{ fontWeight: 500 }}>
        {children}
      </p>
      {action}
    </div>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className={`${card} text-center py-10`}>
      <div className="mx-auto mb-2 w-fit text-[oklch(0.82_0.02_75)]">{icon}</div>
      <p className="text-sm text-[oklch(0.38_0.02_55)] font-body" style={{ fontWeight: 500 }}>{title}</p>
      {text && <p className="text-xs text-[oklch(0.52_0.02_60)] font-body mt-1 max-w-sm mx-auto" style={{ fontWeight: 300 }}>{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Field({ id, title, hint, children }: { id: string; title: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className={label} style={{ fontWeight: 500 }}>{title}</label>
      {children}
      {hint && <p className={help} style={{ fontWeight: 300 }}>{hint}</p>}
    </div>
  );
}

export const formatDay = (ts: number) => new Date(ts).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
/** Fecha de la sesión y, si se pactó, su hora (24 h): «26 de octubre de 2026 · 18:30». */
export const formatSessionWhen = (ts: number, time?: string | null) => (time ? `${formatDay(ts)} · ${time}` : formatDay(ts));
export const formatDayTime = (ts: number) =>
  new Date(ts).toLocaleString("es-ES", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** "YYYY-MM-DD" (fecha local) ⇄ ms a mediodía local, para que la fecha no cambie con la zona horaria. */
export const dateInputValue = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const dateInputToMs = (v: string) => new Date(`${v}T12:00:00`).getTime();

/** Descarga un JSON generado en el navegador (no pasa por ningún servicio externo). */
export function downloadJson(filename: string, data: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Confirmación antes de descartar cambios sin guardar. */
export const confirmDiscard = (dirty: boolean) => !dirty || window.confirm("Hay cambios sin guardar. ¿Descartarlos?");
