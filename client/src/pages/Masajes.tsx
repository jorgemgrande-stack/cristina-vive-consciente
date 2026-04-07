/**
 * Masajes — Cristina Vive Consciente
 * Design: "Luz Botánica"
 * Layout compacto: hero + masajes visibles sin scroll excesivo
 */

import { useState } from "react";
import { ArrowRight, MapPin, Clock, Euro, Star, Loader2, ChevronDown, ChevronUp, Leaf } from "lucide-react";
import Layout from "@/components/Layout";
import BookingModal from "@/components/BookingModal";
import { trpc } from "@/lib/trpc";

const HERO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/hero-masajes-PUiFsGVb8gAs6i4s8VF7U8.webp";

const MODALITY_LABEL: Record<string, string> = {
  online: "Online",
  presencial: "Presencial",
  ambos: "Presencial / Online",
};

const ACEITES = [
  { nombre: "Balance", accion: "Enraizamiento" },
  { nombre: "Lavanda", accion: "Calmante" },
  { nombre: "Tea Tree", accion: "Purificante" },
  { nombre: "AromaTouch", accion: "Relajante muscular" },
  { nombre: "Deep Blue", accion: "Alivio del dolor" },
  { nombre: "Wild Orange", accion: "Energizante" },
  { nombre: "Peppermint", accion: "Estimulante" },
  { nombre: "Onguard", accion: "Inmunológico" },
];

export default function Masajes() {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string>("masaje");
  const [tecnicaOpen, setTecnicaOpen] = useState(false);

  const { data: masajes = [], isLoading } = trpc.services.list.useQuery({ type: "masaje" });

  function handleReservar(slug: string) {
    setSelectedService(slug);
    setBookingOpen(true);
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
        <section className="relative min-h-[52vh] flex items-end overflow-hidden">
          {/* Imagen de fondo */}
          <div className="absolute inset-0">
            <img
              src={HERO}
              alt="Masajes terapéuticos"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[oklch(0.12_0.018_55)]/85 via-[oklch(0.12_0.018_55)]/60 to-transparent" />
          </div>

          {/* Contenido superpuesto */}
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

        {/* ── Sección técnica colapsable ── */}
        {tecnicaOpen && (
          <section className="bg-[oklch(0.96_0.008_80)] border-b border-[oklch(0.88_0.015_75)]">
            <div className="container py-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                {/* Descripción de la técnica */}
                <div className="space-y-6">
                  <div>
                    <p className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-2 font-body" style={{ fontWeight: 500 }}>
                      Primera parte
                    </p>
                    <h3 className="font-display text-[oklch(0.18_0.018_55)] mb-2" style={{ fontWeight: 400, fontSize: "1.1rem" }}>
                      Equilibrio energético
                    </h3>
                    <p className="text-[oklch(0.42_0.02_55)] text-sm leading-relaxed font-body" style={{ fontWeight: 300 }}>
                      Recuperamos el equilibrio del campo electromagnético, reconectando cuerpo, mente y espíritu. La sanación energética restaura el flujo de energía primordial.
                    </p>
                  </div>
                  <div>
                    <p className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-2 font-body" style={{ fontWeight: 500 }}>
                      Segunda parte
                    </p>
                    <h3 className="font-display text-[oklch(0.18_0.018_55)] mb-2" style={{ fontWeight: 400, fontSize: "1.1rem" }}>
                      Técnica Aromatouch
                    </h3>
                    <p className="text-[oklch(0.42_0.02_55)] text-sm leading-relaxed font-body" style={{ fontWeight: 300 }}>
                      Aplicada a través de los meridianos. Contrarresta el estrés, apoya el sistema inmunológico, para la inflamación, el dolor y el desequilibrio de los sistemas del organismo.
                    </p>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-[oklch(0.52_0.08_148)]/8 border-l-2 border-[oklch(0.52_0.08_148)]">
                    <MapPin size={13} className="text-[oklch(0.52_0.08_148)] mt-0.5 flex-shrink-0" />
                    <p className="text-[oklch(0.42_0.07_148)] text-xs font-body" style={{ fontWeight: 300 }}>
                      Presencial en <strong>Navas de Río Frío (Segovia)</strong> o a domicilio. Para domicilio consultar tarifas.
                    </p>
                  </div>
                </div>

                {/* Los 8 aceites */}
                <div>
                  <p className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-3 font-body" style={{ fontWeight: 500 }}>
                    Los 8 aceites esenciales
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {ACEITES.map((aceite, i) => (
                      <div key={aceite.nombre} className="flex items-center gap-2.5 p-2.5 bg-white border border-[oklch(0.88_0.015_75)]">
                        <span className="w-5 h-5 flex items-center justify-center bg-[oklch(0.52_0.08_148)]/10 text-[oklch(0.52_0.08_148)] text-[10px] font-body flex-shrink-0" style={{ fontWeight: 600 }}>
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[oklch(0.18_0.018_55)] text-xs font-body truncate" style={{ fontWeight: 500 }}>{aceite.nombre}</p>
                          <p className="text-[oklch(0.52_0.02_60)] text-[10px] font-body truncate" style={{ fontWeight: 300 }}>{aceite.accion}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[oklch(0.52_0.02_60)] text-xs font-body italic mt-3" style={{ fontWeight: 300 }}>
                    Todos los aceites son de grado terapéutico certificado.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Listado de masajes ── */}
        <section className="section-padding bg-white">
          <div className="container">

            {/* Cabecera de sección compacta */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
              <div>
                <p className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-2 font-body" style={{ fontWeight: 500 }}>
                  Nuestros servicios
                </p>
                <h2 className="font-display text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 400, fontSize: "1.5rem" }}>
                  Elige tu sesión
                </h2>
              </div>
              <div className="section-divider sm:hidden" />
              <button
                onClick={() => handleReservar("masaje")}
                className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 border border-[oklch(0.52_0.08_148)] text-[oklch(0.52_0.08_148)] text-xs tracking-widest uppercase font-body hover:bg-[oklch(0.52_0.08_148)] hover:text-white transition-all duration-300"
                style={{ borderRadius: 0, letterSpacing: "0.1em" }}
              >
                Reservar
                <ArrowRight size={12} />
              </button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-16 text-stone-400">
                <Loader2 size={22} className="animate-spin mr-3" />
                <span className="font-body text-sm">Cargando servicios...</span>
              </div>
            ) : masajes.length === 0 ? (
              <div className="text-center py-16">
                <Leaf size={28} className="text-[oklch(0.52_0.08_148)]/40 mx-auto mb-4" />
                <p className="text-[oklch(0.52_0.02_60)] font-body text-sm" style={{ fontWeight: 300 }}>
                  Próximamente disponibles. Contacta para más información.
                </p>
              </div>
            ) : (
              /* Grid adaptativo: 1 masaje → centrado, 2 → 2 col, 3+ → 3 col */
              <div className={`grid gap-6 ${
                masajes.length === 1
                  ? "grid-cols-1 max-w-lg mx-auto"
                  : masajes.length === 2
                  ? "grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto"
                  : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              }`}>
                {masajes.map((masaje) => (
                  <article
                    key={masaje.id}
                    className={`relative flex flex-col border bg-white transition-all duration-300 hover:shadow-md group ${
                      masaje.featured ? "border-[oklch(0.52_0.08_148)]" : "border-[oklch(0.88_0.015_75)]"
                    }`}
                  >
                    {/* Badge destacado */}
                    {masaje.featured === 1 && (
                      <div className="absolute -top-3 left-5 z-10">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-[oklch(0.52_0.08_148)] text-white text-[10px] font-body tracking-wider uppercase" style={{ fontWeight: 500 }}>
                          <Star size={9} fill="currentColor" />
                          Más popular
                        </span>
                      </div>
                    )}

                    {/* Imagen con aspect-ratio fijo */}
                    {masaje.imageUrl ? (
                      <div className="aspect-[4/3] overflow-hidden flex-shrink-0">
                        <img
                          src={masaje.imageUrl}
                          alt={masaje.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[4/3] bg-[oklch(0.94_0.012_80)] flex items-center justify-center flex-shrink-0">
                        <Leaf size={32} className="text-[oklch(0.52_0.08_148)]/30" />
                      </div>
                    )}

                    <div className="flex flex-col flex-1 p-5 space-y-3">
                      {/* Nombre */}
                      <h3 className="font-display text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 400, fontSize: "1.05rem" }}>
                        {masaje.name}
                      </h3>

                      {/* Meta chips: duración, modalidad, precio */}
                      <div className="flex flex-wrap gap-2">
                        {masaje.durationLabel && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-[oklch(0.42_0.02_55)] bg-[oklch(0.94_0.012_80)] px-2 py-1 font-body">
                            <Clock size={10} className="text-[oklch(0.52_0.08_148)]" />
                            {masaje.durationLabel}
                          </span>
                        )}
                        {masaje.modality && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-[oklch(0.42_0.02_55)] bg-[oklch(0.94_0.012_80)] px-2 py-1 font-body">
                            <MapPin size={10} className="text-[oklch(0.52_0.08_148)]" />
                            {MODALITY_LABEL[masaje.modality] ?? masaje.modality}
                          </span>
                        )}
                        {masaje.price && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-body text-[oklch(0.52_0.08_148)] bg-[oklch(0.52_0.08_148)]/8 px-2 py-1" style={{ fontWeight: 600 }}>
                            <Euro size={10} />
                            {masaje.price} €
                          </span>
                        )}
                      </div>

                      {/* Descripción corta */}
                      {masaje.shortDescription && (
                        <p className="text-[oklch(0.42_0.02_55)] text-sm leading-relaxed font-body flex-1" style={{ fontWeight: 300 }}>
                          {masaje.shortDescription}
                        </p>
                      )}

                      {/* CTA */}
                      <button
                        onClick={() => handleReservar(masaje.slug)}
                        className="mt-auto w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-medium hover:bg-[oklch(0.38_0.07_148)] transition-all duration-300 font-body"
                        style={{ borderRadius: 0, letterSpacing: "0.1em" }}
                      >
                        Reservar sesión
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── CTA final compacto ── */}
        <section className="py-14 bg-[oklch(0.18_0.018_55)]">
          <div className="container">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="font-display text-white mb-1" style={{ fontWeight: 400, fontSize: "1.3rem" }}>
                  ¿Tienes alguna duda?
                </h2>
                <p className="text-white/60 font-body text-sm" style={{ fontWeight: 300 }}>
                  Escríbeme y te ayudo a elegir la sesión que mejor se adapta a ti.
                </p>
              </div>
              <button
                onClick={() => handleReservar("masaje")}
                className="flex-shrink-0 inline-flex items-center gap-2 px-8 py-3.5 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-medium hover:bg-[oklch(0.38_0.07_148)] transition-all duration-300 font-body"
                style={{ borderRadius: 0, letterSpacing: "0.1em" }}
              >
                Reservar masaje
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </section>

      </Layout>
    </>
  );
}
