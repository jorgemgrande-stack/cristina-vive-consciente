/**
 * Recomendados — Cristina Vive Consciente
 * Design: "Luz Botánica"
 * Estructura de categorías — FASE 2
 * Sin contenido fijo: solo estructura de categorías reales
 */

import { ArrowRight, Star } from "lucide-react";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import PageHero from "@/components/PageHero";

const HERO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/hero-aceites-cn5cmPNwkFkzA35ejtXJUa.webp";

const categorias = [
  {
    id: "alimentacion",
    emoji: "🥦",
    titulo: "Alimentación ecológica",
    descripcion: "Productos libres de aditivos, marcas de confianza y proveedores que he probado personalmente.",
    items: ["Marcas de alimentación ecológica", "Productos sin aditivos", "Suplementos naturales", "Superalimentos"],
  },
  {
    id: "cocina",
    emoji: "🍳",
    titulo: "Utensilios de cocina",
    descripcion: "Materiales seguros para cocinar sin contaminar tus alimentos con tóxicos.",
    items: ["Sartenes y ollas sin tóxicos", "Recipientes de vidrio y acero", "Filtros de agua para cocina", "Herramientas de cocina natural"],
  },
  {
    id: "limpieza",
    emoji: "🌿",
    titulo: "Productos de limpieza",
    descripcion: "Alternativas naturales y efectivas para un hogar libre de químicos agresivos.",
    items: ["Limpiadores naturales", "Jabones ecológicos", "Alternativas al plástico", "Productos biodegradables"],
  },
  {
    id: "cosmetica",
    emoji: "✨",
    titulo: "Cosmética natural",
    descripcion: "Cuidado personal sin parabenos, sulfatos ni ingredientes de síntesis química.",
    items: ["Cremas y serums naturales", "Higiene personal ecológica", "Cosmética infantil", "Protección solar natural"],
  },
  {
    id: "textil",
    emoji: "🧵",
    titulo: "Textil",
    descripcion: "Ropa y tejidos de fibras naturales, libres de tratamientos químicos.",
    items: ["Ropa de algodón orgánico", "Ropa de cama natural", "Fibras naturales certificadas"],
  },
  {
    id: "electromagnetica",
    emoji: "📡",
    titulo: "Higiene electromagnética",
    descripcion: "Herramientas y recursos para reducir la exposición a campos electromagnéticos en el hogar.",
    items: ["Medidores de campos EM", "Protectores y armonizadores", "Recursos informativos"],
  },
  {
    id: "luminica",
    emoji: "💡",
    titulo: "Higiene lumínica",
    descripcion: "Iluminación respetuosa con los ritmos circadianos para un descanso y salud óptimos.",
    items: ["Bombillas de espectro cálido", "Gafas bloqueadoras de luz azul", "Recursos sobre ritmos circadianos"],
  },
  {
    id: "agua",
    emoji: "💧",
    titulo: "Sistemas de agua",
    descripcion: "Los mejores sistemas de filtrado y estructuración del agua que he analizado personalmente.",
    items: ["Filtros de agua", "Estructuradores de agua", "Jarras y botellas de calidad"],
  },
];

export default function Recomendados() {
  return (
    <Layout>
      <PageHero
        title="Recomendados"
        subtitle="Solo recomiendo lo que uso o usaría yo personalmente. Cada producto ha pasado por mi propio filtro de confianza."
        tag="Selección personal"
        image={HERO}
        breadcrumb={[{ label: "Inicio", href: "/" }, { label: "Recomendados" }]}
      />

      {/* Intro */}
      <section className="py-14 bg-[oklch(0.985_0.006_85)]">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <div className="flex justify-center mb-5">
              <div className="w-10 h-10 flex items-center justify-center bg-[oklch(0.52_0.08_148)]/10 text-[oklch(0.52_0.08_148)]">
                <Star size={20} />
              </div>
            </div>
            <p className="text-[oklch(0.38_0.02_55)] leading-relaxed font-body" style={{ fontWeight: 300 }}>
              Esta sección reúne los productos y marcas que he investigado, probado y aprobado personalmente. No recomendaría absolutamente nada que no use o fuera a usar yo misma. Cada categoría está pensada para ayudarte a construir un hogar y un estilo de vida más saludable y libre de tóxicos.
            </p>
          </div>
        </div>
      </section>

      {/* Categorías */}
      <section className="section-padding bg-[oklch(0.94_0.012_80)]">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {categorias.map((cat) => (
              <div
                key={cat.id}
                className="card-natural p-6 bg-white flex flex-col"
              >
                <div className="text-2xl mb-3">{cat.emoji}</div>
                <h3 className="font-display text-[oklch(0.18_0.018_55)] mb-2" style={{ fontWeight: 400, fontSize: "1.1rem" }}>
                  {cat.titulo}
                </h3>
                <div className="w-8 h-px bg-[oklch(0.52_0.08_148)] mb-3" />
                <p className="text-[oklch(0.52_0.02_60)] text-xs leading-relaxed mb-4 font-body flex-1" style={{ fontWeight: 300 }}>
                  {cat.descripcion}
                </p>
                <ul className="space-y-1.5 mb-5">
                  {cat.items.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-[oklch(0.52_0.08_148)] flex-shrink-0" />
                      <span className="text-[oklch(0.38_0.02_55)] text-xs font-body" style={{ fontWeight: 300 }}>
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => toast.info("Próximamente: productos recomendados")}
                  className="inline-flex items-center gap-1.5 text-[oklch(0.52_0.08_148)] text-xs tracking-widest uppercase font-body hover:text-[oklch(0.38_0.07_148)] transition-colors duration-200 mt-auto"
                  style={{ fontWeight: 500, letterSpacing: "0.1em" }}
                >
                  Ver productos
                  <ArrowRight size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-[oklch(0.18_0.018_55)]">
        <div className="container text-center">
          <h2 className="font-display text-white mb-4" style={{ fontWeight: 400 }}>
            ¿Buscas algo concreto?
          </h2>
          <p className="text-white/70 mb-8 font-body max-w-md mx-auto" style={{ fontWeight: 300 }}>
            Escríbeme y te oriento hacia los productos que mejor se adapten a tu situación y presupuesto.
          </p>
          <button
            onClick={() => toast.info("Próximamente: formulario de contacto")}
            className="inline-flex items-center gap-2 px-8 py-4 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-medium hover:bg-[oklch(0.38_0.07_148)] transition-all duration-300 font-body"
            style={{ borderRadius: 0, letterSpacing: "0.1em" }}
          >
            Contactar
            <ArrowRight size={14} />
          </button>
        </div>
      </section>
    </Layout>
  );
}
