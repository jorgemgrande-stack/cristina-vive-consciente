/**
 * CRM Citas — Listado y gestión de citas
 */

import { useState } from "react";
import { Link } from "wouter";
import { Plus, CalendarDays, MessageCircle, ChevronDown, Clock, ArrowRight, Check, X, RefreshCw, Loader2, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
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
  const [cancelModal, setCancelModal] = useState<{ apptId: number; scheduledAt: number; serviceLabel: string } | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [proposeModal, setProposeModal] = useState<{ apptId: number; serviceLabel: string } | null>(null);
  const [slots, setSlots] = useState<Array<{ date: string; time: string }>>([{ date: "", time: "10:00" }]);

  const { data: appointments, isLoading, refetch } = trpc.crm.appointments.list.useQuery({
    status: status !== "all" ? status : undefined,
  });

  const updateStatus = trpc.crm.appointments.update.useMutation({
    onSuccess: () => refetch(),
  });

  const acceptAppt = trpc.crm.appointments.accept.useMutation({
    onSuccess: () => { refetch(); toast.success("Cita confirmada y email enviado"); },
    onError: (e) => toast.error(e.message),
  });

  const cancelAppt = trpc.crm.appointments.cancelWithReason.useMutation({
    onSuccess: () => { refetch(); setCancelModal(null); setCancelReason(""); toast.success("Cita cancelada y email enviado"); },
    onError: (e) => toast.error(e.message),
  });

  const proposeSlotsMut = trpc.crm.appointments.proposeSlots.useMutation({
    onSuccess: () => { refetch(); setProposeModal(null); setSlots([{ date: "", time: "10:00" }]); toast.success("Propuesta enviada al cliente"); },
    onError: (e) => toast.error(e.message),
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
              const isPending = appt.status === "pending";
              const svcLabel = (appt as any).serviceLabel ?? SERVICE_LABELS[appt.serviceType] ?? appt.serviceType;
              return (
                <div
                  key={appt.id}
                  className={`px-5 py-4 hover:bg-[oklch(0.98_0.004_80)] transition-colors ${isPending ? "border-l-2 border-l-amber-400" : ""}`}
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
                    {svcLabel}
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

                {/* Botones de acción rápida para citas PENDIENTES */}
                {isPending && (
                  <div className="grid grid-cols-1 md:grid-cols-[1.5fr_2fr_1fr_1fr_1fr_auto] gap-2 md:gap-4 px-5 pb-3">
                    <div className="md:col-start-2 flex flex-wrap gap-2">
                      <button
                        onClick={() => acceptAppt.mutate({ id: appt.id })}
                        disabled={acceptAppt.isPending}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-600 text-white text-[0.6rem] font-body uppercase tracking-wider hover:bg-green-700 transition-colors disabled:opacity-60"
                        style={{ borderRadius: 0, letterSpacing: "0.07em" }}
                        title="Aceptar cita"
                      >
                        {acceptAppt.isPending ? <Loader2 size={9} className="animate-spin" /> : <Check size={9} />}
                        Aceptar
                      </button>
                      <button
                        onClick={() => { setCancelModal({ apptId: appt.id, scheduledAt: appt.scheduledAt, serviceLabel: svcLabel }); setCancelReason(""); }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 text-[0.6rem] font-body uppercase tracking-wider hover:bg-red-200 transition-colors border border-red-200"
                        style={{ borderRadius: 0, letterSpacing: "0.07em" }}
                        title="Cancelar cita"
                      >
                        <X size={9} /> Cancelar
                      </button>
                      <button
                        onClick={() => { setProposeModal({ apptId: appt.id, serviceLabel: svcLabel }); setSlots([{ date: "", time: "10:00" }]); }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-700 text-[0.6rem] font-body uppercase tracking-wider hover:bg-purple-200 transition-colors border border-purple-200"
                        style={{ borderRadius: 0, letterSpacing: "0.07em" }}
                        title="Proponer nuevas fechas"
                      >
                        <RefreshCw size={9} /> Proponer fechas
                      </button>
                    </div>
                  </div>
                )}
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

      {/* ── MODAL CANCELAR ── */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setCancelModal(null)} />
          <div className="relative bg-white border border-[oklch(0.92_0.01_80)] w-full max-w-md p-6 space-y-4" style={{ borderRadius: 0 }}>
            <h3 className="font-display text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 400, fontSize: "1.1rem" }}>Cancelar cita</h3>
            <p className="text-sm text-[oklch(0.52_0.02_60)] font-body" style={{ fontWeight: 300 }}>
              <strong>{cancelModal.serviceLabel}</strong> · {new Date(cancelModal.scheduledAt).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <div>
              <label className="block text-xs text-[oklch(0.38_0.02_55)] font-body mb-1.5 uppercase tracking-wider" style={{ fontWeight: 500 }}>
                Motivo <span className="text-red-500">*</span>
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                placeholder="Explica brevemente el motivo..."
                className="w-full px-3 py-2.5 text-sm bg-white border border-[oklch(0.92_0.01_80)] text-[oklch(0.18_0.018_55)] focus:outline-none focus:border-red-400 transition-colors font-body resize-none"
                style={{ borderRadius: 0 }}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { if (!cancelReason.trim()) { toast.error("Escribe el motivo"); return; } cancelAppt.mutate({ id: cancelModal.apptId, reason: cancelReason }); }}
                disabled={cancelAppt.isPending || !cancelReason.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white text-xs font-body uppercase tracking-wider hover:bg-red-700 transition-colors disabled:opacity-60"
                style={{ borderRadius: 0, letterSpacing: "0.07em" }}
              >
                {cancelAppt.isPending ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                Confirmar cancelación
              </button>
              <button onClick={() => setCancelModal(null)} className="px-4 py-2.5 border border-[oklch(0.92_0.01_80)] text-[oklch(0.38_0.02_55)] text-xs font-body hover:border-[oklch(0.52_0.08_148)] transition-colors" style={{ borderRadius: 0 }}>
                Volver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL PROPONER FECHAS ── */}
      {proposeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setProposeModal(null)} />
          <div className="relative bg-white border border-[oklch(0.92_0.01_80)] w-full max-w-lg p-6 space-y-4" style={{ borderRadius: 0 }}>
            <h3 className="font-display text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 400, fontSize: "1.1rem" }}>Proponer nuevas fechas</h3>
            <p className="text-sm text-[oklch(0.52_0.02_60)] font-body" style={{ fontWeight: 300 }}>El cliente recibirá un email para elegir entre las opciones.</p>
            <div className="space-y-3">
              {slots.map((slot, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[0.65rem] text-[oklch(0.52_0.02_60)] font-body w-14 flex-shrink-0" style={{ fontWeight: 500 }}>Opción {i + 1}</span>
                  <input type="date" value={slot.date} onChange={(e) => { const u = [...slots]; u[i] = { ...u[i], date: e.target.value }; setSlots(u); }} className="flex-1 px-2 py-2 text-sm border border-[oklch(0.92_0.01_80)] focus:outline-none focus:border-[oklch(0.52_0.08_148)] font-body" style={{ borderRadius: 0 }} />
                  <input type="time" value={slot.time} onChange={(e) => { const u = [...slots]; u[i] = { ...u[i], time: e.target.value }; setSlots(u); }} className="w-24 px-2 py-2 text-sm border border-[oklch(0.92_0.01_80)] focus:outline-none focus:border-[oklch(0.52_0.08_148)] font-body" style={{ borderRadius: 0 }} />
                  {slots.length > 1 && <button onClick={() => setSlots(slots.filter((_, idx) => idx !== i))} className="text-[oklch(0.52_0.02_60)] hover:text-red-500 transition-colors"><X size={14} /></button>}
                </div>
              ))}
            </div>
            {slots.length < 5 && (
              <button onClick={() => setSlots([...slots, { date: "", time: "10:00" }])} className="inline-flex items-center gap-1.5 text-xs text-[oklch(0.52_0.08_148)] font-body hover:underline">
                <Plus size={12} /> Añadir opción
              </button>
            )}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { const v = slots.filter((s) => s.date && s.time); if (!v.length) { toast.error("Añade al menos una fecha"); return; } proposeSlotsMut.mutate({ id: proposeModal.apptId, slots: v }); }}
                disabled={proposeSlotsMut.isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[oklch(0.52_0.08_148)] text-white text-xs font-body uppercase tracking-wider hover:bg-[oklch(0.38_0.07_148)] transition-colors disabled:opacity-60"
                style={{ borderRadius: 0, letterSpacing: "0.07em" }}
              >
                {proposeSlotsMut.isPending ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                Enviar propuesta
              </button>
              <button onClick={() => setProposeModal(null)} className="px-4 py-2.5 border border-[oklch(0.92_0.01_80)] text-[oklch(0.38_0.02_55)] text-xs font-body hover:border-[oklch(0.52_0.08_148)] transition-colors" style={{ borderRadius: 0 }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </CRMLayout>
  );
}
