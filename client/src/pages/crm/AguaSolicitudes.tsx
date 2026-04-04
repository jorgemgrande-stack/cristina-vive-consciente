/**
 * CRM — Máquinas de Agua > Solicitudes
 * Gestión de solicitudes de reserva de sistemas de agua
 */

import { useState } from "react";
import CRMLayout from "@/components/CRMLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Droplets,
  Phone,
  Mail,
  MapPin,
  Home,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock,
  XCircle,
  User,
} from "lucide-react";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new: { label: "Nueva", color: "bg-blue-100 text-blue-700" },
  contacted: { label: "Contactada", color: "bg-amber-100 text-amber-700" },
  qualified: { label: "Cualificada", color: "bg-emerald-100 text-emerald-700" },
  closed: { label: "Cerrada", color: "bg-stone-100 text-stone-600" },
};

export default function AguaSolicitudes() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingNotes, setEditingNotes] = useState<{ id: number; notes: string } | null>(null);

  const utils = trpc.useUtils();
  const { data: inquiries, isLoading } = trpc.water.admin.listInquiries.useQuery({ limit: 200 });

  const updateMutation = trpc.water.admin.updateInquiry.useMutation({
    onSuccess: () => {
      toast.success("Solicitud actualizada");
      utils.water.admin.listInquiries.invalidate();
      setEditingNotes(null);
    },
    onError: (err) => toast.error(`Error: ${err.message}`),
  });

  const handleStatusChange = (id: number, status: "new" | "contacted" | "qualified" | "closed") => {
    updateMutation.mutate({ id, status });
  };

  const handleSaveNotes = (id: number) => {
    if (!editingNotes) return;
    updateMutation.mutate({ id, internalNotes: editingNotes.notes });
  };

  return (
    <CRMLayout title="Máquinas de Agua — Solicitudes">
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-serif text-[#1A1208] flex items-center gap-2">
              <Droplets size={22} className="text-[#3A5A3A]" />
              Solicitudes de Sistemas de Agua
            </h1>
            <p className="text-sm text-[#7A6E5E] mt-1">
              Solicitudes recibidas a través del formulario "Reservar sistema" de la web.
            </p>
          </div>
          <div className="flex gap-2 text-sm">
            {Object.entries(STATUS_LABELS).map(([key, { label, color }]) => {
              const count = inquiries?.filter((i) => i.status === key).length ?? 0;
              return (
                <span key={key} className={`px-3 py-1 rounded-full text-xs font-medium ${color}`}>
                  {label}: {count}
                </span>
              );
            })}
          </div>
        </div>

        {/* Listado */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-[#F5F2EC] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !inquiries || inquiries.length === 0 ? (
          <div className="text-center py-16 bg-[#FAFAF7] rounded-xl border border-dashed border-[#E8E4DC]">
            <Droplets size={36} className="mx-auto text-[#C0B8A8] mb-3" />
            <p className="text-[#7A6E5E] font-medium">No hay solicitudes todavía</p>
            <p className="text-sm text-[#A09080] mt-1">Las solicitudes del formulario web aparecerán aquí</p>
          </div>
        ) : (
          <div className="space-y-3">
            {inquiries.map((inquiry) => {
              const isExpanded = expandedId === inquiry.id;
              const statusInfo = STATUS_LABELS[inquiry.status] ?? STATUS_LABELS.new;

              return (
                <div key={inquiry.id} className="bg-white border border-[#E8E4DC] rounded-xl overflow-hidden">
                  {/* Fila principal */}
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-[#FAFAF7] transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : inquiry.id)}
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-[#F0F4F0] flex items-center justify-center flex-shrink-0">
                      <User size={16} className="text-[#3A5A3A]" />
                    </div>

                    {/* Info principal */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#1A1208] truncate">
                        {inquiry.firstName} {inquiry.lastName}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-xs text-[#7A6E5E] flex items-center gap-1">
                          <Mail size={10} />
                          {inquiry.email}
                        </span>
                        {inquiry.phone && (
                          <span className="text-xs text-[#7A6E5E] flex items-center gap-1">
                            <Phone size={10} />
                            {inquiry.phone}
                          </span>
                        )}
                        {inquiry.productName && (
                          <span className="text-xs text-[#3A5A3A] font-medium">
                            {inquiry.productName}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Estado y fecha */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      <span className="text-xs text-[#A09080]">
                        {new Date(inquiry.createdAt).toLocaleDateString("es-ES")}
                      </span>
                      {isExpanded ? <ChevronUp size={14} className="text-[#A09080]" /> : <ChevronDown size={14} className="text-[#A09080]" />}
                    </div>
                  </div>

                  {/* Detalle expandido */}
                  {isExpanded && (
                    <div className="border-t border-[#E8E4DC] p-5 bg-[#FAFAF7] space-y-4">
                      {/* Datos de contacto */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-[#5A4E3E] uppercase tracking-wide">Datos de contacto</h4>
                          <div className="space-y-1.5 text-sm text-[#1A1208]">
                            <p className="flex items-center gap-2"><Mail size={13} className="text-[#A09080]" /> {inquiry.email}</p>
                            {inquiry.phone && <p className="flex items-center gap-2"><Phone size={13} className="text-[#A09080]" /> {inquiry.phone}</p>}
                            {(inquiry.province || inquiry.city) && (
                              <p className="flex items-center gap-2">
                                <MapPin size={13} className="text-[#A09080]" />
                                {[inquiry.city, inquiry.province].filter(Boolean).join(", ")}
                              </p>
                            )}
                            {inquiry.housingType && (
                              <p className="flex items-center gap-2"><Home size={13} className="text-[#A09080]" /> {inquiry.housingType}</p>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-[#5A4E3E] uppercase tracking-wide">Producto de interés</h4>
                          <p className="text-sm text-[#1A1208]">{inquiry.productName ?? "No especificado"}</p>
                          {inquiry.observations && (
                            <>
                              <h4 className="text-xs font-semibold text-[#5A4E3E] uppercase tracking-wide mt-2">Observaciones</h4>
                              <p className="text-sm text-[#5A4E3E] italic">"{inquiry.observations}"</p>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Cambio de estado */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-[#5A4E3E] uppercase tracking-wide">Estado de la solicitud</h4>
                        <div className="flex gap-2 flex-wrap">
                          {(["new", "contacted", "qualified", "closed"] as const).map((s) => (
                            <button
                              key={s}
                              onClick={() => handleStatusChange(inquiry.id, s)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                inquiry.status === s
                                  ? `${STATUS_LABELS[s].color} ring-1 ring-current`
                                  : "bg-white border border-[#E8E4DC] text-[#7A6E5E] hover:bg-[#F5F2EC]"
                              }`}
                            >
                              {STATUS_LABELS[s].label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Notas internas */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-[#5A4E3E] uppercase tracking-wide">Notas internas</h4>
                        {editingNotes?.id === inquiry.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={editingNotes.notes}
                              onChange={(e) => setEditingNotes({ id: inquiry.id, notes: e.target.value })}
                              rows={3}
                              className="w-full border border-[#E8E4DC] rounded-lg px-3 py-2 text-sm text-[#1A1208] focus:outline-none focus:ring-1 focus:ring-[#3A5A3A] resize-none bg-white"
                              placeholder="Notas privadas sobre esta solicitud..."
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveNotes(inquiry.id)}
                                disabled={updateMutation.isPending}
                                className="px-3 py-1.5 bg-[#3A5A3A] text-white rounded-lg text-xs hover:bg-[#2E4A2E] transition-colors disabled:opacity-50"
                              >
                                Guardar
                              </button>
                              <button
                                onClick={() => setEditingNotes(null)}
                                className="px-3 py-1.5 border border-[#E8E4DC] text-[#5A4E3E] rounded-lg text-xs hover:bg-[#F5F2EC] transition-colors"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="text-sm text-[#5A4E3E] bg-white border border-[#E8E4DC] rounded-lg px-3 py-2 cursor-pointer hover:border-[#C8C0B0] transition-colors min-h-[60px]"
                            onClick={() => setEditingNotes({ id: inquiry.id, notes: inquiry.internalNotes ?? "" })}
                          >
                            {inquiry.internalNotes ? (
                              <p>{inquiry.internalNotes}</p>
                            ) : (
                              <p className="text-[#A09080] italic">Haz clic para añadir notas internas...</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Acciones rápidas */}
                      <div className="flex gap-2 pt-1">
                        <a
                          href={`https://wa.me/${inquiry.phone?.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${inquiry.firstName}, soy Cristina. Te escribo en relación a tu consulta sobre sistemas de agua.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 bg-[#25D366] text-white rounded-lg text-xs hover:bg-[#1DA851] transition-colors"
                        >
                          <Phone size={12} />
                          WhatsApp
                        </a>
                        <a
                          href={`mailto:${inquiry.email}?subject=Tu consulta sobre sistemas de agua — Cristina Vive Consciente`}
                          className="flex items-center gap-2 px-3 py-1.5 border border-[#E8E4DC] text-[#5A4E3E] rounded-lg text-xs hover:bg-[#F5F2EC] transition-colors"
                        >
                          <Mail size={12} />
                          Email
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </CRMLayout>
  );
}
