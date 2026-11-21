/**
 * Home — Cristina Vive Consciente
 * Design: "Luz Botánica" — Art Nouveau depurado + Minimalismo escandinavo
 * Secciones: Hero, Servicios, Sobre Mí, Filosofía, Testimonios, CTA
 */

import { SITE_IMAGES } from "@/lib/siteImages";
import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Leaf, Droplets, BookOpen, Star, ChevronRight, Calendar, Clock, CheckCircle } from "lucide-react";
import Layout from "@/components/Layout";
import BookingModal from "@/components/BookingModal";
import HomeMasajes from "@/components/HomeMasajes";
import { HomeSlideshow, HomeWater, HomeBlog, HOME_SLIDESHOW_DEFAULTS } from "@/components/site/HomeSections";
import { trpc } from "@/lib/trpc";

const CONSULTAS_IMG = SITE_IMAGES.heroConsultas;
const MASAJES_IMG = SITE_IMAGES.heroMasajes;
const ACEITES_IMG = SITE_IMAGES.heroAceites;
const AGUA_IMG = SITE_IMAGES.heroAgua;

const services = [
  {
    href: "/consultas",
    title: "Consultas",
    description: "Sesiones personalizadas para guiarte hacia el equilibrio físico, emocional y espiritual.",
    img: CONSULTAS_IMG,
    icon: <Leaf size={18} />,
    tag: "Bienestar integral",
  },
  {
    href: "/masajes",
    title: "Masaje y equilibrio energético",
    description: "Un espacio de reconexión y calma para el sistema nervioso, favoreciendo el equilibrio entre cuerpo, mente y espíritu.",
    img: MASAJES_IMG,
    icon: <Star size={18} />,
    tag: "Terapia corporal",
  },
  {
    href: "/sistemas-agua",
    title: "Sistemas de Agua",
    description: "Asesoramiento en filtros. Soluciones para purificar y vitalizar el agua que bebes.",
    img: AGUA_IMG,
    icon: <Droplets size={18} />,
    tag: "Agua viva",
  },
  {
    href: "/aceites-esenciales",
    title: "Aceites Esenciales",
    description: "Descubre sus propiedades, usos y diferentes formas de incorporarlos de manera consciente a tu día a día.",
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


export default function Home() {
  const [bookingOpen, setBookingOpen] = useState(false);

  return (
    <>
    <BookingModal isOpen={bookingOpen} onClose={() => setBookingOpen(false)} />
    <Layout>
      {/* ── HERO ─────────────────────────────────────────────── */}
      <HomeSlideshow {...HOME_SLIDESHOW_DEFAULTS} onBook={() => setBookingOpen(true)} />

      {/* ── INTRO STRIP ──────────────────────────────────────── */}
      <section className="bg-[oklch(0.52_0.08_148)] py-5">
        <div className="container">
          <div className="flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-8 lg:gap-x-10 gap-y-2">
            {["Comprensión del síntoma", "Entorno y salud ambiental", "Educación para la salud", "Guías y recursos"].map(
              (item, i, arr) => (
                <span
                  key={i}
                  className="flex items-center gap-x-6 sm:gap-x-8 lg:gap-x-10 text-white/90 text-[0.65rem] sm:text-xs tracking-widest uppercase font-body"
                  style={{ fontWeight: 400, letterSpacing: "0.12em" }}
                >
                  {item}
                  {i < arr.length - 1 && <span className="text-white/40" aria-hidden="true">·</span>}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* ── MASAJES (primer módulo bajo el slideshow) ────────── */}
      <HomeMasajes />

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
            {services.map((service) => (
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
                  src={SITE_IMAGES.cristina}
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
                Soy Cristina Battistelli, naturópata y apasionada por la salud desde una visión integrativa.
              </p>
              <p className="text-[oklch(0.28_0.025_55)] leading-relaxed mb-5 font-body" style={{ fontWeight: 300 }}>
                Desde siempre he sido una buscadora, movida por una profunda curiosidad por la naturaleza, la salud y todo aquello que aún nos queda por comprender sobre el ser humano. Esa búsqueda me llevó a explorar la alimentación ecológica, la naturopatía y diferentes tradiciones de medicina ancestral, ampliando poco a poco mi forma de entender la salud y reforzando mi confianza en la capacidad del cuerpo humano para recuperar el equilibrio cuando se le ofrecen las condiciones adecuadas.
              </p>
              <p className="text-[oklch(0.28_0.025_55)] leading-relaxed mb-5 font-body" style={{ fontWeight: 300 }}>
                Lo que siempre ha sido una pasión acabó convirtiéndose en mi profesión. Desde entonces no he dejado de estudiar, formarme e integrar conocimientos que amplíen mi manera de entender la salud. Me gusta cuestionar, aprender de diferentes disciplinas y quedarme siempre con aquello que pueda aportar un valor real a las personas que acompaño.
              </p>
              <p className="text-[oklch(0.28_0.025_55)] leading-relaxed mb-5 font-body" style={{ fontWeight: 300 }}>
                Con el tiempo entendí que la salud no depende únicamente de la alimentación. En ella influyen muchos otros factores: el entorno en el que vivimos, los hábitos, el sistema nervioso, las emociones, la epigenética y la forma en la que cada persona vive su propia historia.
              </p>
              <p className="text-[oklch(0.28_0.025_55)] leading-relaxed mb-8 font-body" style={{ fontWeight: 300 }}>
                No creo en soluciones universales. Cada proceso es único, por eso acompaño a cada persona desde una visión global y diseño una hoja de ruta personalizada, adaptada a sus necesidades.
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

      {/* ── SISTEMAS DE AGUA ─────────────────────────────────── */}
      <HomeWater />

      {/* ── BLOG PREVIEW ─────────────────────────────────────── */}
      <HomeBlog />

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
