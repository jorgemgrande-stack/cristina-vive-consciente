/**
 * AccionCita — Página privada (enlace firmado del aviso) para que Cristina acepte, declina o posponga una solicitud.
 * Ruta: /a/:token
 *
 * - Abrir el enlace NO cambia nada: las acciones se envían al pulsar un botón (POST).
 * - Solo actúa sobre solicitudes pendientes; si ya se resolvió, lo indica.
 * - No se indexa (noindex) y el token va en la ruta, no en parámetros que acaben en analítica.
 */
import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { Leaf, CheckCircle2, CalendarDays, Phone, Mail, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { bookableTimes, confirmationWhatsAppText } from "@shared/booking";
import { formatPhoneDisplay, whatsappNumber } from "@shared/phone";

type Mode = "summary" | "decline" | "postpone" | "done";
type Slot = { date: string; time: string };

const STATUS_TEXT: Record<string, string> = {
  confirmed: "ya está confirmada",
  cancelled: "ya está cancelada",
  rescheduled: "está pendiente de que el cliente elija una de las fechas propuestas",
  completed: "ya se ha realizado",
};

const btn = "w-full px-5 py-3.5 text-xs tracking-widest uppercase font-body transition-colors";
const field =
  "w-full px-3 py-2.5 bg-white border border-[oklch(0.88_0.015_75)] text-sm font-body text-[oklch(0.18_0.018_55)] focus:outline-none focus:border-[oklch(0.52_0.08_148)]";

function formatWhen(epoch: number): string {
  const d = new Date(epoch);
  const date = d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Madrid" });
  const time = d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Europe/Madrid" });
  return `${date} · ${time}`;
}

export default function AccionCita() {
  const { token } = useParams<{ token: string }>();
  const [mode, setMode] = useState<Mode>("summary");
  const [doneText, setDoneText] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [reason, setReason] = useState("");
  const [slots, setSlots] = useState<Slot[]>([{ date: "", time: "" }]);

  // Página privada: que no la indexe ningún buscador
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  const { data, isLoading, error } = trpc.bookings.adminLinkInfo.useQuery({ token }, { retry: false });

  const act = trpc.bookings.adminLinkAct.useMutation({
    onSuccess: (_r, v) => {
      setAccepted(v.action === "accept");
      setDoneText(v.action === "accept" ? "Cita confirmada. Hemos avisado al cliente por email." : "Solicitud declinada. Hemos avisado al cliente por email.");
      setMode("done");
    },
    onError: (e) => toast.error(e.message),
  });
  const propose = trpc.bookings.adminLinkPropose.useMutation({
    onSuccess: () => {
      setDoneText("Fechas propuestas. El cliente recibirá un email para elegir una.");
      setMode("done");
    },
    onError: (e) => toast.error(e.message),
  });

  const busy = act.isPending || propose.isPending;
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Madrid" });

  const submitPostpone = () => {
    const valid = slots.filter((s) => s.date && s.time);
    if (valid.length === 0) {
      toast.error("Indica al menos una fecha y una hora");
      return;
    }
    propose.mutate({ token, slots: valid });
  };

  return (
    <div className="min-h-screen bg-[oklch(0.985_0.006_85)] flex flex-col items-center py-10 px-4">
      <div className="mb-8">
        <a href="/">
          <img src="/logo-bion.png" alt="BION" className="h-12 object-contain" />
        </a>
      </div>

      <div className="w-full max-w-lg bg-white border border-[oklch(0.92_0.01_80)]">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-[oklch(0.92_0.01_80)]">
          <Leaf size={16} className="text-[oklch(0.52_0.08_148)]" />
          <h1 className="font-display text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 400, fontSize: "1.1rem" }}>
            Solicitud de cita
          </h1>
        </div>

        <div className="px-6 py-7">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-[oklch(0.52_0.08_148)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error || !data ? (
            <div className="text-center py-10">
              <CalendarDays size={36} className="mx-auto text-[oklch(0.88_0.015_75)] mb-4" />
              <p className="text-sm text-[oklch(0.52_0.02_60)] font-body">Este enlace no es válido o ha caducado.</p>
              <a href="/crm/citas" className="inline-block mt-4 text-[oklch(0.52_0.08_148)] text-xs font-body hover:underline">
                Ir a las citas del CRM
              </a>
            </div>
          ) : mode === "done" ? (
            <div className="text-center py-8">
              <CheckCircle2 size={48} className="mx-auto text-[oklch(0.52_0.08_148)] mb-5" />
              <p className="text-sm text-[oklch(0.18_0.018_55)] font-body leading-relaxed">{doneText}</p>
              {accepted && data && data.clientPhone && whatsappNumber(data.clientPhone) && (
                <a
                  href={`https://wa.me/${whatsappNumber(data.clientPhone)}?text=${encodeURIComponent(
                    confirmationWhatsAppText({ firstName: data.clientName.split(" ")[0] ?? "", serviceLabel: data.serviceLabel, scheduledAt: data.scheduledAt }),
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#25D366] text-white text-xs tracking-widest uppercase font-body no-underline hover:opacity-90"
                >
                  Avisar a {data.clientName.split(" ")[0]} por WhatsApp
                </a>
              )}
              <a href="/crm/citas" className="inline-block mt-6 text-[oklch(0.52_0.08_148)] text-xs font-body hover:underline">
                Ver las citas en el CRM
              </a>
            </div>
          ) : (
            <>
              <div className="space-y-1.5 mb-6 text-sm font-body text-[oklch(0.18_0.018_55)]">
                <p className="text-base" style={{ fontWeight: 500 }}>{data.clientName}</p>
                <p style={{ fontWeight: 300 }}>{data.serviceLabel}</p>
                <p className="capitalize" style={{ fontWeight: 500 }}>{formatWhen(data.scheduledAt)}</p>
                {data.clientPhone && (
                  <p className="flex items-center gap-2" style={{ fontWeight: 300 }}>
                    <Phone size={13} /> <a href={`tel:${data.clientPhone}`} className="text-[oklch(0.52_0.08_148)]">{formatPhoneDisplay(data.clientPhone)}</a>
                  </p>
                )}
                {data.clientEmail && (
                  <p className="flex items-center gap-2" style={{ fontWeight: 300 }}>
                    <Mail size={13} /> <a href={`mailto:${data.clientEmail}`} className="text-[oklch(0.52_0.08_148)]">{data.clientEmail}</a>
                  </p>
                )}
                {data.notes && (
                  <p className="pt-2 text-xs italic text-[oklch(0.52_0.02_60)] whitespace-pre-line" style={{ fontWeight: 300 }}>{data.notes}</p>
                )}
              </div>

              {!data.canAct ? (
                <p className="text-sm text-[oklch(0.52_0.02_60)] font-body border-t border-[oklch(0.92_0.01_80)] pt-5" style={{ fontWeight: 300 }}>
                  Esta solicitud {STATUS_TEXT[data.status] ?? "ya se ha resuelto"}. No hace falta hacer nada más.
                </p>
              ) : mode === "summary" ? (
                <div className="space-y-3 border-t border-[oklch(0.92_0.01_80)] pt-5">
                  <button
                    disabled={busy}
                    onClick={() => act.mutate({ token, action: "accept" })}
                    className={`${btn} bg-[oklch(0.52_0.08_148)] text-white hover:bg-[oklch(0.38_0.07_148)] disabled:opacity-60`}
                  >
                    {act.isPending ? "Confirmando…" : "Aceptar cita"}
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => setMode("postpone")}
                    className={`${btn} border border-[oklch(0.52_0.08_148)] text-[oklch(0.38_0.07_148)] hover:bg-[oklch(0.52_0.08_148)]/5 disabled:opacity-60`}
                  >
                    Posponer · proponer otra fecha
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => setMode("decline")}
                    className={`${btn} border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-60`}
                  >
                    Declinar
                  </button>
                  <p className="text-[0.7rem] text-[oklch(0.52_0.02_60)] font-body pt-1" style={{ fontWeight: 300 }}>
                    Al aceptar o declinar, el cliente recibe un email automático.
                  </p>
                </div>
              ) : mode === "decline" ? (
                <div className="space-y-3 border-t border-[oklch(0.92_0.01_80)] pt-5">
                  <label className="block text-xs uppercase tracking-wider font-body text-[oklch(0.38_0.02_55)]" style={{ fontWeight: 500 }}>
                    Motivo (opcional, se lo enviamos al cliente)
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    maxLength={300}
                    rows={3}
                    placeholder="No es posible atender la cita en esa fecha y hora."
                    className={field}
                    style={{ borderRadius: 0, fontWeight: 300 }}
                  />
                  <button
                    disabled={busy}
                    onClick={() => act.mutate({ token, action: "decline", reason: reason.trim() || undefined })}
                    className={`${btn} bg-red-700 text-white hover:bg-red-800 disabled:opacity-60`}
                  >
                    {act.isPending ? "Declinando…" : "Confirmar: declinar solicitud"}
                  </button>
                  <button disabled={busy} onClick={() => setMode("summary")} className={`${btn} text-[oklch(0.52_0.02_60)]`}>
                    Volver
                  </button>
                </div>
              ) : (
                <div className="space-y-3 border-t border-[oklch(0.92_0.01_80)] pt-5">
                  <p className="text-xs uppercase tracking-wider font-body text-[oklch(0.38_0.02_55)]" style={{ fontWeight: 500 }}>
                    Propón hasta 3 fechas (el cliente elige una)
                  </p>
                  {slots.map((s, i) => {
                    const times = bookableTimes(s.date);
                    return (
                      <div key={i} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
                        <input
                          type="date"
                          min={today}
                          value={s.date}
                          onChange={(e) => setSlots((prev) => prev.map((x, j) => (j === i ? { date: e.target.value, time: "" } : x)))}
                          className={field}
                          style={{ borderRadius: 0, fontWeight: 300 }}
                        />
                        <select
                          value={s.time}
                          disabled={!s.date}
                          onChange={(e) => setSlots((prev) => prev.map((x, j) => (j === i ? { ...x, time: e.target.value } : x)))}
                          className={`${field} w-28 disabled:opacity-60`}
                          style={{ borderRadius: 0, fontWeight: 300 }}
                        >
                          <option value="">Hora</option>
                          {times.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                        {slots.length > 1 ? (
                          <button type="button" aria-label="Quitar fecha" onClick={() => setSlots((prev) => prev.filter((_, j) => j !== i))} className="p-2 text-[oklch(0.52_0.02_60)]">
                            <Trash2 size={15} />
                          </button>
                        ) : (
                          <span />
                        )}
                      </div>
                    );
                  })}
                  {slots.length < 3 && (
                    <button type="button" onClick={() => setSlots((prev) => [...prev, { date: "", time: "" }])} className="flex items-center gap-1.5 text-xs text-[oklch(0.52_0.08_148)] font-body">
                      <Plus size={13} /> Añadir otra fecha
                    </button>
                  )}
                  <button disabled={busy} onClick={submitPostpone} className={`${btn} bg-[oklch(0.52_0.08_148)] text-white hover:bg-[oklch(0.38_0.07_148)] disabled:opacity-60`}>
                    {propose.isPending ? "Enviando…" : "Enviar propuesta al cliente"}
                  </button>
                  <button disabled={busy} onClick={() => setMode("summary")} className={`${btn} text-[oklch(0.52_0.02_60)]`}>
                    Volver
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
