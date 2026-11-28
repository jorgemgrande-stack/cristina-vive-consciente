/** Precio y destino de las fichas del catálogo que remiten a una guía digital o al asesoramiento (ver shared/oilLinks.ts). */
import { trpc } from "@/lib/trpc";
import { ebookPath, matchesEbookSlug } from "@shared/ebookPage";
import { formatEuros } from "@shared/orders";
import { OIL_ADVICE_URL, type OilLink } from "@shared/oilLinks";

export interface OilOffer {
  kind: OilLink["kind"];
  /** Vacío si la guía o el servicio no están publicados */
  price: string;
  url: string;
  label: string;
}

export function useOilOffers(links: Array<OilLink | null>): (link: OilLink | null) => OilOffer | null {
  const slugs = links.flatMap((l) => (l?.kind === "ebook" ? [l.ref] : []));
  const ebooks = trpc.ebooks.resources.useQuery({ slugs }, { enabled: slugs.length > 0 });
  const services = trpc.services.list.useQuery(undefined, { enabled: links.some((l) => l?.kind === "consulta") });
  return (link) => {
    if (!link) return null;
    if (link.kind === "ebook") {
      const e = ebooks.data?.find((x) => matchesEbookSlug(link.ref, x.requested));
      return { kind: "ebook", price: e?.available ? formatEuros(e.priceCents) : "", url: e?.available ? ebookPath(e.slug) : "", label: "Adquirir guía" };
    }
    // El pack lleva al apartado de asesoramiento de Aceites; desde allí se abre la ficha de la consulta
    const s = services.data?.find((x) => x.slug === link.ref);
    return { kind: "consulta", price: s?.price ? formatEuros(Math.round(Number(s.price) * 100)) : "", url: OIL_ADVICE_URL, label: "Conocer asesoramiento" };
  };
}
