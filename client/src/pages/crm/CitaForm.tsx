/**
 * CRM CitaForm — Nueva cita
 */

import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import CRMLayout from "@/components/CRMLayout";

const SERVICE_OPTIONS = [
  { value: "consulta_acompanamiento", label: "Consulta Acompañamiento (90min)" },
  { value: "consulta_naturopata", label: "Consulta Naturopata (60min)" },
  { value: "consulta_breve", label: "Consulta Breve (45min)" },
  { value: "consulta_express", label: "Consulta Express (30min)" },
  { value: "biohabitabilidad", label: "Biohabitabilidad" },
  { value: "kinesiologia", label: "Kinesiología" },
  { value: "masaje", label: "Masaje" },
  { value: "otro", label: "Otro" },
];

const DURATION_BY_SERVICE: Record<string, number> = {
  consulta_acompanamiento: 90,
  consulta_naturopata: 60,
  consulta_breve: 45,
  consulta_express: 30,
  biohabitabilidad: 60,
  kinesiologia: 60,
  masaje: 60,
  otro: 60,
};

export default function CitaForm() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const preClientId = params.get("clientId") ? parseInt(params.get("clientId")!) : undefined;
  const [, navigate] = useLocation();

  const { data: clients } = trpc.crm.clients.list.useQuery({});

  const [form, setForm] = useState({
    clientId: preClientId ?? 0,
    serviceType: "consulta_acompanamiento" as any,
    scheduledDate: "",
    scheduledTime: "10:00",
    durationMinutes: 90,
    modality: "presencial" as "presencial" | "telefono" | "zoom" | "whatsapp",
    status: "confirmed" as "pending" | "confirmed" | "completed" | "cancelled" | "rescheduled",
    price: "",
    internalNotes: "",
  });

  const createMutation = trpc.crm.appointments.create.useMutation({
    onSuccess: () => {
      toast.success("Cita creada correctamente");
      if (preClientId) navigate(`/crm/clientes/${preClientId}`);
      else navigate("/crm/citas");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleServiceChange = (v: string) => {
    setForm((f) => ({
      ...f,
      serviceType: v as any,
      durationMinutes: DURATION_BY_SERVICE[v] ?? 60,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientId) { toast.error("Selecciona un cliente"); return; }
    if (!form.scheduledDate) { toast.error("Selecciona una fecha"); return; }
    const [year, month, day] = form.scheduledDate.split("-").map(Number);
    const [hour, minute] = form.scheduledTime.split(":").map(Number);
    const scheduledAt = new Date(year, month - 1, day, hour, minute).getTime();
    createMutation.mutate({
      clientId: form.clientId,
      serviceType: form.serviceType,
      scheduledAt,
      durationMinutes: form.durationMinutes,
      modality: form.modality,
      status: form.status,
      price: form.price || undefined,
      internalNotes: form.internalNotes || undefined,
    });
  };

  const selectClass = "w-full px-3 py-2.5 text-sm bg-white border border-[oklch(0.92_0.01_80)] text-[oklch(0.18_0.018_55)] focus:outline-none focus:border-[oklch(0.52_0.08_148)] transition-colors font-body cursor-pointer";
  const inputClass = "w-full px-3 py-2.5 text-sm bg-white border border-[oklch(0.92_0.01_80)] text-[oklch(0.18_0.018_55)] focus:outline-none focus:border-[oklch(0.52_0.08_148)] transition-colors font-body";
  const labelClass = "block text-xs text-[oklch(0.38_0.02_55)] font-body mb-1.5 uppercase tracking-wider";

  return (
    <CRMLayout title="Nueva cita">
      <div className="max-w-2xl">
        <Link
          href={preClientId ? `/crm/clientes/${preClientId}` : "/crm/citas"}
          className="inline-flex items-center gap-1.5 text-xs text-[oklch(0.52_0.02_60)] font-body hover:text-[oklch(0.52_0.08_148)] transition-colors no-underline mb-6"
        >
          <ArrowLeft size={13} /> Volver
        </Link>

        <form onSubmit={handleSubmit} className="bg-white border border-[oklch(0.92_0.01_80)] p-6 space-y-5">
          {/* Cliente */}
          <div>
            <label className={labelClass} style={{ fontWeight: 500 }}>
              Cliente <span className="text-red-500">*</span>
            </label>
            <select
              value={form.clientId || ""}
              onChange={(e) => setForm((f) => ({ ...f, clientId: parseInt(e.target.value) }))}
              required
              className={selectClass}
              style={{ borderRadius: 0 }}
            >
              <option value="">Seleccionar cliente...</option>
              {clients?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} {c.phone ? `· ${c.phone}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Servicio */}
          <div>
            <label className={labelClass} style={{ fontWeight: 500 }}>Servicio</label>
            <select
              value={form.serviceType}
              onChange={(e) => handleServiceChange(e.target.value)}
              className={selectClass}
              style={{ borderRadius: 0 }}
            >
              {SERVICE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Fecha y hora */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass} style={{ fontWeight: 500 }}>
                Fecha <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.scheduledDate}
                onChange={(e) => setForm((f) => ({ ...f, scheduledDate: e.target.value }))}
                required
                className={inputClass}
                style={{ borderRadius: 0 }}
              />
            </div>
            <div>
              <label className={labelClass} style={{ fontWeight: 500 }}>Hora</label>
              <input
                type="time"
                value={form.scheduledTime}
                onChange={(e) => setForm((f) => ({ ...f, scheduledTime: e.target.value }))}
                className={inputClass}
                style={{ borderRadius: 0 }}
              />
            </div>
          </div>

          {/* Duración, modalidad, estado */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass} style={{ fontWeight: 500 }}>Duración (min)</label>
              <input
                type="number"
                value={form.durationMinutes}
                onChange={(e) => setForm((f) => ({ ...f, durationMinutes: parseInt(e.target.value) }))}
                min={15}
                max={240}
                className={inputClass}
                style={{ borderRadius: 0 }}
              />
            </div>
            <div>
              <label className={labelClass} style={{ fontWeight: 500 }}>Modalidad</label>
              <select
                value={form.modality}
                onChange={(e) => setForm((f) => ({ ...f, modality: e.target.value as any }))}
                className={selectClass}
                style={{ borderRadius: 0 }}
              >
                <option value="presencial">Presencial</option>
                <option value="telefono">Teléfono</option>
                <option value="zoom">Zoom</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
            <div>
              <label className={labelClass} style={{ fontWeight: 500 }}>Estado</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as any }))}
                className={selectClass}
                style={{ borderRadius: 0 }}
              >
                <option value="pending">Pendiente</option>
                <option value="confirmed">Confirmada</option>
                <option value="completed">Completada</option>
                <option value="cancelled">Cancelada</option>
                <option value="rescheduled">Reprogramada</option>
              </select>
            </div>
          </div>

          {/* Precio */}
          <div>
            <label className={labelClass} style={{ fontWeight: 500 }}>Precio (€)</label>
            <input
              type="text"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              placeholder="ej: 80"
              className={inputClass}
              style={{ borderRadius: 0 }}
            />
          </div>

          {/* Notas */}
          <div>
            <label className={labelClass} style={{ fontWeight: 500 }}>Notas internas</label>
            <textarea
              value={form.internalNotes}
              onChange={(e) => setForm((f) => ({ ...f, internalNotes: e.target.value }))}
              rows={3}
              className={`${inputClass} resize-none`}
              style={{ borderRadius: 0 }}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-body hover:bg-[oklch(0.38_0.07_148)] transition-colors disabled:opacity-60"
              style={{ borderRadius: 0, letterSpacing: "0.08em" }}
            >
              {createMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              Crear cita
            </button>
            <Link
              href={preClientId ? `/crm/clientes/${preClientId}` : "/crm/citas"}
              className="inline-flex items-center px-6 py-2.5 border border-[oklch(0.92_0.01_80)] text-[oklch(0.38_0.02_55)] text-xs tracking-widest uppercase font-body hover:border-[oklch(0.52_0.08_148)] transition-colors no-underline"
              style={{ borderRadius: 0, letterSpacing: "0.08em" }}
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </CRMLayout>
  );
}
