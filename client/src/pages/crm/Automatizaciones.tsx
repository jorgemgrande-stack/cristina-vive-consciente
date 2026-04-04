/**
 * Panel CRM — Automatizaciones
 * Muestra logs de emails enviados, secuencias de leads pendientes,
 * estadísticas de comunicación y acciones de gestión.
 */

import { useState } from "react";
import CRMLayout from "@/components/CRMLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Mail,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Send,
  Users,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const EVENT_LABELS: Record<string, string> = {
  booking_confirmation: "Confirmación de reserva",
  booking_admin: "Notif. reserva (admin)",
  ebook_delivery: "Entrega de ebook",
  lead_welcome: "Bienvenida lead",
  lead_sequence_1: "Secuencia lead — paso 1",
  lead_sequence_2: "Secuencia lead — paso 2",
  lead_sequence_3: "Secuencia lead — paso 3",
  whatsapp_booking: "WhatsApp 📱 Reserva",
  whatsapp_lead: "WhatsApp 📱 Lead",
  whatsapp_purchase: "WhatsApp 📱 Compra",
};

const EVENT_COLORS: Record<string, string> = {
  booking_confirmation: "bg-emerald-100 text-emerald-800",
  booking_admin: "bg-stone-100 text-stone-700",
  ebook_delivery: "bg-amber-100 text-amber-800",
  lead_welcome: "bg-sage-100 text-sage-800",
  lead_sequence_1: "bg-blue-100 text-blue-800",
  lead_sequence_2: "bg-indigo-100 text-indigo-800",
  lead_sequence_3: "bg-purple-100 text-purple-800",
  whatsapp_booking: "bg-green-100 text-green-800",
  whatsapp_lead: "bg-green-100 text-green-800",
  whatsapp_purchase: "bg-green-100 text-green-800",
};

const STATUS_CONFIG = {
  sent: { label: "Enviado", icon: CheckCircle, color: "text-emerald-600" },
  failed: { label: "Error", icon: XCircle, color: "text-red-500" },
  pending: { label: "Pendiente", icon: Clock, color: "text-amber-500" },
  skipped: { label: "Omitido", icon: AlertCircle, color: "text-stone-400" },
};

const SEQUENCE_STATUS_CONFIG = {
  pending: { label: "Pendiente", color: "bg-amber-100 text-amber-800" },
  sent: { label: "Enviado", color: "bg-emerald-100 text-emerald-800" },
  failed: { label: "Error", color: "bg-red-100 text-red-700" },
  cancelled: { label: "Cancelado", color: "bg-stone-100 text-stone-600" },
};

function formatDate(ts: number | null | undefined): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatScheduled(ts: number | null | undefined): string {
  if (!ts) return "—";
  const now = Date.now();
  const diff = ts - now;
  if (diff < 0) return "Ahora";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `En ${days}d ${hours}h`;
  if (hours > 0) return `En ${hours}h`;
  return "Pronto";
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

export default function Automatizaciones() {
  const [activeTab, setActiveTab] = useState<"logs" | "sequences">("logs");

  const { data: stats, refetch: refetchStats } = trpc.automations.stats.useQuery();
  const { data: logs, isLoading: logsLoading, refetch: refetchLogs } = trpc.automations.listLogs.useQuery({ limit: 200 });
  const { data: sequences, isLoading: seqLoading, refetch: refetchSeq } = trpc.automations.listSequences.useQuery({ limit: 200 });

  const processSequences = trpc.automations.processSequences.useMutation({
    onSuccess: (data) => {
      toast.success(`Procesadas ${data.processed} secuencias. Errores: ${data.errors}`);
      refetchLogs();
      refetchSeq();
      refetchStats();
    },
    onError: (err) => toast.error(`Error: ${err.message}`),
  });

  const handleRefresh = () => {
    refetchLogs();
    refetchSeq();
    refetchStats();
    toast.success("Datos actualizados");
  };

  return (
    <CRMLayout title="Automatizaciones">
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif text-[#1A1208]">Automatizaciones</h1>
            <p className="text-sm text-[#7A6E5E] mt-1">
              Registro de emails enviados y secuencias de comunicación activas
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-[#E8E4DC] rounded text-[#5A4E3E] hover:bg-[#F5F2EC] transition-colors"
            >
              <RefreshCw size={14} />
              Actualizar
            </button>
            <button
              onClick={() => processSequences.mutate()}
              disabled={processSequences.isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-[#3A5A3A] text-white rounded hover:bg-[#2E4A2E] transition-colors disabled:opacity-50"
            >
              <Send size={14} />
              {processSequences.isPending ? "Procesando..." : "Procesar secuencias"}
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total enviados",
              value: stats?.total ?? 0,
              icon: Mail,
              color: "text-[#3A5A3A]",
              bg: "bg-[#F0F4F0]",
            },
            {
              label: "Exitosos",
              value: stats?.sent ?? 0,
              icon: CheckCircle,
              color: "text-emerald-600",
              bg: "bg-emerald-50",
            },
            {
              label: "Pendientes",
              value: stats?.pending ?? 0,
              icon: Clock,
              color: "text-amber-600",
              bg: "bg-amber-50",
            },
            {
              label: "Con error",
              value: stats?.failed ?? 0,
              icon: XCircle,
              color: "text-red-500",
              bg: "bg-red-50",
            },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.bg} rounded-lg p-4`}>
              <div className="flex items-center gap-2 mb-1">
                <stat.icon size={16} className={stat.color} />
                <span className="text-xs text-[#7A6E5E] uppercase tracking-wide">{stat.label}</span>
              </div>
              <p className={`text-2xl font-semibold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Flujos activos */}
        <div className="bg-[#F5F2EC] rounded-lg p-4">
          <p className="text-xs text-[#7A6E5E] uppercase tracking-widest mb-3 font-medium">Flujos activos</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white rounded p-3 border border-[#E8E4DC]">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle size={14} className="text-emerald-600" />
                <span className="text-sm font-medium text-[#1A1208]">Reservas</span>
              </div>
              <p className="text-xs text-[#7A6E5E]">Email al cliente + notif. admin</p>
              <span className="inline-block mt-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Activo</span>
            </div>
            <div className="bg-white rounded p-3 border border-[#E8E4DC]">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle size={14} className="text-emerald-600" />
                <span className="text-sm font-medium text-[#1A1208]">Leads (contacto)</span>
              </div>
              <p className="text-xs text-[#7A6E5E]">Bienvenida + secuencia 3 emails</p>
              <span className="inline-block mt-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Activo</span>
            </div>
            <div className="bg-white rounded p-3 border border-[#E8E4DC]">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={14} className="text-amber-500" />
                <span className="text-sm font-medium text-[#1A1208]">Ebooks</span>
              </div>
              <p className="text-xs text-[#7A6E5E]">Email de entrega con descarga</p>
              <span className="inline-block mt-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Pendiente Stripe</span>
            </div>
            <div className="bg-white rounded p-3 border border-[#E8E4DC]">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare size={14} className="text-green-600" />
                <span className="text-sm font-medium text-[#1A1208]">WhatsApp</span>
              </div>
              <p className="text-xs text-[#7A6E5E]">Notif. admin en reservas, leads y compras</p>
              <span className="inline-block mt-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Activo</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-[#E8E4DC]">
          <div className="flex gap-0">
            {[
              { id: "logs" as const, label: "Historial de envíos", icon: Mail },
              { id: "sequences" as const, label: "Secuencias de leads", icon: Users },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-[#3A5A3A] text-[#3A5A3A] font-medium"
                    : "border-transparent text-[#7A6E5E] hover:text-[#1A1208]"
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
                {tab.id === "sequences" && sequences && sequences.filter((s) => s.status === "pending").length > 0 && (
                  <span className="bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                    {sequences.filter((s) => s.status === "pending").length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab: Historial de envíos */}
        {activeTab === "logs" && (
          <div>
            {logsLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-[#F5F2EC] rounded animate-pulse" />
                ))}
              </div>
            ) : !logs || logs.length === 0 ? (
              <div className="text-center py-16">
                <Mail size={32} className="mx-auto text-[#C0B8A8] mb-3" />
                <p className="text-[#7A6E5E]">No hay registros de envíos aún</p>
                <p className="text-sm text-[#A09080] mt-1">Los emails enviados aparecerán aquí</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#E8E4DC]">
                      <th className="text-left py-3 px-3 text-xs text-[#7A6E5E] uppercase tracking-wide font-medium">Evento</th>
                      <th className="text-left py-3 px-3 text-xs text-[#7A6E5E] uppercase tracking-wide font-medium">Destinatario</th>
                      <th className="text-left py-3 px-3 text-xs text-[#7A6E5E] uppercase tracking-wide font-medium">Estado</th>
                      <th className="text-left py-3 px-3 text-xs text-[#7A6E5E] uppercase tracking-wide font-medium">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => {
                      const statusConf = STATUS_CONFIG[log.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
                      const StatusIcon = statusConf.icon;
                      return (
                        <tr key={log.id} className="border-b border-[#F0EDE8] hover:bg-[#FAFAF7] transition-colors">
                          <td className="py-3 px-3">
                            <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${EVENT_COLORS[log.event] ?? "bg-stone-100 text-stone-700"}`}>
                              {EVENT_LABELS[log.event] ?? log.event}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-[#5A4E3E]">
                            {log.recipientEmail ?? log.recipientPhone ?? "—"}
                          </td>
                          <td className="py-3 px-3">
                            <div className={`flex items-center gap-1.5 ${statusConf.color}`}>
                              <StatusIcon size={13} />
                              <span className="text-xs font-medium">{statusConf.label}</span>
                            </div>
                            {/* Si es un log de WhatsApp pendiente, mostrar el enlace wa.me */}
                            {log.event?.startsWith("whatsapp_") && log.status === "pending" && log.errorMessage?.startsWith("wa.me link:") && (
                              <a
                                href={log.errorMessage.replace("wa.me link: ", "")}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-green-700 underline mt-0.5 hover:text-green-900"
                              >
                                Abrir en WhatsApp ↗
                              </a>
                            )}
                            {log.errorMessage && !log.errorMessage.startsWith("wa.me link:") && (
                              <p className="text-xs text-red-400 mt-0.5 truncate max-w-[200px]" title={log.errorMessage}>
                                {log.errorMessage}
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-3 text-[#A09080] text-xs">
                            {formatDate(log.sentAt ?? (log.createdAt instanceof Date ? log.createdAt.getTime() : Number(log.createdAt)))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab: Secuencias de leads */}
        {activeTab === "sequences" && (
          <div>
            {seqLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-[#F5F2EC] rounded animate-pulse" />
                ))}
              </div>
            ) : !sequences || sequences.length === 0 ? (
              <div className="text-center py-16">
                <TrendingUp size={32} className="mx-auto text-[#C0B8A8] mb-3" />
                <p className="text-[#7A6E5E]">No hay secuencias programadas</p>
                <p className="text-sm text-[#A09080] mt-1">Las secuencias se crean automáticamente cuando alguien contacta</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#E8E4DC]">
                      <th className="text-left py-3 px-3 text-xs text-[#7A6E5E] uppercase tracking-wide font-medium">Lead</th>
                      <th className="text-left py-3 px-3 text-xs text-[#7A6E5E] uppercase tracking-wide font-medium">Paso</th>
                      <th className="text-left py-3 px-3 text-xs text-[#7A6E5E] uppercase tracking-wide font-medium">Programado</th>
                      <th className="text-left py-3 px-3 text-xs text-[#7A6E5E] uppercase tracking-wide font-medium">Estado</th>
                      <th className="text-left py-3 px-3 text-xs text-[#7A6E5E] uppercase tracking-wide font-medium">Enviado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sequences.map((seq) => {
                      const statusConf = SEQUENCE_STATUS_CONFIG[seq.status as keyof typeof SEQUENCE_STATUS_CONFIG] ?? SEQUENCE_STATUS_CONFIG.pending;
                      return (
                        <tr key={seq.id} className="border-b border-[#F0EDE8] hover:bg-[#FAFAF7] transition-colors">
                          <td className="py-3 px-3">
                            <p className="font-medium text-[#1A1208]">{seq.clientName}</p>
                            <p className="text-xs text-[#A09080]">{seq.clientEmail}</p>
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1 text-xs bg-[#F5F2EC] text-[#5A4E3E] px-2 py-0.5 rounded-full">
                              <Mail size={10} />
                              Email {seq.sequenceStep} de 3
                            </span>
                          </td>
                          <td className="py-3 px-3 text-[#5A4E3E]">
                            <p className="text-sm">{formatDate(seq.scheduledAt)}</p>
                            {seq.status === "pending" && (
                              <p className="text-xs text-amber-600">{formatScheduled(seq.scheduledAt)}</p>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${statusConf.color}`}>
                              {statusConf.label}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-[#A09080] text-xs">
                            {seq.sentAt ? formatDate(seq.sentAt) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </CRMLayout>
  );
}
