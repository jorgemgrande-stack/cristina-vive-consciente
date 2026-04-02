/**
 * Header — Cristina Vive Consciente
 * Design: "Luz Botánica" — Art Nouveau depurado + Minimalismo escandinavo
 * Sticky transparent → fondo sólido al hacer scroll
 * Logo BION real + navegación limpia + botón "Reservar consulta"
 */

import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { toast } from "sonner";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/logo-bion_ba8968f6.avif";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/consultas", label: "Consultas" },
  { href: "/masajes", label: "Masajes" },
  { href: "/sistemas-agua", label: "Sistemas de Agua" },
  { href: "/aceites-esenciales", label: "Aceites Esenciales" },
  { href: "/guias-digitales", label: "Guías Digitales" },
  { href: "/recomendados", label: "Recomendados" },
  { href: "/blog", label: "Blog" },
  { href: "/contacto", label: "Contacto" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const isHome = location === "/";
  const solidBg = scrolled || menuOpen || !isHome;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          solidBg
            ? "bg-[oklch(0.985_0.006_85)] shadow-[0_1px_0_oklch(0.88_0.015_75)]"
            : "bg-transparent"
        }`}
      >
        <div className="container">
          <div className="flex items-center justify-between h-16 md:h-20">

            {/* Logo */}
            <Link href="/" className="flex items-center no-underline group">
              <img
                src={LOGO_URL}
                alt="BION — Cristina Vive Consciente"
                className={`h-10 md:h-12 w-auto object-contain transition-all duration-500 ${
                  solidBg ? "brightness-100" : "brightness-0 invert"
                }`}
                style={{ maxWidth: "180px" }}
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-7">
              {navLinks.slice(0, 7).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-link text-[0.75rem] tracking-widest uppercase transition-colors duration-300 ${
                    solidBg
                      ? "text-[oklch(0.18_0.018_55)]"
                      : "text-white/90 hover:text-white"
                  } ${location === link.href ? "active" : ""}`}
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 400,
                    letterSpacing: "0.1em",
                    textDecoration: "none",
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* CTA */}
            <div className="hidden lg:flex items-center gap-4">
              <Link
                href="/contacto"
                className={`text-[0.75rem] tracking-widest uppercase transition-colors duration-300 ${
                  solidBg
                    ? "text-[oklch(0.52_0.02_60)] hover:text-[oklch(0.52_0.08_148)]"
                    : "text-white/80 hover:text-white"
                }`}
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 400,
                  letterSpacing: "0.1em",
                  textDecoration: "none",
                }}
              >
                Contacto
              </Link>
              <button
                onClick={() => toast.info("Próximamente: sistema de reservas online")}
                className={`px-5 py-2.5 text-[0.7rem] font-medium tracking-widest uppercase transition-all duration-350 ${
                  solidBg
                    ? "bg-[oklch(0.52_0.08_148)] text-white border border-[oklch(0.52_0.08_148)] hover:bg-[oklch(0.38_0.07_148)] hover:border-[oklch(0.38_0.07_148)]"
                    : "bg-white/15 text-white border border-white/60 hover:bg-white hover:text-[oklch(0.18_0.018_55)]"
                }`}
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  borderRadius: 0,
                  letterSpacing: "0.1em",
                }}
              >
                Reservar consulta
              </button>
            </div>

            {/* Mobile Toggle */}
            <button
              className={`lg:hidden p-2 transition-colors duration-300 ${
                solidBg ? "text-[oklch(0.18_0.018_55)]" : "text-white"
              }`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menú"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-all duration-500 ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className="absolute inset-0 bg-[oklch(0.18_0.018_55)]/40 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
        />
        <div
          className={`absolute top-0 right-0 h-full w-[min(320px,85vw)] bg-[oklch(0.985_0.006_85)] shadow-2xl transition-transform duration-500 ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex flex-col h-full pt-20 pb-8 px-8">
            {/* Logo en menú móvil */}
            <div className="mb-6 pb-5 border-b border-[oklch(0.88_0.015_75)]">
              <img
                src={LOGO_URL}
                alt="BION — Cristina Vive Consciente"
                className="h-10 w-auto object-contain"
                style={{ maxWidth: "160px" }}
              />
            </div>

            <nav className="flex flex-col gap-1 flex-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`py-3.5 border-b border-[oklch(0.88_0.015_75)] text-sm tracking-widest uppercase transition-colors duration-200 ${
                    location === link.href
                      ? "text-[oklch(0.52_0.08_148)]"
                      : "text-[oklch(0.28_0.02_55)] hover:text-[oklch(0.52_0.08_148)]"
                  }`}
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 400,
                    letterSpacing: "0.12em",
                    textDecoration: "none",
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="mt-8">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  toast.info("Próximamente: sistema de reservas online");
                }}
                className="w-full py-3.5 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-medium hover:bg-[oklch(0.38_0.07_148)] transition-colors duration-300"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  borderRadius: 0,
                  letterSpacing: "0.12em",
                }}
              >
                Reservar consulta
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
