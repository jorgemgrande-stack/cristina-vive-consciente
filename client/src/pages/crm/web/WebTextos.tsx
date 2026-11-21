/**
 * Editar web — textos de los procesos de reserva y compra y otros avisos. Solo cambian las palabras: las reglas,
 * precios, cobros y registros de citas, carrito y pedidos se mantienen tal cual.
 */
import { Loader2, RotateCcw } from "lucide-react";
import type { GlobalContent } from "@shared/siteEditor";
import CRMLayout from "@/components/CRMLayout";
import { trpc } from "@/lib/trpc";
import { PublishControls, SaveBadge, inputCls, useDocEditor } from "./shared";

export default function WebTextos() {
  const editor = useDocEditor<GlobalContent>("global");
  const { data: defs = [] } = trpc.site.labelDefs.useQuery();
  const labels = editor.content?.global.labels;
  if (!labels || defs.length === 0) return <CRMLayout title="Textos"><div className="p-10"><Loader2 className="animate-spin" /></div></CRMLayout>;
  const setLabel = (key: string, value: string) =>
    editor.update((c) => { const next = { ...c.global.labels }; if (value) next[key] = value; else delete next[key]; return { ...c, global: { ...c.global, labels: next } }; });
  const groups = Array.from(new Set(defs.map((d) => d.group)));
  return (
    <CRMLayout title="Textos">
      <div className="max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 sticky top-0 bg-[oklch(0.97_0.006_85)] py-2 z-20">
          <div><h1 className="font-display text-2xl" style={{ fontWeight: 400 }}>Textos de reserva y compra</h1><SaveBadge state={editor.state} /></div>
          <div className="flex gap-2"><PublishControls docKey="global" editor={editor} /></div>
        </div>
        <p className="text-sm font-body text-[oklch(0.45_0.02_55)] mb-5" style={{ fontWeight: 300 }}>Aquí cambias las palabras que ven las personas al reservar una cita, preparar «Mi consulta», hacer un pedido o descargar una guía. Si dejas un campo vacío se usa el texto de siempre. Los precios, cobros, pedidos y avisos siguen funcionando igual.</p>
        {groups.map((g) => (
          <section key={g} className="bg-white border border-[oklch(0.9_0.012_75)] p-5 mb-5">
            <h2 className="font-display text-lg mb-3" style={{ fontWeight: 400 }}>{g}</h2>
            <div className="space-y-4">
              {defs.filter((d) => d.group === g).map((d) => (
                <div key={d.key}>
                  <label htmlFor={`l-${d.key}`} className="block text-xs font-body text-[oklch(0.4_0.02_55)] mb-1">{d.where}</label>
                  <div className="flex gap-2">
                    {d.long ? <textarea id={`l-${d.key}`} rows={2} className={inputCls} value={labels[d.key] ?? ""} placeholder={d.text} onChange={(e) => setLabel(d.key, e.target.value)} /> : <input id={`l-${d.key}`} className={inputCls} value={labels[d.key] ?? ""} placeholder={d.text} onChange={(e) => setLabel(d.key, e.target.value)} />}
                    {labels[d.key] && <button type="button" title="Volver al texto de siempre" aria-label="Volver al texto de siempre" className="px-2 border border-[oklch(0.88_0.015_75)]" onClick={() => setLabel(d.key, "")}><RotateCcw size={13} /></button>}
                  </div>
                  <p className="text-[0.7rem] text-[oklch(0.55_0.02_60)] mt-1 font-body">Texto de siempre: «{d.text}»</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </CRMLayout>
  );
}
