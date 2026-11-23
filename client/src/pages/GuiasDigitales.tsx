/**
 * Guías Digitales — Cristina Vive Consciente
 * Design: "Luz Botánica"
 * Catálogo: una tarjeta compacta por ebook (portada, título, subtítulo, precio y «Ver ebook»).
 * La compra se hace en la ficha de cada ebook (/guias-digitales/:slug). Datos dinámicos desde BD (tabla ebooks).
 */

import { SITE_IMAGES } from "@/lib/siteImages";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import Layout from "@/components/Layout";
import PageHero from "@/components/PageHero";
import { ebookImages, ebookPath, ebookPriceLabel } from "@shared/ebookPage";

const HERO = SITE_IMAGES.heroConsultas;

interface EbookData {
  id: number;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  price: string;
  coverImage: string | null;
  galleryImages: string | null;
  includesSession: number;
}

function EbookCard({ ebook }: { ebook: EbookData }) {
  const href = ebookPath(ebook.slug);
  const cover = ebookImages(ebook)[0];
  return (
    <article className="card-natural bg-white overflow-hidden flex flex-col" data-testid="ebook-card">
      {/* La portada y el título también abren la ficha */}
      <Link href={href} className="block bg-[oklch(0.94_0.012_80)] aspect-[4/3] overflow-hidden" aria-label={`Ver ${ebook.title}`}>
        {cover ? (
          <img src={cover} alt={`Portada de ${ebook.title}`} className="w-full h-full object-contain" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[oklch(0.52_0.02_60)] text-xs font-body">Guía digital</div>
        )}
      </Link>
      <div className="p-6 flex flex-col flex-1">
        <span className="self-start px-2.5 py-1 bg-[oklch(0.52_0.08_148)] text-white text-[0.6rem] tracking-widest uppercase font-body mb-3" style={{ fontWeight: 500 }}>
          PDF Digital
        </span>
        <h2 className="font-display text-[oklch(0.18_0.018_55)] mb-2" style={{ fontWeight: 400, fontSize: "1.35rem", lineHeight: 1.25 }}>
          <Link href={href} className="hover:text-[oklch(0.52_0.08_148)] transition-colors">{ebook.title}</Link>
        </h2>
        {ebook.subtitle && (
          <p className="text-[oklch(0.52_0.02_60)] text-sm mb-4 font-body italic" style={{ fontWeight: 300 }}>{ebook.subtitle}</p>
        )}
        <div className="mt-auto pt-4 flex items-center justify-between gap-4">
          <p className="font-display text-[oklch(0.52_0.08_148)]" style={{ fontWeight: 400, fontSize: "1.75rem", lineHeight: 1 }}>
            {ebookPriceLabel(ebook.price)}
          </p>
          <Link
            href={href}
            className="inline-flex items-center gap-2 px-5 py-3 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-medium hover:bg-[oklch(0.38_0.07_148)] transition-colors font-body"
            style={{ borderRadius: 0, letterSpacing: "0.1em" }}
          >
            Ver ebook <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </article>
  );
}

// ── Página principal ─────────────────────────────────────────────────────────
export default function GuiasDigitales() {
  const { data: ebooks = [], isLoading } = trpc.ebooksAdmin.list.useQuery(); // list = solo activos (publicProcedure)

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
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-[oklch(0.52_0.08_148)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : ebooks.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[oklch(0.52_0.02_60)] font-body" style={{ fontWeight: 300 }}>
                Las guías digitales estarán disponibles próximamente.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {ebooks.map((ebook) => (
                <EbookCard key={ebook.id} ebook={ebook} />
              ))}
            </div>
          )}
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
          <Link href="/contacto">
            <button
              className="inline-flex items-center gap-2 px-8 py-4 bg-[oklch(0.18_0.018_55)] text-white text-xs tracking-widest uppercase font-medium hover:bg-[oklch(0.28_0.02_55)] transition-all duration-300 font-body"
              style={{ borderRadius: 0, letterSpacing: "0.1em" }}
            >
              Contactar
              <ArrowRight size={14} />
            </button>
          </Link>
        </div>
      </section>
    </Layout>
  );
}
