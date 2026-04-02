/**
 * Sistemas de Agua — Cristina Vive Consciente
 * Design: "Luz Botánica"
 */

import { ArrowRight, Droplets, Shield, Zap, CheckCircle, Info } from "lucide-react";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import PageHero from "@/components/PageHero";

const HERO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/hero-agua-BJHXyW4FibywwKgaqzvu2q.webp";

const systems = [
  {
    icon: <Droplets size={22} />,
    title: "Filtración por Ósmosis Inversa",
    description: "Elimina hasta el 99% de contaminantes, metales pesados, cloro y microplásticos. El agua más pura para tu familia.",
    features: ["Elimina contaminantes", "Sin cloro ni flúor", "Instalación doméstica", "Mantenimiento sencillo"],
    tag: "Purificación total",
  },
  {
    icon: <Shield size={22} />,
    title: "Filtros de Carbón Activo",
    description: "Solución eficaz y económica para mejorar el sabor y eliminar el cloro y los compuestos orgánicos del agua.",
    features: ["Mejora el sabor", "Elimina el cloro", "Fácil instalación", "Larga duración"],
    tag: "Filtración básica",
  },
  {
    icon: <Zap size={22} />,
    title: "Agua Alcalina e Ionizada",
    description: "Agua con pH óptimo para el organismo, con propiedades antioxidantes y mayor capacidad de hidratación celular.",
    features: ["pH alcalino", "Antioxidante", "Hidratación superior", "Beneficios celulares"],
    tag: "Vitalización",
  },
  {
    icon: <Droplets size={22} />,
    title: "Estructuración del Agua",
    description: "Técnicas naturales para devolver al agua su estructura original, como la del agua de manantial.",
    features: ["Agua estructurada", "Energía vital", "Técnicas naturales", "Sin electricidad"],
    tag: "Agua viva",
  },
];

const whyWater = [
  { stat: "70%", label: "del cuerpo humano es agua" },
  { stat: "2L", label: "mínimo diario recomendado" },
  { stat: "99%", label: "de contaminantes eliminados" },
  { stat: "∞", label: "impacto en tu salud" },
];

export default function SistemasAgua() {
  return (
    <Layout>
      <PageHero
        title="Sistemas de Agua"
        subtitle="El agua que bebes define tu salud. Te ayudo a elegir la mejor solución para tu hogar."
        tag="Agua viva"
        image={HERO}
        breadcrumb={[{ label: "Inicio", href: "/" }, { label: "Sistemas de Agua" }]}
      />

      {/* Why Water */}
      <section className="section-padding bg-[oklch(0.985_0.006_85)]">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <div>
              <p className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-4 font-body" style={{ fontWeight: 500 }}>
                La importancia del agua
              </p>
              <h2 className="font-display text-[oklch(0.18_0.018_55)] mb-4" style={{ fontWeight: 400 }}>
                El agua es la base
                <em style={{ fontStyle: "italic" }}> de toda vida</em>
              </h2>
              <div className="section-divider" />
              <p className="text-[oklch(0.52_0.02_60)] leading-relaxed mt-5 mb-4 font-body" style={{ fontWeight: 300 }}>
                El agua que consumimos tiene un impacto directo y profundo en nuestra salud. No solo nos hidrata: transporta nutrientes, elimina toxinas, regula la temperatura corporal y participa en cada proceso biológico.
              </p>
              <p className="text-[oklch(0.52_0.02_60)] leading-relaxed mb-6 font-body" style={{ fontWeight: 300 }}>
                Sin embargo, el agua del grifo contiene cloro, flúor, metales pesados y microplásticos que afectan nuestra salud a largo plazo. Te ayudo a encontrar la solución adecuada para ti.
              </p>

              {/* Info box */}
              <div className="flex gap-3 p-4 bg-[oklch(0.52_0.08_148)]/8 border-l-2 border-[oklch(0.52_0.08_148)]">
                <Info size={16} className="text-[oklch(0.52_0.08_148)] flex-shrink-0 mt-0.5" />
                <p className="text-[oklch(0.38_0.07_148)] text-sm font-body" style={{ fontWeight: 300 }}>
                  Ofrezco asesoría personalizada para ayudarte a elegir el sistema más adecuado según tu situación y presupuesto.
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              {whyWater.map((w) => (
                <div key={w.label} className="p-6 bg-[oklch(0.94_0.012_80)] border border-[oklch(0.88_0.015_75)] text-center">
                  <p className="font-display text-[oklch(0.52_0.08_148)] mb-2" style={{ fontSize: "2.5rem", fontWeight: 400, lineHeight: 1 }}>
                    {w.stat}
                  </p>
                  <p className="text-[oklch(0.52_0.02_60)] text-xs font-body" style={{ fontWeight: 300 }}>
                    {w.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Systems */}
      <section className="section-padding bg-[oklch(0.94_0.012_80)]">
        <div className="container">
          <div className="text-center max-w-lg mx-auto mb-14">
            <p className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-4 font-body" style={{ fontWeight: 500 }}>
              Soluciones
            </p>
            <h2 className="font-display text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 400 }}>
              Sistemas que recomiendo
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {systems.map((s) => (
              <div key={s.title} className="card-natural p-7 bg-[oklch(0.99_0.004_85)]">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 flex items-center justify-center bg-[oklch(0.52_0.08_148)]/10 text-[oklch(0.52_0.08_148)]">
                    {s.icon}
                  </div>
                  <span
                    className="px-2.5 py-1 bg-[oklch(0.88_0.04_75)] text-[oklch(0.52_0.06_55)] text-[0.65rem] tracking-wide font-body"
                    style={{ fontWeight: 500 }}
                  >
                    {s.tag}
                  </span>
                </div>
                <h3 className="font-display text-[oklch(0.18_0.018_55)] mb-2" style={{ fontWeight: 500, fontSize: "1.15rem" }}>
                  {s.title}
                </h3>
                <p className="text-[oklch(0.52_0.02_60)] text-sm leading-relaxed mb-5 font-body" style={{ fontWeight: 300 }}>
                  {s.description}
                </p>
                <ul className="grid grid-cols-2 gap-2">
                  {s.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-[oklch(0.52_0.02_60)] font-body" style={{ fontWeight: 300 }}>
                      <CheckCircle size={11} className="text-[oklch(0.52_0.08_148)] flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-[oklch(0.52_0.08_148)]">
        <div className="container text-center">
          <h2 className="font-display text-white mb-4" style={{ fontWeight: 400 }}>
            ¿Qué sistema necesitas?
          </h2>
          <p className="text-white/80 mb-8 font-body max-w-md mx-auto" style={{ fontWeight: 300 }}>
            Te asesoro de forma personalizada para encontrar la mejor solución para tu hogar y tu familia.
          </p>
          <button
            onClick={() => toast.info("Próximamente: asesoría personalizada de sistemas de agua")}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[oklch(0.52_0.08_148)] text-xs tracking-widest uppercase font-medium hover:bg-[oklch(0.94_0.012_80)] transition-all duration-300 font-body"
            style={{ borderRadius: 0, letterSpacing: "0.1em" }}
          >
            Solicitar asesoría
            <ArrowRight size={14} />
          </button>
        </div>
      </section>
    </Layout>
  );
}
