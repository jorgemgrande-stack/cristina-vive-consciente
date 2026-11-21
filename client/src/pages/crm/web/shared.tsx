/**
 * Editar web — piezas comunes: hook de documento (borrador con guardado automático, publicar, historial, restaurar),
 * barra de estado y diálogo de historial.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { History, Loader2, RotateCcw, Upload } from "lucide-react";
import { trpc } from "@/lib/trpc";

export const dateTime = (d: Date | string | null | undefined): string =>
  d ? new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Madrid" }).format(new Date(d)) : "—";

export type SaveState = "saved" | "dirty" | "saving" | "error";

/** Borrador de un documento: edición local, guardado automático al dejar de escribir y publicación explícita. */
export function useDocEditor<C>(docKey: string) {
  const utils = trpc.useUtils();
  const query = trpc.site.draft.useQuery({ docKey }, { refetchOnWindowFocus: false, staleTime: Infinity });
  const [content, setContent] = useState<C | null>(null);
  const [state, setState] = useState<SaveState>("saved");
  const [version, setVersion] = useState(0); // sube en cada guardado: la vista previa se recarga
  const latest = useRef<C | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveMut = trpc.site.save.useMutation();
  const publishMut = trpc.site.publish.useMutation();
  const restoreMut = trpc.site.restore.useMutation();

  // Carga inicial (y al cambiar de documento)
  useEffect(() => {
    if (query.data) { setContent(query.data.content as C); latest.current = query.data.content as C; setState("saved"); }
  }, [query.data?.docKey, query.dataUpdatedAt]);

  const flush = useCallback(async (): Promise<boolean> => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    if (latest.current === null) return true;
    setState("saving");
    try {
      const r = await saveMut.mutateAsync({ docKey, content: latest.current });
      setState("saved");
      setVersion((v) => v + 1);
      void utils.site.documents.invalidate();
      return !!r;
    } catch (e) {
      setState("error");
      toast.error((e as Error).message || "No se pudo guardar el borrador");
      return false;
    }
  }, [docKey]);

  const update = useCallback((fn: (c: C) => C) => {
    if (latest.current === null) return;
    const next = fn(latest.current);
    latest.current = next;
    setContent(next);
    setState("dirty");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { void flush(); }, 1200);
  }, [flush]);

  // Al salir con cambios sin guardar, se guardan
  useEffect(() => () => { if (timer.current) { clearTimeout(timer.current); void saveMut.mutateAsync({ docKey, content: latest.current }).catch(() => {}); } }, [docKey]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (state === "dirty" || state === "saving") { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [state]);

  const publish = useCallback(async (note?: string) => {
    if (!(await flush())) return false;
    try {
      await publishMut.mutateAsync({ docKey, note });
      await Promise.all([utils.site.draft.invalidate({ docKey }), utils.site.documents.invalidate(), utils.site.versions.invalidate({ docKey }), utils.site.page.invalidate(), utils.site.global.invalidate()]);
      toast.success("Publicado: ya lo ve todo el mundo en la web");
      return true;
    } catch (e) {
      toast.error((e as Error).message);
      return false;
    }
  }, [docKey, flush]);

  const restore = useCallback(async (versionId: number) => {
    try {
      if (timer.current) { clearTimeout(timer.current); timer.current = null; }
      await restoreMut.mutateAsync({ docKey, versionId, publish: true });
      await Promise.all([utils.site.draft.invalidate({ docKey }), utils.site.documents.invalidate(), utils.site.versions.invalidate({ docKey }), utils.site.page.invalidate(), utils.site.global.invalidate()]);
      await query.refetch();
      setVersion((v) => v + 1);
      toast.success("Versión restaurada y publicada");
      return true;
    } catch (e) {
      toast.error((e as Error).message);
      return false;
    }
  }, [docKey]);

  return { query, meta: query.data, content, state, version, update, flush, publish, restore, publishing: publishMut.isPending };
}

export function SaveBadge({ state }: { state: SaveState }) {
  const map = { saved: ["Borrador guardado", "text-[oklch(0.42_0.08_148)]"], dirty: ["Cambios sin guardar…", "text-[oklch(0.55_0.12_70)]"], saving: ["Guardando…", "text-[oklch(0.5_0.02_60)]"], error: ["Error al guardar", "text-red-700"] } as const;
  const [text, cls] = map[state];
  return <span className={`text-xs font-body ${cls}`} role="status">{state === "saving" && <Loader2 size={11} className="inline animate-spin mr-1" />}{text}</span>;
}

export function StatusPill({ published, changed, served }: { published: boolean; changed: boolean; served: "legacy" | "cms" }) {
  const [text, cls] =
    served === "legacy" && !published ? ["Original (sin publicar)", "bg-[oklch(0.93_0.01_80)] text-[oklch(0.4_0.02_60)]"]
    : changed ? ["Publicada · con cambios en borrador", "bg-[oklch(0.95_0.06_80)] text-[oklch(0.45_0.1_70)]"]
    : ["Publicada", "bg-[oklch(0.93_0.05_148)] text-[oklch(0.35_0.08_148)]"];
  return <span className={`inline-block px-2 py-0.5 text-[0.7rem] font-body ${cls}`}>{text}</span>;
}

/** Botones de publicar e historial. */
export function PublishControls({ docKey, editor, label = "Publicar", warning }: { docKey: string; editor: ReturnType<typeof useDocEditor<any>>; label?: string; warning?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-body border border-[oklch(0.85_0.015_75)] bg-white hover:bg-[oklch(0.97_0.006_85)]">
        <History size={13} /> Historial
      </button>
      <button
        onClick={async () => { if (window.confirm(`${warning ? warning + "\n\n" : ""}¿Publicar ahora? Los cambios se verán en la web para todo el mundo.`)) await editor.publish(); }}
        disabled={editor.publishing || editor.state === "saving"}
        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-body bg-[oklch(0.52_0.08_148)] text-white hover:bg-[oklch(0.42_0.08_148)] disabled:opacity-60"
      >
        {editor.publishing ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />} {label}
      </button>
      {open && <HistoryDialog docKey={docKey} editor={editor} onClose={() => setOpen(false)} />}
    </>
  );
}

function HistoryDialog({ docKey, editor, onClose }: { docKey: string; editor: ReturnType<typeof useDocEditor<any>>; onClose: () => void }) {
  const { data = [], isLoading } = trpc.site.versions.useQuery({ docKey });
  return (
    <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Historial de versiones" onClick={onClose}>
      <div className="bg-white max-w-lg w-full max-h-[80vh] overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-xl mb-1" style={{ fontWeight: 400 }}>Historial de versiones</h2>
        <p className="text-xs text-[oklch(0.5_0.02_60)] font-body mb-4">Cada publicación se guarda. Restaurar una versión la publica de nuevo (queda como versión nueva; nada se pierde).</p>
        {isLoading ? <Loader2 className="animate-spin" /> : data.length === 0 ? <p className="text-sm font-body">Todavía no hay versiones publicadas.</p> : (
          <ul className="divide-y divide-[oklch(0.92_0.01_75)]">
            {data.map((v) => (
              <li key={v.id} className="py-3 flex items-center justify-between gap-3">
                <div className="text-sm font-body">
                  <div>{dateTime(v.createdAt)} {v.current && <span className="ml-1 text-[0.7rem] px-1.5 py-0.5 bg-[oklch(0.93_0.05_148)] text-[oklch(0.35_0.08_148)]">En la web</span>}</div>
                  <div className="text-xs text-[oklch(0.5_0.02_60)]">{v.action === "restore" ? "Restauración" : "Publicación"}{v.note ? ` · ${v.note}` : ""}</div>
                </div>
                {!v.current && (
                  <button
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs border border-[oklch(0.85_0.015_75)] hover:bg-[oklch(0.97_0.006_85)]"
                    onClick={async () => { if (window.confirm("¿Restaurar esta versión y publicarla?")) { if (await editor.restore(v.id)) onClose(); } }}
                  >
                    <RotateCcw size={12} /> Restaurar
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-5 text-right"><button className="px-4 py-2 text-xs border border-[oklch(0.85_0.015_75)]" onClick={onClose}>Cerrar</button></div>
      </div>
    </div>
  );
}

export const inputCls = "w-full border border-[oklch(0.88_0.015_75)] bg-white px-3 py-2 text-sm font-body text-[oklch(0.18_0.018_55)] focus:outline-none focus:border-[oklch(0.52_0.08_148)]";
export const labelCls = "block text-xs font-body text-[oklch(0.4_0.02_55)] mb-1";
