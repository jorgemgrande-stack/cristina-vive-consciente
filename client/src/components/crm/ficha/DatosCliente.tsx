/**
 * Ficha · Datos del cliente: exportar todo (acceso / portabilidad) y suprimir la ficha (sesiones, notas,
 * Primera visita, Acompañamiento y consentimientos). Citas y facturas no se tocan.
 */
import { useState } from "react";
import { ChevronDown, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { btnGhost, card, downloadJson, input } from "./ui";

export default function DatosCliente({ clientId, fullName }: { clientId: number; fullName: string }) {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [erasing, setErasing] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const { data: counts } = trpc.care.rights.erasePreview.useQuery({ clientId }, { enabled: erasing });

  const exportAll = trpc.care.rights.export.useMutation({
    onSuccess: (data) => downloadJson(`cliente-${clientId}.json`, data),
    onError: (e) => toast.error(e.message),
  });
  const erase = trpc.care.rights.erase.useMutation({
    onSuccess: () => {
      utils.invalidate();
      setErasing(false);
      setConfirmName("");
      toast.success("Ficha suprimida");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className={card}>
      <button className="flex w-full items-center justify-between min-h-[32px] text-left" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="text-[0.65rem] text-[oklch(0.52_0.02_60)] font-body uppercase tracking-widest" style={{ fontWeight: 500 }}>Datos del cliente</span>
        <ChevronDown size={14} className={`text-[oklch(0.52_0.02_60)] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          <p className="text-xs font-body text-[oklch(0.45_0.02_60)]">Para atender una petición del cliente: copia de todos sus datos o supresión de la ficha.</p>
          <div className="flex flex-wrap gap-2">
            <button className={btnGhost} disabled={exportAll.isPending} onClick={() => exportAll.mutate({ clientId })}>
              <Download size={12} /> Exportar todo
            </button>
            {!erasing && (
              <button className={`${btnGhost} text-red-700`} onClick={() => setErasing(true)}>
                <Trash2 size={12} /> Suprimir ficha…
              </button>
            )}
          </div>
          {erasing && (
            <div className="space-y-2 pt-3 border-t border-[oklch(0.92_0.01_80)]">
              <p className="text-xs font-body text-[oklch(0.28_0.025_55)]">
                Se borran {counts ? `${counts.sessions} sesiones, ${counts.notes} notas, ${counts.sensitive.first_visit + counts.sensitive.emotional} registros de Primera visita y Acompañamiento` : "sesiones, notas, Primera visita y Acompañamiento"}, los consentimientos y los campos de la ficha. Las citas y facturas se conservan.
              </p>
              <label htmlFor="erase-confirm" className="block text-xs font-body text-[oklch(0.45_0.02_60)]">Escribe «{fullName}» para confirmar</label>
              <input id="erase-confirm" value={confirmName} onChange={(e) => setConfirmName(e.target.value)} className={input} autoComplete="off" />
              <div className="flex gap-2">
                <button
                  className={`${btnGhost} text-red-700`}
                  disabled={erase.isPending || confirmName.trim().toLowerCase() !== fullName.trim().toLowerCase()}
                  onClick={() => erase.mutate({ clientId, confirmName })}
                >
                  Suprimir definitivamente
                </button>
                <button className={btnGhost} onClick={() => { setErasing(false); setConfirmName(""); }}>Cancelar</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
