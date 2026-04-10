/**
 * SeleccionarSlot — Página pública para que el cliente elija fecha
 * Ruta: /cita/seleccionar/:token
 */

import { useState } from "react";
import { useParams } from "wouter";
import { Leaf, CheckCircle2, Loader2, CalendarDays, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/logo-bion-original_f6b56924.avif";

function formatSlot(slot: { date: string; time: string }) {
  const dt = new Date(`${slot.date}T${slot.time}:00`);
  const dateStr = dt.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return { dateStr, time: slot.time };
}

export default function SeleccionarSlot() {
  const { token } = useParams<{ token: string }>();
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const { data, isLoading, error } = trpc.bookings.getSlots.useQuery({ token });

  const selectMutation = trpc.bookings.selectSlot.useMutation({
    onSuccess: () => setConfirmed(true),
    onError: (e) => toast.error(e.message),
  });

  const handleConfirm = () => {
    if (selected === null) {
      toast.error("Por favor, selecciona una fecha");
      return;
    }
    selectMutation.mutate({ token, slotIndex: selected });
  };

  return (
    <div className="min-h-screen bg-[oklch(0.985_0.006_85)] flex flex-col items-center py-12 px-4">
      {/* Logo */}
      <div className="mb-10">
        <a href="/">
          <img src={LOGO_URL} alt="BION" className="h-12 object-contain" />
        </a>
      </div>

      <div className="w-full max-w-lg bg-white border border-[oklch(0.92_0.01_80)]">
        {/* Header */}
        <div className="flex items-center gap-3 px-7 py-5 border-b border-[oklch(0.92_0.01_80)]">
          <Leaf size={16} className="text-[oklch(0.52_0.08_148)]" />
          <h1 className="font-display text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 400, fontSize: "1.1rem" }}>
            Selecciona tu fecha
          </h1>
        </div>

        <div className="px-7 py-8">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-[oklch(0.52_0.08_148)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error || !data ? (
            <div className="text-center py-12">
              <CalendarDays size={36} className="mx-auto text-[oklch(0.88_0.015_75)] mb-4" />
              <p className="text-sm text-[oklch(0.52_0.02_60)] font-body" style={{ fontWeight: 300 }}>
                Este enlace no es válido o ha expirado.
              </p>
              <a
                href="/"
                className="inline-block mt-4 text-[oklch(0.52_0.08_148)] text-xs font-body hover:underline"
              >
                Volver al inicio
              </a>
            </div>
          ) : data.status !== "rescheduled" ? (
            <div className="text-center py-12">
              <CheckCircle2 size={36} className="mx-auto text-[oklch(0.52_0.08_148)] mb-4" />
              <p className="text-sm text-[oklch(0.52_0.02_60)] font-body" style={{ fontWeight: 300 }}>
                Esta cita ya ha sido procesada.
              </p>
            </div>
          ) : confirmed ? (
            <div className="text-center py-8">
              <CheckCircle2 size={48} className="mx-auto text-[oklch(0.52_0.08_148)] mb-5" />
              <h2
                className="font-display text-[oklch(0.18_0.018_55)] mb-3"
                style={{ fontWeight: 400, fontSize: "1.25rem" }}
              >
                ¡Fecha seleccionada!
              </h2>
              <p className="text-sm text-[oklch(0.52_0.02_60)] font-body leading-relaxed" style={{ fontWeight: 300 }}>
                Hemos recibido tu elección. Cristina te confirmará la cita en breve.
              </p>
              <a
                href="/"
                className="inline-block mt-6 px-6 py-3 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-body hover:bg-[oklch(0.38_0.07_148)] transition-colors no-underline"
                style={{ letterSpacing: "0.1em" }}
              >
                Volver al inicio
              </a>
            </div>
          ) : (
            <>
              <p className="text-sm text-[oklch(0.52_0.02_60)] font-body mb-2" style={{ fontWeight: 300 }}>
                Hola, <strong style={{ fontWeight: 500 }}>{data.clientFirstName}</strong>
              </p>
              <p className="text-sm text-[oklch(0.52_0.02_60)] font-body mb-6 leading-relaxed" style={{ fontWeight: 300 }}>
                Para tu consulta de <strong style={{ fontWeight: 500 }}>{data.serviceLabel}</strong>, elige la fecha que mejor te venga:
              </p>

              <div className="space-y-3 mb-8">
                {data.slots.map((slot, i) => {
                  const { dateStr, time } = formatSlot(slot);
                  const isSelected = selected === i;
                  return (
                    <button
                      key={i}
                      onClick={() => setSelected(i)}
                      className={`w-full flex items-start gap-4 px-5 py-4 border text-left transition-all duration-200 ${
                        isSelected
                          ? "border-[oklch(0.52_0.08_148)] bg-[oklch(0.52_0.08_148)]/5"
                          : "border-[oklch(0.92_0.01_80)] bg-white hover:border-[oklch(0.72_0.04_148)]"
                      }`}
                      style={{ borderRadius: 0 }}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 transition-colors ${
                          isSelected
                            ? "border-[oklch(0.52_0.08_148)] bg-[oklch(0.52_0.08_148)]"
                            : "border-[oklch(0.72_0.02_60)]"
                        }`}
                      />
                      <div>
                        <p
                          className="text-sm text-[oklch(0.18_0.018_55)] font-body capitalize"
                          style={{ fontWeight: isSelected ? 500 : 400 }}
                        >
                          {dateStr}
                        </p>
                        <p className="text-xs text-[oklch(0.52_0.02_60)] font-body flex items-center gap-1 mt-0.5" style={{ fontWeight: 300 }}>
                          <Clock size={10} /> {time}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleConfirm}
                disabled={selected === null || selectMutation.isPending}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[oklch(0.52_0.08_148)] text-white text-xs tracking-widest uppercase font-body hover:bg-[oklch(0.38_0.07_148)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ letterSpacing: "0.1em" }}
              >
                {selectMutation.isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Confirmando...
                  </>
                ) : (
                  "Confirmar mi fecha"
                )}
              </button>

              <p className="text-center text-[oklch(0.72_0.02_60)] text-[0.65rem] mt-3 font-body" style={{ fontWeight: 300 }}>
                Cristina revisará tu elección y te enviará la confirmación final.
              </p>
            </>
          )}
        </div>
      </div>

      <p className="mt-8 text-[0.65rem] text-[oklch(0.72_0.02_60)] font-body text-center" style={{ fontWeight: 300 }}>
        BION — Cristina Vive Consciente · hola@cristinaviveconsciente.es
      </p>
    </div>
  );
}
