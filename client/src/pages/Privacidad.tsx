/**
 * /privacidad — información sobre el tratamiento de datos personales (art. 13 RGPD), por capas.
 * Describe el funcionamiento real de la web y del CRM (inventario en docs/privacidad/REGISTRO_ACTIVIDADES.md).
 * BORRADOR publicado con los datos que faltan marcados como «pendiente»: no es asesoramiento ni certificación.
 */
import type { ReactNode } from "react";
import { Link } from "wouter";
import Layout from "@/components/Layout";
import { CONSENT_TEXTS, RETENTION_REVIEW_MONTHS } from "@shared/clientCare";

const CONTACT_EMAIL = "info@cristinaviveconsciente.es";
const UPDATED = "25 de octubre de 2026";

/** Dato que falta: se muestra marcado para que no pase por un dato real. */
function Pendiente({ children }: { children: ReactNode }) {
  return <span className="bg-amber-50 text-amber-900 px-1">[Pendiente: {children}]</span>;
}

function H2({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-display text-[oklch(0.18_0.018_55)] pt-4" style={{ fontWeight: 400, fontSize: "1.35rem" }}>
      {children}
    </h2>
  );
}

const TREATMENTS: Array<{ title: string; data: string; purpose: string; basis: ReactNode }> = [
  {
    title: "Solicitudes de cita",
    data: "Nombre, apellidos, email, teléfono, servicio, fecha y hora preferidas, modalidad y el mensaje que quieras añadir.",
    purpose: "Gestionar tu solicitud, confirmarla, cancelarla o proponerte otras fechas.",
    basis: "Aplicación de medidas precontractuales y ejecución del servicio que solicitas (art. 6.1.b RGPD).",
  },
  {
    title: "Formulario de contacto y suscripción a la comunidad",
    data: "Nombre, email y, si los indicas, apellidos, teléfono, tema de interés y mensaje.",
    purpose:
      "Responderte. Además, recibirás un email de bienvenida y, a los 3 y 7 días, dos emails con contenidos y recomendaciones (guías, productos y consultas). Puedes darte de baja respondiendo «Baja» o escribiendo al email de contacto.",
    basis: <>Tu consentimiento (art. 6.1.a RGPD). <Pendiente>confirmar la base de los emails de seguimiento</Pendiente></>,
  },
  {
    title: "Consultas sobre sistemas de agua",
    data: "Nombre, apellidos, teléfono, email, provincia, localidad, tipo de vivienda, observaciones y el sistema que te interesa.",
    purpose: "Responder a tu consulta.",
    basis: "Tu consentimiento y las medidas precontractuales que solicitas (art. 6.1.a y 6.1.b RGPD).",
  },
  {
    title: "«Mi consulta» de aceites esenciales",
    data: "Nombre, apellidos, email, teléfono y provincia (opcionales), objetivos, experiencia previa y productos seleccionados.",
    purpose:
      "Preparar la respuesta a tu consulta. Si en los objetivos mencionas aspectos de salud, solo se usan para responder a esa consulta.",
    basis: "Tu consentimiento (art. 6.1.a RGPD y, para datos de salud que decidas incluir, art. 9.2.a RGPD).",
  },
  {
    title: "Pedidos de guías digitales",
    data: "Nombre, email y teléfono (opcional), producto, importe y estado del pedido.",
    purpose: "Gestionar el pedido, comprobar el pago por Bizum y enviarte el enlace de descarga.",
    basis: "Ejecución del contrato (art. 6.1.b RGPD) y obligaciones legales de facturación (art. 6.1.c RGPD).",
  },
  {
    title: "Comentarios del blog",
    data: "El nombre que indiques y el comentario.",
    purpose: "Moderar y, si se aprueba, publicar el comentario con ese nombre.",
    basis: "Tu consentimiento al enviarlo (art. 6.1.a RGPD).",
  },
  {
    title: "Ficha de cliente",
    data: "Datos de contacto, citas, sesiones (notas prácticas, servicio, duración, preferencias), notas de gestión y facturas.",
    purpose: "Prestarte los servicios contratados, organizarlos y facturarlos.",
    basis: "Ejecución del contrato (art. 6.1.b RGPD) y obligaciones legales (art. 6.1.c RGPD).",
  },
];

export default function Privacidad() {
  return (
    <Layout>
      <section className="pt-28 pb-16 bg-white">
        <div className="container max-w-3xl">
          <h1 className="font-display text-[oklch(0.18_0.018_55)] mb-2" style={{ fontWeight: 400, fontSize: "2rem" }}>
            Política de privacidad
          </h1>
          <p className="text-xs text-[oklch(0.52_0.02_60)] font-body mb-6">Última actualización: {UPDATED}</p>

          <div className="space-y-5 text-[oklch(0.35_0.02_55)] font-body text-sm leading-relaxed" style={{ fontWeight: 300 }}>
            <p>
              Aquí te explicamos qué datos personales se tratan en esta web y en las sesiones con Cristina, para qué, con qué
              base, con quién se comparten, cuánto tiempo se guardan y cómo ejercer tus derechos. Algunos datos todavía están
              pendientes de completar y aparecen marcados como tales.
            </p>

            <H2>1. Responsable</H2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Responsable: Cristina Battistelli (Cristina Vive Consciente · BION).</li>
              <li>NIF: <Pendiente>NIF del responsable</Pendiente></li>
              <li>Domicilio: <Pendiente>dirección postal del responsable</Pendiente></li>
              <li>
                Contacto para privacidad: <a href={`mailto:${CONTACT_EMAIL}`} className="text-[oklch(0.52_0.08_148)] underline">{CONTACT_EMAIL}</a>
              </li>
            </ul>

            <H2>2. Qué datos tratamos y para qué</H2>
            <div className="space-y-4">
              {TREATMENTS.map((t) => (
                <div key={t.title} className="border-l-2 border-[oklch(0.52_0.08_148)]/30 pl-3">
                  <p className="text-[oklch(0.18_0.018_55)]" style={{ fontWeight: 500 }}>{t.title}</p>
                  <p><span style={{ fontWeight: 500 }}>Datos:</span> {t.data}</p>
                  <p><span style={{ fontWeight: 500 }}>Para qué:</span> {t.purpose}</p>
                  <p><span style={{ fontWeight: 500 }}>Base:</span> {t.basis}</p>
                </div>
              ))}
            </div>

            <H2>3. Primera visita y Acompañamiento emocional</H2>
            <p>
              Si tú lo decides, Cristina puede anotar en tu ficha información sobre tu salud y bienestar (Primera visita) y
              sobre el acompañamiento emocional (lo que relatas, sus observaciones y los objetivos de seguimiento). Son dos
              apartados separados, cada uno con su propio consentimiento:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><span style={{ fontWeight: 500 }}>Finalidad:</span> preparar tus sesiones, darles seguimiento y conocer las preferencias que quieras compartir.</li>
              <li>
                <span style={{ fontWeight: 500 }}>Sin diagnósticos:</span> Cristina no es profesional sanitaria; estas notas no son
                diagnósticos ni sustituyen la atención médica o psicológica.
              </li>
              <li>
                <span style={{ fontWeight: 500 }}>Base:</span> tu consentimiento explícito para cada apartado (art. 9.2.a RGPD). Es
                voluntario: solo se anota lo que decidas contar, y aceptar el acompañamiento emocional no es condición para
                reservar ni recibir ningún servicio.
              </li>
              <li>
                <span style={{ fontWeight: 500 }}>Registro:</span> se guarda la fecha, la versión del texto que aceptaste (
                {CONSENT_TEXTS.first_visit.version} y {CONSENT_TEXTS.emotional.version}) y la forma en que lo diste.
              </li>
              <li>
                <span style={{ fontWeight: 500 }}>Protección:</span> se guarda cifrado, solo accede Cristina con su usuario, y
                cada acceso queda registrado sin el contenido. No se usa para publicidad, analítica ni herramientas de
                inteligencia artificial, ni se envía por email o WhatsApp.
              </li>
              <li>
                <span style={{ fontWeight: 500 }}>Retirada:</span> puedes retirar cada consentimiento cuando quieras escribiendo a{" "}
                {CONTACT_EMAIL} o diciéndoselo a Cristina; al retirarlo se suprimen los datos de ese apartado, salvo que una ley
                obligue a conservarlos.
              </li>
              <li>
                <span style={{ fontWeight: 500 }}>Revisión:</span> cada {RETENTION_REVIEW_MONTHS} meses se revisa si siguen siendo
                necesarios; si no, se eliminan.
              </li>
            </ul>

            <H2>4. Con quién se comparten</H2>
            <p>No vendemos ni cedemos tus datos. Para que la web funcione intervienen estos proveedores:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <span style={{ fontWeight: 500 }}>Railway</span> (alojamiento de la web y de la base de datos). Los servidores están
                en Estados Unidos. <Pendiente>datos de la entidad, contrato de encargado del tratamiento y garantías de la
                transferencia internacional (Marco de Privacidad UE-EE. UU. o cláusulas contractuales tipo)</Pendiente>
              </li>
              <li>
                <span style={{ fontWeight: 500 }}>Brevo</span> (envío de los emails de la web: confirmaciones de cita, pedidos y
                contacto). <Pendiente>datos de la entidad y contrato de encargado del tratamiento</Pendiente>
              </li>
              <li>
                <span style={{ fontWeight: 500 }}>CallMeBot</span> (aviso por WhatsApp a Cristina de nuevas solicitudes de cita y
                pedidos): solo recibe el servicio, el día y la hora, o la referencia, el producto y el importe del pedido; nunca tu nombre,
                teléfono, email ni mensaje. <Pendiente>datos de la entidad y condiciones del servicio</Pendiente>
              </li>
              <li>
                <span style={{ fontWeight: 500 }}>Google</span>: Google Analytics y Google Ads solo si aceptas esas cookies (ver la{" "}
                <Link href="/politica-de-cookies" className="text-[oklch(0.52_0.08_148)] underline">política de cookies</Link>); nunca
                se les envía tu nombre, email, teléfono ni lo que escribes. Las tipografías de la web se cargan desde Google Fonts,
                que recibe la dirección IP de tu navegador.
              </li>
              <li>Pagos por Bizum: se hacen desde tu banco, fuera de esta web.</li>
              <li>Administraciones públicas, cuando exista una obligación legal (por ejemplo, fiscal).</li>
            </ul>

            <H2>5. Cuánto tiempo se guardan</H2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Primera visita y Acompañamiento: mientras mantengas el consentimiento y sean necesarios, con revisión cada {RETENTION_REVIEW_MONTHS} meses.</li>
              <li>Solicitudes, consultas, ficha de cliente y comentarios: mientras sean necesarios para la finalidad. <Pendiente>plazos concretos</Pendiente></li>
              <li>Facturas y datos de pedidos: durante los plazos que exija la normativa fiscal y mercantil. <Pendiente>plazos concretos</Pendiente></li>
            </ul>
            <p>Después se suprimen o se bloquean durante el tiempo en que pudieran exigirse responsabilidades (art. 32 LOPDGDD).</p>

            <H2>6. Tus derechos</H2>
            <p>
              Puedes pedir el acceso a tus datos, su rectificación o supresión, la limitación u oposición a su tratamiento y su
              portabilidad, y retirar en cualquier momento los consentimientos que hayas dado, sin que afecte a lo tratado
              antes. Escribe a <a href={`mailto:${CONTACT_EMAIL}`} className="text-[oklch(0.52_0.08_148)] underline">{CONTACT_EMAIL}</a>.
              Respondemos en un mes como máximo.
            </p>
            <p>
              Si consideras que no se han atendido bien tus derechos, puedes reclamar ante la Agencia Española de Protección de
              Datos (<a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="text-[oklch(0.52_0.08_148)] underline">www.aepd.es</a>).
            </p>

            <H2>7. Seguridad</H2>
            <p>
              El acceso a la gestión de clientes requiere usuario y contraseña, los datos de Primera visita y Acompañamiento se
              guardan cifrados y los accesos quedan registrados. Ningún sistema es infalible; si ocurriera un incidente que
              afecte a tus datos, actuaremos según la normativa.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
