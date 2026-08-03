/**
 * InvoiceItemsEditor — líneas de una factura (CRM)
 * Lista de líneas (concepto + cantidad + precio) con un modal para añadir/editar
 * cada una. El importe de cada línea y el subtotal se calculan automáticamente.
 */

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export interface InvoiceItemDraft {
  description: string;
  quantity: string;
  unitPrice: string;
}

const emptyDraft: InvoiceItemDraft = { description: "", quantity: "1", unitPrice: "" };

function amountOf(item: InvoiceItemDraft): number {
  const qty = parseFloat(item.quantity) || 0;
  const price = parseFloat(item.unitPrice) || 0;
  return qty * price;
}

export function sumItems(items: InvoiceItemDraft[]): number {
  return items.reduce((acc, item) => acc + amountOf(item), 0);
}

export function toItemsPayload(items: InvoiceItemDraft[]) {
  return items.map((item) => ({
    description: item.description,
    quantity: (parseFloat(item.quantity) || 1).toFixed(2),
    unitPrice: (parseFloat(item.unitPrice) || 0).toFixed(2),
    amount: amountOf(item).toFixed(2),
  }));
}

const inputClass =
  "w-full px-3 py-2.5 text-sm bg-white border border-[oklch(0.92_0.01_80)] text-[oklch(0.18_0.018_55)] focus:outline-none focus:border-[oklch(0.52_0.08_148)] transition-colors font-body";
const labelClass = "block text-xs text-[oklch(0.38_0.02_55)] font-body mb-1.5 uppercase tracking-wider";

interface Props {
  items: InvoiceItemDraft[];
  onChange: (items: InvoiceItemDraft[]) => void;
}

export default function InvoiceItemsEditor({ items, onChange }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<InvoiceItemDraft>(emptyDraft);

  function openAdd() {
    setEditingIndex(null);
    setDraft(emptyDraft);
    setModalOpen(true);
  }

  function openEdit(index: number) {
    setEditingIndex(index);
    setDraft(items[index]);
    setModalOpen(true);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function handleSave() {
    if (!draft.description.trim()) return;
    const cleaned: InvoiceItemDraft = {
      description: draft.description.trim(),
      quantity: draft.quantity || "1",
      unitPrice: draft.unitPrice || "0",
    };
    if (editingIndex !== null) {
      onChange(items.map((it, i) => (i === editingIndex ? cleaned : it)));
    } else {
      onChange([...items, cleaned]);
    }
    setModalOpen(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className={labelClass} style={{ fontWeight: 500, marginBottom: 0 }}>
          Líneas de factura
        </label>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 text-xs text-[oklch(0.52_0.08_148)] font-body hover:underline"
          style={{ fontWeight: 500 }}
        >
          <Plus size={13} /> Añadir línea
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-[oklch(0.52_0.02_60)] font-body italic py-1">
          Sin líneas añadidas — se usará el importe manual de abajo.
        </p>
      ) : (
        <div className="border border-[oklch(0.92_0.01_80)] mb-1">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-3 py-2.5 border-b border-[oklch(0.92_0.01_80)] last:border-b-0"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[oklch(0.18_0.018_55)] font-body truncate">{item.description}</p>
                <p className="text-xs text-[oklch(0.52_0.02_60)] font-body">
                  {item.quantity} × {(parseFloat(item.unitPrice) || 0).toFixed(2)}€
                </p>
              </div>
              <p className="text-sm text-[oklch(0.18_0.018_55)] font-body whitespace-nowrap" style={{ fontWeight: 500 }}>
                {amountOf(item).toFixed(2)}€
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => openEdit(i)}
                  className="p-1.5 text-[oklch(0.52_0.02_60)] hover:text-[oklch(0.52_0.08_148)] transition-colors"
                  title="Editar línea"
                >
                  <Pencil size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  className="p-1.5 text-[oklch(0.52_0.02_60)] hover:text-red-500 transition-colors"
                  title="Eliminar línea"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md" style={{ borderRadius: 0 }}>
          <DialogHeader>
            <DialogTitle className="font-display text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 400 }}>
              {editingIndex !== null ? "Editar línea" : "Añadir línea"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className={labelClass} style={{ fontWeight: 500 }}>
                Concepto <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                autoFocus
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                placeholder="ej: Masaje terapéutico 60 min"
                className={inputClass}
                style={{ borderRadius: 0 }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass} style={{ fontWeight: 500 }}>Cantidad</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={draft.quantity}
                  onChange={(e) => setDraft((d) => ({ ...d, quantity: e.target.value }))}
                  className={inputClass}
                  style={{ borderRadius: 0 }}
                />
              </div>
              <div>
                <label className={labelClass} style={{ fontWeight: 500 }}>Precio unitario (€)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={draft.unitPrice}
                  onChange={(e) => setDraft((d) => ({ ...d, unitPrice: e.target.value }))}
                  placeholder="0.00"
                  className={inputClass}
                  style={{ borderRadius: 0 }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between px-3 py-2.5 bg-[oklch(0.97_0.006_85)] border border-[oklch(0.92_0.01_80)]">
              <span className="text-xs text-[oklch(0.52_0.02_60)] font-body uppercase tracking-wider">Importe</span>
              <span className="text-sm text-[oklch(0.18_0.018_55)] font-body" style={{ fontWeight: 600 }}>
                {amountOf(draft).toFixed(2)}€
              </span>
            </div>
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="inline-flex items-center px-5 py-2.5 border border-[oklch(0.92_0.01_80)] text-[oklch(0.38_0.02_55)] text-xs tracking-widest uppercase font-body hover:border-[oklch(0.52_0.08_148)] transition-colors"
              style={{ borderRadius: 0, letterSpacing: "0.08em" }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!draft.description.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-body hover:bg-[oklch(0.38_0.07_148)] transition-colors disabled:opacity-50"
              style={{ borderRadius: 0, letterSpacing: "0.08em" }}
            >
              {editingIndex !== null ? "Guardar cambios" : "Añadir línea"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
