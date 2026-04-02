/**
 * Recomendados — Cristina Vive Consciente
 * Design: "Luz Botánica"
 */

import { ExternalLink, Star, ShoppingBag, Leaf, Droplets, BookOpen, Heart } from "lucide-react";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import PageHero from "@/components/PageHero";

const HERO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/hero-aceites-cn5cmPNwkFkzA35ejtXJUa.webp";

const categories = [
  {
    id: "aceites",
    icon: <Leaf size={18} />,
    label: "Aceites Esenciales",
  },
  {
    id: "agua",
    icon: <Droplets size={18} />,
    label: "Sistemas de Agua",
  },
  {
    id: "libros",
    icon: <BookOpen size={18} />,
    label: "Libros",
  },
  {
    id: "bienestar",
    icon: <Heart size={18} />,
    label: "Bienestar",
  },
];

const products = [
  {
    category: "aceites",
    name: "Kit Iniciación Aromaterapia",
    brand: "doTERRA",
    description: "Los 10 aceites esenciales más versátiles y usados. Perfecto para comenzar tu camino con la aromaterapia.",
    rating: 5,
    tag: "Más vendido",
    featured: true,
  },
  {
    category: "aceites",
    name: "Difusor Ultrasónico Petal",
    brand: "doTERRA",
    description: "Difusor silencioso y elegante para aromatizar cualquier espacio de tu hogar.",
    rating: 5,
    tag: "Recomendado",
    featured: false,
  },
  {
    category: "agua",
    name: "Sistema Ósmosis Inversa 5 Etapas",
    brand: "Ecosoft",
    description: "El sistema de filtración más completo para agua de grifo. Elimina el 99% de contaminantes.",
    rating: 5,
    tag: "Mejor calidad",
    featured: true,
  },
  {
    category: "agua",
    name: "Jarra Filtrante Premium",
    brand: "Brita",
    description: "Solución económica y práctica para mejorar el agua del grifo en casa.",
    rating: 4,
    tag: "Económico",
    featured: false,
  },
  {
    category: "libros",
    name: "El Poder Curativo de los Alimentos",
    brand: "Annemarie Colbin",
    description: "Un clásico imprescindible sobre la relación entre alimentación y salud desde una perspectiva holística.",
    rating: 5,
    tag: "Imprescindible",
    featured: true,
  },
  {
    category: "libros",
    name: "Medicina Natural para el Siglo XXI",
    brand: "Eduardo Alfonso",
    description: "Una guía completa de naturopatía y medicina natural para el hogar.",
    rating: 5,
    tag: "Referencia",
    featured: false,
  },
  {
    category: "bienestar",
    name: "Rodillo de Jade Facial",
    brand: "Natural Beauty",
    description: "Herramienta de gua sha para el cuidado facial natural. Reduce la inflamación y activa la circulación.",
    rating: 4,
    tag: "Belleza natural",
    featured: false,
  },
  {
    category: "bienestar",
    name: "Esterilla de Acupresión",
    brand: "Pranamat",
    description: "Para aliviar tensiones, mejorar el sueño y activar la circulación desde casa.",
    rating: 5,
    tag: "Favorito",
    featured: true,
  },
];

export default function Recomendados() {
  return (
    <Layout>
      <PageHero
        title="Productos Recomendados"
        subtitle="Solo comparto lo que yo misma uso y en lo que confío plenamente."
        tag="Mis favoritos"
        image={HERO}
        breadcrumb={[{ label: "Inicio", href: "/" }, { label: "Recomendados" }]}
      />

      {/* Intro */}
      <section className="py-14 bg-[oklch(0.985_0.006_85)]">
        <div className="container">
          <div className="max-w-2xl">
            <p className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-4 font-body" style={{ fontWeight: 500 }}>
              Mi selección personal
            </p>
            <h2 className="font-display text-[oklch(0.18_0.018_55)] mb-4" style={{ fontWeight: 400 }}>
              Productos que
              <em style={{ fontStyle: "italic" }}> transforman vidas</em>
            </h2>
            <div className="section-divider" />
            <p className="text-[oklch(0.52_0.02_60)] leading-relaxed mt-5 font-body" style={{ fontWeight: 300 }}>
              Esta página reúne los productos que he probado personalmente y que recomiendo con total convicción a mis clientas. No incluyo nada que no haya usado yo misma o que no cumpla mis estándares de calidad y ética.
            </p>
          </div>
        </div>
      </section>

      {/* Products by Category */}
      {categories.map((cat) => {
        const catProducts = products.filter((p) => p.category === cat.id);
        if (catProducts.length === 0) return null;
        return (
          <section key={cat.id} className="py-12 border-t border-[oklch(0.88_0.015_75)]">
            <div className="container">
              {/* Category Header */}
              <div className="flex items-center gap-3 mb-8">
                <div className="w-9 h-9 flex items-center justify-center bg-[oklch(0.52_0.08_148)]/10 text-[oklch(0.52_0.08_148)]">
                  {cat.icon}
                </div>
                <h3 className="font-display text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 500, fontSize: "1.4rem" }}>
                  {cat.label}
                </h3>
              </div>

              {/* Products */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {catProducts.map((product) => (
                  <div
                    key={product.name}
                    className={`card-natural p-6 ${product.featured ? "border-[oklch(0.52_0.08_148)]/30" : ""}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {product.featured && (
                            <span
                              className="px-2 py-0.5 bg-[oklch(0.52_0.08_148)] text-white text-[0.6rem] tracking-widest uppercase font-body"
                              style={{ fontWeight: 500 }}
                            >
                              {product.tag}
                            </span>
                          )}
                          {!product.featured && (
                            <span
                              className="px-2 py-0.5 bg-[oklch(0.88_0.04_75)] text-[oklch(0.52_0.06_55)] text-[0.6rem] tracking-widest uppercase font-body"
                              style={{ fontWeight: 500 }}
                            >
                              {product.tag}
                            </span>
                          )}
                        </div>
                        <h4 className="font-display text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 500, fontSize: "1.05rem" }}>
                          {product.name}
                        </h4>
                        <p className="text-[oklch(0.52_0.08_148)] text-xs font-body mt-0.5" style={{ fontWeight: 400 }}>
                          {product.brand}
                        </p>
                      </div>
                    </div>

                    <p className="text-[oklch(0.52_0.02_60)] text-sm leading-relaxed mb-4 font-body" style={{ fontWeight: 300 }}>
                      {product.description}
                    </p>

                    <div className="flex items-center justify-between">
                      {/* Stars */}
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, j) => (
                          <Star
                            key={j}
                            size={11}
                            fill={j < product.rating ? "oklch(0.72 0.06 65)" : "transparent"}
                            color={j < product.rating ? "oklch(0.72 0.06 65)" : "oklch(0.72 0.06 60)"}
                          />
                        ))}
                      </div>

                      <button
                        onClick={() => toast.info("Próximamente: enlace al producto")}
                        className="flex items-center gap-1.5 text-[oklch(0.52_0.08_148)] text-xs tracking-wide font-body hover:text-[oklch(0.38_0.07_148)] transition-colors duration-200"
                        style={{ fontWeight: 500 }}
                      >
                        <ShoppingBag size={12} />
                        Ver producto
                        <ExternalLink size={10} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      {/* Disclaimer */}
      <section className="py-10 bg-[oklch(0.94_0.012_80)]">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-[oklch(0.52_0.02_60)] text-sm font-body italic" style={{ fontWeight: 300 }}>
              Algunos de los enlaces en esta página pueden ser de afiliado, lo que significa que puedo recibir una pequeña comisión si realizas una compra. Esto no afecta al precio que pagas ni a mi opinión sobre los productos. Solo recomiendo lo que realmente uso y en lo que confío.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
