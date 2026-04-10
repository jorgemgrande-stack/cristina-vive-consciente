/**
 * CRM Calendario — Vista mensual de citas + eventos propios
 * - Citas (pending / confirmed) del CRM
 * - Eventos propios del admin (bloqueos, recordatorios, formaciones, reuniones, personales)
 * - Click en día vacío → crear evento
 * - Click en evento → ver detalle / eliminar
 */

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, X, Loader2, CalendarDays, Lock, BookOpen, Bell, Users, User, Clock } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import CRMLayout from "@/components/CRMLayout";

// ─── Tipos de evento propio ────────────────────────────────────────────────────
const EVENT_TYPES = {
  bloqueo:      { label: "Bloqueo de agenda", color: "bg-slate-500 text-white", dot: "bg-slate-500", icon: Lock },
  formacion:    { label: "Formación / Evento",  color: "bg-blue-600 text-white", dot: "bg-blue-600", icon: BookOpen },
  recordatorio: { label: "Recordatorio / Tarea", color: "bg-amber-500 text-white", dot: "bg-amber-500", icon: Bell },
  reunion:      { label: "Reunión / Gestión",    color: "bg-indigo-600 text-white", dot: "bg-indigo-600", icon: Users },
  personal:     { label: "Nota personal",        color: "bg-rose-500 text-white", dot: "bg-rose-500", icon: User },
} as const;
type EventType = keyof typeof EVENT_TYPES;

// Colores de citas
const APPT_STATUS_DOT: Record<string, string> = {
  pending:     "bg-amber-400",
  confirmed:   "bg-emerald-500",
  completed:   "bg-gray-400",
  cancelled:   "bg-red-400",
  rescheduled: "bg-purple-400",
};
const APPT_STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente", confirmed: "Confirmada", completed: "Completada",
  cancelled: "Cancelada", rescheduled: "Reprogramada",
};

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function firstDayOfMonth(year: number, month: number) {
  // 0 = domingo, convertir a lunes = 0
  return (new Date(year, month, 1).getDay() + 6) % 7;
}
function startOfDay(ts: number) {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAYS_ES   = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

// ─── Componente ───────────────────────────────────────────────────────────────
export default function Calendario() {
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  // Modal crear evento
  const [newEventDay, setNewEventDay] = useState<Date | null>(null);
  const [eventForm, setEventForm] = useState({
    title: "",
    notes: "",
    time: "09:00",
    durationMinutes: 60,
    type: "recordatorio" as EventType,
  });

  // Modal detalle evento/cita
  const [detail, setDetail] = useState<{ kind: "event" | "appt"; id: number; title: string; notes?: string | null; type?: string; eventAt: number; durationMinutes?: number | null } | null>(null);

  // Rango del mes (timestamps)
  const fromTs = new Date(year, month, 1).getTime();
  const toTs   = new Date(year, month + 1, 0, 23, 59, 59).getTime();

  const { data: calEvents, refetch: refetchEvents } = trpc.crm.calendarEvents.list.useQuery({ from: fromTs, to: toTs });
  const { data: appointments } = trpc.crm.appointments.list.useQuery({ from: fromTs, to: toTs });

  const createEvent = trpc.crm.calendarEvents.create.useMutation({
    onSuccess: () => {
      refetchEvents();
      setNewEventDay(null);
      setEventForm({ title: "", notes: "", time: "09:00", durationMinutes: 60, type: "recordatorio" });
      toast.success("Evento creado");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteEvent = trpc.crm.calendarEvents.delete.useMutation({
    onSuccess: () => { refetchEvents(); setDetail(null); toast.success("Evento eliminado"); },
    onError: (e) => toast.error(e.message),
  });

  // Navegar mes
  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  // Construir grid
  const totalDays  = daysInMonth(year, month);
  const firstDay   = firstDayOfMonth(year, month);
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  // Completar hasta múltiplo de 7
  while (cells.length % 7 !== 0) cells.push(null);

  // Index eventos por día
  const eventsByDay: Record<number, typeof calEvents> = {};
  calEvents?.forEach((ev) => {
    const d = new Date(ev.eventAt).getDate();
    if (!eventsByDay[d]) eventsByDay[d] = [];
    eventsByDay[d]!.push(ev);
  });

  const apptsByDay: Record<number, typeof appointments> = {};
  appointments?.forEach((row) => {
    const d = new Date(row.appointment.scheduledAt).getDate();
    if (!apptsByDay[d]) apptsByDay[d] = [];
    apptsByDay[d]!.push(row);
  });

  const handleDayClick = (day: number) => {
    setNewEventDay(new Date(year, month, day));
    setEventForm({ title: "", notes: "", time: "09:00", durationMinutes: 60, type: "recordatorio" });
  };

  const handleCreateEvent = () => {
    if (!newEventDay || !eventForm.title.trim()) { toast.error("El título es obligatorio"); return; }
    const [h, m] = eventForm.time.split(":").map(Number);
    const eventAt = new Date(newEventDay.getFullYear(), newEventDay.getMonth(), newEventDay.getDate(), h, m).getTime();
    createEvent.mutate({
      title: eventForm.title.trim(),
      notes: eventForm.notes.trim() || undefined,
      eventAt,
      durationMinutes: eventForm.durationMinutes,
      type: eventForm.type,
    });
  };

  const todayDay   = today.getFullYear() === year && today.getMonth() === month ? today.getDate() : null;

  return (
    <CRMLayout title="Calendario">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center border border-[oklch(0.92_0.01_80)] text-[oklch(0.52_0.02_60)] hover:bg-[oklch(0.96_0.006_80)] transition-colors">
            <ChevronLeft size={14} />
          </button>
          <span className="px-4 text-sm font-body text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 500, minWidth: "10rem", textAlign: "center" }}>
            {MONTHS_ES[month]} {year}
          </span>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center border border-[oklch(0.92_0.01_80)] text-[oklch(0.52_0.02_60)] hover:bg-[oklch(0.96_0.006_80)] transition-colors">
            <ChevronRight size={14} />
          </button>
        </div>
        <button
          onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); }}
          className="text-xs text-[oklch(0.52_0.08_148)] font-body hover:underline"
        >
          Hoy
        </button>
        <div className="ml-auto flex items-center gap-4 text-[0.65rem] text-[oklch(0.52_0.02_60)] font-body">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Pendiente</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Confirmada</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Recordatorio</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block" /> Bloqueo</span>
        </div>
      </div>

      {/* Calendario */}
      <div className="bg-white border border-[oklch(0.92_0.01_80)]">
        {/* Cabecera días */}
        <div className="grid grid-cols-7 border-b border-[oklch(0.92_0.01_80)]">
          {DAYS_ES.map((d) => (
            <div key={d} className="py-2 text-center text-[0.65rem] text-[oklch(0.52_0.02_60)] font-body uppercase tracking-widest" style={{ fontWeight: 500 }}>
              {d}
            </div>
          ))}
        </div>

        {/* Grid de días */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            const isToday   = day !== null && day === todayDay;
            const events    = day ? (eventsByDay[day] ?? []) : [];
            const appts     = day ? (apptsByDay[day] ?? []) : [];
            const hasItems  = events.length + appts.length > 0;
            return (
              <div
                key={idx}
                className={`min-h-[100px] border-b border-r border-[oklch(0.96_0.006_80)] p-1.5 ${
                  day ? "cursor-pointer hover:bg-[oklch(0.985_0.004_80)] transition-colors" : "bg-[oklch(0.985_0.004_80)]"
                } ${isToday ? "bg-[oklch(0.95_0.015_148)]/30" : ""}`}
                onClick={() => day && handleDayClick(day)}
              >
                {day && (
                  <>
                    <div className={`text-xs font-body mb-1 w-5 h-5 flex items-center justify-center ${
                      isToday
                        ? "bg-[oklch(0.52_0.08_148)] text-white rounded-full"
                        : "text-[oklch(0.38_0.02_55)]"
                    }`} style={{ fontWeight: isToday ? 600 : 400 }}>
                      {day}
                    </div>
                    <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
                      {appts.slice(0, 3).map(({ appointment: appt, client }) => (
                        <button
                          key={`appt-${appt.id}`}
                          onClick={() => setDetail({ kind: "appt", id: appt.id, title: `${client?.firstName ?? ""} ${client?.lastName ?? ""}`.trim() || "Cliente", notes: appt.internalNotes, type: appt.status, eventAt: appt.scheduledAt, durationMinutes: appt.durationMinutes })}
                          className={`w-full text-left text-[0.6rem] px-1.5 py-0.5 font-body flex items-center gap-1 truncate ${
                            appt.status === "confirmed" ? "bg-emerald-100 text-emerald-800" :
                            appt.status === "pending"   ? "bg-amber-100 text-amber-800" :
                            appt.status === "cancelled" ? "bg-red-100 text-red-700 line-through" :
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${APPT_STATUS_DOT[appt.status] ?? "bg-gray-400"}`} />
                          <span className="truncate">
                            {new Date(appt.scheduledAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })} {client?.firstName ?? "Cliente"}
                          </span>
                        </button>
                      ))}
                      {appts.length > 3 && (
                        <p className="text-[0.55rem] text-[oklch(0.52_0.02_60)] font-body pl-1">+{appts.length - 3} cita{appts.length - 3 !== 1 ? "s" : ""}</p>
                      )}
                      {events.slice(0, 2).map((ev) => {
                        const cfg = EVENT_TYPES[ev.type as EventType] ?? EVENT_TYPES.recordatorio;
                        return (
                          <button
                            key={`ev-${ev.id}`}
                            onClick={() => setDetail({ kind: "event", id: ev.id, title: ev.title, notes: ev.notes, type: ev.type, eventAt: ev.eventAt, durationMinutes: ev.durationMinutes })}
                            className={`w-full text-left text-[0.6rem] px-1.5 py-0.5 font-body flex items-center gap-1 truncate ${cfg.color}`}
                          >
                            <span className="truncate">
                              {new Date(ev.eventAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })} {ev.title}
                            </span>
                          </button>
                        );
                      })}
                      {events.length > 2 && (
                        <p className="text-[0.55rem] text-[oklch(0.52_0.02_60)] font-body pl-1">+{events.length - 2} evento{events.length - 2 !== 1 ? "s" : ""}</p>
                      )}
                    </div>
                    {/* Botón "+" sutil */}
                    {!hasItems && (
                      <div className="mt-1 flex justify-center opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity">
                        <Plus size={10} className="text-[oklch(0.72_0.02_60)]" />
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── MODAL CREAR EVENTO ── */}
      {newEventDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setNewEventDay(null)} />
          <div className="relative bg-white border border-[oklch(0.92_0.01_80)] w-full max-w-md p-6 space-y-4" style={{ borderRadius: 0 }}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 400, fontSize: "1.1rem" }}>
                Nuevo evento
              </h3>
              <span className="text-xs text-[oklch(0.52_0.02_60)] font-body">
                {newEventDay.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
              </span>
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-[0.65rem] text-[oklch(0.38_0.02_55)] font-body mb-2 uppercase tracking-wider" style={{ fontWeight: 500 }}>Tipo</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {(Object.entries(EVENT_TYPES) as [EventType, typeof EVENT_TYPES[EventType]][]).map(([k, v]) => {
                  const Icon = v.icon;
                  return (
                    <button
                      key={k}
                      onClick={() => setEventForm((f) => ({ ...f, type: k }))}
                      className={`flex items-center gap-2 px-2.5 py-2 text-[0.65rem] font-body border transition-all ${
                        eventForm.type === k
                          ? `${v.color} border-transparent`
                          : "border-[oklch(0.92_0.01_80)] text-[oklch(0.38_0.02_55)] hover:border-[oklch(0.72_0.04_148)]"
                      }`}
                      style={{ borderRadius: 0 }}
                    >
                      <Icon size={11} /> {v.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Título */}
            <div>
              <label className="block text-[0.65rem] text-[oklch(0.38_0.02_55)] font-body mb-1.5 uppercase tracking-wider" style={{ fontWeight: 500 }}>
                Título <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={eventForm.title}
                onChange={(e) => setEventForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ej: Reunión con proveedor"
                className="w-full px-3 py-2.5 text-sm bg-white border border-[oklch(0.92_0.01_80)] text-[oklch(0.18_0.018_55)] focus:outline-none focus:border-[oklch(0.52_0.08_148)] transition-colors font-body"
                style={{ borderRadius: 0 }}
                autoFocus
              />
            </div>

            {/* Hora + Duración */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[0.65rem] text-[oklch(0.38_0.02_55)] font-body mb-1.5 uppercase tracking-wider" style={{ fontWeight: 500 }}>Hora</label>
                <input type="time" value={eventForm.time} onChange={(e) => setEventForm((f) => ({ ...f, time: e.target.value }))} className="w-full px-3 py-2.5 text-sm bg-white border border-[oklch(0.92_0.01_80)] text-[oklch(0.18_0.018_55)] focus:outline-none focus:border-[oklch(0.52_0.08_148)] transition-colors font-body" style={{ borderRadius: 0 }} />
              </div>
              <div>
                <label className="block text-[0.65rem] text-[oklch(0.38_0.02_55)] font-body mb-1.5 uppercase tracking-wider" style={{ fontWeight: 500 }}>Duración (min)</label>
                <input type="number" value={eventForm.durationMinutes} onChange={(e) => setEventForm((f) => ({ ...f, durationMinutes: parseInt(e.target.value) || 60 }))} min={5} max={480} className="w-full px-3 py-2.5 text-sm bg-white border border-[oklch(0.92_0.01_80)] text-[oklch(0.18_0.018_55)] focus:outline-none focus:border-[oklch(0.52_0.08_148)] transition-colors font-body" style={{ borderRadius: 0 }} />
              </div>
            </div>

            {/* Notas */}
            <div>
              <label className="block text-[0.65rem] text-[oklch(0.38_0.02_55)] font-body mb-1.5 uppercase tracking-wider" style={{ fontWeight: 500 }}>Notas (opcional)</label>
              <textarea
                value={eventForm.notes}
                onChange={(e) => setEventForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2.5 text-sm bg-white border border-[oklch(0.92_0.01_80)] text-[oklch(0.18_0.018_55)] focus:outline-none focus:border-[oklch(0.52_0.08_148)] transition-colors font-body resize-none"
                style={{ borderRadius: 0 }}
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={handleCreateEvent}
                disabled={createEvent.isPending || !eventForm.title.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[oklch(0.52_0.08_148)] text-white text-xs font-body uppercase tracking-wider hover:bg-[oklch(0.38_0.07_148)] transition-colors disabled:opacity-60"
                style={{ borderRadius: 0, letterSpacing: "0.07em" }}
              >
                {createEvent.isPending ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                Crear evento
              </button>
              <button onClick={() => setNewEventDay(null)} className="px-4 py-2.5 border border-[oklch(0.92_0.01_80)] text-[oklch(0.38_0.02_55)] text-xs font-body hover:border-[oklch(0.52_0.08_148)] transition-colors" style={{ borderRadius: 0 }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DETALLE ── */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDetail(null)} />
          <div className="relative bg-white border border-[oklch(0.92_0.01_80)] w-full max-w-sm p-6 space-y-3" style={{ borderRadius: 0 }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[0.6rem] font-body uppercase tracking-widest text-[oklch(0.52_0.02_60)] mb-1">
                  {detail.kind === "appt"
                    ? `Cita — ${APPT_STATUS_LABEL[detail.type ?? "pending"] ?? detail.type}`
                    : (EVENT_TYPES[detail.type as EventType]?.label ?? detail.type)}
                </p>
                <h3 className="font-display text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 500, fontSize: "1.05rem" }}>
                  {detail.title}
                </h3>
              </div>
              <button onClick={() => setDetail(null)} className="text-[oklch(0.52_0.02_60)] hover:text-[oklch(0.18_0.018_55)] transition-colors flex-shrink-0">
                <X size={16} />
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs text-[oklch(0.52_0.02_60)] font-body">
              <CalendarDays size={12} />
              {new Date(detail.eventAt).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </div>
            <div className="flex items-center gap-2 text-xs text-[oklch(0.52_0.02_60)] font-body">
              <Clock size={12} />
              {new Date(detail.eventAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
              {detail.durationMinutes ? ` · ${detail.durationMinutes} min` : ""}
            </div>
            {detail.notes && (
              <p className="text-sm text-[oklch(0.38_0.02_55)] font-body leading-relaxed" style={{ fontWeight: 300 }}>
                {detail.notes}
              </p>
            )}
            <div className="flex gap-2 pt-2">
              {detail.kind === "appt" ? (
                <Link
                  href="/crm/citas"
                  className="flex-1 text-center px-3 py-2 bg-[oklch(0.52_0.08_148)] text-white text-xs font-body uppercase tracking-wider hover:bg-[oklch(0.38_0.07_148)] transition-colors no-underline"
                  style={{ borderRadius: 0, letterSpacing: "0.07em" }}
                  onClick={() => setDetail(null)}
                >
                  Ver citas
                </Link>
              ) : (
                <button
                  onClick={() => deleteEvent.mutate({ id: detail.id })}
                  disabled={deleteEvent.isPending}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-100 text-red-700 text-xs font-body uppercase tracking-wider hover:bg-red-200 transition-colors disabled:opacity-60"
                  style={{ borderRadius: 0, letterSpacing: "0.07em" }}
                >
                  {deleteEvent.isPending ? <Loader2 size={11} className="animate-spin" /> : <X size={11} />}
                  Eliminar evento
                </button>
              )}
              <button onClick={() => setDetail(null)} className="px-3 py-2 border border-[oklch(0.92_0.01_80)] text-[oklch(0.38_0.02_55)] text-xs font-body hover:border-[oklch(0.52_0.08_148)] transition-colors" style={{ borderRadius: 0 }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </CRMLayout>
  );
}
