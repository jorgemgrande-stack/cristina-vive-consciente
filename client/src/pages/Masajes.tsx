/**
 * Masajes — Cristina Vive Consciente
 * Design: "Luz Botánica"
 */

import { ArrowRight, Clock, Leaf, Sparkles, Wind, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import PageHero from "@/components/PageHero";

const HERO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/hero-masajes-PUiFsGVb8gAs6i4s8VF7U8.webp";

const massages = [
  {
    icon: <Leaf size={20} />,
    title: "Masaje Relajante",
    duration: "60 / 90 min",
    description: "Técnicas suaves y fluidas que liberan la tensión acumulada y restauran el equilibrio del sistema nervioso.",
    benefits: ["Reduce el estrés", "Mejora el sueño", "Alivia tensiones musculares", "Activa la circulación"],
  },
  {
    icon: <Sparkles size={20} />,
    title: "Masaje Terapéutico",
    duration: "60 / 90 min",
    description: "Trabajo profundo sobre zonas de tensión específicas, combinando técnicas occidentales y orientales.",
    benefits: ["Libera contracturas", "Mejora la movilidad", "Reduce el dolor crónico", "Recuperación muscular"],
  },
  {
    icon: <Wind size={20} />,
    title: "Masaje con Aceites Esenciales",
    duration: "75 min",
    description: "La sinergia perfecta entre el tacto terapéutico y el poder curativo de los aceites esenciales puros.",
    benefits: ["Aromaterapia integrada", "Efecto profundo", "Equilibrio emocional", "Piel nutrida"],
  },
  {
    icon: <Leaf size={20} />,
    title: "Masaje Prenatal",
    duration: "60 min",
    description: "Técnicas especialmente adaptadas para acompañar y aliviar las molestias del embarazo con total seguridad.",
    benefits: ["Alivia dolores de espalda", "Reduce la hinchazón", "Mejora el descanso", "Conexión madre-bebé"],
  },
];

const benefits = [
  "Reducción del estrés y la ansiedad",
  "Mejora de la calidad del sueño",
  "Alivio de dolores musculares y articulares",
  "Activación de la circulación sanguínea",
  "Fortalecimiento del sistema inmune",
  "Equilibrio del sistema nervioso",
  "Sensación de bienestar profundo",
  "Conexión mente-cuerpo",
];

export default function Masajes() {
  return (
    <Layout>
      <PageHero
        title="Masajes Terapéuticos"
        subtitle="El arte del tacto consciente para restaurar la armonía de tu cuerpo y tu mente."
        tag="Terapia corporal"
        image={HERO}
        breadcrumb={[{ label: "Inicio", href: "/" }, { label: "Masajes" }]}
      />

      {/* Intro */}
      <section className="section-padding bg-[oklch(0.985_0.006_85)]">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
            <div className="lg:col-span-3">
              <p className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-4 font-body" style={{ fontWeight: 500 }}>
                El poder del tacto
              </p>
              <h2 className="font-display text-[oklch(0.18_0.018_55)] mb-4" style={{ fontWeight: 400 }}>
                Terapia que va más allá
                <em style={{ fontStyle: "italic" }}> de lo físico</em>
              </h2>
              <div className="section-divider" />
              <p className="text-[oklch(0.52_0.02_60)] leading-relaxed mt-5 mb-4 font-body" style={{ fontWeight: 300 }}>
                El masaje terapéutico es una de las herramientas más antiguas y poderosas de la humanidad para el bienestar. En mis sesiones, cada movimiento es intencional y consciente, adaptado a lo que tu cuerpo necesita en ese momento.
              </p>
              <p className="text-[oklch(0.52_0.02_60)] leading-relaxed font-body" style={{ fontWeight: 300 }}>
                Trabajo con aceites vegetales de alta calidad y, cuando es adecuado, con aceites esenciales terapéuticos para potenciar los beneficios de cada sesión.
              </p>
            </div>

            {/* Benefits list */}
            <div className="lg:col-span-2 bg-[oklch(0.94_0.012_80)] p-7">
              <h4 className="font-display text-[oklch(0.18_0.018_55)] mb-5" style={{ fontWeight: 500, fontSize: "1.1rem" }}>
                Beneficios del masaje
              </h4>
              <ul className="space-y-3">
                {benefits.map((b) => (
                  <li key={b} className="flex items-start gap-2.5">
                    <CheckCircle size={13} className="text-[oklch(0.52_0.08_148)] mt-0.5 flex-shrink-0" />
                    <span className="text-[oklch(0.52_0.02_60)] text-sm font-body" style={{ fontWeight: 300 }}>
                      {b}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Massage Types */}
      <section className="section-padding bg-[oklch(0.94_0.012_80)]">
        <div className="container">
          <div className="text-center max-w-lg mx-auto mb-14">
            <p className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-4 font-body" style={{ fontWeight: 500 }}>
              Tipos de masaje
            </p>
            <h2 className="font-display text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 400 }}>
              Encuentra el masaje ideal para ti
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {massages.map((m) => (
              <div key={m.title} className="card-natural p-7 bg-[oklch(0.99_0.004_85)]">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 flex items-center justify-center bg-[oklch(0.52_0.08_148)]/10 text-[oklch(0.52_0.08_148)] flex-shrink-0">
                    {m.icon}
                  </div>
                  <div>
                    <h3 className="font-display text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 500, fontSize: "1.15rem" }}>
                      {m.title}
                    </h3>
                    <span className="flex items-center gap-1 text-[oklch(0.52_0.02_60)] text-xs font-body" style={{ fontWeight: 300 }}>
                      <Clock size={11} />
                      {m.duration}
                    </span>
                  </div>
                </div>
                <p className="text-[oklch(0.52_0.02_60)] text-sm leading-relaxed mb-4 font-body" style={{ fontWeight: 300 }}>
                  {m.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {m.benefits.map((b) => (
                    <span
                      key={b}
                      className="px-2.5 py-1 bg-[oklch(0.52_0.08_148)]/8 text-[oklch(0.38_0.07_148)] text-[0.65rem] tracking-wide font-body"
                      style={{ fontWeight: 400 }}
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What to expect */}
      <section className="section-padding bg-[oklch(0.985_0.006_85)]">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-4 font-body" style={{ fontWeight: 500 }}>
              Tu experiencia
            </p>
            <h2 className="font-display text-[oklch(0.18_0.018_55)] mb-4" style={{ fontWeight: 400 }}>
              ¿Qué esperar de tu sesión?
            </h2>
            <div className="section-divider mx-auto" />
            <p className="text-[oklch(0.52_0.02_60)] leading-relaxed mt-6 mb-4 font-body" style={{ fontWeight: 300 }}>
              Cada sesión comienza con una breve conversación para entender cómo te encuentras y qué necesitas ese día. El ambiente es cálido, íntimo y completamente confidencial.
            </p>
            <p className="text-[oklch(0.52_0.02_60)] leading-relaxed font-body" style={{ fontWeight: 300 }}>
              Trabajo con música suave, aromas naturales y una presencia completamente dedicada a tu bienestar. Al terminar, te ofrezco tiempo para integrar la experiencia antes de retomar tu día.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-[oklch(0.18_0.018_55)]">
        <div className="container text-center">
          <h2 className="font-display text-white mb-4" style={{ fontWeight: 400 }}>
            Regálate una sesión
          </h2>
          <p className="text-white/70 mb-8 font-body max-w-md mx-auto" style={{ fontWeight: 300 }}>
            Tu cuerpo merece atención y cuidado. Reserva tu masaje y comienza a sentirte mejor.
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
