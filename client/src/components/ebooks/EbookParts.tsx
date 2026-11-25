/**
 * Piezas compartidas de las guías digitales: botón de compra (pedido + pago por Bizum, el mismo flujo de siempre)
 * y galería con miniaturas y ampliación.
 */
import { useEffect, useId, useRef, useState } from "react";
import { useLocation } from "wouter";
import { BookOpen, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BIZUM_PHONE_DISPLAY, formatEurosFixed } from "@shared/orders";
import { PENINSULAR_POSTAL_CODE, PRINTED_STORY_PRICE_CENTS, PRINTED_STORY_SHIPS_FROM } from "@shared/printedStory";

function PrintedStoryPrice({ shippingCents, total }: { shippingCents: number; total: string }) {
  return (
    <dl className="space-y-2 rounded-sm border border-[oklch(0.85_0.025_148)] bg-white/70 px-4 py-3 text-sm tabular-nums">
      <div className="flex items-baseline justify-between gap-3">
        <dt className="font-medium">Cuento impreso</dt>
        <dd className="shrink-0 font-display text-2xl text-[oklch(0.34_0.07_148)]">
          {formatEurosFixed(PRINTED_STORY_PRICE_CENTS)}
        </dd>
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <dt>Gastos de envío <span className="text-xs">(España peninsular)</span></dt>
        <dd className="shrink-0">{formatEurosFixed(shippingCents)}</dd>
      </div>
      <div className="flex items-baseline justify-between gap-3 border-t border-[oklch(0.85_0.025_148)] pt-2">
        <dt>Total por Bizum</dt>
        <dd className="shrink-0 font-semibold">{total}</dd>
      </div>
    </dl>
  );
}

// ── Botón de compra (pago por Bizum, confirmado por Cristina) ────────────────
export function PrintedStoryOffer({ ebookId, title, className = "" }: { ebookId: string; title: string; className?: string }) {
  const { data: offer } = trpc.orders.printedStoryOffer.useQuery();
  const section = useRef<HTMLElement>(null);
  useEffect(() => {
    if (offer && window.location.hash === "#edicion-impresa") section.current?.scrollIntoView();
  }, [offer]);
  if (!offer) return null;
  const total = formatEurosFixed(PRINTED_STORY_PRICE_CENTS + offer.shippingCents);
  return (
    <section ref={section} id="edicion-impresa" className={`border border-[oklch(0.79_0.04_148)] bg-[oklch(0.95_0.025_148)] p-5 sm:p-6 scroll-mt-24 ${className}`}>
      <h2 className="font-display text-2xl mb-1">Reserva tu edición impresa</h2>
      <p className="text-sm mb-4">Lanzamiento el {PRINTED_STORY_SHIPS_FROM}. Envíos a domicilio desde Segovia a partir de ese día.</p>
      <p className="mb-3 text-sm">Envío a España peninsular aparte. Verás los gastos al completar la dirección.</p>
      <BuyButton ebookId={ebookId} title={`${title} · Edición impresa`} label="Reservar la edición impresa"
        price={total} shippingCents={offer.shippingCents} />
    </section>
  );
}

export function BuyButton({ ebookId, label, price, title, shippingCents }: {
  ebookId: string; label: string; price: string; title: string; shippingCents?: number;
}) {
  const printed = shippingCents !== undefined;
  const id = useId();
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [shipping, setShipping] = useState({ street: "", details: "", postalCode: "", city: "", province: "" });
  const postalCode = shipping.postalCode.trim();
  const validPostalCode = PENINSULAR_POSTAL_CODE.test(postalCode);
  const addressReady = validPostalCode && [shipping.street, shipping.city, shipping.province].every(value => {
    const trimmed = value.trim();
    return trimmed.length > 0 && /^[^<>\r\n]*$/.test(trimmed);
  });
  const postalCodeError = postalCode.length === 5 && !validPostalCode;


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
    if (printed && !addressReady) return;
    createOrder.mutate({
      productSlug: ebookId,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      ...(printed ? { printed: true, shipping: { ...shipping, details: shipping.details.trim() || undefined } } : {}),
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3.5 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-medium hover:bg-[oklch(0.38_0.07_148)] transition-all duration-300 font-body flex items-center justify-center gap-2"
        style={{ borderRadius: 0, letterSpacing: "0.1em" }}
      >
        {printed ? <BookOpen size={15} /> : <Download size={13} />}
        {label} — {printed ? formatEurosFixed(PRINTED_STORY_PRICE_CENTS) : price}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display" style={{ fontWeight: 400 }}>{title}</DialogTitle>
            <DialogDescription>
              {printed
                ? `Pago por Bizum al ${BIZUM_PHONE_DISPLAY}, confirmado por Cristina. Envíos desde el ${PRINTED_STORY_SHIPS_FROM}.`
                : `Pagas por Bizum al ${BIZUM_PHONE_DISPLAY}. Cuando Cristina lo confirme, te llega el ebook por email.`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor={`${id}-name`}>{printed ? "Nombre y apellidos del destinatario" : "Nombre"}</Label>
              <Input id={`${id}-name`} value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={120} autoComplete="name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${id}-email`}>{printed ? "Correo electrónico" : "Email (aquí recibirás el ebook)"}</Label>
              <Input id={`${id}-email`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${id}-phone`}>{printed ? "Teléfono de entrega" : "Teléfono (opcional)"}</Label>
              <Input id={`${id}-phone`} type="tel" required={printed} value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
            </div>
            {printed && (
              <fieldset className="space-y-2">
                <legend className="mb-1 font-medium">Dirección postal · España peninsular</legend>
                {([
                  ["street", "Calle y número", "address-line1"],
                  ["details", "Piso, puerta u otros datos (opcional)", "address-line2"],
                  ["postalCode", "Código postal", "postal-code"],
                  ["city", "Localidad", "address-level2"],
                  ["province", "Provincia", "address-level1"],
                ] as const).map(([key, label, autocomplete]) => (
                  <div key={key} className="space-y-1">
                    <Label htmlFor={`${id}-${key}`}>{label}</Label>
                    <Input id={`${id}-${key}`} value={shipping[key]}
                      onChange={e => setShipping(prev => ({ ...prev, [key]: e.target.value }))}
                      required={key !== "details"} autoComplete={autocomplete}
                      inputMode={key === "postalCode" ? "numeric" : undefined}
                      pattern={key === "postalCode" ? "[0-9]{5}" : undefined}
                      maxLength={key === "postalCode" ? 5 : 160}
                      aria-invalid={key === "postalCode" && postalCodeError || undefined}
                      aria-describedby={key === "postalCode" && postalCodeError ? `${id}-postal-error` : undefined} />
                    {key === "postalCode" && postalCodeError && (
                      <p id={`${id}-postal-error`} className="text-xs text-red-700">Introduce un código postal de España peninsular.</p>
                    )}
                  </div>
                ))}
                <p className="text-xs">Usamos tus datos para gestionar el pedido y su entrega. <a href="/privacidad" target="_blank" rel="noreferrer" className="underline">Política de privacidad</a></p>
              </fieldset>
            )}
            {printed && (
              <div aria-live="polite">
                {addressReady
                  ? <PrintedStoryPrice shippingCents={shippingCents} total={price} />
                  : <p className="text-sm">Completa la dirección para ver los gastos de envío y el total.</p>}
              </div>
            )}
            <button
              type="submit"
              disabled={createOrder.isPending || (printed && !addressReady)}
              className="w-full py-3.5 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-medium hover:bg-[oklch(0.38_0.07_148)] transition-all duration-300 font-body flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ borderRadius: 0, letterSpacing: "0.1em" }}
            >
              {createOrder.isPending ? "Creando pedido..." : printed ? `Reservar con obligación de pago${addressReady ? ` · ${price}` : ""}` : `Continuar y pagar ${price}`}
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
