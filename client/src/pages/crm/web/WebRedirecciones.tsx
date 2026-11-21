/**
 * Editar web — redirecciones 301 editables. Se suman a las heredadas de Shopify (redirects.json), que no se tocan.
 */
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import CRMLayout from "@/components/CRMLayout";
import { trpc } from "@/lib/trpc";
import { dateTime, inputCls, labelCls } from "./shared";

export default function WebRedirecciones() {
  const { data = [], isLoading } = trpc.site.redirects.useQuery();
  const utils = trpc.useUtils();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const add = trpc.site.addRedirect.useMutation({ onSuccess: () => { setFrom(""); setTo(""); void utils.site.redirects.invalidate(); toast.success("Redirección creada"); }, onError: (e) => toast.error(e.message) });
  const del = trpc.site.removeRedirect.useMutation({ onSuccess: () => utils.site.redirects.invalidate(), onError: (e) => toast.error(e.message) });
  return (
    <CRMLayout title="Redirecciones">
      <div className="max-w-3xl">
        <h1 className="font-display text-2xl mb-1" style={{ fontWeight: 400 }}>Redirecciones</h1>
        <p className="text-sm font-body text-[oklch(0.45_0.02_55)] mb-5" style={{ fontWeight: 300 }}>Si una página cambia de dirección, las personas y buscadores que usen la antigua llegarán a la nueva (redirección permanente 301). Al cambiar la dirección de una página nueva se crea sola.</p>
        <form className="bg-white border border-[oklch(0.9_0.012_75)] p-5 mb-5 grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end" onSubmit={(e) => { e.preventDefault(); add.mutate({ from, to }); }}>
          <div><label className={labelCls} htmlFor="rd-from">Dirección antigua</label><input id="rd-from" className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)} placeholder="/pagina-antigua" required /></div>
          <div><label className={labelCls} htmlFor="rd-to">Lleva a</label><input id="rd-to" className={inputCls} value={to} onChange={(e) => setTo(e.target.value)} placeholder="/pagina-nueva" required /></div>
          <button type="submit" disabled={add.isPending} className="px-4 py-2.5 text-xs bg-[oklch(0.52_0.08_148)] text-white disabled:opacity-60">Añadir</button>
        </form>
        {isLoading ? <Loader2 className="animate-spin" /> : data.length === 0 ? <p className="text-sm font-body text-[oklch(0.5_0.02_60)]">Todavía no hay redirecciones editables.</p> : (
          <table className="w-full bg-white border border-[oklch(0.9_0.012_75)] text-sm font-body">
            <thead><tr className="text-left text-xs text-[oklch(0.5_0.02_60)]"><th className="p-3">Antigua</th><th className="p-3">Nueva</th><th className="p-3">Creada</th><th /></tr></thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.id} className="border-t border-[oklch(0.92_0.01_75)]">
                  <td className="p-3 break-all">{r.fromPath}</td>
                  <td className="p-3 break-all">{r.toPath}{r.auto ? <span className="ml-2 text-[0.65rem] px-1.5 py-0.5 bg-[oklch(0.94_0.03_148)]">automática</span> : null}</td>
                  <td className="p-3 whitespace-nowrap">{dateTime(r.createdAt)}</td>
                  <td className="p-3 text-right"><button aria-label="Eliminar" className="p-1.5 text-red-700" onClick={() => { if (window.confirm("¿Eliminar esta redirección?")) del.mutate({ id: r.id }); }}><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </CRMLayout>
  );
}
