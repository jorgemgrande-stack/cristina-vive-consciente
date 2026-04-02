/**
 * Guías Digitales — Cristina Vive Consciente
 * Design: "Luz Botánica"
 */

import { ArrowRight, BookOpen, Download, Star, FileText } from "lucide-react";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import PageHero from "@/components/PageHero";

const HERO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/hero-consultas-VRAFvns5UX68Kqd64cBawH.webp";

const guides = [
  {
    title: "Guía de Iniciación a los Aceites Esenciales",
    description: "Todo lo que necesitas saber para empezar a usar aceites esenciales de forma segura y efectiva en tu hogar.",
    pages: "45 páginas",
    level: "Principiante",
    topics: ["Qué son los aceites esenciales", "Seguridad y diluciones", "Los 10 aceites básicos", "Recetas para el hogar"],
    tag: "Aromaterapia",
  },
  {
    title: "Protocolo de Detox Natural",
    description: "Un programa completo de 21 días para limpiar tu organismo de forma natural con alimentación, hidratación y plantas.",
    pages: "60 páginas",
    level: "Intermedio",
    topics: ["Plan de alimentación", "Hidratación consciente", "Plantas depurativas", "Rutinas diarias"],
    tag: "Detox",
  },
  {
    title: "Agua que Sana: Guía Completa",
    description: "Aprende todo sobre la calidad del agua, los sistemas de filtración y cómo optimizar tu hidratación diaria.",
    pages: "38 páginas",
    level: "Todos los niveles",
    topics: ["Calidad del agua", "Sistemas de filtración", "Agua alcalina", "Hidratación óptima"],
    tag: "Agua",
  },
  {
    title: "Bienestar Consciente: Rutinas Diarias",
    description: "Crea rutinas matutinas y vespertinas que nutran tu cuerpo, tu mente y tu espíritu con herramientas naturales.",
    pages: "52 páginas",
    level: "Todos los niveles",
    topics: ["Rutina matutina", "Alimentación consciente", "Movimiento natural", "Gestión emocional"],
    tag: "Estilo de vida",
  },
  {
    title: "Masaje en Casa: Técnicas Básicas",
    description: "Aprende técnicas de automasaje y masaje en pareja para aliviar tensiones y mejorar el bienestar en casa.",
    pages: "40 páginas",
    level: "Principiante",
    topics: ["Automasaje", "Técnicas básicas", "Aceites para masaje", "Zonas reflexológicas"],
    tag: "Masaje",
  },
  {
    title: "Plantas Medicinales del Hogar",
    description: "Las 20 plantas medicinales más útiles para tener en casa y cómo usarlas para los malestares más comunes.",
    pages: "55 páginas",
    level: "Principiante",
    topics: ["20 plantas esenciales", "Preparaciones caseras", "Infusiones terapéuticas", "Botiquín natural"],
    tag: "Plantas",
  },
];

const levelColors: Record<string, string> = {
  "Principiante": "oklch(0.52 0.08 148)",
  "Intermedio": "oklch(0.72 0.06 65)",
  "Todos los niveles": "oklch(0.52 0.06 55)",
};

export default function GuiasDigitales() {
  return (
    <Layout>
      <PageHero
        title="Guías Digitales"
        subtitle="Conocimiento práctico y profundo para transformar tu vida desde casa."
        tag="Recursos digitales"
        image={HERO}
        breadcrumb={[{ label: "Inicio", href: "/" }, { label: "Guías Digitales" }]}
      />

      {/* Intro */}
      <section className="section-padding bg-[oklch(0.985_0.006_85)]">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <p className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-4 font-body" style={{ fontWeight: 500 }}>
                Conocimiento accesible
              </p>
              <h2 className="font-display text-[oklch(0.18_0.018_55)] mb-4" style={{ fontWeight: 400 }}>
                Aprende a tu ritmo,
                <em style={{ fontStyle: "italic" }}> desde casa</em>
              </h2>
              <div className="section-divider" />
              <p className="text-[oklch(0.52_0.02_60)] leading-relaxed mt-5 mb-4 font-body" style={{ fontWeight: 300 }}>
                Mis guías digitales son recursos completos, prácticos y hermosamente diseñados que condensan años de experiencia y formación en un formato accesible para ti.
              </p>
              <p className="text-[oklch(0.52_0.02_60)] leading-relaxed font-body" style={{ fontWeight: 300 }}>
                Cada guía incluye información científica, sabiduría ancestral y herramientas prácticas que puedes aplicar desde el primer día.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 gap-4">
              {[
                { icon: <Download size={16} />, title: "Descarga inmediata", text: "Accede a tu guía al instante tras la compra." },
                { icon: <FileText size={16} />, title: "Formato PDF", text: "Compatible con todos los dispositivos y para imprimir." },
                { icon: <Star size={16} />, title: "Contenido exclusivo", text: "Información que no encontrarás en ningún otro lugar." },
                { icon: <BookOpen size={16} />, title: "Actualizaciones incluidas", text: "Recibes las actualizaciones de tu guía sin coste adicional." },
              ].map((f) => (
                <div key={f.title} className="flex items-start gap-4 p-4 border border-[oklch(0.88_0.015_75)]">
                  <div className="w-8 h-8 flex items-center justify-center bg-[oklch(0.52_0.08_148)]/10 text-[oklch(0.52_0.08_148)] flex-shrink-0">
                    {f.icon}
                  </div>
                  <div>
                    <h4 className="font-body text-[oklch(0.18_0.018_55)] text-sm mb-0.5" style={{ fontWeight: 500 }}>
                      {f.title}
                    </h4>
                    <p className="text-[oklch(0.52_0.02_60)] text-xs font-body" style={{ fontWeight: 300 }}>
                      {f.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Guides Grid */}
      <section className="section-padding bg-[oklch(0.94_0.012_80)]">
        <div className="container">
          <div className="text-center max-w-lg mx-auto mb-14">
            <p className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-4 font-body" style={{ fontWeight: 500 }}>
              Catálogo
            </p>
            <h2 className="font-display text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 400 }}>
              Todas las guías disponibles
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guides.map((guide) => (
              <div key={guide.title} className="card-natural bg-[oklch(0.99_0.004_85)] flex flex-col">
                {/* Header */}
                <div className="p-6 pb-4 border-b border-[oklch(0.88_0.015_75)]">
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="px-2.5 py-1 text-[0.6rem] tracking-widest uppercase font-body"
                      style={{
                        fontWeight: 500,
                        backgroundColor: `${levelColors[guide.level]}15`,
                        color: levelColors[guide.level],
                        letterSpacing: "0.1em",
                      }}
                    >
                      {guide.level}
                    </span>
                    <span className="text-[oklch(0.52_0.02_60)] text-xs font-body flex items-center gap-1" style={{ fontWeight: 300 }}>
                      <FileText size={11} />
                      {guide.pages}
                    </span>
                  </div>
                  <h3 className="font-display text-[oklch(0.18_0.018_55)] mb-2" style={{ fontWeight: 500, fontSize: "1.05rem", lineHeight: 1.3 }}>
                    {guide.title}
                  </h3>
                  <p className="text-[oklch(0.52_0.02_60)] text-xs leading-relaxed font-body" style={{ fontWeight: 300 }}>
                    {guide.description}
                  </p>
                </div>

                {/* Topics */}
                <div className="p-6 pt-4 flex-1">
                  <p className="text-[oklch(0.52_0.02_60)] text-[0.65rem] tracking-widest uppercase mb-3 font-body" style={{ fontWeight: 500 }}>
                    Contenido
                  </p>
                  <ul className="space-y-1.5 mb-5">
                    {guide.topics.map((topic) => (
                      <li key={topic} className="flex items-center gap-2 text-xs text-[oklch(0.52_0.02_60)] font-body" style={{ fontWeight: 300 }}>
                        <div className="w-1 h-1 rounded-full bg-[oklch(0.52_0.08_148)] flex-shrink-0" />
                        {topic}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                <div className="px-6 pb-6">
                  <button
                    onClick={() => toast.info("Próximamente: tienda de guías digitales")}
                    className="w-full py-2.5 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-medium hover:bg-[oklch(0.38_0.07_148)] transition-all duration-300 font-body flex items-center justify-center gap-2"
                    style={{ borderRadius: 0, letterSpacing: "0.1em" }}
                  >
                    <Download size={12} />
                    Obtener guía
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-[oklch(0.52_0.08_148)]">
        <div className="container text-center">
          <h2 className="font-display text-white mb-4" style={{ fontWeight: 400 }}>
            ¿No encuentras lo que buscas?
          </h2>
          <p className="text-white/80 mb-8 font-body max-w-md mx-auto" style={{ fontWeight: 300 }}>
            Escríbeme y cuéntame qué tema te interesa. Puedo crear una guía personalizada para ti.
          </p>
          <button
            onClick={() => toast.info("Próximamente: solicitud de guía personalizada")}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[oklch(0.52_0.08_148)] text-xs tracking-widest uppercase font-medium hover:bg-[oklch(0.94_0.012_80)] transition-all duration-300 font-body"
            style={{ borderRadius: 0, letterSpacing: "0.1em" }}
          >
            Solicitar guía personalizada
            <ArrowRight size={14} />
          </button>
        </div>
      </section>
    </Layout>
  );
}
