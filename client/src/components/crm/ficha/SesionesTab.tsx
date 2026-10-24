/**
 * Ficha · Sesiones: registrar una sesión ordinaria en pocos pasos y consultar el historial (más reciente primero).
 * Cada sesión nueva es una entrada nueva; editar una sesión deja constancia de quién y cuándo.
 */
import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { LIMITS, SESSION_NOTES_HELP } from "@shared/clientCare";
import { btnGhost, btnPrimary, card, confirmDiscard, dateInputToMs, dateInputValue, EmptyState, Field, formatDay, input } from "./ui";

type FormState = { date: string; serviceId: string; durationMinutes: string; practicalNotes: string; clientPreferences: string; pendingNext: string };
const empty = (serviceId = "", duration = ""): FormState => ({
  date: dateInputValue(Date.now()),
  serviceId,
  durationMinutes: duration,
  practicalNotes: "",
  clientPreferences: "",
  pendingNext: "",
});

type Props = { clientId: number; openNew: boolean; onNewHandled: () => void };

export default function SesionesTab({ clientId, openNew, onNewHandled }: Props) {
  const utils = trpc.useUtils();
  const { data: sessions, isLoading } = trpc.care.sessions.list.useQuery({ clientId });
  const { data: services } = trpc.services.listAdmin.useQuery();
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<FormState>(empty());
  const [initial, setInitial] = useState<FormState>(empty());

  const selectable = useMemo(
    () => (services ?? []).filter((s) => s.status === "active" || String(s.id) === form.serviceId),
    [services, form.serviceId],
  );

  const startNew = () => {
    // Por defecto, el servicio de la última sesión (lo más habitual es repetir)
    const last = sessions?.[0];
    const svc = last?.serviceId ? String(last.serviceId) : "";
    const dur = last?.serviceId ? String((services ?? []).find((s) => s.id === last.serviceId)?.durationMinutes ?? "") : "";
    const f = empty(svc, dur);
    setForm(f);
    setInitial(f);
    setEditingId("new");
  };

  useEffect(() => {
    if (openNew && sessions && services) {
      startNew();
      onNewHandled();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openNew, sessions, services]);

  const done = (msg: string) => {
    utils.care.sessions.list.invalidate({ clientId });
    utils.care.summary.invalidate({ clientId });
    setEditingId(null);
    toast.success(msg);
  };
  const create = trpc.care.sessions.create.useMutation({ onSuccess: () => done("Sesión guardada"), onError: (e) => toast.error(e.message) });
  const update = trpc.care.sessions.update.useMutation({
    onSuccess: (r) => done(r.changed.length ? "Sesión actualizada" : "Sin cambios"),
    onError: (e) => toast.error(e.message),
  });

  const dirty = editingId !== null && JSON.stringify(form) !== JSON.stringify(initial);
  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.value;
    setForm((f) => {
      const next = { ...f, [k]: value };
      if (k === "serviceId") {
        const svc = (services ?? []).find((s) => String(s.id) === value);
        if (svc?.durationMinutes) next.durationMinutes = String(svc.durationMinutes);
      }
      return next;
    });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      clientId,
      sessionDate: dateInputToMs(form.date),
      serviceId: form.serviceId ? Number(form.serviceId) : null,
      durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : null,
      practicalNotes: form.practicalNotes,
      clientPreferences: form.clientPreferences,
      pendingNext: form.pendingNext,
    };
    if (editingId === "new") create.mutate(payload);
    else if (typeof editingId === "number") update.mutate({ ...payload, id: editingId });
  };

  const formEl = (
    <form onSubmit={submit} className={`${card} space-y-4 border-[oklch(0.52_0.08_148)]/40`}>
      <p className="text-sm font-body text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 500 }}>
        {editingId === "new" ? "Nueva sesión" : "Editar sesión"}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Field id="s-date" title="Fecha">
          <input id="s-date" type="date" required value={form.date} onChange={set("date")} className={input} />
        </Field>
        <Field id="s-duration" title="Duración (min)">
          <input id="s-duration" type="number" inputMode="numeric" min={5} max={600} value={form.durationMinutes} onChange={set("durationMinutes")} className={input} />
        </Field>
      </div>
      <Field id="s-service" title="Servicio o tipo de masaje">
        <select id="s-service" value={form.serviceId} onChange={set("serviceId")} className={input}>
          <option value="">— Sin especificar —</option>
          {selectable.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </Field>
      <Field id="s-notes" title="Observaciones prácticas" hint={SESSION_NOTES_HELP}>
        <textarea id="s-notes" rows={3} maxLength={LIMITS.longText} value={form.practicalNotes} onChange={set("practicalNotes")} className={`${input} resize-y`} />
      </Field>
      <Field id="s-prefs" title="Preferencias o comentarios del cliente">
        <textarea id="s-prefs" rows={2} maxLength={LIMITS.longText} value={form.clientPreferences} onChange={set("clientPreferences")} className={`${input} resize-y`} />
      </Field>
      <Field id="s-pending" title="Pendiente para la próxima sesión">
        <textarea id="s-pending" rows={2} maxLength={LIMITS.longText} value={form.pendingNext} onChange={set("pendingNext")} className={`${input} resize-y`} />
      </Field>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={create.isPending || update.isPending || (editingId !== "new" && !dirty)} className={`${btnPrimary} flex-1`}>
          {(create.isPending || update.isPending) && <Loader2 size={12} className="animate-spin" />} Guardar sesión
        </button>
        <button type="button" className={btnGhost} onClick={() => confirmDiscard(dirty) && setEditingId(null)}>Cancelar</button>
      </div>
    </form>
  );

  return (
    <div className="space-y-3">
      {editingId === null && (
        <button onClick={startNew} className={`${btnPrimary} w-full sm:w-auto`}>
          <Plus size={14} /> Añadir nueva sesión
        </button>
      )}
      {editingId === "new" && formEl}

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[oklch(0.52_0.08_148)]" size={20} /></div>
      ) : !sessions?.length ? (
        editingId === null && <EmptyState icon={<ClipboardList size={28} />} title="Todavía no hay sesiones" text="Registra la primera con «Añadir nueva sesión». Fecha y servicio se rellenan solos." />
      ) : (
        <ol className="space-y-3">
          {sessions.map((s) =>
            editingId === s.id ? (
              <li key={s.id}>{formEl}</li>
            ) : (
              <li key={s.id} className={card}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[0.7rem] text-[oklch(0.52_0.08_148)] font-body uppercase tracking-wider">{formatDay(s.sessionDate)}</p>
                    <p className="text-sm text-[oklch(0.18_0.018_55)] font-body" style={{ fontWeight: 500 }}>
                      {s.serviceName ?? "Sesión"}{s.durationMinutes ? ` · ${s.durationMinutes} min` : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const f: FormState = {
                        date: dateInputValue(s.sessionDate),
                        serviceId: s.serviceId ? String(s.serviceId) : "",
                        durationMinutes: s.durationMinutes ? String(s.durationMinutes) : "",
                        practicalNotes: s.practicalNotes ?? "",
                        clientPreferences: s.clientPreferences ?? "",
                        pendingNext: s.pendingNext ?? "",
                      };
                      if (!confirmDiscard(dirty)) return;
                      setForm(f);
                      setInitial(f);
                      setEditingId(s.id);
                    }}
                    className="p-2 text-[oklch(0.52_0.02_60)] hover:text-[oklch(0.52_0.08_148)]"
                    aria-label="Editar sesión"
                  >
                    <Pencil size={14} />
                  </button>
                </div>
                {[
                  ["Observaciones", s.practicalNotes],
                  ["Preferencias del cliente", s.clientPreferences],
                  ["Pendiente para la próxima", s.pendingNext],
                  ["Protocolos (anterior)", s.protocols],
                  ["Productos recomendados (anterior)", s.recommendedProducts],
                  ["Suplementos (anterior)", s.supplements],
                ]
                  .filter(([, v]) => v)
                  .map(([t, v]) => (
                    <div key={t} className="mt-3">
                      <p className="text-[0.65rem] text-[oklch(0.52_0.02_60)] font-body uppercase tracking-wider" style={{ fontWeight: 500 }}>{t}</p>
                      <p className="text-sm text-[oklch(0.28_0.025_55)] font-body whitespace-pre-line" style={{ fontWeight: 300 }}>{v}</p>
                    </div>
                  ))}
                {s.editedAt && (
                  <p className="text-[0.65rem] text-[oklch(0.62_0.01_60)] font-body mt-3">
                    Editada el {new Date(s.editedAt).toLocaleString("es-ES", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}
              </li>
            ),
          )}
        </ol>
      )}
    </div>
  );
}
