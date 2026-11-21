/**
 * CRM — Catálogo de «Servicios recibidos».
 * Categorías, tipos y artículos que aparecen en los desplegables de «Registrar» de cada ficha.
 * Se pueden crear, editar y archivar. Archivar no borra nada: oculta el elemento de los desplegables
 * y el historial de las clientas se conserva.
 */
import { useState } from "react";
import { Archive, ArchiveRestore, ChevronRight, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import CRMLayout from "@/components/CRMLayout";
import { allowedChildKinds, childrenOf, euros, type CatalogKind, type CatalogNode } from "@shared/serviceCatalog";

const KIND_LABEL: Record<CatalogKind, string> = { category: "Categoría", group: "Tipo", item: "Artículo" };
const btn = "inline-flex items-center gap-1.5 px-3 min-h-[36px] text-xs font-body border border-[oklch(0.88_0.015_75)] text-[oklch(0.38_0.02_55)] hover:border-[oklch(0.52_0.08_148)] transition-colors";
const field = "px-3 py-2 text-sm bg-white border border-[oklch(0.88_0.015_75)] font-body focus:outline-none focus:border-[oklch(0.52_0.08_148)]";

type Draft = { parentId: number | null; kind: CatalogKind; name: string; price: string } | { id: number; name: string; price: string; isItem: boolean };

const toCents = (v: string): number | null => {
  const n = Number(v.replace(",", "."));
  return v.trim() === "" || !Number.isFinite(n) || n < 0 ? null : Math.round(n * 100);
};

export default function CatalogoServicios() {
  const utils = trpc.useUtils();
  const { data: tree = [], isLoading } = trpc.received.catalog.tree.useQuery();
  const [draft, setDraft] = useState<Draft | null>(null);
  const done = (msg: string) => { utils.received.catalog.tree.invalidate(); setDraft(null); toast.success(msg); };
  const create = trpc.received.catalog.create.useMutation({ onSuccess: () => done("Creado"), onError: (e) => toast.error(e.message) });
  const update = trpc.received.catalog.update.useMutation({ onSuccess: () => done("Guardado"), onError: (e) => toast.error(e.message) });
  const archive = trpc.received.catalog.setArchived.useMutation({ onSuccess: (_r, v) => { utils.received.catalog.tree.invalidate(); toast.success(v.archived ? "Archivado" : "Restaurado"); }, onError: (e) => toast.error(e.message) });

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    if ("id" in draft) update.mutate({ id: draft.id, name: draft.name, priceCents: draft.isItem ? toCents(draft.price) : undefined });
    else create.mutate({ parentId: draft.parentId, kind: draft.kind, name: draft.name, priceCents: draft.kind === "item" ? toCents(draft.price) : undefined });
  };

  // El formulario solo se construye cuando hay un borrador abierto (draft empieza en null)
  const renderForm = (d: Draft) => {
    const editing = "id" in d;
    const isItem = editing ? d.isItem : d.kind === "item";
    return (
      <form onSubmit={save} className="flex flex-wrap items-end gap-2 bg-[oklch(0.97_0.006_85)] border border-[oklch(0.52_0.08_148)]/40 p-3 my-2">
        <label className="text-xs font-body">
          {editing ? "Nombre" : KIND_LABEL[d.kind]}
          <input autoFocus required maxLength={200} value={d.name} onChange={(e) => { const v = e.target.value; setDraft((p) => (p ? ({ ...p, name: v } as Draft) : p)); }} className={`${field} block mt-1 w-64`} />
        </label>
        {isItem && (
          <label className="text-xs font-body">
            Precio (€, opcional)
            <input inputMode="decimal" value={d.price} onChange={(e) => { const v = e.target.value; setDraft((p) => (p ? ({ ...p, price: v } as Draft) : p)); }} className={`${field} block mt-1 w-28`} />
          </label>
        )}
        <button type="submit" className={`${btn} bg-[oklch(0.52_0.08_148)] text-white border-transparent`}>Guardar</button>
        <button type="button" className={btn} onClick={() => setDraft(null)}>Cancelar</button>
      </form>
    );
  };

  const addButtons = (parent: CatalogNode | null) =>
    allowedChildKinds(parent).map((kind) => (
      <button key={kind} className={btn} onClick={() => setDraft({ parentId: parent?.id ?? null, kind, name: "", price: "" })}>
        <Plus size={12} /> {KIND_LABEL[kind]}
      </button>
    ));

  // Función (no componente): definir un componente dentro del render lo volvería a montar en cada pulsación y el formulario perdería el foco
  const renderRow = (node: CatalogNode, depth: number): React.ReactElement => (
    <li key={node.id}>
      <div className={`flex flex-wrap items-center gap-2 py-2 ${node.archived ? "opacity-55" : ""}`} style={{ paddingLeft: depth * 20 }}>
        {depth > 0 && <ChevronRight size={12} className="text-[oklch(0.7_0.01_60)]" />}
        <span className="text-[0.6rem] uppercase tracking-wider text-[oklch(0.52_0.02_60)] font-body w-16">{KIND_LABEL[node.kind]}</span>
        <span className="text-sm font-body text-[oklch(0.18_0.018_55)]" style={{ fontWeight: depth === 0 ? 500 : 400 }}>
          {node.name}{node.priceCents != null ? ` · ${euros(node.priceCents)}` : ""}{node.archived ? " (archivado)" : ""}
        </span>
        <span className="flex gap-1.5 ml-auto">
          {!node.archived && addButtons(node)}
          <button className={btn} aria-label={`Editar ${node.name}`} onClick={() => setDraft({ id: node.id, name: node.name, price: node.priceCents != null ? String(node.priceCents / 100).replace(".", ",") : "", isItem: node.kind === "item" })}>
            <Pencil size={12} /> Editar
          </button>
          <button className={btn} onClick={() => archive.mutate({ id: node.id, archived: !node.archived })}>
            {node.archived ? <><ArchiveRestore size={12} /> Restaurar</> : <><Archive size={12} /> Archivar</>}
          </button>
        </span>
      </div>
      {draft && "id" in draft && draft.id === node.id && renderForm(draft)}
      {draft && !("id" in draft) && draft.parentId === node.id && renderForm(draft)}
      <ul>{childrenOf(tree, node.id, true).map((c) => renderRow(c, depth + 1))}</ul>
    </li>
  );

  return (
    <CRMLayout title="Catálogo de fichas">
      <div className="max-w-4xl">
        <p className="text-sm text-[oklch(0.45_0.02_60)] font-body mb-4" style={{ fontWeight: 300 }}>
          Lo que aparece en los desplegables de «Registrar» en «Servicios» de cada ficha. Archivar oculta el elemento sin perder el historial de nadie.
        </p>
        <div className="bg-white border border-[oklch(0.92_0.01_80)] p-4">
          {isLoading ? <p className="text-sm text-[oklch(0.52_0.02_60)]">Cargando…</p> : (
            <ul className="divide-y divide-[oklch(0.96_0.006_80)]">
              {childrenOf(tree, null, true).map((n) => renderRow(n, 0))}
            </ul>
          )}
          <div className="mt-3 pt-3 border-t border-[oklch(0.96_0.006_80)]">
            {draft && !("id" in draft) && draft.parentId === null ? renderForm(draft) : <span className="flex gap-2">{addButtons(null)}</span>}
          </div>
        </div>
      </div>
    </CRMLayout>
  );
}
