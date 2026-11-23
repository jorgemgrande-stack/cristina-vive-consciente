/**
 * Editar web — editor visual de una página: lienzo con los bloques reales, biblioteca de bloques, capas, inspector
 * (contenido y diseño), vista previa a ancho de ordenador, tableta y móvil con el diseño real, borrador, publicar,
 * historial y restauración.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearch } from "wouter";
import { toast } from "sonner";
import {
  ArrowDown, ArrowLeft, ArrowUp, Copy, Eye, EyeOff, ExternalLink, Layers, Loader2, Monitor, PencilRuler, Plus, Search, Smartphone, Tablet, Trash2,
} from "lucide-react";
import {
  BLOCK_CATALOG, createBlock, duplicateBlock, findBlock, insertBlocks, mapBlock, placeProblem, relayoutColumns, removeBlock, shiftBlock, systemPage,
  type BlockType, type PageBlock, type PageContent, type Place, type BlockStyle, isDefaultStyle, sectionColumnCount, moveBlock, walk,
} from "@shared/siteEditor";
import CRMLayout from "@/components/CRMLayout";
import { BlockView, type DetailKey } from "@/components/site/PageBlocksView";
import { FichaScope } from "@/components/site/detail";
import { WhatsappContextProvider } from "@/components/site/whatsappContext";
import { trpc } from "@/lib/trpc";
import { FICHA_SECTIONS } from "@shared/fichaSections";
import { ContentFields, DesignFields, catalogLabel } from "./blockFields";
import { PublishControls, SaveBadge, StatusPill, inputCls, labelCls, useDocEditor } from "./shared";
import { previewUrl } from "./WebPaginas";

type Mode = "edit" | "desktop" | "tablet" | "mobile";
const DEVICE_W: Record<Exclude<Mode, "edit">, number> = { desktop: 1280, tablet: 820, mobile: 390 };

function detailKeyOf(docKey: string): DetailKey {
  const m = docKey.match(/^tpl:\/([^/]+)\//);
  return (m?.[1] as DetailKey) ?? null;
}

function defaultSource(docKey: string): string {
  const map: Record<string, string> = { "/consultas": "consultas", "/masajes": "masajes", "/sistemas-agua": "sistemas_agua", "/aceites-esenciales": "aceites", "/guias-digitales": "guias", "/recomendados": "recomendados", "/blog": "blog", "/contacto": "contacto" };
  return docKey.startsWith("tpl:") ? "detalle" : (map[docKey] ?? "consultas");
}

/** Datos «Pendiente» que quedan en el texto (marcados con <mark>): hay que completarlos con información confirmada. */
export function collectPending(blocks: PageBlock[]): string[] {
  const out: string[] = [];
  walk(blocks, ({ block }) => {
    const html = (block.data as { html?: string }).html;
    if (typeof html === "string") for (const m of Array.from(html.matchAll(/<mark>(.*?)<\/mark>/g))) out.push(m[1].replace(/<[^>]+>/g, ""));
  });
  return out;
}

/** Dónde se gestionan los datos reales de cada contenido conectado. */
const DATA_LINKS: Record<string, { href: string; label: string }> = {
  consultas: { href: "/crm/servicios", label: "Servicios" }, masajes: { href: "/crm/servicios", label: "Servicios" }, home_masajes: { href: "/crm/servicios", label: "Servicios" },
  sistemas_agua: { href: "/crm/agua/productos", label: "Agua → Productos" }, home_agua: { href: "/crm/agua/productos", label: "Agua → Productos" },
  aceites: { href: "/crm/aceites/productos", label: "Aceites → Productos" }, guias: { href: "/crm/ebooks", label: "Ebooks" }, recomendados: { href: "/crm/afiliados", label: "Afiliados" },
  blog: { href: "/crm/blog/articulos", label: "Blog → Artículos" }, home_blog: { href: "/crm/blog/articulos", label: "Blog → Artículos" }, home_slideshow: { href: "/crm/hero", label: "Hero Inicio (imágenes)" }, home_guias: { href: "/crm/ebooks", label: "Ebooks" },
  contacto: { href: "/crm/automatizaciones", label: "Automatizaciones" },
};
const TEMPLATE_DATA: Record<string, { href: string; label: string }> = {
  consultas: { href: "/crm/servicios", label: "Servicios" }, masajes: { href: "/crm/servicios", label: "Servicios" }, "sistemas-agua": { href: "/crm/agua/productos", label: "Agua → Productos" },
  "aceites-esenciales": { href: "/crm/aceites/productos", label: "Aceites → Productos" }, blog: { href: "/crm/blog/articulos", label: "Blog → Artículos" },
};

let currentKind: string | null = null;
function blockSummary(b: PageBlock): string {
  const d = b.data as unknown as Record<string, unknown>;
  if (b.type === "connected" && d.source === "ficha") return FICHA_SECTIONS[currentKind ?? ""]?.find((s) => s.key === d.section)?.label ?? String(d.section || "Sección sin elegir");
  const t = [d.title, d.label, d.eyebrow, d.buttonLabel].find((x) => typeof x === "string" && x) as string | undefined;
  return t ? t.slice(0, 40) : "";
}

export default function WebEditor() {
  const search = useSearch();
  const docKey = new URLSearchParams(search).get("doc") ?? "/";
  const editor = useDocEditor<PageContent>(docKey);
  const { content, meta } = editor;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("edit");
  const [leftTab, setLeftTab] = useState<"add" | "layers">("add");
  const [panel, setPanel] = useState<"canvas" | "left" | "right">("canvas");
  const [target, setTarget] = useState<Place | null>(null);
  const [inspectorTab, setInspectorTab] = useState<"content" | "design">("content");
  const [pageOpen, setPageOpen] = useState(false);
  const [q, setQ] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropMark, setDropMark] = useState<{ id: string; pos: "before" | "after" } | null>(null);
  const docs = trpc.site.documents.useQuery();
  const summary = docs.data?.find((d) => d.docKey === docKey);
  const sample = trpc.site.sampleRoute.useQuery({ docKey }, { staleTime: 60_000 });
  const route = sample.data ?? docKey;
  const def = systemPage(docKey);

  currentKind = detailKeyOf(docKey);
  const blocks = content?.blocks ?? [];
  const selected = selectedId && content ? findBlock(blocks, selectedId) : null;
  const setBlocks = (fn: (b: PageBlock[]) => PageBlock[]) => editor.update((c) => ({ ...c, blocks: fn(c.blocks) }));

  // Si el bloque seleccionado desaparece (se eliminó), se limpia la selección
  useEffect(() => { if (selectedId && content && !findBlock(content.blocks, selectedId)) setSelectedId(null); }, [content, selectedId]);

  function addBlock(type: BlockType) {
    const block = createBlock(type);
    if (type === "connected") (block.data as { source: string }).source = defaultSource(docKey);
    let place: Place;
    if (target) place = target;
    else if (selected) place = selected.place.parent === null || selected.block.type !== "section" ? { ...selected.place, index: selected.place.index + 1 } : { parent: selected.block.id, col: 0, index: selected.block.data.columns[0]?.blocks.length ?? 0 };
    else place = { parent: null, col: 0, index: blocks.length };
    const problem = placeProblem(blocks, place, [block]);
    if (problem) { toast.error(problem); return; }
    setBlocks((b) => insertBlocks(b, place, [block]));
    setSelectedId(block.id);
    setTarget(null);
    setInspectorTab("content");
    setPanel("right");
  }

  const patchData = (id: string, data: Record<string, unknown>) =>
    setBlocks((b) => mapBlock(b, id, (x) => {
      const next = { ...x, data } as PageBlock;
      if (next.type === "section") next.data = { ...next.data, columns: relayoutColumns(next.data.columns, next.data.layout) };
      return next;
    }));
  const patchStyle = (id: string, style: BlockStyle) => setBlocks((b) => mapBlock(b, id, (x) => ({ ...x, style: isDefaultStyle(style) ? undefined : style }) as PageBlock));

  function canvasClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const el = e.target as HTMLElement;
    const col = el.closest<HTMLElement>("[data-section-col]");
    const blockEl = el.closest<HTMLElement>("[data-block-id]");
    if (col && (!blockEl || blockEl.contains(col))) {
      const [sid, idx] = col.dataset.sectionCol!.split(":");
      setTarget({ parent: sid, col: Number(idx), index: 99999 });
      setSelectedId(sid);
      setLeftTab("add");
      toast.message("Elige en «Añadir» el bloque para esta columna");
      return;
    }
    if (blockEl?.dataset.blockId) { setSelectedId(blockEl.dataset.blockId); setTarget(null); setPanel("right"); }
  }

  const filtered = BLOCK_CATALOG.filter((b) => !q || `${b.label} ${b.description}`.toLowerCase().includes(q.toLowerCase()));
  const mark = (id: string) => (dropMark?.id === id ? (dropMark.pos === "before" ? "shadow-[0_-3px_0_0_oklch(0.52_0.08_148)]" : "shadow-[0_3px_0_0_oklch(0.52_0.08_148)]") : "");
  /** Arrastrar y soltar (además de los botones subir/bajar, que siguen para teclado y táctil). */
  const dnd = (b: PageBlock) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => { e.stopPropagation(); setDragId(b.id); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", b.id); },
    onDragEnd: () => { setDragId(null); setDropMark(null); },
    onDragOver: (e: React.DragEvent) => {
      if (!dragId || dragId === b.id) return;
      e.preventDefault(); e.stopPropagation();
      const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setDropMark({ id: b.id, pos: e.clientY < r.top + r.height / 2 ? "before" : "after" });
    },
    onDrop: (e: React.DragEvent) => {
      if (!dragId || !dropMark || dragId === b.id) return;
      e.preventDefault(); e.stopPropagation();
      const f = findBlock(blocks, b.id);
      if (f) {
        const place = { ...f.place, index: f.place.index + (dropMark.pos === "after" ? 1 : 0) };
        const next = moveBlock(blocks, dragId, place);
        if (next === blocks) toast.error("Ahí no se puede colocar ese bloque.");
        else setBlocks(() => next);
      }
      setDragId(null); setDropMark(null);
    },
  });
  const moveToColumn = (sectionId: string, col: number) => {
    if (!dragId) return;
    const next = moveBlock(blocks, dragId, { parent: sectionId, col, index: 99999 });
    if (next === blocks) toast.error("Ahí no se puede colocar ese bloque."); else setBlocks(() => next);
    setDragId(null); setDropMark(null);
  };
  const wrapper = (b: PageBlock, node: React.ReactNode) => <div {...dnd(b)} className={`${b.hidden ? "opacity-40" : ""} ${mark(b.id)}`} title={b.hidden ? "Oculto en la web" : undefined}>{node}</div>;
  const pending = collectPending(blocks);
  const dataLink = docKey.startsWith("tpl:") ? TEMPLATE_DATA[detailKeyOf(docKey) ?? ""] : null;
  const ctx = { path: route, title: meta?.title ?? "", detail: detailKeyOf(docKey), inEditor: true };

  // Marco de vista previa: se escala si el panel es más estrecho que el dispositivo
  const paneRef = useRef<HTMLDivElement>(null);
  const [paneW, setPaneW] = useState(900);
  useEffect(() => {
    if (!paneRef.current) return;
    const ro = new ResizeObserver(([e]) => setPaneW(e.contentRect.width));
    ro.observe(paneRef.current);
    return () => ro.disconnect();
  }, [mode]);

  const setModeSaving = async (m: Mode) => { if (m !== "edit") await editor.flush(); setMode(m); };

  const style = useMemo(() => selectedId ? `[data-block-id="${selectedId}"]{outline:2px solid oklch(0.52 0.08 148);outline-offset:-2px}` : "", [selectedId]);

  if (!content || !meta) {
    return <CRMLayout title="Editar web"><div className="p-10"><Loader2 className="animate-spin" /></div></CRMLayout>;
  }

  return (
    <CRMLayout title="Editar web">
      <div className="-m-4 sm:-m-6 lg:-m-8 flex flex-col" style={{ minHeight: "calc(100vh - 4rem)" }}>
        {/* Barra superior */}
        <div className="bg-white border-b border-[oklch(0.9_0.012_75)] px-3 py-2 flex flex-wrap items-center gap-2 sticky top-0 z-30">
          <Link href="/crm/web" className="inline-flex items-center gap-1 text-xs text-[oklch(0.4_0.02_55)] no-underline px-2 py-1.5 hover:bg-[oklch(0.96_0.006_85)]"><ArrowLeft size={13} /> Páginas</Link>
          <div className="min-w-0">
            <div className="font-body text-sm truncate" style={{ fontWeight: 500 }}>{meta.title}</div>
            <div className="flex items-center gap-2"><StatusPill published={meta.published} changed={editor.state !== "saved" || !!summary?.draftChanged} served={meta.servedFrom} /><SaveBadge state={editor.state} /></div>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            <div className="inline-flex border border-[oklch(0.88_0.015_75)]" role="group" aria-label="Modo">
              {([["edit", <PencilRuler size={14} />, "Editar"], ["desktop", <Monitor size={14} />, "Ordenador"], ["tablet", <Tablet size={14} />, "Tableta"], ["mobile", <Smartphone size={14} />, "Móvil"]] as const).map(([m, icon, label]) => (
                <button key={m} onClick={() => void setModeSaving(m)} aria-pressed={mode === m} title={m === "edit" ? "Editar" : `Vista previa en ${label.toLowerCase()}`} className={`px-2.5 py-1.5 text-xs inline-flex items-center gap-1 ${mode === m ? "bg-[oklch(0.52_0.08_148)] text-white" : "bg-white hover:bg-[oklch(0.96_0.006_85)]"}`}>{icon}<span className="hidden md:inline">{label}</span></button>
              ))}
            </div>
            <button onClick={() => setPageOpen(true)} className="px-3 py-2 text-xs border border-[oklch(0.85_0.015_75)] bg-white hover:bg-[oklch(0.97_0.006_85)]">Página y SEO</button>
            {!route.includes(":") && (
              <button onClick={async () => { await editor.flush(); window.open(previewUrl(route), "_blank"); }} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs border border-[oklch(0.85_0.015_75)] bg-white hover:bg-[oklch(0.97_0.006_85)]"><ExternalLink size={13} /> Vista previa</button>
            )}
            <PublishControls docKey={docKey} editor={editor} warning={pending.length ? `⚠ Quedan ${pending.length} dato(s) «Pendiente» sin completar en esta página.` : undefined} />
          </div>
        </div>

        {pending.length > 0 && (
          <div role="alert" className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs font-body text-amber-900">
            <b>{pending.length} dato(s) «Pendiente» por completar</b> con información confirmada antes de publicar: {pending.slice(0, 6).map((p) => p.replace("[Pendiente: ", "").replace("]", "")).join(" · ")}{pending.length > 6 ? "…" : ""}. En el texto aparecen resaltados en amarillo.
          </div>
        )}
        {dataLink && (
          <div className="bg-[oklch(0.97_0.01_148)] border-b border-[oklch(0.9_0.03_148)] px-4 py-1.5 text-xs font-body">
            Los datos de la ficha (precio, duración, contenido) se editan en <a href={dataLink.href} target="_blank" rel="noreferrer" className="underline">{dataLink.label} <ExternalLink size={11} className="inline" /></a>. Aquí decides el orden, la visibilidad y el diseño de sus secciones.
          </div>
        )}

        {/* Selector de panel en pantallas pequeñas */}
        {mode === "edit" && (
          <div className="lg:hidden flex border-b border-[oklch(0.9_0.012_75)] bg-white text-xs">
            {([["left", "Bloques"], ["canvas", "Página"], ["right", "Ajustes"]] as const).map(([p, l]) => <button key={p} onClick={() => setPanel(p)} className={`flex-1 py-2 ${panel === p ? "bg-[oklch(0.94_0.03_148)] text-[oklch(0.3_0.07_148)]" : ""}`}>{l}</button>)}
          </div>
        )}

        <div className="flex-1 grid lg:grid-cols-[260px_1fr_340px] min-h-0">
          {/* Izquierda: añadir / capas */}
          <aside className={`${panel === "left" ? "block" : "hidden"} lg:block bg-white border-r border-[oklch(0.9_0.012_75)] overflow-y-auto`} style={{ maxHeight: "calc(100vh - 7.5rem)" }} hidden={mode !== "edit"}>
            <div className="flex border-b border-[oklch(0.92_0.01_75)] text-xs">
              <button onClick={() => setLeftTab("add")} className={`flex-1 py-2.5 inline-flex items-center justify-center gap-1 ${leftTab === "add" ? "border-b-2 border-[oklch(0.52_0.08_148)]" : ""}`}><Plus size={13} /> Añadir</button>
              <button onClick={() => setLeftTab("layers")} className={`flex-1 py-2.5 inline-flex items-center justify-center gap-1 ${leftTab === "layers" ? "border-b-2 border-[oklch(0.52_0.08_148)]" : ""}`}><Layers size={13} /> Estructura</button>
            </div>
            {leftTab === "add" ? (
              <div className="p-3 space-y-3">
                {target && <p className="text-xs bg-[oklch(0.96_0.02_148)] p-2 font-body">Se añadirá en la columna {target.col + 1} de la sección. <button className="underline" onClick={() => setTarget(null)}>Cancelar</button></p>}
                <div className="relative"><Search size={13} className="absolute left-2.5 top-2.5 text-[oklch(0.55_0.02_60)]" /><input className={`${inputCls} pl-8`} placeholder="Buscar bloque…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar bloque" /></div>
                {(["Estructura", "Contenido", "Conectados"] as const).map((g) => {
                  const items = filtered.filter((b) => b.group === g);
                  return items.length ? (
                    <div key={g}>
                      <p className="text-[0.65rem] uppercase tracking-widest text-[oklch(0.5_0.02_60)] mb-1.5 font-body">{g === "Conectados" ? "Con datos de la web" : g}</p>
                      <div className="space-y-1">
                        {items.map((b) => (
                          <button key={b.type} onClick={() => addBlock(b.type)} className="w-full text-left px-3 py-2 border border-[oklch(0.92_0.01_75)] hover:border-[oklch(0.52_0.08_148)] hover:bg-[oklch(0.98_0.01_148)]">
                            <div className="text-sm font-body" style={{ fontWeight: 500 }}>{b.label}</div>
                            <div className="text-[0.7rem] text-[oklch(0.5_0.02_60)] font-body leading-snug">{b.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            ) : (
              <Outline blocks={blocks} selectedId={selectedId} onSelect={(id) => { setSelectedId(id); setPanel("right"); }} dnd={dnd} mark={mark} onDropColumn={moveToColumn} dragging={!!dragId} />
            )}
          </aside>

          {/* Centro: lienzo o vista previa */}
          <main className={`${panel === "canvas" ? "block" : "hidden"} lg:block bg-[oklch(0.94_0.008_80)] overflow-auto min-w-0`} style={{ maxHeight: "calc(100vh - 7.5rem)" }}>
            {mode === "edit" ? (
              <div className="p-3 sm:p-5">
                <style>{style}{`.cvc-canvas [data-block-id]:hover{outline:1px dashed oklch(0.52 0.08 148 / .6);outline-offset:-1px}`}</style>
                <div className="cvc-canvas bg-[oklch(0.985_0.006_85)] shadow-sm min-h-[60vh]" onClickCapture={canvasClick} onSubmitCapture={(e) => e.preventDefault()}>
                  {blocks.length === 0 && <div className="py-24 text-center text-sm font-body text-[oklch(0.5_0.02_60)]">La página está vacía. Elige un bloque en «Añadir».</div>}
                  <WhatsappContextProvider>
                    {() => (
                      <FichaScope kind={detailKeyOf(docKey)} slug={route.split("/").pop() ?? ""}>
                        {blocks.map((b) => <div key={b.id} {...dnd(b)} className={`${b.hidden ? "opacity-40" : ""} ${mark(b.id)}`}><BlockView block={b} ctx={ctx} wrapper={wrapper} /></div>)}
                      </FichaScope>
                    )}
                  </WhatsappContextProvider>
                </div>
                <p className="text-center text-xs text-[oklch(0.5_0.02_60)] mt-3 font-body">Pulsa un bloque para editarlo. Para ver el resultado real en móvil o tableta, usa los botones de arriba.</p>
              </div>
            ) : (
              <div ref={paneRef} className="p-4 flex justify-center">
                <PreviewFrame url={previewUrl(route)} width={DEVICE_W[mode]} paneW={paneW - 32} version={editor.version} saving={editor.state === "saving"} />
              </div>
            )}
          </main>

          {/* Derecha: inspector */}
          <aside className={`${panel === "right" ? "block" : "hidden"} lg:block bg-white border-l border-[oklch(0.9_0.012_75)] overflow-y-auto`} style={{ maxHeight: "calc(100vh - 7.5rem)" }} hidden={mode !== "edit"}>
            {selected ? (
              <div>
                <div className="p-3 border-b border-[oklch(0.92_0.01_75)] flex items-center justify-between gap-2">
                  <div className="min-w-0"><div className="font-body text-sm truncate" style={{ fontWeight: 500 }}>{catalogLabel(selected.block.type)}</div><div className="text-xs text-[oklch(0.55_0.02_60)] truncate">{blockSummary(selected.block)}</div></div>
                  <div className="flex gap-1 shrink-0">
                    <IconBtn label="Subir" onClick={() => setBlocks((b) => shiftBlock(b, selected.block.id, -1))}><ArrowUp size={14} /></IconBtn>
                    <IconBtn label="Bajar" onClick={() => setBlocks((b) => shiftBlock(b, selected.block.id, 1))}><ArrowDown size={14} /></IconBtn>
                    <IconBtn label="Duplicar" onClick={() => { const r = duplicateBlock(blocks, selected.block.id); editor.update((c) => ({ ...c, blocks: r.blocks })); if (r.newId) setSelectedId(r.newId); }}><Copy size={14} /></IconBtn>
                    <IconBtn label={selected.block.hidden ? "Mostrar en la web" : "Ocultar en la web"} onClick={() => setBlocks((b) => mapBlock(b, selected.block.id, (x) => ({ ...x, hidden: x.hidden ? undefined : true }) as PageBlock))}>{selected.block.hidden ? <Eye size={14} /> : <EyeOff size={14} />}</IconBtn>
                    <IconBtn label="Eliminar" danger onClick={() => { if (window.confirm("¿Eliminar este bloque?")) { setBlocks((b) => removeBlock(b, selected.block.id)); setSelectedId(null); } }}><Trash2 size={14} /></IconBtn>
                  </div>
                </div>
                <div className="flex border-b border-[oklch(0.92_0.01_75)] text-xs">
                  {([["content", "Contenido"], ["design", "Diseño"]] as const).map(([t, l]) => <button key={t} onClick={() => setInspectorTab(t)} className={`flex-1 py-2.5 ${inspectorTab === t ? "border-b-2 border-[oklch(0.52_0.08_148)]" : ""}`}>{l}</button>)}
                </div>
                <div className="p-3">
                  {selected.block.hidden && <p className="text-xs bg-[oklch(0.96_0.04_80)] p-2 mb-3 font-body">Este bloque está oculto: se conserva en el borrador pero no se ve en la web.</p>}
                  {inspectorTab === "content" ? (
                    <>
                      <ContentFields block={selected.block} detailKind={detailKeyOf(docKey)} onChange={(d) => patchData(selected.block.id, d)} />
                      {selected.block.type === "connected" && DATA_LINKS[(selected.block.data as { source: string }).source] && (
                        <a href={DATA_LINKS[(selected.block.data as { source: string }).source].href} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs underline text-[oklch(0.35_0.08_148)]"><ExternalLink size={12} /> Gestionar estos datos en {DATA_LINKS[(selected.block.data as { source: string }).source].label}</a>
                      )}
                      {selected.block.type === "section" && (
                        <div className="mt-4 border-t border-[oklch(0.92_0.01_75)] pt-3 space-y-1.5">
                          <p className={labelCls}>Añadir un bloque a una columna</p>
                          {Array.from({ length: sectionColumnCount(selected.block.data.layout) }, (_, i) => (
                            <button key={i} className="w-full text-left text-xs px-3 py-2 border border-[oklch(0.88_0.015_75)] hover:bg-[oklch(0.97_0.006_85)]" onClick={() => { setTarget({ parent: selected.block.id, col: i, index: 99999 }); setLeftTab("add"); setPanel("left"); }}>
                              Columna {i + 1} ({((selected.block.data as { columns: { blocks: unknown[] }[] }).columns[i]?.blocks.length ?? 0)} bloques)
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <DesignFields block={selected.block} onChange={(s) => patchStyle(selected.block.id, s)} />
                  )}
                </div>
              </div>
            ) : (
              <div className="p-5 text-sm font-body text-[oklch(0.45_0.02_55)] space-y-3">
                <p style={{ fontWeight: 500 }}>Ningún bloque seleccionado</p>
                <p>Pulsa un bloque en la página para cambiar su texto, imágenes y diseño, o añade uno nuevo desde «Añadir».</p>
                {def?.note && <p className="text-xs">{def.note}</p>}
                <button className="text-xs px-3 py-2 border border-[oklch(0.85_0.015_75)]" onClick={() => setPageOpen(true)}>Título, descripción y SEO de la página</button>
              </div>
            )}
          </aside>
        </div>
      </div>
      {pageOpen && <PageSettings docKey={docKey} content={content} title={meta.title} custom={!def} onChange={(c) => editor.update(() => c)} onClose={() => setPageOpen(false)} />}
    </CRMLayout>
  );
}

function IconBtn({ label, onClick, children, danger }: { label: string; onClick: () => void; children: React.ReactNode; danger?: boolean }) {
  return <button onClick={onClick} title={label} aria-label={label} className={`p-1.5 border border-[oklch(0.88_0.015_75)] bg-white hover:bg-[oklch(0.96_0.006_85)] ${danger ? "text-red-700" : ""}`}>{children}</button>;
}

type OutlineProps = { selectedId: string | null; onSelect: (id: string) => void; dnd: (b: PageBlock) => Record<string, unknown>; mark: (id: string) => string; onDropColumn: (sectionId: string, col: number) => void; dragging: boolean };
function Outline({ blocks, selectedId, onSelect, dnd, mark, onDropColumn, dragging, depth = 0 }: OutlineProps & { blocks: PageBlock[]; depth?: number }) {
  if (blocks.length === 0 && depth === 0) return <p className="p-4 text-xs font-body text-[oklch(0.5_0.02_60)]">Todavía no hay bloques.</p>;
  return (
    <ul className={depth ? "ml-3 border-l border-[oklch(0.92_0.01_75)]" : "p-2"}>
      {blocks.map((b) => (
        <li key={b.id} {...dnd(b)} className={mark(b.id)}>
          <button onClick={() => onSelect(b.id)} title="Arrastra para reordenar" className={`w-full text-left px-2 py-1.5 text-xs font-body flex items-center gap-1.5 ${b.id === selectedId ? "bg-[oklch(0.94_0.03_148)]" : "hover:bg-[oklch(0.97_0.006_85)]"} ${b.hidden ? "opacity-50" : ""}`}>
            <span style={{ fontWeight: 500 }}>{catalogLabel(b.type)}</span><span className="text-[oklch(0.55_0.02_60)] truncate">{blockSummary(b)}</span>{b.hidden && <EyeOff size={11} />}
          </button>
          {b.type === "section" && b.data.columns.map((c, i) => (
            <div key={i} onDragOver={(e) => { if (dragging) e.preventDefault(); }} onDrop={(e) => { e.preventDefault(); e.stopPropagation(); onDropColumn(b.id, i); }}><p className={`ml-3 mt-1 text-[0.65rem] uppercase tracking-widest text-[oklch(0.55_0.02_60)] ${dragging ? "bg-[oklch(0.96_0.02_148)]" : ""}`}>Columna {i + 1}{dragging ? " · soltar aquí" : ""}</p><Outline blocks={c.blocks} selectedId={selectedId} onSelect={onSelect} dnd={dnd} mark={mark} onDropColumn={onDropColumn} dragging={dragging} depth={depth + 1} /></div>
          ))}
        </li>
      ))}
    </ul>
  );
}

function PreviewFrame({ url, width, paneW, version, saving }: { url: string; width: number; paneW: number; version: number; saving: boolean }) {
  const scale = Math.min(1, Math.max(0.3, paneW / width));
  const [loaded, setLoaded] = useState(false);
  useEffect(() => setLoaded(false), [version, url]);
  return (
    <div style={{ width: width * scale }}>
      <div className="text-center text-xs text-[oklch(0.45_0.02_55)] font-body mb-2">{width} px · diseño real con el borrador (formularios y botones de compra inactivos){saving && " · guardando…"}</div>
      <div className="bg-white shadow-md relative" style={{ width: width * scale, height: 760 * scale + 40 }}>
        {!loaded && <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="animate-spin" /></div>}
        <iframe key={version} title={`Vista previa a ${width} px`} src={url} onLoad={() => setLoaded(true)} className="border-0 bg-white origin-top-left" style={{ width, height: 800, transform: `scale(${scale})` }} />
      </div>
    </div>
  );
}

function PageSettings({ docKey, content, title, custom, onChange, onClose }: { docKey: string; content: PageContent; title: string; custom: boolean; onChange: (c: PageContent) => void; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [name, setName] = useState(title);
  const setTitle = trpc.site.setTitle.useMutation({ onSuccess: () => { void utils.site.draft.invalidate({ docKey }); void utils.site.documents.invalidate(); toast.success("Título actualizado"); }, onError: (e) => toast.error(e.message) });
  const seo = content.seo;
  const set = (patch: Partial<typeof seo>) => onChange({ ...content, seo: { ...seo, ...patch } });
  return (
    <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Página y SEO" onClick={onClose}>
      <div className="bg-white max-w-lg w-full max-h-[85vh] overflow-auto p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-xl" style={{ fontWeight: 400 }}>Página y SEO</h2>
        {custom && (
          <div className="flex gap-2 items-end">
            <div className="flex-1"><label className={labelCls} htmlFor="pg-name">Nombre de la página (solo en el panel)</label><input id="pg-name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></div>
            <button className="px-3 py-2 text-xs border border-[oklch(0.85_0.015_75)]" onClick={() => setTitle.mutate({ docKey, title: name })}>Guardar nombre</button>
          </div>
        )}
        <div><label className={labelCls} htmlFor="seo-t">Título para buscadores (unos 60 caracteres)</label><input id="seo-t" className={inputCls} value={seo.title} maxLength={120} onChange={(e) => set({ title: e.target.value })} /><p className="text-[0.7rem] text-[oklch(0.55_0.02_60)] mt-1">{seo.title.length}/60 recomendados</p></div>
        <div><label className={labelCls} htmlFor="seo-d">Descripción (unos 155 caracteres)</label><textarea id="seo-d" rows={3} className={inputCls} value={seo.description} maxLength={320} onChange={(e) => set({ description: e.target.value })} /><p className="text-[0.7rem] text-[oklch(0.55_0.02_60)] mt-1">{seo.description.length}/155 recomendados</p></div>
        <div><span className={labelCls}>Imagen para redes sociales (al compartir el enlace)</span><ImageField value={seo.ogImage} onChange={(u) => set({ ogImage: u })} /></div>
        <label className="flex items-center gap-2 text-sm font-body"><input type="checkbox" checked={seo.noindex} onChange={(e) => set({ noindex: e.target.checked })} /> Que los buscadores no muestren esta página (y quitarla del mapa del sitio)</label>
        <p className="text-xs text-[oklch(0.5_0.02_60)] font-body">La dirección de la página es <b>{docKey.startsWith("tpl:") ? "la de cada ficha" : docKey}</b>. {custom ? "Se cambia desde la lista de páginas (deja una redirección automática)." : "Las páginas originales conservan su dirección."}</p>
        <div className="text-right"><button className="px-4 py-2 text-xs bg-[oklch(0.52_0.08_148)] text-white" onClick={onClose}>Listo</button></div>
      </div>
    </div>
  );
}

import { ImageUploader } from "@/components/ImageUploader";
function ImageField({ value, onChange }: { value: string; onChange: (u: string) => void }) {
  return <ImageUploader value={value} onChange={onChange} label="" />;
}
