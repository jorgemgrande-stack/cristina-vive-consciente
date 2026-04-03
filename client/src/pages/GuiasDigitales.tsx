/**
 * Guías Digitales — Cristina Vive Consciente
 * Design: "Luz Botánica"
 * Contenido real exacto — FASE 2
 */

import { useState } from "react";
import { ArrowRight, Download, FileText, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import Layout from "@/components/Layout";
import PageHero from "@/components/PageHero";

const HERO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/hero-consultas-VRAFvns5UX68Kqd64cBawH.webp";

function BuyButton({ ebookId, label, price }: { ebookId: "agua" | "aceites"; label: string; price: string }) {
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
    createCheckout.mutate({ ebookId, origin: window.location.origin });
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

export default function GuiasDigitales() {
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
          <div className="space-y-10">

            {/* GUÍA DEL AGUA */}
            <div className="card-natural p-7 md:p-10 bg-white">
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2.5 py-1 bg-[oklch(0.52_0.08_148)] text-white text-[0.6rem] tracking-widest uppercase font-body" style={{ fontWeight: 500 }}>
                      PDF Digital
                    </span>
                    <span className="flex items-center gap-1 text-[oklch(0.52_0.02_60)] text-xs font-body" style={{ fontWeight: 300 }}>
                      <FileText size={11} />
                      Descarga inmediata
                    </span>
                  </div>
                  <h2 className="font-display text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 400, fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)" }}>
                    Guía Digital del Agua
                  </h2>
                </div>
                <div className="text-right">
                  <p className="font-display text-[oklch(0.52_0.08_148)]" style={{ fontWeight: 400, fontSize: "2.2rem", lineHeight: 1 }}>
                    12€
                  </p>
                </div>
              </div>

              <div className="section-divider mb-6" />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Texto */}
                <div className="lg:col-span-2 space-y-4">
                  <p className="text-[oklch(0.38_0.02_55)] leading-relaxed font-body" style={{ fontWeight: 300 }}>
                    Una guía sobre la importancia del agua que bebemos, los secretos que oculta y las claves para elegir el mejor sistema de filtrado.
                  </p>
                  <p className="text-[oklch(0.38_0.02_55)] leading-relaxed font-body" style={{ fontWeight: 300 }}>
                    Las recomendaciones que hago sobre los productos son a raíz de un examen minucioso que he hecho personalmente tanto de las máquinas que recomiendo como de las personas que están detrás de ellas, no recomendaría absolutamente nada que no use o fuera a usar yo personalmente.
                  </p>
                  <p className="text-[oklch(0.38_0.02_55)] leading-relaxed font-body" style={{ fontWeight: 300 }}>
                    La compra de esta guía incluye una sesión de asesoramiento de 30 minutos aproximadamente. Puedes usarla si te queda alguna duda con respecto a la elección del sistema, o para cualquier duda de salud en general, te daré mi visión desde un plano naturópata.
                  </p>
                  <p className="text-[oklch(0.38_0.02_55)] leading-relaxed font-body" style={{ fontWeight: 300 }}>
                    Para los sistemas ofrecidos en esta guía y página web se ofrece descuento si vais de mi parte, podéis consultarme vía telefónica o correo, para facilitaros el código descuento o la información a seguir.
                  </p>
                  <p className="text-[oklch(0.38_0.02_55)] leading-relaxed font-body" style={{ fontWeight: 300 }}>
                    Para más información o cualquier duda estaré encantada de resolverla sin compromiso.
                  </p>
                </div>

                {/* Incluye */}
                <div className="space-y-4">
                  <div className="p-5 bg-[oklch(0.94_0.012_80)] border border-[oklch(0.88_0.015_75)]">
                    <p className="text-[oklch(0.28_0.025_55)] text-xs tracking-widest uppercase mb-4 font-body" style={{ fontWeight: 500 }}>
                      Esta guía incluye
                    </p>
                    <ul className="space-y-3">
                      {[
                        { icon: <FileText size={13} />, text: "Guía en PDF descargable" },
                        { icon: <MessageCircle size={13} />, text: "Sesión de asesoramiento de 30 min" },
                        { icon: <Download size={13} />, text: "Código descuento en sistemas recomendados" },
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="text-[oklch(0.52_0.08_148)] mt-0.5 flex-shrink-0">{item.icon}</span>
                          <span className="text-[oklch(0.38_0.02_55)] text-sm font-body" style={{ fontWeight: 300 }}>
                            {item.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <BuyButton ebookId="agua" label="Obtener guía" price="12€" />
                </div>
              </div>
            </div>

            {/* GUÍA ACEITES ESENCIALES */}
            <div className="card-natural p-7 md:p-10 bg-white">
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2.5 py-1 bg-[oklch(0.52_0.08_148)] text-white text-[0.6rem] tracking-widest uppercase font-body" style={{ fontWeight: 500 }}>
                      PDF Digital
                    </span>
                    <span className="flex items-center gap-1 text-[oklch(0.52_0.02_60)] text-xs font-body" style={{ fontWeight: 300 }}>
                      <FileText size={11} />
                      Descarga inmediata
                    </span>
                  </div>
                  <h2 className="font-display text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 400, fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)" }}>
                    Guía Digital de Aceites Esenciales
                  </h2>
                </div>
                <div className="text-right">
                  <p className="font-display text-[oklch(0.52_0.08_148)]" style={{ fontWeight: 400, fontSize: "2.2rem", lineHeight: 1 }}>
                    7€
                  </p>
                </div>
              </div>

              <div className="section-divider mb-6" />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Texto */}
                <div className="lg:col-span-2 space-y-4">
                  <p className="text-[oklch(0.38_0.02_55)] leading-relaxed font-body" style={{ fontWeight: 300 }}>
                    Guía corta de aceites esenciales básicos para el hogar, incluye soporte grupal y posibilidad de compra a través de mí.
                  </p>
                  <p className="text-[oklch(0.38_0.02_55)] leading-relaxed font-body" style={{ fontWeight: 300 }}>
                    Más información consultar.
                  </p>
                </div>

                {/* Incluye */}
                <div className="space-y-4">
                  <div className="p-5 bg-[oklch(0.94_0.012_80)] border border-[oklch(0.88_0.015_75)]">
                    <p className="text-[oklch(0.28_0.025_55)] text-xs tracking-widest uppercase mb-4 font-body" style={{ fontWeight: 500 }}>
                      Esta guía incluye
                    </p>
                    <ul className="space-y-3">
                      {[
                        { icon: <FileText size={13} />, text: "Guía en PDF descargable" },
                        { icon: <MessageCircle size={13} />, text: "Soporte grupal incluido" },
                        { icon: <ArrowRight size={13} />, text: "Posibilidad de compra a través de mí" },
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="text-[oklch(0.52_0.08_148)] mt-0.5 flex-shrink-0">{item.icon}</span>
                          <span className="text-[oklch(0.38_0.02_55)] text-sm font-body" style={{ fontWeight: 300 }}>
                            {item.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <BuyButton ebookId="aceites" label="Obtener guía" price="7€" />
                </div>
              </div>
            </div>

          </div>
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
          <button
            onClick={() => toast.info("Próximamente: formulario de contacto")}
            className="inline-flex items-center gap-2 px-8 py-4 bg-[oklch(0.18_0.018_55)] text-white text-xs tracking-widest uppercase font-medium hover:bg-[oklch(0.28_0.02_55)] transition-all duration-300 font-body"
            style={{ borderRadius: 0, letterSpacing: "0.1em" }}
          >
            Contactar
            <ArrowRight size={14} />
          </button>
        </div>
      </section>
    </Layout>
  );
}
