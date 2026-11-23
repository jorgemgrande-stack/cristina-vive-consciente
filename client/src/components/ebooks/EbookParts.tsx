/**
 * Piezas compartidas de las guías digitales: botón de compra (pedido + pago por Bizum, el mismo flujo de siempre)
 * y galería con miniaturas y ampliación.
 */
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BIZUM_PHONE_DISPLAY } from "@shared/orders";

// ── Botón de compra (pago por Bizum, confirmado por Cristina) ────────────────
export function BuyButton({ ebookId, label, price, title }: { ebookId: string; label: string; price: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const createOrder = trpc.orders.create.useMutation({
    onSuccess: (order) => {
      setOpen(false);
      navigate(`/pedido/${order.reference}`);
    },
    onError: (err) => {
      toast.error(err.message || "No se ha podido crear el pedido. Inténtalo de nuevo o escribe a Cristina.");
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    createOrder.mutate({
      productSlug: ebookId,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3.5 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-medium hover:bg-[oklch(0.38_0.07_148)] transition-all duration-300 font-body flex items-center justify-center gap-2"
        style={{ borderRadius: 0, letterSpacing: "0.1em" }}
      >
        <Download size={13} />
        {label} — {price}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display" style={{ fontWeight: 400 }}>{title}</DialogTitle>
            <DialogDescription>
              Pagas por Bizum al {BIZUM_PHONE_DISPLAY}. Cuando Cristina lo confirme, te llega el ebook por email.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="order-name">Nombre</Label>
              <Input id="order-name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={120} autoComplete="name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="order-email">Email (aquí recibirás el ebook)</Label>
              <Input id="order-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="order-phone">Teléfono (opcional)</Label>
              <Input id="order-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
            </div>
            <button
              type="submit"
              disabled={createOrder.isPending}
              className="w-full py-3.5 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-medium hover:bg-[oklch(0.38_0.07_148)] transition-all duration-300 font-body flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ borderRadius: 0, letterSpacing: "0.1em" }}
            >
              {createOrder.isPending ? "Creando pedido..." : `Continuar y pagar ${price}`}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Galería: portada + muestras, con ampliación ──────────────────────────────
/**
 * Las imágenes se muestran enteras (object-contain): una portada vertical y una doble página apaisada caben sin recortes.
 * «Ampliar» abre la imagen grande para leer las muestras; ← → y las flechas del teclado cambian de imagen.
 */
export function EbookGallery({ images, title, priority = false }: { images: string[]; title: string; priority?: boolean }) {
  const list = images.filter(Boolean);
  const [idx, setIdx] = useState(0);
  const [zoom, setZoom] = useState(false);
  const n = list.length;
  const go = (d: number) => setIdx((i) => (i + d + n) % n);

  useEffect(() => {
    if (!zoom || n < 2) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setIdx((i) => (i - 1 + n) % n);
      if (e.key === "ArrowRight") setIdx((i) => (i + 1) % n);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom, n]);

  if (n === 0) return null;
  const current = list[Math.min(idx, n - 1)];
  const arrow = "absolute top-1/2 -translate-y-1/2 w-9 h-9 bg-white/85 hover:bg-white flex items-center justify-center shadow-sm";

  return (
    <div className="space-y-3" data-testid="ebook-gallery">
      <div className="relative bg-[oklch(0.94_0.012_80)] flex items-center justify-center aspect-[4/3] max-h-[68vh] w-full overflow-hidden">
        <button type="button" onClick={() => setZoom(true)} className="w-full h-full cursor-zoom-in" aria-label="Ampliar imagen" data-testid="ebook-zoom-open">
          <img
            key={current}
            src={current}
            alt={idx === 0 ? title : `${title} — imagen ${idx + 1}`}
            className="w-full h-full object-contain"
            loading={priority ? "eager" : "lazy"}
          />
        </button>
        {n > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} className={`${arrow} left-2`} style={{ borderRadius: 0 }} aria-label="Imagen anterior"><ChevronLeft size={18} /></button>
            <button type="button" onClick={() => go(1)} className={`${arrow} right-2`} style={{ borderRadius: 0 }} aria-label="Imagen siguiente"><ChevronRight size={18} /></button>
          </>
        )}
      </div>

      {n > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {list.slice(0, 4).map((img, i) => (
            <button
              key={img}
              type="button"
              onClick={() => setIdx(i)}
              className={`aspect-[4/3] bg-[oklch(0.94_0.012_80)] overflow-hidden transition-all ${i === idx ? "ring-2 ring-[oklch(0.52_0.08_148)] ring-offset-1" : "opacity-60 hover:opacity-90"}`}
              style={{ borderRadius: 0 }}
              aria-label={i === 0 ? "Ver portada" : `Ver muestra ${i}`}
            >
              <img src={img} alt="" className="w-full h-full object-contain" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      <Dialog open={zoom} onOpenChange={setZoom}>
        <DialogContent className="max-w-[96vw] sm:max-w-5xl p-2 bg-white" aria-describedby={undefined}>
          <DialogHeader className="sr-only"><DialogTitle>{title}</DialogTitle></DialogHeader>
          <div className="relative flex items-center justify-center">
            <img src={current} alt={title} className="max-h-[85vh] w-auto max-w-full object-contain" data-testid="ebook-zoom-image" />
            {n > 1 && (
              <>
                <button type="button" onClick={() => go(-1)} className={`${arrow} left-1`} style={{ borderRadius: 0 }} aria-label="Imagen anterior"><ChevronLeft size={20} /></button>
                <button type="button" onClick={() => go(1)} className={`${arrow} right-1`} style={{ borderRadius: 0 }} aria-label="Imagen siguiente"><ChevronRight size={20} /></button>
              </>
            )}
          </div>
          <p className="text-center text-xs text-[oklch(0.52_0.02_60)] font-body">{idx + 1} / {n}</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
