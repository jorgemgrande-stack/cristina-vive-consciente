/**
 * Pedido de guía pagado por Bizum — Cristina Vive Consciente
 * Muestra importe, teléfono y referencia (concepto) para el Bizum. El pago lo confirma Cristina a mano:
 * el botón «Ya he hecho el Bizum» solo le avisa, no entrega nada.
 */

import { useState } from "react";
import { useRoute, Link } from "wouter";
import { AlertCircle, CheckCircle2, Clock, Copy, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import Layout from "@/components/Layout";
import { CRISTINA_WHATSAPP_NUMBER } from "@shared/booking";

function CopyRow({ label, value, copyValue }: { label: string; value: string; copyValue?: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(copyValue ?? value);
      toast.success(`${label} copiado`);
    } catch {
      toast.error("No se pudo copiar. Cópialo a mano.");
    }
  };
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-[oklch(0.9_0.012_75)] last:border-0">
      <div>
        <p className="font-body text-[11px] uppercase tracking-widest" style={{ color: "oklch(0.52 0.02 60)" }}>{label}</p>
        <p className="font-body text-lg" style={{ fontWeight: 500, color: "oklch(0.18 0.018 55)" }}>{value}</p>
      </div>
      <button
        type="button"
        onClick={copy}
        className="p-2 border border-[oklch(0.85_0.015_75)] hover:bg-[oklch(0.95_0.01_80)]"
        aria-label={`Copiar ${label}`}
      >
        <Copy size={16} />
      </button>
    </div>
  );
}

export default function Pedido() {
  const [, params] = useRoute("/pedido/:reference");
  const reference = (params?.reference ?? "").toUpperCase();
  const utils = trpc.useUtils();
  const [claimed, setClaimed] = useState(false);

  const { data: order, isLoading, error } = trpc.orders.get.useQuery(
    { reference },
    { enabled: !!reference, retry: 1, refetchInterval: (q) => (q.state.data?.status === "pending" ? 20_000 : false) }
  );

  const claim = trpc.orders.claimPaid.useMutation({
    onSuccess: () => {
      setClaimed(true);
      utils.orders.get.invalidate({ reference });
    },
    onError: () => toast.error("No se pudo avisar a Cristina. Escríbele por WhatsApp."),
  });

  const waUrl = `https://wa.me/${CRISTINA_WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hola Cristina, tengo el pedido ${reference} y quería preguntarte sobre el pago.`
  )}`;

  return (
    <Layout>
      <div className="min-h-[60vh] py-16 px-6" style={{ background: "#FAFAF7" }}>
        <div className="max-w-md mx-auto">
          {isLoading && (
            <div className="text-center">
              <Loader2 size={32} className="animate-spin mx-auto" />
            </div>
          )}

          {(error || (!isLoading && !order)) && (
            <div className="text-center">
              <AlertCircle size={32} className="mx-auto mb-4" />
              <h1 className="font-display mb-3" style={{ fontWeight: 400, fontSize: "1.5rem" }}>Pedido no encontrado</h1>
              <p className="font-body text-sm mb-6" style={{ fontWeight: 300 }}>Revisa el enlace de tu email o escribe a Cristina.</p>
              <Link href="/guias-digitales" className="font-body text-sm underline">Volver a las guías</Link>
            </div>
          )}

          {order?.status === "pending" && (
            <>
              <h1 className="font-display mb-2" style={{ fontWeight: 400, fontSize: "1.6rem" }}>
                {order.customerFirstName}, haz tu Bizum
              </h1>
              <p className="font-body text-sm mb-6" style={{ fontWeight: 300, color: "oklch(0.4 0.02 60)" }}>
                Pedido <strong>{order.reference}</strong> · {order.productTitle}
              </p>

              <div className="bg-white border border-[oklch(0.88_0.015_75)] px-5 mb-5">
                <CopyRow label="Importe" value={order.amountLabel} copyValue={order.bizumAmount} />
                <CopyRow label="Bizum al teléfono" value={order.bizumPhoneDisplay} copyValue={order.bizumPhone} />
                <CopyRow label="Concepto (obligatorio)" value={order.reference} />
              </div>

              <p className="font-body text-xs mb-6" style={{ fontWeight: 300, color: "oklch(0.45 0.02 60)" }}>
                Pon la referencia en el concepto para que Cristina identifique tu pago. Te hemos enviado estos datos por email.
              </p>

              {order.claimed || claimed ? (
                <div className="flex items-start gap-3 p-4 bg-[oklch(0.96_0.02_148)]">
                  <Clock size={18} className="mt-0.5 flex-shrink-0" />
                  <p className="font-body text-sm" style={{ fontWeight: 300 }}>
                    Gracias. Cristina ya sabe que has pagado y lo está comprobando. En cuanto lo confirme recibirás la guía en tu email.
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => claim.mutate({ reference })}
                  disabled={claim.isPending}
                  className="w-full py-3.5 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-medium hover:bg-[oklch(0.38_0.07_148)] disabled:opacity-60"
                  style={{ borderRadius: 0, letterSpacing: "0.1em" }}
                >
                  {claim.isPending ? "Avisando..." : "Ya he hecho el Bizum"}
                </button>
              )}

              <p className="font-body text-xs text-center mt-6" style={{ fontWeight: 300 }}>
                ¿Dudas? <a href={waUrl} target="_blank" rel="noopener noreferrer" className="underline">Escribe a Cristina por WhatsApp</a>
              </p>
            </>
          )}

          {order?.status === "paid" && (
            <div className="text-center">
              <CheckCircle2 size={40} className="mx-auto mb-4" style={{ color: "oklch(0.38 0.07 148)" }} />
              <h1 className="font-display mb-3" style={{ fontWeight: 400, fontSize: "1.6rem" }}>¡Pago confirmado!</h1>
              <p className="font-body text-sm mb-6" style={{ fontWeight: 300 }}>
                Cristina ha recibido tu Bizum. Te hemos enviado la guía <strong>{order.productTitle}</strong> por email. Si no la ves, revisa la carpeta de spam.
              </p>
              <Link href="/guias-digitales" className="inline-flex items-center gap-2 font-body text-sm underline">
                <ArrowLeft size={14} /> Volver a las guías
              </Link>
            </div>
          )}

          {order?.status === "cancelled" && (
            <div className="text-center">
              <AlertCircle size={32} className="mx-auto mb-4" />
              <h1 className="font-display mb-3" style={{ fontWeight: 400, fontSize: "1.5rem" }}>Pedido cancelado</h1>
              <p className="font-body text-sm mb-6" style={{ fontWeight: 300 }}>
                Este pedido ya no está activo. Si ya hiciste el Bizum, escribe a Cristina por <a href={waUrl} className="underline">WhatsApp</a>.
              </p>
              <Link href="/guias-digitales" className="font-body text-sm underline">Volver a las guías</Link>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
