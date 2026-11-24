/**
 * Ficha · Servicios recibidos.
 * «Registrar» abre desplegables dependientes (categoría → tipo → artículo) del catálogo editable.
 * Debajo: lo registrado (compras de la web y recursos) y las sesiones de las citas realizadas, con sus observaciones.
 */
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ExternalLink, Gift, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { childrenOf, PAYMENT_LABELS, serviceLine, type CatalogNode, type PaymentStatus } from "@shared/serviceCatalog";
import SesionesTab from "./SesionesTab";
import { btnGhost, btnPrimary, card, dateInputToMs, dateInputValue, EmptyState, Field, input, SectionTitle } from "./ui";

type Props = { clientId: number; openNewSession: boolean; onNewSessionHandled: () => void };

const priceToCents = (v: string): number | null => {
  const n = Number(v.replace(",", "."));
  return v.trim() === "" || !Number.isFinite(n) || n < 0 ? null : Math.round(n * 100);
};
const centsToInput = (c: number | null | undefined) => (c == null ? "" : String(c / 100).replace(".", ","));

export default function ServiciosRecibidosTab({ clientId, openNewSession, onNewSessionHandled }: Props) {
  const utils = trpc.useUtils();
  const { data: tree = [] } = trpc.received.catalog.tree.useQuery();
  const { data: rows = [], isLoading } = trpc.received.list.useQuery({ clientId });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [cat, setCat] = useState("");
  const [mid, setMid] = useState("");
  const [leaf, setLeaf] = useState("");
  const [pay, setPay] = useState<PaymentStatus>("free");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState(dateInputValue(Date.now()));
  const [notes, setNotes] = useState("");

  const roots = useMemo(() => childrenOf(tree, null), [tree]);
  const level2 = useMemo(() => (cat ? childrenOf(tree, Number(cat)) : []), [tree, cat]);
  const midNode = tree.find((n) => String(n.id) === mid);
  const level3 = useMemo(() => (midNode?.kind === "group" ? childrenOf(tree, midNode.id) : []), [tree, midNode]);
  // El nodo que se registra: artículo del tercer nivel, o el del segundo si es un artículo directo
  const chosen: CatalogNode | undefined = midNode?.kind === "item" ? midNode : level3.find((n) => String(n.id) === leaf);
  const level2Label = level2.some((n) => n.kind === "group") && !level2.some((n) => n.kind === "item") ? "Tipo" : level2.every((n) => n.kind === "item") ? "Artículo" : "Tipo o artículo";

  const reset = () => {
    setOpen(false);
    setEditing(null);
    setCat(""); setMid(""); setLeaf("");
    setPay("free"); setPrice(""); setNotes(""); setDate(dateInputValue(Date.now()));
  };
  const refresh = () => utils.received.list.invalidate({ clientId });
  const create = trpc.received.create.useMutation({ onSuccess: () => { refresh(); reset(); toast.success("Registrado"); }, onError: (e) => toast.error(e.message) });
  const update = trpc.received.update.useMutation({ onSuccess: () => { refresh(); reset(); toast.success("Actualizado"); }, onError: (e) => toast.error(e.message) });
  const del = trpc.received.delete.useMutation({ onSuccess: () => { refresh(); toast.success("Registro eliminado"); }, onError: (e) => toast.error(e.message) });

  const onCat = (v: string) => {
    setCat(v); setMid(""); setLeaf("");
    // Recursos gratuitos se registra como gratuito; el resto, como pagado (se puede cambiar)
    setPay(tree.find((n) => String(n.id) === v)?.slug === "recursos_gratuitos" ? "free" : "paid");
    setPrice("");
  };
  const onLeaf = (node: CatalogNode | undefined) => {
    if (node && tree.find((n) => String(n.id) === cat)?.slug !== "recursos_gratuitos") setPrice(centsToInput(node.priceCents));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountCents = pay === "free" ? null : priceToCents(price);
    if (editing) update.mutate({ id: editing, clientId, paymentStatus: pay, amountCents, receivedAt: dateInputToMs(date), notes: notes || null });
    else if (chosen) create.mutate({ clientId, nodeId: chosen.id, paymentStatus: pay, amountCents, receivedAt: dateInputToMs(date), notes: notes || null });
  };

  const form = (
    <form onSubmit={submit} className={`${card} space-y-4 border-[oklch(0.52_0.08_148)]/40`}>
      <p className="text-sm font-body text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 500 }}>{editing ? "Editar registro" : "Registrar un servicio recibido"}</p>
      {!editing && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field id="sr-cat" title="Categoría">
            <select id="sr-cat" required value={cat} onChange={(e) => onCat(e.target.value)} className={input}>
              <option value="">— Elige —</option>
              {roots.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
            </select>
          </Field>
          <Field id="sr-mid" title={level2Label}>
            <select id="sr-mid" required disabled={!cat} value={mid} onChange={(e) => { setMid(e.target.value); setLeaf(""); const n = tree.find((x) => String(x.id) === e.target.value); if (n?.kind === "item") onLeaf(n); }} className={input}>
              <option value="">{cat ? "— Elige —" : "Primero la categoría"}</option>
              {level2.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
            </select>
          </Field>
          {midNode?.kind === "group" && (
            <Field id="sr-leaf" title="Artículo">
              <select id="sr-leaf" required value={leaf} onChange={(e) => { setLeaf(e.target.value); onLeaf(level3.find((n) => String(n.id) === e.target.value)); }} className={input}>
                <option value="">— Elige —</option>
                {level3.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
            </Field>
          )}
        </div>
      )}
      {editing && <p className="text-xs font-body text-[oklch(0.52_0.02_60)]">{rows.find((r) => r.id === editing)?.pathLabel}</p>}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Field id="sr-pay" title="Pago">
          <select id="sr-pay" value={pay} onChange={(e) => setPay(e.target.value as PaymentStatus)} className={input}>
            {(Object.keys(PAYMENT_LABELS) as PaymentStatus[]).map((k) => <option key={k} value={k}>{PAYMENT_LABELS[k]}</option>)}
          </select>
        </Field>
        {pay !== "free" && (
          <Field id="sr-price" title="Importe (€)">
            <input id="sr-price" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} className={input} placeholder="12" />
          </Field>
        )}
        <Field id="sr-date" title="Fecha">
          <input id="sr-date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={input} />
        </Field>
      </div>
      <Field id="sr-notes" title="Nota (opcional)">
        <textarea id="sr-notes" rows={2} maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} className={`${input} resize-y`} />
      </Field>
      <div className="flex gap-2">
        <button type="submit" disabled={create.isPending || update.isPending || (!editing && !chosen)} className={`${btnPrimary} flex-1`}>
          {(create.isPending || update.isPending) && <Loader2 size={12} className="animate-spin" />} Guardar
        </button>
        <button type="button" className={btnGhost} onClick={reset}>Cancelar</button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <SectionTitle
          action={!open && !editing ? (
            <button onClick={() => setOpen(true)} className={btnPrimary}><Plus size={14} /> Registrar</button>
          ) : undefined}
        >
          Compras y recursos
        </SectionTitle>
        {(open || editing) && form}
        {isLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="animate-spin text-[oklch(0.52_0.08_148)]" size={18} /></div>
        ) : rows.length === 0 ? (
          !open && <EmptyState icon={<Gift size={26} />} title="Todavía no hay nada registrado" text="Usa «Registrar» para anotar una guía gratuita, un producto o un ebook. Las compras de la web se añaden solas al confirmar el pago." />
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={r.id} className={`${card} flex items-start justify-between gap-3`}>
                <div className="min-w-0">
                  <p className="text-sm text-[oklch(0.18_0.018_55)] font-body" style={{ fontWeight: 500 }}>{serviceLine(r)}</p>
                  <p className="text-[0.7rem] text-[oklch(0.52_0.02_60)] font-body mt-0.5">
                    {new Date(r.receivedAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Madrid" })}
                    {r.source === "order" && " · compra en la web"}
                    {r.source === "promo" && " · descarga de promoción (recurso gratuito, sin pedido ni pago)"}
                  </p>
                  {r.notes && <p className="text-sm text-[oklch(0.28_0.025_55)] font-body whitespace-pre-line mt-1" style={{ fontWeight: 300 }}>{r.notes}</p>}
                  {r.orderId && (
                    <Link href={`/crm/pedidos?id=${r.orderId}`} className="inline-flex items-center gap-1 text-xs text-[oklch(0.52_0.08_148)] font-body mt-1.5 hover:underline no-underline">
                      <ExternalLink size={12} /> Ver el pedido original
                    </Link>
                  )}
                </div>
                <div className="flex shrink-0">
                  <button
                    className="p-2 text-[oklch(0.52_0.02_60)] hover:text-[oklch(0.52_0.08_148)]"
                    aria-label="Editar registro"
                    onClick={() => {
                      setOpen(false);
                      setEditing(r.id);
                      setPay(r.paymentStatus);
                      setPrice(centsToInput(r.amountCents));
                      setDate(dateInputValue(r.receivedAt));
                      setNotes(r.notes ?? "");
                    }}
                  ><Pencil size={14} /></button>
                  {r.source === "manual" && (
                    <button
                      className="p-2 text-[oklch(0.52_0.02_60)] hover:text-red-600"
                      aria-label="Eliminar registro"
                      onClick={() => confirm("¿Eliminar este registro?") && del.mutate({ id: r.id, clientId })}
                    ><Trash2 size={14} /></button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <SectionTitle>Sesiones y citas realizadas</SectionTitle>
        <SesionesTab clientId={clientId} openNew={openNewSession} onNewHandled={onNewSessionHandled} />
      </section>
    </div>
  );
}
