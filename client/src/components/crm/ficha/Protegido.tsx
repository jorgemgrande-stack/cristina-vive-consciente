/**
 * Piezas comunes de Primera visita y Acompañamiento emocional: explicación breve, consentimiento explícito
 * por módulo (registrar, retirar), revisión periódica, exportación y supresión de los datos del módulo.
 * Las reglas se aplican en el servidor; aquí solo se presentan.
 */
import { useEffect, useState } from "react";
import { Download, Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { CONSENT_TEXTS, RETENTION_REVIEW_MONTHS, retentionReview } from "@shared/clientCare";
import { btnGhost, btnPrimary, card, downloadJson, formatDay, input } from "./ui";

export type ModuleKey = "first_visit" | "emotional";

const INTRO: Record<ModuleKey, string> = {
  first_visit:
    "Para preparar las sesiones: lo que el cliente quiera contar sobre su salud y bienestar que sea útil para la sesión. Todo es opcional y se guarda cifrado. Sin diagnósticos.",
  emotional:
    "Para dar continuidad al acompañamiento: lo que el cliente relata, tus observaciones y el seguimiento, por separado. Todo es opcional y se guarda cifrado. Sin diagnósticos.",
};

export function useModule(module: ModuleKey) {
  const { data, isLoading } = trpc.care.modules.useQuery();
  return { status: data?.find((m) => m.module === module), isLoading };
}

/** Sin clave de cifrado el servidor no puede guardar ni leer estos datos. */
export function ModuloSinClave({ title }: { title: string }) {
  return (
    <div className={`${card} border-dashed`}>
      <p className="text-sm font-body text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 500 }}>{title}: falta la clave de cifrado</p>
      <p className="text-xs font-body text-[oklch(0.52_0.02_60)] mt-1 leading-relaxed">
        El servidor necesita la variable SENSITIVE_DATA_KEY para guardar estos datos cifrados. El resto de la ficha funciona con normalidad.
      </p>
    </div>
  );
}

export function IntroModulo({ module }: { module: ModuleKey }) {
  return <p className="text-xs font-body text-[oklch(0.45_0.02_60)] leading-relaxed">{INTRO[module]}</p>;
}

/**
 * Consentimiento explícito del cliente para UN módulo. Informa de `active` al padre: sin consentimiento
 * vigente no se muestra el formulario (y el servidor tampoco guardaría).
 */
export function ConsentPanel({
  clientId,
  module,
  recordCount,
  onActiveChange,
}: {
  clientId: number;
  module: ModuleKey;
  recordCount: number;
  onActiveChange?: (active: boolean) => void;
}) {
  const utils = trpc.useUtils();
  const { data: consents, isLoading } = trpc.care.consents.list.useQuery({ clientId, module });
  const [asking, setAsking] = useState(false);
  const [informed, setInformed] = useState(false);
  const [method, setMethod] = useState<"papel_firmado" | "formulario_electronico">("papel_firmado");
  const [withdrawing, setWithdrawing] = useState(false);
  const [keep, setKeep] = useState(false);
  const active = consents?.find((c) => !c.withdrawnAt);
  const review = retentionReview(active ?? consents?.[0], recordCount > 0);
  const t = CONSENT_TEXTS[module];

  useEffect(() => {
    onActiveChange?.(!!active);
  }, [active?.id, onActiveChange]);

  const refresh = () => {
    utils.care.consents.list.invalidate({ clientId, module });
    utils.care.consents.reviewsDue.invalidate();
    (module === "first_visit" ? utils.care.firstVisit.list : utils.care.emotional.list).invalidate({ clientId });
  };
  const grant = trpc.care.consents.grant.useMutation({
    onSuccess: () => { refresh(); setAsking(false); setInformed(false); toast.success("Consentimiento registrado"); },
    onError: (e) => toast.error(e.message),
  });
  const withdraw = trpc.care.consents.withdraw.useMutation({
    onSuccess: (r) => { refresh(); setWithdrawing(false); setKeep(false); toast.success(r.erased ? "Consentimiento retirado y datos suprimidos" : "Consentimiento retirado; datos conservados para revisión"); },
    onError: (e) => toast.error(e.message),
  });
  const markReviewed = trpc.care.consents.markReviewed.useMutation({
    onSuccess: () => { refresh(); toast.success("Revisión anotada"); },
    onError: (e) => toast.error(e.message),
  });
  const eraseModule = trpc.care.rights.eraseModule.useMutation({
    onSuccess: () => { refresh(); toast.success("Datos de esta sección suprimidos"); },
    onError: (e) => toast.error(e.message),
  });
  const eraseNow = () =>
    window.confirm(`¿Suprimir definitivamente los datos de «${t.title}» de este cliente?`) && eraseModule.mutate({ clientId, module });

  if (isLoading) return <div className="flex justify-center py-4"><Loader2 className="animate-spin" size={16} /></div>;

  return (
    <div className={`${card} space-y-3`}>
      {active ? (
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-body text-green-800 flex items-start gap-2">
            <ShieldCheck size={15} className="flex-shrink-0" />
            Consentimiento vigente desde el {formatDay(active.grantedAt)} · texto {active.textVersion} · {active.method === "papel_firmado" ? "papel firmado" : "formulario electrónico"}
          </p>
          {!withdrawing && (
            <button className="text-xs text-red-700 font-body hover:underline flex-shrink-0 min-h-[32px]" onClick={() => setWithdrawing(true)}>
              Retirar
            </button>
          )}
        </div>
      ) : !asking ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="text-xs font-body text-[oklch(0.38_0.02_55)]">Para anotar en esta sección hace falta el consentimiento expreso del cliente, solo para ella.</p>
          <button className={`${btnPrimary} flex-shrink-0`} onClick={() => setAsking(true)}>Pedir consentimiento</button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-[0.65rem] font-body uppercase tracking-wider text-[oklch(0.38_0.02_55)]" style={{ fontWeight: 600 }}>
            Texto para el cliente · {t.title} · {t.version}
          </p>
          <p className="text-xs font-body text-[oklch(0.28_0.025_55)] leading-relaxed bg-[oklch(0.97_0.006_85)] p-3">{t.text}</p>
          <label className="flex items-start gap-2 text-xs font-body text-[oklch(0.28_0.025_55)] cursor-pointer">
            <input type="checkbox" className="mt-0.5 w-4 h-4 flex-shrink-0" checked={informed} onChange={(e) => setInformed(e.target.checked)} />
            El cliente ha recibido este texto y consiente expresamente que se anoten datos en «{t.title}».
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <select value={method} onChange={(e) => setMethod(e.target.value as typeof method)} className={`${input} sm:w-56`} aria-label="Forma del consentimiento">
              <option value="papel_firmado">Firmado en papel</option>
              <option value="formulario_electronico">Formulario electrónico</option>
            </select>
            <button className={btnPrimary} disabled={!informed || grant.isPending} onClick={() => informed && grant.mutate({ clientId, module, method, informed: true })}>
              Registrar consentimiento
            </button>
            <button className={btnGhost} onClick={() => { setAsking(false); setInformed(false); }}>Cancelar</button>
          </div>
        </div>
      )}

      {active && withdrawing && (
        <div className="pt-3 border-t border-[oklch(0.92_0.01_80)] space-y-2">
          <p className="text-xs font-body text-[oklch(0.28_0.025_55)]">
            Al retirar el consentimiento se suprimen los datos de esta sección{recordCount ? ` (${recordCount} ${recordCount === 1 ? "registro" : "registros"})` : ""}.
          </p>
          <label className="flex items-start gap-2 text-xs font-body text-[oklch(0.45_0.02_60)] cursor-pointer">
            <input type="checkbox" className="mt-0.5 w-4 h-4 flex-shrink-0" checked={keep} onChange={(e) => setKeep(e.target.checked)} />
            Conservarlos solo porque una obligación legal lo exige (quedarán pendientes de revisión).
          </label>
          <div className="flex gap-2">
            <button className={`${btnPrimary} bg-red-700 hover:bg-red-800`} disabled={withdraw.isPending} onClick={() => withdraw.mutate({ clientId, module, consentId: active.id, keepForLegalObligation: keep })}>
              {keep ? "Retirar" : "Retirar y suprimir"}
            </button>
            <button className={btnGhost} onClick={() => { setWithdrawing(false); setKeep(false); }}>Cancelar</button>
          </div>
        </div>
      )}

      {review === "periodic" && (
        <div className="pt-3 border-t border-[oklch(0.92_0.01_80)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="text-xs font-body text-amber-800">Revisión periódica ({RETENTION_REVIEW_MONTHS} meses): ¿siguen siendo necesarios estos datos?</p>
          <div className="flex gap-2 flex-shrink-0">
            <button className={btnGhost} disabled={markReviewed.isPending} onClick={() => markReviewed.mutate({ clientId, module })}>Sí, se necesitan</button>
            <button className={`${btnGhost} text-red-700`} onClick={eraseNow}><Trash2 size={12} /> Suprimir</button>
          </div>
        </div>
      )}
      {review === "withdrawn" && (
        <div className="pt-3 border-t border-[oklch(0.92_0.01_80)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="text-xs font-body text-amber-800">Consentimiento retirado y datos conservados por obligación legal: suprímelos cuando deje de aplicar.</p>
          <button className={`${btnGhost} text-red-700 flex-shrink-0`} onClick={eraseNow}><Trash2 size={12} /> Suprimir datos</button>
        </div>
      )}
    </div>
  );
}

/** Exportar o suprimir los datos de un módulo para este cliente (a petición o cuando dejan de ser necesarios). */
export function ModuleDataTools({ clientId, module, recordCount }: { clientId: number; module: ModuleKey; recordCount: number }) {
  const utils = trpc.useUtils();
  const t = CONSENT_TEXTS[module];
  const exportModule = trpc.care.rights.exportModule.useMutation({
    onSuccess: (data) => downloadJson(`cliente-${clientId}-${module}.json`, data),
    onError: (e) => toast.error(e.message),
  });
  const eraseModule = trpc.care.rights.eraseModule.useMutation({
    onSuccess: () => {
      (module === "first_visit" ? utils.care.firstVisit.list : utils.care.emotional.list).invalidate({ clientId });
      utils.care.consents.reviewsDue.invalidate();
      toast.success("Datos de esta sección suprimidos");
    },
    onError: (e) => toast.error(e.message),
  });
  if (!recordCount) return null;
  return (
    <div className="flex flex-wrap gap-2 pt-1">
      <button className={btnGhost} disabled={exportModule.isPending} onClick={() => exportModule.mutate({ clientId, module })}>
        <Download size={12} /> Exportar esta sección
      </button>
      <button
        className={`${btnGhost} text-red-700`}
        disabled={eraseModule.isPending}
        onClick={() => window.confirm(`¿Suprimir definitivamente los datos de «${t.title}» de este cliente? El historial de consentimiento se conserva.`) && eraseModule.mutate({ clientId, module })}
      >
        <Trash2 size={12} /> Suprimir esta sección
      </button>
    </div>
  );
}
