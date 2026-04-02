/**
 * NotFound (404) — Cristina Vive Consciente
 * Design: "Luz Botánica"
 */

import { Link } from "wouter";
import { ArrowLeft, Leaf } from "lucide-react";
import Layout from "@/components/Layout";

export default function NotFound() {
  return (
    <Layout>
      <section className="min-h-[70vh] flex items-center justify-center bg-[oklch(0.985_0.006_85)]">
        <div className="container text-center py-20">
          {/* Decorative */}
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 flex items-center justify-center border border-[oklch(0.88_0.015_75)] text-[oklch(0.52_0.08_148)]">
              <Leaf size={28} />
            </div>
          </div>

          <p
            className="font-display text-[oklch(0.88_0.04_75)] mb-4"
            style={{ fontSize: "6rem", fontWeight: 400, lineHeight: 1 }}
          >
            404
          </p>

          <h1
            className="font-display text-[oklch(0.18_0.018_55)] mb-4"
            style={{ fontWeight: 400, fontSize: "clamp(1.5rem, 3vw, 2.5rem)" }}
          >
            Página no encontrada
          </h1>

          <div className="section-divider mx-auto" />

          <p className="text-[oklch(0.52_0.02_60)] mt-5 mb-10 font-body max-w-sm mx-auto" style={{ fontWeight: 300 }}>
            Parece que esta página no existe o ha sido movida. Vuelve al inicio para seguir explorando.
          </p>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-medium hover:bg-[oklch(0.38_0.07_148)] transition-all duration-300 font-body no-underline"
            style={{ borderRadius: 0, letterSpacing: "0.1em" }}
          >
            <ArrowLeft size={14} />
            Volver al inicio
          </Link>
        </div>
      </section>
    </Layout>
  );
}
