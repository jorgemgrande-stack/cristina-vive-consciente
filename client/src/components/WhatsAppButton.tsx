/**
 * WhatsAppButton — Botón flotante sticky para contacto directo con Cristina
 * Diseño: paleta "Luz Botánica" (verde suave, beige, marrón tierra)
 * Posición: esquina inferior derecha, fijo con el scroll
 */

import { useState } from "react";
import { X, MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "34657165343";
const WHATSAPP_MESSAGE = encodeURIComponent(
  "Hola Cristina, me gustaría obtener más información sobre tus servicios de bienestar. 🌿"
);
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;

export default function WhatsAppButton() {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2"
      style={{ filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.18))" }}
    >
      {/* Tooltip / burbuja de mensaje */}
      <div
        className={`
          transition-all duration-300 origin-bottom-right
          ${tooltipVisible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-1 pointer-events-none"}
        `}
      >
        <div className="relative bg-[oklch(0.97_0.03_85)] border border-[oklch(0.88_0.04_85)] rounded-2xl rounded-br-sm px-4 py-3 max-w-[220px] shadow-lg">
          {/* Botón cerrar tooltip */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setTooltipVisible(false);
              setDismissed(true);
            }}
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[oklch(0.75_0.06_60)] text-white flex items-center justify-center hover:bg-[oklch(0.65_0.06_60)] transition-colors"
            aria-label="Cerrar"
          >
            <X size={10} strokeWidth={2.5} />
          </button>

          {/* Contenido del tooltip */}
          <p className="text-xs font-semibold text-[oklch(0.35_0.06_60)] mb-0.5">
            ¡Hola! Soy Cristina 🌿
          </p>
          <p className="text-xs text-[oklch(0.45_0.04_60)] leading-relaxed">
            ¿Tienes alguna pregunta? Escríbeme por WhatsApp y te respondo encantada.
          </p>

          {/* Flecha del tooltip apuntando al botón */}
          <div
            className="absolute -bottom-2 right-5 w-4 h-2 overflow-hidden"
            aria-hidden
          >
            <div className="w-3 h-3 bg-[oklch(0.97_0.03_85)] border-r border-b border-[oklch(0.88_0.04_85)] rotate-45 translate-x-0.5 -translate-y-1.5" />
          </div>
        </div>
      </div>

      {/* Botón principal */}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setTooltipVisible(true)}
        onMouseLeave={() => setTooltipVisible(false)}
        onFocus={() => setTooltipVisible(true)}
        onBlur={() => setTooltipVisible(false)}
        aria-label="Contactar con Cristina por WhatsApp"
        className="
          group relative flex items-center justify-center
          w-14 h-14 rounded-full
          bg-[oklch(0.52_0.10_148)] hover:bg-[oklch(0.45_0.10_148)]
          text-white
          transition-all duration-300
          hover:scale-110 active:scale-95
          focus:outline-none focus:ring-2 focus:ring-[oklch(0.52_0.10_148)] focus:ring-offset-2
        "
        style={{
          boxShadow: "0 4px 20px oklch(0.52 0.10 148 / 0.45), 0 2px 8px oklch(0 0 0 / 0.15)",
        }}
      >
        {/* Icono SVG de WhatsApp */}
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-7 h-7"
          aria-hidden="true"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>

        {/* Pulso animado */}
        <span
          className="absolute inset-0 rounded-full bg-[oklch(0.52_0.10_148)] animate-ping opacity-20"
          aria-hidden="true"
        />
      </a>
    </div>
  );
}
