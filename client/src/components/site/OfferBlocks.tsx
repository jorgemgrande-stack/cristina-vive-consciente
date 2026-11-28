/** Bloques «Pedidos de aceites», «Servicio con precio» y «Guías y recursos». */
import { ArrowRight, Check, Leaf } from "lucide-react";
import { Link } from "wouter";
import type { BlockOf } from "@shared/siteEditor";
import { formatDeadline, groupOrderState } from "@shared/oilOrders";
import { ebookPath } from "@shared/ebookPage";
import { formatEurosFixed } from "@shared/orders";
import { BuyButton } from "@/components/ebooks/EbookParts";
import { trpc } from "@/lib/trpc";
import SiteLink from "./SiteLink";

const H2 = "font-display text-[oklch(0.18_0.018_55)] mb-4";
const H3 = "font-display text-[oklch(0.18_0.018_55)] text-xl mb-3";
const P = "font-body text-[oklch(0.38_0.02_55)] leading-relaxed";
const light = { fontWeight: 300 } as const;
const BTN = "btn-primary w-full sm:w-auto justify-center text-center";

const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);
const Paragraphs = ({ text, className = "" }: { text: string; className?: string }) => (
  <>{text.split(/\n{2,}/).filter(Boolean).map((p, i) => <p key={i} className={`${P} mb-3 ${className}`} style={light}>{p}</p>)}</>
);

function Action({ label, url }: { label: string; url: string }) {
  if (!label || !url) return null;
  return <SiteLink href={url} className={BTN} style={{ textDecoration: "none" }}>{label} <ArrowRight size={15} /></SiteLink>;
}

export function OilOrdersBlock({ b, now = Date.now() }: { b: BlockOf<"oil_orders">; now?: number }) {
  const d = b.data;
  const state = groupOrderState(d.groupOpen, d.groupDeadline, now);
  const open = state === "open";
  const Min = ({ value }: { value: string }) => value ? <p className={`${P} mb-1`}>Importe mínimo de compra: <strong className="whitespace-nowrap">{value}</strong></p> : null;
  return (
    <section className="container py-10" aria-label={d.title}>
      <h2 className={`${H2} text-center mb-8`} style={light}>{d.title}</h2>
      <div className="grid md:grid-cols-2 gap-5 max-w-5xl mx-auto">
        <article className="bg-white border border-[oklch(0.9_0.012_78)] p-5 sm:p-7 flex flex-col" data-testid="oil-group" data-state={state}>
          <h3 className={H3} style={light}>{d.groupTitle}</h3>
          <Paragraphs text={d.groupText} />
          <Min value={d.groupMin} />
          {d.groupNote && <p className={`${P} text-sm mb-3`} style={light}>{d.groupNote}</p>}
          {open
            ? <p className={`${P} mb-4 text-[oklch(0.34_0.07_148)]`}>Pedido abierto hasta el <strong>{formatDeadline(d.groupDeadline)}</strong> incluido.</p>
            : d.groupHint && <p className={`${P} mb-4`} style={light}>{d.groupHint}</p>}
          <div className="mt-auto">
            {open ? <Action label={d.groupOpenLabel} url={d.groupOpenUrl} /> : <Action label={d.groupClosedLabel} url={d.groupClosedUrl} />}
          </div>
        </article>
        <article className="bg-white border border-[oklch(0.9_0.012_78)] p-5 sm:p-7 flex flex-col" data-testid="oil-solo">
          <h3 className={H3} style={light}>{d.soloTitle}</h3>
          <Paragraphs text={d.soloText} />
          <Min value={d.soloMin} />
          {d.soloNote && <p className={`${P} text-sm mb-3`} style={light}>{d.soloNote}</p>}
          {d.soloHint && <p className={`${P} mb-4`} style={light}>{d.soloHint}</p>}
          <div className="mt-auto"><Action label={d.soloLabel} url={d.soloUrl} /></div>
        </article>
      </div>
      <div className="max-w-3xl mx-auto mt-8">
        {lines(d.conditions).length > 0 && (
          <>
            <h3 className={H3} style={light}>{d.conditionsTitle}</h3>
            <ul className="space-y-2 mb-5">
              {lines(d.conditions).map((c, i) => (
                <li key={i} className={`${P} flex gap-2`} style={light}><Check size={16} className="mt-1 flex-shrink-0 text-[oklch(0.52_0.08_148)]" aria-hidden="true" />{c}</li>
              ))}
            </ul>
          </>
        )}
        {d.closing && <p className={`${P} font-medium`}>{d.closing}</p>}
      </div>
    </section>
  );
}

export function ServiceOfferBlock({ b }: { b: BlockOf<"service_offer"> }) {
  const d = b.data;
  // La consulta publicada manda: precio y reserva. Sin ella no se enlaza una ficha que no existe.
  const linked = trpc.services.list.useQuery(undefined, { enabled: !!d.serviceSlug });
  const service = d.serviceSlug ? linked.data?.find((s) => s.slug === d.serviceSlug) : undefined;
  const loading = !!d.serviceSlug && linked.isLoading;
  const price = service?.price ? `${Number(service.price).toLocaleString("es-ES", { maximumFractionDigits: 2 })} €` : "";
  const priceLabel = d.priceLabel.includes("{precio}") ? (price ? d.priceLabel.replace("{precio}", price) : "") : d.priceLabel;
  const buttonUrl = service ? `/consultas/${service.slug}` : d.buttonUrl;
  return (
    <section className="container py-12 max-w-3xl" aria-label={d.title}>
      {d.eyebrow && <p className="text-[oklch(0.45_0.08_148)] text-xs tracking-[0.2em] uppercase mb-3 font-body" style={{ fontWeight: 500 }}>{d.eyebrow}</p>}
      <h2 className={H2} style={light}>{d.title}</h2>
      <Paragraphs text={d.intro} />
      {lines(d.includes).length > 0 && (
        <>
          <h3 className={`${H3} mt-8`} style={light}>{d.includesTitle}</h3>
          <ul className="space-y-2">
            {lines(d.includes).map((c, i) => (
              <li key={i} className={`${P} flex gap-2`} style={light}><Leaf size={15} className="mt-1 flex-shrink-0 text-[oklch(0.52_0.08_148)]" aria-hidden="true" />{c}</li>
            ))}
          </ul>
        </>
      )}
      {d.howText && (<><h3 className={`${H3} mt-8`} style={light}>{d.howTitle}</h3><Paragraphs text={d.howText} /></>)}
      <div className="mt-8 border border-[oklch(0.79_0.04_148)] bg-[oklch(0.95_0.025_148)] p-5 sm:p-7">
        {priceLabel && <p className="font-display text-2xl text-[oklch(0.18_0.018_55)] mb-3" data-testid="service-price">{priceLabel}</p>}
        <Paragraphs text={d.priceNote} className="text-sm" />
        {d.buttonLabel && !loading && (buttonUrl ? (
          <Action label={d.buttonLabel} url={buttonUrl} />
        ) : (
          <div data-testid="service-pending">
            <button type="button" disabled aria-describedby={`${b.id}-pending`} className={`${BTN} opacity-50 cursor-not-allowed`}>{d.buttonLabel}</button>
            {d.pendingText && <p id={`${b.id}-pending`} className={`${P} text-sm mt-2`}>{d.pendingText}</p>}
          </div>
        ))}
        {d.helpLabel && d.helpUrl && (
          <p className="mt-3">
            <SiteLink href={d.helpUrl} className="inline-flex min-h-11 items-center text-sm font-body underline text-[oklch(0.34_0.07_148)]">{d.helpLabel}</SiteLink>
          </p>
        )}
      </div>
    </section>
  );
}

export function ResourcesBlock({ b }: { b: BlockOf<"resources"> }) {
  const d = b.data;
  const slugs = d.items.map((i) => i.ebookSlug).filter(Boolean);
  const { data: ebooks = [] } = trpc.ebooks.resources.useQuery({ slugs }, { enabled: slugs.length > 0 });
  return (
    <section className="container py-12" aria-label={d.title}>
      <div className="text-center max-w-2xl mx-auto mb-8">
        <h2 className={H2} style={light}>{d.title}</h2>
        <Paragraphs text={d.intro} />
      </div>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 justify-center max-w-5xl mx-auto">
        {d.items.map((it, i) => {
          const ebook = ebooks.find((e) => e.requested === it.ebookSlug);
          return (
            <li key={i} className={`bg-white border border-[oklch(0.9_0.012_78)] p-5 sm:p-6 flex flex-col ${d.items.length === 1 ? "sm:col-span-2 lg:col-span-1 lg:col-start-2" : ""}`} data-testid="resource" data-available={ebook?.available ? "yes" : "no"}>
              {ebook?.coverImage && <img src={ebook.coverImage} alt="" loading="lazy" className="w-full aspect-[4/3] object-contain mb-4" />}
              <h3 className={H3} style={light}>{it.title}</h3>
              <Paragraphs text={it.text} className="text-sm" />
              <div className="mt-auto">
                {ebook && <p className="font-display text-2xl text-[oklch(0.18_0.018_55)] mb-3">{formatEurosFixed(ebook.priceCents)}</p>}
                {ebook?.available ? (
                  // La compra se hace aquí mismo: el mismo formulario de pedido por Bizum que la ficha del ebook
                  <>
                    <BuyButton ebookId={ebook.slug} title={ebook.title} label={it.buttonLabel || "Adquirir guía"} price={formatEurosFixed(ebook.priceCents)} />
                    <Link href={ebookPath(ebook.slug)} className="mt-3 inline-flex min-h-11 items-center text-sm font-body underline text-[oklch(0.34_0.07_148)]">Ver los detalles de la guía</Link>
                  </>
                ) : (
                  <>
                    <button type="button" disabled className={`${BTN} !w-full opacity-50 cursor-not-allowed`}>{it.buttonLabel || "Adquirir guía"}</button>
                    <p className={`${P} text-sm mt-2`}>Disponible próximamente.</p>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
