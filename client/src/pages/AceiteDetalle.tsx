/**
 * AceiteDetalle.tsx — Ficha de detalle de aceite esencial
 * Cristina Vive Consciente
 *
 * NO hay compra directa. NO hay precios.
 * Objetivo: informar y convertir en consulta con Cristina.
 */

import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import Layout from "@/components/Layout";
import { useConsultaCart } from "@/contexts/ConsultaCartContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ArrowLeft, ShoppingBag, Check, Leaf, ArrowRight,
  Loader2, AlertTriangle, ChevronDown, ChevronUp
} from "lucide-react";
import { useState } from "react";

const TIPO_LABELS: Record<string, string> = {
  aceite: "Aceite esencial",
  mezcla: "Mezcla terapéutica",
  base: "Base y dilución",
  pack: "Pack y guía",
  accesorio: "Accesorio",
};

function parseJsonArray(val: string | null | undefined): string[] {
  try { return JSON.parse(val ?? "[]") as string[]; } catch { return []; }
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[oklch(0.92_0.01_80)]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left font-body text-sm text-[oklch(0.18_0.018_55)] hover:text-[oklch(0.42_0.08_148)] transition-colors"
      >
        <span>{question}</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && (
        <p className="pb-4 text-sm font-body text-[oklch(0.42_0.02_55)] leading-relaxed">
          {answer}
        </p>
      )}
    </div>
  );
}

export default function AceiteDetalle() {
  const { slug } = useParams<{ slug: string }>();
  const { addItem, removeItem, isInCart } = useConsultaCart();

  const { data: product, isLoading, error } = trpc.oils.getProduct.useQuery(
    { slug: slug ?? "" },
    { enabled: !!slug }
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 size={32} className="animate-spin text-[oklch(0.52_0.08_148)]" />
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-6 py-24 text-center space-y-4">
          <Leaf size={40} className="mx-auto text-[oklch(0.72_0.06_148)] opacity-40" />
          <h1 className="font-display text-2xl text-[oklch(0.18_0.018_55)]">Producto no encontrado</h1>
          <Link href="/aceites-esenciales">
            <button className="text-xs font-body uppercase tracking-wider text-[oklch(0.52_0.08_148)] underline">
              Volver al catálogo
            </button>
          </Link>
        </div>
      </Layout>
    );
  }

  const inCart = isInCart(product.id);
  const beneficios = parseJsonArray(product.beneficios);
  const indicaciones = parseJsonArray(product.indicaciones);
  const tags = parseJsonArray(product.tags);

  function handleToggleCart() {
    if (inCart) {
      removeItem(product!.id);
      toast.success(`"${product!.name}" eliminado de tu consulta`);
    } else {
      addItem({
        id: product!.id,
        name: product!.name,
        slug: product!.slug,
        tipoProducto: product!.tipoProducto,
        imagen: product!.imagen,
      });
      toast.success(`"${product!.name}" añadido a tu consulta`, {
        action: { label: "Ver consulta", onClick: () => window.location.href = "/mi-consulta" },
      });
    }
  }

  return (
    <Layout>
      {/* ─── BREADCRUMB ───────────────────────────────────────────────────── */}
      <div className="bg-[oklch(0.98_0.004_80)] border-b border-[oklch(0.92_0.01_80)]">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-2 text-xs font-body text-[oklch(0.52_0.04_80)]">
          <Link href="/" className="hover:text-[oklch(0.52_0.08_148)] transition-colors">Inicio</Link>
          <span>/</span>
          <Link href="/aceites-esenciales" className="hover:text-[oklch(0.52_0.08_148)] transition-colors">Aceites Esenciales</Link>
          <span>/</span>
          <span className="text-[oklch(0.18_0.018_55)]">{product.name}</span>
        </div>
      </div>

      {/* ─── HERO PRODUCTO ────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Imagen */}
          <div className="sticky top-24">
            <div className="aspect-square bg-[oklch(0.97_0.006_85)] flex items-center justify-center overflow-hidden">
              {product.imagen ? (
                <img
                  src={product.imagen}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Leaf size={80} className="text-[oklch(0.72_0.06_148)] opacity-30" />
              )}
            </div>
            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {tags.map((tag, i) => (
                  <span key={i} className="text-[0.65rem] font-body uppercase tracking-wider px-2 py-0.5 bg-[oklch(0.94_0.01_80)] text-[oklch(0.42_0.02_55)]">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-6">
            {/* Tipo */}
            <div className="flex items-center gap-3">
              <span className="text-[0.65rem] font-body uppercase tracking-wider px-2 py-0.5 bg-[oklch(0.92_0.06_148)] text-[oklch(0.32_0.08_148)]">
                {TIPO_LABELS[product.tipoProducto] ?? product.tipoProducto}
              </span>
              <Link href="/aceites-esenciales" className="flex items-center gap-1 text-xs font-body text-[oklch(0.52_0.04_80)] hover:text-[oklch(0.52_0.08_148)] transition-colors">
                <ArrowLeft size={12} /> Volver al catálogo
              </Link>
            </div>

            {/* Nombre */}
            <h1 className="font-display text-3xl md:text-4xl text-[oklch(0.18_0.018_55)] leading-tight">
              {product.name}
            </h1>

            {/* Descripción */}
            {product.descripcion && (
              <p className="font-body text-[oklch(0.42_0.02_55)] leading-relaxed">
                {product.descripcion}
              </p>
            )}

            {/* Beneficios */}
            {beneficios.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-body uppercase tracking-wider text-[oklch(0.52_0.04_80)]">Beneficios clave</h3>
                <ul className="space-y-2">
                  {beneficios.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm font-body text-[oklch(0.38_0.02_55)]">
                      <span className="text-[oklch(0.52_0.08_148)] mt-0.5 flex-shrink-0 font-bold">✦</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Indicaciones */}
            {indicaciones.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-body uppercase tracking-wider text-[oklch(0.52_0.04_80)]">Indicaciones de uso</h3>
                <ul className="space-y-2">
                  {indicaciones.map((ind, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm font-body text-[oklch(0.38_0.02_55)]">
                      <span className="text-[oklch(0.72_0.06_148)] mt-0.5 flex-shrink-0">→</span>
                      <span>{ind}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Bloque obligatorio de personalización */}
            <div className="bg-[oklch(0.96_0.02_148)] border-l-4 border-[oklch(0.52_0.08_148)] px-4 py-4 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-[oklch(0.52_0.08_148)] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-body text-sm font-medium text-[oklch(0.28_0.06_148)]">
                    Este producto requiere personalización
                  </p>
                  <p className="font-body text-xs text-[oklch(0.42_0.06_148)] mt-1 leading-relaxed">
                    Su uso depende de dosis, combinación y contexto individual. Cristina te orientará sobre la forma más adecuada para ti.
                  </p>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                onClick={handleToggleCart}
                className={`flex-1 font-body text-xs uppercase tracking-wider h-12 gap-2 ${
                  inCart
                    ? "bg-[oklch(0.52_0.08_148)] hover:bg-[oklch(0.42_0.08_148)] text-white"
                    : "bg-[oklch(0.18_0.018_55)] hover:bg-[oklch(0.28_0.018_55)] text-white"
                }`}
                style={{ borderRadius: 0 }}
              >
                {inCart ? <Check size={14} /> : <ShoppingBag size={14} />}
                {inCart ? "Añadido a mi consulta" : "Añadir a mi consulta"}
              </Button>
              <Link href="/consultas" className="flex-1">
                <Button
                  variant="outline"
                  className="w-full font-body text-xs uppercase tracking-wider h-12 gap-2 border-[oklch(0.52_0.08_148)] text-[oklch(0.42_0.08_148)] hover:bg-[oklch(0.95_0.02_148)]"
                  style={{ borderRadius: 0 }}
                >
                  <ArrowRight size={14} />
                  Reservar consulta con Cristina
                </Button>
              </Link>
            </div>

            {/* Mensaje personalizado */}
            {product.mensajeConsulta && (
              <p className="text-xs font-body text-[oklch(0.52_0.04_80)] italic leading-relaxed">
                {product.mensajeConsulta}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ─── USO GENERAL ──────────────────────────────────────────────────── */}
      {product.usoGeneral && (
        <section className="bg-[oklch(0.97_0.006_85)] border-y border-[oklch(0.92_0.01_80)]">
          <div className="max-w-6xl mx-auto px-6 py-10">
            <h2 className="font-display text-xl text-[oklch(0.18_0.018_55)] mb-4">Información de uso</h2>
            <p className="font-body text-sm text-[oklch(0.42_0.02_55)] leading-relaxed max-w-2xl">
              {product.usoGeneral}
            </p>
          </div>
        </section>
      )}

      {/* ─── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 py-12">
        <h2 className="font-display text-xl text-[oklch(0.18_0.018_55)] mb-6">Preguntas frecuentes</h2>
        <div>
          <FAQItem
            question={`¿Cómo sé si ${product.name} es adecuado para mí?`}
            answer={`Cada persona tiene una constitución y unas necesidades únicas. Cristina puede ayudarte a determinar si ${product.name} es el aceite más adecuado para tu situación, en qué dosis y combinado con qué otros aceites.`}
          />
          <FAQItem
            question="¿Puedo usarlo sin consultar a un profesional?"
            answer="Los aceites esenciales son herramientas terapéuticas potentes. Aunque muchos tienen un perfil de seguridad excelente, su uso óptimo requiere conocer tu historial de salud, medicación y objetivos. Una consulta con Cristina garantiza un uso seguro y efectivo."
          />
          <FAQItem
            question="¿Qué incluye la consulta con Cristina?"
            answer="La consulta incluye una evaluación de tu estado de salud y objetivos, una selección personalizada de aceites, protocolos de uso específicos para ti, y seguimiento para ajustar el protocolo según tu evolución."
          />
          <FAQItem
            question="¿Cómo funciona el sistema de 'Añadir a mi consulta'?"
            answer="Puedes añadir todos los aceites que te interesen a tu lista de consulta. Cuando la envíes, Cristina revisará tu selección y te contactará para orientarte sobre cuáles son los más adecuados para ti y cómo usarlos."
          />
        </div>
      </section>

      {/* ─── CTA FINAL ────────────────────────────────────────────────────── */}
      <section className="bg-[oklch(0.14_0.018_55)] text-white py-12">
        <div className="max-w-3xl mx-auto px-6 text-center space-y-5">
          <Leaf size={28} className="mx-auto text-[oklch(0.72_0.06_148)]" />
          <h2 className="font-display text-2xl">¿Listo para empezar?</h2>
          <p className="font-body text-[oklch(0.78_0.01_80)] leading-relaxed">
            Añade este aceite a tu consulta o reserva directamente una sesión con Cristina.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={handleToggleCart}
              className={`text-xs font-body uppercase tracking-wider px-6 py-3 transition-colors flex items-center gap-2 ${
                inCart
                  ? "bg-[oklch(0.52_0.08_148)] text-white hover:bg-[oklch(0.42_0.08_148)]"
                  : "bg-white text-[oklch(0.18_0.018_55)] hover:bg-[oklch(0.92_0.01_80)]"
              }`}
              style={{ borderRadius: 0 }}
            >
              {inCart ? <Check size={13} /> : <ShoppingBag size={13} />}
              {inCart ? "Añadido a mi consulta" : "Añadir a mi consulta"}
            </button>
            <Link href="/consultas">
              <button className="text-xs font-body uppercase tracking-wider px-6 py-3 bg-[oklch(0.52_0.08_148)] text-white hover:bg-[oklch(0.42_0.08_148)] transition-colors flex items-center gap-2" style={{ borderRadius: 0 }}>
                Reservar consulta <ArrowRight size={13} />
              </button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
