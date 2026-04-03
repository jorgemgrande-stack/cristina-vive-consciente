/**
 * Footer — Cristina Vive Consciente
 * Design: "Luz Botánica" — limpio, natural, sin referencias externas
 * Logo real BION en versión clara (invertida sobre fondo oscuro)
 */

import { Link } from "wouter";
import { Instagram, Mail, Phone } from "lucide-react";
import { toast } from "sonner";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/logo-bion_ba8968f6.avif";

const serviceLinks = [
  { href: "/consultas", label: "Consultas Holísticas" },
  { href: "/masajes", label: "Masajes Terapéuticos" },
  { href: "/sistemas-agua", label: "Sistemas de Agua" },
  { href: "/aceites-esenciales", label: "Aceites Esenciales" },
  { href: "/guias-digitales", label: "Guías Digitales" },
];

const quickLinks = [
  { href: "/recomendados", label: "Recomendados" },
  { href: "/blog", label: "Blog" },
  { href: "/contacto", label: "Contacto" },
];

export default function Footer() {
  return (
    <footer className="bg-[oklch(0.18_0.018_55)] text-[oklch(0.88_0.015_75)]">
      {/* Main Footer */}
      <div className="container py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">

          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block mb-5 no-underline">
              {/* Logo invertido a blanco sobre fondo oscuro */}
              <img
                src={LOGO_URL}
                alt="BION — Cristina Vive Consciente"
                className="h-12 w-auto object-contain brightness-0 invert opacity-90"
                style={{ maxWidth: "160px" }}
              />
            </Link>

            <p className="text-[oklch(0.72_0.06_60)] text-sm leading-relaxed mb-6 font-body" style={{ fontWeight: 300 }}>
              Un espacio de bienestar consciente donde la naturaleza y la sabiduría se unen para guiarte hacia tu mejor versión.
            </p>

            {/* Social */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => toast.info("Próximamente: redes sociales")}
                className="w-9 h-9 border border-[oklch(0.38_0.02_55)] flex items-center justify-center text-[oklch(0.72_0.06_60)] hover:border-[oklch(0.52_0.08_148)] hover:text-[oklch(0.52_0.08_148)] transition-all duration-300"
                aria-label="Instagram"
              >
                <Instagram size={15} />
              </button>
              <button
                onClick={() => toast.info("Próximamente: contacto por email")}
                className="w-9 h-9 border border-[oklch(0.38_0.02_55)] flex items-center justify-center text-[oklch(0.72_0.06_60)] hover:border-[oklch(0.52_0.08_148)] hover:text-[oklch(0.52_0.08_148)] transition-all duration-300"
                aria-label="Email"
              >
                <Mail size={15} />
              </button>
            </div>
          </div>

          {/* Services Column */}
          <div>
            <h4
              className="text-white text-xs tracking-widest uppercase mb-6 font-body"
              style={{ fontWeight: 500, letterSpacing: "0.15em" }}
            >
              Servicios
            </h4>
            <ul className="space-y-3">
              {serviceLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[oklch(0.72_0.06_60)] text-sm hover:text-[oklch(0.72_0.06_148)] transition-colors duration-200 font-body no-underline"
                    style={{ fontWeight: 300 }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links Column */}
          <div>
            <h4
              className="text-white text-xs tracking-widest uppercase mb-6 font-body"
              style={{ fontWeight: 500, letterSpacing: "0.15em" }}
            >
              Explorar
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[oklch(0.72_0.06_60)] text-sm hover:text-[oklch(0.72_0.06_148)] transition-colors duration-200 font-body no-underline"
                    style={{ fontWeight: 300 }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h4
              className="text-white text-xs tracking-widest uppercase mb-6 font-body"
              style={{ fontWeight: 500, letterSpacing: "0.15em" }}
            >
              Contacto
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Mail size={14} className="text-[oklch(0.52_0.08_148)] mt-0.5 flex-shrink-0" />
                <span className="text-[oklch(0.72_0.06_60)] text-sm font-body" style={{ fontWeight: 300 }}>
                  hola@cristinaviveconsciente.com
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Phone size={14} className="text-[oklch(0.52_0.08_148)] mt-0.5 flex-shrink-0" />
                <span className="text-[oklch(0.72_0.06_60)] text-sm font-body" style={{ fontWeight: 300 }}>
                  Consultas por cita previa
                </span>
              </li>
            </ul>

            <div className="mt-8">
              <button
                onClick={() => toast.info("Próximamente: sistema de reservas online")}
                className="px-5 py-2.5 border border-[oklch(0.52_0.08_148)] text-[oklch(0.52_0.08_148)] text-xs tracking-widest uppercase hover:bg-[oklch(0.52_0.08_148)] hover:text-white transition-all duration-300 font-body"
                style={{
                  borderRadius: 0,
                  fontWeight: 500,
                  letterSpacing: "0.1em",
                }}
              >
                Reservar consulta
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[oklch(0.28_0.01_55)]">
        <div className="container py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[oklch(0.52_0.02_60)] text-xs font-body" style={{ fontWeight: 300 }}>
              © {new Date().getFullYear()} BION — Cristina Vive Consciente. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-5">
              <button
                onClick={() => toast.info("Próximamente: política de privacidad")}
                className="text-[oklch(0.52_0.02_60)] text-xs hover:text-[oklch(0.72_0.06_148)] transition-colors duration-200 font-body"
                style={{ fontWeight: 300 }}
              >
                Privacidad
              </button>
              <button
                onClick={() => toast.info("Próximamente: términos y condiciones")}
                className="text-[oklch(0.52_0.02_60)] text-xs hover:text-[oklch(0.72_0.06_148)] transition-colors duration-200 font-body"
                style={{ fontWeight: 300 }}
              >
                Términos
              </button>
              <Link
                href="/crm"
                className="text-[oklch(0.35_0.01_55)] text-[0.6rem] hover:text-[oklch(0.52_0.02_60)] transition-colors duration-300 font-body no-underline"
                style={{ fontWeight: 300, letterSpacing: "0.05em" }}
              >
                Acceso privado
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
