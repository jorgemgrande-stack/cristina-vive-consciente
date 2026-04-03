/**
 * CRM Citas — Listado y gestión de citas
 */

import { useState } from "react";
import { Link } from "wouter";
import { Plus, CalendarDays, MessageCircle, ChevronDown, Clock, ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import CRMLayout from "@/components/CRMLayout";

const SERVICE_LABELS: Record<string, string> = {
  consulta_acompanamiento: "Consulta Acompañamiento",
  consulta_naturopata: "Consulta Naturopata",
  consulta_breve: "Consulta Breve",
  consulta_express: "Consulta Express",
  biohabitabilidad: "Biohabitabilidad",
  kinesiologia: "Kinesiología",
  masaje: "Masaje",
  otro: "Otro",
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "bg-amber-100 text-amber-700" },
  confirmed: { label: "Confirmada", color: "bg-blue-100 text-blue-700" },
  completed: { label: "Completada", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelada", color: "bg-red-100 text-red-700" },
  rescheduled: { label: "Reprogramada", color: "bg-purple-100 text-purple-700" },
};

const MODALITY_LABELS: Record<string, string> = {
  presencial: "Presencial",
  telefono: "Teléfono",
  zoom: "Zoom",
  whatsapp: "WhatsApp",
};

export default function CRMCitas() {
  const [status, setStatus] = useState("all");

  const { data: appointments, isLoading, refetch } = trpc.crm.appointments.list.useQuery({
    status: status !== "all" ? status : undefined,
  });

  const updateStatus = trpc.crm.appointments.update.useMutation({
    onSuccess: () => refetch(),
  });

  return (
    <CRMLayout title="Citas">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2.5 text-sm bg-white border border-[oklch(0.92_0.01_80)] text-[oklch(0.38_0.02_55)] focus:outline-none focus:border-[oklch(0.52_0.08_148)] transition-colors font-body cursor-pointer"
            style={{ borderRadius: 0 }}
          >
            <option value="all">Todas las citas</option>
            <option value="pending">Pendientes</option>
            <option value="confirmed">Confirmadas</option>
            <option value="completed">Completadas</option>
            <option value="cancelled">Canceladas</option>
            <option value="rescheduled">Reprogramadas</option>
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[oklch(0.52_0.02_60)] pointer-events-none" />
        </div>
        <div className="ml-auto">
          <Link
            href="/crm/citas/nueva"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-body hover:bg-[oklch(0.38_0.07_148)] transition-colors no-underline"
            style={{ borderRadius: 0, letterSpacing: "0.08em" }}
          >
            <Plus size={14} />
            Nueva cita
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[oklch(0.92_0.01_80)]">
        <div className="hidden md:grid grid-cols-[1.5fr_2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-[oklch(0.92_0.01_80)] bg-[oklch(0.97_0.006_85)]">
          {["Fecha / Hora", "Cliente", "Servicio", "Modalidad", "Estado", ""].map((h) => (
            <p key={h} className="text-[0.65rem] text-[oklch(0.52_0.02_60)] font-body uppercase tracking-widest" style={{ fontWeight: 500 }}>
              {h}
            </p>
          ))}
        </div>

        {isLoading ? (
          <div className="p-10 text-center">
            <div className="w-6 h-6 border-2 border-[oklch(0.52_0.08_148)] border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : !appointments || appointments.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarDays size={32} className="mx-auto text-[oklch(0.88_0.015_75)] mb-3" />
            <p className="text-sm text-[oklch(0.52_0.02_60)] font-body" style={{ fontWeight: 300 }}>
              No hay citas registradas
            </p>
            <Link
              href="/crm/citas/nueva"
              className="inline-flex items-center gap-1.5 mt-4 text-[oklch(0.52_0.08_148)] text-xs font-body hover:underline no-underline"
            >
              <Plus size={13} /> Crear primera cita
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[oklch(0.96_0.006_80)]">
            {appointments.map(({ appointment: appt, client }) => {
              const sc = STATUS_CONFIG[appt.status] ?? STATUS_CONFIG.pending;
              return (
                <div
                  key={appt.id}
                  className="grid grid-cols-1 md:grid-cols-[1.5fr_2fr_1fr_1fr_1fr_auto] gap-2 md:gap-4 px-5 py-4 hover:bg-[oklch(0.98_0.004_80)] transition-colors items-center"
                >
                  {/* Date */}
                  <div>
                    <p className="text-sm text-[oklch(0.18_0.018_55)] font-body" style={{ fontWeight: 500 }}>
                      {new Date(appt.scheduledAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    <p className="text-xs text-[oklch(0.52_0.02_60)] font-body flex items-center gap-1" style={{ fontWeight: 300 }}>
                      <Clock size={10} />
                      {new Date(appt.scheduledAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                      {appt.durationMinutes ? ` · ${appt.durationMinutes}min` : ""}
                    </p>
                  </div>

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
                    {client?.phone && (
                      <p className="text-xs text-[oklch(0.52_0.02_60)] font-body" style={{ fontWeight: 300 }}>
                        {client.phone}
                      </p>
                    )}
                  </div>

                  {/* Service */}
                  <p className="text-xs text-[oklch(0.38_0.02_55)] font-body" style={{ fontWeight: 300 }}>
                    {SERVICE_LABELS[appt.serviceType] ?? appt.serviceType}
                    {appt.price ? ` · ${appt.price}€` : ""}
                  </p>

                  {/* Modality */}
                  <p className="hidden md:block text-xs text-[oklch(0.52_0.02_60)] font-body" style={{ fontWeight: 300 }}>
                    {appt.modality ? (MODALITY_LABELS[appt.modality] ?? appt.modality) : "—"}
                  </p>

                  {/* Status */}
                  <div className="hidden md:flex items-center gap-2">
                    <div className="relative">
                      <select
                        value={appt.status}
                        onChange={(e) => updateStatus.mutate({ id: appt.id, status: e.target.value as any })}
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
                    {client?.phone && (
                      <a
                        href={`https://wa.me/${client.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7 h-7 flex items-center justify-center bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                        title="WhatsApp"
                      >
                        <MessageCircle size={13} />
                      </a>
                    )}
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

        {appointments && appointments.length > 0 && (
          <div className="px-5 py-3 border-t border-[oklch(0.92_0.01_80)] bg-[oklch(0.97_0.006_85)]">
            <p className="text-[0.65rem] text-[oklch(0.52_0.02_60)] font-body">
              {appointments.length} cita{appointments.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>
    </CRMLayout>
  );
}
