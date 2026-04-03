/**
 * Contacto — Cristina Vive Consciente
 * Design: "Luz Botánica"
 * Formulario conectado al backend: crea lead en CRM + envía emails automáticos
 */

import { useState } from "react";
import { Mail, Phone, Clock, MapPin, Instagram, Send, Users, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import PageHero from "@/components/PageHero";
import { trpc } from "@/lib/trpc";

const HERO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/hero-consultas-VRAFvns5UX68Kqd64cBawH.webp";

const contactInfo = [
  {
    icon: <Mail size={18} />,
    title: "Email",
    value: "hola@cristinaviveconsciente.es",
    sub: "Respondo en 24–48 horas",
  },
  {
    icon: <Phone size={18} />,
    title: "Teléfono / WhatsApp",
    value: "Disponible para clientas",
    sub: "Consulta por email primero",
  },
  {
    icon: <Clock size={18} />,
    title: "Horario de consultas",
    value: "Lunes a Viernes",
    sub: "9:00 — 19:00 h",
  },
  {
    icon: <MapPin size={18} />,
    title: "Ubicación",
    value: "Navas de Río Frío, Segovia",
    sub: "Presencial y online",
  },
];

const SUBJECT_OPTIONS = [
  { value: "", label: "Selecciona una opción" },
  { value: "Consulta + Acompañamiento 21 días", label: "Consulta + Acompañamiento 21 días" },
  { value: "Consulta Naturópata", label: "Consulta Naturópata" },
  { value: "Consulta Breve 30 min", label: "Consulta Breve 30 min" },
  { value: "Consulta Express 10€", label: "Consulta Express 10€" },
  { value: "Asesoría Biohabitabilidad", label: "Asesoría Biohabitabilidad" },
  { value: "Testaje Kinesiológico", label: "Testaje Kinesiológico" },
  { value: "Masaje Terapéutico", label: "Masaje Terapéutico" },
  { value: "Sistemas de Agua", label: "Sistemas de Agua" },
  { value: "Aceites Esenciales", label: "Aceites Esenciales" },
  { value: "Guías Digitales", label: "Guías Digitales" },
  { value: "Otro", label: "Otro" },
];

export default function Contacto() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    acceptPrivacy: false,
  });
  const [submitted, setSubmitted] = useState(false);

  const submitContact = trpc.automations.submitContact.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Mensaje enviado. Cristina te responderá en 24–48 horas.");
    },
    onError: (err) => {
      toast.error(`Error al enviar: ${err.message}`);
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.email.trim()) {
      toast.error("El nombre y el email son obligatorios");
      return;
    }
    if (!form.acceptPrivacy) {
      toast.error("Debes aceptar la política de privacidad");
      return;
    }
    submitContact.mutate({
      firstName: form.firstName,
      lastName: form.lastName || "—",
      email: form.email,
      phone: form.phone || undefined,
      subject: form.subject || undefined,
      message: form.message || undefined,
      acceptPrivacy: form.acceptPrivacy,
    });
  };

  return (
    <Layout>
      <PageHero
        title="Contacto"
        subtitle="Estoy aquí para acompañarte. Escríbeme y encontraremos el mejor camino juntas."
        tag="Hablemos"
        image={HERO}
        breadcrumb={[{ label: "Inicio", href: "/" }, { label: "Contacto" }]}
      />

      {/* Formulario + Info */}
      <section className="section-padding bg-[oklch(0.985_0.006_85)]">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">

            {/* Formulario */}
            <div className="lg:col-span-3">
              <p className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-4 font-body" style={{ fontWeight: 500 }}>
                Escríbeme
              </p>
              <h2 className="font-display text-[oklch(0.18_0.018_55)] mb-4" style={{ fontWeight: 400 }}>
                Cuéntame qué necesitas
              </h2>
              <div className="section-divider mb-8" />

              {submitted ? (
                /* Estado de éxito */
                <div className="py-12 text-center">
                  <div className="w-16 h-16 bg-[oklch(0.52_0.08_148)]/10 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={28} className="text-[oklch(0.52_0.08_148)]" />
                  </div>
                  <h3 className="font-display text-[oklch(0.18_0.018_55)] mb-3" style={{ fontWeight: 400, fontSize: "1.5rem" }}>
                    Mensaje recibido
                  </h3>
                  <p className="text-[oklch(0.52_0.02_60)] font-body mb-2" style={{ fontWeight: 300, lineHeight: 1.7 }}>
                    Gracias por escribirme. Cristina revisará tu mensaje y te responderá personalmente en las próximas <strong>24–48 horas</strong>.
                  </p>
                  <p className="text-[oklch(0.52_0.02_60)] font-body text-sm" style={{ fontWeight: 300 }}>
                    Revisa también tu bandeja de entrada — te hemos enviado un email de confirmación.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setForm({ firstName: "", lastName: "", email: "", phone: "", subject: "", message: "", acceptPrivacy: false });
                    }}
                    className="mt-8 text-sm text-[oklch(0.52_0.08_148)] underline font-body"
                    style={{ fontWeight: 300 }}
                  >
                    Enviar otro mensaje
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[oklch(0.28_0.025_55)] text-xs tracking-widest uppercase mb-2 font-body" style={{ fontWeight: 500, letterSpacing: "0.1em" }}>
                        Nombre *
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={form.firstName}
                        onChange={handleChange}
                        placeholder="Tu nombre"
                        required
                        className="w-full px-4 py-3 bg-transparent border border-[oklch(0.88_0.015_75)] text-[oklch(0.18_0.018_55)] text-sm placeholder-[oklch(0.72_0.02_60)] focus:outline-none focus:border-[oklch(0.52_0.08_148)] transition-colors duration-200 font-body"
                        style={{ borderRadius: 0, fontWeight: 300 }}
                      />
                    </div>
                    <div>
                      <label className="block text-[oklch(0.28_0.025_55)] text-xs tracking-widest uppercase mb-2 font-body" style={{ fontWeight: 500, letterSpacing: "0.1em" }}>
                        Apellidos
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={form.lastName}
                        onChange={handleChange}
                        placeholder="Tus apellidos"
                        className="w-full px-4 py-3 bg-transparent border border-[oklch(0.88_0.015_75)] text-[oklch(0.18_0.018_55)] text-sm placeholder-[oklch(0.72_0.02_60)] focus:outline-none focus:border-[oklch(0.52_0.08_148)] transition-colors duration-200 font-body"
                        style={{ borderRadius: 0, fontWeight: 300 }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[oklch(0.28_0.025_55)] text-xs tracking-widest uppercase mb-2 font-body" style={{ fontWeight: 500, letterSpacing: "0.1em" }}>
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="tu@email.com"
                        required
                        className="w-full px-4 py-3 bg-transparent border border-[oklch(0.88_0.015_75)] text-[oklch(0.18_0.018_55)] text-sm placeholder-[oklch(0.72_0.02_60)] focus:outline-none focus:border-[oklch(0.52_0.08_148)] transition-colors duration-200 font-body"
                        style={{ borderRadius: 0, fontWeight: 300 }}
                      />
                    </div>
                    <div>
                      <label className="block text-[oklch(0.28_0.025_55)] text-xs tracking-widest uppercase mb-2 font-body" style={{ fontWeight: 500, letterSpacing: "0.1em" }}>
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="+34 600 000 000"
                        className="w-full px-4 py-3 bg-transparent border border-[oklch(0.88_0.015_75)] text-[oklch(0.18_0.018_55)] text-sm placeholder-[oklch(0.72_0.02_60)] focus:outline-none focus:border-[oklch(0.52_0.08_148)] transition-colors duration-200 font-body"
                        style={{ borderRadius: 0, fontWeight: 300 }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[oklch(0.28_0.025_55)] text-xs tracking-widest uppercase mb-2 font-body" style={{ fontWeight: 500, letterSpacing: "0.1em" }}>
                      Motivo de consulta
                    </label>
                    <select
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-transparent border border-[oklch(0.88_0.015_75)] text-[oklch(0.18_0.018_55)] text-sm focus:outline-none focus:border-[oklch(0.52_0.08_148)] transition-colors duration-200 font-body"
                      style={{ borderRadius: 0, fontWeight: 300 }}
                    >
                      {SUBJECT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[oklch(0.28_0.025_55)] text-xs tracking-widest uppercase mb-2 font-body" style={{ fontWeight: 500, letterSpacing: "0.1em" }}>
                      Mensaje *
                    </label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      rows={5}
                      placeholder="Cuéntame qué te trae por aquí y cómo puedo ayudarte..."
                      className="w-full px-4 py-3 bg-transparent border border-[oklch(0.88_0.015_75)] text-[oklch(0.18_0.018_55)] text-sm placeholder-[oklch(0.72_0.02_60)] focus:outline-none focus:border-[oklch(0.52_0.08_148)] transition-colors duration-200 font-body resize-none"
                      style={{ borderRadius: 0, fontWeight: 300 }}
                    />
                  </div>

                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="privacy"
                      name="acceptPrivacy"
                      checked={form.acceptPrivacy}
                      onChange={handleChange}
                      className="mt-0.5 w-4 h-4 border border-[oklch(0.88_0.015_75)] accent-[oklch(0.52_0.08_148)]"
                      style={{ borderRadius: 0 }}
                    />
                    <label htmlFor="privacy" className="text-[oklch(0.52_0.02_60)] text-xs font-body" style={{ fontWeight: 300 }}>
                      He leído y acepto la política de privacidad. Mis datos serán tratados con total confidencialidad.
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={submitContact.isPending}
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-medium hover:bg-[oklch(0.38_0.07_148)] transition-all duration-300 font-body disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ borderRadius: 0, letterSpacing: "0.1em" }}
                  >
                    <Send size={13} />
                    {submitContact.isPending ? "Enviando..." : "Enviar mensaje"}
                  </button>
                </form>
              )}
            </div>

            {/* Info de contacto */}
            <div className="lg:col-span-2">
              <p className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-4 font-body" style={{ fontWeight: 500 }}>
                Información
              </p>
              <h3 className="font-display text-[oklch(0.18_0.018_55)] mb-6" style={{ fontWeight: 400, fontSize: "1.5rem" }}>
                Cómo contactarme
              </h3>

              <div className="space-y-5 mb-10">
                {contactInfo.map((info) => (
                  <div key={info.title} className="flex items-start gap-4">
                    <div className="w-9 h-9 flex items-center justify-center bg-[oklch(0.52_0.08_148)]/10 text-[oklch(0.52_0.08_148)] flex-shrink-0">
                      {info.icon}
                    </div>
                    <div>
                      <p className="text-[oklch(0.28_0.025_55)] text-xs tracking-wide uppercase font-body mb-0.5" style={{ fontWeight: 500 }}>
                        {info.title}
                      </p>
                      <p className="text-[oklch(0.18_0.018_55)] text-sm font-body" style={{ fontWeight: 400 }}>
                        {info.value}
                      </p>
                      <p className="text-[oklch(0.52_0.02_60)] text-xs font-body" style={{ fontWeight: 300 }}>
                        {info.sub}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Social */}
              <div className="pt-6 border-t border-[oklch(0.88_0.015_75)]">
                <p className="text-[oklch(0.28_0.025_55)] text-xs tracking-widest uppercase mb-4 font-body" style={{ fontWeight: 500 }}>
                  Sígueme
                </p>
                <a
                  href="https://www.instagram.com/cristinaviveconsciente"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-[oklch(0.52_0.02_60)] hover:text-[oklch(0.52_0.08_148)] transition-colors duration-200 font-body"
                  style={{ fontWeight: 300 }}
                >
                  <Instagram size={16} />
                  <span className="text-sm">@cristinaviveconsciente</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bloque captación: Comunidad de salud consciente */}
      <section className="section-padding bg-[oklch(0.18_0.018_55)]">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="w-12 h-12 flex items-center justify-center border border-[oklch(0.52_0.08_148)]/50 text-[oklch(0.52_0.08_148)]">
                <Users size={22} />
              </div>
            </div>

            <p className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-4 font-body" style={{ fontWeight: 500 }}>
              Únete
            </p>
            <h2 className="font-display text-white mb-4" style={{ fontWeight: 400 }}>
              Comunidad de salud consciente
            </h2>
            <div className="w-12 h-px bg-[oklch(0.52_0.08_148)] mx-auto mb-6" />

            <p className="text-white/80 leading-relaxed mb-4 font-body" style={{ fontWeight: 300 }}>
              Si quieres estar actualizado en salud natural, medicina integrativa y aprender a mejorar tu entorno y hábitos, déjame tu correo electrónico.
            </p>
            <p className="text-white/70 leading-relaxed mb-10 font-body" style={{ fontWeight: 300 }}>
              Recibirás acceso a contenido exclusivo, recursos prácticos y grupos privados donde comparto información que no publico en redes.
            </p>

            {/* Formulario captación — usa el mismo endpoint */}
            <CommunitySignup />

            <p className="text-white/40 text-xs mt-4 font-body" style={{ fontWeight: 300 }}>
              Sin spam. Puedes darte de baja cuando quieras.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}

// ─── COMPONENTE: Captación de comunidad ──────────────────────────────────────

function CommunitySignup() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const submitContact = trpc.automations.submitContact.useMutation({
    onSuccess: () => {
      setDone(true);
      toast.success("¡Bienvenida a la comunidad!");
    },
    onError: (err) => toast.error(`Error: ${err.message}`),
  });

  const handleSubmit = () => {
    if (!email.trim() || !email.includes("@")) {
      toast.error("Introduce un email válido");
      return;
    }
    submitContact.mutate({
      firstName: "Amiga",
      lastName: "Comunidad",
      email: email.trim(),
      subject: "Suscripción a la comunidad",
      message: "Se ha suscrito a la comunidad de salud consciente.",
      acceptPrivacy: true,
    });
  };

  if (done) {
    return (
      <div className="flex items-center justify-center gap-2 text-white/80 font-body py-4">
        <CheckCircle size={18} className="text-[oklch(0.52_0.08_148)]" />
        <span style={{ fontWeight: 300 }}>¡Gracias! Revisa tu email para el mensaje de bienvenida.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-0 max-w-md mx-auto">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        placeholder="Tu correo electrónico"
        className="flex-1 px-5 py-4 bg-white/10 border border-white/20 text-white text-sm placeholder-white/50 focus:outline-none focus:border-[oklch(0.52_0.08_148)] transition-colors duration-200 font-body"
        style={{ borderRadius: 0, fontWeight: 300 }}
      />
      <button
        onClick={handleSubmit}
        disabled={submitContact.isPending}
        className="px-6 py-4 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-medium hover:bg-[oklch(0.38_0.07_148)] transition-colors duration-300 font-body whitespace-nowrap disabled:opacity-60"
        style={{ borderRadius: 0, letterSpacing: "0.08em" }}
      >
        {submitContact.isPending ? "..." : "Unirme"}
      </button>
    </div>
  );
}
