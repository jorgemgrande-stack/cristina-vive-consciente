/**
 * Home — Cristina Vive Consciente
 * Design: "Luz Botánica" — Art Nouveau depurado + Minimalismo escandinavo
 * Secciones: Hero, Servicios, Sobre Mí, Filosofía, Testimonios, CTA
 */

import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Leaf, Droplets, BookOpen, Star, ChevronRight, Calendar, Clock } from "lucide-react";
import Layout from "@/components/Layout";
import BookingModal from "@/components/BookingModal";
import { trpc } from "@/lib/trpc";

const HERO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/hero-main-T6UmVzyg8XHyq4zLvU5RfZ.webp";
const CONSULTAS_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/hero-consultas-VRAFvns5UX68Kqd64cBawH.webp";
const MASAJES_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/hero-masajes-PUiFsGVb8gAs6i4s8VF7U8.webp";
const ACEITES_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/hero-aceites-cn5cmPNwkFkzA35ejtXJUa.webp";
const AGUA_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/hero-agua-BJHXyW4FibywwKgaqzvu2q.webp";

const services = [
  {
    href: "/consultas",
    title: "Consultas Holísticas",
    description: "Sesiones personalizadas para guiarte hacia el equilibrio físico, emocional y espiritual.",
    img: CONSULTAS_IMG,
    icon: <Leaf size={18} />,
    tag: "Bienestar integral",
  },
  {
    href: "/masajes",
    title: "Masajes Terapéuticos",
    description: "Técnicas naturales que liberan tensiones y restauran la armonía de tu cuerpo.",
    img: MASAJES_IMG,
    icon: <Star size={18} />,
    tag: "Terapia corporal",
  },
  {
    href: "/sistemas-agua",
    title: "Sistemas de Agua",
    description: "Soluciones para purificar y vitalizar el agua que bebes cada día.",
    img: AGUA_IMG,
    icon: <Droplets size={18} />,
    tag: "Agua viva",
  },
  {
    href: "/aceites-esenciales",
    title: "Aceites Esenciales",
    description: "La sabiduría de las plantas en su forma más pura para tu bienestar diario.",
    img: ACEITES_IMG,
    icon: <Leaf size={18} />,
    tag: "Aromaterapia",
  },
];

const values = [
  {
    number: "01",
    title: "Consciencia",
    text: "Cada decisión que tomamos sobre nuestra salud es un acto de amor propio. Te acompaño a despertar esa consciencia.",
  },
  {
    number: "02",
    title: "Naturaleza",
    text: "Los remedios más poderosos están en la naturaleza. Aprendo a escucharla y a integrarla en tu vida cotidiana.",
  },
  {
    number: "03",
    title: "Integralidad",
    text: "El cuerpo, la mente y el espíritu son uno. Mi enfoque holístico atiende a la persona en su totalidad.",
  },
];

const testimonials = [
  {
    text: "Cristina cambió mi relación con mi cuerpo. Sus consultas me dieron herramientas que uso cada día para sentirme mejor.",
    author: "María L.",
    role: "Clienta de consultas",
  },
  {
    text: "Los masajes son una experiencia transformadora. Salgo completamente renovada, como si hubiera descansado días enteros.",
    author: "Ana G.",
    role: "Clienta de masajes",
  },
  {
    text: "Gracias a los aceites esenciales y las guías de Cristina, mi familia vive de forma mucho más natural y consciente.",
    author: "Laura M.",
    role: "Clienta de aceites",
  },
];

const BLOG_FALLBACK = "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80";

export default function Home() {
  const [bookingOpen, setBookingOpen] = useState(false);

  const { data: latestPosts = [] } = trpc.blog.list.useQuery(
    { limit: 3 },
    { staleTime: 5 * 60 * 1000 }
  );

  return (
    <>
    <BookingModal isOpen={bookingOpen} onClose={() => setBookingOpen(false)} />
    <Layout>
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={HERO_IMG}
            alt="Cristina Vive Consciente — Bienestar Holístico"
            className="w-full h-full object-cover object-center"
          />
          {/* Gradient overlay — dark left, transparent right */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(105deg, oklch(0.18 0.018 55 / 0.75) 0%, oklch(0.18 0.018 55 / 0.45) 50%, oklch(0.18 0.018 55 / 0.15) 100%)",
            }}
          />
        </div>

        {/* Content */}
        <div className="container relative z-10 pt-28 pb-20">
          <div className="max-w-xl">
            {/* Eyebrow */}
            <p
              className="text-[oklch(0.72_0.06_148)] text-xs tracking-[0.25em] uppercase mb-6 font-body"
              style={{ fontWeight: 400 }}
            >
              Bienestar holístico natural
            </p>

            {/* Headline */}
            <h1
              className="text-white mb-6 font-display leading-[1.08]"
              style={{ fontWeight: 400 }}
            >
              Vive con
              <br />
              <em className="text-[oklch(0.82_0.06_80)]" style={{ fontStyle: "italic" }}>
                consciencia
              </em>
              <br />
              y naturaleza
            </h1>

            {/* Subtext */}
            <p className="text-white/75 text-base md:text-lg mb-10 font-body leading-relaxed" style={{ fontWeight: 300 }}>
              Consultas holísticas, masajes terapéuticos y productos naturales para guiarte hacia tu bienestar más profundo.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setBookingOpen(true)}
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-medium hover:bg-[oklch(0.38_0.07_148)] transition-all duration-350 font-body"
                style={{ borderRadius: 0, letterSpacing: "0.1em" }}
              >
                Reservar consulta
                <ArrowRight size={14} />
              </button>
              <Link
                href="/consultas"
                className="inline-flex items-center gap-2 px-7 py-3.5 border border-white/60 text-white text-xs tracking-widest uppercase font-medium hover:bg-white/10 transition-all duration-350 font-body no-underline"
                style={{ borderRadius: 0, letterSpacing: "0.1em" }}
              >
                Conocer servicios
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <div className="w-px h-12 bg-white/30 animate-pulse" />
          <span className="text-white/50 text-[0.6rem] tracking-widest uppercase font-body">Scroll</span>
        </div>
      </section>

      {/* ── INTRO STRIP ──────────────────────────────────────── */}
      <section className="bg-[oklch(0.52_0.08_148)] py-5">
        <div className="container">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-2">
            {["Consultas Holísticas", "Masajes Terapéuticos", "Sistemas de Agua", "Aceites Esenciales", "Guías Digitales"].map(
              (item, i) => (
                <span
                  key={i}
                  className="text-white/90 text-xs tracking-widest uppercase font-body"
                  style={{ fontWeight: 400, letterSpacing: "0.12em" }}
                >
                  {i > 0 && <span className="mr-10 text-white/40">·</span>}
                  {item}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* ── SERVICES ─────────────────────────────────────────── */}
      <section className="section-padding bg-[oklch(0.985_0.006_85)]">
        <div className="container">
          {/* Section Header */}
          <div className="max-w-lg mb-16">
            <p
              className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-4 font-body"
              style={{ fontWeight: 500 }}
            >
              Mis servicios
            </p>
            <h2 className="font-display text-[oklch(0.18_0.018_55)] mb-4" style={{ fontWeight: 400 }}>
              Un camino hacia tu bienestar integral
            </h2>
            <div className="section-divider" />
            <p className="text-[oklch(0.52_0.02_60)] leading-relaxed font-body mt-4" style={{ fontWeight: 300 }}>
              Cada servicio está diseñado para nutrir cuerpo, mente y espíritu desde la sabiduría de la naturaleza.
            </p>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {services.map((service, i) => (
              <Link
                key={service.href}
                href={service.href}
                className="group card-natural overflow-hidden block no-underline"
                style={{ textDecoration: "none" }}
              >
                {/* Image */}
                <div className="relative overflow-hidden" style={{ aspectRatio: "16/9" }}>
                  <img
                    src={service.img}
                    alt={service.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.18_0.018_55)]/40 to-transparent" />
                  {/* Tag */}
                  <span
                    className="absolute top-4 left-4 px-3 py-1 bg-[oklch(0.985_0.006_85)]/90 text-[oklch(0.52_0.08_148)] text-[0.65rem] tracking-widest uppercase font-body"
                    style={{ fontWeight: 500, letterSpacing: "0.12em" }}
                  >
                    {service.tag}
                  </span>
                </div>

                {/* Content */}
                <div className="p-6 md:p-7">
                  <h3
                    className="font-display text-[oklch(0.18_0.018_55)] mb-2 group-hover:text-[oklch(0.52_0.08_148)] transition-colors duration-300"
                    style={{ fontWeight: 400, fontSize: "1.25rem" }}
                  >
                    {service.title}
                  </h3>
                  <p className="text-[oklch(0.52_0.02_60)] text-sm leading-relaxed mb-4 font-body" style={{ fontWeight: 300 }}>
                    {service.description}
                  </p>
                  <span
                    className="inline-flex items-center gap-1.5 text-[oklch(0.52_0.08_148)] text-xs tracking-widest uppercase font-body"
                    style={{ fontWeight: 500, letterSpacing: "0.1em" }}
                  >
                    Descubrir
                    <ChevronRight size={13} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* More Services */}
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/guias-digitales"
              className="btn-outline text-sm"
              style={{ textDecoration: "none" }}
            >
              <BookOpen size={15} />
              Guías Digitales
            </Link>
            <Link
              href="/recomendados"
              className="btn-outline text-sm"
              style={{ textDecoration: "none" }}
            >
              <Star size={15} />
              Productos Recomendados
            </Link>
          </div>
        </div>
      </section>

      {/* ── ABOUT / FILOSOFÍA ────────────────────────────────── */}
      <section className="section-padding bg-[oklch(0.94_0.012_80)]">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Image Side */}
            <div className="relative">
              <div className="relative overflow-hidden" style={{ aspectRatio: "4/5" }}>
                <img
                  src="https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/cristina-sobre-mi_45486ba2.png"
                  alt="Cristina — Bienestar Holístico"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              {/* Floating accent */}
              <div
                className="absolute -bottom-4 -right-4 w-32 h-32 bg-[oklch(0.52_0.08_148)]/10 border border-[oklch(0.52_0.08_148)]/20"
                style={{ zIndex: -1 }}
              />
            </div>

            {/* Text Side */}
            <div>
              <p
                className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-4 font-body"
                style={{ fontWeight: 500 }}
              >
                Sobre mí
              </p>
              <h2 className="font-display text-[oklch(0.18_0.018_55)] mb-2" style={{ fontWeight: 400 }}>
                Cristina,
              </h2>
              <h2
                className="font-display text-[oklch(0.52_0.08_148)] mb-6"
                style={{ fontWeight: 400, fontStyle: "italic" }}
              >
                tu guía de bienestar
              </h2>
              <div className="section-divider" />
              <p className="text-[oklch(0.28_0.025_55)] leading-relaxed mb-5 font-body mt-6" style={{ fontWeight: 300 }}>
                Soy terapeuta holística con años de experiencia acompañando a personas en su camino hacia una vida más consciente y natural. Mi misión es ofrecerte herramientas prácticas y conocimiento profundo para que puedas transformar tu salud desde adentro.
              </p>
              <p className="text-[oklch(0.28_0.025_55)] leading-relaxed mb-8 font-body" style={{ fontWeight: 300 }}>
                Creo profundamente en el poder de la naturaleza y en la capacidad innata del cuerpo para sanar cuando le damos las condiciones adecuadas.
              </p>
              <Link
                href="/contacto"
                className="btn-primary text-xs"
                style={{ textDecoration: "none" }}
              >
                Conectar conmigo
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── VALORES ──────────────────────────────────────────── */}
      <section className="section-padding bg-[oklch(0.985_0.006_85)]">
        <div className="container">
          <div className="text-center max-w-lg mx-auto mb-16">
            <p
              className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-4 font-body"
              style={{ fontWeight: 500 }}
            >
              Mi filosofía
            </p>
            <h2 className="font-display text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 400 }}>
              Los pilares de mi práctica
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {values.map((v) => (
              <div key={v.number} className="relative">
                <span
                  className="block font-display text-[oklch(0.88_0.04_75)] mb-4"
                  style={{ fontSize: "3.5rem", fontWeight: 400, lineHeight: 1 }}
                >
                  {v.number}
                </span>
                <h3
                  className="font-display text-[oklch(0.18_0.018_55)] mb-3"
                  style={{ fontWeight: 500, fontSize: "1.3rem" }}
                >
                  {v.title}
                </h3>
                <div className="w-8 h-px bg-[oklch(0.52_0.08_148)] mb-4" />
                <p className="text-[oklch(0.52_0.02_60)] text-sm leading-relaxed font-body" style={{ fontWeight: 300 }}>
                  {v.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BLOG PREVIEW ─────────────────────────────────────── */}
      {latestPosts.length > 0 && (
        <section className="section-padding bg-[oklch(0.97_0.008_85)]">
          <div className="container">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
              <div>
                <p
                  className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-3 font-body"
                  style={{ fontWeight: 500 }}
                >
                  Del blog
                </p>
                <h2 className="font-display text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 400 }}>
                  Últimas reflexiones
                </h2>
              </div>
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-[oklch(0.52_0.08_148)] text-sm font-body no-underline hover:gap-3 transition-all group"
                style={{ fontWeight: 500 }}
              >
                Ver todos los artículos
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {latestPosts.map((post) => {
                const displayDate = (post as any).writtenAt || post.publishedAt || post.createdAt;
                const dateStr = new Date(displayDate).toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                });
                return (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="group block no-underline"
                  >
                    <article className="bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 h-full flex flex-col">
                      {/* Image */}
                      <div className="relative overflow-hidden" style={{ aspectRatio: "16/9" }}>
                        <img
                          src={post.coverImage || BLOG_FALLBACK}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {post.categoryName && (
                          <span
                            className="absolute top-3 left-3 text-[oklch(0.52_0.08_148)] text-[10px] tracking-[0.15em] uppercase font-body px-2.5 py-1 bg-white/90 backdrop-blur-sm"
                            style={{ fontWeight: 600 }}
                          >
                            {post.categoryName}
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-6 flex flex-col flex-1">
                        <h3
                          className="font-display text-[oklch(0.18_0.018_55)] mb-3 leading-snug group-hover:text-[oklch(0.38_0.07_148)] transition-colors"
                          style={{ fontWeight: 500, fontSize: "1.1rem" }}
                        >
                          {post.title}
                        </h3>

                        {post.excerpt && (
                          <p
                            className="text-[oklch(0.52_0.02_60)] text-sm leading-relaxed font-body mb-4 flex-1"
                            style={{ fontWeight: 300 }}
                          >
                            {post.excerpt.length > 110
                              ? post.excerpt.slice(0, 110) + "…"
                              : post.excerpt}
                          </p>
                        )}

                        {/* Meta footer */}
                        <div className="flex items-center gap-4 mt-auto pt-4 border-t border-[oklch(0.92_0.01_75)] text-[oklch(0.60_0.02_60)] text-xs font-body">
                          <span className="flex items-center gap-1.5">
                            <Calendar size={11} />
                            {dateStr}
                          </span>
                          {post.readTimeMinutes && (
                            <span className="flex items-center gap-1.5">
                              <Clock size={11} />
                              {post.readTimeMinutes} min
                            </span>
                          )}
                          <span className="ml-auto flex items-center gap-1 text-[oklch(0.52_0.08_148)] font-medium group-hover:gap-2 transition-all">
                            Leer
                            <ArrowRight size={11} />
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>

            {/* Bottom CTA */}
            <div className="text-center mt-10">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 border border-[oklch(0.52_0.08_148)] text-[oklch(0.52_0.08_148)] px-8 py-3 text-sm font-body no-underline hover:bg-[oklch(0.52_0.08_148)] hover:text-white transition-all duration-300"
                style={{ fontWeight: 500 }}
              >
                Explorar todos los artículos
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── TESTIMONIALS ─────────────────────────────────────── */}
      <section className="section-padding bg-[oklch(0.18_0.018_55)]">
        <div className="container">
          <div className="text-center max-w-lg mx-auto mb-14">
            <p
              className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-4 font-body"
              style={{ fontWeight: 500 }}
            >
              Testimonios
            </p>
            <h2 className="font-display text-white" style={{ fontWeight: 400 }}>
              Lo que dicen mis clientas
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="p-7 border border-[oklch(0.28_0.01_55)] hover:border-[oklch(0.52_0.08_148)]/40 transition-colors duration-300"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-5">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={12} fill="oklch(0.72 0.06 65)" color="oklch(0.72 0.06 65)" />
                  ))}
                </div>
                <p
                  className="text-[oklch(0.88_0.015_75)] text-sm leading-relaxed mb-6 font-display"
                  style={{ fontStyle: "italic", fontWeight: 400 }}
                >
                  "{t.text}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-px bg-[oklch(0.52_0.08_148)]" />
                  <div>
                    <p className="text-white text-sm font-body" style={{ fontWeight: 500 }}>
                      {t.author}
                    </p>
                    <p className="text-[oklch(0.52_0.02_60)] text-xs font-body" style={{ fontWeight: 300 }}>
                      {t.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────── */}
      <section className="section-padding bg-[oklch(0.94_0.012_80)]">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <p
              className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-4 font-body"
              style={{ fontWeight: 500 }}
            >
              Empieza hoy
            </p>
            <h2 className="font-display text-[oklch(0.18_0.018_55)] mb-4" style={{ fontWeight: 400 }}>
              ¿Lista para vivir
              <em style={{ fontStyle: "italic" }}> conscientemente</em>?
            </h2>
            <div className="section-divider mx-auto" />
            <p className="text-[oklch(0.52_0.02_60)] leading-relaxed mb-10 mt-6 font-body" style={{ fontWeight: 300 }}>
              Da el primer paso hacia una vida más natural, equilibrada y plena. Estoy aquí para acompañarte en cada etapa de tu camino.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={() => setBookingOpen(true)}
                className="btn-primary"
              >
                Reservar consulta
                <ArrowRight size={15} />
              </button>
              <Link
                href="/contacto"
                className="btn-outline"
                style={{ textDecoration: "none" }}
              >
                Escribirme
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
    </>
  );
}
