/**
 * CRM Dashboard — Cristina Vive Consciente
 * Resumen del día, estadísticas, próximas citas y pendientes
 */

import { Users, CalendarDays, Clock, CheckCircle2, Phone, MessageCircle, ArrowRight, CalendarCheck } from "lucide-react";
import { Link } from "wouter";
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

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "bg-amber-100 text-amber-700" },
  confirmed: { label: "Confirmada", color: "bg-blue-100 text-blue-700" },
  completed: { label: "Completada", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelada", color: "bg-red-100 text-red-700" },
  rescheduled: { label: "Reprogramada", color: "bg-purple-100 text-purple-700" },
};

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
}

function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: number | string; sub?: string; color: string }) {
  return (
    <div className="bg-white border border-[oklch(0.92_0.01_80)] p-5 flex items-start gap-4">
      <div className={`w-10 h-10 flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-2xl font-display text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 500 }}>
          {value}
        </p>
        <p className="text-xs text-[oklch(0.52_0.02_60)] font-body mt-0.5" style={{ fontWeight: 400 }}>
          {label}
        </p>
        {sub && <p className="text-[0.65rem] text-[oklch(0.52_0.08_148)] font-body mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function CRMDashboard() {
  const { data: stats, isLoading: statsLoading } = trpc.crm.dashboard.stats.useQuery();
  const { data: todayRaw, isLoading: todayLoading } = trpc.crm.dashboard.todayAppointments.useQuery();
  const { data: upcomingRaw, isLoading: upcomingLoading } = trpc.crm.dashboard.upcomingAppointments.useQuery({ limit: 8 });

  const today = todayRaw ?? [];
  const upcoming = upcomingRaw ?? [];

  const now = new Date();
  const dateLabel = now.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });

  return (
    <CRMLayout title="Dashboard">
      {/* Date header */}
      <div className="mb-6">
        <p className="text-[oklch(0.52_0.02_60)] text-sm font-body capitalize" style={{ fontWeight: 300 }}>
          {dateLabel}
        </p>
        <h2 className="font-display text-[oklch(0.18_0.018_55)] mt-0.5" style={{ fontWeight: 400, fontSize: "1.5rem" }}>
          Buenos días, Cristina
        </h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-[oklch(0.92_0.01_80)] p-5 h-20 animate-pulse" />
          ))
        ) : (
          <>
            <StatCard icon={Users} label="Clientes totales" value={stats?.totalClients ?? 0} color="bg-[oklch(0.52_0.08_148)]/10 text-[oklch(0.52_0.08_148)]" />
            <StatCard icon={CalendarDays} label="Citas totales" value={stats?.totalAppointments ?? 0} color="bg-blue-50 text-blue-600" />
            <StatCard icon={Clock} label="Pendientes / Confirmadas" value={stats?.pendingAppointments ?? 0} color="bg-amber-50 text-amber-600" />
            <StatCard icon={CheckCircle2} label="Completadas este mes" value={stats?.completedThisMonth ?? 0} color="bg-green-50 text-green-600" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TODAY */}
        <div className="bg-white border border-[oklch(0.92_0.01_80)]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[oklch(0.92_0.01_80)]">
            <div className="flex items-center gap-2">
              <CalendarCheck size={16} className="text-[oklch(0.52_0.08_148)]" />
              <h3 className="font-display text-[oklch(0.18_0.018_55)] text-sm" style={{ fontWeight: 500 }}>
                Hoy
              </h3>
            </div>
            <Link href="/crm/citas" className="text-[oklch(0.52_0.08_148)] text-xs font-body flex items-center gap-1 no-underline hover:underline">
              Ver todas <ArrowRight size={11} />
            </Link>
          </div>
          <div className="divide-y divide-[oklch(0.96_0.006_80)]">
            {todayLoading ? (
              <div className="p-5 text-center text-sm text-[oklch(0.52_0.02_60)] font-body animate-pulse">Cargando...</div>
            ) : today.length === 0 ? (
              <div className="p-8 text-center">
                <CalendarDays size={28} className="mx-auto text-[oklch(0.88_0.015_75)] mb-2" />
                <p className="text-sm text-[oklch(0.52_0.02_60)] font-body" style={{ fontWeight: 300 }}>
                  No hay citas para hoy
                </p>
              </div>
            ) : (
              today.map(({ appointment: appt, client }) => (
                <div key={appt.id} className="px-5 py-3.5 flex items-start gap-3 hover:bg-[oklch(0.98_0.004_80)] transition-colors">
                  <div className="text-center min-w-[3rem]">
                    <p className="font-display text-[oklch(0.18_0.018_55)] text-sm" style={{ fontWeight: 500 }}>
                      {formatTime(appt.scheduledAt)}
                    </p>
                    <p className="text-[0.6rem] text-[oklch(0.52_0.02_60)] font-body uppercase tracking-wider">
                      {appt.durationMinutes}min
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[oklch(0.18_0.018_55)] font-body truncate" style={{ fontWeight: 500 }}>
                      {client?.firstName} {client?.lastName}
                    </p>
                    <p className="text-xs text-[oklch(0.52_0.02_60)] font-body truncate" style={{ fontWeight: 300 }}>
                      {SERVICE_LABELS[appt.serviceType] ?? appt.serviceType}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={`text-[0.6rem] px-2 py-0.5 font-body uppercase tracking-wider ${STATUS_LABELS[appt.status]?.color ?? "bg-gray-100 text-gray-600"}`}>
                      {STATUS_LABELS[appt.status]?.label ?? appt.status}
                    </span>
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
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* UPCOMING */}
        <div className="bg-white border border-[oklch(0.92_0.01_80)]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[oklch(0.92_0.01_80)]">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-[oklch(0.52_0.08_148)]" />
              <h3 className="font-display text-[oklch(0.18_0.018_55)] text-sm" style={{ fontWeight: 500 }}>
                Próximas citas
              </h3>
            </div>
            <Link href="/crm/citas" className="text-[oklch(0.52_0.08_148)] text-xs font-body flex items-center gap-1 no-underline hover:underline">
              Ver todas <ArrowRight size={11} />
            </Link>
          </div>
          <div className="divide-y divide-[oklch(0.96_0.006_80)]">
            {upcomingLoading ? (
              <div className="p-5 text-center text-sm text-[oklch(0.52_0.02_60)] font-body animate-pulse">Cargando...</div>
            ) : upcoming.length === 0 ? (
              <div className="p-8 text-center">
                <Clock size={28} className="mx-auto text-[oklch(0.88_0.015_75)] mb-2" />
                <p className="text-sm text-[oklch(0.52_0.02_60)] font-body" style={{ fontWeight: 300 }}>
                  No hay próximas citas
                </p>
              </div>
            ) : (
              upcoming.map(({ appointment: appt, client }) => (
                <div key={appt.id} className="px-5 py-3.5 flex items-start gap-3 hover:bg-[oklch(0.98_0.004_80)] transition-colors">
                  <div className="text-center min-w-[3.5rem]">
                    <p className="text-[0.65rem] text-[oklch(0.52_0.08_148)] font-body uppercase tracking-wider capitalize">
                      {formatDate(appt.scheduledAt)}
                    </p>
                    <p className="font-display text-[oklch(0.18_0.018_55)] text-sm" style={{ fontWeight: 500 }}>
                      {formatTime(appt.scheduledAt)}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[oklch(0.18_0.018_55)] font-body truncate" style={{ fontWeight: 500 }}>
                      {client?.firstName} {client?.lastName}
                    </p>
                    <p className="text-xs text-[oklch(0.52_0.02_60)] font-body truncate" style={{ fontWeight: 300 }}>
                      {SERVICE_LABELS[appt.serviceType] ?? appt.serviceType}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
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
                    <Link
                      href={`/crm/clientes/${client?.id}`}
                      className="w-7 h-7 flex items-center justify-center bg-[oklch(0.52_0.08_148)]/10 text-[oklch(0.52_0.08_148)] hover:bg-[oklch(0.52_0.08_148)]/20 transition-colors no-underline"
                      title="Ver cliente"
                    >
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: "/crm/clientes/nuevo", label: "Nuevo cliente", icon: Users },
          { href: "/crm/citas/nueva", label: "Nueva cita", icon: CalendarDays },
          { href: "/crm/clientes", label: "Ver clientes", icon: Users },
          { href: "/crm/facturas", label: "Ver facturas", icon: CalendarCheck },
        ].map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2.5 px-4 py-3 bg-white border border-[oklch(0.92_0.01_80)] text-[oklch(0.38_0.02_55)] hover:border-[oklch(0.52_0.08_148)] hover:text-[oklch(0.52_0.08_148)] transition-all duration-200 text-sm font-body no-underline group"
            style={{ fontWeight: 400 }}
          >
            <Icon size={15} className="flex-shrink-0" />
            {label}
          </Link>
        ))}
      </div>
    </CRMLayout>
  );
}
