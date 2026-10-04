/**
 * BookingModal — Solicitud pública de cita (consultas y masajes)
 * Design: "Luz Botánica" — natural, elegante, minimalista
 * Escribe en la tabla appointments del CRM con status "pending": es una SOLICITUD, no una
 * reserva confirmada hasta que Cristina la acepta. NO duplica lógica del CRM interno.
 *
 * Si el servicio elegido es un masaje, el formulario cambia: se presenta como reserva de masaje,
 * muestra duración/precio/lugar, solo ofrece modalidad presencial, pide una franja horaria y
 * añade un paso de resumen antes de enviar. Las consultas mantienen el formulario de siempre.
 */

import { useEffect, useState } from "react";
import { X, Leaf, CheckCircle2, Loader2, MessageCircle, MapPin } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  CANCELLATION_POLICY,
  CENTER_MAPS_URL,
  MASSAGE_LOCATION,
  directWhatsAppReservationUrl,
  OPENING_HOURS_TEXT,
  PAYMENT_NOTE,
  formatHomeAddress,
  getHomePrice,
  validateHomeAddress,
  bookableTimes,
  type ServiceLocation,
} from "@shared/booking";
import { BOOKING_EVENTS } from "@shared/bookingAnalytics";
import { trackBookingEvent } from "@/lib/analytics";
import { isValidPhone } from "@shared/phone";

// Fallback estático por si la BD no responde
const FALLBACK_SERVICES = [
  { value: "consulta_acompanamiento", label: "Consulta de Acompañamiento", duration: "90 min" },
  { value: "consulta_naturopata", label: "Consulta Naturópata", duration: "60 min" },
  { value: "consulta_breve", label: "Consulta Breve", duration: "30 min" },
  { value: "consulta_express", label: "Consulta Express", duration: "20 min" },
  { value: "biohabitabilidad", label: "Biohabitabilidad", duration: "90 min" },
  { value: "kinesiologia", label: "Kinesiología", duration: "60 min" },
  { value: "masaje", label: "Masaje Terapéutico", duration: "60 min" },
  { value: "otro", label: "Otro / No sé todavía", duration: "" },
];

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
  serviceLocation: ServiceLocation;
  serviceStreet: string;
  servicePostalCode: string;
  serviceCity: string;
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
  serviceLocation: "consulta",
  serviceStreet: "",
  servicePostalCode: "",
  serviceCity: "",
  message: "",
};

/** "70.00" → "70 €"; sin precio fijo → "Consultar tarifa" */
function formatPrice(price?: string | null): string {
  if (!price) return "Consultar tarifa";
  const n = Number(price);
  return Number.isFinite(n) ? `${Number.isInteger(n) ? n : n.toFixed(2)} €` : "Consultar tarifa";
}

export default function BookingModal({ isOpen, onClose, preselectedService }: BookingModalProps) {
  const [form, setForm] = useState<FormData>({
    ...initialForm,
    serviceType: preselectedService ?? initialForm.serviceType,
  });
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState<"form" | "review">("form");
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // Cargar servicios activos desde la BD
  const { data: dbServices = [] } = trpc.services.list.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 min cache
  });

  // Si el modal se abre desde un masaje (ficha o listado de masajes), el selector solo ofrece masajes.
  const isMassageSlug = (slug: string) =>
    dbServices.find((s) => s.slug === slug)?.type === "masaje" || slug === "masaje" || slug.startsWith("masaje_");
  const massageOnly = !!preselectedService && isMassageSlug(preselectedService);

  // Construir opciones del selector: BD (+ opción "Otro" solo fuera del modo masaje)
  const allOptions = dbServices.length > 0
    ? [
        ...dbServices.map((s) => ({
          value: s.slug,
          label: s.name,
          duration: s.durationLabel ?? (s.durationMinutes ? `${s.durationMinutes} min` : ""),
          isMassage: s.type === "masaje",
        })),
        { value: "otro", label: "Otro / No sé todavía", duration: "", isMassage: false },
      ]
    : FALLBACK_SERVICES.map((o) => ({ ...o, isMassage: o.value === "masaje" }));
  const serviceOptions = massageOnly ? allOptions.filter((o) => o.isMassage) : allOptions;

  // Servicio elegido y si es un masaje (los masajes tienen su propio formulario)
  const selectedService = dbServices.find((s) => s.slug === form.serviceType);
  const isMassage = selectedService?.type === "masaje" || form.serviceType === "masaje";
  const selectedOption = serviceOptions.find((o) => o.value === form.serviceType);
  // Servicio a domicilio: solo si el servicio tiene tarifa a domicilio configurada
  const homePrice = isMassage ? getHomePrice(selectedService) : null;
  const isHome = homePrice !== null && form.serviceLocation === "domicilio";
  const inPlacePrice = selectedService?.price ?? null;
  const shownPrice = isHome ? `${homePrice} €` : formatPrice(inPlacePrice);
  const timeOptions = bookableTimes(form.preferredDate, selectedService?.durationMinutes);

  // Modalidad coherente con el servicio: masaje = presencial; al salir de un masaje se vuelve a Zoom.
  const modalityFor = (slug: string, current: string) =>
    isMassageSlug(slug) ? "presencial" : current === "presencial" && isMassage ? "zoom" : current;

  // Al abrir el modal (o cambiar el servicio preseleccionado) se reinicia el servicio elegido.
  // Sin esto, el modal —que está montado siempre— conservaba el servicio de la primera apertura.
  useEffect(() => {
    if (!isOpen) return;
    const slug = preselectedService ?? form.serviceType;
    setForm((prev) => ({
      ...prev,
      serviceType: slug,
      modality: isMassageSlug(slug) ? "presencial" : prev.modality,
    }));
    setStep("form");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, preselectedService, dbServices.length]);

  // Señal secundaria (intención, no conversión): una vez por apertura del formulario
  useEffect(() => {
    if (isOpen) trackBookingEvent(BOOKING_EVENTS.FORM_OPENED, { service_slug: preselectedService ?? "sin_preseleccion" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const requestMutation = trpc.bookings.request.useMutation({
    onSuccess: (data) => {
      // Solo cuenta como conversión una solicitud NUEVA aceptada por el servidor (un reenvío duplicado no).
      if (!("duplicate" in data && data.duplicate)) {
        trackBookingEvent(BOOKING_EVENTS.REQUEST_SUBMITTED, {
          service_slug: form.serviceType,
          service_group: isMassage ? "masaje" : "consulta",
          modality: isMassage ? "presencial" : form.modality,
        });
      }
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
    if (!isValidPhone(form.phone)) newErrors.phone = form.phone.trim() ? "Introduce un teléfono válido (con prefijo si no es español)" : "El teléfono es obligatorio";
    if (!form.preferredDate) newErrors.preferredDate = "Selecciona una fecha";
    if (isMassage && form.preferredDate && !timeOptions.includes(form.preferredTime)) newErrors.preferredTime = "Elige una hora";
    if (isHome) {
      const ae = validateHomeAddress({ street: form.serviceStreet, postalCode: form.servicePostalCode, city: form.serviceCity });
      if (ae.street) newErrors.serviceStreet = ae.street;
      if (ae.postalCode) newErrors.servicePostalCode = ae.postalCode;
      if (ae.city) newErrors.serviceCity = ae.city;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    // Masajes: primero un resumen para que el cliente vea exactamente qué envía
    if (isMassage && step === "form") {
      setStep("review");
      return;
    }
    requestMutation.mutate({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      serviceType: form.serviceType as any,
      preferredDate: form.preferredDate,
      preferredTime: form.preferredTime || undefined,
      serviceLocation: isMassage ? (isHome ? "domicilio" : "consulta") : undefined,
      serviceStreet: isHome ? form.serviceStreet.trim() : undefined,
      servicePostalCode: isHome ? form.servicePostalCode.trim() : undefined,
      serviceCity: isHome ? form.serviceCity.trim() : undefined,
      modality: (isMassage ? "presencial" : form.modality) as any,
      message: form.message.trim() || undefined,
    });
  };

  const handleClose = () => {
    setForm({ ...initialForm, serviceType: preselectedService ?? initialForm.serviceType });
    setSubmitted(false);
    setStep("form");
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* z-[70]: por encima de la cabecera (z-50) y del botón flotante de WhatsApp (z-50) */}
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
              {isMassage ? "Reservar masaje" : "Solicitar consulta"}
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
              {isMassage ? "Solicitud recibida" : "¡Solicitud recibida!"}
            </h3>
            <p className="text-[oklch(0.52_0.02_60)] text-sm leading-relaxed mb-6 font-body" style={{ fontWeight: 300 }}>
              {isMassage ? (
                <>
                  <strong style={{ fontWeight: 500 }}>Tu cita queda pendiente de confirmación de Cristina.</strong>{" "}
                  La fecha y la franja que has indicado son una preferencia: todavía no es una reserva confirmada.
                  Cristina te escribirá por email y por teléfono o WhatsApp en las próximas 24–48 horas para confirmar la hora o proponerte otra.
                  Mientras tanto recibirás un email con el resumen de tu solicitud.
                </>
              ) : (
                "Cristina revisará tu solicitud y se pondrá en contacto contigo en las próximas 24–48 horas para confirmar la cita. Recibirás un email de confirmación."
              )}
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
                Avisar a Cristina por WhatsApp (opcional)
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
              {isMassage
                ? "Envía tu solicitud de masaje. Cristina la revisará y te confirmará la cita personalmente: hasta entonces la fecha es solo una preferencia."
                : "Rellena el formulario y Cristina confirmará la cita contigo personalmente."}
            </p>

            {/* Campos del formulario (se ocultan en el paso de resumen de los masajes) */}
            <div className={isMassage && step === "review" ? "hidden" : "space-y-5"}>
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

            {/* Email + Teléfono (en una columna en móvil: el teléfono no cabía) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  Teléfono *
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={set("phone")}
                  placeholder="+34 600 000 000"
                  className={`w-full px-3 py-2.5 bg-white border text-sm font-body text-[oklch(0.18_0.018_55)] placeholder:text-[oklch(0.72_0.02_60)] focus:outline-none focus:border-[oklch(0.52_0.08_148)] transition-colors ${errors.phone ? "border-red-400" : "border-[oklch(0.88_0.015_75)]"}`}
                  style={{ borderRadius: 0, fontWeight: 300 }}
                />
                {errors.phone && <p className="text-red-500 text-[0.7rem] mt-1">{errors.phone}</p>}
              </div>
            </div>

            {/* Tipo de consulta */}
            <div>
              <label className="block text-xs text-[oklch(0.38_0.02_55)] font-body mb-1.5 uppercase tracking-wider" style={{ fontWeight: 500 }}>
                {isMassage ? "Masaje *" : "Tipo de consulta *"}
              </label>
              <select
                value={form.serviceType}
                onChange={(e) => {
                  const slug = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    serviceType: slug,
                    modality: modalityFor(slug, prev.modality),
                    serviceLocation: getHomePrice(dbServices.find((s) => s.slug === slug)) === null ? "consulta" : prev.serviceLocation,
                    preferredTime: isMassageSlug(slug) ? "" : prev.preferredTime,
                  }));
                }}
                className="w-full px-3 py-2.5 bg-white border border-[oklch(0.88_0.015_75)] text-sm font-body text-[oklch(0.18_0.018_55)] focus:outline-none focus:border-[oklch(0.52_0.08_148)] transition-colors appearance-none cursor-pointer"
                style={{ borderRadius: 0, fontWeight: 300 }}
              >
                {serviceOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}{opt.duration ? ` — ${opt.duration}` : ""}
                  </option>
                ))}
              </select>
              {isMassage && selectedService && (
                <div className="mt-3 border border-[oklch(0.88_0.015_75)] bg-white px-4 py-3 text-xs font-body text-[oklch(0.38_0.02_55)] space-y-1" style={{ fontWeight: 300 }}>
                  <p>
                    <span className="text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 500 }}>{selectedService.name}</span>
                    {" · "}
                    {selectedService.durationLabel ?? `${selectedService.durationMinutes} min`}
                    {" · "}
                    {formatPrice(selectedService.price)} en consulta
                    {homePrice !== null && <> · {homePrice} € a domicilio</>}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <MapPin size={11} className="text-[oklch(0.52_0.08_148)]" />
                    <span>
                      {MASSAGE_LOCATION}
                      {" · "}
                      <a href={CENTER_MAPS_URL} target="_blank" rel="noopener noreferrer" className="underline text-[oklch(0.40_0.07_148)]">Ver en Google Maps</a>
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Fecha + Hora/Franja (en una columna en móvil: la franja salía cortada) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[oklch(0.38_0.02_55)] font-body mb-1.5 uppercase tracking-wider" style={{ fontWeight: 500 }}>
                  Fecha preferida *
                </label>
                <input
                  type="date"
                  value={form.preferredDate}
                  onChange={(e) => {
                    const date = e.target.value;
                    setForm((prev) => ({ ...prev, preferredDate: date, preferredTime: isMassage && !bookableTimes(date, selectedService?.durationMinutes).includes(prev.preferredTime) ? "" : prev.preferredTime }));
                    if (errors.preferredDate) setErrors((prev) => ({ ...prev, preferredDate: undefined }));
                  }}
                  min={today}
                  className={`w-full px-3 py-2.5 bg-white border text-sm font-body text-[oklch(0.18_0.018_55)] focus:outline-none focus:border-[oklch(0.52_0.08_148)] transition-colors ${errors.preferredDate ? "border-red-400" : "border-[oklch(0.88_0.015_75)]"}`}
                  style={{ borderRadius: 0, fontWeight: 300 }}
                />
                {errors.preferredDate && <p className="text-red-500 text-[0.7rem] mt-1">{errors.preferredDate}</p>}
              </div>
              <div>
                <label className="block text-xs text-[oklch(0.38_0.02_55)] font-body mb-1.5 uppercase tracking-wider" style={{ fontWeight: 500 }}>
                  {isMassage ? "Hora preferida *" : "Hora preferida"}
                </label>
                {isMassage ? (
                  <>
                    <select
                      value={form.preferredTime}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, preferredTime: e.target.value }));
                        if (errors.preferredTime) setErrors((prev) => ({ ...prev, preferredTime: undefined }));
                      }}
                      disabled={!form.preferredDate || timeOptions.length === 0}
                      className={`w-full px-3 py-2.5 bg-white border text-sm font-body text-[oklch(0.18_0.018_55)] focus:outline-none focus:border-[oklch(0.52_0.08_148)] transition-colors appearance-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${errors.preferredTime ? "border-red-400" : "border-[oklch(0.88_0.015_75)]"}`}
                      style={{ borderRadius: 0, fontWeight: 300 }}
                    >
                      <option value="">
                        {!form.preferredDate ? "Elige primero la fecha" : timeOptions.length === 0 ? "Sin horas disponibles ese día" : "Elige una hora"}
                      </option>
                      {timeOptions.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    {errors.preferredTime && <p className="text-red-500 text-[0.7rem] mt-1">{errors.preferredTime}</p>}
                  </>
                ) : (
                  <input
                    type="time"
                    value={form.preferredTime}
                    onChange={set("preferredTime")}
                    className="w-full px-3 py-2.5 bg-white border border-[oklch(0.88_0.015_75)] text-sm font-body text-[oklch(0.18_0.018_55)] focus:outline-none focus:border-[oklch(0.52_0.08_148)] transition-colors"
                    style={{ borderRadius: 0, fontWeight: 300 }}
                  />
                )}
              </div>
            </div>

            {/* Modalidad */}
            {isMassage ? (
              <div>
                <p className="mb-2 text-[0.7rem] font-body text-[oklch(0.52_0.02_60)] leading-relaxed" style={{ fontWeight: 300 }}>
                  Horario de Cristina: {OPENING_HOURS_TEXT}.
                </p>
                <label className="block text-xs text-[oklch(0.38_0.02_55)] font-body mb-1.5 uppercase tracking-wider" style={{ fontWeight: 500 }}>
                  ¿Dónde quieres el masaje?
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {([
                    { v: "consulta" as const, title: `En consulta — ${MASSAGE_LOCATION}`, price: formatPrice(inPlacePrice) },
                    ...(homePrice !== null ? [{ v: "domicilio" as const, title: "A domicilio", price: `${homePrice} €` }] : []),
                  ]).map((o) => (
                    <label
                      key={o.v}
                      className={`flex items-center justify-between gap-3 px-3 py-2.5 border cursor-pointer text-xs font-body text-[oklch(0.38_0.02_55)] ${
                        form.serviceLocation === o.v || (homePrice === null && o.v === "consulta")
                          ? "border-[oklch(0.52_0.08_148)] bg-[oklch(0.52_0.08_148)]/5"
                          : "border-[oklch(0.88_0.015_75)] bg-white"
                      }`}
                      style={{ fontWeight: form.serviceLocation === o.v ? 500 : 300 }}
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="serviceLocation"
                          value={o.v}
                          checked={form.serviceLocation === o.v || (homePrice === null && o.v === "consulta")}
                          onChange={() => setForm((prev) => ({ ...prev, serviceLocation: o.v }))}
                          className="sr-only"
                        />
                        <MapPin size={13} className="text-[oklch(0.52_0.08_148)] flex-shrink-0" />
                        {o.title}
                      </span>
                      <span>{o.price}</span>
                    </label>
                  ))}
                </div>
                {isHome && (
                  <div className="mt-3 space-y-3">
                    <p className="text-xs text-[oklch(0.38_0.02_55)] font-body uppercase tracking-wider" style={{ fontWeight: 500 }}>
                      Dirección donde quieres el masaje *
                    </p>
                    <div>
                      <input
                        type="text"
                        value={form.serviceStreet}
                        onChange={set("serviceStreet")}
                        placeholder="Calle y número (piso, puerta…)"
                        autoComplete="address-line1"
                        maxLength={160}
                        aria-label="Calle y número"
                        className={`w-full px-3 py-2.5 bg-white border text-sm font-body text-[oklch(0.18_0.018_55)] placeholder:text-[oklch(0.72_0.02_60)] focus:outline-none focus:border-[oklch(0.52_0.08_148)] transition-colors ${errors.serviceStreet ? "border-red-400" : "border-[oklch(0.88_0.015_75)]"}`}
                        style={{ borderRadius: 0, fontWeight: 300 }}
                      />
                      {errors.serviceStreet && <p className="text-red-500 text-[0.7rem] mt-1">{errors.serviceStreet}</p>}
                    </div>
                    <div className="grid grid-cols-[7.5rem_1fr] gap-3">
                      <div>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={form.servicePostalCode}
                          onChange={(e) => setForm((prev) => ({ ...prev, servicePostalCode: e.target.value.replace(/\D/g, "").slice(0, 5) }))}
                          placeholder="C. postal"
                          autoComplete="postal-code"
                          aria-label="Código postal"
                          className={`w-full px-3 py-2.5 bg-white border text-sm font-body text-[oklch(0.18_0.018_55)] placeholder:text-[oklch(0.72_0.02_60)] focus:outline-none focus:border-[oklch(0.52_0.08_148)] transition-colors ${errors.servicePostalCode ? "border-red-400" : "border-[oklch(0.88_0.015_75)]"}`}
                          style={{ borderRadius: 0, fontWeight: 300 }}
                        />
                        {errors.servicePostalCode && <p className="text-red-500 text-[0.7rem] mt-1">{errors.servicePostalCode}</p>}
                      </div>
                      <div>
                        <input
                          type="text"
                          value={form.serviceCity}
                          onChange={set("serviceCity")}
                          placeholder="Localidad"
                          autoComplete="address-level2"
                          maxLength={80}
                          aria-label="Localidad"
                          className={`w-full px-3 py-2.5 bg-white border text-sm font-body text-[oklch(0.18_0.018_55)] placeholder:text-[oklch(0.72_0.02_60)] focus:outline-none focus:border-[oklch(0.52_0.08_148)] transition-colors ${errors.serviceCity ? "border-red-400" : "border-[oklch(0.88_0.015_75)]"}`}
                          style={{ borderRadius: 0, fontWeight: 300 }}
                        />
                        {errors.serviceCity && <p className="text-red-500 text-[0.7rem] mt-1">{errors.serviceCity}</p>}
                      </div>
                    </div>
                    <p className="text-[0.7rem] font-body text-[oklch(0.52_0.02_60)] leading-relaxed" style={{ fontWeight: 300 }}>
                      Cristina valorará la dirección y te confirmará si puede desplazarse a tu zona.
                    </p>
                  </div>
                )}
              </div>
            ) : (
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
            )}

            {/* Mensaje */}
            <div>
              <label className="block text-xs text-[oklch(0.38_0.02_55)] font-body mb-1.5 uppercase tracking-wider" style={{ fontWeight: 500 }}>
                Cuéntame algo (opcional)
              </label>
              <textarea
                value={form.message}
                onChange={set("message")}
                rows={3}
                placeholder={isMassage ? "Preferencias (aromas, presión…) o alguna pregunta. Por favor, no incluyas datos de salud." : "¿Qué te gustaría trabajar en la consulta? ¿Tienes alguna pregunta?"}
                className="w-full px-3 py-2.5 bg-white border border-[oklch(0.88_0.015_75)] text-sm font-body text-[oklch(0.18_0.018_55)] placeholder:text-[oklch(0.72_0.02_60)] focus:outline-none focus:border-[oklch(0.52_0.08_148)] transition-colors resize-none"
                style={{ borderRadius: 0, fontWeight: 300 }}
              />
            </div>

            </div>

            {/* Resumen previo al envío (masajes) */}
            {isMassage && step === "review" && selectedService && (
              <div className="border border-[oklch(0.52_0.08_148)] bg-white px-5 py-4 text-sm font-body text-[oklch(0.38_0.02_55)] space-y-1.5" style={{ fontWeight: 300 }}>
                <p className="text-xs uppercase tracking-wider text-[oklch(0.52_0.08_148)]" style={{ fontWeight: 500 }}>Revisa tu solicitud</p>
                <p><span style={{ fontWeight: 500 }}>Masaje:</span> {selectedService.name}</p>
                <p><span style={{ fontWeight: 500 }}>Duración:</span> {selectedService.durationLabel ?? `${selectedService.durationMinutes} min`}</p>
                <p><span style={{ fontWeight: 500 }}>Precio:</span> {shownPrice} <span className="text-[0.7rem]">({PAYMENT_NOTE})</span></p>
                <p>
                  <span style={{ fontWeight: 500 }}>Lugar:</span>{" "}
                  {isHome ? `A domicilio — ${formatHomeAddress({ street: form.serviceStreet, postalCode: form.servicePostalCode, city: form.serviceCity })}` : `En consulta — ${MASSAGE_LOCATION}`}
                </p>
                <p>
                  <span style={{ fontWeight: 500 }}>Fecha preferida:</span>{" "}
                  {form.preferredDate ? new Date(form.preferredDate + "T12:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "—"}
                  {form.preferredTime ? ` · a las ${form.preferredTime}` : ""}
                </p>
                <p><span style={{ fontWeight: 500 }}>Contacto:</span> {form.firstName} {form.lastName} · {form.email}{form.phone ? ` · ${form.phone}` : ""}</p>
                <p className="pt-2 text-xs text-[oklch(0.52_0.02_60)]">
                  Esto es una solicitud: la cita no queda confirmada hasta que Cristina la acepte.
                </p>
                <p className="text-[0.7rem] text-[oklch(0.52_0.02_60)] leading-relaxed">
                  <span style={{ fontWeight: 500 }}>Cancelaciones:</span> {CANCELLATION_POLICY}
                </p>
              </div>
            )}

            {/* Submit */}
            <div className="pt-2">
              {isMassage && step === "review" && (
                <button
                  type="button"
                  onClick={() => setStep("form")}
                  className="w-full mb-2 px-6 py-3 border border-[oklch(0.88_0.015_75)] text-[oklch(0.52_0.02_60)] text-xs tracking-widest uppercase font-body hover:border-[oklch(0.52_0.08_148)] hover:text-[oklch(0.52_0.08_148)] transition-colors"
                  style={{ letterSpacing: "0.1em" }}
                >
                  Modificar datos
                </button>
              )}
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
                ) : isMassage && step === "form" ? (
                  "Revisar solicitud"
                ) : (
                  "Enviar solicitud"
                )}
              </button>

              {/* Alternativa directa: abre WhatsApp con la reserva ya escrita (no cuenta como reserva hasta que Cristina responde) */}
              {isMassage && step === "review" && selectedService && (
                <>
                  <div className="flex items-center gap-3 my-3" aria-hidden="true">
                    <span className="flex-1 h-px bg-[oklch(0.90_0.012_75)]" />
                    <span className="text-[0.65rem] uppercase tracking-widest text-[oklch(0.62_0.02_60)] font-body">o</span>
                    <span className="flex-1 h-px bg-[oklch(0.90_0.012_75)]" />
                  </div>
                  <a
                    href={directWhatsAppReservationUrl({
                      firstName: form.firstName,
                      serviceLabel: selectedService.name,
                      durationLabel: selectedService.durationLabel ?? (selectedService.durationMinutes ? `${selectedService.durationMinutes} min` : null),
                      date: form.preferredDate,
                      time: form.preferredTime,
                      atHome: isHome,
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      trackBookingEvent(BOOKING_EVENTS.WHATSAPP_CLICKED, {
                        service_slug: form.serviceType,
                        service_group: "masaje",
                        modality: "presencial",
                      })
                    }
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#25D366] text-white text-xs tracking-widest uppercase font-body hover:opacity-90 transition-opacity no-underline"
                    style={{ letterSpacing: "0.1em" }}
                  >
                    <MessageCircle size={15} />
                    Reserva directamente con Cristina ahora
                  </a>
                  <p className="text-center text-[oklch(0.62_0.02_60)] text-[0.65rem] mt-2 font-body" style={{ fontWeight: 300 }}>
                    Se abre WhatsApp con tu reserva ya escrita; la cita queda confirmada cuando Cristina te responda.
                  </p>
                </>
              )}

              <p className="text-center text-[oklch(0.72_0.02_60)] text-[0.65rem] mt-3 font-body" style={{ fontWeight: 300 }}>
                {isMassage
                  ? "Cristina confirmará la cita contigo en 24–48 horas. Hasta entonces, no es una reserva confirmada."
                  : "Cristina confirmará la cita contigo en 24–48 horas."}
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
