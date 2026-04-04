/**
 * CRM FacturaDetalle — Ver y editar una factura existente
 * Incluye botón de descarga PDF
 */

import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Download, Save, Loader2, FileText } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import CRMLayout from "@/components/CRMLayout";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft:     { label: "Borrador",   color: "bg-gray-100 text-gray-600" },
  sent:      { label: "Enviada",    color: "bg-blue-100 text-blue-700" },
  paid:      { label: "Pagada",     color: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelada",  color: "bg-red-100 text-red-700" },
};

export default function FacturaDetalle() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id ?? "0", 10);
  const [, navigate] = useLocation();

  const { data: invoiceData, isLoading, refetch } = trpc.crm.invoices.get.useQuery({ id }, { enabled: !!id });
  const { data: clients } = trpc.crm.clients.list.useQuery({});

  const [form, setForm] = useState({
    clientId: 0,
    concept: "",
    subtotal: "",
    tax: "0",
    total: "",
    notes: "",
    status: "draft" as "draft" | "sent" | "paid" | "cancelled",
    issuedDate: "",
    dueDate: "",
    paidDate: "",
  });

  // Populate form when data loads
  useEffect(() => {
    if (!invoiceData) return;
    const inv = invoiceData.invoice;
    setForm({
      clientId: inv.clientId,
      concept: inv.concept ?? "",
      subtotal: inv.subtotal?.toString() ?? "",
      tax: inv.tax?.toString() ?? "0",
      total: inv.total?.toString() ?? "",
      notes: inv.notes ?? "",
      status: inv.status as any,
      issuedDate: inv.issuedAt ? new Date(inv.issuedAt).toISOString().split("T")[0] : "",
      dueDate: inv.dueAt ? new Date(inv.dueAt).toISOString().split("T")[0] : "",
      paidDate: inv.paidAt ? new Date(inv.paidAt).toISOString().split("T")[0] : "",
    });
  }, [invoiceData]);

  // Auto-calculate total
  useEffect(() => {
    const sub = parseFloat(form.subtotal) || 0;
    const tax = parseFloat(form.tax) || 0;
    const total = sub + (sub * tax) / 100;
    setForm((f) => ({ ...f, total: total > 0 ? total.toFixed(2) : f.total }));
  }, [form.subtotal, form.tax]);

  const updateMutation = trpc.crm.invoices.update.useMutation({
    onSuccess: () => {
      toast.success("Factura actualizada");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      id,
      status: form.status,
      notes: form.notes || undefined,
      paidAt: form.paidDate ? new Date(form.paidDate).getTime() : undefined,
    });
  };

  const inputClass = "w-full px-3 py-2.5 text-sm bg-white border border-[oklch(0.92_0.01_80)] text-[oklch(0.18_0.018_55)] focus:outline-none focus:border-[oklch(0.52_0.08_148)] transition-colors font-body";
  const labelClass = "block text-xs text-[oklch(0.38_0.02_55)] font-body mb-1.5 uppercase tracking-wider";

  if (isLoading) {
    return (
      <CRMLayout title="Factura">
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-[oklch(0.52_0.08_148)] border-t-transparent rounded-full animate-spin" />
        </div>
      </CRMLayout>
    );
  }

  if (!invoiceData) {
    return (
      <CRMLayout title="Factura">
        <div className="text-center py-20">
          <FileText size={32} className="mx-auto text-[oklch(0.88_0.015_75)] mb-3" />
          <p className="text-sm text-[oklch(0.52_0.02_60)] font-body">Factura no encontrada</p>
          <Link href="/crm/facturas" className="inline-flex items-center gap-1.5 mt-4 text-[oklch(0.52_0.08_148)] text-xs font-body hover:underline no-underline">
            <ArrowLeft size={13} /> Volver a facturas
          </Link>
        </div>
      </CRMLayout>
    );
  }

  const { invoice: inv } = invoiceData;
  const sc = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.draft;

  return (
    <CRMLayout title={`Factura ${inv.invoiceNumber}`}>
      <div className="max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/crm/facturas"
            className="inline-flex items-center gap-1.5 text-xs text-[oklch(0.52_0.02_60)] font-body hover:text-[oklch(0.52_0.08_148)] transition-colors no-underline"
          >
            <ArrowLeft size={13} /> Volver a facturas
          </Link>

          {/* Botón PDF */}
          <a
            href={`/api/invoices/${inv.id}/pdf`}
            download={`factura-${inv.invoiceNumber}.pdf`}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-[oklch(0.52_0.08_148)] text-[oklch(0.52_0.08_148)] text-xs tracking-widest uppercase font-body hover:bg-[oklch(0.52_0.08_148)]/5 transition-colors"
            style={{ borderRadius: 0, letterSpacing: "0.08em" }}
          >
            <Download size={13} />
            Descargar PDF
          </a>
        </div>

        {/* Info badge */}
        <div className="flex items-center gap-3 mb-5">
          <span className="font-mono text-base text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 600 }}>
            {inv.invoiceNumber}
          </span>
          <span className={`text-[0.6rem] px-2 py-0.5 font-body uppercase tracking-wider ${sc.color}`}>
            {sc.label}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-[oklch(0.92_0.01_80)] p-6 space-y-5">
          {/* Estado */}
          <div>
            <label className={labelClass} style={{ fontWeight: 500 }}>Estado</label>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as any }))}
              className={inputClass}
              style={{ borderRadius: 0 }}
            >
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

          {/* Cliente */}
          <div>
            <label className={labelClass} style={{ fontWeight: 500 }}>
              Cliente
            </label>
            <select
              value={form.clientId || ""}
              onChange={(e) => setForm((f) => ({ ...f, clientId: parseInt(e.target.value) }))}
              className={inputClass}
              style={{ borderRadius: 0 }}
            >
              <option value="">Sin cliente</option>
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
          <div className="grid grid-cols-3 gap-4">
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
              <label className={labelClass} style={{ fontWeight: 500 }}>Vencimiento</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                className={inputClass}
                style={{ borderRadius: 0 }}
              />
            </div>
            <div>
              <label className={labelClass} style={{ fontWeight: 500 }}>Fecha de pago</label>
              <input
                type="date"
                value={form.paidDate}
                onChange={(e) => setForm((f) => ({ ...f, paidDate: e.target.value }))}
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
              disabled={updateMutation.isPending}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-body hover:bg-[oklch(0.38_0.07_148)] transition-colors disabled:opacity-60"
              style={{ borderRadius: 0, letterSpacing: "0.08em" }}
            >
              {updateMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              Guardar cambios
            </button>
            <Link
              href="/crm/facturas"
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
