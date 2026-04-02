/**
 * Aceites Esenciales — Cristina Vive Consciente
 * Design: "Luz Botánica"
 */

import { ArrowRight, Leaf, Heart, Wind, Sun, CheckCircle, Star } from "lucide-react";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import PageHero from "@/components/PageHero";

const HERO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/hero-aceites-cn5cmPNwkFkzA35ejtXJUa.webp";

const categories = [
  {
    icon: <Heart size={20} />,
    title: "Bienestar Emocional",
    oils: ["Lavanda", "Bergamota", "Ylang Ylang", "Sándalo"],
    description: "Para el equilibrio emocional, la calma y la gestión del estrés.",
    color: "oklch(0.52 0.08 148)",
  },
  {
    icon: <Leaf size={20} />,
    title: "Salud Natural",
    oils: ["Árbol de Té", "Orégano", "Eucalipto", "Menta"],
    description: "Apoyo al sistema inmune y bienestar físico general.",
    color: "oklch(0.52 0.06 55)",
  },
  {
    icon: <Wind size={20} />,
    title: "Hogar Natural",
    oils: ["Limón", "Naranja", "Pino", "Romero"],
    description: "Para limpiar, purificar y aromatizar tu espacio de vida.",
    color: "oklch(0.72 0.06 65)",
  },
  {
    icon: <Sun size={20} />,
    title: "Belleza Consciente",
    oils: ["Rosa", "Geranio", "Incienso", "Mirra"],
    description: "Cuidado natural de la piel y el cabello con la sabiduría de las plantas.",
    color: "oklch(0.62 0.07 60)",
  },
];

const usageMethods = [
  {
    method: "Aromaterapia",
    description: "Difunde los aceites en tu hogar para crear ambientes terapéuticos y transformar tu estado emocional.",
    icon: "🌿",
  },
  {
    method: "Aplicación tópica",
    description: "Diluidos en aceite vegetal, se aplican directamente sobre la piel para beneficios locales y sistémicos.",
    icon: "✋",
  },
  {
    method: "Inhalación directa",
    description: "Inhala directamente del frasco o de tus manos para un efecto rápido e inmediato.",
    icon: "💨",
  },
  {
    method: "Baños aromáticos",
    description: "Añade unas gotas a tu baño para una experiencia de spa en casa con beneficios terapéuticos.",
    icon: "🛁",
  },
];

const quality = [
  "100% puros y naturales",
  "Sin aditivos ni sintéticos",
  "Certificación de pureza",
  "Origen controlado",
  "Prensado en frío o destilado al vapor",
  "Análisis de calidad independiente",
];

export default function AceitesEsenciales() {
  return (
    <Layout>
      <PageHero
        title="Aceites Esenciales"
        subtitle="La esencia pura de las plantas para transformar tu bienestar diario."
        tag="Aromaterapia"
        image={HERO}
        breadcrumb={[{ label: "Inicio", href: "/" }, { label: "Aceites Esenciales" }]}
      />

      {/* Intro */}
      <section className="section-padding bg-[oklch(0.985_0.006_85)]">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <div>
              <p className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-4 font-body" style={{ fontWeight: 500 }}>
                La sabiduría de las plantas
              </p>
              <h2 className="font-display text-[oklch(0.18_0.018_55)] mb-4" style={{ fontWeight: 400 }}>
                Naturaleza en su
                <em style={{ fontStyle: "italic" }}> forma más pura</em>
              </h2>
              <div className="section-divider" />
              <p className="text-[oklch(0.52_0.02_60)] leading-relaxed mt-5 mb-4 font-body" style={{ fontWeight: 300 }}>
                Los aceites esenciales son la expresión más concentrada y poderosa de las plantas. Cada gota contiene miles de compuestos activos que trabajan en sinergia para apoyar nuestra salud física, emocional y espiritual.
              </p>
              <p className="text-[oklch(0.52_0.02_60)] leading-relaxed mb-6 font-body" style={{ fontWeight: 300 }}>
                Llevo años estudiando y trabajando con aceites esenciales terapéuticos de la más alta calidad. Mi misión es enseñarte a integrarlos en tu vida cotidiana de forma segura y efectiva.
              </p>
            </div>

            {/* Quality */}
            <div className="bg-[oklch(0.94_0.012_80)] p-7">
              <div className="flex items-center gap-2 mb-5">
                <Star size={16} className="text-[oklch(0.52_0.08_148)]" />
                <h4 className="font-display text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 500, fontSize: "1.1rem" }}>
                  Estándares de calidad
                </h4>
              </div>
              <ul className="space-y-3">
                {quality.map((q) => (
                  <li key={q} className="flex items-center gap-2.5">
                    <CheckCircle size={13} className="text-[oklch(0.52_0.08_148)] flex-shrink-0" />
                    <span className="text-[oklch(0.52_0.02_60)] text-sm font-body" style={{ fontWeight: 300 }}>
                      {q}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 pt-5 border-t border-[oklch(0.88_0.015_75)]">
                <p className="text-[oklch(0.52_0.02_60)] text-xs font-body italic" style={{ fontWeight: 300 }}>
                  Solo trabajo con marcas que cumplen los más altos estándares de pureza y sostenibilidad.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section-padding bg-[oklch(0.94_0.012_80)]">
        <div className="container">
          <div className="text-center max-w-lg mx-auto mb-14">
            <p className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-4 font-body" style={{ fontWeight: 500 }}>
              Categorías
            </p>
            <h2 className="font-display text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 400 }}>
              Aceites para cada necesidad
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categories.map((cat) => (
              <div key={cat.title} className="card-natural p-7 bg-[oklch(0.99_0.004_85)]">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 flex items-center justify-center"
                    style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                  >
                    {cat.icon}
                  </div>
                  <h3 className="font-display text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 500, fontSize: "1.1rem" }}>
                    {cat.title}
                  </h3>
                </div>
                <p className="text-[oklch(0.52_0.02_60)] text-sm leading-relaxed mb-4 font-body" style={{ fontWeight: 300 }}>
                  {cat.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {cat.oils.map((oil) => (
                    <span
                      key={oil}
                      className="px-3 py-1 border border-[oklch(0.88_0.015_75)] text-[oklch(0.52_0.02_60)] text-xs font-body"
                      style={{ fontWeight: 400 }}
                    >
                      {oil}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Usage Methods */}
      <section className="section-padding bg-[oklch(0.985_0.006_85)]">
        <div className="container">
          <div className="max-w-lg mb-14">
            <p className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-4 font-body" style={{ fontWeight: 500 }}>
              Cómo usarlos
            </p>
            <h2 className="font-display text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 400 }}>
              Formas de aplicación
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {usageMethods.map((m) => (
              <div key={m.method} className="p-6 border border-[oklch(0.88_0.015_75)] hover:border-[oklch(0.52_0.08_148)]/40 transition-colors duration-300">
                <span className="block text-2xl mb-4">{m.icon}</span>
                <h4 className="font-display text-[oklch(0.18_0.018_55)] mb-2" style={{ fontWeight: 500, fontSize: "1rem" }}>
                  {m.method}
                </h4>
                <div className="w-5 h-px bg-[oklch(0.52_0.08_148)] mb-3" />
                <p className="text-[oklch(0.52_0.02_60)] text-sm leading-relaxed font-body" style={{ fontWeight: 300 }}>
                  {m.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-[oklch(0.18_0.018_55)]">
        <div className="container text-center">
          <h2 className="font-display text-white mb-4" style={{ fontWeight: 400 }}>
            Descubre el poder de los aceites
          </h2>
          <p className="text-white/70 mb-8 font-body max-w-md mx-auto" style={{ fontWeight: 300 }}>
            Te enseño a integrar los aceites esenciales en tu vida diaria de forma segura y efectiva.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => toast.info("Próximamente: tienda de aceites esenciales")}
              className="inline-flex items-center gap-2 px-8 py-4 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-medium hover:bg-[oklch(0.38_0.07_148)] transition-all duration-300 font-body"
              style={{ borderRadius: 0, letterSpacing: "0.1em" }}
            >
              Ver productos
              <ArrowRight size={14} />
            </button>
            <button
              onClick={() => toast.info("Próximamente: consulta de aromaterapia")}
              className="inline-flex items-center gap-2 px-8 py-4 border border-white/40 text-white text-xs tracking-widest uppercase font-medium hover:bg-white/10 transition-all duration-300 font-body"
              style={{ borderRadius: 0, letterSpacing: "0.1em" }}
            >
              Consulta de aromaterapia
            </button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
