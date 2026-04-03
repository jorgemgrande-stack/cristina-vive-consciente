/**
 * CRM FacturaForm — Nueva factura
 */

import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import CRMLayout from "@/components/CRMLayout";

export default function FacturaForm() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const preClientId = params.get("clientId") ? parseInt(params.get("clientId")!) : undefined;
  const [, navigate] = useLocation();

  const { data: clients } = trpc.crm.clients.list.useQuery({});
  const { data: nextNumber } = trpc.crm.invoices.nextNumber.useQuery();

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    clientId: preClientId ?? 0,
    concept: "",
    subtotal: "",
    tax: "0",
    total: "",
    notes: "",
    issuedDate: today,
    dueDate: "",
  });

  // Auto-calculate total
  useEffect(() => {
    const sub = parseFloat(form.subtotal) || 0;
    const tax = parseFloat(form.tax) || 0;
    const total = sub + (sub * tax) / 100;
    setForm((f) => ({ ...f, total: total > 0 ? total.toFixed(2) : "" }));
  }, [form.subtotal, form.tax]);

  const createMutation = trpc.crm.invoices.create.useMutation({
    onSuccess: () => {
      toast.success("Factura creada correctamente");
      if (preClientId) navigate(`/crm/clientes/${preClientId}`);
      else navigate("/crm/facturas");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientId) { toast.error("Selecciona un cliente"); return; }
    if (!form.concept.trim()) { toast.error("El concepto es obligatorio"); return; }
    if (!form.total) { toast.error("Introduce el importe"); return; }

    const issuedAt = new Date(form.issuedDate).getTime();
    const dueAt = form.dueDate ? new Date(form.dueDate).getTime() : undefined;

    createMutation.mutate({
      clientId: form.clientId,
      concept: form.concept,
      subtotal: form.subtotal || form.total,
      tax: form.tax || "0",
      total: form.total,
      notes: form.notes || undefined,
      issuedAt,
      dueAt,
    });
  };

  const inputClass = "w-full px-3 py-2.5 text-sm bg-white border border-[oklch(0.92_0.01_80)] text-[oklch(0.18_0.018_55)] focus:outline-none focus:border-[oklch(0.52_0.08_148)] transition-colors font-body";
  const labelClass = "block text-xs text-[oklch(0.38_0.02_55)] font-body mb-1.5 uppercase tracking-wider";

  return (
    <CRMLayout title="Nueva factura">
      <div className="max-w-2xl">
        <Link
          href={preClientId ? `/crm/clientes/${preClientId}` : "/crm/facturas"}
          className="inline-flex items-center gap-1.5 text-xs text-[oklch(0.52_0.02_60)] font-body hover:text-[oklch(0.52_0.08_148)] transition-colors no-underline mb-6"
        >
          <ArrowLeft size={13} /> Volver
        </Link>

        <form onSubmit={handleSubmit} className="bg-white border border-[oklch(0.92_0.01_80)] p-6 space-y-5">
          {/* Número de factura (informativo) */}
          {nextNumber && (
            <div className="bg-[oklch(0.97_0.006_85)] border border-[oklch(0.92_0.01_80)] px-4 py-3 flex items-center justify-between">
              <p className="text-xs text-[oklch(0.52_0.02_60)] font-body uppercase tracking-wider" style={{ fontWeight: 500 }}>
                Número de factura
              </p>
              <p className="font-mono text-sm text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 500 }}>
                {nextNumber}
              </p>
            </div>
          )}

          {/* Cliente */}
          <div>
            <label className={labelClass} style={{ fontWeight: 500 }}>
              Cliente <span className="text-red-500">*</span>
            </label>
            <select
              value={form.clientId || ""}
              onChange={(e) => setForm((f) => ({ ...f, clientId: parseInt(e.target.value) }))}
              required
              className={inputClass}
              style={{ borderRadius: 0 }}
            >
              <option value="">Seleccionar cliente...</option>
              {clients?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* Concepto */}
          <div>
            <label className={labelClass} style={{ fontWeight: 500 }}>
              Concepto <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.concept}
              onChange={(e) => setForm((f) => ({ ...f, concept: e.target.value }))}
              placeholder="ej: Consulta holística de acompañamiento"
              required
              className={inputClass}
              style={{ borderRadius: 0 }}
            />
          </div>

          {/* Importes */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass} style={{ fontWeight: 500 }}>Base imponible (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.subtotal}
                onChange={(e) => setForm((f) => ({ ...f, subtotal: e.target.value }))}
                placeholder="0.00"
                className={inputClass}
                style={{ borderRadius: 0 }}
              />
            </div>
            <div>
              <label className={labelClass} style={{ fontWeight: 500 }}>IVA (%)</label>
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                value={form.tax}
                onChange={(e) => setForm((f) => ({ ...f, tax: e.target.value }))}
                placeholder="0"
                className={inputClass}
                style={{ borderRadius: 0 }}
              />
            </div>
            <div>
              <label className={labelClass} style={{ fontWeight: 500 }}>Total (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.total}
                onChange={(e) => setForm((f) => ({ ...f, total: e.target.value }))}
                placeholder="0.00"
                required
                className={`${inputClass} bg-[oklch(0.97_0.006_85)]`}
                style={{ borderRadius: 0 }}
              />
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass} style={{ fontWeight: 500 }}>Fecha de emisión</label>
              <input
                type="date"
                value={form.issuedDate}
                onChange={(e) => setForm((f) => ({ ...f, issuedDate: e.target.value }))}
                className={inputClass}
                style={{ borderRadius: 0 }}
              />
            </div>
            <div>
              <label className={labelClass} style={{ fontWeight: 500 }}>Fecha de vencimiento</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                className={inputClass}
                style={{ borderRadius: 0 }}
              />
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className={labelClass} style={{ fontWeight: 500 }}>Notas</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              className={`${inputClass} resize-none`}
              style={{ borderRadius: 0 }}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-body hover:bg-[oklch(0.38_0.07_148)] transition-colors disabled:opacity-60"
              style={{ borderRadius: 0, letterSpacing: "0.08em" }}
            >
              {createMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              Crear factura
            </button>
            <Link
              href={preClientId ? `/crm/clientes/${preClientId}` : "/crm/facturas"}
              className="inline-flex items-center px-6 py-2.5 border border-[oklch(0.92_0.01_80)] text-[oklch(0.38_0.02_55)] text-xs tracking-widest uppercase font-body hover:border-[oklch(0.52_0.08_148)] transition-colors no-underline"
              style={{ borderRadius: 0, letterSpacing: "0.08em" }}
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </CRMLayout>
  );
}
