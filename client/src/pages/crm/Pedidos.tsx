/**
 * CRM — Pedidos de guías pagados por Bizum.
 * Cristina comprueba el Bizum en su banco (referencia en el concepto) y pulsa «Confirmar pago»:
 * solo entonces se entrega la guía al cliente.
 */

import { useState } from "react";
import { CheckCircle2, Mail, RefreshCw, ShoppingBag, XCircle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import CRMLayout from "@/components/CRMLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABELS, formatEuros, type OrderStatus } from "@shared/orders";

type Filter = "pending" | "paid" | "cancelled" | "all";
const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: "pending", label: "Pendientes" },
  { key: "paid", label: "Pagados" },
  { key: "cancelled", label: "Cancelados" },
  { key: "all", label: "Todos" },
];

const STATUS_STYLE: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  paid: "bg-green-100 text-green-800 hover:bg-green-100",
  cancelled: "bg-gray-100 text-gray-600 hover:bg-gray-100",
};

function fmtDate(ms: number | Date | null | undefined): string {
  if (!ms) return "";
  return new Date(ms).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" });
}

export default function Pedidos() {
  const [filter, setFilter] = useState<Filter>("pending");
  const utils = trpc.useUtils();
  const { data: rows = [], isLoading } = trpc.orders.list.useQuery(
    filter === "all" ? undefined : { status: filter },
    { refetchInterval: 30_000 }
  );

  const refresh = () => {
    utils.orders.list.invalidate();
    utils.orders.pendingCount.invalidate();
  };

  const confirm = trpc.orders.confirmPayment.useMutation({
    onSuccess: (r) => {
      refresh();
      if (r.alreadyPaid) toast.info("Este pedido ya estaba confirmado.");
      else if (r.emailSent) toast.success("Pago confirmado y guía enviada al cliente.");
      else toast.warning(`Pago confirmado, pero la guía NO se envió: ${r.error ?? "error de email"}. Usa «Enviar guía» cuando esté resuelto.`);
    },
    onError: (e) => toast.error(e.message || "No se pudo confirmar el pago."),
  });
  const resend = trpc.orders.resendDelivery.useMutation({
    onSuccess: (r) => {
      refresh();
      r.emailSent ? toast.success("Guía enviada.") : toast.error(r.error ?? "No se pudo enviar el email.");
    },
    onError: (e) => toast.error(e.message),
  });
  const cancel = trpc.orders.cancel.useMutation({
    onSuccess: () => {
      refresh();
      toast.success("Pedido cancelado.");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <CRMLayout>
      <div className="p-6 md:p-8 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Pedidos</h1>
          <p className="text-sm text-gray-500">
            Guías pagadas por Bizum. Comprueba en tu banco que ha llegado el Bizum con la referencia en el concepto y pulsa «Confirmar pago»:
            solo entonces se envía la guía al cliente.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {FILTERS.map((f) => (
            <Button key={f.key} size="sm" variant={filter === f.key ? "default" : "outline"} onClick={() => setFilter(f.key)}>
              {f.label}
            </Button>
          ))}
        </div>

        <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-gray-400">Cargando pedidos...</div>
          ) : rows.length === 0 ? (
            <div className="p-12 text-center">
              <ShoppingBag size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No hay pedidos en esta vista.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {rows.map((o) => (
                <div key={o.id} className="p-4 flex flex-col md:flex-row md:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-semibold text-gray-900">{o.reference}</span>
                      <Badge className={STATUS_STYLE[o.status as OrderStatus]}>{ORDER_STATUS_LABELS[o.status as OrderStatus]}</Badge>
                      {o.status === "pending" && o.customerClaimedAt ? (
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Dice que ya pagó</Badge>
                      ) : null}
                    </div>
                    <p className="text-sm text-gray-800">
                      {o.productTitle} · <strong>{formatEuros(o.amountCents)}</strong>
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {o.customerName} · {o.customerEmail}
                      {o.customerPhone ? ` · ${o.customerPhone}` : ""}
                    </p>
                    <p className="text-xs text-gray-400">
                      Pedido: {fmtDate(o.createdAt)}
                      {o.paidAt ? ` · Pagado: ${fmtDate(o.paidAt)}` : ""}
                      {o.status === "paid" ? (o.deliveryEmailSentAt ? " · Guía enviada" : " · ⚠ Guía NO enviada") : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {o.status !== "paid" && (
                      <Button
                        size="sm"
                        className="bg-[oklch(0.52_0.08_148)] hover:bg-[oklch(0.42_0.08_148)] text-white gap-1.5"
                        disabled={confirm.isPending}
                        onClick={() => {
                          if (window.confirm(`¿Has visto en tu banco el Bizum de ${formatEuros(o.amountCents)} con la referencia ${o.reference}? Se enviará la guía a ${o.customerEmail}.`)) {
                            confirm.mutate({ id: o.id });
                          }
                        }}
                      >
                        <CheckCircle2 size={14} /> Confirmar pago
                      </Button>
                    )}
                    {o.status === "paid" && (
                      <Button size="sm" variant="outline" className="gap-1.5" disabled={resend.isPending} onClick={() => resend.mutate({ id: o.id })}>
                        {o.deliveryEmailSentAt ? <RefreshCw size={14} /> : <Mail size={14} />}
                        {o.deliveryEmailSentAt ? "Reenviar guía" : "Enviar guía"}
                      </Button>
                    )}
                    {o.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-red-600"
                        disabled={cancel.isPending}
                        onClick={() => window.confirm(`¿Cancelar el pedido ${o.reference}?`) && cancel.mutate({ id: o.id })}
                      >
                        <XCircle size={14} /> Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </CRMLayout>
  );
}
