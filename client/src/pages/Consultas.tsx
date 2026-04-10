/**
 * Consultas — Cristina Vive Consciente
 * Design: "Luz Botánica"
 * 100% dinámico desde BD — cada tarjeta enlaza a /consultas/:slug
 */

import { Link } from "wouter";
import { ArrowRight, Clock, CheckCircle, Monitor, MapPin, Loader2, Leaf } from "lucide-react";
import Layout from "@/components/Layout";
import PageHero from "@/components/PageHero";
import { trpc } from "@/lib/trpc";

const HERO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/hero-consultas-VRAFvns5UX68Kqd64cBawH.webp";

const MODALITY_ICON: Record<string, React.ReactNode> = {
  online: <Monitor size={11} />,
  presencial: <MapPin size={11} />,
  ambos: <Monitor size={11} />,
};
const MODALITY_LABEL: Record<string, string> = {
  online: "Online",
  presencial: "Presencial",
  ambos: "Presencial / Online",
};

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

export default function Consultas() {
  const { data: consultas = [], isLoading } = trpc.services.list.useQuery({ type: "consulta" });

  return (
    <Layout>
      <PageHero
        title="Consultas"
        subtitle="Regularmente visita esta sección para descubrir nuevas consultas y asesorías dentro del marco de la salud consciente."
        tag="Salud consciente"
        image={HERO}
        breadcrumb={[{ label: "Inicio", href: "/" }, { label: "Consultas" }]}
      />

      <section className="section-padding bg-[oklch(0.985_0.006_85)]">
        <div className="container">

          {/* Estado de carga */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={24} className="animate-spin text-[oklch(0.52_0.08_148)]" />
            </div>
          )}

          {/* Sin consultas */}
          {!isLoading && consultas.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Leaf size={32} className="text-[oklch(0.52_0.08_148)]/30" />
              <p className="text-[oklch(0.55_0.04_75)] font-body text-sm">
                Próximamente nuevas consultas disponibles.
              </p>
            </div>
          )}

          {/* Grid de consultas */}
          {!isLoading && consultas.length > 0 && (
            <div className="space-y-6">
              {consultas.map((c) => {
                const benefits = parseJsonArray((c as any).benefits);
                const includes = parseJsonArray((c as any).includes);

                return (
                  <div
                    key={c.id}
                    className={`card-natural overflow-hidden transition-all duration-300 hover:shadow-md ${
                      c.featured === 1
                        ? "border-[oklch(0.52_0.08_148)]/40 bg-[oklch(0.97_0.008_100)]"
                        : "bg-white"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row">

                      {/* Imagen */}
                      {c.imageUrl && (
                        <div className="md:w-56 lg:w-64 flex-shrink-0 overflow-hidden">
                          <img
                            src={c.imageUrl}
                            alt={c.name}
                            className="w-full h-48 md:h-full object-cover"
                          />
                        </div>
                      )}

                      {/* Contenido */}
                      <div className="flex flex-col flex-1 p-6 md:p-8">

                        {/* Header */}
                        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                          <div className="flex flex-wrap items-center gap-2">
                            {c.featured === 1 && (
                              <span className="px-2 py-0.5 bg-[oklch(0.52_0.08_148)] text-white text-[0.55rem] tracking-widest uppercase font-body" style={{ fontWeight: 500 }}>
                                Más completa
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-[oklch(0.52_0.02_60)] text-xs font-body" style={{ fontWeight: 300 }}>
                              <Clock size={11} />
                              {c.durationLabel ?? `${c.durationMinutes} min`}
                            </span>
                            {c.modality && (
                              <span className="flex items-center gap-1 text-[oklch(0.52_0.02_60)] text-xs font-body" style={{ fontWeight: 300 }}>
                                {MODALITY_ICON[c.modality] ?? <Monitor size={11} />}
                                {MODALITY_LABEL[c.modality] ?? c.modality}
                              </span>
                            )}
                          </div>
                          {c.price ? (
                            <span className="font-display text-[oklch(0.52_0.08_148)]" style={{ fontWeight: 400, fontSize: "1.6rem", lineHeight: 1 }}>
                              {parseFloat(c.price).toFixed(0)}€
                            </span>
                          ) : (
                            <span className="text-[oklch(0.52_0.02_60)] text-xs italic font-body" style={{ fontWeight: 300 }}>
                              Precio a consultar
                            </span>
                          )}
                        </div>

                        {/* Título */}
                        <h2 className="font-display text-[oklch(0.18_0.018_55)] mb-2" style={{ fontWeight: 400, fontSize: "clamp(1.1rem, 2.5vw, 1.4rem)" }}>
                          {c.name}
                        </h2>

                        {/* Descripción corta */}
                        {c.shortDescription && (
                          <p className="text-[oklch(0.45_0.02_55)] text-sm leading-relaxed font-body mb-4" style={{ fontWeight: 300 }}>
                            {c.shortDescription}
                          </p>
                        )}

                        {/* Ideal para (primeros 4 items) */}
                        {benefits.length > 0 && (
                          <div className="mb-5">
                            <p className="text-[oklch(0.35_0.02_55)] text-xs uppercase tracking-widest font-body mb-2" style={{ fontWeight: 500 }}>
                              Ideal para
                            </p>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {benefits.slice(0, 4).map((item, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <CheckCircle size={12} className="text-[oklch(0.52_0.08_148)] mt-0.5 flex-shrink-0" />
                                  <span className="text-[oklch(0.42_0.02_55)] text-xs font-body leading-snug" style={{ fontWeight: 300 }}>
                                    {item}
                                  </span>
                                </li>
                              ))}
                              {benefits.length > 4 && (
                                <li className="text-[oklch(0.52_0.08_148)] text-xs font-body italic" style={{ fontWeight: 300 }}>
                                  +{benefits.length - 4} más →
                                </li>
                              )}
                            </ul>
                          </div>
                        )}

                        {/* Incluye (primeros 3 items) */}
                        {includes.length > 0 && (
                          <div className="mb-5 p-3 bg-[oklch(0.97_0.006_80)] border border-[oklch(0.92_0.01_75)]">
                            <p className="text-[oklch(0.35_0.02_55)] text-xs uppercase tracking-widest font-body mb-2" style={{ fontWeight: 500 }}>
                              ¿Qué incluye?
                            </p>
                            <ul className="space-y-1">
                              {includes.slice(0, 3).map((item, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <CheckCircle size={11} className="text-[oklch(0.52_0.08_148)] mt-0.5 flex-shrink-0" />
                                  <span className="text-[oklch(0.42_0.02_55)] text-xs font-body" style={{ fontWeight: 300 }}>
                                    {item}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* CTAs */}
                        <div className="flex flex-wrap items-center gap-3 mt-auto">
                          <Link
                            href={`/consultas/${c.slug}`}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-body hover:bg-[oklch(0.38_0.07_148)] transition-colors duration-300 no-underline"
                            style={{ borderRadius: 0, letterSpacing: "0.1em" }}
                          >
                            Ver detalle
                            <ArrowRight size={12} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
