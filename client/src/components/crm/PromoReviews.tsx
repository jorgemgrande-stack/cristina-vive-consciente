/**
 * Registros de una promoción «en revisión»: el correo o el teléfono coinciden con varias fichas, o con una de nombre distinto.
 * Cristina elige la ficha correcta; al vincular se añade «Recursos gratuitos», el recurso gratuito y la descarga pasa a clientes únicos.
 */
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

export default function PromoReviews({ promoId }: { promoId: number }) {
  const utils = trpc.useUtils();
  const { data: rows = [] } = trpc.promosAdmin.reviews.useQuery({ promoId });
  const link = trpc.promosAdmin.linkRegistration.useMutation({
    onSuccess: () => {
      utils.promosAdmin.reviews.invalidate({ promoId });
      utils.promosAdmin.get.invalidate({ id: promoId });
      utils.promosAdmin.list.invalidate();
      toast.success("Vinculado a la ficha");
    },
    onError: (e) => toast.error(e.message),
  });
  if (rows.length === 0) return null;
  return (
    <div className="bg-white rounded-lg border border-amber-200 p-5 mb-5" data-testid="promo-reviews">
      <h2 className="text-sm font-semibold text-gray-900 mb-1">Registros por revisar ({rows.length})</h2>
      <p className="text-xs text-gray-500 mb-3">
        Estas personas ya descargaron el cuento, pero sus datos coinciden con varias fichas (o con una de otro nombre) y no se ha tocado ninguna. Elige la ficha correcta.
      </p>
      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.id} className="border border-gray-100 rounded p-3">
            <p className="text-sm text-gray-900">{r.name} · {r.email} · {r.phone}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {r.candidates.map((c) => (
                <Button key={c!.id} size="sm" variant="outline" disabled={link.isPending} onClick={() => link.mutate({ registrationId: r.id, clientId: c!.id })}>
                  Vincular a {c!.firstName} {c!.lastName} (#{c!.id}{c!.email ? ` · ${c!.email}` : ""})
                </Button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
