/**
 * SistemaAguaDetalle — Ficha pública de detalle de un sistema de agua
 * Cristina Vive Consciente
 * Diseño: "Agua Viva" — Premium, natural, consultivo
 */

import { useState } from "react";
import { Link, useParams } from "wouter";
import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Droplets,
  CheckCircle,
  ArrowLeft,
  Star,
  Shield,
  Phone,
  ChevronDown,
  ChevronUp,
  Loader2,
  X,
  Send,
  Wrench,
  Award,
  Package,
  Users,
} from "lucide-react";

// ─── MODAL DE RESERVA (reutilizado de SistemasAgua) ──────────────────────────

interface ReservaModalProps {
  productId?: number;
  productName?: string;
  onClose: () => void;
}

function ReservaModal({ productId, productName, onClose }: ReservaModalProps) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    province: "",
    city: "",
    housingType: "",
    observations: "",
    acceptPrivacy: false,
  });
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = trpc.water.submitInquiry.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: (err) => toast.error(`Error: ${err.message}`),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate({ ...form, productId, productName });
  };

  const set = (key: string, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-[#F0F4F0] rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-[#3A5A3A]" />
          </div>
          <h3 className="text-xl font-serif text-[#1A1208] mb-2">¡Solicitud recibida!</h3>
          <p className="text-[#5A4E3E] text-sm leading-relaxed mb-6">
            Cristina te contactará en las próximas <strong>24–48 horas</strong> para orientarte sin compromiso.
          </p>
          <button onClick={onClose} className="px-6 py-2.5 bg-[#3A5A3A] text-white rounded-xl text-sm hover:bg-[#2E4A2E] transition-colors">
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-[#E8E4DC] flex items-start justify-between">
          <div>
            <h3 className="text-xl font-serif text-[#1A1208]">Reservar sistema</h3>
            {productName && <p className="text-sm text-[#3A5A3A] font-medium mt-0.5">{productName}</p>}
            <p className="text-xs text-[#7A6E5E] mt-1">Cristina te contactará para orientarte sin compromiso</p>
          </div>
          <button onClick={onClose} className="p-2 text-[#A09080] hover:text-[#1A1208] hover:bg-[#F5F2EC] rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#7A6E5E] mb-1">Nombre *</label>
              <input type="text" required value={form.firstName} onChange={(e) => set("firstName", e.target.value)}
                className="w-full border border-[#E8E4DC] rounded-lg px-3 py-2 text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A]" placeholder="Tu nombre" />
            </div>
            <div>
              <label className="block text-xs text-[#7A6E5E] mb-1">Apellidos *</label>
              <input type="text" required value={form.lastName} onChange={(e) => set("lastName", e.target.value)}
                className="w-full border border-[#E8E4DC] rounded-lg px-3 py-2 text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A]" placeholder="Tus apellidos" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#7A6E5E] mb-1">Teléfono *</label>
              <input type="tel" required value={form.phone} onChange={(e) => set("phone", e.target.value)}
                className="w-full border border-[#E8E4DC] rounded-lg px-3 py-2 text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A]" placeholder="+34 600 000 000" />
            </div>
            <div>
              <label className="block text-xs text-[#7A6E5E] mb-1">Email *</label>
              <input type="email" required value={form.email} onChange={(e) => set("email", e.target.value)}
                className="w-full border border-[#E8E4DC] rounded-lg px-3 py-2 text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A]" placeholder="tu@email.com" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#7A6E5E] mb-1">Provincia</label>
              <input type="text" value={form.province} onChange={(e) => set("province", e.target.value)}
                className="w-full border border-[#E8E4DC] rounded-lg px-3 py-2 text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A]" placeholder="Madrid" />
            </div>
            <div>
              <label className="block text-xs text-[#7A6E5E] mb-1">Ciudad</label>
              <input type="text" value={form.city} onChange={(e) => set("city", e.target.value)}
                className="w-full border border-[#E8E4DC] rounded-lg px-3 py-2 text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A]" placeholder="Tu ciudad" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-[#7A6E5E] mb-1">Tipo de vivienda</label>
            <select value={form.housingType} onChange={(e) => set("housingType", e.target.value)}
              className="w-full border border-[#E8E4DC] rounded-lg px-3 py-2 text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A]">
              <option value="">Selecciona tipo de vivienda</option>
              <option value="Piso">Piso</option>
              <option value="Casa">Casa</option>
              <option value="Chalet">Chalet</option>
              <option value="Ático">Ático</option>
              <option value="Local comercial">Local comercial</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#7A6E5E] mb-1">Observaciones o preguntas</label>
            <textarea value={form.observations} onChange={(e) => set("observations", e.target.value)} rows={3}
              className="w-full border border-[#E8E4DC] rounded-lg px-3 py-2 text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A] resize-none"
              placeholder="Cuéntanos brevemente tu situación o cualquier pregunta..." />
          </div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" required checked={form.acceptPrivacy} onChange={(e) => set("acceptPrivacy", e.target.checked)} className="mt-0.5 rounded border-[#E8E4DC]" />
            <span className="text-xs text-[#7A6E5E] leading-relaxed">
              He leído y acepto la{" "}
              <Link href="/privacidad"><a className="text-[#3A5A3A] underline hover:no-underline">política de privacidad</a></Link>.
              Mis datos serán tratados para gestionar esta solicitud y no serán cedidos a terceros.
            </span>
          </label>
          <button type="submit" disabled={submitMutation.isPending || !form.acceptPrivacy}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#3A5A3A] text-white rounded-xl font-medium hover:bg-[#2E4A2E] transition-colors disabled:opacity-50">
            {submitMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Enviar solicitud
          </button>
          <p className="text-xs text-center text-[#A09080]">Sin compromiso. Cristina te contactará personalmente para orientarte.</p>
        </form>
      </div>
    </div>
  );
}

// ─── FAQ ITEM ─────────────────────────────────────────────────────────────────

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#E8E4DC] last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left gap-4"
      >
        <span className="font-medium text-[#1A1208] text-sm">{q}</span>
        {open ? <ChevronUp size={16} className="text-[#3A5A3A] flex-shrink-0" /> : <ChevronDown size={16} className="text-[#A09080] flex-shrink-0" />}
      </button>
      {open && (
        <p className="pb-4 text-sm text-[#5A4E3E] leading-relaxed">{a}</p>
      )}
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

export default function SistemaAguaDetalle() {
  const { slug } = useParams<{ slug: string }>();
  const [reservaOpen, setReservaOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const { data: product, isLoading, error } = trpc.water.getProduct.useQuery({ slug });

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-[#3A5A3A]" />
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Droplets size={48} className="mx-auto text-[#C0B8A8] mb-4" />
            <h2 className="text-xl font-serif text-[#1A1208] mb-2">Producto no encontrado</h2>
            <Link href="/sistemas-agua">
              <a className="text-[#3A5A3A] underline text-sm">Volver al catálogo</a>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const benefits: string[] = (() => { try { return JSON.parse(product.benefits ?? "[]"); } catch { return []; } })();
  const claims: string[] = (() => { try { return JSON.parse(product.claimsHighlighted ?? "[]"); } catch { return []; } })();
  const techSpecs: { key: string; value: string }[] = (() => { try { return JSON.parse(product.technicalSpecs ?? "[]"); } catch { return []; } })();
  const bullets: string[] = (() => { try { return JSON.parse(product.bulletAdvantages ?? "[]"); } catch { return []; } })();
  const faqs: { q: string; a: string }[] = (() => { try { return JSON.parse(product.faqBlock ?? "[]"); } catch { return []; } })();
  const gallery: string[] = (() => { try { return JSON.parse(product.galleryImages ?? "[]"); } catch { return []; } })();

  const allImages = [product.mainImage, ...gallery].filter(Boolean) as string[];

  return (
    <Layout>
      {/* ── BREADCRUMB ──────────────────────────────────────────────────────── */}
      <div className="bg-[#F5F2EC] border-b border-[#E8E4DC] py-3">
        <div className="max-w-6xl mx-auto px-6 flex items-center gap-2 text-sm text-[#7A6E5E]">
          <Link href="/"><a className="hover:text-[#3A5A3A] transition-colors">Inicio</a></Link>
          <span>/</span>
          <Link href="/sistemas-agua"><a className="hover:text-[#3A5A3A] transition-colors">Sistemas de Agua</a></Link>
          <span>/</span>
          <span className="text-[#1A1208]">{product.title}</span>
        </div>
      </div>

      {/* ── HERO PRODUCTO ────────────────────────────────────────────────────── */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Galería */}
            <div className="space-y-4">
              <div className="aspect-[4/3] bg-gradient-to-br from-[#E8F0E8] to-[#F0F4F0] rounded-2xl overflow-hidden">
                {allImages.length > 0 ? (
                  <img
                    src={allImages[activeImage]}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Droplets size={64} className="text-[#A0C0A0]" />
                  </div>
                )}
              </div>
              {allImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {allImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                        activeImage === i ? "border-[#3A5A3A]" : "border-transparent"
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info principal */}
            <div className="space-y-5">
              {product.badge && (
                <div
                  className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: product.badgeColor ?? "#3A5A3A" }}
                >
                  {product.badge}
                </div>
              )}
              <div>
                <h1 className="text-3xl md:text-4xl font-serif text-[#1A1208] mb-2">{product.title}</h1>
                {product.subtitle && (
                  <p className="text-lg text-[#3A5A3A] font-medium">{product.subtitle}</p>
                )}
              </div>

              {product.shortDescription && (
                <p className="text-[#5A4E3E] leading-relaxed">{product.shortDescription}</p>
              )}

              {/* Claims destacados */}
              {claims.length > 0 && (
                <ul className="space-y-2">
                  {claims.map((claim, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-[#5A4E3E]">
                      <CheckCircle size={15} className="text-[#3A5A3A] flex-shrink-0 mt-0.5" />
                      <span>{claim}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Precio */}
              {product.priceVisible && (
                <div className="border-t border-[#E8E4DC] pt-5">
                  <p className="text-3xl font-serif text-[#1A1208]">{product.priceVisible}</p>
                  {product.priceOrientative && (
                    <p className="text-xs text-[#A09080] mt-1">{product.priceOrientative}</p>
                  )}
                </div>
              )}

              {/* CTAs */}
              <div className="flex flex-col gap-3 pt-2">
                <button
                  onClick={() => setReservaOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-[#3A5A3A] text-white rounded-xl font-semibold hover:bg-[#2E4A2E] transition-colors text-lg"
                >
                  <Droplets size={20} />
                  {product.ctaPrimaryLabel ?? "Reservar sistema"}
                </button>
                <button
                  onClick={() => setReservaOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 border border-[#3A5A3A] text-[#3A5A3A] rounded-xl font-medium hover:bg-[#F0F4F0] transition-colors"
                >
                  <Phone size={16} />
                  Solicitar asesoramiento
                </button>
              </div>

              <p className="text-xs text-[#A09080] text-center">
                Sin compromiso. Cristina te orienta personalmente antes de cualquier decisión.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── DESCRIPCIÓN COMPLETA ─────────────────────────────────────────────── */}
      {product.longDescription && (
        <section className="py-12 bg-[#FAFAF7]">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-2xl font-serif text-[#1A1208] mb-6">Descripción completa</h2>
            <div className="prose prose-sm max-w-none text-[#5A4E3E] leading-relaxed space-y-4">
              {product.longDescription.split("\n\n").map((para: string, i: number) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── BENEFICIOS ───────────────────────────────────────────────────────── */}
      {benefits.length > 0 && (
        <section className="py-12 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl font-serif text-[#1A1208] mb-8 text-center">Beneficios principales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {benefits.map((benefit, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-[#F5F2EC] rounded-xl border border-[#E8E4DC]">
                  <div className="w-8 h-8 bg-[#3A5A3A] rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle size={14} className="text-white" />
                  </div>
                  <p className="text-sm text-[#5A4E3E] leading-relaxed">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── ESPECIFICACIONES TÉCNICAS ────────────────────────────────────────── */}
      {techSpecs.length > 0 && (
        <section className="py-12 bg-[#F5F2EC]">
          <div className="max-w-4xl mx-auto px-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-[#3A5A3A] rounded-xl flex items-center justify-center">
                <Package size={18} className="text-white" />
              </div>
              <h2 className="text-2xl font-serif text-[#1A1208]">Especificaciones técnicas</h2>
            </div>
            <div className="bg-white rounded-2xl border border-[#E8E4DC] overflow-hidden">
              {techSpecs.map((spec, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-4 px-6 py-4 ${i % 2 === 0 ? "bg-white" : "bg-[#FAFAF7]"} ${i < techSpecs.length - 1 ? "border-b border-[#E8E4DC]" : ""}`}
                >
                  <span className="text-sm font-medium text-[#5A4E3E] w-48 flex-shrink-0">{spec.key}</span>
                  <span className="text-sm text-[#1A1208]">{spec.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── INSTALACIÓN + MANTENIMIENTO + GARANTÍA ──────────────────────────── */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-serif text-[#1A1208] mb-8 text-center">Instalación y acompañamiento</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {product.installationText && (
              <div className="p-6 bg-[#F0F4F0] rounded-2xl border border-[#E8E4DC]">
                <div className="w-10 h-10 bg-[#3A5A3A] rounded-xl flex items-center justify-center mb-4">
                  <Wrench size={18} className="text-white" />
                </div>
                <h3 className="font-semibold text-[#1A1208] mb-2">Instalación</h3>
                <p className="text-sm text-[#5A4E3E] leading-relaxed">{product.installationText}</p>
              </div>
            )}
            {product.maintenanceText && (
              <div className="p-6 bg-[#F0F4F0] rounded-2xl border border-[#E8E4DC]">
                <div className="w-10 h-10 bg-[#3A5A3A] rounded-xl flex items-center justify-center mb-4">
                  <Star size={18} className="text-white" />
                </div>
                <h3 className="font-semibold text-[#1A1208] mb-2">Mantenimiento</h3>
                <p className="text-sm text-[#5A4E3E] leading-relaxed">{product.maintenanceText}</p>
              </div>
            )}
            {product.warrantyText && (
              <div className="p-6 bg-[#F0F4F0] rounded-2xl border border-[#E8E4DC]">
                <div className="w-10 h-10 bg-[#3A5A3A] rounded-xl flex items-center justify-center mb-4">
                  <Award size={18} className="text-white" />
                </div>
                <h3 className="font-semibold text-[#1A1208] mb-2">Garantía</h3>
                <p className="text-sm text-[#5A4E3E] leading-relaxed">{product.warrantyText}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── POR QUÉ ELEGIR + PARA QUIÉN ─────────────────────────────────────── */}
      {(product.whyChooseBlock || product.forWhom) && (
        <section className="py-12 bg-[#FAFAF7]">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {product.whyChooseBlock && (
                <div className="p-6 bg-white rounded-2xl border border-[#E8E4DC]">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield size={20} className="text-[#3A5A3A]" />
                    <h3 className="font-semibold text-[#1A1208]">¿Por qué elegir este sistema?</h3>
                  </div>
                  <p className="text-sm text-[#5A4E3E] leading-relaxed">{product.whyChooseBlock}</p>
                </div>
              )}
              {product.forWhom && (
                <div className="p-6 bg-white rounded-2xl border border-[#E8E4DC]">
                  <div className="flex items-center gap-3 mb-4">
                    <Users size={20} className="text-[#3A5A3A]" />
                    <h3 className="font-semibold text-[#1A1208]">¿Para quién es ideal?</h3>
                  </div>
                  <p className="text-sm text-[#5A4E3E] leading-relaxed">{product.forWhom}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── BLOQUE EXPERTO ───────────────────────────────────────────────────── */}
      {product.expertBlock && (
        <section className="py-12 bg-gradient-to-br from-[#1A2E1A] to-[#2A3E2A] text-white">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="w-14 h-14 bg-[#7AB87A]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Droplets size={24} className="text-[#7AB87A]" />
            </div>
            <p className="text-xs text-[#7AB87A] uppercase tracking-widest mb-4">Asesorado por Cristina Battistelli</p>
            <p className="text-lg text-white/90 leading-relaxed mb-8">{product.expertBlock}</p>
            <button
              onClick={() => setReservaOpen(true)}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#7AB87A] text-[#1A2E1A] rounded-xl font-semibold hover:bg-[#8AC88A] transition-colors"
            >
              <Phone size={16} />
              Solicitar orientación personalizada
            </button>
          </div>
        </section>
      )}

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      {faqs.length > 0 && (
        <section className="py-12 bg-white">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-2xl font-serif text-[#1A1208] mb-8 text-center">Preguntas frecuentes</h2>
            <div className="bg-[#FAFAF7] rounded-2xl border border-[#E8E4DC] px-6">
              {faqs.map((faq, i) => (
                <FaqItem key={i} q={faq.q} a={faq.a} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA FINAL ────────────────────────────────────────────────────────── */}
      <section className="py-16 bg-[#F5F2EC]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-serif text-[#1A1208] mb-4">
            ¿Listo para dar el paso?
          </h2>
          <p className="text-[#5A4E3E] leading-relaxed mb-8">
            Reserva una consulta gratuita con Cristina. Analizamos juntos las necesidades de tu hogar y te orientamos hacia el sistema que realmente necesitas, sin presión y sin compromiso.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setReservaOpen(true)}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-[#3A5A3A] text-white rounded-xl font-semibold hover:bg-[#2E4A2E] transition-colors"
            >
              <Droplets size={18} />
              {product.ctaPrimaryLabel ?? "Reservar sistema"}
            </button>
            <Link href="/sistemas-agua">
              <a className="flex items-center justify-center gap-2 px-8 py-4 border border-[#3A5A3A] text-[#3A5A3A] rounded-xl font-medium hover:bg-[#F0F4F0] transition-colors">
                <ArrowLeft size={16} />
                Ver todos los sistemas
              </a>
            </Link>
          </div>
        </div>
      </section>

      {/* ── MODAL ────────────────────────────────────────────────────────────── */}
      {reservaOpen && (
        <ReservaModal
          productId={product.id}
          productName={product.title}
          onClose={() => setReservaOpen(false)}
        />
      )}
    </Layout>
  );
}
