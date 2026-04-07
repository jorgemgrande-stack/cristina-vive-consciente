/**
 * Masajes — Cristina Vive Consciente
 * Design: "Luz Botánica"
 * Listado dinámico desde la BD, coherente con el resto de la web
 */

import { useState } from "react";
import { ArrowRight, MapPin, Clock, Euro, Star, Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import PageHero from "@/components/PageHero";
import BookingModal from "@/components/BookingModal";
import { trpc } from "@/lib/trpc";

const HERO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/hero-masajes-PUiFsGVb8gAs6i4s8VF7U8.webp";

const MODALITY_LABEL: Record<string, string> = {
  online: "Online",
  presencial: "Presencial",
  ambos: "Presencial / Online",
};

export default function Masajes() {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string>("masaje");

  // Masajes activos desde la BD, ordenados por sortOrder
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
        <PageHero
          title="Masajes Terapéuticos"
          subtitle="Técnica combinada de equilibrio energético + masaje con 8 aceites esenciales de grado terapéutico."
          tag="Terapia corporal"
          image={HERO}
          breadcrumb={[{ label: "Inicio", href: "/" }, { label: "Masajes" }]}
        />

        {/* Intro — Técnica */}
        <section className="section-padding bg-[oklch(0.985_0.006_85)]">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 items-start">

              {/* Texto principal */}
              <div className="lg:col-span-3 space-y-8">
                <div>
                  <p className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-4 font-body" style={{ fontWeight: 500 }}>
                    Primera parte
                  </p>
                  <h2 className="font-display text-[oklch(0.18_0.018_55)] mb-4" style={{ fontWeight: 400, fontSize: "1.4rem" }}>
                    Equilibrio energético
                  </h2>
                  <div className="section-divider mb-5" />
                  <p className="text-[oklch(0.38_0.02_55)] leading-relaxed font-body" style={{ fontWeight: 300 }}>
                    En la primera parte del masaje recuperamos el equilibrio del campo electromagnético, reconectando cuerpo, mente y espíritu. La sanación energética restaura el flujo de energía primordial.
                  </p>
                </div>

                <div>
                  <p className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-4 font-body" style={{ fontWeight: 500 }}>
                    Segunda parte
                  </p>
                  <h2 className="font-display text-[oklch(0.18_0.018_55)] mb-4" style={{ fontWeight: 400, fontSize: "1.4rem" }}>
                    Técnica Aromatouch
                  </h2>
                  <div className="section-divider mb-5" />
                  <p className="text-[oklch(0.38_0.02_55)] leading-relaxed font-body" style={{ fontWeight: 300 }}>
                    En la segunda parte del masaje usaremos la técnica aromatouch, aplicada a través de los meridianos. Contrarresta el estrés, apoya el sistema inmunológico, para la inflamación, el dolor y el desequilibrio de los sistemas del organismo.
                  </p>
                </div>

                {/* Duración y modalidad */}
                <div className="p-6 bg-[oklch(0.94_0.012_80)] border border-[oklch(0.88_0.015_75)]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <p className="text-[oklch(0.28_0.025_55)] text-xs tracking-widest uppercase mb-2 font-body" style={{ fontWeight: 500 }}>
                        Duración
                      </p>
                      <p className="text-[oklch(0.18_0.018_55)] font-body" style={{ fontWeight: 400 }}>
                        1 hora
                      </p>
                    </div>
                    <div>
                      <p className="text-[oklch(0.28_0.025_55)] text-xs tracking-widest uppercase mb-2 font-body" style={{ fontWeight: 500 }}>
                        Modalidad
                      </p>
                      <div className="flex items-start gap-2">
                        <MapPin size={14} className="text-[oklch(0.52_0.08_148)] mt-0.5 flex-shrink-0" />
                        <p className="text-[oklch(0.38_0.02_55)] text-sm font-body" style={{ fontWeight: 300 }}>
                          Presencial en nuestro centro ubicado en <strong>Navas de Río Frío (Segovia)</strong> o a domicilio.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-[oklch(0.88_0.015_75)]">
                    <p className="text-[oklch(0.52_0.02_60)] text-sm font-body italic" style={{ fontWeight: 300 }}>
                      Para domicilio consultar tarifas.
                    </p>
                  </div>
                </div>
              </div>

              {/* Sidebar: los 8 aceites */}
              <div className="lg:col-span-2">
                <div className="sticky top-24">
                  <p className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-4 font-body" style={{ fontWeight: 500 }}>
                    Los 8 aceites esenciales
                  </p>
                  <h3 className="font-display text-[oklch(0.18_0.018_55)] mb-4" style={{ fontWeight: 400, fontSize: "1.2rem" }}>
                    Grado terapéutico
                  </h3>
                  <div className="section-divider mb-6" />
                  <div className="space-y-3">
                    {[
                      { nombre: "Balance", accion: "Mezcla de enraizamiento" },
                      { nombre: "Lavanda", accion: "Calmante y equilibrante" },
                      { nombre: "Tea Tree", accion: "Purificante e inmune" },
                      { nombre: "AromaTouch", accion: "Mezcla relajante muscular" },
                      { nombre: "Deep Blue", accion: "Alivio del dolor" },
                      { nombre: "Wild Orange", accion: "Energizante y elevador" },
                      { nombre: "Peppermint", accion: "Refrescante y estimulante" },
                      { nombre: "Onguard", accion: "Protección inmunológica" },
                    ].map((aceite, i) => (
                      <div key={aceite.nombre} className="flex items-center gap-4 p-3 border border-[oklch(0.88_0.015_75)] bg-white">
                        <span className="w-7 h-7 flex items-center justify-center bg-[oklch(0.52_0.08_148)]/10 text-[oklch(0.52_0.08_148)] text-xs font-body flex-shrink-0" style={{ fontWeight: 500 }}>
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-[oklch(0.18_0.018_55)] text-sm font-body" style={{ fontWeight: 500 }}>{aceite.nombre}</p>
                          <p className="text-[oklch(0.52_0.02_60)] text-xs font-body" style={{ fontWeight: 300 }}>{aceite.accion}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 p-4 bg-[oklch(0.52_0.08_148)]/8 border-l-2 border-[oklch(0.52_0.08_148)]">
                    <p className="text-[oklch(0.38_0.07_148)] text-xs font-body italic" style={{ fontWeight: 300 }}>
                      Todos los aceites utilizados son de grado terapéutico certificado, de la más alta pureza y calidad.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Listado dinámico de masajes */}
        <section className="section-padding bg-white">
          <div className="container">
            <div className="text-center mb-12">
              <p className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-3 font-body" style={{ fontWeight: 500 }}>
                Nuestros servicios
              </p>
              <h2 className="font-display text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 400 }}>
                Elige tu sesión
              </h2>
              <div className="section-divider mx-auto mt-4" />
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-16 text-stone-400">
                <Loader2 size={24} className="animate-spin mr-3" />
                <span className="font-body text-sm">Cargando servicios...</span>
              </div>
            ) : masajes.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-[oklch(0.52_0.02_60)] font-body text-sm" style={{ fontWeight: 300 }}>
                  Próximamente disponibles. Contacta para más información.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {masajes.map((masaje) => (
                  <div
                    key={masaje.id}
                    className={`relative border bg-white transition-all duration-300 hover:shadow-lg group ${
                      masaje.featured
                        ? "border-[oklch(0.52_0.08_148)] shadow-md"
                        : "border-[oklch(0.88_0.015_75)]"
                    }`}
                  >
                    {/* Badge destacado */}
                    {masaje.featured === 1 && (
                      <div className="absolute -top-3 left-6">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-[oklch(0.52_0.08_148)] text-white text-xs font-body tracking-wider uppercase" style={{ fontWeight: 500 }}>
                          <Star size={10} fill="currentColor" />
                          Más popular
                        </span>
                      </div>
                    )}

                    {/* Imagen */}
                    {masaje.imageUrl && (
                      <div className="aspect-[16/9] overflow-hidden">
                        <img
                          src={masaje.imageUrl}
                          alt={masaje.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    )}

                    <div className="p-6 space-y-4">
                      {/* Nombre */}
                      <h3 className="font-display text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 400, fontSize: "1.15rem" }}>
                        {masaje.name}
                      </h3>

                      {/* Descripción corta */}
                      {masaje.shortDescription && (
                        <p className="text-[oklch(0.38_0.02_55)] text-sm leading-relaxed font-body" style={{ fontWeight: 300 }}>
                          {masaje.shortDescription}
                        </p>
                      )}

                      {/* Meta: duración, modalidad, precio */}
                      <div className="flex flex-wrap gap-3 pt-1">
                        {masaje.durationLabel && (
                          <span className="inline-flex items-center gap-1.5 text-xs text-[oklch(0.38_0.02_55)] font-body">
                            <Clock size={12} className="text-[oklch(0.52_0.08_148)]" />
                            {masaje.durationLabel}
                          </span>
                        )}
                        {masaje.modality && (
                          <span className="inline-flex items-center gap-1.5 text-xs text-[oklch(0.38_0.02_55)] font-body">
                            <MapPin size={12} className="text-[oklch(0.52_0.08_148)]" />
                            {MODALITY_LABEL[masaje.modality] ?? masaje.modality}
                          </span>
                        )}
                        {masaje.price && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-body text-[oklch(0.52_0.08_148)]" style={{ fontWeight: 600 }}>
                            <Euro size={12} />
                            {masaje.price} €
                          </span>
                        )}
                      </div>

                      {/* Descripción larga */}
                      {masaje.description && (
                        <p className="text-[oklch(0.52_0.02_60)] text-sm leading-relaxed font-body border-t border-[oklch(0.92_0.01_80)] pt-4" style={{ fontWeight: 300 }}>
                          {masaje.description}
                        </p>
                      )}

                      {/* CTA */}
                      <button
                        onClick={() => handleReservar(masaje.slug)}
                        className="w-full mt-2 inline-flex items-center justify-center gap-2 px-6 py-3 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-medium hover:bg-[oklch(0.38_0.07_148)] transition-all duration-300 font-body"
                        style={{ borderRadius: 0, letterSpacing: "0.1em" }}
                      >
                        Reservar sesión
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA final */}
        <section className="section-padding bg-[oklch(0.18_0.018_55)]">
          <div className="container text-center">
            <h2 className="font-display text-white mb-4" style={{ fontWeight: 400 }}>
              ¿Tienes alguna duda?
            </h2>
            <p className="text-white/70 mb-8 font-body max-w-md mx-auto" style={{ fontWeight: 300 }}>
              Escríbeme y te ayudo a elegir la sesión que mejor se adapta a lo que necesitas.
            </p>
            <button
              onClick={() => handleReservar("masaje")}
              className="inline-flex items-center gap-2 px-8 py-4 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-medium hover:bg-[oklch(0.38_0.07_148)] transition-all duration-300 font-body"
              style={{ borderRadius: 0, letterSpacing: "0.1em" }}
            >
              Reservar masaje
              <ArrowRight size={14} />
            </button>
          </div>
        </section>
      </Layout>
    </>
  );
}
