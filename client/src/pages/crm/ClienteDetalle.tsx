/**
 * CRM ClienteDetalle — Ficha completa del cliente
 * Historial de sesiones, notas, citas y acciones rápidas
 */

import { useState } from "react";
import { useParams, Link } from "wouter";
import {
  ArrowLeft, Edit, MessageCircle, Mail, Phone, Plus,
  CalendarDays, FileText, StickyNote, Clock, Trash2,
  ChevronDown, ChevronUp, User,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import CRMLayout from "@/components/CRMLayout";

const NOTE_TYPES: Record<string, { label: string; color: string }> = {
  general: { label: "General", color: "bg-gray-100 text-gray-600" },
  sesion: { label: "Sesión", color: "bg-blue-50 text-blue-700" },
  seguimiento: { label: "Seguimiento", color: "bg-purple-50 text-purple-700" },
  observacion: { label: "Observación", color: "bg-amber-50 text-amber-700" },
  alerta: { label: "Alerta", color: "bg-red-50 text-red-700" },
};

const SERVICE_LABELS: Record<string, string> = {
  consulta_acompanamiento: "Consulta Acompañamiento",
  consulta_naturopata: "Consulta Naturopata",
  consulta_breve: "Consulta Breve",
  consulta_express: "Consulta Express",
  biohabitabilidad: "Biohabitabilidad",
  kinesiologia: "Kinesiología",
  masaje: "Masaje",
  otro: "Otro",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "bg-amber-100 text-amber-700" },
  confirmed: { label: "Confirmada", color: "bg-blue-100 text-blue-700" },
  completed: { label: "Completada", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelada", color: "bg-red-100 text-red-700" },
  rescheduled: { label: "Reprogramada", color: "bg-purple-100 text-purple-700" },
};

function formatDateTime(ts: number) {
  return new Date(ts).toLocaleString("es-ES", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

export default function ClienteDetalle() {
  const params = useParams<{ id: string }>();
  const clientId = parseInt(params.id);
  const [activeTab, setActiveTab] = useState<"citas" | "notas" | "historial">("citas");
  const [newNote, setNewNote] = useState("");
  const [noteType, setNoteType] = useState<"general" | "sesion" | "seguimiento" | "observacion" | "alerta">("general");
  const [showNoteForm, setShowNoteForm] = useState(false);

  const utils = trpc.useUtils();

  const { data: client, isLoading } = trpc.crm.clients.get.useQuery({ id: clientId });
  const { data: appointments } = trpc.crm.appointments.list.useQuery({ clientId });
  const { data: notes, refetch: refetchNotes } = trpc.crm.notes.list.useQuery({ clientId });
  const { data: sessions } = trpc.crm.sessions.list.useQuery({ clientId });

  const createNote = trpc.crm.notes.create.useMutation({
    onSuccess: () => { setNewNote(""); setShowNoteForm(false); refetchNotes(); toast.success("Nota añadida"); },
    onError: (e) => toast.error(e.message),
  });

  const deleteNote = trpc.crm.notes.delete.useMutation({
    onSuccess: () => { refetchNotes(); toast.success("Nota eliminada"); },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <CRMLayout title="Cliente">
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-[oklch(0.52_0.08_148)] border-t-transparent rounded-full animate-spin" />
        </div>
      </CRMLayout>
    );
  }

  if (!client) {
    return (
      <CRMLayout title="Cliente">
        <div className="text-center py-20">
          <p className="text-[oklch(0.52_0.02_60)] font-body">Cliente no encontrado</p>
          <Link href="/crm/clientes" className="text-[oklch(0.52_0.08_148)] text-sm font-body mt-3 block hover:underline no-underline">
            Volver al listado
          </Link>
        </div>
      </CRMLayout>
    );
  }

  return (
    <CRMLayout title={`${client.firstName} ${client.lastName}`}>
      <Link
        href="/crm/clientes"
        className="inline-flex items-center gap-1.5 text-xs text-[oklch(0.52_0.02_60)] font-body hover:text-[oklch(0.52_0.08_148)] transition-colors no-underline mb-5"
      >
        <ArrowLeft size={13} /> Clientes
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        {/* ── SIDEBAR INFO ── */}
        <div className="space-y-4">
          {/* Card principal */}
          <div className="bg-white border border-[oklch(0.92_0.01_80)] p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-[oklch(0.52_0.08_148)]/10 flex items-center justify-center text-[oklch(0.52_0.08_148)] font-display text-lg" style={{ fontWeight: 500 }}>
                {client.firstName[0]}{client.lastName[0]}
              </div>
              <Link
                href={`/crm/clientes/${clientId}/editar`}
                className="w-7 h-7 flex items-center justify-center border border-[oklch(0.92_0.01_80)] text-[oklch(0.52_0.02_60)] hover:border-[oklch(0.52_0.08_148)] hover:text-[oklch(0.52_0.08_148)] transition-colors no-underline"
                title="Editar"
              >
                <Edit size={13} />
              </Link>
            </div>
            <h2 className="font-display text-[oklch(0.18_0.018_55)] mb-0.5" style={{ fontWeight: 500, fontSize: "1.1rem" }}>
              {client.firstName} {client.lastName}
            </h2>
            <span className={`text-[0.6rem] px-2 py-0.5 font-body uppercase tracking-wider ${
              client.status === "active" ? "bg-green-50 text-green-700" :
              client.status === "lead" ? "bg-amber-50 text-amber-700" :
              "bg-gray-100 text-gray-600"
            }`}>
              {client.status === "active" ? "Activo" : client.status === "lead" ? "Lead" : "Inactivo"}
            </span>
          </div>

          {/* Contacto */}
          <div className="bg-white border border-[oklch(0.92_0.01_80)] p-5 space-y-3">
            <p className="text-[0.65rem] text-[oklch(0.52_0.02_60)] font-body uppercase tracking-widest mb-3" style={{ fontWeight: 500 }}>
              Contacto
            </p>
            {client.phone && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone size={13} className="text-[oklch(0.52_0.02_60)]" />
                  <span className="text-sm text-[oklch(0.18_0.018_55)] font-body" style={{ fontWeight: 300 }}>{client.phone}</span>
                </div>
                <div className="flex gap-1">
                  <a href={`tel:${client.phone}`} className="w-6 h-6 flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors" title="Llamar">
                    <Phone size={11} />
                  </a>
                  <a href={`https://wa.me/${client.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="w-6 h-6 flex items-center justify-center bg-green-50 text-green-600 hover:bg-green-100 transition-colors" title="WhatsApp">
                    <MessageCircle size={11} />
                  </a>
                </div>
              </div>
            )}
            {client.email && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Mail size={13} className="text-[oklch(0.52_0.02_60)] flex-shrink-0" />
                  <span className="text-sm text-[oklch(0.18_0.018_55)] font-body truncate" style={{ fontWeight: 300 }}>{client.email}</span>
                </div>
                <a href={`mailto:${client.email}`} className="w-6 h-6 flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors ml-2 flex-shrink-0">
                  <Mail size={11} />
                </a>
              </div>
            )}
            {client.city && (
              <div className="flex items-center gap-2">
                <User size={13} className="text-[oklch(0.52_0.02_60)]" />
                <span className="text-sm text-[oklch(0.38_0.02_55)] font-body" style={{ fontWeight: 300 }}>{client.city}</span>
              </div>
            )}
            {client.birthDate && (
              <div className="flex items-center gap-2">
                <CalendarDays size={13} className="text-[oklch(0.52_0.02_60)]" />
                <span className="text-sm text-[oklch(0.38_0.02_55)] font-body" style={{ fontWeight: 300 }}>{client.birthDate}</span>
              </div>
            )}
            {client.referredBy && (
              <p className="text-xs text-[oklch(0.52_0.02_60)] font-body" style={{ fontWeight: 300 }}>
                Referido por: {client.referredBy}
              </p>
            )}
          </div>

          {/* Notas internas */}
          {client.notes && (
            <div className="bg-amber-50 border border-amber-200 p-4">
              <p className="text-[0.65rem] text-amber-700 font-body uppercase tracking-widest mb-2" style={{ fontWeight: 500 }}>
                Nota interna
              </p>
              <p className="text-xs text-amber-800 font-body leading-relaxed" style={{ fontWeight: 300 }}>
                {client.notes}
              </p>
            </div>
          )}

          {/* Quick actions */}
          <div className="bg-white border border-[oklch(0.92_0.01_80)] p-4 space-y-2">
            <p className="text-[0.65rem] text-[oklch(0.52_0.02_60)] font-body uppercase tracking-widest mb-3" style={{ fontWeight: 500 }}>
              Acciones rápidas
            </p>
            <Link
              href={`/crm/citas/nueva?clientId=${clientId}`}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[oklch(0.38_0.02_55)] border border-[oklch(0.92_0.01_80)] hover:border-[oklch(0.52_0.08_148)] hover:text-[oklch(0.52_0.08_148)] transition-colors font-body no-underline"
              style={{ fontWeight: 400 }}
            >
              <CalendarDays size={13} /> Nueva cita
            </Link>
            <Link
              href={`/crm/facturas/nueva?clientId=${clientId}`}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[oklch(0.38_0.02_55)] border border-[oklch(0.92_0.01_80)] hover:border-[oklch(0.52_0.08_148)] hover:text-[oklch(0.52_0.08_148)] transition-colors font-body no-underline"
              style={{ fontWeight: 400 }}
            >
              <FileText size={13} /> Crear factura
            </Link>
            <button
              onClick={() => setShowNoteForm(true)}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[oklch(0.38_0.02_55)] border border-[oklch(0.92_0.01_80)] hover:border-[oklch(0.52_0.08_148)] hover:text-[oklch(0.52_0.08_148)] transition-colors font-body"
              style={{ fontWeight: 400 }}
            >
              <StickyNote size={13} /> Añadir nota
            </button>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div>
          {/* Tabs */}
          <div className="flex border-b border-[oklch(0.92_0.01_80)] mb-5">
            {(["citas", "notas", "historial"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-xs font-body uppercase tracking-wider transition-colors ${
                  activeTab === tab
                    ? "border-b-2 border-[oklch(0.52_0.08_148)] text-[oklch(0.52_0.08_148)]"
                    : "text-[oklch(0.52_0.02_60)] hover:text-[oklch(0.38_0.02_55)]"
                }`}
                style={{ fontWeight: activeTab === tab ? 500 : 400, letterSpacing: "0.08em" }}
              >
                {tab === "citas" ? `Citas (${appointments?.length ?? 0})` :
                 tab === "notas" ? `Notas (${notes?.length ?? 0})` :
                 `Historial (${sessions?.length ?? 0})`}
              </button>
            ))}
          </div>

          {/* CITAS */}
          {activeTab === "citas" && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <Link
                  href={`/crm/citas/nueva?clientId=${clientId}`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-[oklch(0.52_0.08_148)] text-white text-xs font-body hover:bg-[oklch(0.38_0.07_148)] transition-colors no-underline"
                  style={{ borderRadius: 0 }}
                >
                  <Plus size={12} /> Nueva cita
                </Link>
              </div>
              {!appointments || appointments.length === 0 ? (
                <div className="bg-white border border-[oklch(0.92_0.01_80)] p-10 text-center">
                  <CalendarDays size={28} className="mx-auto text-[oklch(0.88_0.015_75)] mb-2" />
                  <p className="text-sm text-[oklch(0.52_0.02_60)] font-body" style={{ fontWeight: 300 }}>Sin citas registradas</p>
                </div>
              ) : (
                appointments.map(({ appointment: appt }) => (
                  <div key={appt.id} className="bg-white border border-[oklch(0.92_0.01_80)] p-4 flex items-start gap-4">
                    <div className="text-center min-w-[4rem]">
                      <p className="text-[0.65rem] text-[oklch(0.52_0.08_148)] font-body uppercase tracking-wider">
                        {new Date(appt.scheduledAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                      </p>
                      <p className="font-display text-[oklch(0.18_0.018_55)] text-sm" style={{ fontWeight: 500 }}>
                        {new Date(appt.scheduledAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[oklch(0.18_0.018_55)] font-body" style={{ fontWeight: 500 }}>
                        {SERVICE_LABELS[appt.serviceType] ?? appt.serviceType}
                      </p>
                      <p className="text-xs text-[oklch(0.52_0.02_60)] font-body" style={{ fontWeight: 300 }}>
                        {appt.modality} · {appt.durationMinutes} min {appt.price ? `· ${appt.price}€` : ""}
                      </p>
                      {appt.internalNotes && (
                        <p className="text-xs text-[oklch(0.52_0.02_60)] font-body mt-1 italic" style={{ fontWeight: 300 }}>
                          {appt.internalNotes}
                        </p>
                      )}
                    </div>
                    <span className={`text-[0.6rem] px-2 py-0.5 font-body uppercase tracking-wider flex-shrink-0 ${STATUS_LABELS[appt.status]?.color ?? "bg-gray-100 text-gray-600"}`}>
                      {STATUS_LABELS[appt.status]?.label ?? appt.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* NOTAS */}
          {activeTab === "notas" && (
            <div className="space-y-3">
              {/* Add note form */}
              {showNoteForm && (
                <div className="bg-white border border-[oklch(0.52_0.08_148)]/30 p-4 space-y-3">
                  <div className="flex gap-2">
                    {(Object.keys(NOTE_TYPES) as Array<keyof typeof NOTE_TYPES>).map((t) => (
                      <button
                        key={t}
                        onClick={() => setNoteType(t as any)}
                        className={`text-[0.6rem] px-2 py-0.5 font-body uppercase tracking-wider transition-colors ${
                          noteType === t ? NOTE_TYPES[t].color + " ring-1 ring-current" : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                        }`}
                      >
                        {NOTE_TYPES[t].label}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Escribe una nota..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm bg-white border border-[oklch(0.92_0.01_80)] text-[oklch(0.18_0.018_55)] focus:outline-none focus:border-[oklch(0.52_0.08_148)] transition-colors font-body resize-none"
                    style={{ borderRadius: 0 }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (!newNote.trim()) return;
                        createNote.mutate({ clientId, type: noteType, content: newNote });
                      }}
                      disabled={createNote.isPending || !newNote.trim()}
                      className="px-4 py-2 bg-[oklch(0.52_0.08_148)] text-white text-xs font-body hover:bg-[oklch(0.38_0.07_148)] transition-colors disabled:opacity-60"
                      style={{ borderRadius: 0 }}
                    >
                      Guardar nota
                    </button>
                    <button
                      onClick={() => { setShowNoteForm(false); setNewNote(""); }}
                      className="px-4 py-2 border border-[oklch(0.92_0.01_80)] text-[oklch(0.38_0.02_55)] text-xs font-body hover:border-[oklch(0.52_0.08_148)] transition-colors"
                      style={{ borderRadius: 0 }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {!showNoteForm && (
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowNoteForm(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-[oklch(0.52_0.08_148)] text-white text-xs font-body hover:bg-[oklch(0.38_0.07_148)] transition-colors"
                    style={{ borderRadius: 0 }}
                  >
                    <Plus size={12} /> Nueva nota
                  </button>
                </div>
              )}

              {!notes || notes.length === 0 ? (
                <div className="bg-white border border-[oklch(0.92_0.01_80)] p-10 text-center">
                  <StickyNote size={28} className="mx-auto text-[oklch(0.88_0.015_75)] mb-2" />
                  <p className="text-sm text-[oklch(0.52_0.02_60)] font-body" style={{ fontWeight: 300 }}>Sin notas</p>
                </div>
              ) : (
                notes.map((note) => (
                  <div key={note.id} className="bg-white border border-[oklch(0.92_0.01_80)] p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className={`text-[0.6rem] px-2 py-0.5 font-body uppercase tracking-wider ${NOTE_TYPES[note.type]?.color ?? "bg-gray-100 text-gray-600"}`}>
                        {NOTE_TYPES[note.type]?.label ?? note.type}
                      </span>
                      <div className="flex items-center gap-2">
                        <p className="text-[0.65rem] text-[oklch(0.65_0.01_60)] font-body">
                          {new Date(note.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                        <button
                          onClick={() => {
                            if (confirm("¿Eliminar esta nota?")) deleteNote.mutate({ id: note.id });
                          }}
                          className="text-[oklch(0.65_0.01_60)] hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-[oklch(0.28_0.025_55)] font-body leading-relaxed" style={{ fontWeight: 300 }}>
                      {note.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* HISTORIAL */}
          {activeTab === "historial" && (
            <div className="space-y-3">
              {!sessions || sessions.length === 0 ? (
                <div className="bg-white border border-[oklch(0.92_0.01_80)] p-10 text-center">
                  <Clock size={28} className="mx-auto text-[oklch(0.88_0.015_75)] mb-2" />
                  <p className="text-sm text-[oklch(0.52_0.02_60)] font-body" style={{ fontWeight: 300 }}>Sin historial de sesiones</p>
                </div>
              ) : (
                sessions.map((session) => (
                  <div key={session.id} className="bg-white border border-[oklch(0.92_0.01_80)] p-4">
                    <p className="text-[0.65rem] text-[oklch(0.52_0.08_148)] font-body uppercase tracking-wider mb-2">
                      {formatDate(session.sessionDate)}
                    </p>
                    {session.summary && (
                      <div className="mb-3">
                        <p className="text-[0.65rem] text-[oklch(0.52_0.02_60)] font-body uppercase tracking-wider mb-1" style={{ fontWeight: 500 }}>Resumen</p>
                        <p className="text-sm text-[oklch(0.28_0.025_55)] font-body leading-relaxed" style={{ fontWeight: 300 }}>{session.summary}</p>
                      </div>
                    )}
                    {session.protocols && (
                      <div className="mb-3">
                        <p className="text-[0.65rem] text-[oklch(0.52_0.02_60)] font-body uppercase tracking-wider mb-1" style={{ fontWeight: 500 }}>Protocolos</p>
                        <p className="text-sm text-[oklch(0.28_0.025_55)] font-body leading-relaxed" style={{ fontWeight: 300 }}>{session.protocols}</p>
                      </div>
                    )}
                    {session.nextSteps && (
                      <div className="mb-3">
                        <p className="text-[0.65rem] text-[oklch(0.52_0.02_60)] font-body uppercase tracking-wider mb-1" style={{ fontWeight: 500 }}>Próximos pasos</p>
                        <p className="text-sm text-[oklch(0.28_0.025_55)] font-body leading-relaxed" style={{ fontWeight: 300 }}>{session.nextSteps}</p>
                      </div>
                    )}
                    {session.supplements && (
                      <div>
                        <p className="text-[0.65rem] text-[oklch(0.52_0.02_60)] font-body uppercase tracking-wider mb-1" style={{ fontWeight: 500 }}>Suplementos</p>
                        <p className="text-sm text-[oklch(0.28_0.025_55)] font-body leading-relaxed" style={{ fontWeight: 300 }}>{session.supplements}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </CRMLayout>
  );
}
