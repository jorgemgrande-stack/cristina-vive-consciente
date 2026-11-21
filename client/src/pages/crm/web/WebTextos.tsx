/**
 * Editar web — textos de los procesos de reserva y compra y de los textos internos de las páginas (Masajes, Sistemas de
 * agua, Aceites, Contacto). Solo cambian las palabras: las reglas, precios, cobros y registros de citas, carrito y pedidos
 * se mantienen tal cual.
 */
import { useMemo, useState } from "react";
import { Loader2, RotateCcw, Search } from "lucide-react";
import type { GlobalContent } from "@shared/siteEditor";
import CRMLayout from "@/components/CRMLayout";
import { trpc } from "@/lib/trpc";
import { PublishControls, SaveBadge, inputCls, useDocEditor } from "./shared";

export default function WebTextos() {
  const editor = useDocEditor<GlobalContent>("global");
  const { data: defs = [] } = trpc.site.labelDefs.useQuery();
  const [q, setQ] = useState("");
  const labels = editor.content?.global.labels;
  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    return n ? defs.filter((d) => `${d.where} ${d.text} ${d.group} ${labels?.[d.key] ?? ""}`.toLowerCase().includes(n)) : defs;
  }, [defs, q, labels]);
  if (!labels || defs.length === 0) return <CRMLayout title="Textos"><div className="p-10"><Loader2 className="animate-spin" /></div></CRMLayout>;
  const setLabel = (key: string, value: string) =>
    editor.update((c) => { const next = { ...c.global.labels }; if (value) next[key] = value; else delete next[key]; return { ...c, global: { ...c.global, labels: next } }; });
  const groups = Array.from(new Set(shown.map((d) => d.group)));
  const edited = Object.keys(labels).length;
  return (
    <CRMLayout title="Textos">
      <div className="max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 sticky top-0 bg-[oklch(0.97_0.006_85)] py-2 z-20">
          <div><h1 className="font-display text-2xl" style={{ fontWeight: 400 }}>Textos de la web</h1><SaveBadge state={editor.state} /></div>
          <div className="flex gap-2"><PublishControls docKey="global" editor={editor} /></div>
        </div>
        <p className="text-sm font-body text-[oklch(0.45_0.02_55)] mb-4" style={{ fontWeight: 300 }}>
          Aquí cambias las palabras fijas que ven las personas: reserva de citas, «Mi consulta», pedidos y guías, y los textos internos de Masajes, Sistemas de agua, Aceites esenciales y Contacto (formularios, avisos y mensajes). Si dejas un campo vacío se usa el texto de siempre. Los precios, cobros, pedidos y avisos siguen funcionando igual. {edited > 0 && <b>{edited} texto(s) personalizado(s).</b>}
        </p>
        <div className="relative mb-5"><Search size={14} className="absolute left-3 top-3 text-[oklch(0.55_0.02_60)]" /><input className={`${inputCls} pl-9`} placeholder="Buscar un texto (por ejemplo: «cookies», «Cómo funciona», «presupuesto»)…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar un texto" /></div>
        {shown.length === 0 && <p className="text-sm font-body text-[oklch(0.5_0.02_60)]">Ningún texto coincide con la búsqueda.</p>}
        {groups.map((g) => {
          const rows = shown.filter((d) => d.group === g);
          return (
            <details key={g} open={!!q || rows.some((d) => labels[d.key])} className="bg-white border border-[oklch(0.9_0.012_75)] mb-4">
              <summary className="px-5 py-3 cursor-pointer font-display text-lg select-none" style={{ fontWeight: 400 }}>{g} <span className="text-xs font-body text-[oklch(0.55_0.02_60)]">({rows.length})</span></summary>
              <div className="px-5 pb-5 space-y-4">
                {rows.map((d) => (
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
            </details>
          );
        })}
      </div>
    </CRMLayout>
  );
}
