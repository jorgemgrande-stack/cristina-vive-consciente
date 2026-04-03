/**
 * Página de éxito tras compra de ebook — Cristina Vive Consciente
 * Se muestra tras completar el pago en Stripe.
 * Verifica el estado de la compra y muestra el enlace de descarga.
 */

import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle, Download, Mail, Clock, ArrowLeft, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import Layout from "@/components/Layout";
import { Link } from "wouter";

export default function EbookGracias() {
  const [location] = useLocation();
  const sessionId = new URLSearchParams(window.location.search).get("session_id") ?? "";

  const { data, isLoading, error } = trpc.ebooks.verifyPurchase.useQuery(
    { sessionId },
    { enabled: !!sessionId, retry: 3, retryDelay: 2000 }
  );

  if (!sessionId) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center" style={{ background: "#FAFAF7" }}>
          <div className="text-center max-w-md px-6">
            <p className="font-body text-sm mb-6" style={{ color: "oklch(0.52_0.02_60)", fontWeight: 300 }}>
              Enlace no válido. Si acabas de realizar una compra, revisa tu email.
            </p>
            <Link
              href="/guias-digitales"
              className="inline-flex items-center gap-2 font-body text-xs tracking-widest uppercase"
              style={{ color: "oklch(0.38_0.07_148)", letterSpacing: "0.12em" }}
            >
              <ArrowLeft size={12} />
              Volver a guías
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-[70vh] flex items-center justify-center py-20 px-6" style={{ background: "#FAFAF7" }}>
        <div className="max-w-lg w-full">

          {isLoading && (
            <div className="text-center">
              <Loader2 size={32} className="animate-spin mx-auto mb-4" style={{ color: "oklch(0.52_0.08_148)" }} />
              <p className="font-body text-sm" style={{ color: "oklch(0.52_0.02_60)", fontWeight: 300 }}>
                Verificando tu compra...
              </p>
            </div>
          )}

          {!isLoading && data?.status === "completed" && (
            <div className="text-center">
              {/* Icono éxito */}
              <div
                className="w-16 h-16 flex items-center justify-center mx-auto mb-6"
                style={{ background: "oklch(0.96_0.02_148)", color: "oklch(0.38_0.07_148)" }}
              >
                <CheckCircle size={32} />
              </div>

              <p
                className="font-body text-xs tracking-widest uppercase mb-3"
                style={{ color: "oklch(0.52_0.08_148)", letterSpacing: "0.15em" }}
              >
                Compra completada
              </p>
              <h1
                className="font-display text-[oklch(0.18_0.018_55)] mb-4"
                style={{ fontWeight: 400, fontSize: "clamp(1.5rem, 3vw, 2rem)" }}
              >
                ¡Gracias por tu compra!
              </h1>
              <p
                className="font-body text-sm leading-relaxed mb-8"
                style={{ color: "oklch(0.42_0.02_60)", fontWeight: 300 }}
              >
                Tu ebook <strong style={{ fontWeight: 500 }}>{data.ebookTitle}</strong> está listo.
                Hemos enviado el enlace de descarga a <strong style={{ fontWeight: 500 }}>{data.customerEmail}</strong>.
              </p>

              {/* Aviso email */}
              <div
                className="flex items-start gap-3 p-4 mb-6 text-left"
                style={{ background: "oklch(0.96_0.018_75)", border: "1px solid oklch(0.88_0.015_75)" }}
              >
                <Mail size={14} className="flex-shrink-0 mt-0.5" style={{ color: "oklch(0.52_0.06_75)" }} />
                <div>
                  <p className="font-body text-sm font-medium mb-1" style={{ color: "oklch(0.28_0.02_55)" }}>
                    Revisa tu bandeja de entrada
                  </p>
                  <p className="font-body text-xs leading-relaxed" style={{ color: "oklch(0.52_0.02_60)", fontWeight: 300 }}>
                    El email viene de <strong>info@cristinaviveconsciente.es</strong>. Si no lo ves en unos minutos, revisa la carpeta de spam.
                  </p>
                </div>
              </div>

              {/* Enlace de descarga directo */}
              {data.downloadToken && (
                <a
                  href={`/ebooks/descarga?token=${data.downloadToken}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-4 font-body text-xs tracking-widest uppercase text-white mb-4 w-full justify-center"
                  style={{ background: "oklch(0.38_0.07_148)", letterSpacing: "0.12em" }}
                >
                  <Download size={14} />
                  Descargar ahora
                </a>
              )}

              <div className="flex items-center justify-center gap-2 mb-8">
                <Clock size={12} style={{ color: "oklch(0.72_0.02_60)" }} />
                <span className="font-body text-xs" style={{ color: "oklch(0.62_0.02_60)", fontWeight: 300 }}>
                  El enlace de descarga es válido durante 72 horas
                </span>
              </div>

              <Link
                href="/"
                className="inline-flex items-center gap-2 font-body text-xs tracking-widest uppercase"
                style={{ color: "oklch(0.52_0.02_60)", letterSpacing: "0.12em" }}
              >
                <ArrowLeft size={12} />
                Volver al inicio
              </Link>
            </div>
          )}

          {!isLoading && data?.status === "pending" && (
            <div className="text-center">
              <Loader2 size={32} className="animate-spin mx-auto mb-4" style={{ color: "oklch(0.52_0.08_148)" }} />
              <h2
                className="font-display text-[oklch(0.18_0.018_55)] mb-3"
                style={{ fontWeight: 400, fontSize: "1.5rem" }}
              >
                Procesando tu pago...
              </h2>
              <p className="font-body text-sm" style={{ color: "oklch(0.52_0.02_60)", fontWeight: 300 }}>
                Esto puede tardar unos segundos. Recibirás el email en breve.
              </p>
            </div>
          )}

          {!isLoading && (!data?.found || error) && (
            <div className="text-center">
              <p className="font-body text-sm mb-6" style={{ color: "oklch(0.52_0.02_60)", fontWeight: 300 }}>
                No hemos podido verificar tu compra. Si el pago se realizó correctamente, recibirás el email de entrega en unos minutos.
              </p>
              <p className="font-body text-xs mb-6" style={{ color: "oklch(0.62_0.02_60)", fontWeight: 300 }}>
                Si necesitas ayuda, escríbenos a <strong>info@cristinaviveconsciente.es</strong>
              </p>
              <Link
                href="/guias-digitales"
                className="inline-flex items-center gap-2 font-body text-xs tracking-widest uppercase"
                style={{ color: "oklch(0.38_0.07_148)", letterSpacing: "0.12em" }}
              >
                <ArrowLeft size={12} />
                Volver a guías
              </Link>
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}
