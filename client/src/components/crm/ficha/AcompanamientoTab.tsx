/**
 * Ficha · Acompañamiento emocional (opcional, oculto si no se usa). Anotaciones fechadas que separan:
 * «Relato del cliente», «Observaciones de la profesional» y «Objetivos o cuestiones para seguimiento».
 * Sin diagnósticos: se registra lo que el cliente relata y lo que la profesional observa, como tal.
 * Bloqueado en el servidor hasta habilitar el módulo; requiere consentimiento explícito propio.
 */
import { useState } from "react";
import { HeartHandshake, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { LIMITS } from "@shared/clientCare";
import { btnGhost, btnPrimary, card, confirmDiscard, dateInputToMs, dateInputValue, EmptyState, Field, formatDay, input } from "./ui";
import { ConsentPanel, ModuloBloqueado, useModule } from "./Protegido";

const GROUPS = [
  {
    key: "clientAccount",
    title: "Relato del cliente",
    hint: "Lo que el cliente cuenta, con sus palabras. No lo conviertas en hechos ni en diagnósticos.",
    fields: [
      ["reason", "Motivo del acompañamiento"],
      ["situations", "Situaciones que desea explorar"],
      ["emotions", "Emociones y preocupaciones expresadas"],
      ["familyHistory", "Historia familiar o aspectos transgeneracionales relatados"],
    ],
  },
  {
    key: "professionalObservations",
    title: "Observaciones de la profesional",
    hint: "Tu observación subjetiva y el trabajo realizado. Sin diagnósticos médicos ni psicológicos.",
    fields: [
      ["workDone", "Trabajo realizado"],
      ["observations", "Observaciones"],
    ],
  },
  {
    key: "followUp",
    title: "Objetivos o cuestiones para seguimiento",
    fields: [
      ["goals", "Objetivos"],
      ["pending", "Cuestiones pendientes"],
    ],
  },
] as const;

type Entry = Record<string, Record<string, string>>;
const emptyEntry = (): Entry => Object.fromEntries(GROUPS.map((g) => [g.key, Object.fromEntries(g.fields.map(([f]) => [f, ""]))]));

export default function AcompanamientoTab({ clientId }: { clientId: number }) {
  const { status, isLoading } = useModule("emotional");
  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="animate-spin" size={18} /></div>;
  if (!status?.enabled) return <ModuloBloqueado title="Acompañamiento emocional" missing={status?.missing ?? []} />;
  return <Anotaciones clientId={clientId} />;
}

function Anotaciones({ clientId }: { clientId: number }) {
  const utils = trpc.useUtils();
  const { data: rows, isLoading } = trpc.care.emotional.list.useQuery({ clientId });
  const [hasConsent, setHasConsent] = useState(false);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(dateInputValue(Date.now()));
  const [entry, setEntry] = useState<Entry>(emptyEntry());
  const dirty = JSON.stringify(entry) !== JSON.stringify(emptyEntry());

  const save = trpc.care.emotional.save.useMutation({
    onSuccess: () => {
      utils.care.emotional.list.invalidate({ clientId });
      setOpen(false);
      setEntry(emptyEntry());
      toast.success("Anotación guardada");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <ConsentPanel clientId={clientId} module="emotional" onActiveChange={setHasConsent} />
      {!open && (
        <button className={`${btnPrimary} w-full sm:w-auto`} disabled={!hasConsent} onClick={() => setOpen(true)}>
          <Plus size={14} /> Nueva anotación
        </button>
      )}
      {open && (
        <form
          className={`${card} space-y-5`}
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate({ clientId, recordDate: dateInputToMs(date), data: entry });
          }}
        >
          <Field id="em-date" title="Fecha">
            <input id="em-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={input} />
          </Field>
          {GROUPS.map((g) => (
            <fieldset key={g.key} className="space-y-3 border-l-2 border-[oklch(0.52_0.08_148)]/30 pl-3">
              <legend className="text-xs font-body text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 600 }}>{g.title}</legend>
              {"hint" in g && <p className="text-[0.7rem] font-body text-[oklch(0.52_0.02_60)]">{g.hint}</p>}
              {g.fields.map(([f, t]) => (
                <Field key={f} id={`em-${g.key}-${f}`} title={t}>
                  <textarea
                    id={`em-${g.key}-${f}`}
                    rows={2}
                    maxLength={LIMITS.longText}
                    value={entry[g.key][f]}
                    onChange={(e) => setEntry((x) => ({ ...x, [g.key]: { ...x[g.key], [f]: e.target.value } }))}
                    className={`${input} resize-y`}
                  />
                </Field>
              ))}
            </fieldset>
          ))}
          <div className="flex gap-2">
            <button type="submit" disabled={save.isPending || !hasConsent} className={`${btnPrimary} flex-1`}>Guardar anotación</button>
            <button type="button" className={btnGhost} onClick={() => confirmDiscard(dirty) && (setOpen(false), setEntry(emptyEntry()))}>Cancelar</button>
          </div>
        </form>
      )}
      {isLoading ? (
        <div className="flex justify-center py-6"><Loader2 className="animate-spin" size={16} /></div>
      ) : !rows?.length ? (
        !open && <EmptyState icon={<HeartHandshake size={28} />} title="Sin anotaciones" text="Cada anotación queda fechada y separa el relato del cliente de tus observaciones." />
      ) : (
        <ol className="space-y-3">
          {rows.map((r) => {
            const d = r.data as Entry;
            return (
              <li key={r.id} className={card}>
                <p className="text-[0.7rem] text-[oklch(0.52_0.08_148)] font-body uppercase tracking-wider mb-2">{formatDay(r.recordDate)}</p>
                {GROUPS.map((g) => {
                  const filled = g.fields.filter(([f]) => d?.[g.key]?.[f]);
                  if (!filled.length) return null;
                  return (
                    <div key={g.key} className="mt-2">
                      <p className="text-[0.65rem] font-body uppercase tracking-wider text-[oklch(0.38_0.02_55)]" style={{ fontWeight: 600 }}>{g.title}</p>
                      {filled.map(([f, t]) => (
                        <p key={f} className="text-sm font-body text-[oklch(0.28_0.025_55)] mt-1 whitespace-pre-line" style={{ fontWeight: 300 }}>
                          <span className="text-[oklch(0.52_0.02_60)]">{t}: </span>{d[g.key][f]}
                        </p>
                      ))}
                    </div>
                  );
                })}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
