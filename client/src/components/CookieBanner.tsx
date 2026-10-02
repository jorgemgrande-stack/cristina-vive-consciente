/**
 * CookieBanner — consentimiento de cookies (RGPD / LSSI).
 * - Aparece hasta que el usuario decide; "Rechazar" y "Aceptar" tienen el mismo peso visual.
 * - Categorías: necesarias (siempre activas), analítica y publicidad (apagadas por defecto).
 * - Se puede reabrir desde el pie de página ("Gestionar cookies").
 * - Guarda la decisión con setConsent(); la carga real de etiquetas de Google está en lib/googleTag.ts
 *   y solo ocurre si hay IDs configurados Y consentimiento.
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Cookie } from "lucide-react";
import { getConsent, setConsent, OPEN_COOKIE_SETTINGS_EVENT } from "@/lib/consent";

export default function CookieBanner() {
  const [open, setOpen] = useState(false);
  const [configuring, setConfiguring] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [ads, setAds] = useState(false);

  useEffect(() => {
    const current = getConsent();
    if (current === null) setOpen(true);
    const reopen = () => {
      const c = getConsent();
      setAnalytics(c?.analytics ?? false);
      setAds(c?.ads ?? false);
      setConfiguring(true);
      setOpen(true);
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen);
  }, []);

  const decide = (a: boolean, p: boolean) => {
    setConsent({ analytics: a, ads: p });
    setOpen(false);
    setConfiguring(false);
  };

  if (!open) return null;

  const btn = "flex-1 sm:flex-none px-5 py-2.5 text-xs tracking-widest uppercase font-body border transition-colors";

  return (
    <div
      role="dialog"
      aria-label="Preferencias de cookies"
      className="fixed bottom-0 left-0 right-0 z-[60] bg-[oklch(0.985_0.006_85)] border-t border-[oklch(0.88_0.015_75)] shadow-[0_-4px_24px_rgba(0,0,0,0.08)]"
    >
      <div className="container py-4 md:py-5">
        <div className="flex items-start gap-3">
          <Cookie size={18} className="mt-0.5 flex-shrink-0 text-[oklch(0.52_0.08_148)]" />
          <div className="flex-1">
            <p className="text-sm text-[oklch(0.30_0.02_55)] font-body leading-relaxed" style={{ fontWeight: 300 }}>
              Usamos cookies técnicas, necesarias para que la web funcione. Con tu permiso también usamos cookies de
              analítica y de publicidad (Google) para medir y mejorar. Puedes aceptarlas, rechazarlas o elegir.{" "}
              <Link href="/politica-de-cookies" className="underline text-[oklch(0.40_0.07_148)]">Política de cookies</Link>
            </p>

            {configuring && (
              <div className="mt-3 space-y-2 text-sm font-body text-[oklch(0.30_0.02_55)]" style={{ fontWeight: 300 }}>
                <label className="flex items-start gap-2 opacity-70">
                  <input type="checkbox" checked disabled className="mt-1" />
                  <span><strong style={{ fontWeight: 500 }}>Necesarias</strong> — sesión y funcionamiento de la web. Siempre activas.</span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} className="mt-1" />
                  <span><strong style={{ fontWeight: 500 }}>Analítica</strong> — cómo se usa la web, de forma agregada.</span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={ads} onChange={(e) => setAds(e.target.checked)} className="mt-1" />
                  <span><strong style={{ fontWeight: 500 }}>Publicidad</strong> — medir si un anuncio de Google lleva a una solicitud de reserva.</span>
                </label>
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => decide(false, false)}
                className={`${btn} border-[oklch(0.52_0.08_148)] text-[oklch(0.40_0.07_148)] hover:bg-[oklch(0.52_0.08_148)]/10`}
              >
                Rechazar
              </button>
              {configuring ? (
                <button
                  onClick={() => decide(analytics, ads)}
                  className={`${btn} border-[oklch(0.52_0.08_148)] text-[oklch(0.40_0.07_148)] hover:bg-[oklch(0.52_0.08_148)]/10`}
                >
                  Guardar selección
                </button>
              ) : (
                <button
                  onClick={() => setConfiguring(true)}
                  className={`${btn} border-[oklch(0.88_0.015_75)] text-[oklch(0.40_0.02_55)] hover:border-[oklch(0.52_0.08_148)]`}
                >
                  Configurar
                </button>
              )}
              <button
                onClick={() => decide(true, true)}
                className={`${btn} border-[oklch(0.52_0.08_148)] bg-[oklch(0.52_0.08_148)] text-white hover:bg-[oklch(0.38_0.07_148)]`}
              >
                Aceptar todo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
