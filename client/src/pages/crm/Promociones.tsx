/**
 * CRM — Ebooks → Promociones de descarga gratuita.
 * Lista de campañas con su estado (según la hora del servidor), medición por origen y acciones: editar, duplicar, borrar.
 */
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Copy, ExternalLink, Gift, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import CRMLayout from "@/components/CRMLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PromoMetrics from "@/components/crm/PromoMetrics";
import PromoDownloaders from "@/components/crm/PromoDownloaders";
import { formatMadridDeadline, promoPath, type PromoState } from "@shared/promo";

export const PROMO_STATE_LABEL: Record<PromoState, { label: string; cls: string }> = {
  draft: { label: "Borrador", cls: "bg-gray-100 text-gray-600" },
  scheduled: { label: "Programada", cls: "bg-blue-100 text-blue-700" },
  active: { label: "Activa", cls: "bg-green-100 text-green-700" },
  ended: { label: "Terminada", cls: "bg-amber-100 text-amber-700" },
};

export default function Promociones() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [deleting, setDeleting] = useState<number | null>(null);
  const { data: promos = [], isLoading } = trpc.promosAdmin.list.useQuery(undefined, { refetchInterval: 30_000 });

  const duplicate = trpc.promosAdmin.duplicate.useMutation({
    onSuccess: (r) => {
      utils.promosAdmin.list.invalidate();
      toast.success("Copia creada como borrador");
      navigate(`/crm/ebooks/promociones/${r.id}/editar`);
    },
    onError: (e) => toast.error(e.message),
  });
  const del = trpc.promosAdmin.delete.useMutation({
    onSuccess: () => {
      utils.promosAdmin.list.invalidate();
      setDeleting(null);
      toast.success("Promoción eliminada");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <CRMLayout>
      <div className="p-6 md:p-8 max-w-5xl mx-auto">
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">Promociones</h1>
            <p className="text-sm text-gray-500">Campañas de descarga gratuita de un ebook por tiempo limitado, con página propia y cuenta atrás.</p>
          </div>
          <Link href="/crm/ebooks/promociones/nueva">
            <Button className="bg-[oklch(0.52_0.08_148)] hover:bg-[oklch(0.42_0.08_148)] text-white gap-2"><Plus size={16} /> Nueva promoción</Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-gray-400">Cargando…</div>
          ) : promos.length === 0 ? (
            <div className="p-12 text-center">
              <Gift size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Todavía no hay promociones.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {promos.map((p) => {
                const st = PROMO_STATE_LABEL[p.state];
                return (
                  <div key={p.id} className="p-4 space-y-3" data-testid="promo-row">
                    <div className="flex items-start gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-gray-900 text-sm">{p.name}</h3>
                          <Badge className={`text-[0.65rem] px-2 py-0 hover:bg-current ${st.cls}`}>{st.label}</Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {p.startsAt ? `Desde ${formatMadridDeadline(p.startsAt)} · ` : ""}Cierra el {formatMadridDeadline(p.endsAt)} (hora peninsular)
                        </p>
                        <a href={promoPath(p.slug)} target="_blank" rel="noreferrer" className="text-xs text-[oklch(0.42_0.08_148)] inline-flex items-center gap-1 mt-1 hover:underline">
                          {promoPath(p.slug)} <ExternalLink size={11} />
                        </a>
                      </div>
                      <div className="flex gap-1.5">
                        <Link href={`/crm/ebooks/promociones/${p.id}/editar`}><Button variant="outline" size="sm" className="gap-1.5"><Pencil size={13} /> Editar</Button></Link>
                        <Button variant="outline" size="sm" className="gap-1.5" disabled={duplicate.isPending} onClick={() => duplicate.mutate({ id: p.id })}><Copy size={13} /> Duplicar</Button>
                        {deleting === p.id ? (
                          <Button variant="destructive" size="sm" onClick={() => del.mutate({ id: p.id })}>Confirmar borrado</Button>
                        ) : (
                          <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setDeleting(p.id)} aria-label="Borrar"><Trash2 size={14} /></Button>
                        )}
                      </div>
                    </div>
                    <PromoMetrics stats={p.stats} />
                    <PromoDownloaders promoId={p.id} total={p.stats.downloads} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </CRMLayout>
  );
}
