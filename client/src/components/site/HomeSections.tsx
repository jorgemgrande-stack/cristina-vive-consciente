/**
 * Módulos de la portada con datos propios (presentación de imágenes, sistemas de agua y blog), extraídos de Home.tsx para
 * que la portada de siempre y el bloque conectado del editor compartan el mismo código.
 */
import { SITE_IMAGES } from "@/lib/siteImages";
import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { ArrowRight, Droplets, Calendar, Clock, CheckCircle, ChevronRight, Star, Leaf, BookOpen } from "lucide-react";
import { ReservaModal as WaterReservaModal } from "@/pages/SistemasAgua";
import { trpc } from "@/lib/trpc";
import { ebookPath, matchesEbookSlug } from "@shared/ebookPage";
import { formatEurosFixed } from "@shared/orders";
import { PRINTED_STORY_EBOOK_SLUG, PRINTED_STORY_PRICE_CENTS } from "@shared/printedStory";

const HERO_IMG = SITE_IMAGES.heroMain;
const BLOG_FALLBACK = "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80";

export interface HomeSlideshowText { eyebrow: string; title: string; subtitle: string; primaryLabel: string; secondaryLabel: string; secondaryUrl: string }
export const HOME_SLIDESHOW_DEFAULTS: HomeSlideshowText = {
  eyebrow: "Consulta naturópata", title: "VIVE CONSCIENTE", subtitle: "Diseño hojas de ruta personalizadas para tu salud.",
  primaryLabel: "Reservar consulta", secondaryLabel: "Conocer servicios", secondaryUrl: "/consultas",
};

/** El cuento permanece visible mientras cambian las imágenes de la cabecera. */
function HomeStoryOffer() {
  const { data: ebooks } = trpc.ebooksAdmin.list.useQuery();
  const { data: printedOffer } = trpc.orders.printedStoryOffer.useQuery();
  const ebook = ebooks?.find((item) => matchesEbookSlug(PRINTED_STORY_EBOOK_SLUG, item.slug));
  if (!ebook) return null;

  const productPath = ebookPath(ebook.slug);
  const shadow = { textShadow: "0 1px 3px rgba(0,0,0,.55), 0 2px 18px rgba(0,0,0,.5)" };
  return (
    <div className="mt-8 flex items-center gap-4 text-[oklch(0.96_0.02_85)] lg:mt-0 lg:justify-self-end lg:gap-6" data-testid="home-story-offer">
      <div className="min-w-0 order-2 lg:order-none" style={shadow}>
        <p className="flex items-center gap-2.5 font-body uppercase text-[oklch(0.82_0.08_85)] text-[0.6rem] lg:text-xs tracking-[0.16em] mb-1.5 lg:mb-3">
          <span aria-hidden className="inline-block h-px w-5 lg:w-7 bg-current" />
          Un cuento ilustrado para toda la familia
        </p>
        <p className="font-display text-[clamp(1.1rem,5vw,1.55rem)] leading-[1.1] lg:text-[clamp(1.7rem,2.8vw,2.6rem)] lg:leading-[1.05] mb-3 lg:mb-5">
          Los cuatro regalos<br />de la Tierra
        </p>
        <div className="flex flex-col items-start gap-2 font-body text-xs sm:text-sm">
          {printedOffer && (
            <>
              <a href={`${productPath}#edicion-impresa`} className="inline-flex items-center gap-2 bg-[oklch(0.52_0.08_148)] px-3 py-2 font-medium text-white no-underline hover:bg-[oklch(0.38_0.07_148)]" style={{ textShadow: "none" }}>
                Reservar edición impresa · {formatEurosFixed(PRINTED_STORY_PRICE_CENTS)}
                <ArrowRight size={14} className="shrink-0" aria-hidden />
              </a>
              <p className="text-xs">Envío aparte</p>
            </>
          )}
          <Link href={productPath} className="border-b border-current pb-0.5 font-medium no-underline hover:opacity-85">
            Comprar ebook · {formatEurosFixed(Math.round(Number(ebook.price) * 100))}
          </Link>
        </div>
      </div>
      <Link href={productPath} className="shrink-0 order-1 lg:order-none">
        <img
          src="/site/promo-cuatro-regalos-libro.webp"
          alt="Portada de Los cuatro regalos de la Tierra"
          width={480}
          height={670}
          className="w-[72px] h-auto sm:w-24 lg:w-[clamp(128px,13vw,230px)]"
        />
      </Link>
    </div>
  );
}

export function HomeSlideshow({ eyebrow, title, subtitle, primaryLabel, secondaryLabel, secondaryUrl, onBook }: HomeSlideshowText & { onBook: () => void }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [prevIdx, setPrevIdx] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { data: heroImgs = [], isLoading: heroLoading } = trpc.hero.list.useQuery(undefined, { staleTime: 60 * 1000 });
  const heroUrls = heroImgs.length > 0 ? heroImgs.map((i) => i.url) : heroLoading ? [] : [HERO_IMG];

  useEffect(() => {
    if (heroUrls.length < 2) return;
    timerRef.current = setTimeout(goNext, 5000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [activeIdx, heroUrls.length]);

  function goTo(idx: number) {
    if (idx === activeIdx) return;
    setPrevIdx(activeIdx);
    setActiveIdx(idx);
    setTimeout(() => setPrevIdx(null), 750);
  }
  function goNext() { goTo((activeIdx + 1) % heroUrls.length); }

  return (
    <>
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background Images */}
        <div className="absolute inset-0">
          <style>{`
            @keyframes heroSlideIn  { from { transform: translateX(100%) } to { transform: translateX(0) } }
            @keyframes heroSlideOut { from { transform: translateX(0) }    to { transform: translateX(-100%) } }
          `}</style>

          {/* Placeholder neutro mientras cargan las imágenes reales del hero — evita el flash de una imagen incorrecta */}
          {heroUrls.length === 0 && (
            <div className="absolute inset-0 bg-[oklch(0.18_0.018_55)]" />
          )}

          {/* Imagen saliente */}
          {prevIdx !== null && (
            <img
              src={heroUrls[prevIdx]}
              alt=""
              className="absolute inset-0 w-full h-full object-cover object-center"
              style={{ animation: "heroSlideOut 700ms ease-in-out forwards" }}
            />
          )}
          {/* Imagen activa — key fuerza remount y arranca la animación desde translateX(100%) */}
          {heroUrls.length > 0 && (
            <img
              key={activeIdx}
              src={heroUrls[activeIdx]}
              alt="Cristina Vive Consciente — Bienestar Holístico"
              className="absolute inset-0 w-full h-full object-cover object-center"
              style={prevIdx !== null ? { animation: "heroSlideIn 700ms ease-in-out forwards" } : undefined}
            />
          )}

          {/* Gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(105deg, oklch(0.18 0.018 55 / 0.75) 0%, oklch(0.18 0.018 55 / 0.45) 50%, oklch(0.18 0.018 55 / 0.15) 100%)",
            }}
          />

          {/* Dots — solo si hay más de 1 imagen */}
          {heroUrls.length > 1 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {heroUrls.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goTo(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${idx === activeIdx ? "bg-white w-4" : "w-1.5 bg-white/40 hover:bg-white/70"}`}
                  aria-label={`Imagen ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="container relative z-10 pt-28 pb-20 lg:grid lg:grid-cols-2 lg:items-center lg:gap-8">
          <div className="max-w-xl">
            {/* Eyebrow */}
            <p
              className="text-[oklch(0.72_0.06_148)] text-xs tracking-[0.25em] uppercase mb-6 font-body"
              style={{ fontWeight: 400 }}
            >
              {eyebrow}
            </p>

            {/* Headline */}
            <h1
              className="text-white mb-6 font-display leading-[1.08]"
              style={{ fontWeight: 400 }}
            >
              {title}
            </h1>

            {/* Subtext */}
            <p className="text-white/75 text-base md:text-lg mb-10 font-body leading-relaxed" style={{ fontWeight: 300 }}>
              {subtitle}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              <button
                onClick={onBook}
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-medium hover:bg-[oklch(0.38_0.07_148)] transition-all duration-350 font-body"
                style={{ borderRadius: 0, letterSpacing: "0.1em" }}
              >
                {primaryLabel}
                <ArrowRight size={14} />
              </button>
              <Link
                href={secondaryUrl}
                className="inline-flex items-center gap-2 px-7 py-3.5 border border-white/60 text-white text-xs tracking-widest uppercase font-medium hover:bg-white/10 transition-all duration-350 font-body no-underline"
                style={{ borderRadius: 0, letterSpacing: "0.1em" }}
              >
                {secondaryLabel}
              </Link>
            </div>
          </div>
          <HomeStoryOffer />
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <div className="w-px h-12 bg-white/30 animate-pulse" />
          <span className="text-white/50 text-[0.6rem] tracking-widest uppercase font-body">Scroll</span>
        </div>
      </section>
    </>
  );
}

export function HomeWater() {
  const [waterReserva, setWaterReserva] = useState<{ id: number; name: string } | null>(null);
  const { data: waterProducts = [] } = trpc.water.listProducts.useQuery({ onlyDestacados: true }, { staleTime: 60 * 1000 });
  return (
    <>
      {waterReserva && (
        <WaterReservaModal productId={waterReserva.id} productName={waterReserva.name} onClose={() => setWaterReserva(null)} />
      )}
      {waterProducts.length > 0 && (
        <section className="section-padding bg-[oklch(0.94_0.012_80)]">
          <div className="container">
            <div className="max-w-lg mb-16">
              <p
                className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-4 font-body"
                style={{ fontWeight: 500 }}
              >
                Sistemas de agua
              </p>
              <h2 className="font-display text-[oklch(0.18_0.018_55)] mb-4" style={{ fontWeight: 400 }}>
                Agua que cuida tu salud, en tu propia casa
              </h2>
              <div className="section-divider" />
              <p className="text-[oklch(0.52_0.02_60)] leading-relaxed font-body mt-4" style={{ fontWeight: 300 }}>
                Equipos seleccionados personalmente por Cristina para llevar agua pura y de calidad a cada punto de tu hogar.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {waterProducts.map((product) => {
                const benefits: string[] = (() => {
                  try {
                    return JSON.parse(product.benefits ?? "[]");
                  } catch {
                    return [];
                  }
                })();

                return (
                  <div key={product.id} className="group card-natural overflow-hidden flex flex-col">
                    {/* Image */}
                    <div className="relative overflow-hidden bg-[oklch(0.94_0.012_80)]" style={{ aspectRatio: "4/3" }}>
                      {product.mainImage ? (
                        <img
                          src={product.mainImage}
                          alt={product.title}
                          className="w-full h-full object-contain p-8 transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Droplets size={40} className="text-[oklch(0.72_0.06_148)]" />
                        </div>
                      )}
                      {product.badge && (
                        <span
                          className="absolute top-4 left-4 px-3 py-1 bg-[oklch(0.985_0.006_85)]/90 text-[oklch(0.52_0.08_148)] text-[0.65rem] tracking-widest uppercase font-body"
                          style={{ fontWeight: 500, letterSpacing: "0.12em" }}
                        >
                          {product.badge}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6 md:p-7 flex flex-col flex-1">
                      <h3
                        className="font-display text-[oklch(0.18_0.018_55)] mb-1"
                        style={{ fontWeight: 400, fontSize: "1.25rem" }}
                      >
                        {product.title}
                      </h3>
                      {product.subtitle && (
                        <p className="text-[oklch(0.52_0.08_148)] text-sm font-body mb-3" style={{ fontWeight: 500 }}>
                          {product.subtitle}
                        </p>
                      )}
                      {product.shortDescription && (
                        <p className="text-[oklch(0.52_0.02_60)] text-sm leading-relaxed mb-4 font-body" style={{ fontWeight: 300 }}>
                          {product.shortDescription}
                        </p>
                      )}

                      {benefits.length > 0 && (
                        <ul className="space-y-1.5 mb-5">
                          {benefits.slice(0, 3).map((benefit, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-[oklch(0.52_0.02_60)] font-body">
                              <CheckCircle size={14} className="text-[oklch(0.52_0.08_148)] flex-shrink-0 mt-0.5" />
                              <span style={{ fontWeight: 300 }}>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {(product.priceVisible || product.priceOrientative) && (
                        <div className="border-t border-[oklch(0.9_0.01_80)] pt-4 mb-5">
                          {product.priceVisible ? (
                            <p className="font-display text-[oklch(0.18_0.018_55)] text-xl" style={{ fontWeight: 400 }}>
                              {product.priceVisible}
                            </p>
                          ) : (
                            <p className="text-[oklch(0.52_0.02_60)] text-sm font-body italic" style={{ fontWeight: 300 }}>
                              {product.priceOrientative}
                            </p>
                          )}
                        </div>
                      )}

                      {/* CTAs */}
                      <div className="mt-auto flex flex-col gap-2.5">
                        <button
                          onClick={() => setWaterReserva({ id: product.id, name: product.title })}
                          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-medium hover:bg-[oklch(0.38_0.07_148)] transition-all duration-350 font-body"
                          style={{ borderRadius: 0, letterSpacing: "0.1em" }}
                        >
                          {product.ctaPrimaryLabel ?? "Solicitar presupuesto"}
                        </button>
                        <Link
                          href={`/sistemas-agua/${product.slug}`}
                          className="inline-flex items-center justify-center gap-1.5 text-[oklch(0.52_0.08_148)] text-xs tracking-widest uppercase font-body no-underline hover:gap-2.5 transition-all"
                          style={{ fontWeight: 500, letterSpacing: "0.1em" }}
                        >
                          {product.ctaSecondaryLabel ?? "Conocer más detalles"}
                          <ChevronRight size={13} />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/sistemas-agua"
                className="btn-outline text-sm"
                style={{ textDecoration: "none" }}
              >
                <Droplets size={15} />
                Ver todos los sistemas de agua
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

export function HomeBlog() {
  const { data: latestPosts = [] } = trpc.blog.list.useQuery({ limit: 3 }, { staleTime: 5 * 60 * 1000 });
  return (
    <>
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
    </>
  );
}
