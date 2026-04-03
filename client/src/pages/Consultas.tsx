/**
 * Consultas — Cristina Vive Consciente
 * Design: "Luz Botánica"
 * Contenido real exacto — FASE 2
 */

import { ArrowRight, Clock, CheckCircle, Euro } from "lucide-react";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import PageHero from "@/components/PageHero";

const HERO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/hero-consultas-VRAFvns5UX68Kqd64cBawH.webp";

const consultas = [
  {
    id: "acompanamiento",
    precio: "140€",
    titulo: "Consulta + Acompañamiento 21 días",
    duracion: "Consulta inicial + 21 días seguimiento",
    destacado: true,
    badge: "Más completa",
    descripcionCorta: "Consulta integral con acompañamiento continuo hasta la implementación de un hábito.",
    descripcion: [
      "Esta consulta incluye el contenido descrito en la consulta naturopata de 60 min y tiene un valor añadido que es clave: el acompañamiento continuo hasta la implementación de un hábito, este tipo de seguimiento ofrece a los clientes apoyo cercano mientras hacen los cambios, lo que aumenta su compromiso y resultados. Es una consulta integral donde se ven un compendio de diferentes cuestiones que conforman la biohabitabilidad.",
      "Este servicio integral incluye una consulta inicial en la que evaluaremos tu caso a fondo, con un estudio personalizado y recomendaciones concretas. Además, contarás con 21 días de seguimiento por WhatsApp donde te acompañaré a través de audios y/o por escrito para resolver dudas que vayan surgiendo. También recibirás lista de compra recomendada basada en tu dieta y cambios que consideremos oportunos, con recomendaciones de todo tipo de productos saludables y libres de tóxicos en áreas como: alimentación, utensilios de cocina, productos de limpieza, textil, cosmética, higiene electromagnética y lumínica.",
      "Además un PDF donde también incluiremos pautas de suplementación ideal para acompañar este estilo de vida.",
    ],
    ideal: [
      "Adoptar un estilo de vida saludable y conectado con la naturaleza",
      "Implementar hábitos saludables y duraderos",
    ],
    modalidad: "Disponible presencialmente, por teléfono o vía Zoom.",
  },
  {
    id: "naturopata",
    precio: "90€",
    titulo: "Consulta Naturópata",
    duracion: "Mínimo 60 min",
    destacado: false,
    badge: null,
    descripcionCorta: "Estudio del caso con anamnesis, análisis de dieta y recomendaciones personalizadas.",
    descripcion: [
      "Sesión que dura mínimo 1 h y en función de la necesidad pudiendo ser más, donde se realiza un estudio del caso con anamnesis y análisis de dieta. Valoraremos posible mineralograma o análisis complementarios. Se requiere un registro de dieta 7 días antes de la consulta, donde el cliente interesado anotará lo que come y bebe durante este tiempo, de manera que podamos hacer cambios estructurales si así fuera conveniente.",
    ],
    ideal: [
      "Personas con problemas de salud crónicos o recurrentes, que buscan alternativas naturales y personalizadas para mejorar su calidad de vida",
      "Quienes desean recuperar su energía y equilibrio hormonal, abordando posibles causas a través de alimentación y estilo de vida",
      "Protocolos de desintoxicación con arcillas y/o otros complementos para establecer una buena base y facilitar el proceso de expulsión",
      "Suplementación personalizada. Plan adaptado con los suplementos esenciales que refuerzan el sistema inmune y el equilibrio general, tanto en adultos como en niños. Especialmente útil en otoño e invierno",
      "Futuros padres o madres que quieren optimizar su fertilidad o llevar un embarazo saludable mediante cambios en su dieta y entorno",
      "Familias que buscan mejorar la alimentación de sus hijos, y que prefieren una dieta ecológica, libre de aditivos y adecuada para los más pequeños",
      "Personas interesadas en reducir tóxicos en su entorno y productos de uso diario, creando un hogar más saludable",
      "Quienes padecen sobrepeso o problemas metabólicos y buscan un enfoque natural y adaptado a su ritmo de vida",
      "Individuos interesados en dietas antiinflamatorias para reducir molestias articulares, digestivas u otras afecciones relacionadas con la inflamación",
    ],
    nota: "Esta consulta es útil para cualquier persona que quiera comprender mejor su salud desde un enfoque integral y basado en la naturaleza.",
    modalidad: null,
  },
  {
    id: "breve",
    precio: "30€",
    titulo: "Consulta Breve Naturopatía 30 min",
    duracion: "30 min",
    destacado: false,
    badge: null,
    descripcionCorta: "Opción pensada para resolver dudas puntuales de forma rápida y económica.",
    descripcion: [
      "Opción pensada para resolver dudas puntuales de forma rápida y económica. En esta consulta aclaramos inquietudes específicas sin necesidad de realizar anamnesis ni estudio de caso.",
      "Se realiza por vía telefónica o, si lo prefieres, por escrito (WhatsApp o email). La consulta es ideal para quienes necesitan una orientación breve y efectiva en una sola sesión. Las dudas se envían con antelación para optimizar el tiempo.",
    ],
    temas: [
      "Entender el entorno que habitas",
      "Estilo de vida saludable",
      "Naturaleza",
      "Crianza consciente y respetuosa",
      "Vacunación infantil (lo que debes saber)",
      "Eliminación de tóxicos del hogar",
      "Integración de los 4 elementos (para recuperar la salud)",
      "Alimentación ecológica, libre de aditivos (conozco los productos del mercado)",
      "Alimentación infantil",
      "Dietas antiinflamatorias",
      "Remedios naturales para diferentes patologías",
      "Recuperación energética",
      "Higiene electromagnética",
      "Higiene lumínica (Ritmos circadianos)",
      "Problemas de peso",
      "Fertilidad y embarazo",
      "Reequilibrio hormonal",
      "Tratamientos del agua que bebes",
      "Uso terapéutico de aceites esenciales",
    ],
    garantia: "Si no quedas satisfecho te haré devolución, si no puedo resolverla te derivaré a otro profesional de mi competencia o te proporcionaré grupos de apoyo para que tú mismo puedas buscar la información y autogestionar tu propia salud.",
    modalidad: null,
  },
  {
    id: "express",
    precio: "10€",
    titulo: "Consulta Express Salud",
    duracion: "Por escrito o audio",
    destacado: false,
    badge: null,
    descripcionCorta: "Para las dudas que me llegan a través de redes sociales, atendidas con todo detalle.",
    descripcion: [
      "Es casi seguro que si has llegado hasta aquí, es porque yo misma te he derivado a esta sección de la web, debido a la alta demanda de consultas breves que recibo en las redes sociales, me veo en la tesitura de atender cada una de ellas a través de esta plataforma, de esta manera mi tiempo y mi energía no se ven comprometidos y puedo atenderlas con todo lujo de detalles, como cada uno merece, ya que todas son igual de importantes.",
      "En mis años de estudio, divulgación y activismo he recopilado suficiente información como para dar soporte a casi cualquier duda que pueda surgirte.",
      "Esto es para una consulta express, algo que te inquiete relacionado con las temáticas que trato en mis redes, me la mandas por escrito o por audio y te contesto de la misma manera.",
    ],
    temas: [
      "Entender el entorno que habitas",
      "Estilo de vida saludable",
      "Naturaleza",
      "Crianza consciente y respetuosa",
      "Vacunación infantil (lo que debes saber)",
      "Eliminación de tóxicos del hogar",
      "Integración de los 4 elementos (para recuperar la salud)",
      "Alimentación ecológica, libre de aditivos",
      "Alimentación infantil",
      "Dietas antiinflamatorias",
      "Dietas sin contar calorías",
      "Remedios naturales para diferentes patologías",
      "Recuperación energética",
      "Problemas de peso",
      "Fertilidad y embarazo",
      "Reequilibrio hormonal",
      "Tratamientos del agua que bebes",
      "Uso terapéutico de aceites esenciales",
    ],
    garantia: "Si no quedas satisfecho te haré devolución, si no puedo resolverla te derivaré a otro profesional de mi competencia o te proporcionaré grupos de apoyo para que tú mismo puedas buscar la información y autogestionar tu propia salud.",
    modalidad: null,
  },
  {
    id: "biohabitabilidad",
    precio: null,
    titulo: "Asesoría de Biohabitabilidad",
    duracion: "A consultar",
    destacado: false,
    badge: null,
    descripcionCorta: "Claves para redefinir tu espacio vital y ganar salud a través del entorno que habitas.",
    descripcion: [
      "¿Quieres comprender el entorno en el que habitas para ganar salud a través de las características que lo conforman y no sabes por dónde empezar? Esta asesoría te dará las claves para redefinir tu espacio vital.",
    ],
    ideal: [],
    modalidad: null,
  },
  {
    id: "kinesiologia",
    precio: "15€",
    titulo: "Testaje Kinesiológico para Homeopatía",
    duracion: "A distancia",
    destacado: false,
    badge: null,
    descripcionCorta: "Encuentra el remedio homeopático que tu organismo necesita mediante kinesiología cuántica.",
    descripcion: [
      "Encuentra el remedio homeopático que tu organismo necesita. Nuestro servicio de testaje kinesiológico está diseñado específicamente para identificar qué productos homeopáticos son más adecuados para ti. A través de un método no invasivo, evaluamos las respuestas de tu cuerpo para seleccionar los remedios y dosis que mejor se adapten a tus necesidades.",
    ],
    incluye: [
      "Determinación precisa de los remedios homeopáticos adecuados",
      "Ajuste de las dosis según las necesidades individuales",
      "Un enfoque personalizado y natural para apoyar tu bienestar",
    ],
    como: "Utilizamos la kinesiología cuántica a distancia para evaluar las respuestas energéticas de tu cuerpo frente a diferentes estímulos homeopáticos, permitiendo una selección personalizada y efectiva de los remedios más adecuados para ti.",
    ideal: [
      "Personas que buscan un tratamiento homeopático personalizado",
      "Complementar otros procesos de salud con un enfoque natural",
    ],
    cierre: "Descubre cómo la homeopatía puede ayudarte a alcanzar el equilibrio perfecto.",
    modalidad: null,
  },
];

export default function Consultas() {
  return (
    <Layout>
      <PageHero
        title="Consultas"
        subtitle="Regularmente visita esta sección para descubrir nuevos cursos y asesoría dentro del marco de la salud consciente."
        tag="Salud consciente"
        image={HERO}
        breadcrumb={[{ label: "Inicio", href: "/" }, { label: "Consultas" }]}
      />

      {/* Listado de consultas */}
      <section className="section-padding bg-[oklch(0.985_0.006_85)]">
        <div className="container">
          <div className="space-y-10">
            {consultas.map((c, idx) => (
              <div
                key={c.id}
                id={c.id}
                className={`card-natural p-7 md:p-10 ${c.destacado ? "border-[oklch(0.52_0.08_148)]/40 bg-[oklch(0.97_0.008_100)]" : "bg-white"}`}
              >
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      {c.badge && (
                        <span className="px-2.5 py-1 bg-[oklch(0.52_0.08_148)] text-white text-[0.6rem] tracking-widest uppercase font-body" style={{ fontWeight: 500 }}>
                          {c.badge}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[oklch(0.52_0.02_60)] text-xs font-body" style={{ fontWeight: 300 }}>
                        <Clock size={11} />
                        {c.duracion}
                      </span>
                    </div>
                    <h2 className="font-display text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 400, fontSize: "clamp(1.2rem, 2.5vw, 1.6rem)" }}>
                      {c.titulo}
                    </h2>
                  </div>
                  {c.precio && (
                    <div className="text-right">
                      <p className="font-display text-[oklch(0.52_0.08_148)]" style={{ fontWeight: 400, fontSize: "2rem", lineHeight: 1 }}>
                        {c.precio}
                      </p>
                    </div>
                  )}
                  {!c.precio && (
                    <div className="text-right">
                      <p className="text-[oklch(0.52_0.02_60)] text-sm font-body italic" style={{ fontWeight: 300 }}>
                        Precio a consultar
                      </p>
                    </div>
                  )}
                </div>

                <div className="section-divider mb-6" />

                {/* Descripción */}
                <div className="space-y-4 mb-6">
                  {c.descripcion.map((p, i) => (
                    <p key={i} className="text-[oklch(0.38_0.02_55)] leading-relaxed font-body" style={{ fontWeight: 300 }}>
                      {p}
                    </p>
                  ))}
                </div>

                {/* Ideal para */}
                {c.ideal && c.ideal.length > 0 && (
                  <div className="mb-6">
                    <p className="text-[oklch(0.28_0.025_55)] text-xs tracking-widest uppercase mb-3 font-body" style={{ fontWeight: 500 }}>
                      Ideal para
                    </p>
                    <ul className="space-y-2">
                      {c.ideal.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <CheckCircle size={13} className="text-[oklch(0.52_0.08_148)] mt-0.5 flex-shrink-0" />
                          <span className="text-[oklch(0.38_0.02_55)] text-sm font-body" style={{ fontWeight: 300 }}>
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {c.nota && (
                      <p className="mt-4 text-[oklch(0.38_0.02_55)] text-sm italic font-body" style={{ fontWeight: 300 }}>
                        {c.nota}
                      </p>
                    )}
                  </div>
                )}

                {/* Temas (consulta breve y express) */}
                {(c as any).temas && (
                  <div className="mb-6">
                    <p className="text-[oklch(0.28_0.025_55)] text-xs tracking-widest uppercase mb-3 font-body" style={{ fontWeight: 500 }}>
                      Cosas que podemos ver o tratar
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                      {(c as any).temas.map((t: string, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-[oklch(0.52_0.08_148)] flex-shrink-0" />
                          <span className="text-[oklch(0.38_0.02_55)] text-sm font-body" style={{ fontWeight: 300 }}>
                            {t}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Incluye (kinesiología) */}
                {(c as any).incluye && (
                  <div className="mb-6">
                    <p className="text-[oklch(0.28_0.025_55)] text-xs tracking-widest uppercase mb-3 font-body" style={{ fontWeight: 500 }}>
                      ¿Qué incluye?
                    </p>
                    <ul className="space-y-2">
                      {(c as any).incluye.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <CheckCircle size={13} className="text-[oklch(0.52_0.08_148)] mt-0.5 flex-shrink-0" />
                          <span className="text-[oklch(0.38_0.02_55)] text-sm font-body" style={{ fontWeight: 300 }}>
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Cómo funciona (kinesiología) */}
                {(c as any).como && (
                  <div className="mb-6">
                    <p className="text-[oklch(0.28_0.025_55)] text-xs tracking-widest uppercase mb-3 font-body" style={{ fontWeight: 500 }}>
                      ¿Cómo funciona?
                    </p>
                    <p className="text-[oklch(0.38_0.02_55)] text-sm leading-relaxed font-body" style={{ fontWeight: 300 }}>
                      {(c as any).como}
                    </p>
                  </div>
                )}

                {/* Cierre (kinesiología) */}
                {(c as any).cierre && (
                  <p className="text-[oklch(0.52_0.08_148)] text-sm italic font-body mb-6" style={{ fontWeight: 400 }}>
                    {(c as any).cierre}
                  </p>
                )}

                {/* Garantía */}
                {(c as any).garantia && (
                  <div className="p-4 bg-[oklch(0.94_0.012_80)] border-l-2 border-[oklch(0.52_0.08_148)] mb-6">
                    <p className="text-[oklch(0.38_0.02_55)] text-sm font-body italic" style={{ fontWeight: 300 }}>
                      {(c as any).garantia}
                    </p>
                  </div>
                )}

                {/* Modalidad */}
                {c.modalidad && (
                  <p className="text-[oklch(0.52_0.02_60)] text-sm font-body mb-6" style={{ fontWeight: 300 }}>
                    📍 {c.modalidad}
                  </p>
                )}

                {/* CTA */}
                <button
                  onClick={() => toast.info("Próximamente: sistema de reservas online")}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-medium hover:bg-[oklch(0.38_0.07_148)] transition-all duration-300 font-body"
                  style={{ borderRadius: 0, letterSpacing: "0.1em" }}
                >
                  Reservar consulta
                  <ArrowRight size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
