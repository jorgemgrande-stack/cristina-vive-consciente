/**
 * BookingModal — Solicitud pública de cita
 * Design: "Luz Botánica" — natural, elegante, minimalista
 * Escribe en la tabla appointments del CRM con status "pending"
 * NO duplica lógica del CRM interno
 */

import { useState } from "react";
import { X, Leaf, CheckCircle2, Loader2, MessageCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const SERVICE_OPTIONS = [
  { value: "consulta_acompanamiento", label: "Consulta de Acompañamiento", duration: "90 min" },
  { value: "consulta_naturopata", label: "Consulta Naturópata", duration: "60 min" },
  { value: "consulta_breve", label: "Consulta Breve", duration: "30 min" },
  { value: "consulta_express", label: "Consulta Express", duration: "20 min" },
  { value: "biohabitabilidad", label: "Biohabitabilidad", duration: "90 min" },
  { value: "kinesiologia", label: "Kinesiología", duration: "60 min" },
  { value: "masaje", label: "Masaje Terapéutico", duration: "60 min" },
  { value: "otro", label: "Otro / No sé todavía", duration: "" },
] as const;

const MODALITY_OPTIONS = [
  { value: "zoom", label: "Videollamada (Zoom)" },
  { value: "telefono", label: "Teléfono" },
  { value: "presencial", label: "Presencial" },
  { value: "whatsapp", label: "WhatsApp" },
] as const;

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedService?: string;
}

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  serviceType: string;
  preferredDate: string;
  preferredTime: string;
  modality: string;
  message: string;
};

const initialForm: FormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  serviceType: "consulta_acompanamiento",
  preferredDate: "",
  preferredTime: "",
  modality: "zoom",
  message: "",
};

export default function BookingModal({ isOpen, onClose, preselectedService }: BookingModalProps) {
  const [form, setForm] = useState<FormData>({
    ...initialForm,
    serviceType: preselectedService ?? initialForm.serviceType,
  });
  const [submitted, setSubmitted] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const requestMutation = trpc.bookings.request.useMutation({
    onSuccess: (data) => {
      setSubmitted(true);
      if (data.whatsappUrl) setWhatsappUrl(data.whatsappUrl);
    },
    onError: (err) => {
      toast.error("Ha ocurrido un error. Por favor, inténtalo de nuevo.");
      console.error(err);
    },
  });

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!form.firstName.trim()) newErrors.firstName = "El nombre es obligatorio";
    if (!form.lastName.trim()) newErrors.lastName = "Los apellidos son obligatorios";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Introduce un email válido";
    }
    if (!form.preferredDate) newErrors.preferredDate = "Selecciona una fecha";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    requestMutation.mutate({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      serviceType: form.serviceType as any,
      preferredDate: form.preferredDate,
      preferredTime: form.preferredTime || undefined,
      modality: form.modality as any,
      message: form.message.trim() || undefined,
    });
  };

  const handleClose = () => {
    setForm({ ...initialForm, serviceType: preselectedService ?? initialForm.serviceType });
    setSubmitted(false);
    setWhatsappUrl(null);
    setErrors({});
    onClose();
  };

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // Min date = today
  const today = new Date().toISOString().split("T")[0];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[oklch(0.18_0.018_55)]/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-xl bg-[oklch(0.985_0.006_85)] overflow-y-auto max-h-[90vh]"
        style={{ borderRadius: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-[oklch(0.88_0.015_75)]">
          <div className="flex items-center gap-3">
            <Leaf size={16} className="text-[oklch(0.52_0.08_148)]" />
            <h2
              className="font-display text-[oklch(0.18_0.018_55)]"
              style={{ fontWeight: 400, fontSize: "1.15rem" }}
            >
              Solicitar consulta
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-[oklch(0.52_0.02_60)] hover:text-[oklch(0.18_0.018_55)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          /* ── SUCCESS STATE ── */
          <div className="px-7 py-12 text-center">
            <div className="flex justify-center mb-5">
              <CheckCircle2 size={48} className="text-[oklch(0.52_0.08_148)]" />
            </div>
            <h3
              className="font-display text-[oklch(0.18_0.018_55)] mb-3"
              style={{ fontWeight: 400, fontSize: "1.3rem" }}
            >
              ¡Solicitud recibida!
            </h3>
            <p className="text-[oklch(0.52_0.02_60)] text-sm leading-relaxed mb-6 font-body" style={{ fontWeight: 300 }}>
              Cristina revisará tu solicitud y se pondrá en contacto contigo en las próximas 24–48 horas para confirmar la cita. Recibirás un email de confirmación.
            </p>

            {/* WhatsApp CTA */}
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 mb-4 text-white text-xs tracking-widest uppercase font-body transition-colors w-full justify-center"
                style={{
                  background: "#25D366",
                  borderRadius: 0,
                  letterSpacing: "0.1em",
                  textDecoration: "none",
                }}
              >
                <MessageCircle size={15} />
                Confirmar por WhatsApp
              </a>
            )}

            <button
              onClick={handleClose}
              className="px-6 py-3 border border-[oklch(0.88_0.015_75)] text-[oklch(0.52_0.02_60)] text-xs tracking-widest uppercase font-body hover:border-[oklch(0.52_0.08_148)] hover:text-[oklch(0.52_0.08_148)] transition-colors w-full"
              style={{ letterSpacing: "0.1em" }}
            >
              Cerrar
            </button>
          </div>
        ) : (
          /* ── FORM ── */
          <form onSubmit={handleSubmit} className="px-7 py-6 space-y-5">
            <p className="text-[oklch(0.52_0.02_60)] text-sm font-body leading-relaxed" style={{ fontWeight: 300 }}>
              Rellena el formulario y Cristina confirmará la cita contigo personalmente.
            </p>

            {/* Nombre + Apellidos */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[oklch(0.38_0.02_55)] font-body mb-1.5 uppercase tracking-wider" style={{ fontWeight: 500 }}>
                  Nombre *
                </label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={set("firstName")}
                  placeholder="Tu nombre"
                  className={`w-full px-3 py-2.5 bg-white border text-sm font-body text-[oklch(0.18_0.018_55)] placeholder:text-[oklch(0.72_0.02_60)] focus:outline-none focus:border-[oklch(0.52_0.08_148)] transition-colors ${errors.firstName ? "border-red-400" : "border-[oklch(0.88_0.015_75)]"}`}
                  style={{ borderRadius: 0, fontWeight: 300 }}
                />
                {errors.firstName && <p className="text-red-500 text-[0.7rem] mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <label className="block text-xs text-[oklch(0.38_0.02_55)] font-body mb-1.5 uppercase tracking-wider" style={{ fontWeight: 500 }}>
                  Apellidos *
                </label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={set("lastName")}
                  placeholder="Tus apellidos"
                  className={`w-full px-3 py-2.5 bg-white border text-sm font-body text-[oklch(0.18_0.018_55)] placeholder:text-[oklch(0.72_0.02_60)] focus:outline-none focus:border-[oklch(0.52_0.08_148)] transition-colors ${errors.lastName ? "border-red-400" : "border-[oklch(0.88_0.015_75)]"}`}
                  style={{ borderRadius: 0, fontWeight: 300 }}
                />
                {errors.lastName && <p className="text-red-500 text-[0.7rem] mt-1">{errors.lastName}</p>}
              </div>
            </div>

            {/* Email + Teléfono */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[oklch(0.38_0.02_55)] font-body mb-1.5 uppercase tracking-wider" style={{ fontWeight: 500 }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  placeholder="tu@email.com"
                  className={`w-full px-3 py-2.5 bg-white border text-sm font-body text-[oklch(0.18_0.018_55)] placeholder:text-[oklch(0.72_0.02_60)] focus:outline-none focus:border-[oklch(0.52_0.08_148)] transition-colors ${errors.email ? "border-red-400" : "border-[oklch(0.88_0.015_75)]"}`}
                  style={{ borderRadius: 0, fontWeight: 300 }}
                />
                {errors.email && <p className="text-red-500 text-[0.7rem] mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-xs text-[oklch(0.38_0.02_55)] font-body mb-1.5 uppercase tracking-wider" style={{ fontWeight: 500 }}>
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={set("phone")}
                  placeholder="+34 600 000 000"
                  className="w-full px-3 py-2.5 bg-white border border-[oklch(0.88_0.015_75)] text-sm font-body text-[oklch(0.18_0.018_55)] placeholder:text-[oklch(0.72_0.02_60)] focus:outline-none focus:border-[oklch(0.52_0.08_148)] transition-colors"
                  style={{ borderRadius: 0, fontWeight: 300 }}
                />
              </div>
            </div>

            {/* Tipo de consulta */}
            <div>
              <label className="block text-xs text-[oklch(0.38_0.02_55)] font-body mb-1.5 uppercase tracking-wider" style={{ fontWeight: 500 }}>
                Tipo de consulta *
              </label>
              <select
                value={form.serviceType}
                onChange={set("serviceType")}
                className="w-full px-3 py-2.5 bg-white border border-[oklch(0.88_0.015_75)] text-sm font-body text-[oklch(0.18_0.018_55)] focus:outline-none focus:border-[oklch(0.52_0.08_148)] transition-colors appearance-none cursor-pointer"
                style={{ borderRadius: 0, fontWeight: 300 }}
              >
                {SERVICE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}{opt.duration ? ` — ${opt.duration}` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha + Hora */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[oklch(0.38_0.02_55)] font-body mb-1.5 uppercase tracking-wider" style={{ fontWeight: 500 }}>
                  Fecha preferida *
                </label>
                <input
                  type="date"
                  value={form.preferredDate}
                  onChange={set("preferredDate")}
                  min={today}
                  className={`w-full px-3 py-2.5 bg-white border text-sm font-body text-[oklch(0.18_0.018_55)] focus:outline-none focus:border-[oklch(0.52_0.08_148)] transition-colors ${errors.preferredDate ? "border-red-400" : "border-[oklch(0.88_0.015_75)]"}`}
                  style={{ borderRadius: 0, fontWeight: 300 }}
                />
                {errors.preferredDate && <p className="text-red-500 text-[0.7rem] mt-1">{errors.preferredDate}</p>}
              </div>
              <div>
                <label className="block text-xs text-[oklch(0.38_0.02_55)] font-body mb-1.5 uppercase tracking-wider" style={{ fontWeight: 500 }}>
                  Hora preferida
                </label>
                <input
                  type="time"
                  value={form.preferredTime}
                  onChange={set("preferredTime")}
                  className="w-full px-3 py-2.5 bg-white border border-[oklch(0.88_0.015_75)] text-sm font-body text-[oklch(0.18_0.018_55)] focus:outline-none focus:border-[oklch(0.52_0.08_148)] transition-colors"
                  style={{ borderRadius: 0, fontWeight: 300 }}
                />
              </div>
            </div>

            {/* Modalidad */}
            <div>
              <label className="block text-xs text-[oklch(0.38_0.02_55)] font-body mb-1.5 uppercase tracking-wider" style={{ fontWeight: 500 }}>
                Modalidad
              </label>
              <div className="grid grid-cols-2 gap-2">
                {MODALITY_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2 px-3 py-2.5 border cursor-pointer transition-all duration-200 ${
                      form.modality === opt.value
                        ? "border-[oklch(0.52_0.08_148)] bg-[oklch(0.52_0.08_148)]/5"
                        : "border-[oklch(0.88_0.015_75)] bg-white hover:border-[oklch(0.72_0.04_148)]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="modality"
                      value={opt.value}
                      checked={form.modality === opt.value}
                      onChange={set("modality")}
                      className="sr-only"
                    />
                    <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${form.modality === opt.value ? "border-[oklch(0.52_0.08_148)] bg-[oklch(0.52_0.08_148)]" : "border-[oklch(0.72_0.02_60)]"}`} />
                    <span className="text-xs font-body text-[oklch(0.38_0.02_55)]" style={{ fontWeight: form.modality === opt.value ? 500 : 300 }}>
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Mensaje */}
            <div>
              <label className="block text-xs text-[oklch(0.38_0.02_55)] font-body mb-1.5 uppercase tracking-wider" style={{ fontWeight: 500 }}>
                Cuéntame algo (opcional)
              </label>
              <textarea
                value={form.message}
                onChange={set("message")}
                rows={3}
                placeholder="¿Qué te gustaría trabajar en la consulta? ¿Tienes alguna pregunta?"
                className="w-full px-3 py-2.5 bg-white border border-[oklch(0.88_0.015_75)] text-sm font-body text-[oklch(0.18_0.018_55)] placeholder:text-[oklch(0.72_0.02_60)] focus:outline-none focus:border-[oklch(0.52_0.08_148)] transition-colors resize-none"
                style={{ borderRadius: 0, fontWeight: 300 }}
              />
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={requestMutation.isPending}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-body hover:bg-[oklch(0.38_0.07_148)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ letterSpacing: "0.1em" }}
              >
                {requestMutation.isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar solicitud"
                )}
              </button>
              <p className="text-center text-[oklch(0.72_0.02_60)] text-[0.65rem] mt-3 font-body" style={{ fontWeight: 300 }}>
                Cristina confirmará la cita contigo en 24–48 horas.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
