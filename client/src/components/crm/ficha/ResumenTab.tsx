/**
 * Ficha · Resumen: datos generales, «Información para recordar», última visita, próxima cita y servicios recibidos.
 */
import { useState } from "react";
import { CalendarClock, CalendarPlus, FileText, History, Loader2, Mail, Pencil, Phone, MessageCircle, Plus, Sparkles, StickyNote } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { LIMITS, REMEMBER_INFO_HELP } from "@shared/clientCare";
import { btnGhost, btnPrimary, card, confirmDiscard, Field, formatDay, formatDayTime, input, SectionTitle } from "./ui";
import DatosCliente from "./DatosCliente";

type Props = { clientId: number; onAddSession: () => void; onOpenSessions: () => void; onAddNote: () => void };

const quickAction = "flex flex-col items-center justify-center gap-1 min-h-[64px] px-2 py-2 bg-white border border-[oklch(0.92_0.01_80)] text-[0.7rem] text-[oklch(0.38_0.02_55)] font-body text-center hover:border-[oklch(0.52_0.08_148)] hover:text-[oklch(0.52_0.08_148)] no-underline";

export default function ResumenTab({ clientId, onAddSession, onOpenSessions, onAddNote }: Props) {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.care.summary.useQuery({ clientId });
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ occupation: "", customRate: "", customRateNote: "", rememberInfo: "" });
  const [showLegacy, setShowLegacy] = useState(false);

  const save = trpc.care.updateProfile.useMutation({
    onSuccess: (r) => {
      utils.care.summary.invalidate({ clientId });
      setEditing(false);
      toast.success(r.changed.length ? "Ficha guardada" : "Sin cambios");
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading || !data) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[oklch(0.52_0.08_148)]" size={20} /></div>;
  }
  const c = data.client;
  const original = { occupation: c.occupation ?? "", customRate: c.customRate ? String(Number(c.customRate)) : "", customRateNote: c.customRateNote ?? "", rememberInfo: c.rememberInfo ?? "" };
  const dirty = editing && JSON.stringify(form) !== JSON.stringify(original);
  const startEdit = () => { setForm(original); setEditing(true); };
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-4">
      <nav aria-label="Acciones rápidas" className="grid grid-cols-4 gap-2 lg:hidden">
        <Link href={`/crm/citas/nueva?clientId=${clientId}`} className={quickAction}><CalendarPlus size={16} /> Nueva cita</Link>
        <button type="button" onClick={onAddSession} className={quickAction}><Plus size={16} /> Sesión</button>
        <button type="button" onClick={onAddNote} className={quickAction}><StickyNote size={16} /> Nota</button>
        <Link href={`/crm/facturas/nueva?clientId=${clientId}`} className={quickAction}><FileText size={16} /> Factura</Link>
      </nav>

      {/* Información para recordar: lo primero que ve Cristina */}
      <div className="border border-amber-200 bg-amber-50 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[0.65rem] text-amber-800 font-body uppercase tracking-widest" style={{ fontWeight: 600 }}>
            <Sparkles size={12} className="inline -mt-0.5 mr-1" /> Información para recordar
          </p>
          {!editing && (
            <button onClick={startEdit} className="text-amber-800/80 hover:text-amber-900" aria-label="Editar ficha"><Pencil size={14} /></button>
          )}
        </div>
        {!editing && (
          <p className="text-sm text-amber-900 font-body mt-2 whitespace-pre-line" style={{ fontWeight: 300 }}>
            {c.rememberInfo || <span className="italic opacity-70">Nada todavía. Toca el lápiz para añadir preferencias prácticas.</span>}
          </p>
        )}
      </div>

      {editing ? (
        <form
          className={`${card} space-y-4`}
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate({ clientId, ...form });
          }}
        >
          <Field id="rememberInfo" title="Información para recordar" hint={REMEMBER_INFO_HELP}>
            <textarea id="rememberInfo" rows={3} maxLength={LIMITS.longText} value={form.rememberInfo} onChange={set("rememberInfo")} className={`${input} resize-y`} />
          </Field>
          <Field id="occupation" title="Ocupación u otros datos generales (opcional)">
            <input id="occupation" maxLength={LIMITS.shortText} value={form.occupation} onChange={set("occupation")} className={input} />
          </Field>
          <div className="grid grid-cols-[7rem_1fr] gap-3">
            <Field id="customRate" title="Tarifa (€)">
              <input id="customRate" inputMode="decimal" placeholder="—" value={form.customRate} onChange={set("customRate")} className={input} />
            </Field>
            <Field id="customRateNote" title="Detalle de la tarifa">
              <input id="customRateNote" maxLength={LIMITS.rateNote} placeholder="p. ej. bono de 5 sesiones" value={form.customRateNote} onChange={set("customRateNote")} className={input} />
            </Field>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={save.isPending || !dirty} className={`${btnPrimary} flex-1`}>
              {save.isPending && <Loader2 size={12} className="animate-spin" />} Guardar
            </button>
            <button type="button" className={btnGhost} onClick={() => confirmDiscard(dirty) && setEditing(false)}>Cancelar</button>
          </div>
        </form>
      ) : (
        <div className={card}>
          <SectionTitle action={<button onClick={startEdit} className="text-xs text-[oklch(0.52_0.08_148)] font-body hover:underline">Editar</button>}>
            Datos generales
          </SectionTitle>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-body">
            <div>
              <dt className="text-[0.65rem] uppercase tracking-wider text-[oklch(0.52_0.02_60)]">Teléfono</dt>
              <dd className="text-[oklch(0.18_0.018_55)] flex items-center gap-2 mt-0.5">
                {c.phone || "—"}
                {c.phone && (
                  <>
                    <a href={`tel:${c.phone}`} className="p-2.5 sm:p-1.5 bg-blue-50 text-blue-600" aria-label="Llamar"><Phone size={12} /></a>
                    <a href={`https://wa.me/${c.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="p-2.5 sm:p-1.5 bg-green-50 text-green-600" aria-label="WhatsApp"><MessageCircle size={12} /></a>
                  </>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-[0.65rem] uppercase tracking-wider text-[oklch(0.52_0.02_60)]">Correo</dt>
              <dd className="text-[oklch(0.18_0.018_55)] flex items-center gap-2 mt-0.5 min-w-0">
                <span className="truncate">{c.email || "—"}</span>
                {c.email && <a href={`mailto:${c.email}`} className="p-2.5 sm:p-1.5 bg-blue-50 text-blue-600 flex-shrink-0" aria-label="Enviar correo"><Mail size={12} /></a>}
              </dd>
            </div>
            <div>
              <dt className="text-[0.65rem] uppercase tracking-wider text-[oklch(0.52_0.02_60)]">Ocupación</dt>
              <dd className="text-[oklch(0.18_0.018_55)] mt-0.5">{c.occupation || "—"}</dd>
            </div>
            <div>
              <dt className="text-[0.65rem] uppercase tracking-wider text-[oklch(0.52_0.02_60)]">Tarifa particular</dt>
              <dd className="text-[oklch(0.18_0.018_55)] mt-0.5">{c.customRate ? `${Number(c.customRate)} €` : "—"}{c.customRateNote ? ` · ${c.customRateNote}` : ""}</dd>
            </div>
          </dl>
        </div>
      )}

      {/* Visitas y citas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className={card}>
          <SectionTitle>Última visita</SectionTitle>
          <p className="font-display text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 500, fontSize: "1.05rem" }}>
            {data.lastVisit ? formatDay(data.lastVisit) : "Sin sesiones registradas"}
          </p>
          {data.latestSession && (
            <button onClick={onOpenSessions} className="mt-2 inline-flex items-center gap-1 text-xs text-[oklch(0.52_0.08_148)] font-body hover:underline">
              <History size={12} /> Ver la última sesión{data.latestSession.serviceName ? ` (${data.latestSession.serviceName})` : ""} y el historial
            </button>
          )}
        </div>
        <div className={card}>
          <SectionTitle>Próxima cita</SectionTitle>
          {data.nextAppointment ? (
            <>
              <p className="font-display text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 500, fontSize: "1.05rem" }}>
                <CalendarClock size={15} className="inline -mt-0.5 mr-1 text-[oklch(0.52_0.08_148)]" />
                {formatDayTime(data.nextAppointment.scheduledAt)}
              </p>
              <p className="text-xs text-[oklch(0.52_0.02_60)] font-body mt-1">
                {data.nextAppointment.serviceLabel ?? "Cita"} · {data.nextAppointment.status === "pending" ? "pendiente de confirmar" : "confirmada"}
              </p>
            </>
          ) : (
            <p className="text-sm text-[oklch(0.52_0.02_60)] font-body">Ninguna cita próxima</p>
          )}
        </div>
      </div>

      <div className={card}>
        <SectionTitle>
          Servicios recibidos · {data.sessionsCount} {data.sessionsCount === 1 ? "sesión" : "sesiones"}
        </SectionTitle>
        {data.servicesReceived.length === 0 ? (
          <p className="text-sm text-[oklch(0.52_0.02_60)] font-body">
            {data.sessionsCount === 0 ? (
              <>Todavía no hay sesiones. <button type="button" onClick={onAddSession} className="text-[oklch(0.52_0.08_148)] hover:underline">Registrar la primera</button></>
            ) : (
              "Las sesiones registradas no indican servicio. Al añadir o editar una sesión puedes elegirlo."
            )}
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {data.servicesReceived.map((s) => (
              <li key={s.serviceId}>
                <Link
                  href={`/crm/servicios/${s.serviceId}/editar`}
                  className="inline-block text-xs font-body px-2.5 py-1.5 bg-[oklch(0.52_0.08_148)]/10 text-[oklch(0.32_0.06_148)] hover:bg-[oklch(0.52_0.08_148)]/20 no-underline"
                  title="Ver el servicio"
                >
                  {s.name} · {s.count} {s.count === 1 ? "sesión" : "sesiones"}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {c.legacyNotes && (
        <div className={card}>
          <SectionTitle action={<button onClick={() => setShowLegacy((v) => !v)} className="text-xs text-[oklch(0.52_0.08_148)] font-body hover:underline">{showLegacy ? "Ocultar" : "Mostrar"}</button>}>
            Notas importadas (texto anterior)
          </SectionTitle>
          <p className="text-[0.7rem] text-[oklch(0.52_0.02_60)] font-body">
            Texto heredado del sistema anterior. Si contiene datos de salud o emocionales, pásalos a Primera visita o Acompañamiento (con el consentimiento del cliente) o retíralos desde «Editar cliente».
          </p>
          {showLegacy && <p className="text-sm text-[oklch(0.28_0.025_55)] font-body mt-2 whitespace-pre-line" style={{ fontWeight: 300 }}>{c.legacyNotes}</p>}
        </div>
      )}

      <DatosCliente clientId={clientId} fullName={`${c.firstName} ${c.lastName}`} />
    </div>
  );
}
