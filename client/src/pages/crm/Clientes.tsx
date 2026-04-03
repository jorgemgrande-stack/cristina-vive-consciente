/**
 * CRM Clientes — Listado
 * Búsqueda, filtros por estado, acciones rápidas
 */

import { useState } from "react";
import { Link } from "wouter";
import {
  Search, Plus, MessageCircle, Phone, Mail, ArrowRight,
  Users, Filter, ChevronDown,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import CRMLayout from "@/components/CRMLayout";

const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  active: { label: "Activa", dot: "bg-green-500", badge: "bg-green-50 text-green-700" },
  inactive: { label: "Inactiva", dot: "bg-gray-400", badge: "bg-gray-100 text-gray-600" },
  lead: { label: "Lead", dot: "bg-amber-400", badge: "bg-amber-50 text-amber-700" },
};

export default function CRMClientes() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data: clients, isLoading, refetch } = trpc.crm.clients.list.useQuery({
    search: debouncedSearch || undefined,
    status: status !== "all" ? status : undefined,
  });

  const deleteClient = trpc.crm.clients.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const handleSearch = (v: string) => {
    setSearch(v);
    clearTimeout((window as any).__searchTimer);
    (window as any).__searchTimer = setTimeout(() => setDebouncedSearch(v), 350);
  };

  return (
    <CRMLayout title="Clientes">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[oklch(0.65_0.01_60)]" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o teléfono..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-[oklch(0.92_0.01_80)] text-[oklch(0.18_0.018_55)] placeholder-[oklch(0.65_0.01_60)] focus:outline-none focus:border-[oklch(0.52_0.08_148)] transition-colors font-body"
            style={{ borderRadius: 0 }}
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2.5 text-sm bg-white border border-[oklch(0.92_0.01_80)] text-[oklch(0.38_0.02_55)] focus:outline-none focus:border-[oklch(0.52_0.08_148)] transition-colors font-body cursor-pointer"
              style={{ borderRadius: 0 }}
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="lead">Leads</option>
              <option value="inactive">Inactivos</option>
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[oklch(0.52_0.02_60)] pointer-events-none" />
          </div>
          <Link
            href="/crm/clientes/nuevo"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-body hover:bg-[oklch(0.38_0.07_148)] transition-colors no-underline flex-shrink-0"
            style={{ borderRadius: 0, letterSpacing: "0.08em" }}
          >
            <Plus size={14} />
            Nuevo
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[oklch(0.92_0.01_80)] overflow-hidden">
        {/* Header */}
        <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-[oklch(0.92_0.01_80)] bg-[oklch(0.97_0.006_85)]">
          {["Cliente", "Contacto", "Ciudad", "Estado", "Acciones"].map((h) => (
            <p key={h} className="text-[0.65rem] text-[oklch(0.52_0.02_60)] font-body uppercase tracking-widest" style={{ fontWeight: 500 }}>
              {h}
            </p>
          ))}
        </div>

        {/* Rows */}
        {isLoading ? (
          <div className="p-10 text-center">
            <div className="w-6 h-6 border-2 border-[oklch(0.52_0.08_148)] border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : !clients || clients.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={32} className="mx-auto text-[oklch(0.88_0.015_75)] mb-3" />
            <p className="text-sm text-[oklch(0.52_0.02_60)] font-body" style={{ fontWeight: 300 }}>
              {search ? "No se encontraron clientes con ese criterio" : "Aún no hay clientes registrados"}
            </p>
            {!search && (
              <Link
                href="/crm/clientes/nuevo"
                className="inline-flex items-center gap-1.5 mt-4 text-[oklch(0.52_0.08_148)] text-xs font-body hover:underline no-underline"
              >
                <Plus size={13} /> Añadir primer cliente
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[oklch(0.96_0.006_80)]">
            {clients.map((client) => {
              const sc = STATUS_CONFIG[client.status] ?? STATUS_CONFIG.active;
              return (
                <div
                  key={client.id}
                  className="grid grid-cols-1 md:grid-cols-[2fr_1.5fr_1fr_1fr_auto] gap-2 md:gap-4 px-5 py-4 hover:bg-[oklch(0.98_0.004_80)] transition-colors items-center"
                >
                  {/* Name */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[oklch(0.52_0.08_148)]/10 flex items-center justify-center text-[oklch(0.52_0.08_148)] text-xs font-body font-medium flex-shrink-0">
                      {client.firstName[0]}{client.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm text-[oklch(0.18_0.018_55)] font-body" style={{ fontWeight: 500 }}>
                        {client.firstName} {client.lastName}
                      </p>
                      <p className="text-xs text-[oklch(0.52_0.02_60)] font-body md:hidden" style={{ fontWeight: 300 }}>
                        {client.email}
                      </p>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="hidden md:block">
                    {client.email && (
                      <p className="text-xs text-[oklch(0.38_0.02_55)] font-body truncate" style={{ fontWeight: 300 }}>
                        {client.email}
                      </p>
                    )}
                    {client.phone && (
                      <p className="text-xs text-[oklch(0.52_0.02_60)] font-body" style={{ fontWeight: 300 }}>
                        {client.phone}
                      </p>
                    )}
                  </div>

                  {/* City */}
                  <p className="hidden md:block text-xs text-[oklch(0.52_0.02_60)] font-body" style={{ fontWeight: 300 }}>
                    {client.city ?? "—"}
                  </p>

                  {/* Status */}
                  <div className="hidden md:flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                    <span className={`text-[0.6rem] px-2 py-0.5 font-body uppercase tracking-wider ${sc.badge}`}>
                      {sc.label}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    {client.phone && (
                      <a
                        href={`https://wa.me/${client.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7 h-7 flex items-center justify-center bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                        title="WhatsApp"
                      >
                        <MessageCircle size={13} />
                      </a>
                    )}
                    {client.email && (
                      <a
                        href={`mailto:${client.email}`}
                        className="w-7 h-7 flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        title="Email"
                      >
                        <Mail size={13} />
                      </a>
                    )}
                    <Link
                      href={`/crm/clientes/${client.id}`}
                      className="w-7 h-7 flex items-center justify-center bg-[oklch(0.52_0.08_148)]/10 text-[oklch(0.52_0.08_148)] hover:bg-[oklch(0.52_0.08_148)]/20 transition-colors no-underline"
                      title="Ver ficha"
                    >
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer count */}
        {clients && clients.length > 0 && (
          <div className="px-5 py-3 border-t border-[oklch(0.92_0.01_80)] bg-[oklch(0.97_0.006_85)]">
            <p className="text-[0.65rem] text-[oklch(0.52_0.02_60)] font-body">
              {clients.length} cliente{clients.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>
    </CRMLayout>
  );
}
