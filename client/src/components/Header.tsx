/**
 * Header — Cristina Vive Consciente
 * Design: "Luz Botánica" — Art Nouveau depurado + Minimalismo escandinavo
 * Sticky transparent → fondo sólido al hacer scroll
 * Logo BION real + navegación limpia + botón "Reservar consulta" → BookingModal
 */

import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import BookingModal from "./BookingModal";
import { useSiteGlobal, isExternalUrl } from "@/lib/siteGlobal";
import SiteLink from "@/components/site/SiteLink";
import AnnouncementBar from "@/components/site/AnnouncementBar";
import PromoBanner from "@/components/site/PromoBanner";
import { useSiteAction } from "@/lib/siteActions";


export default function Header() {
  const site = useSiteGlobal();
  const LOGO_URL = site.identity.logoUrl;
  const LOGO_ALT = site.identity.logoAlt;
  const navLinks = site.header.nav.map((n) => ({ href: n.url, label: n.label }));
  const mobileLinks = (site.header.mobileNav.length ? site.header.mobileNav : site.header.nav).map((n) => ({ href: n.url, label: n.label }));
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [location, navigate] = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  useSiteAction("booking", () => setBookingOpen(true));
  const onCta = () => {
    if (site.header.ctaMode === "booking" || !site.header.ctaUrl) return setBookingOpen(true);
    if (isExternalUrl(site.header.ctaUrl) || site.header.ctaUrl.startsWith("#")) window.location.assign(site.header.ctaUrl);
    else navigate(site.header.ctaUrl);
  };
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
        <AnnouncementBar />
        <PromoBanner />
        <div className="container">
          <div className="flex items-center h-16 md:h-20">

            {/* Logo */}
            <Link href="/" className="flex items-center no-underline group">
              <img
                src={LOGO_URL}
                alt={LOGO_ALT}
                className={`w-auto object-contain transition-all duration-500 ${
                  solidBg ? "brightness-100" : "brightness-0 invert"
                }`}
                style={{ width: '120px', height: 'auto' }}
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-7 ml-auto mr-8">
              {navLinks.slice(0, site.header.desktopCount).map((link) => (
                <SiteLink
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
                </SiteLink>
              ))}
            </nav>

            {/* CTA */}
            <div className="hidden lg:flex items-center gap-4">
              {site.header.contactLabel && site.header.contactUrl && (
              <SiteLink
                href={site.header.contactUrl}
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
                {site.header.contactLabel}
              </SiteLink>
              )}
              {site.header.ctaLabel && (
              <button
                onClick={onCta}
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
                {site.header.ctaLabel}
              </button>
              )}
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
                alt={LOGO_ALT}
                className="h-10 w-auto object-contain"
                style={{ maxWidth: "160px" }}
              />
            </div>

            <nav className="flex flex-col gap-1 flex-1">
              {mobileLinks.map((link) => (
                <SiteLink
                  key={link.href + link.label}
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
                </SiteLink>
              ))}
            </nav>

            {site.header.ctaLabel && (
            <div className="mt-8">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onCta();
                }}
                className="w-full py-3.5 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-medium hover:bg-[oklch(0.38_0.07_148)] transition-colors duration-300"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  borderRadius: 0,
                  letterSpacing: "0.12em",
                }}
              >
                {site.header.ctaLabel}
              </button>
            </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={bookingOpen}
        onClose={() => setBookingOpen(false)}
      />
    </>
  );
}
