/**
 * Sistemas de Agua — Cristina Vive Consciente
 * Design: "Luz Botánica"
 * Contenido real exacto — FASE 2
 */

import { ArrowRight, BookOpen, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import PageHero from "@/components/PageHero";

const HERO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/hero-agua-BJHXyW4FibywwKgaqzvu2q.webp";

const beneficios = [
  "El agua estructurada es más hidratante.",
  "Ayuda a eliminar las toxinas y los productos de desecho del cuerpo de manera más eficiente.",
  "Puede mejorar la absorción de nutrientes.",
  "Puede reducir la inflamación.",
  "Puede reforzar el sistema inmune.",
];

const contenidoBotella = [
  "Símbolo energético en la base",
  "Imanes de neodimio",
  "7 colores chacras",
  "Palabras Ho'oponopono",
  "Sílice para programación",
];

export default function SistemasAgua() {
  return (
    <Layout>
      <PageHero
        title="Sistemas Estructuradores de Agua"
        subtitle="Uno de los pilares más básicos de la salud es el agua que bebemos."
        tag="Agua viva"
        image={HERO}
        breadcrumb={[{ label: "Inicio", href: "/" }, { label: "Sistemas de Agua" }]}
      />

      {/* Qué es el agua estructurada */}
      <section className="section-padding bg-[oklch(0.985_0.006_85)]">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 items-start">

            {/* Texto principal */}
            <div className="lg:col-span-3 space-y-6">
              <div>
                <p className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-4 font-body" style={{ fontWeight: 500 }}>
                  ¿Qué es el agua estructurada?
                </p>
                <h2 className="font-display text-[oklch(0.18_0.018_55)] mb-4" style={{ fontWeight: 400 }}>
                  El agua que bebes
                  <em style={{ fontStyle: "italic" }}> define tu salud</em>
                </h2>
                <div className="section-divider mb-6" />
              </div>

              <p className="text-[oklch(0.38_0.02_55)] leading-relaxed font-body" style={{ fontWeight: 300 }}>
                Somos un 70% agua, el agua contenida en tu cuerpo es el principal transportador de nutrientes y oxígeno, además es necesaria para la eliminación de los desechos, este último punto fundamental, para eliminar las toxinas del organismo.
              </p>

              <p className="text-[oklch(0.38_0.02_55)] leading-relaxed font-body" style={{ fontWeight: 300 }}>
                Varias líneas de investigación sugieren que el agua no es un agente pasivo de salud, y los resultados están mostrando la importancia que tiene el agua estructurada para nuestras células.
              </p>

              <p className="text-[oklch(0.38_0.02_55)] leading-relaxed font-body" style={{ fontWeight: 300 }}>
                El agua de manantial, está viva, fluye y por lo tanto tiene esta estructura de origen, lamentablemente el agua que bebemos hoy en día debido a la manipulación, a los materiales donde ha sido contenida y a los tratamientos químicos, ha perdido su forma vital.
              </p>

              <p className="text-[oklch(0.38_0.02_55)] leading-relaxed font-body" style={{ fontWeight: 300 }}>
                Parece que el agua estructurada crea, podríamos decir, racimos más pequeños, una estructura molecular que penetra más fácilmente en ellas hidratándonos y transportando los nutrientes de una forma más eficiente.
              </p>

              <p className="text-[oklch(0.38_0.02_55)] leading-relaxed font-body" style={{ fontWeight: 300 }}>
                Su característica fundamental es una estructura más organizada, formando una estructura hexagonal, como en los copos de nieve, y esta forma por similitud o sincronía celular hace que sea mejor absorbida.
              </p>

              <p className="text-[oklch(0.38_0.02_55)] leading-relaxed font-body" style={{ fontWeight: 300 }}>
                Esta botella estructura el agua, le devuelve la vitalidad, creando una forma más ordenada a nivel molecular.
              </p>
            </div>

            {/* Sidebar: estadística + contenido botella */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stat destacada */}
              <div className="p-8 bg-[oklch(0.52_0.08_148)] text-center">
                <p className="font-display text-white mb-2" style={{ fontSize: "4rem", fontWeight: 400, lineHeight: 1 }}>
                  70%
                </p>
                <p className="text-white/80 text-sm font-body" style={{ fontWeight: 300 }}>
                  de tu cuerpo es agua
                </p>
              </div>

              {/* Contenido botella */}
              <div className="p-6 bg-[oklch(0.94_0.012_80)] border border-[oklch(0.88_0.015_75)]">
                <p className="text-[oklch(0.28_0.025_55)] text-xs tracking-widest uppercase mb-4 font-body" style={{ fontWeight: 500 }}>
                  La botella contiene
                </p>
                <ul className="space-y-3">
                  {contenidoBotella.map((item) => (
                    <li key={item} className="flex items-center gap-2.5">
                      <CheckCircle size={13} className="text-[oklch(0.52_0.08_148)] flex-shrink-0" />
                      <span className="text-[oklch(0.38_0.02_55)] text-sm font-body" style={{ fontWeight: 300 }}>
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="section-padding bg-[oklch(0.94_0.012_80)]">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-4 font-body" style={{ fontWeight: 500 }}>
                Beneficios
              </p>
              <h2 className="font-display text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 400 }}>
                Los beneficios del agua estructurada son muchos y variados
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {beneficios.map((b, i) => (
                <div key={i} className="p-5 bg-white border border-[oklch(0.88_0.015_75)] flex items-start gap-3">
                  <div className="w-6 h-6 flex items-center justify-center bg-[oklch(0.52_0.08_148)]/10 text-[oklch(0.52_0.08_148)] flex-shrink-0 text-xs font-body" style={{ fontWeight: 500 }}>
                    {i + 1}
                  </div>
                  <p className="text-[oklch(0.38_0.02_55)] text-sm leading-relaxed font-body" style={{ fontWeight: 300 }}>
                    {b}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Hidratación consciente */}
      <section className="section-padding bg-[oklch(0.985_0.006_85)]">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-4 font-body" style={{ fontWeight: 500 }}>
              Hidratación consciente
            </p>
            <h2 className="font-display text-[oklch(0.18_0.018_55)] mb-4" style={{ fontWeight: 400 }}>
              No sólo es beber mucha agua
            </h2>
            <div className="section-divider mx-auto" />
            <p className="text-[oklch(0.38_0.02_55)] leading-relaxed mt-6 mb-8 font-body" style={{ fontWeight: 300 }}>
              Hidratarse de manera consciente, no sólo es beber mucha agua. El agua debe llegar al interior de nuestras células.
            </p>

            {/* Referencia investigador */}
            <div className="p-6 bg-[oklch(0.94_0.012_80)] border border-[oklch(0.88_0.015_75)] text-left mb-8">
              <div className="flex items-start gap-3">
                <BookOpen size={16} className="text-[oklch(0.52_0.08_148)] mt-0.5 flex-shrink-0" />
                <p className="text-[oklch(0.38_0.02_55)] text-sm font-body italic" style={{ fontWeight: 300 }}>
                  Recomiendo la guía del agua (de venta en esta web) para asimilar este concepto y como investigador de referencia a <strong style={{ fontWeight: 500 }}>Masaru Emoto</strong> y sus grandiosas investigaciones sobre la estructura del agua.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={() => toast.info("Próximamente: tienda de sistemas de agua")}
                className="inline-flex items-center gap-2 px-8 py-4 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-medium hover:bg-[oklch(0.38_0.07_148)] transition-all duration-300 font-body"
                style={{ borderRadius: 0, letterSpacing: "0.1em" }}
              >
                Ver sistemas disponibles
                <ArrowRight size={14} />
              </button>
              <button
                onClick={() => toast.info("Próximamente: guía digital del agua")}
                className="inline-flex items-center gap-2 px-8 py-4 border border-[oklch(0.52_0.08_148)] text-[oklch(0.52_0.08_148)] text-xs tracking-widest uppercase font-medium hover:bg-[oklch(0.52_0.08_148)] hover:text-white transition-all duration-300 font-body"
                style={{ borderRadius: 0, letterSpacing: "0.1em" }}
              >
                Guía digital del agua — 12€
              </button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
