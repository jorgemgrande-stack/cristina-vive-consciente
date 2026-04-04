/**
 * SistemasAgua — Página pública de listado de sistemas de agua
 * Cristina Vive Consciente
 * Diseño: "Agua Viva" — Premium, natural, consultivo
 * Contenido dinámico desde BD + modal de reserva
 */

import { useState } from "react";
import { Link } from "wouter";
import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Droplets,
  CheckCircle,
  ArrowRight,
  Star,
  Shield,
  Phone,
  ChevronRight,
  Loader2,
  X,
  Send,
  BookOpen,
} from "lucide-react";

// ─── MODAL DE RESERVA ─────────────────────────────────────────────────────────

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
    onSuccess: () => {
      setSubmitted(true);
    },
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
            Hemos recibido tu solicitud. Cristina te contactará en las próximas{" "}
            <strong>24–48 horas</strong> para orientarte en la elección del sistema ideal para tu hogar.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#3A5A3A] text-white rounded-xl text-sm hover:bg-[#2E4A2E] transition-colors"
          >
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
            {productName && (
              <p className="text-sm text-[#3A5A3A] font-medium mt-0.5">{productName}</p>
            )}
            <p className="text-xs text-[#7A6E5E] mt-1">
              Cristina te contactará para orientarte sin compromiso
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#A09080] hover:text-[#1A1208] hover:bg-[#F5F2EC] rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#7A6E5E] mb-1">Nombre *</label>
              <input
                type="text"
                required
                value={form.firstName}
                onChange={(e) => set("firstName", e.target.value)}
                className="w-full border border-[#E8E4DC] rounded-lg px-3 py-2 text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A]"
                placeholder="Tu nombre"
              />
            </div>
            <div>
              <label className="block text-xs text-[#7A6E5E] mb-1">Apellidos *</label>
              <input
                type="text"
                required
                value={form.lastName}
                onChange={(e) => set("lastName", e.target.value)}
                className="w-full border border-[#E8E4DC] rounded-lg px-3 py-2 text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A]"
                placeholder="Tus apellidos"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#7A6E5E] mb-1">Teléfono *</label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                className="w-full border border-[#E8E4DC] rounded-lg px-3 py-2 text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A]"
                placeholder="+34 600 000 000"
              />
            </div>
            <div>
              <label className="block text-xs text-[#7A6E5E] mb-1">Email *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                className="w-full border border-[#E8E4DC] rounded-lg px-3 py-2 text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A]"
                placeholder="tu@email.com"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#7A6E5E] mb-1">Provincia</label>
              <input
                type="text"
                value={form.province}
                onChange={(e) => set("province", e.target.value)}
                className="w-full border border-[#E8E4DC] rounded-lg px-3 py-2 text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A]"
                placeholder="Madrid"
              />
            </div>
            <div>
              <label className="block text-xs text-[#7A6E5E] mb-1">Ciudad</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                className="w-full border border-[#E8E4DC] rounded-lg px-3 py-2 text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A]"
                placeholder="Tu ciudad"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-[#7A6E5E] mb-1">Tipo de vivienda</label>
            <select
              value={form.housingType}
              onChange={(e) => set("housingType", e.target.value)}
              className="w-full border border-[#E8E4DC] rounded-lg px-3 py-2 text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A]"
            >
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
            <textarea
              value={form.observations}
              onChange={(e) => set("observations", e.target.value)}
              rows={3}
              className="w-full border border-[#E8E4DC] rounded-lg px-3 py-2 text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A] resize-none"
              placeholder="Cuéntanos brevemente tu situación o cualquier pregunta..."
            />
          </div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={form.acceptPrivacy}
              onChange={(e) => set("acceptPrivacy", e.target.checked)}
              className="mt-0.5 rounded border-[#E8E4DC]"
            />
            <span className="text-xs text-[#7A6E5E] leading-relaxed">
              He leído y acepto la{" "}
              <Link href="/privacidad">
                <a className="text-[#3A5A3A] underline hover:no-underline">política de privacidad</a>
              </Link>
              . Mis datos serán tratados para gestionar esta solicitud y no serán cedidos a terceros.
            </span>
          </label>
          <button
            type="submit"
            disabled={submitMutation.isPending || !form.acceptPrivacy}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#3A5A3A] text-white rounded-xl font-medium hover:bg-[#2E4A2E] transition-colors disabled:opacity-50"
          >
            {submitMutation.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            Enviar solicitud
          </button>
          <p className="text-xs text-center text-[#A09080]">
            Sin compromiso. Cristina te contactará personalmente para orientarte.
          </p>
        </form>
      </div>
    </div>
  );
}

// ─── TARJETA DE PRODUCTO ──────────────────────────────────────────────────────

interface WaterProduct {
  id: number;
  title: string;
  slug: string;
  subtitle: string | null;
  shortDescription: string | null;
  priceVisible: string | null;
  priceOrientative: string | null;
  mainImage: string | null;
  benefits: string | null;
  badge: string | null;
  badgeColor: string | null;
  ctaPrimaryLabel: string | null;
  ctaSecondaryLabel: string | null;
}

function ProductCard({
  product,
  onReservar,
}: {
  product: WaterProduct;
  onReservar: (id: number, name: string) => void;
}) {
  const benefits: string[] = (() => {
    try {
      return JSON.parse(product.benefits ?? "[]");
    } catch {
      return [];
    }
  })();

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-[#E8E4DC] hover:border-[#B8D4B8] hover:shadow-xl transition-all duration-300 group flex flex-col">
      {/* Imagen */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-[#E8F0E8] to-[#F0F4F0] overflow-hidden">
        {product.mainImage ? (
          <img
            src={product.mainImage}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Droplets size={48} className="text-[#A0C0A0]" />
          </div>
        )}
        {product.badge && (
          <div
            className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold text-white shadow-sm"
            style={{ backgroundColor: product.badgeColor ?? "#3A5A3A" }}
          >
            {product.badge}
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="p-6 flex flex-col flex-1">
        <div className="flex-1">
          <h3 className="text-xl font-serif text-[#1A1208] mb-1">{product.title}</h3>
          {product.subtitle && (
            <p className="text-sm text-[#3A5A3A] font-medium mb-3">{product.subtitle}</p>
          )}
          {product.shortDescription && (
            <p className="text-sm text-[#5A4E3E] leading-relaxed mb-4 line-clamp-3">
              {product.shortDescription}
            </p>
          )}

          {benefits.length > 0 && (
            <ul className="space-y-1.5 mb-4">
              {benefits.slice(0, 4).map((benefit, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#5A4E3E]">
                  <CheckCircle size={14} className="text-[#3A5A3A] flex-shrink-0 mt-0.5" />
                  <span>{benefit}</span>
                </li>
              ))}
              {benefits.length > 4 && (
                <li className="text-xs text-[#A09080] pl-5">
                  + {benefits.length - 4} beneficios más
                </li>
              )}
            </ul>
          )}
        </div>

        {/* Precio */}
        {(product.priceVisible || product.priceOrientative) && (
          <div className="border-t border-[#E8E4DC] pt-4 mb-4">
            {product.priceVisible ? (
              <p className="text-2xl font-serif text-[#1A1208]">{product.priceVisible}</p>
            ) : (
              <p className="text-sm text-[#7A6E5E] italic">{product.priceOrientative}</p>
            )}
            {product.priceVisible && product.priceOrientative && (
              <p className="text-xs text-[#A09080] mt-0.5">{product.priceOrientative}</p>
            )}
          </div>
        )}

        {/* CTAs */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => onReservar(product.id, product.title)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#3A5A3A] text-white rounded-xl font-medium hover:bg-[#2E4A2E] transition-colors"
          >
            <Droplets size={16} />
            {product.ctaPrimaryLabel ?? "Reservar sistema"}
          </button>
          <Link href={`/sistemas-agua/${product.slug}`}>
            <a className="w-full flex items-center justify-center gap-2 py-2.5 border border-[#3A5A3A] text-[#3A5A3A] rounded-xl text-sm font-medium hover:bg-[#F0F4F0] transition-colors">
              {product.ctaSecondaryLabel ?? "Conocer más detalles"}
              <ChevronRight size={14} />
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

export default function SistemasAgua() {
  const [reservaModal, setReservaModal] = useState<{ id: number; name: string } | null>(null);
  const [filterCategory, setFilterCategory] = useState<number | null>(null);

  const { data: categories } = trpc.water.listCategories.useQuery();
  const { data: products, isLoading } = trpc.water.listProducts.useQuery(
    filterCategory ? { categoryId: filterCategory } : undefined
  );

  const handleReservar = (id: number, name: string) => {
    setReservaModal({ id, name });
  };

  return (
    <Layout>
      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-[#1A2E1A] via-[#2A3E2A] to-[#1A2E1A] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#7AB87A] rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#4A8A7A] rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-6">
              <Droplets size={18} className="text-[#7AB87A]" />
              <span className="text-sm text-[#7AB87A] font-medium tracking-wide uppercase">
                Sistemas de Agua
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif leading-tight mb-6">
              El agua que bebes
              <br />
              <span className="text-[#7AB87A]">define tu salud</span>
            </h1>
            <p className="text-lg text-white/80 leading-relaxed mb-8 max-w-2xl">
              No todos los sistemas de agua son iguales. Cristina Battistelli te ayuda a elegir el
              sistema ideal para tu hogar, tu agua y tu estilo de vida, con acompañamiento experto
              desde la elección hasta la instalación.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setReservaModal({ id: 0, name: "" })}
                className="flex items-center gap-2 px-6 py-3 bg-[#7AB87A] text-[#1A2E1A] rounded-xl font-semibold hover:bg-[#8AC88A] transition-colors"
              >
                <Phone size={16} />
                Solicitar asesoramiento
              </button>
              <a
                href="#productos"
                className="flex items-center gap-2 px-6 py-3 border border-white/30 text-white rounded-xl font-medium hover:bg-white/10 transition-colors"
              >
                Ver sistemas
                <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── BLOQUE DE AUTORIDAD ──────────────────────────────────────────────── */}
      <section className="bg-[#F5F2EC] py-12 border-y border-[#E8E4DC]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Shield size={24} className="text-[#3A5A3A]" />,
                title: "Asesoramiento experto",
                text: "Cristina analiza la calidad del agua de tu zona y las necesidades de tu hogar antes de recomendarte cualquier sistema.",
              },
              {
                icon: <Droplets size={24} className="text-[#3A5A3A]" />,
                title: "Selección personalizada",
                text: "No todos los sistemas sirven para todas las casas. Te orientamos hacia la solución que realmente necesitas.",
              },
              {
                icon: <Star size={24} className="text-[#3A5A3A]" />,
                title: "Acompañamiento completo",
                text: "Desde la elección hasta la instalación y el mantenimiento. Cristina está contigo en cada paso del proceso.",
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-12 h-12 bg-[#E8F0E8] rounded-xl flex items-center justify-center flex-shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-[#1A1208] mb-1">{item.title}</h3>
                  <p className="text-sm text-[#5A4E3E] leading-relaxed">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATÁLOGO DE PRODUCTOS ────────────────────────────────────────────── */}
      <section id="productos" className="py-16 bg-[#FAFAF7]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif text-[#1A1208] mb-4">
              Sistemas de agua seleccionados
            </h2>
            <p className="text-[#5A4E3E] max-w-2xl mx-auto leading-relaxed">
              Cada sistema ha sido evaluado y seleccionado personalmente por Cristina Battistelli por
              su calidad, fiabilidad y resultados reales en el bienestar de las familias.
            </p>
          </div>

          {/* Filtros por categoría */}
          {categories && categories.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center mb-10">
              <button
                onClick={() => setFilterCategory(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filterCategory === null
                    ? "bg-[#3A5A3A] text-white"
                    : "bg-white border border-[#E8E4DC] text-[#5A4E3E] hover:border-[#3A5A3A]"
                }`}
              >
                Todos
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    filterCategory === cat.id
                      ? "bg-[#3A5A3A] text-white"
                      : "bg-white border border-[#E8E4DC] text-[#5A4E3E] hover:border-[#3A5A3A]"
                  }`}
                >
                  {cat.icon && <span className="mr-1.5">{cat.icon}</span>}
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Grid de productos */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl overflow-hidden border border-[#E8E4DC] animate-pulse"
                >
                  <div className="aspect-[4/3] bg-[#F0F4F0]" />
                  <div className="p-6 space-y-3">
                    <div className="h-6 bg-[#F0F4F0] rounded w-3/4" />
                    <div className="h-4 bg-[#F0F4F0] rounded w-full" />
                    <div className="h-4 bg-[#F0F4F0] rounded w-5/6" />
                  </div>
                </div>
              ))}
            </div>
          ) : !products || products.length === 0 ? (
            <div className="text-center py-16">
              <Droplets size={48} className="mx-auto text-[#C0B8A8] mb-4" />
              <p className="text-[#7A6E5E]">No hay productos disponibles en esta categoría</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} onReservar={handleReservar} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── BLOQUE AGUA ESTRUCTURADA (contenido editorial) ───────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
            <div className="lg:col-span-3 space-y-5">
              <div>
                <p className="text-[#3A5A3A] text-xs tracking-[0.2em] uppercase mb-3 font-medium">
                  ¿Qué es el agua estructurada?
                </p>
                <h2 className="text-3xl font-serif text-[#1A1208] mb-4">
                  Más que filtrar, <em>transformar</em>
                </h2>
              </div>
              <p className="text-[#5A4E3E] leading-relaxed">
                Somos un 70% agua. El agua contenida en tu cuerpo es el principal transportador de
                nutrientes y oxígeno, además de ser fundamental para la eliminación de toxinas del
                organismo.
              </p>
              <p className="text-[#5A4E3E] leading-relaxed">
                Varias líneas de investigación sugieren que el agua no es un agente pasivo de salud.
                El agua de manantial, viva y en movimiento, tiene una estructura molecular que el agua
                del grifo ha perdido debido a la manipulación, los tratamientos químicos y los
                materiales de las tuberías.
              </p>
              <p className="text-[#5A4E3E] leading-relaxed">
                Los sistemas que seleccionamos no solo filtran: purifican, remineralizan y devuelven
                al agua su vitalidad natural, para que cada sorbo sea realmente nutritivo.
              </p>
              <div className="flex items-start gap-3 p-5 bg-[#F5F2EC] rounded-xl border border-[#E8E4DC]">
                <BookOpen size={16} className="text-[#3A5A3A] mt-0.5 flex-shrink-0" />
                <p className="text-[#5A4E3E] text-sm italic">
                  Como referencia científica, recomiendo las investigaciones de{" "}
                  <strong>Masaru Emoto</strong> sobre la estructura del agua y su respuesta a los
                  estímulos del entorno.
                </p>
              </div>
            </div>
            <div className="lg:col-span-2 space-y-5">
              <div className="p-8 bg-[#3A5A3A] text-center rounded-2xl">
                <p className="text-white font-serif mb-2" style={{ fontSize: "4rem", lineHeight: 1 }}>
                  70%
                </p>
                <p className="text-white/80 text-sm">de tu cuerpo es agua</p>
              </div>
              <div className="p-6 bg-[#F5F2EC] rounded-2xl border border-[#E8E4DC]">
                <p className="text-[#5A4E3E] text-xs tracking-widest uppercase mb-4 font-medium">
                  El agua estructurada puede
                </p>
                <ul className="space-y-2.5">
                  {[
                    "Mejorar la hidratación celular",
                    "Facilitar la eliminación de toxinas",
                    "Mejorar la absorción de nutrientes",
                    "Reducir la inflamación",
                    "Reforzar el sistema inmune",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2.5">
                      <CheckCircle size={13} className="text-[#3A5A3A] flex-shrink-0" />
                      <span className="text-[#5A4E3E] text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BLOQUE CRISTINA ASESORA ──────────────────────────────────────────── */}
      <section className="py-16 bg-[#F5F2EC]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="bg-gradient-to-br from-[#F0F4F0] to-[#E8F0E8] rounded-3xl p-8 md:p-12">
            <div className="max-w-3xl mx-auto text-center">
              <div className="w-16 h-16 bg-[#3A5A3A] rounded-full flex items-center justify-center mx-auto mb-6">
                <Droplets size={28} className="text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-serif text-[#1A1208] mb-4">
                "No todos los sistemas sirven para todas las casas"
              </h2>
              <p className="text-[#5A4E3E] leading-relaxed mb-6 text-lg">
                La calidad del agua varía enormemente según la zona, la instalación y las necesidades
                de cada familia. Antes de elegir un sistema, es fundamental conocer qué hay en tu agua
                y qué quieres conseguir. Eso es exactamente lo que hacemos juntos.
              </p>
              <p className="text-sm font-semibold text-[#3A5A3A] mb-8">
                — Cristina Battistelli, consultora de bienestar y calidad del agua
              </p>
              <button
                onClick={() => setReservaModal({ id: 0, name: "" })}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#3A5A3A] text-white rounded-xl font-medium hover:bg-[#2E4A2E] transition-colors"
              >
                <Phone size={16} />
                Recibe orientación profesional gratuita
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── MODAL DE RESERVA ─────────────────────────────────────────────────── */}
      {reservaModal && (
        <ReservaModal
          productId={reservaModal.id || undefined}
          productName={reservaModal.name || undefined}
          onClose={() => setReservaModal(null)}
        />
      )}
    </Layout>
  );
}
