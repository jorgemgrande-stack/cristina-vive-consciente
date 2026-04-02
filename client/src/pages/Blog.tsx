/**
 * Blog — Cristina Vive Consciente
 * Design: "Luz Botánica"
 * Listado de artículos con estructura visual
 */

import { ArrowRight, Clock, Tag } from "lucide-react";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import PageHero from "@/components/PageHero";

const HERO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/hero-main-T6UmVzyg8XHyq4zLvU5RfZ.webp";

const categories = ["Todos", "Aceites Esenciales", "Nutrición", "Bienestar", "Agua", "Masajes", "Estilo de vida"];

const posts = [
  {
    title: "5 aceites esenciales que no pueden faltar en tu hogar",
    excerpt: "Descubre los aceites esenciales más versátiles y cómo integrarlos en tu rutina diaria para mejorar tu bienestar.",
    category: "Aceites Esenciales",
    readTime: "5 min",
    date: "15 Mar 2025",
    featured: true,
    img: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&q=80",
  },
  {
    title: "Por qué el agua que bebes importa más de lo que crees",
    excerpt: "La calidad del agua tiene un impacto directo en tu salud. Te explico qué contiene el agua del grifo y cómo mejorarla.",
    category: "Agua",
    readTime: "7 min",
    date: "2 Mar 2025",
    featured: true,
    img: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=800&q=80",
  },
  {
    title: "Cómo crear una rutina matutina que transforme tu día",
    excerpt: "Una mañana consciente sienta las bases para un día equilibrado. Te comparto mi rutina y cómo adaptarla a ti.",
    category: "Estilo de vida",
    readTime: "6 min",
    date: "18 Feb 2025",
    featured: false,
    img: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80",
  },
  {
    title: "Los beneficios del masaje terapéutico que no conocías",
    excerpt: "Más allá de la relajación, el masaje terapéutico tiene efectos profundos sobre el sistema nervioso y el sistema inmune.",
    category: "Masajes",
    readTime: "5 min",
    date: "5 Feb 2025",
    featured: false,
    img: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80",
  },
  {
    title: "Alimentación anti-inflamatoria: guía práctica",
    excerpt: "La inflamación crónica está detrás de muchas enfermedades modernas. Aprende a combatirla con tu alimentación.",
    category: "Nutrición",
    readTime: "8 min",
    date: "22 Ene 2025",
    featured: false,
    img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
  },
  {
    title: "Lavanda: el aceite esencial de la calma y el sueño",
    excerpt: "Todo lo que necesitas saber sobre el aceite esencial de lavanda: sus propiedades, usos y cómo integrarlo en tu vida.",
    category: "Aceites Esenciales",
    readTime: "4 min",
    date: "10 Ene 2025",
    featured: false,
    img: "https://images.unsplash.com/photo-1499002238440-d264edd596ec?w=800&q=80",
  },
];

export default function Blog() {
  return (
    <Layout>
      <PageHero
        title="Blog"
        subtitle="Artículos, reflexiones y herramientas para tu camino hacia el bienestar consciente."
        tag="Conocimiento"
        image={HERO}
        breadcrumb={[{ label: "Inicio", href: "/" }, { label: "Blog" }]}
      />

      {/* Categories Filter */}
      <section className="py-8 bg-[oklch(0.985_0.006_85)] border-b border-[oklch(0.88_0.015_75)]">
        <div className="container">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat, i) => (
              <button
                key={cat}
                onClick={() => toast.info("Próximamente: filtro por categorías")}
                className={`px-4 py-1.5 text-xs tracking-widest uppercase font-body transition-all duration-200 ${
                  i === 0
                    ? "bg-[oklch(0.52_0.08_148)] text-white"
                    : "border border-[oklch(0.88_0.015_75)] text-[oklch(0.52_0.02_60)] hover:border-[oklch(0.52_0.08_148)] hover:text-[oklch(0.52_0.08_148)]"
                }`}
                style={{ borderRadius: 0, fontWeight: 400, letterSpacing: "0.1em" }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      <section className="section-padding bg-[oklch(0.985_0.006_85)]">
        <div className="container">
          {/* Featured Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            {posts
              .filter((p) => p.featured)
              .map((post) => (
                <button
                  key={post.title}
                  onClick={() => toast.info("Próximamente: artículo completo")}
                  className="group card-natural overflow-hidden text-left w-full"
                >
                  {/* Image */}
                  <div className="blog-card-img">
                    <img src={post.img} alt={post.title} />
                  </div>

                  {/* Content */}
                  <div className="p-6 md:p-7">
                    <div className="flex items-center gap-3 mb-3">
                      <span
                        className="flex items-center gap-1 text-[oklch(0.52_0.08_148)] text-[0.65rem] tracking-widest uppercase font-body"
                        style={{ fontWeight: 500 }}
                      >
                        <Tag size={10} />
                        {post.category}
                      </span>
                      <span className="text-[oklch(0.72_0.02_60)] text-[0.65rem] font-body" style={{ fontWeight: 300 }}>
                        ·
                      </span>
                      <span className="flex items-center gap-1 text-[oklch(0.72_0.02_60)] text-[0.65rem] font-body" style={{ fontWeight: 300 }}>
                        <Clock size={10} />
                        {post.readTime}
                      </span>
                    </div>
                    <h3
                      className="font-display text-[oklch(0.18_0.018_55)] mb-2 group-hover:text-[oklch(0.52_0.08_148)] transition-colors duration-300"
                      style={{ fontWeight: 400, fontSize: "1.2rem" }}
                    >
                      {post.title}
                    </h3>
                    <p className="text-[oklch(0.52_0.02_60)] text-sm leading-relaxed mb-4 font-body" style={{ fontWeight: 300 }}>
                      {post.excerpt}
                    </p>
                    <span
                      className="inline-flex items-center gap-1.5 text-[oklch(0.52_0.08_148)] text-xs tracking-widest uppercase font-body"
                      style={{ fontWeight: 500, letterSpacing: "0.1em" }}
                    >
                      Leer artículo
                      <ArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </div>
                </button>
              ))}
          </div>

          {/* All Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {posts
              .filter((p) => !p.featured)
              .map((post) => (
                <button
                  key={post.title}
                  onClick={() => toast.info("Próximamente: artículo completo")}
                  className="group card-natural overflow-hidden text-left w-full"
                >
                  {/* Image */}
                  <div className="blog-card-img">
                    <img src={post.img} alt={post.title} />
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="text-[oklch(0.52_0.08_148)] text-[0.6rem] tracking-widest uppercase font-body"
                        style={{ fontWeight: 500 }}
                      >
                        {post.category}
                      </span>
                      <span className="text-[oklch(0.72_0.02_60)] text-[0.6rem]">·</span>
                      <span className="text-[oklch(0.72_0.02_60)] text-[0.6rem] font-body flex items-center gap-1" style={{ fontWeight: 300 }}>
                        <Clock size={9} />
                        {post.readTime}
                      </span>
                    </div>
                    <h3
                      className="font-display text-[oklch(0.18_0.018_55)] mb-2 group-hover:text-[oklch(0.52_0.08_148)] transition-colors duration-300"
                      style={{ fontWeight: 400, fontSize: "1.05rem", lineHeight: 1.3 }}
                    >
                      {post.title}
                    </h3>
                    <p className="text-[oklch(0.52_0.02_60)] text-xs leading-relaxed font-body" style={{ fontWeight: 300 }}>
                      {post.excerpt.substring(0, 90)}...
                    </p>
                  </div>
                </button>
              ))}
          </div>

          {/* Load More */}
          <div className="text-center mt-12">
            <button
              onClick={() => toast.info("Próximamente: más artículos")}
              className="btn-outline"
            >
              Ver más artículos
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="section-padding bg-[oklch(0.94_0.012_80)]">
        <div className="container">
          <div className="max-w-xl mx-auto text-center">
            <p className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-4 font-body" style={{ fontWeight: 500 }}>
              Newsletter
            </p>
            <h2 className="font-display text-[oklch(0.18_0.018_55)] mb-4" style={{ fontWeight: 400 }}>
              Recibe mis artículos
              <em style={{ fontStyle: "italic" }}> en tu email</em>
            </h2>
            <div className="section-divider mx-auto" />
            <p className="text-[oklch(0.52_0.02_60)] mb-8 mt-5 font-body" style={{ fontWeight: 300 }}>
              Únete a mi comunidad y recibe artículos, consejos y recursos exclusivos sobre bienestar natural.
            </p>
            <div className="flex gap-0 max-w-sm mx-auto">
              <input
                type="email"
                placeholder="Tu email"
                className="flex-1 px-4 py-3 bg-white border border-[oklch(0.88_0.015_75)] border-r-0 text-[oklch(0.18_0.018_55)] text-sm placeholder-[oklch(0.72_0.02_60)] focus:outline-none focus:border-[oklch(0.52_0.08_148)] font-body"
                style={{ borderRadius: 0, fontWeight: 300 }}
              />
              <button
                onClick={() => toast.info("Próximamente: suscripción al newsletter")}
                className="px-5 py-3 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-medium hover:bg-[oklch(0.38_0.07_148)] transition-colors duration-300 font-body whitespace-nowrap"
                style={{ borderRadius: 0, letterSpacing: "0.08em" }}
              >
                Suscribirme
              </button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
