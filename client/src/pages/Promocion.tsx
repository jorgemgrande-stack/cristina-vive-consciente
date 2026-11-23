/**
 * Promoción de descarga gratuita de un ebook (/promocion/:slug) — Cristina Vive Consciente
 * Design: "Luz Botánica". Móvil: titular, portada, plazo y botón. El estado (activa / programada / terminada) lo decide
 * el servidor; al cierre la descarga se bloquea aunque la página siga abierta o se conserve el enlace directo.
 */
import { useEffect, useRef, useState } from "react";
import { Link, useRoute } from "wouter";
import { ArrowDown, Check, Copy, Gift, MessageCircle, Share2 } from "lucide-react";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import NotFound from "@/pages/NotFound";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { promoSource, trackPromo, usePublicPromo } from "@/lib/promoApi";
import { PROMO_BIZUM_COPY, PROMO_BIZUM_DISPLAY, countdownParts, formatMadridDeadline, promoPath, promoShareMessage, whatsappShareUrl } from "@shared/promo";

const GREEN = "oklch(0.52_0.08_148)";

function Countdown({ remaining }: { remaining: number }) {
  const c = countdownParts(remaining);
  const cells: [number, string][] = [[c.days, "Días"], [c.hours, "Horas"], [c.minutes, "Minutos"], [c.seconds, "Segundos"]];
  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-md" role="timer" aria-label="Tiempo que queda para descargar gratis" data-testid="promo-countdown">
      {cells.map(([n, label]) => (
        <div key={label} className="bg-[oklch(0.96_0.012_80)] border border-[oklch(0.9_0.012_78)] text-center py-3 sm:py-4">
          <p className="font-display text-[oklch(0.18_0.018_55)] tabular-nums" style={{ fontWeight: 400, fontSize: "clamp(1.5rem, 6vw, 2rem)", lineHeight: 1 }}>{String(n).padStart(2, "0")}</p>
          <p className="text-[0.55rem] sm:text-[0.62rem] tracking-widest uppercase text-[oklch(0.45_0.02_60)] font-body mt-1.5" style={{ fontWeight: 500 }}>{label}</p>
        </div>
      ))}
    </div>
  );
}

function CopyRow({ label, value, shown }: { label: string; value: string; shown: string }) {
  return (
    <div className="flex items-center justify-between gap-3 bg-[oklch(0.96_0.012_80)] border border-[oklch(0.9_0.012_78)] px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-[0.62rem] tracking-widest uppercase text-[oklch(0.45_0.02_60)] font-body" style={{ fontWeight: 500 }}>{label}</p>
        <p className="font-body text-[oklch(0.18_0.018_55)] text-base break-words" style={{ fontWeight: 500 }}>{shown}</p>
      </div>
      <button
        type="button"
        onClick={() => navigator.clipboard?.writeText(value).then(() => toast.success(`${label} copiado`), () => toast.error("No se pudo copiar"))}
        className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 border border-[oklch(0.52_0.08_148)] text-[oklch(0.52_0.08_148)] text-xs font-body hover:bg-[oklch(0.52_0.08_148)] hover:text-white transition-colors"
        style={{ borderRadius: 0, fontWeight: 500 }}
        aria-label={`Copiar ${label.toLowerCase()}`}
      >
        <Copy size={13} /> Copiar
      </button>
    </div>
  );
}

export default function Promocion() {
  const [, params] = useRoute("/promocion/:slug");
  const slug = params?.slug ?? "";
  const { promo, state, now, isLoading } = usePublicPromo(slug);
  const [open, setOpen] = useState(false);
  const [bizum, setBizum] = useState(false);
  const [started, setStarted] = useState(false);
  const [checking, setChecking] = useState(false);
  const viewed = useRef(false);

  useEffect(() => {
    if (promo && !viewed.current) {
      viewed.current = true;
      trackPromo(promo.slug, "view");
    }
  }, [promo]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-40">
          <div className="w-8 h-8 border-2 border-[oklch(0.52_0.08_148)] border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }
  if (!promo || !state || state === "draft") return <NotFound />;

  const ebook = promo.ebook;
  const [line1, ...rest] = promo.headline.split("\n");
  const line2 = rest.join(" ");
  const source = promoSource();
  const url = `${window.location.origin}${promoPath(promo.slug)}`;
  const withSource = (s: string) => `${url}?utm_source=${s}`;
  const deadline = formatMadridDeadline(promo.endsAt);
  const active = state === "active";

  /** Comprueba con el servidor que sigue activa y entonces inicia la descarga (sin registro ni correo). */
  const startDownload = async () => {
    setChecking(true);
    try {
      const res = await fetch(`/api/promos/${encodeURIComponent(promo.slug)}`, { cache: "no-store" });
      const fresh = res.ok ? await res.json() : null;
      if (!fresh || fresh.state !== "active") {
        setOpen(false);
        toast.error("La descarga gratuita ha terminado.");
        return;
      }
      window.location.href = `/api/promos/${encodeURIComponent(promo.slug)}/descarga?s=${encodeURIComponent(source)}`;
      setOpen(false);
      setStarted(true);
    } catch {
      toast.error("No se pudo iniciar la descarga. Inténtalo de nuevo.");
    } finally {
      setChecking(false);
    }
  };

  const shareText = (s: string) => promoShareMessage(ebook?.title ?? "Cuento ilustrado", promo.endsAt, withSource(s));
  const copy = (text: string, ok: string) => navigator.clipboard?.writeText(text).then(() => toast.success(ok), () => toast.error("No se pudo copiar"));
  const doShare = async () => {
    trackPromo(promo.slug, "share", { channel: "native" });
    const data = { title: ebook?.title ?? "Cuento ilustrado", text: shareText("compartido"), url: withSource("compartido") };
    if (navigator.share) {
      try { await navigator.share(data); } catch { /* cancelado */ }
    } else {
      copy(`${data.text}`, "Mensaje copiado");
    }
  };

  return (
    <Layout>
      <div className="bg-[oklch(0.985_0.006_85)]">
        <div className="container pt-24 md:pt-32 pb-10 md:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-x-14 gap-y-4 lg:gap-y-6 items-start">
            {/* Titular */}
            <div className="lg:col-start-1 lg:row-start-1">
              <p className="flex items-center gap-3 text-[oklch(0.38_0.07_148)] text-[0.68rem] tracking-[0.28em] uppercase font-body mb-4" style={{ fontWeight: 600 }}>
                <span className="inline-block w-7 h-px bg-[oklch(0.62_0.08_60)]" /> Un cuento de regalo
              </p>
              <h1 className="font-display text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 400, fontSize: "clamp(2.3rem, 8.5vw, 4.2rem)", lineHeight: 1.04 }}>
                {line1}
                {line2 && <><br /><em className="text-[oklch(0.42_0.07_148)]" style={{ fontWeight: 400 }}>{line2}</em></>}
              </h1>
            </div>

            {/* Portada */}
            <figure className="lg:col-start-2 lg:row-start-1 lg:row-span-2 m-0">
              <div className="border border-[oklch(0.9_0.012_78)] bg-gradient-to-b from-[oklch(0.96_0.02_80)] to-[oklch(0.9_0.03_65)] p-3 sm:p-8 flex items-center justify-center">
                {ebook?.cover ? (
                  <img src={ebook.cover} alt={`Portada de ${ebook.title}`} className="max-h-[185px] sm:max-h-[520px] w-auto shadow-[0_18px_40px_-14px_rgba(60,40,20,0.45)]" />
                ) : (
                  <div className="h-60 flex items-center justify-center text-sm text-[oklch(0.45_0.02_60)] font-body">Cuento ilustrado</div>
                )}
              </div>
              <figcaption className="hidden sm:block mt-3 text-center font-display italic text-[oklch(0.38_0.02_55)]" style={{ fontWeight: 400 }}>Un cuento de Cristina Battistelli Lopez de Ayala</figcaption>
            </figure>

            {/* Mensaje, plazo y botón */}
            <div className="lg:col-start-1 lg:row-start-2 space-y-4 sm:space-y-5">
              {ebook && <h2 className="hidden lg:block font-display text-[oklch(0.28_0.025_55)]" style={{ fontWeight: 400, fontSize: "1.6rem" }}>{ebook.title}</h2>}
              <p className="text-[oklch(0.38_0.02_55)] leading-relaxed font-body max-w-md whitespace-pre-line" style={{ fontWeight: 300, fontSize: "1.05rem" }}>{promo.message}</p>

              {active && (
                <>
                  <Countdown remaining={promo.endsAt - now} />
                  <p className="text-sm text-[oklch(0.38_0.02_55)] font-body" data-testid="promo-deadline">Gratis hasta el {deadline} · Hora peninsular</p>
                  <button
                    type="button"
                    onClick={() => { setBizum(false); setOpen(true); }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-[oklch(0.38_0.07_148)] text-white text-sm font-body hover:bg-[oklch(0.3_0.07_148)] transition-colors"
                    style={{ borderRadius: 0, fontWeight: 600 }}
                    data-testid="promo-cta"
                  >
                    Descargar el cuento gratis <ArrowDown size={16} />
                  </button>
                  <p className="text-xs text-[oklch(0.45_0.02_60)] font-body">PDF ilustrado · Sin registro{promo.donationEnabled ? " · Donativo por Bizum opcional" : ""}</p>
                </>
              )}

              {state === "scheduled" && promo.startsAt && (
                <div className="border border-[oklch(0.9_0.012_78)] bg-white p-5 max-w-md" data-testid="promo-scheduled">
                  <p className="font-display text-[oklch(0.18_0.018_55)] text-xl mb-1">Empieza el {formatMadridDeadline(promo.startsAt)}</p>
                  <p className="text-sm text-[oklch(0.38_0.02_55)] font-body">La descarga gratuita estará disponible hasta el {deadline} (hora peninsular).</p>
                </div>
              )}

              {state === "ended" && (
                <div className="border border-[oklch(0.9_0.012_78)] bg-white p-5 max-w-md space-y-4" data-testid="promo-ended">
                  <p className="font-display text-[oklch(0.18_0.018_55)]" style={{ fontSize: "1.5rem" }}>La descarga gratuita ha terminado</p>
                  <p className="text-sm text-[oklch(0.38_0.02_55)] font-body">Gracias por tu interés. El ebook sigue disponible.</p>
                  {ebook && (
                    <Link href={ebook.fichaPath} className="inline-flex w-full sm:w-auto items-center justify-center px-8 py-4 bg-[oklch(0.38_0.07_148)] text-white text-sm font-body no-underline hover:bg-[oklch(0.3_0.07_148)] transition-colors" style={{ fontWeight: 600 }} data-testid="promo-buy">
                      Comprar el ebook por {ebook.price.replace("€", " €")}
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tras iniciar la descarga: difusión */}
          {started && active && (
            <section className="mt-10 border border-[oklch(0.85_0.03_148)] bg-[oklch(0.95_0.02_148)] p-5 sm:p-7 flex flex-col md:flex-row md:items-center md:justify-between gap-5" data-testid="promo-share">
              <div>
                <h2 className="font-display text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 400, fontSize: "1.7rem" }}>¿A quién le regalarías este cuento?</h2>
                <p className="text-sm text-[oklch(0.38_0.02_55)] font-body mt-1">Envíale la invitación para que pueda descargarlo durante el lanzamiento.</p>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <a
                  href={whatsappShareUrl(shareText("whatsapp"))}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackPromo(promo.slug, "share", { channel: "whatsapp" })}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-[oklch(0.38_0.07_148)] bg-white text-[oklch(0.3_0.07_148)] text-sm font-body no-underline hover:bg-[oklch(0.38_0.07_148)] hover:text-white transition-colors"
                  style={{ fontWeight: 600 }}
                  data-testid="promo-whatsapp"
                >
                  <MessageCircle size={16} /> Regálaselo por WhatsApp
                </a>
                <button type="button" onClick={doShare} className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-[oklch(0.38_0.07_148)] text-[oklch(0.3_0.07_148)] text-sm font-body hover:bg-white transition-colors" style={{ borderRadius: 0, fontWeight: 600 }} data-testid="promo-native-share">
                  <Share2 size={16} /> Compartir
                </button>
                <button
                  type="button"
                  onClick={() => { trackPromo(promo.slug, "share", { channel: "copy" }); copy(withSource("compartido"), "Enlace copiado"); }}
                  className="inline-flex items-center justify-center gap-2 px-3 py-3 text-sm text-[oklch(0.3_0.07_148)] font-body underline underline-offset-4"
                  data-testid="promo-copy-link"
                >
                  Copiar enlace
                </button>
              </div>
            </section>
          )}

          <div className="mt-8 pt-5 border-t border-[oklch(0.9_0.012_78)] flex flex-wrap items-center justify-between gap-3 text-xs text-[oklch(0.45_0.02_60)] font-body">
            <span>Edición digital en PDF</span>
            {ebook && <Link href={ebook.fichaPath} className="text-[oklch(0.38_0.02_55)] hover:text-[oklch(0.52_0.08_148)]">Ver ficha del ebook · {ebook.price.replace("€", " €")}</Link>}
          </div>
        </div>
      </div>

      {/* Paso breve antes de descargar */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md" data-testid="promo-dialog">
          <DialogHeader>
            <DialogTitle className="font-display" style={{ fontWeight: 400, fontSize: "1.5rem" }}>Tu cuento está listo</DialogTitle>
            <DialogDescription className="font-body">La descarga es gratuita, sin registro y sin correo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <button
              type="button"
              onClick={startDownload}
              disabled={checking}
              className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 bg-[oklch(0.38_0.07_148)] text-white text-sm font-body hover:bg-[oklch(0.3_0.07_148)] disabled:opacity-60 transition-colors"
              style={{ borderRadius: 0, fontWeight: 600 }}
              data-testid="promo-download"
            >
              <ArrowDown size={16} /> Descargar el PDF gratis
            </button>
            {promo.donationEnabled && (
              <>
                <button
                  type="button"
                  onClick={() => setBizum((v) => !v)}
                  className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 border border-[oklch(0.38_0.07_148)] text-[oklch(0.3_0.07_148)] text-sm font-body hover:bg-[oklch(0.96_0.012_80)] transition-colors"
                  style={{ borderRadius: 0, fontWeight: 600 }}
                  aria-expanded={bizum}
                  data-testid="promo-donate"
                >
                  <Gift size={16} /> Hacer un donativo por Bizum
                </button>
                {bizum && (
                  <div className="space-y-2.5 pt-1" data-testid="promo-bizum">
                    <p className="text-sm text-[oklch(0.38_0.02_55)] font-body">
                      Es voluntario y no condiciona tu descarga. Abre tu app del banco, elige Bizum y envía el importe que quieras a este móvil:
                    </p>
                    <CopyRow label="Número" value={PROMO_BIZUM_COPY} shown={PROMO_BIZUM_DISPLAY} />
                    <CopyRow label="Concepto" value={promo.donationConcept} shown={promo.donationConcept} />
                    <p className="text-xs text-[oklch(0.45_0.02_60)] font-body flex items-start gap-1.5"><Check size={13} className="mt-0.5 flex-shrink-0" style={{ color: GREEN }} /> Gracias de corazón: tu aportación ayuda a seguir creando cuentos.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
