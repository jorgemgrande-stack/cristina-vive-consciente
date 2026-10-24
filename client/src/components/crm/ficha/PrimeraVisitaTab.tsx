/**
 * Ficha · Primera visita (datos de salud): todos los campos opcionales, separada de los datos administrativos.
 * Bloqueada en el servidor hasta habilitar el módulo; requiere consentimiento explícito vigente.
 */
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { LIMITS } from "@shared/clientCare";
import { btnPrimary, card, Field, formatDay, input } from "./ui";
import { ConsentPanel, ModuloBloqueado, useModule } from "./Protegido";

const FIELDS = [
  ["visitReason", "Motivo de la visita"],
  ["allergies", "Alergias o sensibilidades a productos"],
  ["healthForSafety", "Circunstancias de salud relevantes para la seguridad de la sesión"],
  ["areasToAvoid", "Zonas que evitar o tratar con especial cuidado"],
  ["wellbeing", "Estado de bienestar físico o emocional que el cliente quiera compartir"],
  ["otherObservations", "Otras observaciones"],
] as const;
type Key = (typeof FIELDS)[number][0];
const emptyForm = () => Object.fromEntries(FIELDS.map(([k]) => [k, ""])) as Record<Key, string>;

export default function PrimeraVisitaTab({ clientId }: { clientId: number }) {
  const { status, isLoading } = useModule("first_visit");
  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="animate-spin" size={18} /></div>;
  if (!status?.enabled) return <ModuloBloqueado title="Primera visita" missing={status?.missing ?? []} />;
  return <PrimeraVisitaForm clientId={clientId} />;
}

function PrimeraVisitaForm({ clientId }: { clientId: number }) {
  const utils = trpc.useUtils();
  const { data: rows, isLoading } = trpc.care.firstVisit.list.useQuery({ clientId });
  const [hasConsent, setHasConsent] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const current = rows?.[0];

  useEffect(() => {
    if (current) setForm({ ...emptyForm(), ...(current.data as Record<Key, string>) });
  }, [current?.id]);

  const save = trpc.care.firstVisit.save.useMutation({
    onSuccess: () => { utils.care.firstVisit.list.invalidate({ clientId }); toast.success("Ficha de primera visita guardada"); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <ConsentPanel clientId={clientId} module="first_visit" onActiveChange={setHasConsent} />
      {isLoading ? (
        <div className="flex justify-center py-6"><Loader2 className="animate-spin" size={16} /></div>
      ) : (
        <form
          className={`${card} space-y-4`}
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate({ clientId, id: current?.id, recordDate: current?.recordDate ?? Date.now(), data: form });
          }}
        >
          <p className="text-xs font-body text-[oklch(0.52_0.02_60)]">
            Todo es opcional. Anota solo lo necesario para que la sesión sea segura y cómoda. {current && `Última actualización: ${formatDay(new Date(current.updatedAt).getTime())}.`}
          </p>
          {FIELDS.map(([k, t]) => (
            <Field key={k} id={`fv-${k}`} title={t}>
              <textarea id={`fv-${k}`} rows={2} maxLength={LIMITS.longText} disabled={!hasConsent} value={form[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} className={`${input} resize-y disabled:bg-gray-50`} />
            </Field>
          ))}
          <button type="submit" disabled={!hasConsent || save.isPending} className={`${btnPrimary} w-full sm:w-auto`}>
            {save.isPending && <Loader2 size={12} className="animate-spin" />} Guardar
          </button>
        </form>
      )}
    </div>
  );
}
