/**
 * Catálogo informativo de aceites (bloque conectado «aceites»). Sin precios, carrito ni compra: la única acción de cada
 * tarjeta es «Ver detalle». Los seis filtros salen del tipo de producto que ya tiene cada ficha (CRM → Aceites).
 */
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Leaf, Loader2, Search, Star } from "lucide-react";
import AdminEditLink from "@/components/site/AdminEditLink";
import SiteLink from "@/components/site/SiteLink";
import { Input } from "@/components/ui/input";
import { useLabels } from "@/lib/siteGlobal";
import { trpc } from "@/lib/trpc";
import { OIL_FILTERS, filterOils, oilTypeLabelKey } from "@shared/oilCatalog";
import { OILS_NOT_INCLUDED, oilLink } from "@shared/oilLinks";
import { useOilOffers } from "./useOilOffers";

export default function OilCatalog({ title, intro, buttonLabel, buttonUrl }: { title: string; intro: string; buttonLabel: string; buttonUrl: string }) {
  const L = useLabels();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const { data: products = [], isLoading } = trpc.oils.listProducts.useQuery({});
  const shown = useMemo(() => filterOils(products, filter, search), [products, filter, search]);
  const offerFor = useOilOffers(products.map((p) => oilLink(p.tags)));

  return (
    <section className="container py-12 md:py-16" aria-labelledby="oil-catalog-title">
      <div className="max-w-3xl mb-8">
        <h2 id="oil-catalog-title" className="font-display text-[oklch(0.18_0.018_55)] mb-4" style={{ fontWeight: 400 }}>{title}</h2>
        {intro.split(/\n{2,}/).filter(Boolean).map((p, i) => (
          <p key={i} className="font-body text-[oklch(0.4_0.02_55)] leading-relaxed mb-3" style={{ fontWeight: 300 }}>{p}</p>
        ))}
        {buttonLabel && buttonUrl && (
          <SiteLink href={buttonUrl} className="btn-primary mt-3 w-full sm:w-auto justify-center" style={{ textDecoration: "none" }}>
            {buttonLabel} <ArrowRight size={15} />
          </SiteLink>
        )}
      </div>

      {/* Filtros: en móvil, rejilla de dos columnas con textos completos; en pantallas anchas, en línea */}
      <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap mb-4" role="group" aria-label="Filtrar el catálogo">
        {OIL_FILTERS.map((f) => {
          const on = filter === f.value;
          return (
            <button
              key={f.value || "all"}
              type="button"
              aria-pressed={on}
              onClick={() => setFilter(f.value)}
              className={`min-h-11 px-3 py-2 text-[0.7rem] leading-tight font-body uppercase tracking-wider border transition-colors ${
                on ? "bg-[oklch(0.38_0.07_148)] border-[oklch(0.38_0.07_148)] text-white" : "bg-white border-[oklch(0.85_0.015_75)] text-[oklch(0.38_0.02_55)] hover:border-[oklch(0.52_0.08_148)]"
              }`}
            >
              {L(f.labelKey)}
            </button>
          );
        })}
      </div>

      <div className="relative max-w-md mb-6">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[oklch(0.52_0.04_80)]" aria-hidden="true" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={L("aceites.search.ph")} aria-label="Buscar en el catálogo" className="pl-9 h-11 font-body text-sm bg-white" style={{ borderRadius: 0 }} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-[oklch(0.52_0.08_148)]" aria-label="Cargando el catálogo" /></div>
      ) : shown.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <Leaf size={40} className="mx-auto text-[oklch(0.72_0.06_148)] opacity-40" aria-hidden="true" />
          <p className="font-body text-[oklch(0.45_0.02_55)]">{L("aceites.empty.text")}</p>
          <button type="button" onClick={() => { setSearch(""); setFilter(""); }} className="text-xs font-body uppercase tracking-wider text-[oklch(0.38_0.07_148)] underline min-h-11">{L("aceites.empty.button")}</button>
        </div>
      ) : (
        <>
          <p className="text-xs font-body text-[oklch(0.45_0.02_55)] mb-4 uppercase tracking-wider" aria-live="polite">{L(shown.length !== 1 ? "aceites.count.many" : "aceites.count.one", { n: shown.length })}</p>
          <ul className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6" data-testid="oil-grid">
            {shown.map((p) => {
              const offer = offerFor(oilLink(p.tags));
              return (
              <li key={p.id} className="relative group bg-white border border-[oklch(0.9_0.012_78)] flex flex-col min-w-0">
                <AdminEditLink href="/crm/aceites/productos" label="Editar producto" />
                <Link href={`/aceites-esenciales/${p.slug}`} tabIndex={-1} aria-hidden="true">
                  <div className="relative overflow-hidden aspect-square bg-[oklch(0.97_0.006_85)]">
                    {p.imagen ? (
                      <img src={p.imagen} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Leaf size={40} className="text-[oklch(0.72_0.06_148)] opacity-40" /></div>
                    )}
                    {p.destacado === 1 && (
                      <span className="absolute top-2 left-2 bg-[oklch(0.38_0.07_148)] text-white text-[0.6rem] font-body uppercase tracking-widest px-2 py-0.5 flex items-center gap-1">
                        <Star size={9} fill="currentColor" /> {L("aceites.card.featured")}
                      </span>
                    )}
                  </div>
                </Link>
                <div className="flex flex-col flex-1 p-3 md:p-4 gap-2">
                  <p className="text-[0.6rem] font-body uppercase tracking-wider text-[oklch(0.45_0.07_148)] leading-snug">{oilTypeLabelKey(p.tipoProducto) ? L(oilTypeLabelKey(p.tipoProducto)) : p.tipoProducto}</p>
                  <h3 className="font-display text-base text-[oklch(0.18_0.018_55)] leading-snug break-words flex-1">{p.name}</h3>
                  {offer?.price && <p className="font-display text-lg text-[oklch(0.18_0.018_55)]" data-testid="oil-price">{offer.price}</p>}
                  {offer?.kind === "consulta" && <p className="text-xs font-body text-[oklch(0.4_0.02_55)] leading-snug">{OILS_NOT_INCLUDED}</p>}
                  <Link href={`/aceites-esenciales/${p.slug}`} aria-label={`${L("aceites.card.detail")}: ${p.name}`}
                    className="min-h-11 flex items-center justify-center text-center text-xs font-body uppercase tracking-wider border border-[oklch(0.62_0.07_148)] text-[oklch(0.34_0.07_148)] hover:bg-[oklch(0.95_0.02_148)] transition-colors px-2 no-underline">
                    {L("aceites.card.detail")}
                  </Link>
                </div>
              </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
