/**
 * PageHero — Componente reutilizable para páginas interiores
 * Design: "Luz Botánica" — hero con imagen de fondo, overlay y breadcrumb
 */

import { Link } from "wouter";
import { ChevronRight } from "lucide-react";

interface PageHeroProps {
  title: string;
  subtitle?: string;
  tag?: string;
  image: string;
  breadcrumb?: { label: string; href?: string }[];
}

export default function PageHero({ title, subtitle, tag, image, breadcrumb }: PageHeroProps) {
  return (
    <section className="relative min-h-[55vh] flex items-end overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover object-center"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, oklch(0.18 0.018 55 / 0.85) 0%, oklch(0.18 0.018 55 / 0.5) 50%, oklch(0.18 0.018 55 / 0.2) 100%)",
          }}
        />
      </div>

      {/* Content */}
      <div className="container relative z-10 pb-14 pt-32">
        {/* Breadcrumb */}
        {breadcrumb && (
          <nav className="flex items-center gap-1.5 mb-5">
            {breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight size={11} className="text-white/40" />}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="text-white/60 text-xs tracking-widest uppercase hover:text-white transition-colors font-body no-underline"
                    style={{ fontWeight: 400, letterSpacing: "0.1em" }}
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    className="text-white/90 text-xs tracking-widest uppercase font-body"
                    style={{ fontWeight: 400, letterSpacing: "0.1em" }}
                  >
                    {crumb.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
        )}

        {/* Tag */}
        {tag && (
          <p
            className="text-[oklch(0.72_0.06_148)] text-xs tracking-[0.2em] uppercase mb-3 font-body"
            style={{ fontWeight: 500 }}
          >
            {tag}
          </p>
        )}

        {/* Title */}
        <h1
          className="text-white font-display mb-4"
          style={{ fontWeight: 400, maxWidth: "600px" }}
        >
          {title}
        </h1>

        {/* Subtitle */}
        {subtitle && (
          <p
            className="text-white/75 text-base md:text-lg font-body leading-relaxed"
            style={{ fontWeight: 300, maxWidth: "500px" }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
