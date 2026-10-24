/**
 * Piezas comunes de las secciones protegidas (datos de salud o emocionales):
 * aviso de módulo bloqueado y gestión del consentimiento explícito por módulo.
 * El bloqueo real está en el servidor; esto solo explica el estado.
 */
import { useEffect, useState } from "react";
import { Lock, Loader2, ShieldAlert, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { btnGhost, btnPrimary, card, formatDay, input } from "./ui";

export type ModuleKey = "first_visit" | "emotional";

const REQUIREMENT_LABEL: Record<string, string> = {
  SENSITIVE_FIRST_VISIT_ENABLED: "Activación explícita del módulo «Primera visita»",
  SENSITIVE_EMOTIONAL_ENABLED: "Activación explícita del módulo «Acompañamiento emocional»",
  SENSITIVE_DATA_KEY: "Clave de cifrado configurada en el servidor",
  SENSITIVE_KEY_VERSION: "Versión de la clave de cifrado",
  PRIVACY_REVIEW_REF: "Revisión de privacidad / evaluación de riesgos completada",
  PRIVACY_LEGAL_BASIS: "Base jurídica decidida (consentimiento explícito)",
  PRIVACY_NOTICE_VERSION: "Texto informativo y de consentimiento revisado por Cristina",
};

export function useModule(module: ModuleKey) {
  const { data, isLoading } = trpc.care.modules.useQuery();
  return { status: data?.find((m) => m.module === module), isLoading };
}

export function ModuloBloqueado({ title, missing }: { title: string; missing: string[] }) {
  return (
    <div className={`${card} border-dashed`}>
      <div className="flex items-start gap-3">
        <Lock size={18} className="text-[oklch(0.52_0.02_60)] mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-body text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 500 }}>{title}: sección protegida y desactivada</p>
          <p className="text-xs font-body text-[oklch(0.52_0.02_60)] mt-1 leading-relaxed">
            Puede contener datos de salud o emocionales. Hasta completar la revisión de privacidad, el servidor no permite ni leer
            ni guardar nada aquí. Mientras tanto, no anotes estos datos en otras secciones de la ficha.
          </p>
          {missing.length > 0 && (
            <>
              <p className="text-[0.65rem] uppercase tracking-wider font-body text-[oklch(0.52_0.02_60)] mt-3" style={{ fontWeight: 500 }}>Pendiente para habilitarla</p>
              <ul className="mt-1 space-y-0.5">
                {missing.map((m) => (
                  <li key={m} className="text-xs font-body text-[oklch(0.38_0.02_55)]">· {REQUIREMENT_LABEL[m] ?? m}</li>
                ))}
              </ul>
            </>
          )}
          <p className="text-[0.7rem] font-body text-[oklch(0.52_0.02_60)] mt-3">Procedimiento: docs/PRIVACIDAD_FICHAS.md</p>
        </div>
      </div>
    </div>
  );
}

/** Consentimiento explícito del cliente para UN módulo: registrar, ver estado, retirar y suprimir datos. */
export function ConsentPanel({ clientId, module, onActiveChange }: { clientId: number; module: ModuleKey; onActiveChange?: (active: boolean) => void }) {
  const utils = trpc.useUtils();
  const { data: consents, isLoading } = trpc.care.consents.list.useQuery({ clientId, module });
  const [method, setMethod] = useState<"papel_firmado" | "formulario_electronico">("papel_firmado");
  const active = consents?.find((c) => !c.withdrawnAt);
  const pendingReview = consents?.some((c) => c.withdrawnAt && c.reviewRequired) && !active;
  useEffect(() => {
    onActiveChange?.(!!active);
  }, [active?.id, onActiveChange]);

  const refresh = () => utils.care.consents.list.invalidate({ clientId, module });
  const grant = trpc.care.consents.grant.useMutation({ onSuccess: () => { refresh(); toast.success("Consentimiento registrado"); }, onError: (e) => toast.error(e.message) });
  const withdraw = trpc.care.consents.withdraw.useMutation({ onSuccess: () => { refresh(); toast.success("Consentimiento retirado: ya no se pueden añadir datos"); }, onError: (e) => toast.error(e.message) });
  const eraseModule = trpc.care.rights.eraseModule.useMutation({
    onSuccess: () => { utils.care.firstVisit.list.invalidate(); utils.care.emotional.list.invalidate(); toast.success("Datos de esta sección eliminados"); },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <div className="flex justify-center py-4"><Loader2 className="animate-spin" size={16} /></div>;

  return (
    <div className={card}>
      {active ? (
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-body text-green-800 flex items-start gap-2">
            <ShieldCheck size={15} className="flex-shrink-0" />
            Consentimiento explícito vigente desde el {formatDay(active.grantedAt)} · texto {active.textVersion} · {active.method === "papel_firmado" ? "papel firmado" : "formulario electrónico"}
          </p>
          <button
            className="text-xs text-red-700 font-body hover:underline flex-shrink-0"
            onClick={() => window.confirm("¿Registrar la retirada del consentimiento? No se podrán añadir datos nuevos en esta sección.") && withdraw.mutate({ clientId, consentId: active.id, module })}
          >
            Retirar
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-body text-[oklch(0.38_0.02_55)] flex items-start gap-2">
            <ShieldAlert size={15} className="flex-shrink-0 text-amber-700" />
            Sin consentimiento explícito vigente: no se pueden guardar datos. Regístralo solo si el cliente lo ha dado expresamente con el texto informativo vigente.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <select value={method} onChange={(e) => setMethod(e.target.value as typeof method)} className={`${input} sm:w-56`}>
              <option value="papel_firmado">Firmado en papel</option>
              <option value="formulario_electronico">Formulario electrónico</option>
            </select>
            <button className={btnPrimary} disabled={grant.isPending} onClick={() => grant.mutate({ clientId, module, method })}>Registrar consentimiento</button>
          </div>
        </div>
      )}
      {pendingReview && (
        <div className="mt-3 pt-3 border-t border-[oklch(0.92_0.01_80)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="text-xs font-body text-amber-800">Consentimiento retirado: revisa y suprime los datos de esta sección si no hay otra base que obligue a conservarlos.</p>
          <button
            className={`${btnGhost} text-red-700`}
            onClick={() => window.confirm("¿Eliminar definitivamente los datos de esta sección para este cliente?") && eraseModule.mutate({ clientId, module })}
          >
            <Trash2 size={12} /> Suprimir datos
          </button>
        </div>
      )}
    </div>
  );
}
