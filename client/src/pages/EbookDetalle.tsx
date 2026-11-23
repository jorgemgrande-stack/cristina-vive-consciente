/**
 * Ficha de compra de un ebook (/guias-digitales/:slug) — Cristina Vive Consciente
 * Design: "Luz Botánica". Datos del CMS (tabla ebooks); la compra reutiliza el pedido + pago por Bizum de siempre.
 * Escritorio: galería a la izquierda y compra a la derecha. Móvil: portada, título, precio y botón, en ese orden.
 */
import { useEffect } from "react";
import { Link, useRoute } from "wouter";
import { ArrowLeft, Check, FileText, Mail } from "lucide-react";
import { trpc } from "@/lib/trpc";
import Layout from "@/components/Layout";
import NotFound from "@/pages/NotFound";
import { BuyButton, EbookGallery } from "@/components/ebooks/EbookParts";
import { ebookImages, ebookIncludes, ebookPath, ebookPriceLabel, ebookSeo, matchesEbookSlug } from "@shared/ebookPage";

/** Título, descripción, canonical e imagen para compartir también al navegar dentro de la web (el servidor ya los pone en el HTML inicial). */
function useEbookMeta(seo: ReturnType<typeof ebookSeo> | null) {
  useEffect(() => {
    if (!seo) return;
    const prevTitle = document.title;
    document.title = seo.title;
    const undo: (() => void)[] = [];
    const meta = (sel: string, attr: "name" | "property", key: string, content: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(sel);
      const existed = !!el;
      const prev = el?.content ?? "";
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      const node = el;
      node.content = content;
      undo.push(() => (existed ? (node.content = prev) : node.remove()));
    };
    meta('meta[name="description"]', "name", "description", seo.description);
    meta('meta[property="og:title"]', "property", "og:title", seo.title);
    meta('meta[property="og:description"]', "property", "og:description", seo.description);
    meta('meta[property="og:url"]', "property", "og:url", seo.canonical);
    if (seo.image) meta('meta[property="og:image"]', "property", "og:image", seo.image);
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const hadLink = !!link;
    const prevHref = link?.href ?? "";
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    const linkNode = link;
    linkNode.href = seo.canonical;
    return () => {
      document.title = prevTitle;
      undo.forEach((u) => u());
      if (hadLink) linkNode.href = prevHref;
      else linkNode.remove();
    };
  }, [seo?.title, seo?.description, seo?.canonical, seo?.image]);
}

export default function EbookDetalle() {
  const [, params] = useRoute("/guias-digitales/:slug");
  const urlSlug = params?.slug ?? "";
  const { data: ebooks, isLoading } = trpc.ebooksAdmin.list.useQuery(); // solo ebooks activos
  const ebook = ebooks?.find((e) => matchesEbookSlug(urlSlug, e.slug)) ?? null;
  const seo = ebook ? ebookSeo(ebook, window.location.origin) : null;
  useEbookMeta(seo);

  // Entrar con «_» (los_cuatro_regalos…) deja en la barra la dirección con «-»
  useEffect(() => {
    if (ebook && urlSlug !== ebookPath(ebook.slug).split("/").pop()) window.history.replaceState(null, "", ebookPath(ebook.slug));
  }, [ebook, urlSlug]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-40">
          <div className="w-8 h-8 border-2 border-[oklch(0.52_0.08_148)] border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }
  if (!ebook) return <NotFound />; // slug inexistente o ebook inactivo (el servidor responde además con 404)

  const images = ebookImages(ebook);
  const price = ebookPriceLabel(ebook.price);
  const includes = ebookIncludes(ebook);
  const hours = ebook.downloadExpiryHours ?? 72;
  const paragraphs = (ebook.description ?? "").split("\n").map((p) => p.trim()).filter(Boolean);

  return (
    <Layout>
      <div className="bg-[oklch(0.985_0.006_85)]">
        <div className="container pt-24 md:pt-28 pb-6">
          <Link href="/guias-digitales" className="inline-flex items-center gap-1.5 text-xs text-[oklch(0.52_0.02_60)] hover:text-[oklch(0.52_0.08_148)] font-body mb-5">
            <ArrowLeft size={13} /> Todas las guías digitales
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Galería: portada oficial primero; miniaturas y ampliación */}
            <div className="lg:sticky lg:top-28 bg-[oklch(0.97_0.006_85)] p-3 md:p-5">
              <EbookGallery images={images} title={ebook.title} priority />
            </div>

            {/* Compra: título, precio y botón antes de la descripción larga */}
            <div>
              <span className="inline-block px-2.5 py-1 bg-[oklch(0.52_0.08_148)] text-white text-[0.6rem] tracking-widest uppercase font-body mb-3" style={{ fontWeight: 500 }}>
                PDF Digital
              </span>
              <h1 className="font-display text-[oklch(0.18_0.018_55)] mb-2" style={{ fontWeight: 400, fontSize: "clamp(1.7rem, 4vw, 2.4rem)", lineHeight: 1.2 }}>
                {ebook.title}
              </h1>
              {ebook.subtitle && (
                <p className="text-[oklch(0.52_0.02_60)] text-base mb-4 font-body italic" style={{ fontWeight: 300 }}>{ebook.subtitle}</p>
              )}
              <p className="font-display text-[oklch(0.52_0.08_148)] mb-5" style={{ fontWeight: 400, fontSize: "2.4rem", lineHeight: 1 }} data-testid="ebook-price">
                {price}
              </p>
              <BuyButton ebookId={ebook.slug} label="Comprar guía" price={price} title={ebook.title} />
              <ul className="mt-4 space-y-2 text-sm text-[oklch(0.38_0.02_55)] font-body" style={{ fontWeight: 300 }}>
                <li className="flex items-start gap-2"><Check size={15} className="mt-0.5 text-[oklch(0.52_0.08_148)] flex-shrink-0" />Pago por Bizum, sin tarjeta ni registro</li>
                <li className="flex items-start gap-2"><Mail size={15} className="mt-0.5 text-[oklch(0.52_0.08_148)] flex-shrink-0" />Recibes la guía por email cuando Cristina confirma el pago</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Descripción, contenido incluido y entrega */}
        <section className="container py-10 md:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2">
              <h2 className="font-display text-[oklch(0.18_0.018_55)] mb-4" style={{ fontWeight: 400, fontSize: "1.5rem" }}>Sobre esta guía</h2>
              <div className="section-divider mb-5" />
              <div className="space-y-4">
                {paragraphs.map((p, i) => (
                  <p key={i} className="text-[oklch(0.38_0.02_55)] leading-relaxed font-body" style={{ fontWeight: 300 }}>{p}</p>
                ))}
              </div>
            </div>
            <aside className="space-y-5">
              <div className="p-5 bg-[oklch(0.94_0.012_80)] border border-[oklch(0.88_0.015_75)]">
                <p className="text-[oklch(0.28_0.025_55)] text-xs tracking-widest uppercase mb-4 font-body" style={{ fontWeight: 500 }}>Esta guía incluye</p>
                <ul className="space-y-3" data-testid="ebook-includes">
                  {includes.map((it) => (
                    <li key={it.key} className="flex items-start gap-2.5">
                      <Check size={14} className="mt-0.5 text-[oklch(0.52_0.08_148)] flex-shrink-0" />
                      <span className="text-[oklch(0.38_0.02_55)] text-sm font-body" style={{ fontWeight: 300 }}>{it.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-5 border border-[oklch(0.88_0.015_75)] bg-white">
                <p className="text-[oklch(0.28_0.025_55)] text-xs tracking-widest uppercase mb-3 font-body" style={{ fontWeight: 500 }}>Formato de entrega</p>
                <p className="flex items-start gap-2.5 text-[oklch(0.38_0.02_55)] text-sm font-body" style={{ fontWeight: 300 }}>
                  <FileText size={14} className="mt-0.5 text-[oklch(0.52_0.08_148)] flex-shrink-0" />
                  <span>Archivo PDF por email. El enlace de descarga está activo {hours} horas desde que se confirma el pago.</span>
                </p>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </Layout>
  );
}
