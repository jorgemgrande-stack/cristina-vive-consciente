/**
 * MasajeDetalle — Cristina Vive Consciente
 * Ficha de un masaje: galería, bloque de reserva (precio, duración, lugar), experiencia, cómo reservar y dudas frecuentes.
 * Design: "Luz Botánica"
 *
 * Solo se muestran datos confirmados (los del propio servicio en la base de datos y las constantes de
 * shared/booking.ts). No hay textos de relleno con beneficios, plazos o consejos que no consten.
 */

import { SITE_IMAGES } from "@/lib/siteImages";
import {
  CANCELLATION_POLICY,
  CENTER_MAPS_URL,
  OPENING_HOURS_TEXT,
  PAYMENT_NOTE,
  formatEuros,
  getHomePrice,
  massagePlaceAnswer,
  massagePlaceLabel,
} from "@shared/booking";
import { defaultGallery } from "@shared/serviceGallery";
import { useState } from "react";
import { useRoute, Link } from "wouter";
import {
  ArrowLeft, ArrowRight, Clock, MapPin, Star, Wallet,
  CheckCircle, AlertCircle, Leaf, Loader2, ChevronDown, ChevronUp, CalendarCheck
} from "lucide-react";
import Layout from "@/components/Layout";
import BookingModal from "@/components/BookingModal";
import ServiceGallery from "@/components/ServiceGallery";
import { trpc } from "@/lib/trpc";

const FALLBACK_IMG = SITE_IMAGES.heroMasajes;

function parseList(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string" && x.trim()) : [];
  } catch {
    return [];
  }
}

const eyebrow = "text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase font-body";

export default function MasajeDetalle() {
  const [, params] = useRoute("/masajes/:slug");
  const slug = params?.slug ?? "";
  const [bookingOpen, setBookingOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  const { data: masaje, isLoading, error } = trpc.services.getBySlug.useQuery(
    { slug },
    { enabled: !!slug }
  );
  const { data: galleryData } = trpc.services.gallery.useQuery({ slug }, { enabled: !!slug, retry: false });

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-[oklch(0.52_0.08_148)]" />
        </div>
      </Layout>
    );
  }

  if (error || !masaje) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <Leaf size={32} className="text-[oklch(0.52_0.08_148)]/40" />
          <p className="text-[oklch(0.55_0.04_75)] font-body text-sm">Masaje no encontrado.</p>
          <Link href="/masajes" className="text-[oklch(0.52_0.08_148)] font-body text-sm underline">
            Volver a masajes
          </Link>
        </div>
      </Layout>
    );
  }

  // Galería: la del servidor; mientras llega, la de por defecto calculada con los datos del servicio
  const baseImages = galleryData && galleryData.length > 0 ? galleryData : defaultGallery(masaje as any);
  const images = baseImages.length > 0 ? baseImages : [{ id: null, url: FALLBACK_IMG, alt: masaje.name, isCover: true }];

  const benefits = parseList((masaje as any).benefits);
  const includes = parseList((masaje as any).includes);
  const longDesc: string | null = (masaje as any).longDescription ?? null;
  const contraindications: string | null = (masaje as any).contraindications ?? null;
  const homePrice = getHomePrice(masaje);
  const priceText = masaje.price ? formatEuros(masaje.price) : null;
  const homeText = homePrice !== null ? formatEuros(homePrice) : null;

  // Preguntas frecuentes: solo con datos confirmados del servicio y de las condiciones del centro
  const faqs: Array<{ q: string; a: string }> = [
    {
      q: "¿Cuánto cuesta y cuánto dura?",
      a:
        [
          masaje.durationLabel ? `La sesión dura ${masaje.durationLabel}.` : null,
          priceText ? `Cuesta ${priceText} en consulta${homeText ? ` y ${homeText} a domicilio` : ""}.` : "Consulta la tarifa con Cristina.",
        ]
          .filter(Boolean)
          .join(" "),
    },
    { q: "¿Dónde se realiza el masaje?", a: massagePlaceAnswer(masaje) },
    ...(includes.length > 0 ? [{ q: "¿Qué incluye la sesión?", a: `${includes.join(". ")}.` }] : []),
    {
      q: "¿Cómo reservo y cuándo se confirma?",
      a: "Envías una solicitud con la fecha y la hora que prefieres. Cristina la revisa y te escribe por email (y por teléfono si lo has indicado) en las próximas 24–48 horas para confirmar la hora o proponerte otra. Hasta entonces la cita no está confirmada.",
    },
    { q: "¿Cuándo atiende Cristina?", a: `${OPENING_HOURS_TEXT}.` },
    { q: "¿Cuándo y cómo se paga?", a: PAYMENT_NOTE },
    { q: "¿Puedo cancelar o cambiar mi cita?", a: CANCELLATION_POLICY },
  ];

  const steps = [
    { t: "Elige fecha y hora", d: "Indica cuándo te viene bien y tus datos de contacto. Es solo una solicitud." },
    { t: "Cristina te confirma", d: "Te responde en las próximas 24–48 horas para confirmar la hora o proponerte otra." },
    { t: "Pagas en la cita", d: PAYMENT_NOTE },
  ];

  return (
    <>
      <BookingModal
        isOpen={bookingOpen}
        onClose={() => setBookingOpen(false)}
        preselectedService={masaje.slug}
      />
      <Layout>

        {/* ── Cabecera: título, galería y bloque de reserva ── */}
        <section className="bg-[oklch(0.985_0.006_85)] pt-6 pb-10 sm:pt-8 sm:pb-14 border-b border-[oklch(0.92_0.01_75)]">
          <div className="container">
            <Link
              href="/masajes"
              className="inline-flex items-center gap-2 text-[oklch(0.52_0.08_148)] text-xs font-body no-underline hover:gap-3 transition-all mb-5"
            >
              <ArrowLeft size={12} />
              Masajes
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-x-12 gap-y-5 lg:gap-y-0 items-start">
              {/* Título: arriba en móvil; en escritorio, encima del bloque de reserva */}
              <div className="order-1 lg:col-start-2 lg:row-start-1">
                {masaje.featured === 1 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[oklch(0.52_0.08_148)] text-white text-[10px] font-body tracking-wider uppercase mb-3 w-fit" style={{ fontWeight: 500 }}>
                    <Star size={9} fill="currentColor" />
                    Más popular
                  </span>
                )}
                <h1 className="font-display text-[oklch(0.18_0.018_55)] lg:mb-5" style={{ fontWeight: 400, fontSize: "clamp(1.75rem, 3.2vw, 2.5rem)", lineHeight: 1.15 }}>
                  {masaje.name}
                </h1>
              </div>

              {/* Galería */}
              <div className="order-2 lg:col-start-1 lg:row-start-1 lg:row-span-2">
                <ServiceGallery images={images} title={masaje.name} />
              </div>

              {/* Bloque de reserva */}
              <aside className="order-3 lg:col-start-2 lg:row-start-2 lg:sticky lg:top-24" aria-label="Precio y reserva">
                {masaje.shortDescription && (
                  <p className="text-[oklch(0.38_0.02_55)] font-body text-[0.95rem] leading-relaxed mb-5" style={{ fontWeight: 300 }}>
                    {masaje.shortDescription}
                  </p>
                )}

                <div className="border border-[oklch(0.88_0.015_75)] bg-white p-5 sm:p-6">
                  {priceText && (
                    <div className="mb-5">
                      <div className="flex items-baseline gap-2">
                        <span className="font-display text-[oklch(0.42_0.08_148)]" style={{ fontWeight: 500, fontSize: "2.6rem", lineHeight: 1 }}>
                          {priceText}
                        </span>
                        <span className="text-[oklch(0.52_0.02_60)] font-body text-sm">por sesión en consulta</span>
                      </div>
                      {homeText && (
                        <p className="mt-1.5 text-[oklch(0.38_0.02_55)] font-body text-sm" style={{ fontWeight: 300 }}>
                          A domicilio: <strong style={{ fontWeight: 600 }}>{homeText}</strong>
                        </p>
                      )}
                    </div>
                  )}

                  <ul className="space-y-3 mb-5 text-sm font-body text-[oklch(0.30_0.02_55)]">
                    {masaje.durationLabel && (
                      <li className="flex items-start gap-3">
                        <Clock size={16} className="text-[oklch(0.52_0.08_148)] mt-0.5 flex-shrink-0" />
                        <span><span style={{ fontWeight: 500 }}>Duración:</span> {masaje.durationLabel}</span>
                      </li>
                    )}
                    <li className="flex items-start gap-3">
                      <MapPin size={16} className="text-[oklch(0.52_0.08_148)] mt-0.5 flex-shrink-0" />
                      <span>
                        <span style={{ fontWeight: 500 }}>Lugar:</span> {massagePlaceLabel(masaje)} ·{" "}
                        <a href={CENTER_MAPS_URL} target="_blank" rel="noopener noreferrer" className="underline text-[oklch(0.40_0.07_148)]">Cómo llegar</a>
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Wallet size={16} className="text-[oklch(0.52_0.08_148)] mt-0.5 flex-shrink-0" />
                      <span><span style={{ fontWeight: 500 }}>Pago:</span> en la cita; no se cobra nada al reservar</span>
                    </li>
                  </ul>

                  <button
                    onClick={() => setBookingOpen(true)}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-4 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-medium hover:bg-[oklch(0.38_0.07_148)] transition-all duration-300 font-body"
                    style={{ borderRadius: 0, letterSpacing: "0.1em" }}
                  >
                    Reservar ahora
                    <ArrowRight size={13} />
                  </button>
                  <p className="mt-3 text-center text-[11px] text-[oklch(0.52_0.02_60)] font-body leading-relaxed" style={{ fontWeight: 300 }}>
                    Es una solicitud: queda pendiente hasta que Cristina la confirme (24–48 h).
                  </p>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* ── Contenido ── */}
        <section className="py-12 bg-white pb-28 lg:pb-12">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

              <div className="lg:col-span-2 space-y-12">

                {/* Sobre esta sesión */}
                {longDesc && (
                  <div>
                    <p className={`${eyebrow} mb-3`} style={{ fontWeight: 500 }}>Sobre esta sesión</p>
                    <div
                      className="text-[oklch(0.38_0.02_55)] font-body leading-relaxed space-y-4"
                      style={{ fontWeight: 300, fontSize: "0.95rem" }}
                      dangerouslySetInnerHTML={{ __html: longDesc.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>") }}
                    />
                  </div>
                )}

                {/* La experiencia: lo que incluye, paso a paso */}
                {includes.length > 0 && (
                  <div>
                    <p className={`${eyebrow} mb-4`} style={{ fontWeight: 500 }}>La experiencia</p>
                    <ol className="space-y-3">
                      {includes.map((item, i) => (
                        <li key={i} className="flex items-start gap-4 p-4 bg-[oklch(0.97_0.006_80)] border border-[oklch(0.92_0.01_75)]">
                          <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center bg-[oklch(0.52_0.08_148)] text-white text-xs font-body" style={{ fontWeight: 500 }}>
                            {i + 1}
                          </span>
                          <span className="text-[oklch(0.30_0.02_55)] text-sm font-body leading-relaxed pt-0.5" style={{ fontWeight: 300 }}>
                            {item}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Beneficios (solo los de la ficha del servicio) */}
                {benefits.length > 0 && (
                  <div>
                    <p className={`${eyebrow} mb-4`} style={{ fontWeight: 500 }}>Qué ofrece</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {benefits.map((benefit, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-[oklch(0.97_0.006_80)] border border-[oklch(0.92_0.01_75)]">
                          <CheckCircle size={15} className="text-[oklch(0.52_0.08_148)] mt-0.5 flex-shrink-0" />
                          <span className="text-[oklch(0.38_0.02_55)] text-sm font-body" style={{ fontWeight: 300 }}>
                            {benefit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Consideraciones */}
                {contraindications && (
                  <div>
                    <p className={`${eyebrow} mb-3`} style={{ fontWeight: 500 }}>Consideraciones importantes</p>
                    <div className="flex items-start gap-3 p-4 bg-[oklch(0.97_0.006_80)] border border-[oklch(0.92_0.01_75)]">
                      <AlertCircle size={15} className="text-[oklch(0.55_0.06_60)] mt-0.5 flex-shrink-0" />
                      <p className="text-[oklch(0.38_0.02_55)] text-sm font-body leading-relaxed" style={{ fontWeight: 300 }}>
                        {contraindications}
                      </p>
                    </div>
                  </div>
                )}

                {/* Cómo reservar */}
                <div>
                  <p className={`${eyebrow} mb-4`} style={{ fontWeight: 500 }}>Cómo reservar</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {steps.map((s, i) => (
                      <div key={i} className="p-4 border border-[oklch(0.88_0.015_75)] bg-white">
                        <span className="font-display text-[oklch(0.52_0.08_148)]" style={{ fontSize: "1.6rem", lineHeight: 1 }}>{i + 1}</span>
                        <p className="mt-2 mb-1 text-sm font-body text-[oklch(0.22_0.02_55)]" style={{ fontWeight: 500 }}>{s.t}</p>
                        <p className="text-xs font-body text-[oklch(0.42_0.02_55)] leading-relaxed" style={{ fontWeight: 300 }}>{s.d}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preguntas frecuentes */}
                <div>
                  <p className={`${eyebrow} mb-4`} style={{ fontWeight: 500 }}>Preguntas frecuentes</p>
                  <div className="space-y-2">
                    {faqs.map((faq, i) => (
                      <div key={i} className="border border-[oklch(0.88_0.015_75)]">
                        <button
                          onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                          aria-expanded={faqOpen === i}
                          className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
                        >
                          <span className="font-body text-[oklch(0.22_0.02_55)] text-sm" style={{ fontWeight: 400 }}>
                            {faq.q}
                          </span>
                          {faqOpen === i
                            ? <ChevronUp size={14} className="text-[oklch(0.52_0.08_148)] flex-shrink-0" />
                            : <ChevronDown size={14} className="text-[oklch(0.55_0.04_75)] flex-shrink-0" />
                          }
                        </button>
                        {faqOpen === i && (
                          <div className="px-4 pb-4 border-t border-[oklch(0.92_0.01_75)]">
                            <p className="text-[oklch(0.42_0.02_55)] text-sm font-body leading-relaxed pt-3" style={{ fontWeight: 300 }}>
                              {faq.a}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Columna lateral: dónde y cuándo */}
              <div className="lg:col-span-1">
                <div className="lg:sticky lg:top-24 space-y-4">
                  <div className="border border-[oklch(0.88_0.015_75)] p-5 bg-[oklch(0.97_0.006_80)]">
                    <div className="flex items-start gap-3">
                      <MapPin size={15} className="text-[oklch(0.52_0.08_148)] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[oklch(0.22_0.02_55)] text-sm font-body mb-1" style={{ fontWeight: 500 }}>Dónde y cuándo</p>
                        <p className="text-[oklch(0.42_0.02_55)] text-xs font-body leading-relaxed" style={{ fontWeight: 300 }}>
                          Navas de Riofrío (Segovia){homeText ? " · también a domicilio" : ""}
                          <br />
                          {OPENING_HOURS_TEXT}.
                        </p>
                        <a href={CENTER_MAPS_URL} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-xs underline text-[oklch(0.40_0.07_148)] font-body">
                          Ver en Google Maps
                        </a>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setBookingOpen(true)}
                    className="hidden lg:inline-flex w-full items-center justify-center gap-2 px-5 py-3.5 border border-[oklch(0.52_0.08_148)] text-[oklch(0.40_0.07_148)] text-xs tracking-widest uppercase font-medium hover:bg-[oklch(0.52_0.08_148)]/5 transition-colors font-body"
                    style={{ borderRadius: 0, letterSpacing: "0.1em" }}
                  >
                    <CalendarCheck size={14} />
                    Solicitar cita
                  </button>
                  <Link
                    href="/masajes"
                    className="inline-flex items-center gap-2 text-[oklch(0.52_0.08_148)] text-xs font-body no-underline hover:gap-3 transition-all"
                  >
                    <ArrowLeft size={12} />
                    Ver todos los masajes
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Barra de reserva fija (solo móvil) ── */}
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-[oklch(0.88_0.015_75)] pl-4 pr-[5.25rem] py-3 flex items-center justify-between gap-4" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
          <div className="min-w-0">
            {priceText && <p className="font-display text-[oklch(0.42_0.08_148)] leading-none" style={{ fontWeight: 500, fontSize: "1.5rem" }}>{priceText}</p>}
            {masaje.durationLabel && <p className="mt-1 text-[11px] font-body text-[oklch(0.52_0.02_60)]">{masaje.durationLabel}</p>}
          </div>
          <button
            onClick={() => setBookingOpen(true)}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3.5 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-medium font-body"
            style={{ borderRadius: 0, letterSpacing: "0.1em" }}
          >
            Reservar
            <ArrowRight size={13} />
          </button>
        </div>

      </Layout>
    </>
  );
}
