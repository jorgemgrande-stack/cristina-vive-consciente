/**
 * Promoción de descarga gratuita de un ebook (/promocion/:slug) — Cristina Vive Consciente
 * Design: "Luz Botánica". Móvil: titular, portada, plazo y botón. El estado (activa / programada / terminada) lo decide
 * el servidor; al cierre la descarga se bloquea aunque la página siga abierta o se conserve el enlace directo.
 * La descarga exige completar el formulario: el servidor guarda a la persona en el CRM y entrega un token para la ruta protegida.
 */
import { useEffect, useRef, useState } from "react";
import { Link, useRoute } from "wouter";
import { ArrowDown, Copy, Gift, MessageCircle, Share2 } from "lucide-react";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import NotFound from "@/pages/NotFound";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { promoSource, registerPromo, trackPromo, usePublicPromo, type RegisterErrors } from "@/lib/promoApi";
import { PROMO_BIZUM_COPY, PROMO_BIZUM_DISPLAY, countdownParts, formatMadridDeadline, promoPath, promoShareMessage, whatsappShareUrl } from "@shared/promo";

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

/** Copia al portapapeles: API moderna y, si el navegador no la ofrece o la rechaza, el método clásico. Devuelve si se copió. */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* se prueba el método clásico */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
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
        onClick={async () => ((await copyText(value)) ? toast.success(`${label} copiado`) : toast.error("No se pudo copiar"))}
        className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 border border-[oklch(0.52_0.08_148)] text-[oklch(0.52_0.08_148)] text-xs font-body hover:bg-[oklch(0.52_0.08_148)] hover:text-white transition-colors"
        style={{ borderRadius: 0, fontWeight: 500 }}
        aria-label={`Copiar ${label.toLowerCase()}`}
      >
        <Copy size={13} /> Copiar
      </button>
    </div>
  );
}

const SHARE_BTN = "inline-flex items-center gap-2 px-4 py-2.5 border border-[oklch(0.38_0.07_148)] bg-white text-[oklch(0.3_0.07_148)] text-sm font-body no-underline hover:bg-[oklch(0.38_0.07_148)] hover:text-white transition-colors";

export default function Promocion() {
  const [, params] = useRoute("/promocion/:slug");
  const slug = params?.slug ?? "";
  const { promo, state, now, isLoading } = usePublicPromo(slug);
  const [open, setOpen] = useState(false);
  const [bizum, setBizum] = useState(false);
  const [started, setStarted] = useState(false);
  const [checking, setChecking] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [token, setToken] = useState<string | null>(null);
  const viewed = useRef(false);

  useEffect(() => {
    if (promo && !viewed.current) {
      viewed.current = true;
      promoSource(promo.slug); // guarda la procedencia al abrir la ficha, antes de cualquier otro paso
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
  const source = promoSource(promo.slug);
  const url = `${window.location.origin}${promoPath(promo.slug)}`;
  /** Enlace compartido: solo identificador de campaña y canal (nada del cliente ni del destinatario) */
  const withSource = (channel: string) => `${url}?utm_campaign=${promo.slug}&utm_source=${channel}`;
  const downloadUrl = (t: string) => `/api/promos/${encodeURIComponent(promo.slug)}/descarga?t=${t}&s=${encodeURIComponent(source)}`;
  const deadline = formatMadridDeadline(promo.endsAt);
  const active = state === "active";
  const title = ebook?.title ?? "Cuento ilustrado";

  /** Envía el formulario: el servidor valida y guarda en el CRM; solo entonces se habilita la descarga protegida. */
  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setChecking(true);
    setErrors({});
    const r = await registerPromo(promo.slug, form); // si falla, lo escrito se conserva para reintentar
    setChecking(false);
    if ("token" in r) {
      setToken(r.token);
      setOpen(false);
      setStarted(true);
      window.location.href = downloadUrl(r.token);
      return;
    }
    setErrors(r.errors);
    if (r.errors.form) toast.error(r.errors.form);
  };

  const shareText = (channel: string) => promoShareMessage(title, promo.endsAt, withSource(channel));
  /** Acción observada: se anota cuando el navegador confirma la copia o abre el destino, no antes. */
  const copyLink = async () => {
    if (await copyText(withSource("amigo_enlace"))) {
      trackPromo(promo.slug, "share", { channel: "amigo_enlace" }); // solo si la copia se confirma
      toast.success("Enlace copiado");
    } else {
      toast.error("No se pudo copiar el enlace");
    }
  };
  /** Menú de compartir del móvil: solo se anota si la plataforma devuelve «compartido» (confirmada). */
  const nativeShare = async () => {
    if (!navigator.share) return toast.error("Tu navegador no tiene menú de compartir: usa Facebook, X o WhatsApp.");
    try {
      await navigator.share({ title, text: shareText("red_nativo"), url: withSource("red_nativo") });
      trackPromo(promo.slug, "share", { channel: "red_nativo", confirmed: true });
    } catch {
      /* cancelado: no se registra */
    }
  };
  const openNetwork = (channel: "red_facebook" | "red_x") => {
    const link = withSource(channel);
    const dest =
      channel === "red_facebook"
        ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`
        : `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText(channel).replace(link, "").trim())}&url=${encodeURIComponent(link)}`;
    // Con «noopener» el navegador devuelve siempre null: se abre sin él y se corta el vínculo con esta página a mano
    const w = window.open(dest, "_blank");
    if (w) {
      try { w.opener = null; } catch { /* sin acceso */ }
      trackPromo(promo.slug, "share", { channel }); // observado: la ventana se abrió (no equivale a publicación confirmada)
    } else {
      toast.error("Tu navegador ha bloqueado la ventana. Permite las ventanas emergentes para compartir.");
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
                  <p className="text-xs text-[oklch(0.45_0.02_60)] font-body" data-testid="promo-hint">PDF ilustrado · Descarga gratuita con formulario{promo.donationEnabled ? " · Donativo por Bizum opcional" : ""}</p>
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

              {ebook && (ebook.synopsis || ebook.author || ebook.edition) && (
                <div className="pt-5 border-t border-[oklch(0.9_0.012_78)] max-w-md space-y-3" data-testid="promo-ficha">
                  {ebook.synopsis && <p className="font-display italic text-[oklch(0.28_0.025_55)] leading-relaxed whitespace-pre-line" style={{ fontWeight: 400, fontSize: "1.1rem" }}>{ebook.synopsis}</p>}
                  <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm font-body">
                    {ebook.author && (<><dt className="text-[oklch(0.45_0.02_60)] uppercase tracking-widest text-[0.65rem] pt-0.5" style={{ fontWeight: 500 }}>Autor</dt><dd className="text-[oklch(0.28_0.025_55)]">{ebook.author}</dd></>)}
                    {ebook.edition && (<><dt className="text-[oklch(0.45_0.02_60)] uppercase tracking-widest text-[0.65rem] pt-0.5" style={{ fontWeight: 500 }}>Edición</dt><dd className="text-[oklch(0.28_0.025_55)]">{ebook.edition}</dd></>)}
                  </dl>
                </div>
              )}
            </div>
          </div>

          {/* Compartir desde la ficha pública (campaña activa): cada canal lleva su propio enlace identificable */}
          {active && (
            <section className="mt-10 border border-[oklch(0.85_0.03_148)] bg-[oklch(0.95_0.02_148)] p-5 sm:p-7" data-testid="promo-share">
              <h2 className="font-display text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 400, fontSize: "1.7rem" }}>¿A quién le regalarías este cuento?</h2>
              <p className="text-sm text-[oklch(0.38_0.02_55)] font-body mt-1 mb-5">Comparte la invitación para que pueda descargarlo durante el lanzamiento.</p>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xs tracking-widest uppercase text-[oklch(0.38_0.07_148)] font-body mb-2.5" style={{ fontWeight: 600 }}>Compartir en redes</h3>
                  <div className="flex flex-wrap gap-2.5">
                    <button type="button" onClick={() => openNetwork("red_facebook")} className={SHARE_BTN} style={{ borderRadius: 0, fontWeight: 600 }} data-testid="promo-facebook">Facebook</button>
                    <button type="button" onClick={() => openNetwork("red_x")} className={SHARE_BTN} style={{ borderRadius: 0, fontWeight: 600 }} data-testid="promo-x">X</button>
                    <button type="button" onClick={nativeShare} className={SHARE_BTN} style={{ borderRadius: 0, fontWeight: 600 }} data-testid="promo-native-share"><Share2 size={15} /> Compartir en redes</button>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs tracking-widest uppercase text-[oklch(0.38_0.07_148)] font-body mb-2.5" style={{ fontWeight: 600 }}>Enviar a un amigo</h3>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <a
                      href={whatsappShareUrl(shareText("amigo_whatsapp"))}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackPromo(promo.slug, "share", { channel: "amigo_whatsapp" })}
                      className={SHARE_BTN}
                      style={{ fontWeight: 600 }}
                      data-testid="promo-whatsapp"
                    >
                      <MessageCircle size={15} /> Enviar por WhatsApp
                    </a>
                    <button type="button" onClick={copyLink} className={SHARE_BTN} style={{ borderRadius: 0, fontWeight: 600 }} data-testid="promo-copy-link"><Copy size={15} /> Copiar enlace</button>
                  </div>
                </div>
              </div>
              {started && token && (
                <p className="text-xs text-[oklch(0.45_0.02_60)] font-body mt-5">
                  ¿No se ha descargado el PDF? <a href={downloadUrl(token)} className="underline underline-offset-2 text-[oklch(0.3_0.07_148)]" data-testid="promo-redownload">Descargar de nuevo</a>
                </p>
              )}
            </section>
          )}

          <div className="mt-8 pt-5 border-t border-[oklch(0.9_0.012_78)] flex flex-wrap items-center justify-between gap-3 text-xs text-[oklch(0.45_0.02_60)] font-body">
            <span>Edición digital en PDF</span>
            {ebook && <Link href={ebook.fichaPath} className="text-[oklch(0.38_0.02_55)] hover:text-[oklch(0.52_0.08_148)]">Ver ficha del ebook · {ebook.price.replace("€", " €")}</Link>}
          </div>
        </div>
      </div>

      {/* Formulario de descarga */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto" data-testid="promo-dialog">
          <DialogHeader>
            <DialogTitle className="font-display" style={{ fontWeight: 400, fontSize: "1.5rem" }}>Descarga tu cuento de regalo</DialogTitle>
            <DialogDescription className="font-body">Completa tus datos para descargar el cuento en PDF</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitForm} noValidate className="space-y-3" data-testid="promo-form">
            {([["name", "Nombre y apellidos", "text", "name"], ["email", "Correo electrónico", "email", "email"], ["phone", "Teléfono", "tel", "tel"]] as const).map(([k, label, type, ac]) => (
              <div key={k}>
                <label htmlFor={`promo-${k}`} className="block text-xs text-[oklch(0.38_0.02_55)] font-body mb-1" style={{ fontWeight: 500 }}>{label} <span aria-hidden>*</span></label>
                <input
                  id={`promo-${k}`}
                  name={k}
                  type={type}
                  autoComplete={ac}
                  required
                  aria-invalid={!!errors[k]}
                  value={form[k]}
                  onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                  className="w-full border border-[oklch(0.85_0.015_75)] bg-white px-3 py-2.5 text-base font-body focus:outline-none focus:border-[oklch(0.52_0.08_148)]"
                  style={{ borderRadius: 0 }}
                />
                {errors[k] && <p className="text-xs text-red-600 font-body mt-1" role="alert">{errors[k]}</p>}
              </div>
            ))}
            {errors.form && <p className="text-sm text-red-600 font-body" role="alert" data-testid="promo-form-error">{errors.form}</p>}
            <p className="text-[0.7rem] text-[oklch(0.45_0.02_60)] font-body leading-snug">
              Guardaremos tus datos en el registro de clientes de Cristina para gestionar tu descarga. Más información en la{" "}
              <a href="/privacidad" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">política de privacidad</a>.
            </p>
            <button
              type="submit"
              disabled={checking}
              className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 bg-[oklch(0.38_0.07_148)] text-white text-sm font-body hover:bg-[oklch(0.3_0.07_148)] disabled:opacity-60 transition-colors"
              style={{ borderRadius: 0, fontWeight: 600 }}
              data-testid="promo-download"
            >
              <ArrowDown size={16} /> {checking ? "Guardando…" : "Descargar el PDF gratis"}
            </button>
          </form>
          {promo.donationEnabled && (
            <div className="space-y-2 pt-1">
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
              <p className="text-[0.7rem] text-[oklch(0.45_0.02_60)] font-body leading-snug" data-testid="promo-donate-note">
                Si te apetece apoyarme, tu donativo me ayuda a seguir creando y publicando. ¡Gracias por tu ayuda!
                <br />
                Cualquier persona que complete el formulario puede descargar el cuento sin donar.
              </p>
              {bizum && (
                <div className="space-y-2.5 pt-1" data-testid="promo-bizum">
                  <p className="text-sm text-[oklch(0.38_0.02_55)] font-body">Abre tu app del banco, elige Bizum y envía el importe que quieras a este móvil:</p>
                  <CopyRow label="Número" value={PROMO_BIZUM_COPY} shown={PROMO_BIZUM_DISPLAY} />
                  <CopyRow label="Concepto" value={promo.donationConcept} shown={promo.donationConcept} />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
