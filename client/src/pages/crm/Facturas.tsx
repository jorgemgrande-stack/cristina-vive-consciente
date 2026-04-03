/**
 * CRM Facturas — Listado de facturas
 */

import { useState } from "react";
import { Link } from "wouter";
import { Plus, FileText, ChevronDown, ArrowRight, Download } from "lucide-react";
import { trpc } from "@/lib/trpc";
import CRMLayout from "@/components/CRMLayout";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: "Borrador", color: "bg-gray-100 text-gray-600" },
  sent: { label: "Enviada", color: "bg-blue-100 text-blue-700" },
  paid: { label: "Pagada", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelada", color: "bg-red-100 text-red-700" },
};

export default function CRMFacturas() {
  const [status, setStatus] = useState("all");

  const { data: invoices, isLoading, refetch } = trpc.crm.invoices.list.useQuery({
    status: status !== "all" ? status : undefined,
  });

  const updateStatus = trpc.crm.invoices.update.useMutation({
    onSuccess: () => refetch(),
  });

  return (
    <CRMLayout title="Facturas">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2.5 text-sm bg-white border border-[oklch(0.92_0.01_80)] text-[oklch(0.38_0.02_55)] focus:outline-none focus:border-[oklch(0.52_0.08_148)] transition-colors font-body cursor-pointer"
            style={{ borderRadius: 0 }}
          >
            <option value="all">Todas</option>
            <option value="draft">Borradores</option>
            <option value="sent">Enviadas</option>
            <option value="paid">Pagadas</option>
            <option value="cancelled">Canceladas</option>
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[oklch(0.52_0.02_60)] pointer-events-none" />
        </div>
        <div className="ml-auto">
          <Link
            href="/crm/facturas/nueva"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-body hover:bg-[oklch(0.38_0.07_148)] transition-colors no-underline"
            style={{ borderRadius: 0, letterSpacing: "0.08em" }}
          >
            <Plus size={14} />
            Nueva factura
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[oklch(0.92_0.01_80)]">
        <div className="hidden md:grid grid-cols-[1fr_2fr_1.5fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-[oklch(0.92_0.01_80)] bg-[oklch(0.97_0.006_85)]">
          {["Nº Factura", "Cliente", "Concepto", "Total", "Estado", ""].map((h) => (
            <p key={h} className="text-[0.65rem] text-[oklch(0.52_0.02_60)] font-body uppercase tracking-widest" style={{ fontWeight: 500 }}>
              {h}
            </p>
          ))}
        </div>

        {isLoading ? (
          <div className="p-10 text-center">
            <div className="w-6 h-6 border-2 border-[oklch(0.52_0.08_148)] border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : !invoices || invoices.length === 0 ? (
          <div className="p-12 text-center">
            <FileText size={32} className="mx-auto text-[oklch(0.88_0.015_75)] mb-3" />
            <p className="text-sm text-[oklch(0.52_0.02_60)] font-body" style={{ fontWeight: 300 }}>
              No hay facturas registradas
            </p>
            <Link
              href="/crm/facturas/nueva"
              className="inline-flex items-center gap-1.5 mt-4 text-[oklch(0.52_0.08_148)] text-xs font-body hover:underline no-underline"
            >
              <Plus size={13} /> Crear primera factura
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[oklch(0.96_0.006_80)]">
            {invoices.map(({ invoice: inv, client }) => {
              const sc = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.draft;
              return (
                <div
                  key={inv.id}
                  className="grid grid-cols-1 md:grid-cols-[1fr_2fr_1.5fr_1fr_1fr_auto] gap-2 md:gap-4 px-5 py-4 hover:bg-[oklch(0.98_0.004_80)] transition-colors items-center"
                >
                  {/* Invoice number */}
                  <p className="text-sm text-[oklch(0.18_0.018_55)] font-body font-mono" style={{ fontWeight: 500 }}>
                    {inv.invoiceNumber}
                  </p>

                  {/* Client */}
                  <div>
                    {client ? (
                      <Link
                        href={`/crm/clientes/${client.id}`}
                        className="text-sm text-[oklch(0.18_0.018_55)] font-body hover:text-[oklch(0.52_0.08_148)] transition-colors no-underline"
                        style={{ fontWeight: 500 }}
                      >
                        {client.firstName} {client.lastName}
                      </Link>
                    ) : (
                      <p className="text-sm text-[oklch(0.52_0.02_60)] font-body">—</p>
                    )}
                    <p className="text-xs text-[oklch(0.52_0.02_60)] font-body" style={{ fontWeight: 300 }}>
                      {new Date(inv.issuedAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>

                  {/* Concept */}
                  <p className="text-xs text-[oklch(0.38_0.02_55)] font-body truncate" style={{ fontWeight: 300 }}>
                    {inv.concept}
                  </p>

                  {/* Total */}
                  <p className="text-sm text-[oklch(0.18_0.018_55)] font-body" style={{ fontWeight: 500 }}>
                    {inv.total}€
                  </p>

                  {/* Status */}
                  <div className="hidden md:flex items-center">
                    <div className="relative">
                      <select
                        value={inv.status}
                        onChange={(e) => updateStatus.mutate({ id: inv.id, status: e.target.value as any })}
                        className={`appearance-none text-[0.6rem] px-2 py-0.5 font-body uppercase tracking-wider cursor-pointer border-0 focus:outline-none ${sc.color}`}
                        style={{ borderRadius: 0 }}
                      >
                        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    {client && (
                      <Link
                        href={`/crm/clientes/${client.id}`}
                        className="w-7 h-7 flex items-center justify-center bg-[oklch(0.52_0.08_148)]/10 text-[oklch(0.52_0.08_148)] hover:bg-[oklch(0.52_0.08_148)]/20 transition-colors no-underline"
                        title="Ver cliente"
                      >
                        <ArrowRight size={13} />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {invoices && invoices.length > 0 && (
          <div className="px-5 py-3 border-t border-[oklch(0.92_0.01_80)] bg-[oklch(0.97_0.006_85)]">
            <p className="text-[0.65rem] text-[oklch(0.52_0.02_60)] font-body">
              {invoices.length} factura{invoices.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>
    </CRMLayout>
  );
}
