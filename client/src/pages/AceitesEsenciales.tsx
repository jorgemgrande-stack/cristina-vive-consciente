/**
 * AceitesEsenciales.tsx — Catálogo consultivo de aceites esenciales
 * Cristina Vive Consciente
 *
 * NO es un ecommerce. NO hay compra directa. NO hay precios.
 * Objetivo: convertir visitantes en consultas con Cristina.
 */

import { useState, useMemo } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import Layout from "@/components/Layout";
import { useConsultaCart } from "@/contexts/ConsultaCartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, ShoppingBag, Check, Leaf, ArrowRight, Loader2, Star } from "lucide-react";

const TIPO_LABELS: Record<string, string> = {
  aceite: "Aceite esencial",
  mezcla: "Mezcla terapéutica",
  base: "Base y dilución",
  pack: "Pack y guía",
  accesorio: "Accesorio",
};

const TIPO_COLORS: Record<string, string> = {
  aceite: "bg-[oklch(0.92_0.06_148)] text-[oklch(0.32_0.08_148)]",
  mezcla: "bg-[oklch(0.92_0.06_220)] text-[oklch(0.32_0.08_220)]",
  base: "bg-[oklch(0.92_0.04_60)] text-[oklch(0.42_0.06_60)]",
  pack: "bg-[oklch(0.92_0.04_30)] text-[oklch(0.42_0.06_30)]",
  accesorio: "bg-[oklch(0.94_0.01_80)] text-[oklch(0.42_0.02_80)]",
};

function parseJsonArray(val: string | null | undefined): string[] {
  try { return JSON.parse(val ?? "[]") as string[]; } catch { return []; }
}

function ProductCard({ product }: {
  product: {
    id: number; name: string; slug: string; tipoProducto: string;
    descripcion: string | null; beneficios: string | null;
    imagen: string | null; destacado: number;
  }
}) {
  const { addItem, removeItem, isInCart } = useConsultaCart();
  const inCart = isInCart(product.id);
  const beneficios = parseJsonArray(product.beneficios).slice(0, 3);

  function handleToggleCart(e: React.MouseEvent) {
    e.preventDefault();
    if (inCart) {
      removeItem(product.id);
      toast.success(`"${product.name}" eliminado de tu consulta`);
    } else {
      addItem({
        id: product.id,
        name: product.name,
        slug: product.slug,
        tipoProducto: product.tipoProducto,
        imagen: product.imagen,
      });
      toast.success(`"${product.name}" añadido a tu consulta`, {
        action: { label: "Ver consulta", onClick: () => window.location.href = "/mi-consulta" },
      });
    }
  }

  return (
    <div className="group bg-white border border-[oklch(0.92_0.01_80)] hover:border-[oklch(0.72_0.06_148)] hover:shadow-md transition-all duration-300 flex flex-col">
      {/* Imagen */}
      <Link href={`/aceites-esenciales/${product.slug}`}>
        <div className="relative overflow-hidden aspect-square bg-[oklch(0.97_0.006_85)]">
          {product.imagen ? (
            <img
              src={product.imagen}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Leaf size={48} className="text-[oklch(0.72_0.06_148)] opacity-40" />
            </div>
          )}
          {product.destacado === 1 && (
            <div className="absolute top-3 left-3 bg-[oklch(0.52_0.08_148)] text-white text-[0.6rem] font-body uppercase tracking-widest px-2 py-0.5 flex items-center gap-1">
              <Star size={9} fill="currentColor" /> Destacado
            </div>
          )}
          <div className={`absolute top-3 right-3 text-[0.6rem] font-body uppercase tracking-wider px-2 py-0.5 ${TIPO_COLORS[product.tipoProducto] ?? TIPO_COLORS.aceite}`}>
            {TIPO_LABELS[product.tipoProducto] ?? product.tipoProducto}
          </div>
        </div>
      </Link>

      {/* Contenido */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <Link href={`/aceites-esenciales/${product.slug}`}>
          <h3 className="font-display text-base text-[oklch(0.18_0.018_55)] group-hover:text-[oklch(0.42_0.08_148)] transition-colors leading-snug">
            {product.name}
          </h3>
        </Link>

        {/* Beneficios */}
        {beneficios.length > 0 && (
          <ul className="space-y-1 flex-1">
            {beneficios.map((b, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs font-body text-[oklch(0.42_0.02_55)]">
                <span className="text-[oklch(0.52_0.08_148)] mt-0.5 flex-shrink-0">✦</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Botones */}
        <div className="flex gap-2 pt-1">
          <Link href={`/aceites-esenciales/${product.slug}`} className="flex-1">
            <button className="w-full text-xs font-body uppercase tracking-wider border border-[oklch(0.72_0.06_148)] text-[oklch(0.42_0.08_148)] hover:bg-[oklch(0.95_0.02_148)] transition-colors px-3 py-2">
              Ver detalle
            </button>
          </Link>
          <button
            onClick={handleToggleCart}
            className={`flex-1 text-xs font-body uppercase tracking-wider px-3 py-2 transition-colors flex items-center justify-center gap-1.5 ${
              inCart
                ? "bg-[oklch(0.52_0.08_148)] text-white hover:bg-[oklch(0.42_0.08_148)]"
                : "bg-[oklch(0.18_0.018_55)] text-white hover:bg-[oklch(0.28_0.018_55)]"
            }`}
          >
            {inCart ? <Check size={12} /> : <ShoppingBag size={12} />}
            {inCart ? "Añadido" : "Consultar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AceitesEsenciales() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const { count } = useConsultaCart();

  const { data: categories = [], isLoading: loadingCats } = trpc.oils.listCategories.useQuery();
  const { data: products = [], isLoading: loadingProds } = trpc.oils.listProducts.useQuery({
    category: activeCategory || undefined,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return products.filter((p) =>
      p.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(q) ||
      parseJsonArray(p.tags).some((t) => t.toLowerCase().includes(q))
    );
  }, [products, search]);

  const isLoading = loadingCats || loadingProds;

  return (
    <Layout>
      {/* ─── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative bg-[oklch(0.14_0.018_55)] text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 text-[oklch(0.72_0.06_148)] text-xs font-body uppercase tracking-[0.2em]">
              <Leaf size={12} />
              <span>Aromaterapia terapéutica</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl leading-tight">
              Aceites Esenciales<br />
              <span className="text-[oklch(0.72_0.06_148)]">con propósito</span>
            </h1>
            <p className="font-body text-[oklch(0.78_0.01_80)] text-lg leading-relaxed max-w-md">
              Los aceites esenciales son herramientas terapéuticas potentes.
              Su uso correcto requiere personalización profesional.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/consultas">
                <Button className="bg-[oklch(0.52_0.08_148)] hover:bg-[oklch(0.42_0.08_148)] text-white font-body text-xs uppercase tracking-wider px-6 py-3 h-auto gap-2" style={{ borderRadius: 0 }}>
                  Reservar consulta con Cristina <ArrowRight size={14} />
                </Button>
              </Link>
              {count > 0 && (
                <Link href="/mi-consulta">
                  <Button variant="outline" className="border-[oklch(0.52_0.08_148)] text-[oklch(0.72_0.06_148)] hover:bg-[oklch(0.52_0.08_148)] hover:text-white font-body text-xs uppercase tracking-wider px-6 py-3 h-auto gap-2" style={{ borderRadius: 0 }}>
                    <ShoppingBag size={14} />
                    Mi consulta ({count})
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Bloque de autoridad */}
          <div className="bg-white/5 border border-white/10 p-6 space-y-4">
            <p className="font-display text-lg text-[oklch(0.92_0.01_80)]">
              "Cada aceite tiene su momento, su dosis y su persona."
            </p>
            <p className="font-body text-sm text-[oklch(0.68_0.01_80)] leading-relaxed">
              Como terapeuta holística certificada, acompaño a cada persona en el uso consciente y seguro de los aceites esenciales. No existe una fórmula universal: existe la tuya.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <div className="w-10 h-10 rounded-full bg-[oklch(0.52_0.08_148)] flex items-center justify-center text-white font-display text-sm">C</div>
              <div>
                <p className="font-body text-sm font-medium text-white">Cristina</p>
                <p className="font-body text-xs text-[oklch(0.68_0.01_80)]">Terapeuta holística · Aromaterapia</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── AVISO TERAPÉUTICO ────────────────────────────────────────────── */}
      <div className="bg-[oklch(0.96_0.02_148)] border-y border-[oklch(0.88_0.04_148)]">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-3">
          <Leaf size={14} className="text-[oklch(0.42_0.08_148)] flex-shrink-0" />
          <p className="font-body text-xs text-[oklch(0.38_0.06_148)]">
            <strong>Catálogo educativo:</strong> Este espacio no permite compra directa. Los aceites esenciales son herramientas terapéuticas que requieren orientación profesional. Añade los que te interesen a tu consulta y Cristina te guiará personalmente.
          </p>
        </div>
      </div>

      {/* ─── FILTROS ──────────────────────────────────────────────────────── */}
      <section className="bg-[oklch(0.98_0.004_80)] border-b border-[oklch(0.92_0.01_80)] sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 space-y-3">
          <div className="relative max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[oklch(0.52_0.04_80)]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o uso (ej: ansiedad, sueño, digestivo...)"
              className="pl-9 font-body text-sm bg-white border-[oklch(0.88_0.01_80)]"
              style={{ borderRadius: 0 }}
            />
          </div>

          {!loadingCats && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveCategory("")}
                className={`text-xs font-body uppercase tracking-wider px-3 py-1.5 transition-colors ${
                  !activeCategory
                    ? "bg-[oklch(0.18_0.018_55)] text-white"
                    : "bg-white border border-[oklch(0.88_0.01_80)] text-[oklch(0.42_0.02_55)] hover:border-[oklch(0.52_0.08_148)]"
                }`}
                style={{ borderRadius: 0 }}
              >
                Todos ({products.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.slug)}
                  className={`text-xs font-body uppercase tracking-wider px-3 py-1.5 transition-colors flex items-center gap-1.5 ${
                    activeCategory === cat.slug
                      ? "bg-[oklch(0.52_0.08_148)] text-white"
                      : "bg-white border border-[oklch(0.88_0.01_80)] text-[oklch(0.42_0.02_55)] hover:border-[oklch(0.52_0.08_148)]"
                  }`}
                  style={{ borderRadius: 0 }}
                >
                  <span>{cat.icon}</span>
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── GRID DE PRODUCTOS ────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        {count > 0 && (
          <div className="mb-8 bg-[oklch(0.96_0.02_148)] border border-[oklch(0.88_0.04_148)] px-5 py-3 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-sm font-body text-[oklch(0.38_0.06_148)]">
              <ShoppingBag size={16} className="text-[oklch(0.52_0.08_148)]" />
              <span>Tienes <strong>{count} producto{count !== 1 ? "s" : ""}</strong> en tu consulta personalizada</span>
            </div>
            <Link href="/mi-consulta">
              <button className="text-xs font-body uppercase tracking-wider bg-[oklch(0.52_0.08_148)] text-white px-4 py-2 hover:bg-[oklch(0.42_0.08_148)] transition-colors flex items-center gap-1.5" style={{ borderRadius: 0 }}>
                Solicitar consulta <ArrowRight size={12} />
              </button>
            </Link>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={32} className="animate-spin text-[oklch(0.52_0.08_148)]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <Leaf size={40} className="mx-auto text-[oklch(0.72_0.06_148)] opacity-40" />
            <p className="font-body text-[oklch(0.52_0.04_80)]">
              No hay productos con esa búsqueda. Prueba con otro término.
            </p>
            <button
              onClick={() => { setSearch(""); setActiveCategory(""); }}
              className="text-xs font-body uppercase tracking-wider text-[oklch(0.52_0.08_148)] underline"
            >
              Ver todos los productos
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs font-body text-[oklch(0.52_0.04_80)] mb-6 uppercase tracking-wider">
              {filtered.length} producto{filtered.length !== 1 ? "s" : ""}
              {activeCategory && ` · ${categories.find((c) => c.slug === activeCategory)?.name}`}
              {search && ` · "${search}"`}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </>
        )}
      </section>

      {/* ─── CTA FINAL ────────────────────────────────────────────────────── */}
      <section className="bg-[oklch(0.14_0.018_55)] text-white py-16">
        <div className="max-w-3xl mx-auto px-6 text-center space-y-6">
          <Leaf size={32} className="mx-auto text-[oklch(0.72_0.06_148)]" />
          <h2 className="font-display text-3xl">¿No sabes por dónde empezar?</h2>
          <p className="font-body text-[oklch(0.78_0.01_80)] text-lg leading-relaxed">
            Añade los aceites que te llaman la atención a tu consulta y Cristina te orientará sobre cuáles son los más adecuados para ti, cómo usarlos y en qué orden.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/consultas">
              <Button className="bg-[oklch(0.52_0.08_148)] hover:bg-[oklch(0.42_0.08_148)] text-white font-body text-xs uppercase tracking-wider px-8 py-3 h-auto gap-2" style={{ borderRadius: 0 }}>
                Reservar consulta con Cristina <ArrowRight size={14} />
              </Button>
            </Link>
            {count > 0 && (
              <Link href="/mi-consulta">
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 font-body text-xs uppercase tracking-wider px-8 py-3 h-auto gap-2" style={{ borderRadius: 0 }}>
                  <ShoppingBag size={14} />
                  Ver mi consulta ({count})
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
