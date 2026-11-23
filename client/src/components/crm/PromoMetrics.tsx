/**
 * Métricas de una promoción (CRM). Se reutiliza en la lista y en la ficha de cada campaña.
 * Compartir se muestra como ACCIONES observadas (apertura de WhatsApp, enlace copiado…), no como publicaciones o envíos
 * confirmados, salvo donde la plataforma lo confirma (menú de compartir del móvil).
 */
import type { PromoStats } from "@shared/promo";

export const CHANNEL_LABEL: Record<string, string> = {
  red_facebook: "Facebook",
  red_x: "X",
  red_nativo: "Menú de compartir del móvil",
  amigo_whatsapp: "WhatsApp",
  amigo_enlace: "Copia de enlace",
};
const label = (c: string) => CHANNEL_LABEL[c] ?? c;

function Tile({ n, title, hint, accent }: { n: number; title: string; hint?: string; accent?: boolean }) {
  return (
    <div className="bg-gray-50 rounded p-3" title={hint}>
      <p className={`text-xl font-semibold ${accent ? "text-[oklch(0.42_0.08_148)]" : "text-gray-900"}`}>{n}</p>
      <p className="text-[0.7rem] text-gray-500 leading-tight mt-0.5">{title}</p>
    </div>
  );
}

function Breakdown({ title, note, data, confirmable }: { title: string; note: string; data: PromoStats["networks"]; confirmable?: boolean }) {
  const entries = Object.entries(data).sort((a, b) => b[1].count - a[1].count);
  const total = entries.reduce((a, [, v]) => a + v.count, 0);
  return (
    <div className="bg-gray-50 rounded p-3">
      <p className="text-sm font-medium text-gray-900">{title}: <span className="text-[oklch(0.42_0.08_148)]">{total}</span></p>
      <p className="text-[0.65rem] text-gray-500 mb-1">{note}</p>
      {entries.length === 0 ? (
        <p className="text-xs text-gray-400">Sin acciones todavía</p>
      ) : (
        <ul className="text-xs text-gray-700 space-y-0.5">
          {entries.map(([c, v]) => (
            <li key={c}>{label(c)}: {v.count}{confirmable && v.confirmed > 0 ? ` (${v.confirmed} confirmadas por la plataforma)` : ""}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function PromoMetrics({ stats }: { stats: PromoStats }) {
  const shared = Object.entries(stats.bySource).filter(([s]) => s.startsWith("red_") || s.startsWith("amigo_")).sort((a, b) => b[1].views - a[1].views);
  const others = Object.entries(stats.bySource).filter(([s]) => !(s.startsWith("red_") || s.startsWith("amigo_"))).sort((a, b) => b[1].views - a[1].views);
  return (
    <div className="space-y-3" data-testid="promo-metrics">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Tile n={stats.views} title="Visitas a la ficha" hint="Aperturas de la página pública de la promoción" />
        <Tile n={stats.downloads} title="Descargas totales" hint="Entregas válidas del PDF, incluidas las repetidas de un mismo cliente" accent />
        <Tile n={stats.uniqueClients} title={`Clientes únicos que descargaron${stats.downloadsInReview ? ` (+${stats.downloadsInReview} descargas en revisión)` : ""}`} hint="Una vez por ficha del CRM y promoción; las descargas en revisión se suman al vincularlas a una ficha" accent />
        <Tile n={stats.registrations} title={`Formularios completados${stats.review ? ` (${stats.review} por revisar)` : ""}`} />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <Breakdown title="Acciones de compartir en redes" note="Acciones observadas por canal; no son publicaciones confirmadas." data={stats.networks} confirmable />
        <Breakdown title="Acciones de enviar a un amigo" note="Apertura de WhatsApp y enlace copiado (acciones observadas, no mensajes confirmados)." data={stats.friends} />
      </div>
      <div className="bg-gray-50 rounded p-3">
        <p className="text-sm font-medium text-gray-900 mb-1">Visitas y descargas desde enlaces compartidos</p>
        {shared.length === 0 ? (
          <p className="text-xs text-gray-400">Todavía ninguna visita llegó por un enlace compartido.</p>
        ) : (
          <ul className="text-xs text-gray-700 space-y-0.5">
            {shared.map(([s, v]) => (
              <li key={s}>{label(s)}: {v.views} visitas · {v.downloads} descargas</li>
            ))}
          </ul>
        )}
        {others.length > 0 && (
          <p className="text-[0.7rem] text-gray-500 mt-2">Otros orígenes: {others.map(([s, v]) => `${s} (${v.views} visitas, ${v.downloads} descargas)`).join(" · ")}</p>
        )}
      </div>
    </div>
  );
}
