/**
 * Consultas — Cristina Vive Consciente
 * Design: "Luz Botánica"
 */

import { ArrowRight, Clock, Heart, Leaf, MessageCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import PageHero from "@/components/PageHero";

const HERO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/hero-consultas-VRAFvns5UX68Kqd64cBawH.webp";

const types = [
  {
    icon: <Heart size={20} />,
    title: "Consulta Inicial",
    duration: "90 min",
    description:
      "Una sesión profunda para conocer tu historia, tus síntomas y tus objetivos. Diseñamos juntas un plan personalizado de bienestar.",
    includes: ["Evaluación integral", "Plan personalizado", "Recomendaciones iniciales", "Seguimiento por email"],
  },
  {
    icon: <Leaf size={20} />,
    title: "Consulta de Seguimiento",
    duration: "60 min",
    description:
      "Revisamos tu progreso, ajustamos el plan y profundizamos en los aspectos que necesitan más atención.",
    includes: ["Revisión de avances", "Ajuste del plan", "Nuevas herramientas", "Apoyo continuo"],
  },
  {
    icon: <MessageCircle size={20} />,
    title: "Consulta Online",
    duration: "60 min",
    description:
      "Desde la comodidad de tu hogar. La misma calidad y profundidad de una sesión presencial, adaptada al formato digital.",
    includes: ["Videollamada privada", "Material digital", "Grabación disponible", "Seguimiento post-sesión"],
  },
];

const process = [
  { step: "01", title: "Contacto inicial", text: "Me escribes y acordamos el mejor momento para tu consulta." },
  { step: "02", title: "Formulario previo", text: "Completas un breve cuestionario para que pueda prepararme para tu sesión." },
  { step: "03", title: "La consulta", text: "Nos encontramos en un espacio seguro y confidencial para explorar tu bienestar." },
  { step: "04", title: "Tu plan personalizado", text: "Recibes recomendaciones concretas y herramientas para tu vida diaria." },
];

export default function Consultas() {
  return (
    <Layout>
      <PageHero
        title="Consultas Holísticas"
        subtitle="Un espacio seguro para explorar tu bienestar desde una perspectiva integral."
        tag="Bienestar integral"
        image={HERO}
        breadcrumb={[{ label: "Inicio", href: "/" }, { label: "Consultas" }]}
      />

      {/* Intro */}
      <section className="section-padding bg-[oklch(0.985_0.006_85)]">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <div>
              <p className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-4 font-body" style={{ fontWeight: 500 }}>
                Mi enfoque
              </p>
              <h2 className="font-display text-[oklch(0.18_0.018_55)] mb-4" style={{ fontWeight: 400 }}>
                Más que una consulta,
                <em style={{ fontStyle: "italic" }}> un acompañamiento</em>
              </h2>
              <div className="section-divider" />
              <p className="text-[oklch(0.52_0.02_60)] leading-relaxed mt-5 mb-4 font-body" style={{ fontWeight: 300 }}>
                En mis consultas holísticas no trato síntomas aislados. Exploro la persona en su totalidad: sus hábitos, emociones, entorno y historia de vida. Desde ahí, construimos juntas un camino hacia el equilibrio.
              </p>
              <p className="text-[oklch(0.52_0.02_60)] leading-relaxed font-body" style={{ fontWeight: 300 }}>
                Mi formación integra nutrición natural, terapias complementarias y el profundo conocimiento de la sabiduría ancestral de las plantas. Cada consulta es única, como tú.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { number: "+200", label: "Clientas acompañadas" },
                { number: "5+", label: "Años de experiencia" },
                { number: "3", label: "Modalidades de consulta" },
                { number: "100%", label: "Enfoque personalizado" },
              ].map((stat) => (
                <div key={stat.label} className="p-6 bg-[oklch(0.94_0.012_80)] border border-[oklch(0.88_0.015_75)]">
                  <p className="font-display text-[oklch(0.52_0.08_148)] mb-1" style={{ fontSize: "2.2rem", fontWeight: 400, lineHeight: 1 }}>
                    {stat.number}
                  </p>
                  <p className="text-[oklch(0.52_0.02_60)] text-xs tracking-wide font-body" style={{ fontWeight: 300 }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Types */}
      <section className="section-padding bg-[oklch(0.94_0.012_80)]">
        <div className="container">
          <div className="text-center max-w-lg mx-auto mb-14">
            <p className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-4 font-body" style={{ fontWeight: 500 }}>
              Modalidades
            </p>
            <h2 className="font-display text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 400 }}>
              Elige tu tipo de consulta
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {types.map((type) => (
              <div key={type.title} className="card-natural p-7 bg-[oklch(0.99_0.004_85)]">
                <div className="w-10 h-10 flex items-center justify-center bg-[oklch(0.52_0.08_148)]/10 text-[oklch(0.52_0.08_148)] mb-5">
                  {type.icon}
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="font-display text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 500, fontSize: "1.15rem" }}>
                    {type.title}
                  </h3>
                  <span className="flex items-center gap-1 text-[oklch(0.52_0.02_60)] text-xs font-body" style={{ fontWeight: 300 }}>
                    <Clock size={11} />
                    {type.duration}
                  </span>
                </div>
                <p className="text-[oklch(0.52_0.02_60)] text-sm leading-relaxed mb-5 font-body" style={{ fontWeight: 300 }}>
                  {type.description}
                </p>
                <ul className="space-y-2">
                  {type.includes.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-[oklch(0.52_0.02_60)] font-body" style={{ fontWeight: 300 }}>
                      <CheckCircle size={12} className="text-[oklch(0.52_0.08_148)] flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="section-padding bg-[oklch(0.985_0.006_85)]">
        <div className="container">
          <div className="max-w-lg mb-14">
            <p className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-4 font-body" style={{ fontWeight: 500 }}>
              El proceso
            </p>
            <h2 className="font-display text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 400 }}>
              ¿Cómo funciona?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {process.map((p) => (
              <div key={p.step} className="relative">
                <span className="block font-display text-[oklch(0.88_0.04_75)] mb-3" style={{ fontSize: "2.5rem", fontWeight: 400, lineHeight: 1 }}>
                  {p.step}
                </span>
                <h4 className="font-display text-[oklch(0.18_0.018_55)] mb-2" style={{ fontWeight: 500, fontSize: "1.05rem" }}>
                  {p.title}
                </h4>
                <div className="w-6 h-px bg-[oklch(0.52_0.08_148)] mb-3" />
                <p className="text-[oklch(0.52_0.02_60)] text-sm leading-relaxed font-body" style={{ fontWeight: 300 }}>
                  {p.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-[oklch(0.52_0.08_148)]">
        <div className="container text-center">
          <h2 className="font-display text-white mb-4" style={{ fontWeight: 400 }}>
            ¿Lista para comenzar?
          </h2>
          <p className="text-white/80 mb-8 font-body max-w-md mx-auto" style={{ fontWeight: 300 }}>
            Reserva tu consulta y da el primer paso hacia tu bienestar integral.
          </p>
          <button
            onClick={() => toast.info("Próximamente: sistema de reservas online")}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[oklch(0.52_0.08_148)] text-xs tracking-widest uppercase font-medium hover:bg-[oklch(0.94_0.012_80)] transition-all duration-300 font-body"
            style={{ borderRadius: 0, letterSpacing: "0.1em" }}
          >
            Reservar mi consulta
            <ArrowRight size={14} />
          </button>
        </div>
      </section>
    </Layout>
  );
}
