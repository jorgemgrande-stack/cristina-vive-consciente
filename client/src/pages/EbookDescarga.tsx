/**
 * Página de descarga segura de ebook — Cristina Vive Consciente
 * Valida el token y redirige al PDF en S3.
 */

import { useEffect } from "react";
import { Download, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";
import Layout from "@/components/Layout";
import { Link } from "wouter";

export default function EbookDescarga() {
  const token = new URLSearchParams(window.location.search).get("token") ?? "";

  const { data, isLoading, error } = trpc.ebooks.download.useQuery(
    { token },
    { enabled: !!token, retry: 1 }
  );

  // Redirigir automáticamente al PDF cuando esté listo
  useEffect(() => {
    if (data?.pdfUrl) {
      window.location.href = data.pdfUrl;
    }
  }, [data?.pdfUrl]);

  return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center py-20 px-6" style={{ background: "#FAFAF7" }}>
        <div className="max-w-md w-full text-center">

          {isLoading && (
            <>
              <Loader2 size={32} className="animate-spin mx-auto mb-4" style={{ color: "oklch(0.52_0.08_148)" }} />
              <p className="font-body text-sm" style={{ color: "oklch(0.52_0.02_60)", fontWeight: 300 }}>
                Verificando tu enlace de descarga...
              </p>
            </>
          )}

          {data?.pdfUrl && (
            <>
              <div
                className="w-16 h-16 flex items-center justify-center mx-auto mb-6"
                style={{ background: "oklch(0.96_0.02_148)", color: "oklch(0.38_0.07_148)" }}
              >
                <Download size={32} />
              </div>
              <h1
                className="font-display text-[oklch(0.18_0.018_55)] mb-3"
                style={{ fontWeight: 400, fontSize: "1.5rem" }}
              >
                Descargando tu ebook...
              </h1>
              <p className="font-body text-sm mb-6" style={{ color: "oklch(0.52_0.02_60)", fontWeight: 300 }}>
                Si la descarga no comienza automáticamente, haz clic en el botón:
              </p>
              <a
                href={data.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 font-body text-xs tracking-widest uppercase text-white"
                style={{ background: "oklch(0.38_0.07_148)", letterSpacing: "0.12em" }}
              >
                <Download size={14} />
                Descargar PDF
              </a>
            </>
          )}

          {(error || (!isLoading && !data?.pdfUrl)) && (
            <>
              <div
                className="w-16 h-16 flex items-center justify-center mx-auto mb-6"
                style={{ background: "oklch(0.96_0.018_75)", color: "oklch(0.52_0.06_75)" }}
              >
                <AlertCircle size={32} />
              </div>
              <h1
                className="font-display text-[oklch(0.18_0.018_55)] mb-3"
                style={{ fontWeight: 400, fontSize: "1.5rem" }}
              >
                Enlace no válido
              </h1>
              <p className="font-body text-sm mb-6 leading-relaxed" style={{ color: "oklch(0.52_0.02_60)", fontWeight: 300 }}>
                {error?.message ?? "Este enlace de descarga no es válido o ha expirado."}
              </p>
              <p className="font-body text-xs mb-8" style={{ color: "oklch(0.62_0.02_60)", fontWeight: 300 }}>
                Si crees que es un error, escríbenos a{" "}
                <a
                  href="mailto:info@cristinaviveconsciente.es"
                  className="underline"
                  style={{ color: "oklch(0.38_0.07_148)" }}
                >
                  info@cristinaviveconsciente.es
                </a>
              </p>
              <Link
                href="/guias-digitales"
                className="inline-flex items-center gap-2 font-body text-xs tracking-widest uppercase"
                style={{ color: "oklch(0.38_0.07_148)", letterSpacing: "0.12em" }}
              >
                <ArrowLeft size={12} />
                Volver a guías
              </Link>
            </>
          )}

        </div>
      </div>
    </Layout>
  );
}
