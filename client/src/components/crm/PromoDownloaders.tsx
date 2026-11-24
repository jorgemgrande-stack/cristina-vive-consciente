/**
 * Informe desplegable de una promoción: las personas que descargaron la publicación, con su ficha del CRM,
 * canal de origen, número de descargas válidas y fechas. Se carga solo al desplegarlo.
 */
import { useState } from "react";
import { Link } from "wouter";
import { ChevronDown, ChevronUp, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { CHANNEL_LABEL } from "./PromoMetrics";

const fmt = (ms: number) =>
  new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(ms));
const sourceLabel = (s: string) => CHANNEL_LABEL[s] ?? s;

export default function PromoDownloaders({ promoId, total }: { promoId: number; total?: number }) {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = trpc.promosAdmin.downloaders.useQuery({ promoId }, { enabled: open });
  return (
    <div className="border border-gray-100 rounded" data-testid="promo-downloaders">
      <button type="button" onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-50" aria-expanded={open}>
        <span className="inline-flex items-center gap-2"><Users size={15} /> Informe: personas que descargaron{total != null ? ` (${total} descargas)` : ""}</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && (
        <div className="px-3 pb-3 overflow-x-auto">
          {isLoading ? (
            <p className="text-xs text-gray-400 py-3">Cargando…</p>
          ) : !data || data.people.length === 0 ? (
            <p className="text-xs text-gray-500 py-3">Todavía nadie ha completado el formulario y descargado el cuento.</p>
          ) : (
            <>
              <table className="w-full text-xs text-left mt-1">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-100">
                    <th className="py-1.5 pr-3 font-medium">Persona</th>
                    <th className="py-1.5 pr-3 font-medium">Correo</th>
                    <th className="py-1.5 pr-3 font-medium">Teléfono</th>
                    <th className="py-1.5 pr-3 font-medium">Llegó por</th>
                    <th className="py-1.5 pr-3 font-medium text-right">Descargas</th>
                    <th className="py-1.5 pr-3 font-medium">Primera</th>
                    <th className="py-1.5 font-medium">Última</th>
                  </tr>
                </thead>
                <tbody>
                  {data.people.map((p) => (
                    <tr key={p.clientId ?? p.emails[0]} className="border-b border-gray-50 align-top" data-testid="promo-downloader-row">
                      <td className="py-1.5 pr-3 text-gray-900">
                        {p.clientId != null ? (
                          <Link href={`/crm/clientes/${p.clientId}`} className="text-[oklch(0.42_0.08_148)] hover:underline">{p.name}</Link>
                        ) : (
                          <>{p.name} <span className="text-amber-700">(por revisar)</span></>
                        )}
                      </td>
                      <td className="py-1.5 pr-3 text-gray-700 break-all">{p.emails.join(", ")}</td>
                      <td className="py-1.5 pr-3 text-gray-700 whitespace-nowrap">{p.phone}</td>
                      <td className="py-1.5 pr-3 text-gray-700">{p.sources.map(sourceLabel).join(", ")}</td>
                      <td className="py-1.5 pr-3 text-right text-gray-900">{p.downloads}</td>
                      <td className="py-1.5 pr-3 text-gray-700 whitespace-nowrap">{fmt(p.firstAt)}</td>
                      <td className="py-1.5 text-gray-700 whitespace-nowrap">{fmt(p.lastAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[0.65rem] text-gray-500 mt-2">
                {data.people.length} {data.people.length === 1 ? "persona" : "personas"}. Cada una queda además en Clientes con la categoría «Recursos gratuitos» y el recurso de la descarga.
                {data.registeredWithoutDownload > 0 ? ` ${data.registeredWithoutDownload} formularios completados no llegaron a registrar descarga.` : ""}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
