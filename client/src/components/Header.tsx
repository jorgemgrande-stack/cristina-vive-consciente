/**
 * Header — Cristina Vive Consciente
 * Design: "Luz Botánica" — Art Nouveau depurado + Minimalismo escandinavo
 * Sticky transparent → fondo sólido al hacer scroll
 * Logo BION + navegación limpia + botón "Reservar consulta"
 */

import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { toast } from "sonner";

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

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const isHome = location === "/";

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled || menuOpen || !isHome
            ? "bg-[oklch(0.985_0.006_85)] shadow-[0_1px_0_oklch(0.88_0.015_75)]"
            : "bg-transparent"
        }`}
      >
        <div className="container">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group no-underline">
              <div className="flex items-center gap-2">
                {/* BION Logo Mark */}
                <div
                  className={`w-8 h-8 flex items-center justify-center border transition-colors duration-500 ${
                    scrolled || !isHome || menuOpen
                      ? "border-[oklch(0.52_0.08_148)] text-[oklch(0.52_0.08_148)]"
                      : "border-white text-white"
                  }`}
                  style={{ borderWidth: "1.5px" }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="3" fill="currentColor" opacity="0.7" />
                    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1" />
                  </svg>
                </div>
                <div>
                  <span
                    className={`block font-display font-semibold text-base tracking-widest uppercase transition-colors duration-500 ${
                      scrolled || !isHome || menuOpen
                        ? "text-[oklch(0.18_0.018_55)]"
                        : "text-white"
                    }`}
                    style={{ letterSpacing: "0.25em", lineHeight: 1 }}
                  >
                    BION
                  </span>
                  <span
                    className={`block font-body text-[0.55rem] tracking-[0.18em] uppercase transition-colors duration-500 ${
                      scrolled || !isHome || menuOpen
                        ? "text-[oklch(0.52_0.02_60)]"
                        : "text-white/80"
                    }`}
                  >
                    Vive Consciente
                  </span>
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-7">
              {navLinks.slice(0, 7).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-link text-[0.75rem] tracking-widest uppercase transition-colors duration-300 ${
                    scrolled || !isHome
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

            {/* CTA Button */}
            <div className="hidden lg:flex items-center gap-4">
              <Link
                href="/contacto"
                className={`text-[0.75rem] tracking-widest uppercase transition-colors duration-300 ${
                  scrolled || !isHome
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
                  scrolled || !isHome
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

            {/* Mobile Menu Toggle */}
            <button
              className={`lg:hidden p-2 transition-colors duration-300 ${
                scrolled || !isHome || menuOpen
                  ? "text-[oklch(0.18_0.018_55)]"
                  : "text-white"
              }`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menú"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-all duration-500 ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-[oklch(0.18_0.018_55)]/40 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
        />

        {/* Menu Panel */}
        <div
          className={`absolute top-0 right-0 h-full w-[min(320px,85vw)] bg-[oklch(0.985_0.006_85)] shadow-2xl transition-transform duration-500 ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex flex-col h-full pt-20 pb-8 px-8">
            <nav className="flex flex-col gap-1 flex-1">
              {navLinks.map((link, i) => (
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
                    animationDelay: `${i * 50}ms`,
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
