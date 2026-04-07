/**
 * MiConsulta.tsx — Carrito terapéutico de aceites esenciales
 * Cristina Vive Consciente
 *
 * NO es un carrito de compra. NO hay checkout. NO hay pago.
 * El usuario selecciona aceites y envía una consulta personalizada a Cristina.
 */

import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import Layout from "@/components/Layout";
import { useConsultaCart } from "@/contexts/ConsultaCartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ShoppingBag, Leaf, ArrowRight, Trash2, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

const TIPO_LABELS: Record<string, string> = {
  aceite: "Aceite esencial",
  mezcla: "Mezcla terapéutica",
  base: "Base y dilución",
  pack: "Pack y guía",
  accesorio: "Accesorio",
};

interface FormState {
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  provincia: string;
  objetivos: string;
  experienciaPrevia: string;
  consentimiento: boolean;
}

// Helpers para construir el mensaje y productsList para el router
function buildMensaje(form: FormState): string {
  const parts: string[] = [];
  if (form.apellidos) parts.push(`Apellidos: ${form.apellidos}`);
  if (form.provincia) parts.push(`Provincia: ${form.provincia}`);
  if (form.objetivos) parts.push(`Objetivos: ${form.objetivos}`);
  if (form.experienciaPrevia) parts.push(`Experiencia previa: ${form.experienciaPrevia}`);
  return parts.join(" | ");
}

const EMPTY_FORM: FormState = {
  nombre: "",
  apellidos: "",
  email: "",
  telefono: "",
  provincia: "",
  objetivos: "",
  experienciaPrevia: "",
  consentimiento: false,
};

export default function MiConsulta() {
  const { items, removeItem, clearCart, count } = useConsultaCart();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);

  const submitConsulta = trpc.oils.submitConsultation.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      clearCart();
    },
    onError: (err: { message: string }) => {
      toast.error("Error al enviar la consulta: " + err.message);
    },
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.consentimiento) {
      toast.error("Debes aceptar la política de privacidad para continuar.");
      return;
    }
    if (items.length === 0) {
      toast.error("Añade al menos un aceite a tu consulta antes de enviarla.");
      return;
    }
    submitConsulta.mutate({
      nombre: `${form.nombre} ${form.apellidos}`.trim(),
      email: form.email,
      telefono: form.telefono || undefined,
      mensaje: buildMensaje(form) || undefined,
      productsList: JSON.stringify(items.map((i) => ({ id: i.id, name: i.name, slug: i.slug }))),
    });
  }

  // ─── Estado: enviado con éxito ─────────────────────────────────────────
  if (submitted) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-6 py-24 text-center space-y-6">
          <CheckCircle2 size={56} className="mx-auto text-[oklch(0.52_0.08_148)]" />
          <h1 className="font-display text-3xl text-[oklch(0.18_0.018_55)]">
            ¡Consulta enviada con éxito!
          </h1>
          <p className="font-body text-[oklch(0.42_0.02_55)] leading-relaxed text-lg">
            Cristina revisará tu selección de aceites y se pondrá en contacto contigo en las próximas 24–48 horas para orientarte personalmente.
          </p>
          <div className="bg-[oklch(0.96_0.02_148)] border border-[oklch(0.88_0.04_148)] p-6 text-left space-y-2">
            <p className="font-body text-sm text-[oklch(0.38_0.06_148)]">
              <strong>¿Qué ocurre ahora?</strong>
            </p>
            <ul className="space-y-1 text-sm font-body text-[oklch(0.42_0.06_148)]">
              <li className="flex items-start gap-2"><span className="text-[oklch(0.52_0.08_148)] font-bold">1.</span> Cristina revisará los aceites que has seleccionado</li>
              <li className="flex items-start gap-2"><span className="text-[oklch(0.52_0.08_148)] font-bold">2.</span> Te contactará por email o WhatsApp para conocer mejor tus necesidades</li>
              <li className="flex items-start gap-2"><span className="text-[oklch(0.52_0.08_148)] font-bold">3.</span> Recibirás un protocolo personalizado adaptado a ti</li>
            </ul>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/aceites-esenciales">
              <button className="text-xs font-body uppercase tracking-wider border border-[oklch(0.52_0.08_148)] text-[oklch(0.42_0.08_148)] px-6 py-3 hover:bg-[oklch(0.95_0.02_148)] transition-colors" style={{ borderRadius: 0 }}>
                Seguir explorando aceites
              </button>
            </Link>
            <Link href="/consultas">
              <button className="text-xs font-body uppercase tracking-wider bg-[oklch(0.52_0.08_148)] text-white px-6 py-3 hover:bg-[oklch(0.42_0.08_148)] transition-colors flex items-center gap-2" style={{ borderRadius: 0 }}>
                Reservar consulta presencial <ArrowRight size={12} />
              </button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  // ─── Estado: carrito vacío ─────────────────────────────────────────────
  if (count === 0) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-6 py-24 text-center space-y-6">
          <ShoppingBag size={56} className="mx-auto text-[oklch(0.72_0.06_148)] opacity-40" />
          <h1 className="font-display text-2xl text-[oklch(0.18_0.018_55)]">
            Tu consulta está vacía
          </h1>
          <p className="font-body text-[oklch(0.42_0.02_55)] leading-relaxed">
            Explora el catálogo de aceites esenciales y añade los que te interesen. Cristina te orientará sobre cuáles son los más adecuados para ti.
          </p>
          <Link href="/aceites-esenciales">
            <button className="text-xs font-body uppercase tracking-wider bg-[oklch(0.52_0.08_148)] text-white px-8 py-3 hover:bg-[oklch(0.42_0.08_148)] transition-colors flex items-center gap-2 mx-auto" style={{ borderRadius: 0 }}>
              <Leaf size={13} />
              Explorar catálogo de aceites
            </button>
          </Link>
        </div>
      </Layout>
    );
  }

  // ─── Estado: carrito con productos ────────────────────────────────────
  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="bg-[oklch(0.98_0.004_80)] border-b border-[oklch(0.92_0.01_80)]">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-2 text-xs font-body text-[oklch(0.52_0.04_80)]">
          <Link href="/" className="hover:text-[oklch(0.52_0.08_148)] transition-colors">Inicio</Link>
          <span>/</span>
          <Link href="/aceites-esenciales" className="hover:text-[oklch(0.52_0.08_148)] transition-colors">Aceites Esenciales</Link>
          <span>/</span>
          <span className="text-[oklch(0.18_0.018_55)]">Mi Consulta</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-[1fr_420px] gap-12 items-start">

          {/* ─── COLUMNA IZQUIERDA: Formulario ─────────────────────────── */}
          <div className="space-y-8">
            <div>
              <Link href="/aceites-esenciales" className="flex items-center gap-1.5 text-xs font-body text-[oklch(0.52_0.04_80)] hover:text-[oklch(0.52_0.08_148)] transition-colors mb-4">
                <ArrowLeft size={12} /> Seguir explorando aceites
              </Link>
              <h1 className="font-display text-3xl text-[oklch(0.18_0.018_55)]">Mi Consulta Personalizada</h1>
              <p className="font-body text-[oklch(0.42_0.02_55)] mt-2 leading-relaxed">
                Cuéntanos un poco sobre ti y tus objetivos. Cristina revisará tu selección y te contactará para orientarte personalmente.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Datos personales */}
              <div className="space-y-4">
                <h2 className="text-xs font-body uppercase tracking-wider text-[oklch(0.52_0.04_80)] border-b border-[oklch(0.92_0.01_80)] pb-2">
                  Datos de contacto
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-body uppercase tracking-wider text-[oklch(0.42_0.02_55)]">Nombre *</label>
                    <Input
                      name="nombre"
                      value={form.nombre}
                      onChange={handleChange}
                      required
                      placeholder="Tu nombre"
                      className="font-body text-sm border-[oklch(0.88_0.01_80)]"
                      style={{ borderRadius: 0 }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-body uppercase tracking-wider text-[oklch(0.42_0.02_55)]">Apellidos *</label>
                    <Input
                      name="apellidos"
                      value={form.apellidos}
                      onChange={handleChange}
                      required
                      placeholder="Tus apellidos"
                      className="font-body text-sm border-[oklch(0.88_0.01_80)]"
                      style={{ borderRadius: 0 }}
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-body uppercase tracking-wider text-[oklch(0.42_0.02_55)]">Email *</label>
                    <Input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder="tu@email.com"
                      className="font-body text-sm border-[oklch(0.88_0.01_80)]"
                      style={{ borderRadius: 0 }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-body uppercase tracking-wider text-[oklch(0.42_0.02_55)]">Teléfono</label>
                    <Input
                      name="telefono"
                      value={form.telefono}
                      onChange={handleChange}
                      placeholder="+34 600 000 000"
                      className="font-body text-sm border-[oklch(0.88_0.01_80)]"
                      style={{ borderRadius: 0 }}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-body uppercase tracking-wider text-[oklch(0.42_0.02_55)]">Provincia</label>
                  <Input
                    name="provincia"
                    value={form.provincia}
                    onChange={handleChange}
                    placeholder="Tu provincia o ciudad"
                    className="font-body text-sm border-[oklch(0.88_0.01_80)]"
                    style={{ borderRadius: 0 }}
                  />
                </div>
              </div>

              {/* Objetivos */}
              <div className="space-y-4">
                <h2 className="text-xs font-body uppercase tracking-wider text-[oklch(0.52_0.04_80)] border-b border-[oklch(0.92_0.01_80)] pb-2">
                  Cuéntame sobre ti
                </h2>
                <div className="space-y-1">
                  <label className="text-xs font-body uppercase tracking-wider text-[oklch(0.42_0.02_55)]">¿Qué objetivos tienes con los aceites esenciales? *</label>
                  <textarea
                    name="objetivos"
                    value={form.objetivos}
                    onChange={handleChange}
                    required
                    rows={4}
                    placeholder="Ej: Mejorar el sueño, reducir el estrés, apoyo inmune, dolor muscular..."
                    className="w-full font-body text-sm border border-[oklch(0.88_0.01_80)] px-3 py-2 resize-none focus:outline-none focus:border-[oklch(0.52_0.08_148)] transition-colors"
                    style={{ borderRadius: 0 }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-body uppercase tracking-wider text-[oklch(0.42_0.02_55)]">¿Tienes experiencia previa con aceites esenciales?</label>
                  <textarea
                    name="experienciaPrevia"
                    value={form.experienciaPrevia}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Cuéntame qué has usado antes, qué te ha funcionado o no..."
                    className="w-full font-body text-sm border border-[oklch(0.88_0.01_80)] px-3 py-2 resize-none focus:outline-none focus:border-[oklch(0.52_0.08_148)] transition-colors"
                    style={{ borderRadius: 0 }}
                  />
                </div>
              </div>

              {/* Consentimiento */}
              <div className="flex items-start gap-3 p-4 bg-[oklch(0.97_0.006_85)] border border-[oklch(0.92_0.01_80)]">
                <input
                  type="checkbox"
                  name="consentimiento"
                  id="consentimiento"
                  checked={form.consentimiento}
                  onChange={handleChange}
                  className="mt-0.5 accent-[oklch(0.52_0.08_148)]"
                />
                <label htmlFor="consentimiento" className="text-xs font-body text-[oklch(0.42_0.02_55)] leading-relaxed cursor-pointer">
                  Acepto la <Link href="/privacidad" className="text-[oklch(0.52_0.08_148)] underline">política de privacidad</Link> y consiento que Cristina use mis datos para contactarme sobre esta consulta. No se realizará ningún cargo económico.
                </label>
              </div>

              <Button
                type="submit"
                disabled={submitConsulta.isPending}
                className="w-full bg-[oklch(0.52_0.08_148)] hover:bg-[oklch(0.42_0.08_148)] text-white font-body text-xs uppercase tracking-wider h-12 gap-2"
                style={{ borderRadius: 0 }}
              >
                {submitConsulta.isPending ? (
                  <><Loader2 size={14} className="animate-spin" /> Enviando consulta...</>
                ) : (
                  <><ArrowRight size={14} /> Enviar mi consulta a Cristina</>
                )}
              </Button>
            </form>
          </div>

          {/* ─── COLUMNA DERECHA: Resumen de aceites ───────────────────── */}
          <div className="lg:sticky lg:top-24 space-y-4">
            <div className="bg-[oklch(0.97_0.006_85)] border border-[oklch(0.92_0.01_80)] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg text-[oklch(0.18_0.018_55)]">
                  Tu selección
                </h2>
                <span className="text-xs font-body bg-[oklch(0.52_0.08_148)] text-white px-2 py-0.5">
                  {count} aceite{count !== 1 ? "s" : ""}
                </span>
              </div>

              <ul className="space-y-3 mb-6">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 bg-white border border-[oklch(0.92_0.01_80)] p-3">
                    <div className="w-10 h-10 bg-[oklch(0.94_0.01_80)] flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.imagen ? (
                        <img src={item.imagen} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <Leaf size={16} className="text-[oklch(0.72_0.06_148)]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm text-[oklch(0.18_0.018_55)] truncate">{item.name}</p>
                      <p className="text-[0.65rem] font-body text-[oklch(0.52_0.04_80)] uppercase tracking-wider">
                        {TIPO_LABELS[item.tipoProducto] ?? item.tipoProducto}
                      </p>
                    </div>
                    <button
                      onClick={() => { removeItem(item.id); toast.success(`"${item.name}" eliminado`); }}
                      className="text-[oklch(0.62_0.04_80)] hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>

              <div className="border-t border-[oklch(0.92_0.01_80)] pt-4 space-y-3">
                <p className="text-xs font-body text-[oklch(0.52_0.04_80)] leading-relaxed">
                  Cristina revisará tu selección y te contactará para orientarte sobre cuáles son los más adecuados para ti y cómo usarlos.
                </p>
                <Link href="/aceites-esenciales">
                  <button className="w-full text-xs font-body uppercase tracking-wider border border-[oklch(0.88_0.01_80)] text-[oklch(0.42_0.02_55)] hover:border-[oklch(0.52_0.08_148)] py-2 transition-colors flex items-center justify-center gap-1.5" style={{ borderRadius: 0 }}>
                    <Leaf size={12} /> Añadir más aceites
                  </button>
                </Link>
              </div>
            </div>

            {/* Bloque de confianza */}
            <div className="bg-[oklch(0.14_0.018_55)] text-white p-5 space-y-3">
              <p className="font-display text-sm">¿Por qué consultar con Cristina?</p>
              <ul className="space-y-2">
                {[
                  "Protocolo 100% personalizado para ti",
                  "Uso seguro y efectivo de los aceites",
                  "Seguimiento y ajuste del protocolo",
                  "Sin compromiso de compra",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs font-body text-[oklch(0.78_0.01_80)]">
                    <span className="text-[oklch(0.72_0.06_148)] font-bold flex-shrink-0">✦</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
