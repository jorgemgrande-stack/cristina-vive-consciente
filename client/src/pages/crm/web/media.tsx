/**
 * Editar web — biblioteca reutilizable de imágenes y encuadre.
 * La biblioteca lista los archivos ya subidos (los mismos de Galería) para reutilizarlos sin volver a subirlos; el encuadre
 * fija el punto focal de la imagen (qué parte no se recorta) y se ve en la vista previa en móvil y escritorio.
 */
import { useMemo, useRef, useState } from "react";
import { ImageIcon, Loader2, Search, X } from "lucide-react";
import { ImageUploader } from "@/components/ImageUploader";
import { trpc } from "@/lib/trpc";
import { inputCls, labelCls } from "./shared";

const IMAGE_RE = /\.(jpe?g|png|webp|gif|avif|svg)$/i;

export function MediaLibrary({ onPick, onClose }: { onPick: (url: string) => void; onClose: () => void }) {
  const { data = [], isLoading } = trpc.gallery.list.useQuery(undefined, { staleTime: 30_000 });
  const [q, setQ] = useState("");
  const files = useMemo(
    () => data.filter((f) => IMAGE_RE.test(f.filename) && (!q || f.filename.toLowerCase().includes(q.toLowerCase()))),
    [data, q],
  );
  return (
    <div className="fixed inset-0 z-[90] bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Biblioteca de imágenes" onClick={onClose}>
      <div className="bg-white w-full max-w-4xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-[oklch(0.92_0.01_75)] flex items-center gap-3">
          <h2 className="font-display text-lg flex-1" style={{ fontWeight: 400 }}>Biblioteca de imágenes</h2>
          <div className="relative w-56"><Search size={13} className="absolute left-2.5 top-2.5 text-[oklch(0.55_0.02_60)]" /><input className={`${inputCls} pl-8`} placeholder="Buscar por nombre…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar imagen" /></div>
          <button onClick={onClose} aria-label="Cerrar" className="p-2"><X size={16} /></button>
        </div>
        <div className="p-4 overflow-y-auto">
          {isLoading ? <Loader2 className="animate-spin" /> : files.length === 0 ? <p className="text-sm font-body text-[oklch(0.5_0.02_60)]">No hay imágenes{q ? " con ese nombre" : " subidas todavía"}. Sube una desde «Subir archivo».</p> : (
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {files.map((f) => (
                <li key={f.url}>
                  <button type="button" onClick={() => { onPick(f.url); onClose(); }} className="block w-full text-left border border-[oklch(0.9_0.012_75)] hover:border-[oklch(0.52_0.08_148)] focus:outline-2 focus:outline-[oklch(0.52_0.08_148)]">
                    <img src={f.url} alt="" loading="lazy" className="w-full aspect-square object-cover bg-[oklch(0.95_0.005_85)]" />
                    <span className="block px-2 py-1.5 text-[0.7rem] font-body truncate" title={f.filename}>{f.filename}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/** Imagen del editor: subir una nueva o elegir una de la biblioteca. */
export function ImageField({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-2">
      <ImageUploader value={value} onChange={onChange} label="" />
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 border border-[oklch(0.85_0.015_75)] bg-white hover:bg-[oklch(0.97_0.006_85)]">
        <ImageIcon size={13} /> Elegir de la biblioteca
      </button>
      {open && <MediaLibrary onPick={onChange} onClose={() => setOpen(false)} />}
    </div>
  );
}

/** Encuadre: se pulsa o arrastra sobre la imagen para elegir el punto que no debe recortarse. Con teclado, flechas. */
export function FocusPicker({ label, url, x, y, onChange }: { label: string; url: string; x: number; y: number; onChange: (x: number, y: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  if (!url) return <p className="text-xs text-[oklch(0.5_0.02_60)] font-body">{label}: elige primero una imagen.</p>;
  const set = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    onChange(Math.round(Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100))), Math.round(Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100))));
  };
  const step = (dx: number, dy: number) => onChange(Math.min(100, Math.max(0, x + dx)), Math.min(100, Math.max(0, y + dy)));
  return (
    <div>
      <span className={labelCls}>{label} <span className="text-[oklch(0.55_0.02_60)]">({x} %, {y} %)</span></span>
      <div
        ref={ref}
        role="slider"
        tabIndex={0}
        aria-label={`${label}: punto de la imagen que se mantiene visible`}
        aria-valuetext={`${x} % horizontal, ${y} % vertical`}
        className="relative cursor-crosshair touch-none select-none border border-[oklch(0.88_0.015_75)] focus:outline-2 focus:outline-[oklch(0.52_0.08_148)]"
        onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); setDragging(true); set(e); }}
        onPointerMove={(e) => { if (dragging) set(e); }}
        onPointerUp={() => setDragging(false)}
        onKeyDown={(e) => {
          const k = e.key === "ArrowLeft" ? [-5, 0] : e.key === "ArrowRight" ? [5, 0] : e.key === "ArrowUp" ? [0, -5] : e.key === "ArrowDown" ? [0, 5] : null;
          if (k) { e.preventDefault(); step(k[0], k[1]); }
        }}
      >
        <img src={url} alt="" draggable={false} className="w-full h-auto block pointer-events-none" />
        <span className="absolute w-5 h-5 -ml-2.5 -mt-2.5 rounded-full border-2 border-white bg-[oklch(0.52_0.08_148)] shadow pointer-events-none" style={{ left: `${x}%`, top: `${y}%` }} />
      </div>
      <p className="text-[0.7rem] text-[oklch(0.55_0.02_60)] font-body mt-1">Pulsa o arrastra el punto; con teclado, usa las flechas. Se ve en la vista previa de móvil y escritorio.</p>
    </div>
  );
}
