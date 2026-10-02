/**
 * /politica-de-cookies — qué cookies y almacenamiento usa la web y cómo gestionarlos.
 * Texto descriptivo del funcionamiento real del sitio (BORRADOR: pendiente de revisión legal y de que Cristina
 * complete los datos del titular si procede).
 */
import Layout from "@/components/Layout";
import { OPEN_COOKIE_SETTINGS_EVENT } from "@/lib/consent";

const ROWS: Array<{ name: string; type: string; purpose: string; duration: string; consent: string }> = [
  { name: "Sesión de acceso privado", type: "Técnica (propia)", purpose: "Mantener la sesión de Cristina en el área privada (CRM). Los visitantes no la reciben.", duration: "Sesión / hasta cerrar sesión", consent: "No requiere" },
  { name: "cvc_consent_v1", type: "Técnica (propia, localStorage)", purpose: "Recordar tus preferencias de cookies.", duration: "Hasta que la borres", consent: "No requiere" },
  { name: "Lista «Mi consulta»", type: "Técnica (propia, localStorage)", purpose: "Recordar los aceites que añades a tu consulta personalizada.", duration: "Hasta que la borres", consent: "No requiere" },
  { name: "Google Analytics", type: "Analítica (terceros)", purpose: "Medir de forma agregada cómo se usa la web (páginas vistas y solicitudes de reserva enviadas). Solo se activa si la aceptas.", duration: "Hasta 2 años (según Google)", consent: "Sí" },
  { name: "Google Ads", type: "Publicidad (terceros)", purpose: "Medir si un anuncio de Google lleva a una solicitud de reserva. No se usa para mostrarte anuncios personalizados. Solo se activa si la aceptas.", duration: "Hasta 90 días (según Google)", consent: "Sí" },
];

export default function PoliticaCookies() {
  return (
    <Layout>
      <section className="pt-28 pb-16 bg-white">
        <div className="container max-w-3xl">
          <h1 className="font-display text-[oklch(0.18_0.018_55)] mb-6" style={{ fontWeight: 400, fontSize: "2rem" }}>
            Política de cookies
          </h1>
          <div className="space-y-5 text-[oklch(0.35_0.02_55)] font-body text-sm leading-relaxed" style={{ fontWeight: 300 }}>
            <p>
              Esta web (BION — Cristina Vive Consciente) usa únicamente las cookies y el almacenamiento local que se
              describen a continuación. Las técnicas son imprescindibles y no necesitan tu consentimiento; las de
              analítica y publicidad solo se activan si las aceptas, y puedes cambiar de opinión en cualquier momento.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-[oklch(0.90_0.01_80)]">
                <thead className="bg-[oklch(0.97_0.006_85)]">
                  <tr>
                    {["Nombre", "Tipo", "Para qué", "Duración", "Consentimiento"].map((h) => (
                      <th key={h} className="p-2.5 font-medium text-[oklch(0.30_0.02_55)]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((r) => (
                    <tr key={r.name} className="border-t border-[oklch(0.92_0.01_80)] align-top">
                      <td className="p-2.5">{r.name}</td>
                      <td className="p-2.5">{r.type}</td>
                      <td className="p-2.5">{r.purpose}</td>
                      <td className="p-2.5">{r.duration}</td>
                      <td className="p-2.5">{r.consent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h2 className="font-display text-[oklch(0.18_0.018_55)] pt-2" style={{ fontWeight: 400, fontSize: "1.2rem" }}>Qué datos se miden y cuáles no</h2>
            <p>
              Si activas la medición, solo se registran eventos como «solicitud de reserva enviada» junto con el servicio
              elegido. Nunca se envían a Google tu nombre, correo, teléfono, el texto que escribas ni datos de salud.
            </p>

            <h2 className="font-display text-[oklch(0.18_0.018_55)] pt-2" style={{ fontWeight: 400, fontSize: "1.2rem" }}>Cómo gestionar tus preferencias</h2>
            <p>
              Puedes aceptar, rechazar o elegir categorías en el aviso de cookies, y reabrirlo cuando quieras:{" "}
              <button
                onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT))}
                className="underline text-[oklch(0.40_0.07_148)]"
              >
                Gestionar cookies
              </button>
              . También puedes borrar los datos del sitio desde la configuración de tu navegador.
            </p>

            <h2 className="font-display text-[oklch(0.18_0.018_55)] pt-2" style={{ fontWeight: 400, fontSize: "1.2rem" }}>Contacto</h2>
            <p>
              Para cualquier duda sobre cookies o tus datos puedes escribir desde la página de{" "}
              <a href="/contacto" className="underline text-[oklch(0.40_0.07_148)]">contacto</a>.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
