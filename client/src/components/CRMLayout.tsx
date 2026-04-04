/**
 * CRMLayout — Cristina Vive Consciente
 * Layout del panel de administración / CRM
 * Protegido: solo accesible para rol "admin"
 */

import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  FileText,
  Star,
  Tag,
  Zap,
  Stethoscope,
  BookOpen,
  Menu,
  X,
  LogOut,
  ChevronRight,
  ChevronDown,
  Globe,
  Droplets,
  FolderOpen,
  Package,
  ClipboardList,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/logo-bion-original_f6b56924.avif";

const NAV_ITEMS = [
  { href: "/crm", label: "Dashboard", icon: LayoutDashboard },
  { href: "/crm/clientes", label: "Clientes", icon: Users },
  { href: "/crm/citas", label: "Citas", icon: CalendarDays },
  { href: "/crm/facturas", label: "Facturas", icon: FileText },
  { href: "/crm/afiliados", label: "Afiliados", icon: Star },
  { href: "/crm/categorias", label: "Categorías", icon: Tag },
  { href: "/crm/servicios", label: "Servicios", icon: Stethoscope },
  { href: "/crm/ebooks", label: "Ebooks", icon: BookOpen },
  { href: "/crm/automatizaciones", label: "Automatizaciones", icon: Zap },
];

const WATER_SUBITEMS = [
  { href: "/crm/agua/productos", label: "Productos", icon: Package },
  { href: "/crm/agua/categorias", label: "Categorías", icon: FolderOpen },
  { href: "/crm/agua/solicitudes", label: "Solicitudes", icon: ClipboardList },
];

interface CRMLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function CRMLayout({ children, title }: CRMLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const isWaterSection = location.startsWith("/crm/agua");
  const [waterExpanded, setWaterExpanded] = useState(isWaterSection);

  const { data: user, isLoading } = trpc.auth.me.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { window.location.href = "/"; },
  });

  // Auth guard
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[oklch(0.97_0.006_85)]">
        <div className="w-8 h-8 border-2 border-[oklch(0.52_0.08_148)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[oklch(0.97_0.006_85)] gap-6">
        <img src={LOGO_URL} alt="BION — Cristina Vive Consciente" className="w-36 object-contain" />
        <p className="text-[oklch(0.38_0.02_55)] font-body text-sm">Acceso restringido. Inicia sesión para continuar.</p>
        <a
          href={getLoginUrl("/crm")}
          className="px-6 py-3 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-body hover:bg-[oklch(0.38_0.07_148)] transition-colors"
          style={{ letterSpacing: "0.1em" }}
        >
          Iniciar sesión
        </a>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[oklch(0.97_0.006_85)] gap-4">
        <p className="text-[oklch(0.38_0.02_55)] font-body">No tienes permisos para acceder al panel.</p>
        <Link href="/" className="text-[oklch(0.52_0.08_148)] text-sm font-body underline">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[oklch(0.97_0.006_85)]">
      {/* ── SIDEBAR ─────────────────────────────────────────── */}
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-60 bg-[oklch(0.18_0.018_55)] flex flex-col z-30 transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
          <img src={LOGO_URL} alt="BION" className="w-24 object-contain brightness-0 invert opacity-90" />
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white/60 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = location === href || (href !== "/crm" && location.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-body transition-all duration-200 no-underline group ${
                  isActive
                    ? "bg-[oklch(0.52_0.08_148)] text-white"
                    : "text-white/60 hover:text-white hover:bg-white/8"
                }`}
                style={{ borderRadius: 0, fontWeight: isActive ? 500 : 400 }}
              >
                <Icon size={16} className={isActive ? "text-white" : "text-white/50 group-hover:text-white/80"} />
                {label}
                {isActive && <ChevronRight size={12} className="ml-auto" />}
              </Link>
            );
          })}

          {/* Máquinas de Agua — con submenú */}
          <div>
            <button
              onClick={() => setWaterExpanded(!waterExpanded)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-body transition-all duration-200 group ${
                isWaterSection
                  ? "bg-[oklch(0.52_0.08_148)] text-white"
                  : "text-white/60 hover:text-white hover:bg-white/8"
              }`}
              style={{ borderRadius: 0, fontWeight: isWaterSection ? 500 : 400 }}
            >
              <Droplets size={16} className={isWaterSection ? "text-white" : "text-white/50 group-hover:text-white/80"} />
              Máquinas de Agua
              <span className="ml-auto">
                {waterExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </span>
            </button>
            {waterExpanded && (
              <div className="ml-4 mt-1 space-y-0.5">
                {WATER_SUBITEMS.map(({ href, label, icon: Icon }) => {
                  const isSubActive = location === href || location.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 text-xs font-body transition-all duration-200 no-underline group ${
                        isSubActive
                          ? "text-white bg-white/15"
                          : "text-white/50 hover:text-white hover:bg-white/8"
                      }`}
                      style={{ borderRadius: 0, fontWeight: isSubActive ? 500 : 400 }}
                    >
                      <Icon size={13} className={isSubActive ? "text-white" : "text-white/40 group-hover:text-white/70"} />
                      {label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-white/10 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 text-white/50 hover:text-white text-sm font-body transition-colors no-underline"
            style={{ fontWeight: 300 }}
          >
            <Globe size={15} />
            Ver web pública
          </Link>
          <button
            onClick={() => logoutMutation.mutate()}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-white/50 hover:text-white text-sm font-body transition-colors"
            style={{ fontWeight: 300 }}
          >
            <LogOut size={15} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── MAIN ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:ml-60 min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-white border-b border-[oklch(0.92_0.01_80)] px-4 md:px-6 h-14 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-[oklch(0.38_0.02_55)] hover:text-[oklch(0.18_0.018_55)] transition-colors"
          >
            <Menu size={20} />
          </button>
          {title && (
            <h1
              className="font-display text-[oklch(0.18_0.018_55)] text-lg"
              style={{ fontWeight: 400 }}
            >
              {title}
            </h1>
          )}
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-[oklch(0.38_0.02_55)] font-body" style={{ fontWeight: 500 }}>
                {user.name ?? "Admin"}
              </p>
              <p className="text-[0.65rem] text-[oklch(0.52_0.08_148)] font-body uppercase tracking-wider" style={{ fontWeight: 500 }}>
                Administrador
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-[oklch(0.52_0.08_148)] flex items-center justify-center text-white text-xs font-body font-medium">
              {(user.name ?? "A")[0].toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
