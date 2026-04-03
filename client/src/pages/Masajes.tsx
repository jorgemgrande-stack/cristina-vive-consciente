/**
 * Masajes — Cristina Vive Consciente
 * Design: "Luz Botánica"
 * Contenido real exacto — FASE 2
 */

import { ArrowRight, MapPin } from "lucide-react";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import PageHero from "@/components/PageHero";

const HERO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/hero-masajes-PUiFsGVb8gAs6i4s8VF7U8.webp";

export default function Masajes() {
  return (
    <Layout>
      <PageHero
        title="Masajes Terapéuticos"
        subtitle="Técnica combinada de equilibrio energético + masaje con 8 aceites esenciales de grado terapéutico."
        tag="Terapia corporal"
        image={HERO}
        breadcrumb={[{ label: "Inicio", href: "/" }, { label: "Masajes" }]}
      />

      {/* Contenido principal */}
      <section className="section-padding bg-[oklch(0.985_0.006_85)]">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 items-start">

            {/* Texto principal */}
            <div className="lg:col-span-3 space-y-8">

              {/* Primera parte */}
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

              {/* Segunda parte */}
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

              {/* CTA */}
              <button
                onClick={() => toast.info("Próximamente: sistema de reservas online")}
                className="inline-flex items-center gap-2 px-8 py-4 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-medium hover:bg-[oklch(0.38_0.07_148)] transition-all duration-300 font-body"
                style={{ borderRadius: 0, letterSpacing: "0.1em" }}
              >
                Reservar masaje
                <ArrowRight size={14} />
              </button>
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
                      <span
                        className="w-7 h-7 flex items-center justify-center bg-[oklch(0.52_0.08_148)]/10 text-[oklch(0.52_0.08_148)] text-xs font-body flex-shrink-0"
                        style={{ fontWeight: 500 }}
                      >
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-[oklch(0.18_0.018_55)] text-sm font-body" style={{ fontWeight: 500 }}>
                          {aceite.nombre}
                        </p>
                        <p className="text-[oklch(0.52_0.02_60)] text-xs font-body" style={{ fontWeight: 300 }}>
                          {aceite.accion}
                        </p>
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

      {/* CTA final */}
      <section className="section-padding bg-[oklch(0.18_0.018_55)]">
        <div className="container text-center">
          <h2 className="font-display text-white mb-4" style={{ fontWeight: 400 }}>
            Reserva tu sesión
          </h2>
          <p className="text-white/70 mb-8 font-body max-w-md mx-auto" style={{ fontWeight: 300 }}>
            Una hora de reconexión profunda para tu cuerpo, tu mente y tu espíritu.
          </p>
          <button
            onClick={() => toast.info("Próximamente: sistema de reservas online")}
            className="inline-flex items-center gap-2 px-8 py-4 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-medium hover:bg-[oklch(0.38_0.07_148)] transition-all duration-300 font-body"
            style={{ borderRadius: 0, letterSpacing: "0.1em" }}
          >
            Reservar masaje
            <ArrowRight size={14} />
          </button>
        </div>
      </section>
    </Layout>
  );
}
