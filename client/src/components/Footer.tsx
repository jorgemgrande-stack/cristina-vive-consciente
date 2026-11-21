/**
 * Footer — Cristina Vive Consciente
 * Design: "Luz Botánica" — limpio, natural, sin referencias externas
 * Contenido editable desde Editar web → Ajustes del sitio (columnas, contacto, redes, enlaces legales).
 */

import { Link } from "wouter";
import { Facebook, Instagram, Mail, Phone, Youtube } from "lucide-react";
import { OPEN_COOKIE_SETTINGS_EVENT } from "@/lib/consent";
import { useSiteGlobal } from "@/lib/siteGlobal";
import SiteLink from "@/components/site/SiteLink";

const SOCIAL_BTN =
  "w-9 h-9 border border-[oklch(0.38_0.02_55)] flex items-center justify-center text-[oklch(0.72_0.06_60)] hover:border-[oklch(0.52_0.08_148)] hover:text-[oklch(0.52_0.08_148)] transition-all duration-300";

export default function Footer() {
  const { footer, identity } = useSiteGlobal();
  const social = [
    { url: footer.instagram, label: "Instagram", icon: <Instagram size={15} /> },
    { url: footer.facebook, label: "Facebook", icon: <Facebook size={15} /> },
    { url: footer.youtube, label: "YouTube", icon: <Youtube size={15} /> },
    ...(footer.contactEmail ? [{ url: `mailto:${footer.contactEmail}`, label: "Email", icon: <Mail size={15} /> }] : []),
  ].filter((s) => s.url);

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
                src={identity.logoUrl}
                alt={identity.logoAlt}
                className="h-12 w-auto object-contain brightness-0 invert opacity-90"
                style={{ maxWidth: "160px" }}
              />
            </Link>

            {footer.about && (
              <p className="text-[oklch(0.72_0.06_60)] text-sm leading-relaxed mb-6 font-body" style={{ fontWeight: 300 }}>
                {footer.about}
              </p>
            )}

            {social.length > 0 && (
              <div className="flex items-center gap-3">
                {social.map((s) => (
                  <SiteLink key={s.label} href={s.url} className={SOCIAL_BTN} aria-label={s.label}>
                    {s.icon}
                  </SiteLink>
                ))}
              </div>
            )}
          </div>

          {/* Columnas de enlaces */}
          {footer.columns.map((col, i) => (
            <div key={i}>
              <h4
                className="text-white text-xs tracking-widest uppercase mb-6 font-body"
                style={{ fontWeight: 500, letterSpacing: "0.15em" }}
              >
                {col.title}
              </h4>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.url + link.label}>
                    <SiteLink
                      href={link.url}
                      className="text-[oklch(0.72_0.06_60)] text-sm hover:text-[oklch(0.72_0.06_148)] transition-colors duration-200 font-body no-underline"
                      style={{ fontWeight: 300 }}
                    >
                      {link.label}
                    </SiteLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact Column */}
          <div>
            <h4
              className="text-white text-xs tracking-widest uppercase mb-6 font-body"
              style={{ fontWeight: 500, letterSpacing: "0.15em" }}
            >
              {footer.contactTitle}
            </h4>
            <ul className="space-y-4">
              {footer.contactEmail && (
                <li className="flex items-start gap-3">
                  <Mail size={14} className="text-[oklch(0.52_0.08_148)] mt-0.5 flex-shrink-0" />
                  <span className="text-[oklch(0.72_0.06_60)] text-sm font-body" style={{ fontWeight: 300 }}>
                    {footer.contactEmail}
                  </span>
                </li>
              )}
              {footer.contactLine && (
                <li className="flex items-start gap-3">
                  <Phone size={14} className="text-[oklch(0.52_0.08_148)] mt-0.5 flex-shrink-0" />
                  <span className="text-[oklch(0.72_0.06_60)] text-sm font-body" style={{ fontWeight: 300 }}>
                    {footer.contactLine}
                  </span>
                </li>
              )}
            </ul>

            {footer.ctaLabel && footer.ctaUrl && (
              <div className="mt-8">
                <SiteLink
                  href={footer.ctaUrl}
                  className="inline-block px-5 py-2.5 border border-[oklch(0.52_0.08_148)] text-[oklch(0.52_0.08_148)] text-xs tracking-widest uppercase hover:bg-[oklch(0.52_0.08_148)] hover:text-white transition-all duration-300 font-body no-underline"
                  style={{ borderRadius: 0, fontWeight: 500, letterSpacing: "0.1em" }}
                >
                  {footer.ctaLabel}
                </SiteLink>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[oklch(0.28_0.01_55)]">
        <div className="container py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[oklch(0.52_0.02_60)] text-xs font-body" style={{ fontWeight: 300 }}>
              © {new Date().getFullYear()} {footer.copyright}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-5">
              {footer.legalLinks.map((link) => (
                <SiteLink
                  key={link.url + link.label}
                  href={link.url}
                  className="text-[oklch(0.52_0.02_60)] text-xs hover:text-[oklch(0.72_0.06_148)] transition-colors duration-200 font-body no-underline"
                  style={{ fontWeight: 300 }}
                >
                  {link.label}
                </SiteLink>
              ))}
              <button
                onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT))}
                className="text-[oklch(0.52_0.02_60)] text-xs hover:text-[oklch(0.72_0.06_148)] transition-colors duration-200 font-body"
                style={{ fontWeight: 300 }}
              >
                Gestionar cookies
              </button>
              {footer.showPrivateLink === "on" && (
                <Link
                  href="/crm"
                  className="text-[oklch(0.35_0.01_55)] text-[0.6rem] hover:text-[oklch(0.52_0.02_60)] transition-colors duration-300 font-body no-underline"
                  style={{ fontWeight: 300, letterSpacing: "0.05em" }}
                >
                  Acceso privado
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
