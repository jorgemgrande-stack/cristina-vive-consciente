/**
 * CRM Citas — Listado y gestión de citas
 */

import { formatPhoneDisplay, whatsappNumber } from "@shared/phone";
import { confirmationWhatsAppText } from "@shared/booking";
import { useState } from "react";
import { Link } from "wouter";
import { Plus, CalendarDays, MessageCircle, ChevronDown, Clock, ArrowRight, Check, X, RefreshCw, Loader2, History, Search, MapPin, Home as HomeIcon } from "lucide-react";
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
  pending: { label: "Pendiente de confirmar", color: "bg-amber-100 text-amber-700" },
  confirmed: { label: "Confirmada", color: "bg-blue-100 text-blue-700" },
  completed: { label: "Completada", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelada", color: "bg-red-100 text-red-700" },
  rescheduled: { label: "Fechas propuestas", color: "bg-purple-100 text-purple-700" },
};

const MODALITY_LABELS: Record<string, string> = {
  presencial: "Presencial",
  telefono: "Teléfono",
  zoom: "Zoom",
  whatsapp: "WhatsApp",
};

export default function CRMCitas() {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [cancelModal, setCancelModal] = useState<{ apptId: number; scheduledAt: number; serviceLabel: string } | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [proposeModal, setProposeModal] = useState<{ apptId: number; serviceLabel: string } | null>(null);
  const [slots, setSlots] = useState<Array<{ date: string; time: string }>>([{ date: "", time: "10:00" }]);

  const { data: appointments, isLoading, refetch } = trpc.crm.appointments.list.useQuery({
    serviceType: serviceFilter !== "all" ? serviceFilter : undefined,
    from: fromDate ? new Date(fromDate + "T00:00:00").getTime() : undefined,
    to: toDate ? new Date(toDate + "T23:59:59").getTime() : undefined,
  });

  const updateStatus = trpc.crm.appointments.update.useMutation({
    onSuccess: () => refetch(),
  });

  const acceptAppt = trpc.crm.appointments.accept.useMutation({
    onSuccess: () => { refetch(); toast.success("Cita confirmada. En «Historial» ves si el email al cliente se envió."); },
    onError: (e) => toast.error(e.message),
  });

  const cancelAppt = trpc.crm.appointments.cancelWithReason.useMutation({
    onSuccess: () => { refetch(); setCancelModal(null); setCancelReason(""); toast.success("Cita cancelada. En «Historial» ves si el email se envió."); },
    onError: (e) => toast.error(e.message),
  });

  const proposeSlotsMut = trpc.crm.appointments.proposeSlots.useMutation({
    onSuccess: () => { refetch(); setProposeModal(null); setSlots([{ date: "", time: "10:00" }]); toast.success("Propuesta registrada. En «Historial» ves si el email se envió."); },
    onError: (e) => toast.error(e.message),
  });

  // ── Datos derivados: grupos por «qué hay que hacer» ─────────────────────────
  const all = appointments ?? [];
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
  const today0 = startOfToday.getTime();
  const q = search.trim().toLowerCase();
  const qDigits = q.replace(/\D/g, "");
  const matches = (r: Row) => {
    if (!q) return true;
    const name = `${r.client?.firstName ?? ""} ${r.client?.lastName ?? ""}`.toLowerCase();
    const phone = (r.client?.phone ?? "").replace(/\D/g, "");
    return name.includes(q) || (qDigits.length >= 3 && phone.includes(qDigits));
  };
  const visible = all.filter(matches);
  const byDateAsc = (a: Row, b: Row) => Number(a.appointment.scheduledAt) - Number(b.appointment.scheduledAt);
  const byDateDesc = (a: Row, b: Row) => byDateAsc(b, a);

  const groups: Group[] = [
    {
      id: "pending",
      title: "Requieren tu respuesta",
      hint: "Solicitudes nuevas: confírmalas, recházalas o propón otra fecha.",
      tone: "amber",
      byDay: true,
      items: visible.filter((r) => r.appointment.status === "pending").sort(byDateAsc),
    },
    {
      id: "rescheduled",
      title: "Esperando al cliente",
      hint: "Has propuesto otras fechas; el cliente aún no ha elegido.",
      tone: "purple",
      byDay: true,
      items: visible.filter((r) => r.appointment.status === "rescheduled").sort(byDateAsc),
    },
    {
      id: "upcoming",
      title: "Próximas citas confirmadas",
      hint: "Ordenadas por fecha.",
      tone: "blue",
      byDay: true,
      items: visible.filter((r) => r.appointment.status === "confirmed" && Number(r.appointment.scheduledAt) >= today0).sort(byDateAsc),
    },
    {
      id: "history",
      title: "Historial",
      hint: "Completadas, canceladas y citas pasadas. Lo más reciente primero.",
      tone: "gray",
      byDay: false,
      items: visible
        .filter((r) => ["completed", "cancelled"].includes(r.appointment.status) || (r.appointment.status === "confirmed" && Number(r.appointment.scheduledAt) < today0))
        .sort(byDateDesc),
    },
  ];
  const countOf = (id: string) => groups.find((g) => g.id === id)?.items.length ?? 0;
  const shownGroups = tab === "all" ? groups : groups.filter((g) => g.id === tab);
  const shownCount = shownGroups.reduce((n, g) => n + g.items.length, 0);

  const TABS: Array<{ id: string; label: string; count: number; alert?: boolean }> = [
    { id: "all", label: "Todas", count: visible.length },
    { id: "pending", label: "Por responder", count: countOf("pending"), alert: true },
    { id: "rescheduled", label: "Esperando al cliente", count: countOf("rescheduled") },
    { id: "upcoming", label: "Próximas", count: countOf("upcoming") },
    { id: "history", label: "Historial", count: countOf("history") },
  ];

  const input = "px-3 py-2.5 text-sm bg-white border border-[oklch(0.92_0.01_80)] text-[oklch(0.38_0.02_55)] focus:outline-none focus:border-[oklch(0.52_0.08_148)] transition-colors font-body";

  return (
    <CRMLayout title="Citas">
      {/* Resumen / pestañas */}
      <div className="flex flex-wrap items-center gap-2 mb-5" role="tablist" aria-label="Estado de las citas">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-body tracking-wide border transition-colors ${
              tab === t.id
                ? "bg-[oklch(0.52_0.08_148)] border-[oklch(0.52_0.08_148)] text-white"
                : "bg-white border-[oklch(0.92_0.01_80)] text-[oklch(0.38_0.02_55)] hover:border-[oklch(0.52_0.08_148)]"
            }`}
            style={{ fontWeight: 500 }}
          >
            {t.label}
            <span
              className={`min-w-[1.4rem] px-1.5 py-0.5 text-[0.65rem] text-center ${
                tab === t.id
                  ? "bg-white/20 text-white"
                  : t.alert && t.count > 0
                    ? "bg-amber-500 text-white"
                    : "bg-[oklch(0.95_0.008_80)] text-[oklch(0.45_0.02_55)]"
              }`}
              style={{ fontWeight: 600 }}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[oklch(0.62_0.02_60)]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o teléfono"
            className={`${input} w-full pl-9`}
            style={{ borderRadius: 0 }}
          />
        </div>
        <div className="relative">
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className={`${input} appearance-none pr-8 cursor-pointer`}
            style={{ borderRadius: 0 }}
          >
            <option value="all">Todos los servicios</option>
            <option value="masaje">Masajes</option>
            <option value="consulta">Consultas y otros</option>
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[oklch(0.52_0.02_60)] pointer-events-none" />
        </div>
        <label className="flex items-center gap-2 text-xs text-[oklch(0.52_0.02_60)] font-body">
          Desde
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={`${input} py-2`} style={{ borderRadius: 0 }} />
        </label>
        <label className="flex items-center gap-2 text-xs text-[oklch(0.52_0.02_60)] font-body">
          Hasta
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={`${input} py-2`} style={{ borderRadius: 0 }} />
        </label>
        {(fromDate || toDate || search || serviceFilter !== "all") && (
          <button
            onClick={() => { setFromDate(""); setToDate(""); setSearch(""); setServiceFilter("all"); }}
            className="text-xs text-[oklch(0.52_0.08_148)] font-body hover:underline text-left"
          >
            Quitar filtros
          </button>
        )}
        <div className="lg:ml-auto">
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

      {isLoading ? (
        <div className="bg-white border border-[oklch(0.92_0.01_80)] p-10 text-center">
          <div className="w-6 h-6 border-2 border-[oklch(0.52_0.08_148)] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : shownCount === 0 ? (
        <div className="bg-white border border-[oklch(0.92_0.01_80)] p-12 text-center">
          <CalendarDays size={32} className="mx-auto text-[oklch(0.88_0.015_75)] mb-3" />
          <p className="text-sm text-[oklch(0.52_0.02_60)] font-body" style={{ fontWeight: 300 }}>
            {all.length === 0 ? "No hay citas registradas" : "Ninguna cita coincide con los filtros"}
          </p>
          {all.length === 0 && (
            <Link href="/crm/citas/nueva" className="inline-flex items-center gap-1.5 mt-4 text-[oklch(0.52_0.08_148)] text-xs font-body hover:underline no-underline">
              <Plus size={13} /> Crear primera cita
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {shownGroups.filter((g) => g.items.length > 0).map((g) => (
            <section key={g.id} aria-label={g.title}>
              {/* Cabecera del grupo */}
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-3">
                <span className={`inline-block w-2.5 h-2.5 ${TONE_DOT[g.tone]}`} aria-hidden />
                <h2 className="font-display text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 400, fontSize: "1.15rem" }}>{g.title}</h2>
                <span className="text-xs text-[oklch(0.52_0.02_60)] font-body" style={{ fontWeight: 500 }}>
                  {g.items.length} cita{g.items.length !== 1 ? "s" : ""}
                </span>
                <span className="text-xs text-[oklch(0.62_0.02_60)] font-body hidden sm:inline" style={{ fontWeight: 300 }}>{g.hint}</span>
              </div>

              <div className="bg-white border border-[oklch(0.92_0.01_80)]">
                {/* Cabecera de columnas */}
                <div className={`hidden md:grid ${ROW_GRID} gap-x-6 px-5 py-2.5 border-b border-[oklch(0.92_0.01_80)] bg-[oklch(0.97_0.006_85)]`}>
                  {["Fecha y hora", "Cliente", "Servicio", "Estado", "Acciones"].map((h, i) => (
                    <p key={h} className={`text-[0.65rem] text-[oklch(0.52_0.02_60)] font-body uppercase tracking-widest ${i === 4 ? "text-right" : ""}`} style={{ fontWeight: 500 }}>
                      {h}
                    </p>
                  ))}
                </div>

                {g.items.map((r, idx) => {
                  const prev = g.items[idx - 1];
                  const newDay = g.byDay && (!prev || dayKey(prev.appointment.scheduledAt) !== dayKey(r.appointment.scheduledAt));
                  return (
                    <div key={r.appointment.id}>
                      {newDay && (
                        <div className="px-5 py-2 bg-[oklch(0.985_0.006_85)] border-y border-[oklch(0.94_0.008_80)] first:border-t-0">
                          <p className="text-xs text-[oklch(0.35_0.02_55)] font-body" style={{ fontWeight: 600 }}>
                            {dayLabel(r.appointment.scheduledAt)}
                          </p>
                        </div>
                      )}
                      <AppointmentRow
                        row={r}
                        tone={g.tone}
                        expanded={expandedId === r.appointment.id}
                        onToggle={() => setExpandedId(expandedId === r.appointment.id ? null : r.appointment.id)}
                        onAccept={() => acceptAppt.mutate({ id: r.appointment.id })}
                        accepting={acceptAppt.isPending && acceptAppt.variables?.id === r.appointment.id}
                        onCancel={(label) => { setCancelModal({ apptId: r.appointment.id, scheduledAt: r.appointment.scheduledAt, serviceLabel: label }); setCancelReason(""); }}
                        onPropose={(label) => { setProposeModal({ apptId: r.appointment.id, serviceLabel: label }); setSlots([{ date: "", time: "10:00" }]); }}
                        onManualStatus={(s) => updateStatus.mutate({ id: r.appointment.id, status: s as any })}
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          <p className="text-[0.7rem] text-[oklch(0.52_0.02_60)] font-body">
            {shownCount} cita{shownCount !== 1 ? "s" : ""} en esta vista
          </p>
        </div>
      )}

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

// ─── Tipos y utilidades del listado ───────────────────────────────────────────

type Row = {
  appointment: any;
  client: { id: number; firstName: string | null; lastName: string | null; email?: string | null; phone: string | null } | null;
};
type Tone = "amber" | "purple" | "blue" | "gray";
type Group = { id: string; title: string; hint: string; tone: Tone; byDay: boolean; items: Row[] };

const TONE_DOT: Record<Tone, string> = { amber: "bg-amber-500", purple: "bg-purple-500", blue: "bg-blue-500", gray: "bg-gray-400" };
const TONE_ROW: Record<Tone, string> = {
  amber: "border-l-4 border-l-amber-400 bg-amber-50/40",
  purple: "border-l-4 border-l-purple-300",
  blue: "border-l-4 border-l-blue-300",
  gray: "border-l-4 border-l-transparent",
};
/** Una sola rejilla para cabecera y filas: así las columnas siempre quedan alineadas. */
const ROW_GRID = "md:grid-cols-[100px_minmax(0,1fr)_minmax(0,1.3fr)_160px_300px]";

const dayKey = (ts: number | string) => {
  const d = new Date(Number(ts));
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

/** «Sábado 3 de octubre · Hoy» (con el año solo si no es el actual). */
function dayLabel(ts: number | string): string {
  const d = new Date(Number(ts));
  const now = new Date();
  const base = new Intl.DateTimeFormat("es-ES", {
    weekday: "long", day: "numeric", month: "long", ...(d.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
  }).format(d).replace(",", "");
  const cap = base.charAt(0).toUpperCase() + base.slice(1);
  const diff = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / 86400000);
  return diff === 0 ? `${cap} · Hoy` : diff === 1 ? `${cap} · Mañana` : cap;
}

const BTN = "inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[0.7rem] font-body tracking-wide border transition-colors disabled:opacity-60";

function AppointmentRow({
  row, tone, expanded, onToggle, onAccept, accepting, onCancel, onPropose, onManualStatus,
}: {
  row: Row;
  tone: Tone;
  expanded: boolean;
  onToggle: () => void;
  onAccept: () => void;
  accepting: boolean;
  onCancel: (label: string) => void;
  onPropose: (label: string) => void;
  onManualStatus: (s: string) => void;
}) {
  const { appointment: appt, client } = row;
  const status = appt.status as string;
  const sc = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const when = new Date(Number(appt.scheduledAt));
  const past = status === "completed" || status === "cancelled" || (status === "confirmed" && when.getTime() < Date.now());

  const rawLabel: string = (appt as any).serviceLabel ?? SERVICE_LABELS[appt.serviceType] ?? appt.serviceType;
  const isHome = / · a domicilio$/i.test(rawLabel);
  const svcName = rawLabel.replace(/ · a domicilio$/i, "");
  const wa = client?.phone ? whatsappNumber(client.phone) : null;
  const confirmedWa =
    wa && status === "confirmed"
      ? `https://wa.me/${wa}?text=${encodeURIComponent(confirmationWhatsAppText({ firstName: client?.firstName ?? "", serviceLabel: rawLabel, scheduledAt: Number(appt.scheduledAt) }))}`
      : null;

  const canAccept = status === "pending";
  const canCancel = status === "pending" || status === "confirmed" || status === "rescheduled";
  const canPropose = canCancel;

  return (
    <div className={`px-5 py-4 border-t border-[oklch(0.95_0.006_80)] first:border-t-0 hover:bg-[oklch(0.985_0.004_80)] transition-colors ${TONE_ROW[tone]} ${past ? "opacity-80" : ""}`}>
      <div className={`grid grid-cols-1 ${ROW_GRID} gap-x-6 gap-y-3 items-center`}>
        {/* Fecha y hora */}
        <div>
          <p className="font-display text-[oklch(0.18_0.018_55)] leading-none" style={{ fontWeight: 500, fontSize: "1.5rem" }}>
            {when.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
          </p>
          <p className="text-xs text-[oklch(0.45_0.02_55)] font-body mt-1" style={{ fontWeight: 500 }}>
            {when.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
          </p>
          {appt.durationMinutes ? (
            <p className="text-[0.7rem] text-[oklch(0.58_0.02_60)] font-body flex items-center gap-1 mt-0.5" style={{ fontWeight: 300 }}>
              <Clock size={10} /> {appt.durationMinutes} min
            </p>
          ) : null}
        </div>

        {/* Cliente */}
        <div className="min-w-0">
          {client ? (
            <Link
              href={`/crm/clientes/${client.id}`}
              className="block truncate text-sm text-[oklch(0.18_0.018_55)] font-body hover:text-[oklch(0.52_0.08_148)] transition-colors no-underline"
              style={{ fontWeight: 600 }}
            >
              {client.firstName} {client.lastName}
            </Link>
          ) : (
            <p className="text-sm text-[oklch(0.52_0.02_60)] font-body">—</p>
          )}
          {client?.phone ? (
            <a href={`tel:${client.phone}`} className="block text-xs text-[oklch(0.40_0.07_148)] font-body no-underline hover:underline mt-0.5" style={{ fontWeight: 400 }}>
              {formatPhoneDisplay(client.phone)}
            </a>
          ) : client ? (
            <p className="text-xs text-red-600 font-body mt-0.5" style={{ fontWeight: 500 }}>
              Sin teléfono: añádelo en la ficha del cliente
            </p>
          ) : null}
        </div>

        {/* Servicio */}
        <div className="min-w-0">
          <p className="text-sm text-[oklch(0.25_0.02_55)] font-body" style={{ fontWeight: 500 }}>{svcName}</p>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {appt.price ? (
              <span className="inline-flex items-center px-2 py-0.5 text-[0.7rem] text-[oklch(0.40_0.07_148)] bg-[oklch(0.52_0.08_148)]/10 font-body" style={{ fontWeight: 600 }}>
                {Number(appt.price)} €
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[0.7rem] text-[oklch(0.40_0.02_55)] bg-[oklch(0.95_0.008_80)] font-body" style={{ fontWeight: 400 }}>
              {isHome ? <><HomeIcon size={10} /> A domicilio</> : <><MapPin size={10} /> {appt.modality ? (MODALITY_LABELS[appt.modality] ?? appt.modality) : "—"}</>}
            </span>
          </div>
        </div>

        {/* Estado */}
        <div>
          <span className={`inline-flex items-center px-2.5 py-1 text-[0.65rem] font-body uppercase tracking-wider ${sc.color}`} style={{ fontWeight: 600 }}>
            {sc.label}
          </span>
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          {canAccept && (
            <button onClick={onAccept} disabled={accepting} className={`${BTN} bg-green-600 border-green-600 text-white hover:bg-green-700`} style={{ borderRadius: 0, fontWeight: 600 }}>
              {accepting ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />} Confirmar
            </button>
          )}
          {confirmedWa && !past && (
            <a href={confirmedWa} target="_blank" rel="noopener noreferrer" className={`${BTN} border-green-600 text-green-700 hover:bg-green-50 no-underline`} style={{ borderRadius: 0, fontWeight: 600 }} title="Avisar al cliente por WhatsApp: cita confirmada">
              <MessageCircle size={11} /> Avisar
            </a>
          )}
          {canPropose && (
            <button onClick={() => onPropose(rawLabel)} className={`${BTN} border-purple-300 text-purple-700 hover:bg-purple-50`} style={{ borderRadius: 0 }} title="Proponer nuevas fechas">
              <RefreshCw size={11} /> {status === "pending" ? "Otra fecha" : "Cambiar fecha"}
            </button>
          )}
          {canCancel && (
            <button onClick={() => onCancel(rawLabel)} className={`${BTN} border-red-200 text-red-700 hover:bg-red-50`} style={{ borderRadius: 0 }} title={status === "pending" ? "Rechazar la solicitud" : "Cancelar la cita"}>
              <X size={11} /> {status === "pending" ? "Rechazar" : "Cancelar"}
            </button>
          )}

          {/* Iconos secundarios */}
          {wa && !confirmedWa && (
            <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center bg-green-50 text-green-600 hover:bg-green-100 transition-colors" title="Abrir WhatsApp con el cliente">
              <MessageCircle size={14} />
            </a>
          )}
          {client && (
            <Link href={`/crm/clientes/${client.id}`} className="w-8 h-8 flex items-center justify-center bg-[oklch(0.52_0.08_148)]/10 text-[oklch(0.52_0.08_148)] hover:bg-[oklch(0.52_0.08_148)]/20 transition-colors no-underline" title="Ver ficha del cliente">
              <ArrowRight size={14} />
            </Link>
          )}
          <button
            onClick={onToggle}
            aria-expanded={expanded}
            className="inline-flex items-center gap-1 px-2 h-8 text-[0.7rem] text-[oklch(0.45_0.02_55)] font-body hover:text-[oklch(0.52_0.08_148)] transition-colors"
            title="Detalle e historial"
          >
            <History size={13} /> Detalle
            <ChevronDown size={12} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {expanded && <AppointmentDetail appt={appt} onManualStatus={onManualStatus} />}
    </div>
  );
}

// ─── Detalle + historial de una cita ──────────────────────────────────────────

const EVENT_RESULT_STYLE: Record<string, string> = {
  sent: "text-green-700",
  failed: "text-red-600",
  skipped: "text-amber-600",
};
const EVENT_RESULT_LABEL: Record<string, string> = { sent: "enviada", failed: "FALLÓ", skipped: "no enviada (sin configurar)" };
const CHANNEL_LABEL: Record<string, string> = { email: "Email", whatsapp: "WhatsApp", owner: "Aviso interno" };
const AUDIENCE_LABEL: Record<string, string> = { client: "al cliente", admin: "a Cristina" };

function AppointmentDetail({ appt, onManualStatus }: { appt: any; onManualStatus?: (s: string) => void }) {
  const { data, isLoading } = trpc.crm.appointments.events.useQuery({ id: appt.id });
  const when = (d: string | Date) =>
    new Date(d).toLocaleString("es-ES", { timeZone: "Europe/Madrid", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="mt-2 border border-[oklch(0.92_0.01_80)] bg-[oklch(0.985_0.004_85)] p-4 text-xs font-body text-[oklch(0.38_0.02_55)] space-y-3" style={{ fontWeight: 300 }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
        <p><span style={{ fontWeight: 500 }}>Servicio:</span> {appt.serviceLabel ?? appt.serviceType}</p>
        <p><span style={{ fontWeight: 500 }}>Duración:</span> {appt.durationMinutes ? `${appt.durationMinutes} min` : "—"}</p>
        <p><span style={{ fontWeight: 500 }}>Precio:</span> {appt.price ? `${Number(appt.price)} €` : "—"} <span className="text-[oklch(0.52_0.02_60)]">(informativo; no hay cobro online en citas)</span></p>
        <p><span style={{ fontWeight: 500 }}>Modalidad:</span> {appt.modality ? (MODALITY_LABELS[appt.modality] ?? appt.modality) : "—"}</p>
        <p><span style={{ fontWeight: 500 }}>Solicitada:</span> {when(appt.createdAt)}</p>
        {appt.cancellationReason && <p><span style={{ fontWeight: 500 }}>Motivo de cancelación:</span> {appt.cancellationReason}</p>}
      </div>
      {appt.internalNotes && (
        <p className="whitespace-pre-line border-l-2 border-[oklch(0.88_0.015_75)] pl-3 text-[oklch(0.45_0.02_55)]">{appt.internalNotes}</p>
      )}

      <div>
        <p className="mb-1.5 text-[0.65rem] uppercase tracking-wider text-[oklch(0.52_0.02_60)]" style={{ fontWeight: 500 }}>Historial</p>
        {isLoading ? (
          <Loader2 size={12} className="animate-spin" />
        ) : !data?.available ? (
          <p className="text-amber-600">El historial aún no está activado en la base de datos (migración pendiente). Las acciones funcionan igual, pero no se registran.</p>
        ) : data.events.length === 0 ? (
          <p className="text-[oklch(0.52_0.02_60)]">Sin eventos registrados (cita anterior al historial).</p>
        ) : (
          <ul className="space-y-1">
            {data.events.map((e) => (
              <li key={e.id} className="flex flex-wrap gap-x-2">
                <span className="text-[oklch(0.52_0.02_60)]">{when(e.createdAt)}</span>
                {e.type === "notification" ? (
                  <span>
                    {CHANNEL_LABEL[e.channel ?? ""] ?? e.channel} {AUDIENCE_LABEL[e.audience ?? ""] ?? ""}:{" "}
                    <span className={EVENT_RESULT_STYLE[e.result ?? ""] ?? ""} style={{ fontWeight: 500 }}>{EVENT_RESULT_LABEL[e.result ?? ""] ?? e.result}</span>
                    {e.result !== "sent" && e.detail ? <span className="text-[oklch(0.52_0.02_60)]"> — {e.detail}</span> : null}
                  </span>
                ) : e.type === "request_submitted" ? (
                  <span>Solicitud recibida desde la web</span>
                ) : (
                  <span>
                    Estado: {STATUS_CONFIG[e.fromStatus ?? ""]?.label ?? e.fromStatus ?? "—"} → <strong style={{ fontWeight: 500 }}>{STATUS_CONFIG[e.toStatus ?? ""]?.label ?? e.toStatus}</strong>
                    {e.detail ? <span className="text-[oklch(0.52_0.02_60)]"> — {e.detail}</span> : null}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {onManualStatus && (
        <div className="pt-3 border-t border-[oklch(0.92_0.01_80)]">
          <label className="flex flex-wrap items-center gap-2 text-[oklch(0.45_0.02_55)]">
            <span style={{ fontWeight: 500 }}>Cambiar estado manualmente</span>
            <select
              value={appt.status}
              onChange={(e) => onManualStatus(e.target.value)}
              className="px-2 py-1.5 bg-white border border-[oklch(0.88_0.015_75)] text-xs focus:outline-none focus:border-[oklch(0.52_0.08_148)]"
              style={{ borderRadius: 0 }}
            >
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <span className="text-[0.7rem] text-[oklch(0.58_0.02_60)]" style={{ fontWeight: 300 }}>No avisa al cliente; solo para corregir el estado.</span>
          </label>
        </div>
      )}
    </div>
  );
}
