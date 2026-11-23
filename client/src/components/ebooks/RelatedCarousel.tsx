/**
 * «También te puede interesar»: carrusel a todo el ancho con otros ebooks, productos y servicios públicos.
 * Mismos datos y rutas que los listados públicos. Sin autoplay; táctil, flechas y teclado. Sin artículos, no se pinta.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { buildRelatedItems, RELATED_KIND_LABEL } from "@shared/relatedItems";

const ARROW =
  "w-10 h-10 flex items-center justify-center border border-[oklch(0.52_0.08_148)] text-[oklch(0.52_0.08_148)] bg-white hover:bg-[oklch(0.52_0.08_148)] hover:text-white transition-colors disabled:opacity-35 disabled:pointer-events-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.52_0.08_148)]";

export function RelatedCarousel({ currentSlug }: { currentSlug: string }) {
  const opt = { staleTime: 60 * 1000 };
  const { data: ebooks = [] } = trpc.ebooksAdmin.list.useQuery(undefined, opt);
  const { data: services = [] } = trpc.services.list.useQuery(undefined, opt);
  const items = useMemo(() => buildRelatedItems({ currentSlug, ebooks, services }), [currentSlug, ebooks, services]);

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
  useEffect(() => {
    embla?.reInit();
  }, [embla, items.length]);

  if (items.length === 0) return null;
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") { embla?.scrollPrev(); e.preventDefault(); }
    if (e.key === "ArrowRight") { embla?.scrollNext(); e.preventDefault(); }
  };

  return (
    <section className="bg-[oklch(0.97_0.008_85)] py-12 md:py-16" aria-labelledby="related-title" data-testid="related-carousel">
      <div className="container">
        <div className="flex items-end justify-between gap-4 mb-8">
          <h2 id="related-title" className="font-display text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 400, fontSize: "1.7rem" }}>
            También te puede interesar
          </h2>
          {(canPrev || canNext) && (
            <div className="flex gap-2" data-testid="related-controls">
              <button type="button" className={ARROW} style={{ borderRadius: 0 }} onClick={() => embla?.scrollPrev()} disabled={!canPrev} aria-label="Anteriores">
                <ChevronLeft size={18} />
              </button>
              <button type="button" className={ARROW} style={{ borderRadius: 0 }} onClick={() => embla?.scrollNext()} disabled={!canNext} aria-label="Siguientes">
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
        <div role="region" aria-roledescription="carrusel" aria-label="También te puede interesar" tabIndex={0} onKeyDown={onKeyDown} className="outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.52_0.08_148)] focus-visible:ring-offset-4">
          <div className="overflow-hidden" ref={viewportRef}>
            <ul className="flex -ml-5 list-none p-0 m-0">
              {items.map((it, i) => (
                <li key={it.key} className="pl-5 min-w-0 shrink-0 grow-0 basis-[78%] sm:basis-1/2 md:basis-1/3 lg:basis-1/4" aria-roledescription="diapositiva" aria-label={`${i + 1} de ${items.length}`} data-testid="related-card">
                  <Link href={it.href} className="group block h-full bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow no-underline" draggable={false}>
                    <div className="bg-[oklch(0.94_0.012_80)] overflow-hidden" style={{ aspectRatio: "4 / 3" }}>
                      {it.image ? (
                        <img src={it.image} alt={it.title} className={`w-full h-full ${it.kind === "ebook" ? "object-contain" : "object-cover"}`} loading="lazy" draggable={false} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[oklch(0.52_0.02_60)] text-xs font-body">{RELATED_KIND_LABEL[it.kind]}</div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-[oklch(0.52_0.08_148)] text-[0.6rem] tracking-widest uppercase font-body mb-1.5" style={{ fontWeight: 500 }}>{RELATED_KIND_LABEL[it.kind]}</p>
                      <h3 className="font-display text-[oklch(0.18_0.018_55)] leading-snug group-hover:text-[oklch(0.38_0.07_148)] transition-colors" style={{ fontWeight: 500, fontSize: "1.05rem" }}>{it.title}</h3>
                      {it.price && <p className="font-display text-[oklch(0.52_0.08_148)] mt-2" style={{ fontWeight: 400, fontSize: "1.2rem", lineHeight: 1 }}>{it.price}</p>}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
