/**
 * Ficha · Primera visita (salud y bienestar que el cliente quiera compartir para preparar las sesiones).
 * Separada de los datos generales y de las sesiones; todos los campos opcionales y breves; cifrada en el
 * servidor y solo con consentimiento explícito vigente para este módulo.
 */
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { LIMITS } from "@shared/clientCare";
import { btnPrimary, card, Field, formatDay, input } from "./ui";
import { ConsentPanel, IntroModulo, ModuleDataTools, ModuloSinClave, useModule } from "./Protegido";

const FIELDS = [
  ["visitReason", "Motivo de la visita", "Con sus palabras."],
  ["allergies", "Alergias o sensibilidades a productos", "Aceites, cremas, aromas…"],
  ["healthForSafety", "Circunstancias a tener en cuenta en la sesión", "Solo lo que el cliente cuente y afecte a la sesión. Sin diagnósticos."],
  ["areasToAvoid", "Zonas que evitar o tratar con cuidado", undefined],
  ["wellbeing", "Cómo se encuentra", "Lo que quiera compartir sobre su bienestar."],
  ["otherObservations", "Otras observaciones", undefined],
] as const;
type Key = (typeof FIELDS)[number][0];
const emptyForm = () => Object.fromEntries(FIELDS.map(([k]) => [k, ""])) as Record<Key, string>;

export default function PrimeraVisitaTab({ clientId }: { clientId: number }) {
  const { status, isLoading } = useModule("first_visit");
  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="animate-spin" size={18} /></div>;
  if (!status?.enabled) return <ModuloSinClave title="Primera visita" />;
  return <PrimeraVisitaForm clientId={clientId} />;
}

function PrimeraVisitaForm({ clientId }: { clientId: number }) {
  const utils = trpc.useUtils();
  const { data: rows, isLoading } = trpc.care.firstVisit.list.useQuery({ clientId });
  const [hasConsent, setHasConsent] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const current = rows?.[0];

  useEffect(() => {
    setForm(current ? { ...emptyForm(), ...(current.data as Record<Key, string>) } : emptyForm());
  }, [current?.id, current?.updatedAt]);

  const save = trpc.care.firstVisit.save.useMutation({
    onSuccess: () => { utils.care.firstVisit.list.invalidate({ clientId }); toast.success("Primera visita guardada"); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <IntroModulo module="first_visit" />
      <ConsentPanel clientId={clientId} module="first_visit" recordCount={rows?.length ?? 0} onActiveChange={setHasConsent} />
      {isLoading ? (
        <div className="flex justify-center py-6"><Loader2 className="animate-spin" size={16} /></div>
      ) : hasConsent ? (
        <form
          className={`${card} space-y-4`}
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate({ clientId, id: current?.id, recordDate: current?.recordDate ?? Date.now(), data: form });
          }}
        >
          {current && <p className="text-xs font-body text-[oklch(0.52_0.02_60)]">Última actualización: {formatDay(new Date(current.updatedAt).getTime())}.</p>}
          {FIELDS.map(([k, t, hint]) => (
            <Field key={k} id={`fv-${k}`} title={t} hint={hint}>
              <textarea id={`fv-${k}`} rows={2} maxLength={LIMITS.sensitiveText} value={form[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} className={`${input} resize-y`} />
            </Field>
          ))}
          <button type="submit" disabled={save.isPending} className={`${btnPrimary} w-full sm:w-auto`}>
            {save.isPending && <Loader2 size={12} className="animate-spin" />} Guardar
          </button>
        </form>
      ) : null}
      <ModuleDataTools clientId={clientId} module="first_visit" recordCount={rows?.length ?? 0} />
    </div>
  );
}
