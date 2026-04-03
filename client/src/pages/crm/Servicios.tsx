/**
 * CRM — Gestor de Servicios
 * Lista, crea, edita y activa/desactiva consultas y masajes.
 * Diseño consistente con el resto del CRM.
 */

import { useState } from "react";
import { Link } from "wouter";
import {
  Plus, Edit2, Trash2, Eye, EyeOff, Clock, Euro,
  ChevronUp, ChevronDown, Star, StarOff, Stethoscope, Waves
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import CRMLayout from "@/components/CRMLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type ServiceType = "consulta" | "masaje" | "otro";

const TYPE_LABELS: Record<ServiceType, string> = {
  consulta: "Consulta",
  masaje: "Masaje",
  otro: "Otro",
};

const MODALITY_LABELS: Record<string, string> = {
  online: "Online",
  presencial: "Presencial",
  ambos: "Presencial / Online",
};

export default function Servicios() {
  const [filterType, setFilterType] = useState<ServiceType | "all">("all");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: services = [], isLoading } = trpc.services.listAdmin.useQuery();

  const toggleStatus = trpc.services.toggleStatus.useMutation({
    onSuccess: () => {
      utils.services.listAdmin.invalidate();
      toast.success("Estado actualizado");
    },
    onError: () => toast.error("Error al cambiar el estado"),
  });

  const deleteService = trpc.services.delete.useMutation({
    onSuccess: () => {
      utils.services.listAdmin.invalidate();
      toast.success("Servicio eliminado");
      setDeletingId(null);
    },
    onError: () => toast.error("Error al eliminar el servicio"),
  });

  const reorder = trpc.services.reorder.useMutation({
    onSuccess: () => utils.services.listAdmin.invalidate(),
  });

  // Filtrar por tipo
  const filtered = filterType === "all"
    ? services
    : services.filter((s) => s.type === filterType);

  // Mover orden dentro del mismo tipo
  function handleMove(service: typeof services[0], dir: "up" | "down") {
    const sameType = services.filter((s) => s.type === service.type).sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sameType.findIndex((s) => s.id === service.id);
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sameType.length) return;

    const newOrder = sameType.map((s, i) => {
      if (i === idx) return { id: s.id, sortOrder: sameType[swapIdx].sortOrder };
      if (i === swapIdx) return { id: s.id, sortOrder: sameType[idx].sortOrder };
      return { id: s.id, sortOrder: s.sortOrder };
    });
    reorder.mutate(newOrder);
  }

  const consultasCount = services.filter((s) => s.type === "consulta").length;
  const masajesCount = services.filter((s) => s.type === "masaje").length;
  const activeCount = services.filter((s) => s.status === "active").length;

  return (
    <CRMLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Cabecera */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-stone-800">Servicios</h1>
            <p className="text-sm text-stone-500 mt-0.5">
              Gestiona consultas y masajes que aparecen en la web
            </p>
          </div>
          <Link href="/crm/servicios/nuevo">
            <Button className="gap-2 bg-[oklch(0.45_0.1_140)] hover:bg-[oklch(0.38_0.1_140)] text-white">
              <Plus size={16} />
              Nuevo servicio
            </Button>
          </Link>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Consultas", value: consultasCount, icon: <Stethoscope size={18} className="text-[oklch(0.52_0.08_148)]" /> },
            { label: "Masajes", value: masajesCount, icon: <Waves size={18} className="text-[oklch(0.52_0.08_148)]" /> },
            { label: "Activos", value: activeCount, icon: <Eye size={18} className="text-[oklch(0.52_0.08_148)]" /> },
          ].map((m) => (
            <div key={m.label} className="bg-white rounded-xl border border-stone-100 p-4 flex items-center gap-3">
              {m.icon}
              <div>
                <p className="text-2xl font-semibold text-stone-800">{m.value}</p>
                <p className="text-xs text-stone-500">{m.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filtros de tipo */}
        <div className="flex gap-2">
          {(["all", "consulta", "masaje", "otro"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterType === t
                  ? "bg-[oklch(0.45_0.1_140)] text-white"
                  : "bg-white border border-stone-200 text-stone-600 hover:border-[oklch(0.45_0.1_140)] hover:text-[oklch(0.45_0.1_140)]"
              }`}
            >
              {t === "all" ? "Todos" : TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Lista de servicios */}
        {isLoading ? (
          <div className="text-center py-12 text-stone-400 text-sm">Cargando servicios...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-stone-100">
            <p className="text-stone-400 text-sm">No hay servicios en esta categoría.</p>
            <Link href="/crm/servicios/nuevo">
              <Button variant="outline" size="sm" className="mt-3 gap-2">
                <Plus size={14} /> Crear primer servicio
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((service) => {
              const sameType = services.filter((s) => s.type === service.type).sort((a, b) => a.sortOrder - b.sortOrder);
              const idx = sameType.findIndex((s) => s.id === service.id);
              const isFirst = idx === 0;
              const isLast = idx === sameType.length - 1;

              return (
                <div
                  key={service.id}
                  className={`bg-white rounded-xl border p-4 flex gap-4 items-start transition-all ${
                    service.status === "inactive" ? "opacity-60 border-stone-100" : "border-stone-200"
                  }`}
                >
                  {/* Imagen */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-stone-50 flex-shrink-0">
                    {service.imageUrl ? (
                      <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-200">
                        {service.type === "masaje" ? <Waves size={24} /> : <Stethoscope size={24} />}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <h3 className="font-medium text-stone-800 text-sm leading-snug">{service.name}</h3>
                      {service.featured === 1 && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100">
                          Destacado
                        </span>
                      )}
                      <Badge
                        variant={service.status === "active" ? "default" : "secondary"}
                        className={`text-[10px] h-5 ${service.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50" : ""}`}
                      >
                        {service.status === "active" ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>

                    {service.shortDescription && (
                      <p className="text-xs text-stone-500 mt-1 line-clamp-1">{service.shortDescription}</p>
                    )}

                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-stone-400">
                        <Clock size={11} />
                        {service.durationLabel ?? `${service.durationMinutes} min`}
                      </span>
                      {service.price && (
                        <span className="flex items-center gap-1 text-xs font-medium text-[oklch(0.38_0.08_148)]">
                          <Euro size={11} />
                          {parseFloat(service.price).toFixed(0)}€
                        </span>
                      )}
                      <span className="text-xs text-stone-400">
                        {MODALITY_LABELS[service.modality] ?? service.modality}
                      </span>
                      <span className="text-xs text-stone-300">
                        {TYPE_LABELS[service.type as ServiceType] ?? service.type}
                      </span>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Reordenar */}
                    <div className="flex flex-col">
                      <button
                        onClick={() => handleMove(service, "up")}
                        disabled={isFirst}
                        className="p-1 text-stone-300 hover:text-stone-600 disabled:opacity-20 disabled:cursor-not-allowed"
                        title="Subir"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        onClick={() => handleMove(service, "down")}
                        disabled={isLast}
                        className="p-1 text-stone-300 hover:text-stone-600 disabled:opacity-20 disabled:cursor-not-allowed"
                        title="Bajar"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>

                    {/* Activar/desactivar */}
                    <button
                      onClick={() => toggleStatus.mutate({ id: service.id })}
                      className="p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors"
                      title={service.status === "active" ? "Desactivar" : "Activar"}
                    >
                      {service.status === "active" ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>

                    {/* Editar */}
                    <Link href={`/crm/servicios/${service.id}/editar`}>
                      <button className="p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors" title="Editar">
                        <Edit2 size={15} />
                      </button>
                    </Link>

                    {/* Eliminar */}
                    {deletingId === service.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => deleteService.mutate({ id: service.id })}
                          className="px-2 py-1 text-xs rounded bg-red-500 text-white hover:bg-red-600"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="px-2 py-1 text-xs rounded bg-stone-100 text-stone-600 hover:bg-stone-200"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingId(service.id)}
                        className="p-2 rounded-lg text-stone-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Nota informativa */}
        <div className="bg-[oklch(0.97_0.01_148)] border border-[oklch(0.90_0.03_148)] rounded-xl p-4 text-xs text-[oklch(0.42_0.07_148)]">
          <strong>Nota:</strong> Los cambios en servicios se reflejan automáticamente en las páginas de Consultas y Masajes de la web. El <strong>slug</strong> de cada servicio conecta con el sistema de reservas — no lo modifiques si ya hay citas asociadas.
        </div>
      </div>
    </CRMLayout>
  );
}
