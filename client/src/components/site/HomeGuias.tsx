/**
 * Portada: carrusel «Guías digitales». Misma fuente de datos que /guias-digitales (ebooks ACTIVOS, en su orden) y mismas
 * URLs de ficha. Desplazamiento manual (táctil, flechas y teclado), sin reproducción automática. Hasta 3 tarjetas en
 * escritorio, 2 en tablet y 1 en móvil. Sin ebooks activos, la sección no se pinta; si caben todos, no hay controles.
 */
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Link } from "wouter";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { ebookImages, ebookPath, ebookPriceLabel } from "@shared/ebookPage";

const ARROW =
  "w-10 h-10 flex items-center justify-center border border-[oklch(0.52_0.08_148)] text-[oklch(0.52_0.08_148)] bg-white hover:bg-[oklch(0.52_0.08_148)] hover:text-white transition-colors disabled:opacity-35 disabled:pointer-events-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.52_0.08_148)]";

export function HomeGuias() {
  const { data: ebooks = [] } = trpc.ebooksAdmin.list.useQuery(undefined, { staleTime: 60 * 1000 }); // solo activos, en el orden del catálogo
  const [viewportRef, embla] = useEmblaCarousel({ align: "start", containScroll: "trimSnaps", slidesToScroll: 1 });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const sync = useCallback(() => {
    if (!embla) return;
    setCanPrev(embla.canScrollPrev());
    setCanNext(embla.canScrollNext());
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    sync();
    embla.on("select", sync).on("reInit", sync).on("resize", sync);
    return () => {
      embla.off("select", sync).off("reInit", sync).off("resize", sync);
    };
  }, [embla, sync]);

  // Al cambiar el número de ebooks (altas/bajas) el carrusel se recalcula
  useEffect(() => {
    embla?.reInit();
  }, [embla, ebooks.length]);

  if (ebooks.length === 0) return null;
  const showControls = canPrev || canNext; // si caben todos a la vez, no hay controles

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") { embla?.scrollPrev(); e.preventDefault(); }
    if (e.key === "ArrowRight") { embla?.scrollNext(); e.preventDefault(); }
  };

  return (
    <section className="section-padding bg-[oklch(0.985_0.006_85)]" aria-labelledby="home-guias-title" data-testid="home-guias">
      <div className="container">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <p className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-3 font-body" style={{ fontWeight: 500 }}>
              Recursos digitales
            </p>
            <h2 id="home-guias-title" className="font-display text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 400 }}>
              Guías digitales
            </h2>
          </div>
          <div className="flex items-center gap-5">
            <Link
              href="/guias-digitales"
              className="inline-flex items-center gap-2 text-[oklch(0.52_0.08_148)] text-sm font-body no-underline hover:gap-3 transition-all group"
              style={{ fontWeight: 500 }}
            >
              Ver todas las guías
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            {showControls && (
              <div className="flex gap-2" data-testid="home-guias-controls">
                <button type="button" className={ARROW} style={{ borderRadius: 0 }} onClick={() => embla?.scrollPrev()} disabled={!canPrev} aria-label="Guías anteriores">
                  <ChevronLeft size={18} />
                </button>
                <button type="button" className={ARROW} style={{ borderRadius: 0 }} onClick={() => embla?.scrollNext()} disabled={!canNext} aria-label="Guías siguientes">
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div
          role="region"
          aria-roledescription="carrusel"
          aria-label="Guías digitales"
          tabIndex={0}
          onKeyDown={onKeyDown}
          className="outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.52_0.08_148)] focus-visible:ring-offset-4"
        >
          <div className="overflow-hidden" ref={viewportRef}>
            <ul className="flex -ml-6 list-none p-0 m-0" data-testid="home-guias-track">
              {ebooks.map((ebook, i) => {
                const href = ebookPath(ebook.slug);
                const cover = ebookImages(ebook)[0];
                return (
                  <li
                    key={ebook.id}
                    className="pl-6 min-w-0 shrink-0 grow-0 basis-full md:basis-1/2 lg:basis-1/3"
                    aria-roledescription="diapositiva"
                    aria-label={`${i + 1} de ${ebooks.length}`}
                    data-testid="home-guias-card"
                  >
                    <article className="h-full bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col">
                      {/* Espacio de la portada reservado (4:5) y portada entera, sin recortes */}
                      <Link href={href} className="block bg-[oklch(0.94_0.012_80)] overflow-hidden" style={{ aspectRatio: "4 / 5" }} aria-label={`Ver ${ebook.title}`} tabIndex={-1}>
                        {cover ? (
                          <img src={cover} alt={`Portada de ${ebook.title}`} className="w-full h-full object-contain" loading="lazy" draggable={false} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[oklch(0.52_0.02_60)] text-xs font-body">Guía digital</div>
                        )}
                      </Link>
                      <div className="p-6 flex flex-col flex-1">
                        <h3 className="font-display text-[oklch(0.18_0.018_55)] mb-3 leading-snug" style={{ fontWeight: 500, fontSize: "1.15rem" }}>
                          <Link href={href} className="no-underline hover:text-[oklch(0.38_0.07_148)] transition-colors">{ebook.title}</Link>
                        </h3>
                        <div className="mt-auto pt-3 flex items-center justify-between gap-3 border-t border-[oklch(0.92_0.01_75)]">
                          <span className="font-display text-[oklch(0.52_0.08_148)]" style={{ fontWeight: 400, fontSize: "1.5rem", lineHeight: 1 }}>
                            {ebookPriceLabel(ebook.price)}
                          </span>
                          <Link
                            href={href}
                            className="inline-flex items-center gap-1.5 text-[oklch(0.52_0.08_148)] text-sm font-body no-underline hover:gap-2.5 transition-all"
                            style={{ fontWeight: 500 }}
                          >
                            Ver ebook <ArrowRight size={13} />
                          </Link>
                        </div>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
