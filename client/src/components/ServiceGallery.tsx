/**
 * ServiceGallery — galería de una ficha de servicio: foto principal, miniaturas y vista ampliada.
 *
 * - La foto principal es un carrusel con scroll-snap: en móvil se desliza con el dedo; en escritorio hay flechas.
 * - Las miniaturas cambian la foto principal; pulsar la foto principal abre la vista ampliada.
 * - Vista ampliada: flechas, teclado (← → Esc), deslizar en móvil, bloqueo del scroll de fondo y foco devuelto al cerrar.
 * - Solo la primera imagen se carga con prioridad; el resto, en diferido.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import type { GalleryImage } from "@shared/serviceGallery";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export default function ServiceGallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const thumbs = useRef<HTMLDivElement>(null);
  const raf = useRef<number | null>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const touchX = useRef<number | null>(null);
  const count = images.length;

  // Si cambia el número de imágenes (p. ej. al cargar), se mantiene el índice dentro de rango
  useEffect(() => {
    if (index > count - 1) setIndex(0);
  }, [count, index]);

  const goTo = useCallback(
    (i: number) => {
      const el = scroller.current;
      const next = Math.max(0, Math.min(count - 1, i));
      setIndex(next);
      if (el) el.scrollTo({ left: next * el.clientWidth, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    },
    [count],
  );

  // El índice sigue al deslizamiento del dedo
  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
      setIndex((prev) => (prev === i ? prev : Math.max(0, Math.min(count - 1, i))));
    });
  };

  // La miniatura activa siempre queda a la vista
  useEffect(() => {
    const t = thumbs.current?.children[index] as HTMLElement | undefined;
    t?.scrollIntoView?.({ block: "nearest", inline: "nearest", behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [index]);

  // Vista ampliada: teclado, bloqueo de scroll y foco
  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowRight") setLightbox((i) => (i === null ? i : Math.min(count - 1, i + 1)));
      else if (e.key === "ArrowLeft") setLightbox((i) => (i === null ? i : Math.max(0, i - 1)));
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    closeBtn.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightbox === null, count]);

  const openLightbox = (i: number, e?: React.SyntheticEvent) => {
    lastFocus.current = (e?.currentTarget as HTMLElement) ?? null;
    setLightbox(i);
  };
  const closeLightbox = () => {
    setLightbox((cur) => {
      if (cur !== null) goTo(cur);
      return null;
    });
    setTimeout(() => lastFocus.current?.focus?.(), 0);
  };

  if (count === 0) return null;
  const current = images[Math.min(index, count - 1)];

  return (
    <div className="w-full" aria-roledescription="galería de imágenes" aria-label={`Fotos de ${title}`}>
      {/* Foto principal (carrusel deslizable) */}
      <div className="relative group bg-[oklch(0.94_0.012_80)]">
        <div
          ref={scroller}
          onScroll={onScroll}
          className="flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden overscroll-x-contain"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {images.map((img, i) => (
            <button
              key={`${img.url}-${i}`}
              type="button"
              onClick={(e) => openLightbox(i, e)}
              className="relative w-full flex-none snap-center aspect-[4/3] cursor-zoom-in block"
              aria-label={`Ampliar foto ${i + 1} de ${count}: ${img.alt}`}
            >
              <img
                src={img.url}
                alt={img.alt}
                className="w-full h-full object-cover select-none"
                draggable={false}
                loading={i <= index + 1 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "auto"}
                decoding="async"
              />
            </button>
          ))}
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              disabled={index === 0}
              aria-label="Foto anterior"
              className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center bg-white/90 text-[oklch(0.22_0.02_55)] shadow-sm hover:bg-white disabled:opacity-0 transition-opacity"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              disabled={index === count - 1}
              aria-label="Foto siguiente"
              className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center bg-white/90 text-[oklch(0.22_0.02_55)] shadow-sm hover:bg-white disabled:opacity-0 transition-opacity"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1.5 bg-black/55 text-white text-[11px] font-body px-2.5 py-1 backdrop-blur-sm">
          <Maximize2 size={11} />
          {count > 1 ? `${index + 1} / ${count}` : "Ampliar"}
        </span>
      </div>

      {current.caption && (
        <p className="mt-2 text-[11px] text-[oklch(0.52_0.02_60)] font-body italic" style={{ fontWeight: 300 }}>
          {current.caption}
        </p>
      )}

      {/* Miniaturas */}
      {count > 1 && (
        <div ref={thumbs} className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Miniaturas">
          {images.map((img, i) => (
            <button
              key={`t-${img.url}-${i}`}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Ver foto ${i + 1}: ${img.alt}`}
              onClick={() => goTo(i)}
              className={`relative flex-none w-20 h-16 sm:w-24 sm:h-[4.5rem] overflow-hidden border-2 transition-all ${
                i === index ? "border-[oklch(0.52_0.08_148)]" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" loading={i < 8 ? "eager" : "lazy"} decoding="async" draggable={false} />
            </button>
          ))}
        </div>
      )}

      {/* Vista ampliada */}
      {lightbox !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Foto ampliada de ${title}`}
          className="fixed inset-0 z-[10000] bg-black/92 flex flex-col"
          style={{ backgroundColor: "rgba(10,8,5,0.94)" }}
          onClick={closeLightbox}
          onTouchStart={(e) => {
            touchX.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            touchX.current = null;
            if (Math.abs(dx) > 50) setLightbox((i) => (i === null ? i : dx < 0 ? Math.min(count - 1, i + 1) : Math.max(0, i - 1)));
          }}
        >
          <div className="flex items-center justify-between px-4 py-3 text-white/80 text-xs font-body" onClick={(e) => e.stopPropagation()}>
            <span>
              {lightbox + 1} / {count}
            </span>
            <button
              ref={closeBtn}
              type="button"
              onClick={closeLightbox}
              aria-label="Cerrar vista ampliada"
              className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <X size={22} />
            </button>
          </div>

          <div className="relative flex-1 min-h-0 flex items-center justify-center px-2 sm:px-16" onClick={(e) => e.stopPropagation()}>
            <img
              key={images[lightbox].url}
              src={images[lightbox].url}
              alt={images[lightbox].alt}
              className="max-w-full max-h-full object-contain select-none"
              draggable={false}
            />
            {count > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setLightbox((i) => (i === null ? i : Math.max(0, i - 1)))}
                  disabled={lightbox === 0}
                  aria-label="Foto anterior"
                  className="absolute left-1 sm:left-4 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center bg-white/10 text-white hover:bg-white/20 disabled:opacity-0"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  type="button"
                  onClick={() => setLightbox((i) => (i === null ? i : Math.min(count - 1, i + 1)))}
                  disabled={lightbox === count - 1}
                  aria-label="Foto siguiente"
                  className="absolute right-1 sm:right-4 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center bg-white/10 text-white hover:bg-white/20 disabled:opacity-0"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>

          <p className="px-4 py-3 text-center text-white/80 text-xs font-body" style={{ fontWeight: 300 }} onClick={(e) => e.stopPropagation()}>
            {images[lightbox].caption ?? images[lightbox].alt}
          </p>
        </div>
      )}
    </div>
  );
}
