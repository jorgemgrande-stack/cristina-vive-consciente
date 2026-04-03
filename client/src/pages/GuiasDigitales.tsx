/**
 * Guías Digitales — Cristina Vive Consciente
 * Design: "Luz Botánica"
 * Carrusel de imágenes: 1 grande + 3 packs debajo
 * Datos dinámicos desde BD (tabla ebooks)
 */

import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight, Download, FileText, MessageCircle, ChevronLeft, ChevronRight as ChevronRightIcon
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import Layout from "@/components/Layout";
import PageHero from "@/components/PageHero";

const HERO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/hero-consultas-VRAFvns5UX68Kqd64cBawH.webp";

// ── Botón de compra ──────────────────────────────────────────────────────────
function BuyButton({ ebookId, label, price }: { ebookId: string; label: string; price: string }) {
  const [loading, setLoading] = useState(false);

  const createCheckout = trpc.ebooks.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.open(data.checkoutUrl, "_blank");
        toast.success("Redirigiendo a la pasarela de pago seguro...");
      }
      setLoading(false);
    },
    onError: (err) => {
      if (err.message.includes("no está configurado") || err.message.includes("PRECONDITION_FAILED")) {
        toast.info("El sistema de pago estará disponible próximamente. Escíbeme para adquirir la guía.");
      } else {
        toast.error("Ha ocurrido un error. Por favor, inténtalo de nuevo.");
      }
      setLoading(false);
    },
  });

  const handleBuy = () => {
    setLoading(true);
    createCheckout.mutate({ ebookId: ebookId as "agua" | "aceites", origin: window.location.origin });
  };

  return (
    <button
      onClick={handleBuy}
      disabled={loading}
      className="w-full py-3.5 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-medium hover:bg-[oklch(0.38_0.07_148)] transition-all duration-300 font-body flex items-center justify-center gap-2 disabled:opacity-60"
      style={{ borderRadius: 0, letterSpacing: "0.1em" }}
    >
      {loading ? (
        <>
          <span className="animate-spin inline-block w-3 h-3 border border-white border-t-transparent rounded-full" />
          Procesando...
        </>
      ) : (
        <>
          <Download size={13} />
          {label} — {price}
        </>
      )}
    </button>
  );
}

// ── Carrusel de imágenes ──────────────────────────────────────────────────────
function ImageCarousel({ images, title }: { images: string[]; title: string }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const validImages = images.filter(Boolean);
  if (validImages.length === 0) return null;

  const mainImage = validImages[activeIdx] ?? validImages[0];
  const thumbs = validImages.slice(0, 3);

  return (
    <div className="space-y-3">
      {/* Imagen principal grande */}
      <div className="relative overflow-hidden bg-[oklch(0.94_0.012_80)] aspect-[4/3]">
        <img
          src={mainImage}
          alt={title}
          className="w-full h-full object-cover transition-all duration-500"
          key={mainImage}
        />
        {/* Navegación flechas si hay más de 1 imagen */}
        {validImages.length > 1 && (
          <>
            <button
              onClick={() => setActiveIdx((i) => (i - 1 + validImages.length) % validImages.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white flex items-center justify-center transition-colors shadow-sm"
              style={{ borderRadius: 0 }}
            >
              <ChevronLeft size={16} className="text-[oklch(0.38_0.02_55)]" />
            </button>
            <button
              onClick={() => setActiveIdx((i) => (i + 1) % validImages.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white flex items-center justify-center transition-colors shadow-sm"
              style={{ borderRadius: 0 }}
            >
              <ChevronRightIcon size={16} className="text-[oklch(0.38_0.02_55)]" />
            </button>
          </>
        )}
        {/* Indicador de posición */}
        {validImages.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {validImages.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeIdx ? "bg-white scale-125" : "bg-white/50"}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Miniaturas (máximo 3) */}
      {thumbs.length > 1 && (
        <div className="grid grid-cols-3 gap-2">
          {thumbs.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`aspect-square overflow-hidden transition-all ${
                i === activeIdx
                  ? "ring-2 ring-[oklch(0.52_0.08_148)] ring-offset-1"
                  : "opacity-60 hover:opacity-90"
              }`}
              style={{ borderRadius: 0 }}
            >
              <img src={img} alt={`${title} ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tarjeta de ebook ─────────────────────────────────────────────────────────
interface EbookData {
  id: number;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  price: string;
  coverImage: string | null;
  galleryImages: string | null;
  includesSession: number;
  priceCents: number;
}

function EbookCard({ ebook }: { ebook: EbookData }) {
  let images: string[] = [];
  try {
    const parsed = JSON.parse(ebook.galleryImages ?? "[]");
    if (Array.isArray(parsed)) images = parsed.filter(Boolean);
  } catch {}
  if (images.length === 0 && ebook.coverImage) images = [ebook.coverImage];

  // Incluye items según el ebook
  const includesItems =
    ebook.slug === "agua"
      ? [
          { icon: <FileText size={13} />, text: "Guía en PDF descargable" },
          { icon: <MessageCircle size={13} />, text: "Sesión de asesoramiento de 30 min" },
          { icon: <Download size={13} />, text: "Código descuento en sistemas recomendados" },
        ]
      : [
          { icon: <FileText size={13} />, text: "Guía en PDF descargable" },
          { icon: <MessageCircle size={13} />, text: "Soporte grupal incluido" },
          { icon: <ArrowRight size={13} />, text: "Posibilidad de compra a través de mí" },
        ];

  return (
    <div className="card-natural bg-white overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
        {/* Columna izquierda: carrusel */}
        <div className="p-6 md:p-8 bg-[oklch(0.97_0.006_85)]">
          <ImageCarousel images={images} title={ebook.title} />
        </div>

        {/* Columna derecha: info */}
        <div className="p-7 md:p-10 flex flex-col justify-between">
          {/* Header */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="px-2.5 py-1 bg-[oklch(0.52_0.08_148)] text-white text-[0.6rem] tracking-widest uppercase font-body" style={{ fontWeight: 500 }}>
                PDF Digital
              </span>
              <span className="flex items-center gap-1 text-[oklch(0.52_0.02_60)] text-xs font-body" style={{ fontWeight: 300 }}>
                <FileText size={11} />
                Descarga inmediata
              </span>
            </div>

            <div className="flex items-start justify-between gap-4 mb-4">
              <h2 className="font-display text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 400, fontSize: "clamp(1.2rem, 2.5vw, 1.7rem)" }}>
                {ebook.title}
              </h2>
              <p className="font-display text-[oklch(0.52_0.08_148)] flex-shrink-0" style={{ fontWeight: 400, fontSize: "2rem", lineHeight: 1 }}>
                {parseFloat(ebook.price).toFixed(0)}€
              </p>
            </div>

            {ebook.subtitle && (
              <p className="text-[oklch(0.52_0.02_60)] text-sm mb-4 font-body italic" style={{ fontWeight: 300 }}>
                {ebook.subtitle}
              </p>
            )}

            <div className="section-divider mb-5" />

            {ebook.description && (
              <div className="space-y-3 mb-6">
                {ebook.description.split("\n").filter(Boolean).map((para, i) => (
                  <p key={i} className="text-[oklch(0.38_0.02_55)] leading-relaxed font-body text-sm" style={{ fontWeight: 300 }}>
                    {para}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Incluye + botón */}
          <div className="space-y-4 mt-4">
            <div className="p-5 bg-[oklch(0.94_0.012_80)] border border-[oklch(0.88_0.015_75)]">
              <p className="text-[oklch(0.28_0.025_55)] text-xs tracking-widest uppercase mb-4 font-body" style={{ fontWeight: 500 }}>
                Esta guía incluye
              </p>
              <ul className="space-y-3">
                {includesItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="text-[oklch(0.52_0.08_148)] mt-0.5 flex-shrink-0">{item.icon}</span>
                    <span className="text-[oklch(0.38_0.02_55)] text-sm font-body" style={{ fontWeight: 300 }}>
                      {item.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <BuyButton
              ebookId={ebook.slug}
              label="Obtener guía"
              price={`${parseFloat(ebook.price).toFixed(0)}€`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────────────────
export default function GuiasDigitales() {
  const { data: ebooks = [], isLoading } = trpc.ebooksAdmin.list.useQuery();

  return (
    <Layout>
      <PageHero
        title="Guías Digitales"
        subtitle="Conocimiento práctico y profundo para transformar tu vida desde casa."
        tag="Recursos digitales"
        image={HERO}
        breadcrumb={[{ label: "Inicio", href: "/" }, { label: "Guías Digitales" }]}
      />

      {/* Guías */}
      <section className="section-padding bg-[oklch(0.985_0.006_85)]">
        <div className="container">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-[oklch(0.52_0.08_148)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : ebooks.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[oklch(0.52_0.02_60)] font-body" style={{ fontWeight: 300 }}>
                Las guías digitales estarán disponibles próximamente.
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              {ebooks.map((ebook) => (
                <EbookCard key={ebook.id} ebook={ebook} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA contacto */}
      <section className="section-padding bg-[oklch(0.94_0.012_80)]">
        <div className="container text-center">
          <h2 className="font-display text-[oklch(0.18_0.018_55)] mb-4" style={{ fontWeight: 400 }}>
            ¿Tienes dudas antes de comprar?
          </h2>
          <p className="text-[oklch(0.52_0.02_60)] mb-8 font-body max-w-md mx-auto" style={{ fontWeight: 300 }}>
            Estaré encantada de resolverlas sin compromiso.
          </p>
          <Link href="/contacto">
            <button
              className="inline-flex items-center gap-2 px-8 py-4 bg-[oklch(0.18_0.018_55)] text-white text-xs tracking-widest uppercase font-medium hover:bg-[oklch(0.28_0.02_55)] transition-all duration-300 font-body"
              style={{ borderRadius: 0, letterSpacing: "0.1em" }}
            >
              Contactar
              <ArrowRight size={14} />
            </button>
          </Link>
        </div>
      </section>
    </Layout>
  );
}
