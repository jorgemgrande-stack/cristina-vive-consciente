/**
 * AceiteConsultas.tsx — Gestor de consultas de aceites esenciales
 * CRM Cristina Vive Consciente
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import CRMLayout from "@/components/CRMLayout";
import { toast } from "sonner";
import { Loader2, MessageCircle, Mail, Phone, ChevronDown, ChevronUp } from "lucide-react";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new: { label: "Nueva", color: "bg-blue-100 text-blue-700" },
  contacted: { label: "Contactada", color: "bg-amber-100 text-amber-700" },
  qualified: { label: "Cualificada", color: "bg-[oklch(0.92_0.06_148)] text-[oklch(0.38_0.08_148)]" },
  closed: { label: "Cerrada", color: "bg-[oklch(0.94_0.01_80)] text-[oklch(0.52_0.04_80)]" },
};

export default function AceiteConsultas() {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: consultations = [], isLoading } = trpc.oils.admin.listConsultations.useQuery({ limit: 200 });

  const updateMutation = trpc.oils.admin.updateConsultation.useMutation({
    onSuccess: () => {
      toast.success("Consulta actualizada");
      utils.oils.admin.listConsultations.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  function parseProducts(productsList: string | null): { id?: number; name: string; slug?: string }[] {
    try { return JSON.parse(productsList ?? "[]"); } catch { return []; }
  }

  return (
    <CRMLayout title="Aceites Esenciales — Consultas">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h2 className="font-display text-xl text-[oklch(0.18_0.018_55)]">Consultas Personalizadas</h2>
          <p className="text-sm text-[oklch(0.52_0.04_80)] font-body mt-0.5">
            Solicitudes recibidas a través del catálogo de aceites esenciales.
          </p>
        </div>

        {/* Listado */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-[oklch(0.52_0.08_148)]" />
          </div>
        ) : consultations.length === 0 ? (
          <div className="text-center py-16 text-[oklch(0.52_0.04_80)] font-body text-sm">
            No hay consultas todavía.
          </div>
        ) : (
          <div className="space-y-3">
            {consultations.map((c) => {
              const products = parseProducts(c.productsList);
              const isExpanded = expandedId === c.id;
              const statusInfo = STATUS_LABELS[c.status] ?? STATUS_LABELS.new;

              return (
                <div key={c.id} className="bg-white border border-[oklch(0.92_0.01_80)]">
                  {/* Cabecera */}
                  <div
                    className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-[oklch(0.98_0.004_80)] transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : c.id)}
                  >
                    <div className="w-9 h-9 rounded-full bg-[oklch(0.92_0.06_148)] flex items-center justify-center text-[oklch(0.38_0.08_148)] flex-shrink-0">
                      <MessageCircle size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm font-medium text-[oklch(0.18_0.018_55)] truncate">{c.nombre}</p>
                      <p className="text-xs text-[oklch(0.52_0.04_80)] font-body truncate">{c.email}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2">
                      {products.length > 0 && (
                        <span className="text-[0.65rem] font-body px-2 py-0.5 bg-[oklch(0.95_0.01_80)] text-[oklch(0.38_0.02_55)]">
                          {products.length} producto{products.length !== 1 ? "s" : ""}
                        </span>
                      )}
                      <span className={`text-[0.65rem] font-body uppercase tracking-wider px-2 py-0.5 ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <span className="text-xs text-[oklch(0.52_0.04_80)] font-body hidden md:block">
                      {new Date(c.createdAt).toLocaleDateString("es-ES")}
                    </span>
                    {isExpanded ? <ChevronUp size={14} className="text-[oklch(0.52_0.04_80)]" /> : <ChevronDown size={14} className="text-[oklch(0.52_0.04_80)]" />}
                  </div>

                  {/* Detalle expandido */}
                  {isExpanded && (
                    <div className="border-t border-[oklch(0.92_0.01_80)] px-4 py-4 space-y-4">
                      {/* Contacto */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 text-sm font-body text-[oklch(0.38_0.02_55)]">
                          <Mail size={13} className="text-[oklch(0.52_0.04_80)]" />
                          <a href={`mailto:${c.email}`} className="hover:text-[oklch(0.52_0.08_148)] transition-colors">
                            {c.email}
                          </a>
                        </div>
                        {c.telefono && (
                          <div className="flex items-center gap-2 text-sm font-body text-[oklch(0.38_0.02_55)]">
                            <Phone size={13} className="text-[oklch(0.52_0.04_80)]" />
                            <a href={`tel:${c.telefono}`} className="hover:text-[oklch(0.52_0.08_148)] transition-colors">
                              {c.telefono}
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Productos seleccionados */}
                      {products.length > 0 && (
                        <div>
                          <p className="text-xs font-body uppercase tracking-wider text-[oklch(0.52_0.04_80)] mb-2">
                            Productos de interés
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {products.map((p, idx) => (
                              <span key={idx} className="text-xs font-body px-2 py-1 bg-[oklch(0.95_0.02_148)] text-[oklch(0.38_0.08_148)] border border-[oklch(0.88_0.04_148)]">
                                🌿 {p.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Mensaje */}
                      {c.mensaje && (
                        <div>
                          <p className="text-xs font-body uppercase tracking-wider text-[oklch(0.52_0.04_80)] mb-1">Mensaje</p>
                          <p className="text-sm font-body text-[oklch(0.38_0.02_55)] bg-[oklch(0.97_0.006_85)] px-3 py-2 italic">
                            "{c.mensaje}"
                          </p>
                        </div>
                      )}

                      {/* Notas internas */}
                      <div>
                        <p className="text-xs font-body uppercase tracking-wider text-[oklch(0.52_0.04_80)] mb-1">Notas internas</p>
                        <textarea
                          defaultValue={c.internalNotes ?? ""}
                          onBlur={(e) => {
                            if (e.target.value !== (c.internalNotes ?? "")) {
                              updateMutation.mutate({ id: c.id, internalNotes: e.target.value });
                            }
                          }}
                          placeholder="Añade notas sobre esta consulta..."
                          className="w-full text-sm font-body border border-[oklch(0.88_0.01_80)] px-3 py-2 resize-none text-[oklch(0.38_0.02_55)] focus:outline-none focus:border-[oklch(0.52_0.08_148)]"
                          rows={2}
                          style={{ borderRadius: 0 }}
                        />
                      </div>

                      {/* Cambiar estado */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs font-body text-[oklch(0.52_0.04_80)]">Estado:</span>
                        {Object.entries(STATUS_LABELS).map(([key, { label, color }]) => (
                          <button
                            key={key}
                            onClick={() => updateMutation.mutate({ id: c.id, status: key as "new" | "contacted" | "qualified" | "closed" })}
                            className={`text-[0.65rem] font-body uppercase tracking-wider px-2 py-1 transition-opacity ${color} ${
                              c.status === key ? "opacity-100 ring-1 ring-current" : "opacity-50 hover:opacity-80"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                        <a
                          href={`https://wa.me/${(c.telefono ?? "").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hola ${c.nombre.split(" ")[0]}, soy Cristina. He recibido tu consulta sobre aceites esenciales y me encantaría ayudarte. ¿Tienes un momento para hablar?`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`ml-auto text-xs font-body px-3 py-1.5 bg-[oklch(0.52_0.12_148)] text-white hover:bg-[oklch(0.42_0.12_148)] transition-colors ${!c.telefono ? "opacity-40 pointer-events-none" : ""}`}
                          style={{ borderRadius: 0 }}
                        >
                          WhatsApp ↗
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
