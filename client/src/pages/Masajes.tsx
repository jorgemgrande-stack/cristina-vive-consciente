/**
 * Masajes — Cristina Vive Consciente
 * Design: "Luz Botánica"
 * Grid 3 columnas con tarjetas verticales ricas en contenido + botón Ver detalle
 */

import { SITE_IMAGES } from "@/lib/siteImages";
import AdminEditLink from "@/components/site/AdminEditLink";
import { formatEuros, getHomePrice, massagePlaceLabel } from "@shared/booking";
import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight, MapPin, Clock, Euro, Star, Loader2, ChevronDown, ChevronUp, Leaf, CheckCircle, Eye } from "lucide-react";
import Layout from "@/components/Layout";
import { LegacyHero } from "@/components/site/embed";
import BookingModal from "@/components/BookingModal";
import { trpc } from "@/lib/trpc";
import { useLabels } from "@/lib/siteGlobal";
import { useSiteAction } from "@/lib/siteActions";

const HERO = SITE_IMAGES.heroMasajes;

const ACEITES = [
  { nombre: "Balance", accion: "masajes.tech.oil.balance" },
  { nombre: "Lavanda", accion: "masajes.tech.oil.lavanda" },
  { nombre: "Tea Tree", accion: "masajes.tech.oil.teatree" },
  { nombre: "AromaTouch", accion: "masajes.tech.oil.aromatouch" },
  { nombre: "Deep Blue", accion: "masajes.tech.oil.deepblue" },
  { nombre: "Wild Orange", accion: "masajes.tech.oil.wildorange" },
  { nombre: "Peppermint", accion: "masajes.tech.oil.peppermint" },
  { nombre: "Onguard", accion: "masajes.tech.oil.onguard" },
];

// Claves de los beneficios por defecto cuando no hay datos en BD
const DEFAULT_BENEFIT_KEYS = ["masajes.benefit.1", "masajes.benefit.2", "masajes.benefit.3", "masajes.benefit.4"];

export default function Masajes() {
  const L = useLabels();
  const DEFAULT_BENEFITS = DEFAULT_BENEFIT_KEYS.map((k) => L(k));
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string>("masaje");
  const [tecnicaOpen, setTecnicaOpen] = useState(false);

  const { data: masajes = [], isLoading } = trpc.services.list.useQuery({ type: "masaje" });

  function handleReservar(slug: string) {
    setSelectedService(slug);
    setBookingOpen(true);
  }

  useSiteAction("booking-masaje", () => handleReservar("masaje"));
  useSiteAction("toggle-technique", () => setTecnicaOpen((o) => !o));

  // Parsear beneficios del JSON almacenado en BD
  function parseBenefits(raw: string | null | undefined): string[] {
    if (!raw) return DEFAULT_BENEFITS;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      return DEFAULT_BENEFITS;
    } catch {
      return DEFAULT_BENEFITS;
    }
  }

  // Parsear "qué incluye" del JSON almacenado en BD
  function parseIncludes(raw: string | null | undefined): string[] {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      return [];
    } catch {
      return [];
    }
  }

  return (
    <>
      <BookingModal
        isOpen={bookingOpen}
        onClose={() => setBookingOpen(false)}
        preselectedService={selectedService}
      />
      <Layout>

        {/* ── HERO compacto con intro integrada ── */}
        <LegacyHero>
        <section className="relative min-h-[52vh] flex items-end overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={HERO}
              alt="Masajes terapéuticos"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[oklch(0.12_0.018_55)]/85 via-[oklch(0.12_0.018_55)]/60 to-transparent" />
          </div>

          <div className="relative z-10 container pb-12 pt-32">
            <div className="max-w-xl">
              <p className="text-[oklch(0.72_0.08_148)] text-xs tracking-[0.25em] uppercase mb-4 font-body" style={{ fontWeight: 500 }}>
                Terapia corporal
              </p>
              <h1 className="font-display text-white mb-4" style={{ fontWeight: 300, fontSize: "clamp(1.8rem, 4vw, 2.8rem)", lineHeight: 1.15 }}>
                Masajes Terapéuticos
              </h1>
              <p className="text-white/75 font-body mb-6 leading-relaxed" style={{ fontWeight: 300, fontSize: "0.95rem" }}>
                Técnica combinada de equilibrio energético y masaje Aromatouch con 8 aceites esenciales de grado terapéutico.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleReservar("masaje")}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-medium hover:bg-[oklch(0.38_0.07_148)] transition-all duration-300 font-body"
                  style={{ borderRadius: 0, letterSpacing: "0.1em" }}
                >
                  Reservar sesión
                  <ArrowRight size={13} />
                </button>
                <button
                  onClick={() => setTecnicaOpen(!tecnicaOpen)}
                  className="inline-flex items-center gap-2 px-6 py-3 border border-white/40 text-white/80 text-xs tracking-widest uppercase font-body hover:border-white/70 hover:text-white transition-all duration-300"
                  style={{ borderRadius: 0, letterSpacing: "0.1em" }}
                >
                  Cómo funciona
                  {tecnicaOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
              </div>
            </div>
          </div>
        </section>
        </LegacyHero>

        {/* ── Sección técnica colapsable ── */}
        {tecnicaOpen && (
          <section className="bg-[oklch(0.96_0.008_80)] border-b border-[oklch(0.88_0.015_75)]">
            <div className="container py-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                <div className="space-y-6">
                  <div>
                    <p className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-2 font-body" style={{ fontWeight: 500 }}>
                      {L("masajes.tech.part1.kicker")}
                    </p>
                    <h3 className="font-display text-[oklch(0.18_0.018_55)] mb-2" style={{ fontWeight: 400, fontSize: "1.1rem" }}>
                      {L("masajes.tech.part1.title")}
                    </h3>
                    <p className="text-[oklch(0.42_0.02_55)] text-sm leading-relaxed font-body" style={{ fontWeight: 300 }}>
                      {L("masajes.tech.part1.text")}
                    </p>
                  </div>
                  <div>
                    <p className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-2 font-body" style={{ fontWeight: 500 }}>
                      {L("masajes.tech.part2.kicker")}
                    </p>
                    <h3 className="font-display text-[oklch(0.18_0.018_55)] mb-2" style={{ fontWeight: 400, fontSize: "1.1rem" }}>
                      {L("masajes.tech.part2.title")}
                    </h3>
                    <p className="text-[oklch(0.42_0.02_55)] text-sm leading-relaxed font-body" style={{ fontWeight: 300 }}>
                      {L("masajes.tech.part2.text")}
                    </p>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-[oklch(0.52_0.08_148)]/8 border-l-2 border-[oklch(0.52_0.08_148)]">
                    <MapPin size={13} className="text-[oklch(0.52_0.08_148)] mt-0.5 flex-shrink-0" />
                    <p className="text-[oklch(0.42_0.07_148)] text-xs font-body" style={{ fontWeight: 300 }}>
                      {L("masajes.tech.place.pre")} <strong>{L("masajes.tech.place.name")}</strong> {L("masajes.tech.place.post")}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-3 font-body" style={{ fontWeight: 500 }}>
                    {L("masajes.tech.oils.title")}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {ACEITES.map((aceite, i) => (
                      <div key={aceite.nombre} className="flex items-center gap-2.5 p-2.5 bg-white border border-[oklch(0.88_0.015_75)]">
                        <span className="w-5 h-5 flex items-center justify-center bg-[oklch(0.52_0.08_148)]/10 text-[oklch(0.52_0.08_148)] text-[10px] font-body flex-shrink-0" style={{ fontWeight: 600 }}>
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[oklch(0.18_0.018_55)] text-xs font-body truncate" style={{ fontWeight: 500 }}>{aceite.nombre}</p>
                          <p className="text-[oklch(0.52_0.02_60)] text-[10px] font-body truncate" style={{ fontWeight: 300 }}>{L(aceite.accion)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[oklch(0.52_0.02_60)] text-xs font-body italic mt-3" style={{ fontWeight: 300 }}>
                    {L("masajes.tech.oils.note")}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Listado de masajes ── */}
        <section className="section-padding bg-white">
          <div className="container">

            {/* Cabecera de sección */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
              <div>
                <p className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-2 font-body" style={{ fontWeight: 500 }}>
                  {L("masajes.list.kicker")}
                </p>
                <h2 className="font-display text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 400, fontSize: "1.5rem" }}>
                  {L("masajes.list.title")}
                </h2>
              </div>
              <button
                onClick={() => handleReservar("masaje")}
                className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 border border-[oklch(0.52_0.08_148)] text-[oklch(0.52_0.08_148)] text-xs tracking-widest uppercase font-body hover:bg-[oklch(0.52_0.08_148)] hover:text-white transition-all duration-300"
                style={{ borderRadius: 0, letterSpacing: "0.1em" }}
              >
                {L("masajes.list.reserve")}
                <ArrowRight size={12} />
              </button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-16 text-stone-400">
                <Loader2 size={22} className="animate-spin mr-3" />
                <span className="font-body text-sm">{L("masajes.list.loading")}</span>
              </div>
            ) : masajes.length === 0 ? (
              <div className="text-center py-16">
                <Leaf size={28} className="text-[oklch(0.52_0.08_148)]/40 mx-auto mb-4" />
                <p className="text-[oklch(0.52_0.02_60)] font-body text-sm" style={{ fontWeight: 300 }}>
                  {L("masajes.list.empty")}
                </p>
              </div>
            ) : (
              /*
               * Grid 3 columnas:
               * - 1 masaje → centrado max-w-sm
               * - 2 masajes → 2 columnas que se expanden (max-w-3xl centrado)
               * - 3+ masajes → 3 columnas completas
               */
              <div className={`grid gap-6 ${
                masajes.length === 1
                  ? "grid-cols-1"
                  : masajes.length === 2
                  ? "grid-cols-1 sm:grid-cols-2"
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              }`}>
                {masajes.map((masaje) => {
                  const benefits = parseBenefits((masaje as any).benefits);
                  const includes = parseIncludes((masaje as any).includes);
                  return (
                    <article
                      key={masaje.id}
                      className={`relative flex flex-col border bg-white transition-all duration-300 hover:shadow-lg group overflow-hidden ${
                        masaje.featured ? "border-[oklch(0.52_0.08_148)]" : "border-[oklch(0.88_0.015_75)]"
                      }`}
                    >
                      <AdminEditLink href={`/crm/servicios/${masaje.id}/editar`} label="Editar servicio" />
                      {/* Badge destacado */}
                      {masaje.featured === 1 && (
                        <div className="absolute top-3 left-3 z-10">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[oklch(0.52_0.08_148)] text-white text-[10px] font-body tracking-wider uppercase" style={{ fontWeight: 500 }}>
                            <Star size={9} fill="currentColor" />
                            {L("masajes.card.featured")}
                          </span>
                        </div>
                      )}

                      {/* Imagen con aspect-ratio 4/3 */}
                      {masaje.imageUrl ? (
                        <Link
                          href={`/masajes/${masaje.slug}`}
                          aria-label={`Ver ${masaje.name}`}
                          className="block aspect-[4/3] overflow-hidden flex-shrink-0 cursor-pointer"
                        >
                          <img
                            src={masaje.imageUrl}
                            alt={masaje.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </Link>
                      ) : (
                        <Link
                          href={`/masajes/${masaje.slug}`}
                          aria-label={`Ver ${masaje.name}`}
                          className="aspect-[4/3] bg-[oklch(0.94_0.012_80)] flex items-center justify-center flex-shrink-0"
                        >
                          <Leaf size={40} className="text-[oklch(0.52_0.08_148)]/30" />
                        </Link>
                      )}

                      {/* Contenido */}
                      <div className="flex flex-col flex-1 p-5">

                        {/* Meta chips */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {masaje.durationLabel && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-[oklch(0.42_0.02_55)] bg-[oklch(0.94_0.012_80)] px-2 py-1 font-body">
                              <Clock size={9} className="text-[oklch(0.52_0.08_148)]" />
                              {masaje.durationLabel}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 text-[10px] text-[oklch(0.42_0.02_55)] bg-[oklch(0.94_0.012_80)] px-2 py-1 font-body">
                            <MapPin size={9} className="text-[oklch(0.52_0.08_148)]" />
                            {massagePlaceLabel(masaje)}
                          </span>
                        </div>

                        {/* Nombre (enlaza a la ficha) */}
                        <h3 className="font-display text-[oklch(0.18_0.018_55)] mb-2" style={{ fontWeight: 400, fontSize: "1.25rem" }}>
                          <Link
                            href={`/masajes/${masaje.slug}`}
                            className="no-underline text-inherit hover:text-[oklch(0.42_0.08_148)] transition-colors"
                          >
                            {masaje.name}
                          </Link>
                        </h3>

                        {/* Precio destacado */}
                        {masaje.price && (
                          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-3">
                            <span className="font-display text-[oklch(0.42_0.08_148)]" style={{ fontWeight: 500, fontSize: "2.1rem", lineHeight: 1 }}>
                              {formatEuros(masaje.price)}
                            </span>
                            <span className="text-xs font-body text-[oklch(0.52_0.02_60)]" style={{ fontWeight: 400 }}>
                              {L("masajes.card.inConsultation")}
                              {getHomePrice(masaje) !== null && (
                                <>
                                  {" · "}
                                  <strong className="text-[oklch(0.32_0.04_148)]" style={{ fontWeight: 600 }}>{formatEuros(getHomePrice(masaje))}</strong>
                                  {" "}{L("masajes.card.atHome")}
                                </>
                              )}
                            </span>
                          </div>
                        )}

                        {/* Descripción corta */}
                        {masaje.shortDescription && (
                          <p className="text-[oklch(0.42_0.02_55)] text-sm leading-relaxed font-body mb-4" style={{ fontWeight: 300 }}>
                            {masaje.shortDescription}
                          </p>
                        )}

                        {/* Beneficios (hasta 4) */}
                        <div className="mb-4 space-y-1.5">
                          {benefits.slice(0, 4).map((benefit, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <CheckCircle size={13} className="text-[oklch(0.52_0.08_148)] mt-0.5 flex-shrink-0" />
                              <span className="text-[oklch(0.42_0.02_55)] text-xs font-body leading-relaxed" style={{ fontWeight: 300 }}>
                                {benefit}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Qué incluye (si hay datos) */}
                        {includes.length > 0 && (
                          <div className="mb-4 p-3 bg-[oklch(0.96_0.008_80)] border-l-2 border-[oklch(0.52_0.08_148)]">
                            <p className="text-[oklch(0.52_0.08_148)] text-[10px] tracking-widest uppercase font-body mb-1.5" style={{ fontWeight: 500 }}>
                              {L("masajes.card.includes")}
                            </p>
                            <ul className="space-y-1">
                              {includes.slice(0, 3).map((item, i) => (
                                <li key={i} className="text-[oklch(0.42_0.02_55)] text-xs font-body" style={{ fontWeight: 300 }}>
                                  · {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Spacer */}
                        <div className="flex-1" />

                        {/* CTAs */}
                        <div className="flex gap-2 mt-4">
                          <Link
                            href={`/masajes/${masaje.slug}`}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 border border-[oklch(0.52_0.08_148)] text-[oklch(0.52_0.08_148)] text-[10px] tracking-widest uppercase font-body hover:bg-[oklch(0.52_0.08_148)]/5 transition-all duration-200 no-underline"
                            style={{ borderRadius: 0, letterSpacing: "0.08em" }}
                          >
                            <Eye size={11} />
                            {L("masajes.card.detail")}
                          </Link>
                          <button
                            onClick={() => handleReservar(masaje.slug)}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[oklch(0.52_0.08_148)] text-white text-[10px] tracking-widest uppercase font-medium hover:bg-[oklch(0.38_0.07_148)] transition-all duration-300 font-body"
                            style={{ borderRadius: 0, letterSpacing: "0.08em" }}
                          >
                            {L("masajes.card.reserve")}
                            <ArrowRight size={11} />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ── CTA final ── */}
        <section className="py-14 bg-[oklch(0.18_0.018_55)]">
          <div className="container">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="font-display text-white mb-1" style={{ fontWeight: 400, fontSize: "1.3rem" }}>
                  {L("masajes.cta.title")}
                </h2>
                <p className="text-white/60 font-body text-sm" style={{ fontWeight: 300 }}>
                  {L("masajes.cta.text")}
                </p>
              </div>
              <button
                onClick={() => handleReservar("masaje")}
                className="flex-shrink-0 inline-flex items-center gap-2 px-8 py-3.5 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-medium hover:bg-[oklch(0.38_0.07_148)] transition-all duration-300 font-body"
                style={{ borderRadius: 0, letterSpacing: "0.1em" }}
              >
                {L("masajes.cta.button")}
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </section>

      </Layout>
    </>
  );
}
