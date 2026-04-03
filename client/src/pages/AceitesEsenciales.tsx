/**
 * Aceites Esenciales — Cristina Vive Consciente
 * Design: "Luz Botánica"
 * Contenido real exacto — FASE 2
 */

import { ArrowRight, Leaf, BookOpen } from "lucide-react";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import PageHero from "@/components/PageHero";

const HERO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/hero-aceites-cn5cmPNwkFkzA35ejtXJUa.webp";

const usos = [
  { metodo: "Aromaterapia", descripcion: "Difunde los aceites en tu hogar para crear ambientes terapéuticos y transformar tu estado emocional.", emoji: "🌿" },
  { metodo: "Aplicación tópica", descripcion: "Diluidos en aceite vegetal, se aplican directamente sobre la piel para beneficios locales y sistémicos.", emoji: "✋" },
  { metodo: "Inhalación directa", descripcion: "Inhala directamente del frasco o de tus manos para un efecto rápido e inmediato.", emoji: "💨" },
  { metodo: "Uso interno", descripcion: "Algunos aceites de grado terapéutico pueden usarse internamente. Consulta siempre con un profesional.", emoji: "💧" },
];

export default function AceitesEsenciales() {
  return (
    <Layout>
      <PageHero
        title="Aceites Esenciales"
        subtitle="Compuestos aromáticos volátiles extraídos de la corteza, flores, hojas, raíces, semillas, tallos y otras partes de las plantas."
        tag="Aromaterapia"
        image={HERO}
        breadcrumb={[{ label: "Inicio", href: "/" }, { label: "Aceites Esenciales" }]}
      />

      {/* Introducción */}
      <section className="section-padding bg-[oklch(0.985_0.006_85)]">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <div className="space-y-6">
              <div>
                <p className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-4 font-body" style={{ fontWeight: 500 }}>
                  La sabiduría de las plantas
                </p>
                <h2 className="font-display text-[oklch(0.18_0.018_55)] mb-4" style={{ fontWeight: 400 }}>
                  Naturaleza en su
                  <em style={{ fontStyle: "italic" }}> forma más pura</em>
                </h2>
                <div className="section-divider mb-6" />
              </div>

              <p className="text-[oklch(0.38_0.02_55)] leading-relaxed font-body" style={{ fontWeight: 300 }}>
                Los aceites esenciales son compuestos aromáticos volátiles extraídos de la corteza, flores, hojas, raíces, semillas, tallos y otras partes de las plantas.
              </p>

              <p className="text-[oklch(0.38_0.02_55)] leading-relaxed font-body" style={{ fontWeight: 300 }}>
                Poseen propiedades beneficiosas para nuestra salud física, mental y emocional. Estos aceites se han utilizado durante siglos en diferentes culturas por sus diversas propiedades terapéuticas.
              </p>

              <button
                onClick={() => toast.info("Próximamente: guía digital de aceites esenciales")}
                className="inline-flex items-center gap-2 px-6 py-3 border border-[oklch(0.52_0.08_148)] text-[oklch(0.52_0.08_148)] text-xs tracking-widest uppercase font-medium hover:bg-[oklch(0.52_0.08_148)] hover:text-white transition-all duration-300 font-body"
                style={{ borderRadius: 0, letterSpacing: "0.1em" }}
              >
                <BookOpen size={13} />
                Guía digital de aceites — 7€
              </button>
            </div>

            {/* Formas de uso */}
            <div className="space-y-4">
              <p className="text-[oklch(0.28_0.025_55)] text-xs tracking-widest uppercase mb-4 font-body" style={{ fontWeight: 500 }}>
                Formas de uso
              </p>
              {usos.map((u) => (
                <div key={u.metodo} className="flex items-start gap-4 p-4 border border-[oklch(0.88_0.015_75)] bg-white hover:border-[oklch(0.52_0.08_148)]/40 transition-colors duration-300">
                  <span className="text-xl flex-shrink-0">{u.emoji}</span>
                  <div>
                    <h4 className="font-body text-[oklch(0.18_0.018_55)] text-sm mb-1" style={{ fontWeight: 500 }}>
                      {u.metodo}
                    </h4>
                    <p className="text-[oklch(0.52_0.02_60)] text-xs leading-relaxed font-body" style={{ fontWeight: 300 }}>
                      {u.descripcion}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Asesorías */}
      <section className="section-padding bg-[oklch(0.94_0.012_80)]">
        <div className="container">
          <div className="max-w-lg mb-12">
            <p className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-4 font-body" style={{ fontWeight: 500 }}>
              Asesorías
            </p>
            <h2 className="font-display text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 400 }}>
              Te acompaño en tu camino con los aceites
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Asesoría individual */}
            <div className="card-natural p-7 bg-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 flex items-center justify-center bg-[oklch(0.52_0.08_148)]/10 text-[oklch(0.52_0.08_148)]">
                  <Leaf size={18} />
                </div>
                <h3 className="font-display text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 500, fontSize: "1.1rem" }}>
                  Asesoría personalizada
                </h3>
              </div>
              <div className="section-divider mb-4" />
              <p className="text-[oklch(0.38_0.02_55)] text-sm leading-relaxed mb-5 font-body" style={{ fontWeight: 300 }}>
                Te enseño a integrar los aceites esenciales en tu vida diaria de forma segura y efectiva, adaptado a tus necesidades concretas: salud, emociones, hogar, familia.
              </p>
              <button
                onClick={() => toast.info("Próximamente: asesoría de aceites esenciales")}
                className="inline-flex items-center gap-2 text-[oklch(0.52_0.08_148)] text-xs tracking-widest uppercase font-body hover:text-[oklch(0.38_0.07_148)] transition-colors duration-200"
                style={{ fontWeight: 500, letterSpacing: "0.1em" }}
              >
                Solicitar asesoría
                <ArrowRight size={12} />
              </button>
            </div>

            {/* Compra a través de mí */}
            <div className="card-natural p-7 bg-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 flex items-center justify-center bg-[oklch(0.72_0.06_65)]/15 text-[oklch(0.52_0.06_55)]">
                  <BookOpen size={18} />
                </div>
                <h3 className="font-display text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 500, fontSize: "1.1rem" }}>
                  Compra a través de mí
                </h3>
              </div>
              <div className="section-divider mb-4" />
              <p className="text-[oklch(0.38_0.02_55)] text-sm leading-relaxed mb-5 font-body" style={{ fontWeight: 300 }}>
                Puedes adquirir los aceites esenciales de grado terapéutico a través de mí, con soporte y orientación incluidos. Solo recomiendo marcas que cumplen los más altos estándares de pureza.
              </p>
              <button
                onClick={() => toast.info("Próximamente: compra de aceites esenciales")}
                className="inline-flex items-center gap-2 text-[oklch(0.52_0.08_148)] text-xs tracking-widest uppercase font-body hover:text-[oklch(0.38_0.07_148)] transition-colors duration-200"
                style={{ fontWeight: 500, letterSpacing: "0.1em" }}
              >
                Más información
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-[oklch(0.18_0.018_55)]">
        <div className="container text-center">
          <h2 className="font-display text-white mb-4" style={{ fontWeight: 400 }}>
            Descubre el poder de los aceites esenciales
          </h2>
          <p className="text-white/70 mb-8 font-body max-w-md mx-auto" style={{ fontWeight: 300 }}>
            Empieza con la guía básica para el hogar o solicita una asesoría personalizada.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => toast.info("Próximamente: guía digital de aceites esenciales")}
              className="inline-flex items-center gap-2 px-8 py-4 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-medium hover:bg-[oklch(0.38_0.07_148)] transition-all duration-300 font-body"
              style={{ borderRadius: 0, letterSpacing: "0.1em" }}
            >
              Guía digital — 7€
              <ArrowRight size={14} />
            </button>
            <button
              onClick={() => toast.info("Próximamente: asesoría de aceites esenciales")}
              className="inline-flex items-center gap-2 px-8 py-4 border border-white/40 text-white text-xs tracking-widest uppercase font-medium hover:bg-white/10 transition-all duration-300 font-body"
              style={{ borderRadius: 0, letterSpacing: "0.1em" }}
            >
              Solicitar asesoría
            </button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
