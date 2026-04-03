/**
 * /recomendados — Productos Afiliados
 * Diseño: "Luz Botánica" — ecommerce natural, profesional y minimalista
 * Datos: dinámicos desde la base de datos (tRPC)
 * IMPORTANTE: módulo de afiliación puro — sin carrito ni checkout
 * Todos los enlaces usan rel="nofollow sponsored noopener noreferrer"
 */

import { useState, useMemo } from "react";
import { Link } from "wouter";
import { ExternalLink, ShoppingBag, Leaf, Star, ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import Layout from "@/components/Layout";
import PageHero from "@/components/PageHero";

const HERO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/hero-aceites-cn5cmPNwkFkzA35ejtXJUa.webp";

type Product = {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  category: string;
  affiliateUrl: string;
  provider: string | null;
  isAffiliate: number;
  sourceUrl: string | null;
  sortOrder: number;
  status: string;
};

// Colores del ribbon por proveedor (paleta integrada con la web)
const PROVIDER_RIBBON: Record<string, { bg: string; text: string; border: string }> = {
  Amazon: { bg: "bg-[oklch(0.96_0.04_60)]", text: "text-[oklch(0.42_0.09_60)]", border: "border-[oklch(0.88_0.06_60)]" },
  Conasi: { bg: "bg-[oklch(0.95_0.04_148)]", text: "text-[oklch(0.38_0.09_148)]", border: "border-[oklch(0.87_0.06_148)]" },
  Naturitas: { bg: "bg-[oklch(0.95_0.04_148)]", text: "text-[oklch(0.38_0.09_148)]", border: "border-[oklch(0.87_0.06_148)]" },
  NaturalByMe: { bg: "bg-[oklch(0.96_0.03_200)]", text: "text-[oklch(0.38_0.08_200)]", border: "border-[oklch(0.88_0.05_200)]" },
  iHerb: { bg: "bg-[oklch(0.95_0.04_148)]", text: "text-[oklch(0.38_0.09_148)]", border: "border-[oklch(0.87_0.06_148)]" },
  Afiliado: { bg: "bg-[oklch(0.96_0.02_85)]", text: "text-[oklch(0.42_0.05_85)]", border: "border-[oklch(0.90_0.03_85)]" },
  default: { bg: "bg-[oklch(0.96_0.02_85)]", text: "text-[oklch(0.42_0.05_85)]", border: "border-[oklch(0.90_0.03_85)]" },
};

function getProviderRibbon(provider: string | null) {
  if (!provider) return PROVIDER_RIBBON.default;
  return PROVIDER_RIBBON[provider] ?? PROVIDER_RIBBON.default;
}

// Asignar badge visual según el nombre/descripción del producto
function getProductBadge(product: Product) {
  const text = `${product.name} ${product.description ?? ""}`.toLowerCase();
  if (text.includes("bebé") || text.includes("niño") || text.includes("infantil")) {
    return { label: "Familia", color: "bg-sky-50 text-sky-600 border-sky-100" };
  }
  if (text.includes("top") || text.includes("mejor") || text.includes("favorit")) {
    return { label: "Top", color: "bg-amber-50 text-amber-600 border-amber-100" };
  }
  return {
    label: "Recomendado",
    color: "bg-[oklch(0.94_0.03_140)] text-[oklch(0.40_0.09_148)] border-[oklch(0.88_0.05_140)]",
  };
}

function ProductCard({ product }: { product: Product }) {
  const badge = getProductBadge(product);
  const ribbon = product.isAffiliate ? getProviderRibbon(product.provider) : null;

  return (
    <article className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-stone-100 shadow-sm hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 ease-out">
      {/* Imagen */}
      <div className="relative aspect-[4/3] bg-[oklch(0.97_0.006_85)] overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag size={36} className="text-stone-200" />
          </div>
        )}
        {/* Badge categoría */}
        <span
          className={`absolute top-3 left-3 text-[10px] font-medium tracking-wide px-2.5 py-1 rounded-full border ${badge.color}`}
        >
          {badge.label}
        </span>
        {/* Ribbon proveedor — solo si es afiliado */}
        {ribbon && product.provider && (
          <span
            className={`absolute top-3 right-3 text-[9px] font-semibold tracking-wide px-2 py-0.5 rounded-md border ${ribbon.bg} ${ribbon.text} ${ribbon.border}`}
          >
            {product.provider}
          </span>
        )}
      </div>

      {/* Contenido */}
      <div className="flex flex-col flex-1 p-5 gap-2.5">
        {/* Categoría / proveedor */}
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-medium tracking-widest uppercase text-[oklch(0.52_0.08_148)] opacity-70">
            {product.category}
          </p>
          {product.provider && (
            <span className="text-[10px] text-stone-300 font-medium">{product.provider}</span>
          )}
        </div>

        {/* Nombre */}
        <h3 className="font-serif text-[0.95rem] leading-snug text-stone-800 line-clamp-2 group-hover:text-[oklch(0.38_0.08_148)] transition-colors duration-200">
          {product.name}
        </h3>

        {/* Descripción */}
        {product.description && (
          <p className="text-xs text-stone-500 leading-relaxed line-clamp-3 flex-1">
            {product.description}
          </p>
        )}

        {/* Texto de confianza */}
        <div className="flex items-center gap-1.5 mt-auto pt-2 border-t border-stone-50">
          <Leaf size={10} className="text-[oklch(0.52_0.08_148)] flex-shrink-0" />
          <span className="text-[10px] text-stone-400 leading-tight">
            Producto recomendado tras uso personal
          </span>
        </div>

        {/* Botón — solo si tiene URL de afiliado */}
        {product.isAffiliate && product.affiliateUrl ? (
          <a
            href={product.affiliateUrl}
            target="_blank"
            rel="nofollow sponsored external noopener noreferrer"
            className="mt-1 flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-[oklch(0.94_0.04_140)] hover:bg-[oklch(0.45_0.1_140)] text-[oklch(0.38_0.08_148)] hover:text-white text-xs font-medium tracking-wide transition-all duration-200 border border-[oklch(0.88_0.05_140)] hover:border-[oklch(0.45_0.1_140)]"
          >
            Ver en {product.provider ?? "tienda"}
            <ExternalLink size={11} className="flex-shrink-0" />
          </a>
        ) : (
          <span className="mt-1 flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-stone-50 text-stone-400 text-xs font-medium tracking-wide border border-stone-100 cursor-default">
            Próximamente disponible
          </span>
        )}
      </div>
    </article>
  );
}

export default function Recomendados() {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const { data: products = [], isLoading } = trpc.affiliates.list.useQuery();
  const { data: dbCategories = [] } = trpc.affiliates.listCategories.useQuery();

  // Categorías con productos activos, ordenadas según la tabla de categorías
  const categoryNames = useMemo(() => {
    const names = new Set(products.map((p) => p.category));
    const namesArr = Array.from(names);
    const ordered = dbCategories.filter((c) => names.has(c.name)).map((c) => c.name);
    for (const n of namesArr) {
      if (!ordered.includes(n)) ordered.push(n);
    }
    return ordered;
  }, [products, dbCategories]);

  // Agrupar productos por categoría
  const grouped = useMemo(() => {
    const source =
      activeCategory === "all"
        ? products
        : products.filter((p) => p.category === activeCategory);

    const map = new Map<string, Product[]>();
    for (const cat of categoryNames) {
      const items = source.filter((p) => p.category === cat);
      if (items.length > 0) map.set(cat, items);
    }
    return map;
  }, [products, activeCategory, categoryNames]);

  const getCategoryDescription = (name: string) =>
    dbCategories.find((c) => c.name === name)?.description ?? null;

  return (
    <Layout>
      <PageHero
        title="Productos Recomendados"
        subtitle="Solo recomiendo lo que uso o usaría yo personalmente. Cada producto ha pasado por mi propio filtro de confianza."
        tag="Selección personal"
        image={HERO}
        breadcrumb={[{ label: "Inicio", href: "/" }, { label: "Recomendados" }]}
      />

      {/* Intro + aviso de afiliación */}
      <section className="py-12 bg-white">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-stone-500 leading-relaxed text-sm mb-6">
              Esta sección reúne los productos y marcas que he investigado, probado y aprobado personalmente. No recomendaría absolutamente nada que no use o fuera a usar yo misma. Cada categoría está pensada para ayudarte a construir un hogar y un estilo de vida más saludable y libre de tóxicos.
            </p>
            <div className="inline-flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-left">
              <Star size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                <strong>Transparencia:</strong> Algunos enlaces son de afiliado. Esto no supone ningún coste adicional para ti y me ayuda a mantener este espacio. Solo recomiendo lo que confío plenamente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Catálogo */}
      <section className="py-16 bg-[oklch(0.98_0.005_85)]">
        <div className="container">

          {/* Filtros de categoría */}
          {!isLoading && categoryNames.length > 1 && (
            <div className="flex flex-wrap gap-2 justify-center mb-12">
              <button
                onClick={() => setActiveCategory("all")}
                className={`px-4 py-2 rounded-full text-xs font-medium tracking-wide transition-all duration-200 border ${
                  activeCategory === "all"
                    ? "bg-[oklch(0.45_0.1_140)] text-white border-[oklch(0.45_0.1_140)] shadow-sm"
                    : "bg-white text-stone-600 border-stone-200 hover:border-[oklch(0.45_0.1_140)] hover:text-[oklch(0.38_0.08_148)]"
                }`}
              >
                Todos ({products.length})
              </button>
              {categoryNames.map((cat) => {
                const count = products.filter((p) => p.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-medium tracking-wide transition-all duration-200 border ${
                      activeCategory === cat
                        ? "bg-[oklch(0.45_0.1_140)] text-white border-[oklch(0.45_0.1_140)] shadow-sm"
                        : "bg-white text-stone-600 border-stone-200 hover:border-[oklch(0.45_0.1_140)] hover:text-[oklch(0.38_0.08_148)]"
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {/* Skeleton de carga */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden border border-stone-100 animate-pulse">
                  <div className="aspect-[4/3] bg-stone-100" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 bg-stone-100 rounded w-1/3" />
                    <div className="h-4 bg-stone-100 rounded w-3/4" />
                    <div className="h-3 bg-stone-100 rounded w-full" />
                    <div className="h-3 bg-stone-100 rounded w-2/3" />
                    <div className="h-9 bg-stone-100 rounded-xl mt-4" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sin productos */}
          {!isLoading && products.length === 0 && (
            <div className="text-center py-20 text-stone-400">
              <ShoppingBag size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-lg font-serif">Próximamente</p>
              <p className="text-sm mt-2">Estoy preparando una selección especial de productos para ti.</p>
            </div>
          )}

          {/* Grupos por categoría */}
          {!isLoading && grouped.size > 0 && (
            <div className="space-y-16">
              {Array.from(grouped.entries()).map(([category, items]) => (
                <div key={category}>
                  {/* Header de categoría */}
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-1.5">
                      <div className="w-6 h-px bg-[oklch(0.52_0.08_148)]" />
                      <h2 className="font-serif text-xl text-stone-800">{category}</h2>
                    </div>
                    {getCategoryDescription(category) && (
                      <p className="text-sm text-stone-400 ml-9 leading-relaxed">
                        {getCategoryDescription(category)}
                      </p>
                    )}
                    <p className="text-[11px] text-stone-300 ml-9 mt-1">
                      {items.length} producto{items.length !== 1 ? "s" : ""}
                    </p>
                  </div>

                  {/* Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[oklch(0.18_0.018_55)]">
        <div className="container text-center">
          <h2 className="font-serif text-2xl text-white mb-3 font-normal">
            ¿Buscas algo concreto?
          </h2>
          <p className="text-white/60 text-sm mb-8 max-w-md mx-auto leading-relaxed">
            Escríbeme y te oriento hacia los productos que mejor se adapten a tu situación y presupuesto.
          </p>
          <Link href="/contacto">
            <span className="inline-flex items-center gap-2 px-8 py-3.5 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-medium hover:bg-[oklch(0.38_0.07_148)] transition-all duration-300 rounded-full cursor-pointer">
              Contactar
              <ArrowRight size={13} />
            </span>
          </Link>
        </div>
      </section>
    </Layout>
  );
}
