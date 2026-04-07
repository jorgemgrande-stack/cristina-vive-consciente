/**
 * MasajeDetalle — Cristina Vive Consciente
 * Página de detalle de un masaje terapéutico
 * Design: "Luz Botánica"
 */

import { useState } from "react";
import { useRoute, Link } from "wouter";
import {
  ArrowLeft, ArrowRight, Clock, MapPin, Euro, Star,
  CheckCircle, AlertCircle, Leaf, Loader2, ChevronDown, ChevronUp
} from "lucide-react";
import Layout from "@/components/Layout";
import BookingModal from "@/components/BookingModal";
import { trpc } from "@/lib/trpc";

const MODALITY_LABEL: Record<string, string> = {
  online: "Online",
  presencial: "Presencial",
  ambos: "Presencial / Online",
};

const FALLBACK_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/hero-masajes-PUiFsGVb8gAs6i4s8VF7U8.webp";

// Beneficios por defecto
const DEFAULT_BENEFITS = [
  "Reduce el estrés y la tensión acumulada",
  "Mejora la circulación y el drenaje linfático",
  "Equilibra el sistema nervioso",
  "Potencia el sistema inmunológico",
  "Alivia dolores musculares y articulares",
  "Promueve un sueño reparador",
];

// Qué incluye por defecto
const DEFAULT_INCLUDES = [
  "Evaluación inicial de necesidades",
  "Sesión de equilibrio energético",
  "Masaje Aromatouch con 8 aceites esenciales",
  "Recomendaciones personalizadas post-sesión",
];

function parseBenefits(raw: string | null | undefined): string[] {
  if (!raw) return DEFAULT_BENEFITS;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return DEFAULT_BENEFITS;
  } catch { return DEFAULT_BENEFITS; }
}

function parseIncludes(raw: string | null | undefined): string[] {
  if (!raw) return DEFAULT_INCLUDES;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return DEFAULT_INCLUDES;
  } catch { return DEFAULT_INCLUDES; }
}

export default function MasajeDetalle() {
  const [, params] = useRoute("/masajes/:slug");
  const slug = params?.slug ?? "";
  const [bookingOpen, setBookingOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const { data: masaje, isLoading, error } = trpc.services.getBySlug.useQuery(
    { slug },
    { enabled: !!slug }
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-[oklch(0.52_0.08_148)]" />
        </div>
      </Layout>
    );
  }

  if (error || !masaje) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <Leaf size={32} className="text-[oklch(0.52_0.08_148)]/40" />
          <p className="text-[oklch(0.55_0.04_75)] font-body text-sm">Masaje no encontrado.</p>
          <Link href="/masajes" className="text-[oklch(0.52_0.08_148)] font-body text-sm underline">
            Volver a masajes
          </Link>
        </div>
      </Layout>
    );
  }

  const benefits = parseBenefits((masaje as any).benefits);
  const includes = parseIncludes((masaje as any).includes);
  const longDesc = (masaje as any).longDescription;
  const contraindications = (masaje as any).contraindications;
  const detailImage = (masaje as any).detailImage;

  // FAQs por defecto para masajes
  const faqs = [
    {
      q: "¿Cuánto dura una sesión?",
      a: masaje.durationLabel
        ? `La sesión tiene una duración de ${masaje.durationLabel}.`
        : "La sesión dura aproximadamente 60 minutos, incluyendo la evaluación inicial y las recomendaciones finales.",
    },
    {
      q: "¿Dónde se realiza el masaje?",
      a: masaje.modality === "presencial"
        ? "Las sesiones son presenciales en Navas de Río Frío (Segovia). También puedo desplazarme a domicilio, consulta tarifas."
        : masaje.modality === "online"
        ? "Las sesiones se realizan de forma online a través de videollamada."
        : "Las sesiones pueden ser presenciales en Navas de Río Frío (Segovia) o a domicilio. Consulta disponibilidad.",
    },
    {
      q: "¿Necesito preparación previa?",
      a: "No se requiere preparación especial. Es recomendable llegar con ropa cómoda y haber comido ligero. Evita el ejercicio intenso las 2 horas previas.",
    },
    {
      q: "¿Con qué frecuencia se recomienda?",
      a: "Para resultados óptimos, se recomienda una sesión mensual de mantenimiento. En casos de estrés elevado o dolor crónico, puede aumentarse la frecuencia según valoración.",
    },
  ];

  return (
    <>
      <BookingModal
        isOpen={bookingOpen}
        onClose={() => setBookingOpen(false)}
        preselectedService={masaje.slug}
      />
      <Layout>

        {/* ── Hero con imagen ── */}
        <section className="relative h-72 sm:h-96 overflow-hidden">
          <img
            src={masaje.imageUrl || FALLBACK_IMG}
            alt={masaje.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.12_0.018_55)]/80 via-[oklch(0.12_0.018_55)]/30 to-transparent" />

          {/* Breadcrumb */}
          <div className="absolute top-6 left-0 right-0 container">
            <Link
              href="/masajes"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white text-xs font-body no-underline bg-black/20 px-3 py-1.5 backdrop-blur-sm transition-colors"
              style={{ borderRadius: 0 }}
            >
              <ArrowLeft size={12} />
              Masajes terapéuticos
            </Link>
          </div>

          {/* Título superpuesto */}
          <div className="absolute bottom-0 left-0 right-0 container pb-8">
            {masaje.featured === 1 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[oklch(0.52_0.08_148)] text-white text-[10px] font-body tracking-wider uppercase mb-3 block w-fit" style={{ fontWeight: 500 }}>
                <Star size={9} fill="currentColor" />
                Más popular
              </span>
            )}
            <h1 className="font-display text-white mb-2" style={{ fontWeight: 300, fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)", lineHeight: 1.15 }}>
              {masaje.name}
            </h1>
            <div className="flex flex-wrap gap-2">
              {masaje.durationLabel && (
                <span className="inline-flex items-center gap-1 text-white/80 text-xs font-body">
                  <Clock size={11} className="text-[oklch(0.72_0.08_148)]" />
                  {masaje.durationLabel}
                </span>
              )}
              {masaje.modality && (
                <span className="inline-flex items-center gap-1 text-white/80 text-xs font-body">
                  <MapPin size={11} className="text-[oklch(0.72_0.08_148)]" />
                  {MODALITY_LABEL[masaje.modality] ?? masaje.modality}
                </span>
              )}
              {masaje.price && (
                <span className="inline-flex items-center gap-1 text-[oklch(0.72_0.08_148)] text-sm font-body" style={{ fontWeight: 600 }}>
                  <Euro size={12} />
                  {masaje.price} €
                </span>
              )}
            </div>
          </div>
        </section>

        {/* ── Contenido principal ── */}
        <section className="py-12 bg-white">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

              {/* Columna principal */}
              <div className="lg:col-span-2 space-y-10">

                {/* Descripción */}
                <div>
                  <p className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-3 font-body" style={{ fontWeight: 500 }}>
                    Sobre esta sesión
                  </p>
                  {longDesc ? (
                    <div
                      className="text-[oklch(0.38_0.02_55)] font-body leading-relaxed space-y-4"
                      style={{ fontWeight: 300, fontSize: "0.95rem" }}
                      dangerouslySetInnerHTML={{ __html: longDesc.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>") }}
                    />
                  ) : (
                    <div className="text-[oklch(0.38_0.02_55)] font-body leading-relaxed space-y-4" style={{ fontWeight: 300, fontSize: "0.95rem" }}>
                      <p>
                        {masaje.shortDescription || `${masaje.name} es una sesión terapéutica diseñada para restaurar el equilibrio natural de tu cuerpo y mente. Mediante técnicas especializadas y el poder de los aceites esenciales de grado terapéutico, trabajamos en profundidad para liberar tensiones acumuladas y activar los mecanismos naturales de sanación del organismo.`}
                      </p>
                      <p>
                        Cada sesión comienza con una evaluación personalizada de tus necesidades, permitiéndome adaptar la técnica y los aceites específicos a tu estado actual. El resultado es una experiencia única y transformadora que va mucho más allá del masaje convencional.
                      </p>
                      <p>
                        La combinación de equilibrio energético y masaje Aromatouch actúa de forma sinérgica sobre el sistema nervioso, el sistema inmunológico y el estado emocional, generando un bienestar profundo y duradero.
                      </p>
                    </div>
                  )}
                </div>

                {/* Imagen de detalle (si existe) */}
                {detailImage && (
                  <div className="overflow-hidden">
                    <img
                      src={detailImage}
                      alt={`Detalle de ${masaje.name}`}
                      className="w-full object-cover"
                      style={{ maxHeight: "320px" }}
                    />
                  </div>
                )}

                {/* Beneficios */}
                <div>
                  <p className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-4 font-body" style={{ fontWeight: 500 }}>
                    Beneficios
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {benefits.map((benefit, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-[oklch(0.97_0.006_80)] border border-[oklch(0.92_0.01_75)]">
                        <CheckCircle size={15} className="text-[oklch(0.52_0.08_148)] mt-0.5 flex-shrink-0" />
                        <span className="text-[oklch(0.38_0.02_55)] text-sm font-body" style={{ fontWeight: 300 }}>
                          {benefit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contraindicaciones */}
                {contraindications && (
                  <div>
                    <p className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-3 font-body" style={{ fontWeight: 500 }}>
                      Consideraciones importantes
                    </p>
                    <div className="flex items-start gap-3 p-4 bg-[oklch(0.97_0.006_80)] border border-[oklch(0.92_0.01_75)]">
                      <AlertCircle size={15} className="text-[oklch(0.55_0.06_60)] mt-0.5 flex-shrink-0" />
                      <p className="text-[oklch(0.38_0.02_55)] text-sm font-body leading-relaxed" style={{ fontWeight: 300 }}>
                        {contraindications}
                      </p>
                    </div>
                  </div>
                )}

                {/* FAQ */}
                <div>
                  <p className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-4 font-body" style={{ fontWeight: 500 }}>
                    Preguntas frecuentes
                  </p>
                  <div className="space-y-2">
                    {faqs.map((faq, i) => (
                      <div key={i} className="border border-[oklch(0.88_0.015_75)]">
                        <button
                          onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                          className="w-full flex items-center justify-between px-4 py-3 text-left"
                        >
                          <span className="font-body text-[oklch(0.22_0.02_55)] text-sm" style={{ fontWeight: 400 }}>
                            {faq.q}
                          </span>
                          {faqOpen === i
                            ? <ChevronUp size={14} className="text-[oklch(0.52_0.08_148)] flex-shrink-0" />
                            : <ChevronDown size={14} className="text-[oklch(0.55_0.04_75)] flex-shrink-0" />
                          }
                        </button>
                        {faqOpen === i && (
                          <div className="px-4 pb-4 border-t border-[oklch(0.92_0.01_75)]">
                            <p className="text-[oklch(0.42_0.02_55)] text-sm font-body leading-relaxed pt-3" style={{ fontWeight: 300 }}>
                              {faq.a}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar de reserva */}
              <div className="lg:col-span-1">
                <div className="sticky top-24 space-y-4">

                  {/* Card de precio y reserva */}
                  <div className="border border-[oklch(0.88_0.015_75)] p-6 bg-white">
                    <p className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-4 font-body" style={{ fontWeight: 500 }}>
                      Reservar sesión
                    </p>

                    {masaje.price && (
                      <div className="flex items-baseline gap-1 mb-4">
                        <span className="font-display text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 400, fontSize: "2rem" }}>
                          {masaje.price}
                        </span>
                        <span className="text-[oklch(0.55_0.04_75)] font-body text-sm">€ / sesión</span>
                      </div>
                    )}

                    {/* Qué incluye */}
                    <div className="mb-5 space-y-2">
                      {includes.map((item, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <CheckCircle size={12} className="text-[oklch(0.52_0.08_148)] mt-0.5 flex-shrink-0" />
                          <span className="text-[oklch(0.42_0.02_55)] text-xs font-body" style={{ fontWeight: 300 }}>
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => setBookingOpen(true)}
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-medium hover:bg-[oklch(0.38_0.07_148)] transition-all duration-300 font-body"
                      style={{ borderRadius: 0, letterSpacing: "0.1em" }}
                    >
                      Reservar ahora
                      <ArrowRight size={13} />
                    </button>
                  </div>

                  {/* Info de localización */}
                  <div className="border border-[oklch(0.88_0.015_75)] p-4 bg-[oklch(0.97_0.006_80)]">
                    <div className="flex items-start gap-3">
                      <MapPin size={15} className="text-[oklch(0.52_0.08_148)] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[oklch(0.22_0.02_55)] text-xs font-body mb-1" style={{ fontWeight: 500 }}>
                          Ubicación
                        </p>
                        <p className="text-[oklch(0.42_0.02_55)] text-xs font-body leading-relaxed" style={{ fontWeight: 300 }}>
                          Navas de Río Frío, Segovia<br />
                          También disponible a domicilio
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Volver */}
                  <Link
                    href="/masajes"
                    className="inline-flex items-center gap-2 text-[oklch(0.52_0.08_148)] text-xs font-body no-underline hover:gap-3 transition-all"
                  >
                    <ArrowLeft size={12} />
                    Ver todos los masajes
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

      </Layout>
    </>
  );
}
