/**
 * Secciones de la ficha de consultas para el editor. Provider carga los datos de la ficha (misma fuente que la página de
 * siempre: services.getBySlug); Section pinta una sección por su clave (ver shared/ficha/consultas.ts).
 * `bare` (solo lo usa la página original) pinta la sección sin su contenedor propio, para componerla en la cuadrícula.
 */
import { createContext, useContext, useState, type ReactNode } from "react";
import { Link } from "wouter";
import {
  ArrowLeft, ArrowRight, Clock, Monitor, MapPin, Euro,
  CheckCircle, AlertCircle, Leaf, Loader2, ChevronDown, ChevronUp,
} from "lucide-react";
import { SITE_IMAGES } from "@/lib/siteImages";
import BookingModal from "@/components/BookingModal";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../../../server/routers";
import { trpc } from "@/lib/trpc";

const MODALITY_LABEL: Record<string, string> = { online: "Online", presencial: "Presencial", ambos: "Presencial / Online" };
const MODALITY_ICON: Record<string, ReactNode> = {
  online: <Monitor size={11} />,
  presencial: <MapPin size={11} />,
  ambos: <Monitor size={11} />,
};
const FALLBACK_IMG = SITE_IMAGES.heroConsultas;

function parseJsonArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return [];
  } catch {
    return [];
  }
}

type Consulta = NonNullable<inferRouterOutputs<AppRouter>["services"]["getBySlug"]>;
interface Ctx {
  consulta: Consulta;
  openBooking: () => void;
  faqOpen: number | null;
  setFaqOpen: (i: number | null) => void;
}
const ConsultaCtx = createContext<Ctx | null>(null);

export function ConsultasProvider({ children, slug }: { children: ReactNode; slug: string }) {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const { data: consulta, isLoading, error } = trpc.services.getBySlug.useQuery({ slug }, { enabled: !!slug });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[oklch(0.52_0.08_148)]" />
      </div>
    );
  }
  if (error || !consulta) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Leaf size={32} className="text-[oklch(0.52_0.08_148)]/40" />
        <p className="text-[oklch(0.55_0.04_75)] font-body text-sm">Consulta no encontrada.</p>
        <Link href="/consultas" className="text-[oklch(0.52_0.08_148)] font-body text-sm underline">
          Volver a consultas
        </Link>
      </div>
    );
  }
  return (
    <ConsultaCtx.Provider value={{ consulta, openBooking: () => setBookingOpen(true), faqOpen, setFaqOpen }}>
      <BookingModal isOpen={bookingOpen} onClose={() => setBookingOpen(false)} preselectedService={consulta.slug} />
      {children}
    </ConsultaCtx.Provider>
  );
}

function Wrap({ bare, children }: { bare?: boolean; children: ReactNode }) {
  if (bare) return <>{children}</>;
  return (
    <div className="bg-white py-4">
      <div className="container">{children}</div>
    </div>
  );
}

export function ConsultasSection({ name, bare }: { name: string; bare?: boolean }) {
  const ctx = useContext(ConsultaCtx);
  if (!ctx) return null;
  const { consulta, openBooking, faqOpen, setFaqOpen } = ctx;
  const c = consulta as any;

  switch (name) {
    case "cabecera":
      return (
        <section className="relative h-64 sm:h-80 overflow-hidden">
          <img src={consulta.imageUrl || FALLBACK_IMG} alt={consulta.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.12_0.018_55)]/80 via-[oklch(0.12_0.018_55)]/30 to-transparent" />
          <div className="absolute top-6 left-0 right-0 container">
            <Link
              href="/consultas"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white text-xs font-body no-underline bg-black/20 px-3 py-1.5 backdrop-blur-sm transition-colors"
              style={{ borderRadius: 0 }}
            >
              <ArrowLeft size={12} />
              Consultas
            </Link>
          </div>
          <div className="absolute bottom-0 left-0 right-0 container pb-7">
            {consulta.featured === 1 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[oklch(0.52_0.08_148)] text-white text-[10px] font-body tracking-wider uppercase mb-2 block w-fit" style={{ fontWeight: 500 }}>
                Más completa
              </span>
            )}
            <h1 className="font-display text-white mb-2" style={{ fontWeight: 300, fontSize: "clamp(1.5rem, 3.5vw, 2.2rem)", lineHeight: 1.15 }}>
              {consulta.name}
            </h1>
            <div className="flex flex-wrap gap-3">
              {consulta.durationLabel && (
                <span className="inline-flex items-center gap-1 text-white/80 text-xs font-body">
                  <Clock size={11} className="text-[oklch(0.72_0.08_148)]" />
                  {consulta.durationLabel}
                </span>
              )}
              {consulta.modality && (
                <span className="inline-flex items-center gap-1 text-white/80 text-xs font-body">
                  <span className="text-[oklch(0.72_0.08_148)]">{MODALITY_ICON[consulta.modality]}</span>
                  {MODALITY_LABEL[consulta.modality] ?? consulta.modality}
                </span>
              )}
              {consulta.price && (
                <span className="inline-flex items-center gap-1 text-[oklch(0.72_0.08_148)] text-sm font-body" style={{ fontWeight: 600 }}>
                  <Euro size={12} />
                  {consulta.price} €
                </span>
              )}
            </div>
          </div>
        </section>
      );

    case "descripcion": {
      const longDesc = c.longDescription as string | null | undefined;
      if (!longDesc && !consulta.shortDescription) return null;
      return (
        <Wrap bare={bare}>
          <div>
            <p className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-3 font-body" style={{ fontWeight: 500 }}>
              Sobre esta consulta
            </p>
            {longDesc ? (
              <div
                className="text-[oklch(0.38_0.02_55)] font-body leading-relaxed space-y-4"
                style={{ fontWeight: 300, fontSize: "0.95rem" }}
                dangerouslySetInnerHTML={{
                  __html: longDesc.replace(/\n\n/g, "</p><p style='margin-top:1rem'>").replace(/\n/g, "<br/>"),
                }}
              />
            ) : (
              <p className="text-[oklch(0.38_0.02_55)] font-body leading-relaxed" style={{ fontWeight: 300, fontSize: "0.95rem" }}>
                {consulta.shortDescription}
              </p>
            )}
          </div>
        </Wrap>
      );
    }

    case "imagen-detalle": {
      const detailImage = c.detailImage as string | null | undefined;
      if (!detailImage) return null;
      return (
        <Wrap bare={bare}>
          <div className="overflow-hidden">
            <img src={detailImage} alt={`Detalle de ${consulta.name}`} className="w-full object-cover" style={{ maxHeight: "320px" }} />
          </div>
        </Wrap>
      );
    }

    case "beneficios": {
      const benefits = parseJsonArray(c.benefits);
      if (benefits.length === 0) return null;
      return (
        <Wrap bare={bare}>
          <div>
            <p className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-4 font-body" style={{ fontWeight: 500 }}>
              Ideal para
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {benefits.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-[oklch(0.97_0.006_80)] border border-[oklch(0.92_0.01_75)]">
                  <CheckCircle size={14} className="text-[oklch(0.52_0.08_148)] mt-0.5 flex-shrink-0" />
                  <span className="text-[oklch(0.38_0.02_55)] text-sm font-body" style={{ fontWeight: 300 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </Wrap>
      );
    }

    case "notas": {
      const contraindications = c.contraindications as string | null | undefined;
      if (!contraindications) return null;
      return (
        <Wrap bare={bare}>
          <div>
            <p className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-3 font-body" style={{ fontWeight: 500 }}>
              Notas importantes
            </p>
            <div className="flex items-start gap-3 p-4 bg-[oklch(0.97_0.006_80)] border border-[oklch(0.92_0.01_75)]">
              <AlertCircle size={15} className="text-[oklch(0.55_0.06_60)] mt-0.5 flex-shrink-0" />
              <p className="text-[oklch(0.38_0.02_55)] text-sm font-body leading-relaxed" style={{ fontWeight: 300 }}>
                {contraindications}
              </p>
            </div>
          </div>
        </Wrap>
      );
    }

    case "faq": {
      const faqs = [
        {
          q: "¿Cómo se desarrolla la consulta?",
          a: consulta.durationLabel
            ? `La duración es ${consulta.durationLabel}. Comenzamos con una revisión de tu caso y terminamos con recomendaciones concretas y un plan de acción.`
            : "Comenzamos con una revisión de tu caso y terminamos con recomendaciones concretas y un plan de acción personalizado.",
        },
        {
          q: "¿Es online o presencial?",
          a:
            consulta.modality === "presencial"
              ? "Las sesiones son presenciales en Navas de Río Frío (Segovia)."
              : consulta.modality === "online"
              ? "La consulta se realiza de forma online por teléfono, WhatsApp o Zoom."
              : "La consulta puede realizarse de forma presencial en Navas de Río Frío (Segovia) o en formato online por teléfono, WhatsApp o Zoom.",
        },
        {
          q: "¿Qué necesito preparar antes?",
          a: "Si es tu primera consulta, es útil traer un registro de tu dieta y hábitos habituales, así como cualquier analítica reciente o historial relevante. Si tienes dudas concretas, envíalas con antelación para aprovechar mejor el tiempo.",
        },
        {
          q: "¿Cuándo recibiré las recomendaciones?",
          a: "Las recomendaciones se entregan durante o inmediatamente después de la consulta, según el tipo de sesión. En las consultas de acompañamiento, el seguimiento se extiende durante el período acordado.",
        },
      ];
      return (
        <Wrap bare={bare}>
          <div>
            <p className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-4 font-body" style={{ fontWeight: 500 }}>
              Preguntas frecuentes
            </p>
            <div className="space-y-2">
              {faqs.map((faq, i) => (
                <div key={i} className="border border-[oklch(0.88_0.015_75)]">
                  <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} className="w-full flex items-center justify-between px-4 py-3 text-left">
                    <span className="font-body text-[oklch(0.22_0.02_55)] text-sm" style={{ fontWeight: 400 }}>{faq.q}</span>
                    {faqOpen === i
                      ? <ChevronUp size={14} className="text-[oklch(0.52_0.08_148)] flex-shrink-0" />
                      : <ChevronDown size={14} className="text-[oklch(0.55_0.04_75)] flex-shrink-0" />}
                  </button>
                  {faqOpen === i && (
                    <div className="px-4 pb-4 border-t border-[oklch(0.92_0.01_75)]">
                      <p className="text-[oklch(0.42_0.02_55)] text-sm font-body leading-relaxed pt-3" style={{ fontWeight: 300 }}>{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Wrap>
      );
    }

    case "reserva": {
      const includes = parseJsonArray(c.includes);
      return (
        <Wrap bare={bare}>
          <div className="border border-[oklch(0.88_0.015_75)] p-6 bg-white">
            <p className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-4 font-body" style={{ fontWeight: 500 }}>
              Reservar consulta
            </p>
            {consulta.price ? (
              <div className="flex items-baseline gap-1 mb-4">
                <span className="font-display text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 400, fontSize: "2rem" }}>
                  {parseFloat(consulta.price).toFixed(0)}
                </span>
                <span className="text-[oklch(0.55_0.04_75)] font-body text-sm">€</span>
              </div>
            ) : (
              <p className="text-[oklch(0.52_0.02_60)] text-sm font-body italic mb-4" style={{ fontWeight: 300 }}>
                Precio a consultar
              </p>
            )}
            {includes.length > 0 && (
              <div className="mb-5 space-y-2">
                {includes.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle size={12} className="text-[oklch(0.52_0.08_148)] mt-0.5 flex-shrink-0" />
                    <span className="text-[oklch(0.42_0.02_55)] text-xs font-body" style={{ fontWeight: 300 }}>{item}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-col gap-1.5 mb-5 text-xs font-body text-[oklch(0.52_0.02_60)]" style={{ fontWeight: 300 }}>
              {consulta.durationLabel && (
                <span className="flex items-center gap-1.5">
                  <Clock size={11} className="text-[oklch(0.52_0.08_148)]" />
                  {consulta.durationLabel}
                </span>
              )}
              {consulta.modality && (
                <span className="flex items-center gap-1.5">
                  <span className="text-[oklch(0.52_0.08_148)]">{MODALITY_ICON[consulta.modality]}</span>
                  {MODALITY_LABEL[consulta.modality] ?? consulta.modality}
                </span>
              )}
            </div>
            <button
              onClick={openBooking}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-medium hover:bg-[oklch(0.38_0.07_148)] transition-all duration-300 font-body"
              style={{ borderRadius: 0, letterSpacing: "0.1em" }}
            >
              Reservar ahora
              <ArrowRight size={13} />
            </button>
          </div>
        </Wrap>
      );
    }

    case "volver":
      return (
        <Wrap bare={bare}>
          <Link
            href="/consultas"
            className="inline-flex items-center gap-2 text-[oklch(0.52_0.08_148)] text-xs font-body no-underline hover:gap-3 transition-all"
          >
            <ArrowLeft size={12} />
            Ver todas las consultas
          </Link>
        </Wrap>
      );

    default:
      return null;
  }
}
