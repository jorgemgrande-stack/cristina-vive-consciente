/**
 * CRM ClienteForm — Nuevo / Editar cliente
 * Incluye sección de datos fiscales para facturas correctas
 */

import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Save, Loader2, User, FileText } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import CRMLayout from "@/components/CRMLayout";

export default function ClienteForm() {
  const params = useParams<{ id?: string }>();
  const isEdit = !!params.id && params.id !== "nuevo";
  const clientId = isEdit ? parseInt(params.id!) : undefined;
  const [, navigate] = useLocation();

  const { data: existing } = trpc.crm.clients.get.useQuery(
    { id: clientId! },
    { enabled: isEdit }
  );

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    status: "active" as "active" | "inactive" | "lead",
    birthDate: "",
    // Dirección fiscal
    address: "",
    postalCode: "",
    city: "",
    province: "",
    country: "España",
    nif: "",
    razonSocial: "",
    // Otros
    notes: "",
    referredBy: "",
  });

  useEffect(() => {
    if (existing) {
      setForm({
        firstName: existing.firstName ?? "",
        lastName: existing.lastName ?? "",
        email: existing.email ?? "",
        phone: existing.phone ?? "",
        status: existing.status ?? "active",
        birthDate: existing.birthDate ?? "",
        address: existing.address ?? "",
        postalCode: (existing as any).postalCode ?? "",
        city: existing.city ?? "",
        province: (existing as any).province ?? "",
        country: (existing as any).country ?? "España",
        nif: (existing as any).nif ?? "",
        razonSocial: (existing as any).razonSocial ?? "",
        notes: existing.notes ?? "",
        referredBy: existing.referredBy ?? "",
      });
    }
  }, [existing]);

  const createMutation = trpc.crm.clients.create.useMutation({
    onSuccess: () => {
      toast.success("Cliente creado correctamente");
      navigate("/crm/clientes");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.crm.clients.update.useMutation({
    onSuccess: () => {
      toast.success("Cliente actualizado");
      navigate(`/crm/clientes/${clientId}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error("Nombre y apellido son obligatorios");
      return;
    }
    if (isEdit && clientId) {
      updateMutation.mutate({ id: clientId, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  const inputClass = "w-full px-3 py-2.5 text-sm bg-white border border-[oklch(0.92_0.01_80)] text-[oklch(0.18_0.018_55)] placeholder-[oklch(0.75_0.01_60)] focus:outline-none focus:border-[oklch(0.52_0.08_148)] transition-colors font-body";
  const labelClass = "block text-xs text-[oklch(0.38_0.02_55)] font-body mb-1.5 uppercase tracking-wider";
  const sectionTitle = "flex items-center gap-2 text-xs font-body uppercase tracking-widest text-[oklch(0.52_0.08_148)] mb-4 pb-2 border-b border-[oklch(0.92_0.01_80)]";

  const field = (label: string, key: keyof typeof form, type = "text", required = false, placeholder = "") => (
    <div>
      <label className={labelClass} style={{ fontWeight: 500 }}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={form[key] as string}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        required={required}
        placeholder={placeholder}
        className={inputClass}
        style={{ borderRadius: 0 }}
      />
    </div>
  );

  return (
    <CRMLayout title={isEdit ? "Editar cliente" : "Nuevo cliente"}>
      <div className="max-w-2xl">
        <Link
          href={isEdit ? `/crm/clientes/${clientId}` : "/crm/clientes"}
          className="inline-flex items-center gap-1.5 text-xs text-[oklch(0.52_0.02_60)] font-body hover:text-[oklch(0.52_0.08_148)] transition-colors no-underline mb-6"
        >
          <ArrowLeft size={13} /> Volver
        </Link>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── DATOS PERSONALES ── */}
          <div className="bg-white border border-[oklch(0.92_0.01_80)] p-6 space-y-5">
            <div className={sectionTitle}>
              <User size={13} />
              Datos personales
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field("Nombre", "firstName", "text", true)}
              {field("Apellido", "lastName", "text", true)}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field("Email", "email", "email")}
              {field("Teléfono / WhatsApp", "phone", "tel")}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field("Fecha de nacimiento", "birthDate", "date")}
              <div>
                <label className={labelClass} style={{ fontWeight: 500 }}>Estado</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as any }))}
                  className={inputClass}
                  style={{ borderRadius: 0 }}
                >
                  <option value="active">Activo</option>
                  <option value="lead">Lead</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
            </div>

            {field("Referido por", "referredBy")}

            <div>
              <label className={labelClass} style={{ fontWeight: 500 }}>Notas internas</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={3}
                className={`${inputClass} resize-none`}
                style={{ borderRadius: 0 }}
              />
            </div>
          </div>

          {/* ── DATOS FISCALES ── */}
          <div className="bg-white border border-[oklch(0.92_0.01_80)] p-6 space-y-5">
            <div className={sectionTitle}>
              <FileText size={13} />
              Datos fiscales (para facturas)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field("NIF / DNI / CIF", "nif", "text", false, "ej: 12345678A")}
              {field("Razón social (si empresa)", "razonSocial", "text", false, "ej: Mi Empresa S.L.")}
            </div>

            {field("Dirección", "address", "text", false, "ej: C/ Mayor, 10, 2º A")}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {field("Código postal", "postalCode", "text", false, "28001")}
              {field("Ciudad", "city", "text", false, "Madrid")}
              {field("Provincia", "province", "text", false, "Madrid")}
              {field("País", "country", "text", false, "España")}
            </div>

            <p className="text-[0.7rem] text-[oklch(0.62_0.015_60)] font-body">
              Estos datos aparecerán en el bloque "Facturado a" del PDF de la factura.
            </p>
          </div>

          {/* ── ACCIONES ── */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-body hover:bg-[oklch(0.38_0.07_148)] transition-colors disabled:opacity-60"
              style={{ borderRadius: 0, letterSpacing: "0.08em" }}
            >
              {isPending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              {isEdit ? "Guardar cambios" : "Crear cliente"}
            </button>
            <Link
              href={isEdit ? `/crm/clientes/${clientId}` : "/crm/clientes"}
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
