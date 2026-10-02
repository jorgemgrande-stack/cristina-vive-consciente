/**
 * HealthDisclaimer — aviso legal estándar: los servicios y la información de la web son de bienestar y no sustituyen
 * la atención sanitaria. El texto único vive en shared/healthClaims.ts (HEALTH_DISCLAIMER).
 *
 * - variant "box": recuadro discreto para fichas de servicio y producto.
 * - variant "inline": párrafo pequeño para el pie de página.
 */
import { Info } from "lucide-react";
import { HEALTH_DISCLAIMER } from "@shared/healthClaims";

export default function HealthDisclaimer({ variant = "box", className = "" }: { variant?: "box" | "inline"; className?: string }) {
  if (variant === "inline") {
    return (
      <p className={`text-[oklch(0.52_0.02_60)] text-[11px] leading-relaxed font-body ${className}`} style={{ fontWeight: 300 }}>
        {HEALTH_DISCLAIMER}
      </p>
    );
  }
  return (
    <aside
      aria-label="Aviso importante"
      className={`flex items-start gap-3 p-4 bg-[oklch(0.97_0.006_80)] border border-[oklch(0.92_0.01_75)] ${className}`}
    >
      <Info size={15} className="text-[oklch(0.55_0.06_60)] mt-0.5 flex-shrink-0" />
      <p className="text-[oklch(0.42_0.02_55)] text-xs font-body leading-relaxed" style={{ fontWeight: 300 }}>
        {HEALTH_DISCLAIMER}
      </p>
    </aside>
  );
}
