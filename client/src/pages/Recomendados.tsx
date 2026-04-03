/**
 * Recomendados — Cristina Vive Consciente
 * Listado dinámico de productos afiliados gestionados desde el CRM.
 * Los enlaces externos usan rel="nofollow sponsored" según las directrices de Google.
 */

import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import Layout from "@/components/Layout";
import PageHero from "@/components/PageHero";
import { ExternalLink, Globe, Star, ArrowRight } from "lucide-react";

const HERO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/hero-aceites-cn5cmPNwkFkzA35ejtXJUa.webp";

export default function Recomendados() {
  const [activeCategory, setActiveCategory] = useState<string>("Todos");

  const { data: products = [], isLoading } = trpc.affiliates.list.useQuery();

  // Derive categories from loaded products
  const categories = ["Todos", ...Array.from(new Set(products.map((p) => p.category))).sort()];

  const filtered =
    activeCategory === "Todos"
      ? products
      : products.filter((p) => p.category === activeCategory);

  // Group filtered by category
  const byCategory = filtered.reduce<Record<string, typeof products>>((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

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

      {/* Products section */}
      <section className="section-padding bg-[oklch(0.94_0.012_80)]">
        <div className="container">

          {/* Category filter */}
          {!isLoading && categories.length > 1 && (
            <div className="flex flex-wrap gap-2 justify-center mb-10">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    activeCategory === cat
                      ? "bg-[oklch(0.42_0.08_148)] text-white"
                      : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="text-center py-20 text-stone-400">Cargando productos...</div>
          )}

          {/* Empty state */}
          {!isLoading && products.length === 0 && (
            <div className="text-center py-20">
              <Globe size={48} className="mx-auto text-stone-300 mb-4" />
              <p className="text-stone-500 mb-2">Próximamente compartiré mis productos favoritos aquí.</p>
              <p className="text-sm text-stone-400">Mientras tanto, puedes escribirme directamente.</p>
            </div>
          )}

          {/* Products by category */}
          {!isLoading && Object.keys(byCategory).length > 0 && (
            <div className="space-y-14">
              {Object.entries(byCategory).map(([category, items]) => (
                <div key={category}>
                  {activeCategory === "Todos" && (
                    <h2 className="font-display text-[oklch(0.18_0.018_55)] mb-6 pb-3 border-b border-stone-300" style={{ fontWeight: 400, fontSize: "1.25rem" }}>
                      {category}
                    </h2>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Disclaimer */}
          {!isLoading && products.length > 0 && (
            <p className="text-xs text-stone-400 text-center mt-16 max-w-lg mx-auto">
              * Algunos enlaces de esta página son enlaces de afiliado. Esto no supone ningún coste
              adicional para ti y me ayuda a mantener este espacio.
            </p>
          )}
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
          <Link href="/contacto">
            <span className="inline-flex items-center gap-2 px-8 py-4 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-medium hover:bg-[oklch(0.38_0.07_148)] transition-all duration-300 font-body cursor-pointer" style={{ borderRadius: 0, letterSpacing: "0.1em" }}>
              Contactar
              <ArrowRight size={14} />
            </span>
          </Link>
        </div>
      </section>
    </Layout>
  );
}

function ProductCard({ product }: {
  product: {
    id: number;
    name: string;
    description: string | null;
    imageUrl: string | null;
    category: string;
    affiliateUrl: string;
    provider: string | null;
  }
}) {
  return (
    <div className="group card-natural bg-white overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col">
      {/* Image */}
      <div className="aspect-[4/3] bg-stone-50 overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Globe size={40} className="text-stone-300" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        {product.provider && (
          <span className="text-xs text-stone-400 uppercase tracking-wider mb-1">
            {product.provider}
          </span>
        )}
        <h3 className="font-display text-[oklch(0.18_0.018_55)] mb-2 leading-snug" style={{ fontWeight: 400, fontSize: "1rem" }}>
          {product.name}
        </h3>
        {product.description && (
          <p className="text-sm text-[oklch(0.52_0.02_60)] leading-relaxed flex-1 mb-4 font-body" style={{ fontWeight: 300 }}>
            {product.description}
          </p>
        )}

        {/* CTA — rel="nofollow sponsored" obligatorio para enlaces de afiliado */}
        <a
          href={product.affiliateUrl}
          target="_blank"
          rel="nofollow sponsored noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 border border-[oklch(0.42_0.08_148)] text-[oklch(0.42_0.08_148)] text-xs tracking-widest uppercase font-medium hover:bg-[oklch(0.42_0.08_148)] hover:text-white transition-all duration-200 font-body"
          style={{ letterSpacing: "0.08em" }}
        >
          Ver producto
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}
