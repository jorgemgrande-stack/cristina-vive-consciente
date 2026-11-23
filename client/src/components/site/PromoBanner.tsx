import { useLocation, Link } from "wouter";
import { ArrowRight, Gift } from "lucide-react";
import { useActivePromo } from "@/lib/promoApi";

/**
 * Aviso de la promoción de descarga gratuita. Solo en la portada y en Guías digitales, y solo mientras el SERVIDOR dice
 * que la campaña está activa: al cierre desaparece solo, sin recargar.
 */
export default function PromoBanner() {
  const [location] = useLocation();
  const promo = useActivePromo();
  const here = location === "/" || location === "/guias-digitales";
  if (!here || !promo) return null;
  return (
    <div role="status" className="bg-[oklch(0.52_0.08_148)] text-white font-body" data-testid="promo-banner">
      <div className="container">
        <Link
          href={promo.path}
          className="flex items-center justify-center gap-2.5 py-2.5 text-[0.8rem] md:text-sm text-white no-underline hover:underline underline-offset-4"
          style={{ fontWeight: 500 }}
        >
          <Gift size={16} className="flex-shrink-0" aria-hidden />
          <span className="text-center">{promo.bannerText}</span>
          <ArrowRight size={14} className="flex-shrink-0" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
