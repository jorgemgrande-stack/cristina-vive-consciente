/**
 * Contacto — Cristina Vive Consciente
 * Design: "Luz Botánica"
 * Formulario conectado al backend: crea lead en CRM + envía emails automáticos
 */

import { SITE_IMAGES } from "@/lib/siteImages";
import { useLabels } from "@/lib/siteGlobal";
import { useState } from "react";
import { Mail, Phone, Clock, MapPin, Instagram, Send, Users, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import Layout from "@/components/Layout";
import PageHero from "@/components/PageHero";
import { trpc } from "@/lib/trpc";

const HERO = SITE_IMAGES.heroConsultas;

type Labels = ReturnType<typeof useLabels>;

const buildContactInfo = (L: Labels) => [
  {
    icon: <Mail size={18} />,
    title: L("contacto.info.email.title"),
    value: "hola@cristinaviveconsciente.es",
    sub: L("contacto.info.email.sub"),
  },
  {
    icon: <Phone size={18} />,
    title: L("contacto.info.phone.title"),
    value: L("contacto.info.phone.value"),
    sub: L("contacto.info.phone.sub"),
  },
  {
    icon: <Clock size={18} />,
    title: L("contacto.info.hours.title"),
    value: L("contacto.info.hours.value"),
    sub: L("contacto.info.hours.sub"),
  },
  {
    icon: <MapPin size={18} />,
    title: L("contacto.info.place.title"),
    value: L("contacto.info.place.value"),
    sub: L("contacto.info.place.sub"),
  },
];

const SUBJECT_OPTIONS: { value: string; label: string; labelKey?: string }[] = [
  { value: "", label: "Selecciona una opción", labelKey: "contacto.form.subject.ph" },
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
  { value: "Otro", label: "Otro", labelKey: "contacto.form.subject.other" },
];

export default function Contacto() {
  const L = useLabels();
  const contactInfo = buildContactInfo(L);
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
      toast.success(L("contact.toast"));
    },
    onError: (err) => {
      toast.error(L("contacto.err.send", { msg: err.message }));
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
      toast.error(L("contacto.err.required"));
      return;
    }
    if (!form.acceptPrivacy) {
      toast.error(L("contacto.err.privacy"));
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
                {L("contacto.form.kicker")}
              </p>
              <h2 className="font-display text-[oklch(0.18_0.018_55)] mb-4" style={{ fontWeight: 400 }}>
                {L("contacto.form.title")}
              </h2>
              <div className="section-divider mb-8" />

              {submitted ? (
                /* Estado de éxito */
                <div className="py-12 text-center">
                  <div className="w-16 h-16 bg-[oklch(0.52_0.08_148)]/10 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={28} className="text-[oklch(0.52_0.08_148)]" />
                  </div>
                  <h3 className="font-display text-[oklch(0.18_0.018_55)] mb-3" style={{ fontWeight: 400, fontSize: "1.5rem" }}>
                    {L("contacto.done.title")}
                  </h3>
                  <p className="text-[oklch(0.52_0.02_60)] font-body mb-2" style={{ fontWeight: 300, lineHeight: 1.7 }}>
                    {L("contacto.done.pre")} <strong>{L("contacto.done.bold")}</strong>.
                  </p>
                  <p className="text-[oklch(0.52_0.02_60)] font-body text-sm" style={{ fontWeight: 300 }}>
                    {L("contacto.done.mail")}
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setForm({ firstName: "", lastName: "", email: "", phone: "", subject: "", message: "", acceptPrivacy: false });
                    }}
                    className="mt-8 text-sm text-[oklch(0.52_0.08_148)] underline font-body"
                    style={{ fontWeight: 300 }}
                  >
                    {L("contacto.done.again")}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[oklch(0.28_0.025_55)] text-xs tracking-widest uppercase mb-2 font-body" style={{ fontWeight: 500, letterSpacing: "0.1em" }}>
                        {L("contacto.form.firstName")}
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={form.firstName}
                        onChange={handleChange}
                        placeholder={L("contacto.form.firstName.ph")}
                        required
                        className="w-full px-4 py-3 bg-transparent border border-[oklch(0.88_0.015_75)] text-[oklch(0.18_0.018_55)] text-sm placeholder-[oklch(0.72_0.02_60)] focus:outline-none focus:border-[oklch(0.52_0.08_148)] transition-colors duration-200 font-body"
                        style={{ borderRadius: 0, fontWeight: 300 }}
                      />
                    </div>
                    <div>
                      <label className="block text-[oklch(0.28_0.025_55)] text-xs tracking-widest uppercase mb-2 font-body" style={{ fontWeight: 500, letterSpacing: "0.1em" }}>
                        {L("contacto.form.lastName")}
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={form.lastName}
                        onChange={handleChange}
                        placeholder={L("contacto.form.lastName.ph")}
                        className="w-full px-4 py-3 bg-transparent border border-[oklch(0.88_0.015_75)] text-[oklch(0.18_0.018_55)] text-sm placeholder-[oklch(0.72_0.02_60)] focus:outline-none focus:border-[oklch(0.52_0.08_148)] transition-colors duration-200 font-body"
                        style={{ borderRadius: 0, fontWeight: 300 }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[oklch(0.28_0.025_55)] text-xs tracking-widest uppercase mb-2 font-body" style={{ fontWeight: 500, letterSpacing: "0.1em" }}>
                        {L("contacto.form.email")}
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder={L("contacto.form.email.ph")}
                        required
                        className="w-full px-4 py-3 bg-transparent border border-[oklch(0.88_0.015_75)] text-[oklch(0.18_0.018_55)] text-sm placeholder-[oklch(0.72_0.02_60)] focus:outline-none focus:border-[oklch(0.52_0.08_148)] transition-colors duration-200 font-body"
                        style={{ borderRadius: 0, fontWeight: 300 }}
                      />
                    </div>
                    <div>
                      <label className="block text-[oklch(0.28_0.025_55)] text-xs tracking-widest uppercase mb-2 font-body" style={{ fontWeight: 500, letterSpacing: "0.1em" }}>
                        {L("contacto.form.phone")}
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder={L("contacto.form.phone.ph")}
                        className="w-full px-4 py-3 bg-transparent border border-[oklch(0.88_0.015_75)] text-[oklch(0.18_0.018_55)] text-sm placeholder-[oklch(0.72_0.02_60)] focus:outline-none focus:border-[oklch(0.52_0.08_148)] transition-colors duration-200 font-body"
                        style={{ borderRadius: 0, fontWeight: 300 }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[oklch(0.28_0.025_55)] text-xs tracking-widest uppercase mb-2 font-body" style={{ fontWeight: 500, letterSpacing: "0.1em" }}>
                      {L("contacto.form.subject")}
                    </label>
                    <select
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-transparent border border-[oklch(0.88_0.015_75)] text-[oklch(0.18_0.018_55)] text-sm focus:outline-none focus:border-[oklch(0.52_0.08_148)] transition-colors duration-200 font-body"
                      style={{ borderRadius: 0, fontWeight: 300 }}
                    >
                      {SUBJECT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.labelKey ? L(opt.labelKey) : opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[oklch(0.28_0.025_55)] text-xs tracking-widest uppercase mb-2 font-body" style={{ fontWeight: 500, letterSpacing: "0.1em" }}>
                      {L("contacto.form.message")}
                    </label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      rows={5}
                      placeholder={L("contacto.form.message.ph")}
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
                      {L("contacto.form.privacy.pre")} <Link href="/privacidad" className="underline">{L("contacto.form.privacy.link")}</Link>{L("contacto.form.privacy.post")}
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={submitContact.isPending}
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-medium hover:bg-[oklch(0.38_0.07_148)] transition-all duration-300 font-body disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ borderRadius: 0, letterSpacing: "0.1em" }}
                  >
                    <Send size={13} />
                    {submitContact.isPending ? L("contacto.form.sending") : L("contacto.form.submit")}
                  </button>
                </form>
              )}
            </div>

            {/* Info de contacto */}
            <div className="lg:col-span-2">
              <p className="text-[oklch(0.52_0.08_148)] text-xs tracking-[0.2em] uppercase mb-4 font-body" style={{ fontWeight: 500 }}>
                {L("contacto.info.kicker")}
              </p>
              <h3 className="font-display text-[oklch(0.18_0.018_55)] mb-6" style={{ fontWeight: 400, fontSize: "1.5rem" }}>
                {L("contacto.info.title")}
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
                  {L("contacto.info.follow")}
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
              {L("contacto.community.kicker")}
            </p>
            <h2 className="font-display text-white mb-4" style={{ fontWeight: 400 }}>
              {L("contacto.community.title")}
            </h2>
            <div className="w-12 h-px bg-[oklch(0.52_0.08_148)] mx-auto mb-6" />

            <p className="text-white/80 leading-relaxed mb-4 font-body" style={{ fontWeight: 300 }}>
              {L("contacto.community.p1")}
            </p>
            <p className="text-white/70 leading-relaxed mb-10 font-body" style={{ fontWeight: 300 }}>
              {L("contacto.community.p2")}
            </p>

            {/* Formulario captación — usa el mismo endpoint */}
            <CommunitySignup />

            <p className="text-white/40 text-xs mt-4 font-body" style={{ fontWeight: 300 }}>
              {L("contacto.community.nospam")}
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}

// ─── COMPONENTE: Captación de comunidad ──────────────────────────────────────

function CommunitySignup() {
  const L = useLabels();
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const submitContact = trpc.automations.submitContact.useMutation({
    onSuccess: () => {
      setDone(true);
      toast.success(L("contacto.community.toast"));
    },
    onError: (err) => toast.error(L("contacto.community.error", { msg: err.message })),
  });

  const handleSubmit = () => {
    if (!email.trim() || !email.includes("@")) {
      toast.error(L("contacto.community.invalid"));
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
        <span style={{ fontWeight: 300 }}>{L("contacto.community.done")}</span>
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
        placeholder={L("contacto.community.ph")}
        className="flex-1 px-5 py-4 bg-white/10 border border-white/20 text-white text-sm placeholder-white/50 focus:outline-none focus:border-[oklch(0.52_0.08_148)] transition-colors duration-200 font-body"
        style={{ borderRadius: 0, fontWeight: 300 }}
      />
      <button
        onClick={handleSubmit}
        disabled={submitContact.isPending}
        className="px-6 py-4 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-medium hover:bg-[oklch(0.38_0.07_148)] transition-colors duration-300 font-body whitespace-nowrap disabled:opacity-60"
        style={{ borderRadius: 0, letterSpacing: "0.08em" }}
      >
        {submitContact.isPending ? L("contacto.community.sending") : L("contacto.community.button")}
      </button>
    </div>
  );
}
