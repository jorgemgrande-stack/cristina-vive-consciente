/**
 * Textos legales (privacidad y cookies) como contenido editable. Reproducen el texto actual de las páginas en código
 * (borrador publicado el 25/10/2026, pendiente de revisión legal): los datos que faltan van marcados con «[Pendiente: …]»
 * (etiqueta <mark>) para que Cristina los complete con información confirmada y el editor avise antes de publicar.
 *
 * Los textos de consentimiento de la ficha de cliente (CONSENT_TEXTS) NO viven aquí: siguen versionados en
 * shared/clientCare.ts y su registro por cliente no cambia.
 */
import { CONSENT_TEXTS, RETENTION_REVIEW_MONTHS } from "../shared/clientCare";

const CONTACT_EMAIL = "info@cristinaviveconsciente.es";
const P = (t: string) => `<mark>[Pendiente: ${t}]</mark>`;
const mail = `<a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>`;

const TREATMENTS: Array<{ title: string; data: string; purpose: string; basis: string }> = [
  { title: "Solicitudes de cita", data: "Nombre, apellidos, email, teléfono, servicio, fecha y hora preferidas, modalidad y, si quieres, un mensaje breve con información práctica (no se piden datos de salud).", purpose: "Gestionar tu solicitud, confirmarla, cancelarla o proponerte otras fechas.", basis: "Aplicación de medidas precontractuales y ejecución del servicio que solicitas (art. 6.1.b RGPD)." },
  { title: "Formulario de contacto y suscripción a la comunidad", data: "Nombre, email y, si los indicas, apellidos, teléfono, tema de interés y mensaje.", purpose: "Responderte. Además, recibirás un email de bienvenida y, a los 3 y 7 días, dos emails con contenidos y recomendaciones (guías, productos y consultas). Puedes darte de baja respondiendo «Baja» o escribiendo al email de contacto.", basis: `Tu consentimiento (art. 6.1.a RGPD). ${P("confirmar la base de los emails de seguimiento")}` },
  { title: "Consultas sobre sistemas de agua", data: "Nombre, apellidos, teléfono, email, provincia, localidad, tipo de vivienda, observaciones y el sistema que te interesa.", purpose: "Responder a tu consulta.", basis: "Tu consentimiento y las medidas precontractuales que solicitas (art. 6.1.a y 6.1.b RGPD)." },
  { title: "«Mi consulta» de aceites esenciales", data: "Nombre, apellidos, email, teléfono y provincia (estos dos, opcionales), los usos que te interesan y tu experiencia con aceites (opciones cerradas) y los productos seleccionados. No se piden datos de salud.", purpose: "Preparar la respuesta a tu consulta.", basis: "Tu consentimiento (art. 6.1.a RGPD)." },
  { title: "Pedidos de guías digitales", data: "Nombre, email y teléfono (opcional), producto, importe y estado del pedido.", purpose: "Gestionar el pedido, comprobar el pago por Bizum y enviarte el enlace de descarga.", basis: "Ejecución del contrato (art. 6.1.b RGPD) y obligaciones legales de facturación (art. 6.1.c RGPD)." },
  { title: "Comentarios del blog", data: "El nombre que indiques y el comentario.", purpose: "Moderar y, si se aprueba, publicar el comentario con ese nombre.", basis: "Tu consentimiento al enviarlo (art. 6.1.a RGPD)." },
  { title: "Ficha de cliente", data: "Datos de contacto, citas, sesiones (notas prácticas, servicio, duración, preferencias), notas de gestión y facturas.", purpose: "Prestarte los servicios contratados, organizarlos y facturarlos.", basis: "Ejecución del contrato (art. 6.1.b RGPD) y obligaciones legales (art. 6.1.c RGPD)." },
];

export function privacyHtml(): string {
  const fv = CONSENT_TEXTS.first_visit.version, em = CONSENT_TEXTS.emotional.version, m = RETENTION_REVIEW_MONTHS;
  return [
    "<p>Aquí te explicamos qué datos personales se tratan en esta web y en las sesiones con Cristina, para qué, con qué base, con quién se comparten, cuánto tiempo se guardan y cómo ejercer tus derechos. Algunos datos todavía están pendientes de completar y aparecen marcados como tales.</p>",
    "<h2>1. Responsable</h2>",
    `<ul><li>Responsable: Cristina Battistelli (Cristina Vive Consciente · BION).</li><li>NIF: ${P("NIF del responsable")}</li><li>Domicilio: ${P("dirección postal del responsable")}</li><li>Contacto para privacidad: ${mail}</li></ul>`,
    "<h2>2. Qué datos tratamos y para qué</h2>",
    ...TREATMENTS.map((t) => `<h3>${t.title}</h3><p><strong>Datos:</strong> ${t.data}</p><p><strong>Para qué:</strong> ${t.purpose}</p><p><strong>Base:</strong> ${t.basis}</p>`),
    "<h2>3. Primera visita y Acompañamiento emocional</h2>",
    "<p>Si tú lo decides, Cristina puede anotar en tu ficha información sobre tu salud y bienestar (Primera visita) y sobre el acompañamiento emocional (lo que relatas, sus observaciones y los objetivos de seguimiento). Son dos apartados separados, cada uno con su propio consentimiento:</p>",
    `<ul><li><strong>Finalidad:</strong> preparar tus sesiones, darles seguimiento y conocer las preferencias que quieras compartir.</li><li><strong>Sin diagnósticos:</strong> Cristina no es profesional sanitaria; estas notas no son diagnósticos ni sustituyen la atención médica o psicológica.</li><li><strong>Base:</strong> tu consentimiento explícito para cada apartado (art. 9.2.a RGPD). Es voluntario: solo se anota lo que decidas contar, y aceptar el acompañamiento emocional no es condición para reservar ni recibir ningún servicio.</li><li><strong>Registro:</strong> se guarda la fecha, la versión del texto que aceptaste (${fv} y ${em}) y la forma en que lo diste.</li><li><strong>Protección:</strong> se guarda cifrado, solo accede Cristina con su usuario, y cada acceso queda registrado sin el contenido. No se usa para publicidad, analítica ni herramientas de inteligencia artificial, ni se envía por email o WhatsApp.</li><li><strong>Retirada:</strong> puedes retirar cada consentimiento cuando quieras escribiendo a ${CONTACT_EMAIL} o diciéndoselo a Cristina; al retirarlo se suprimen los datos de ese apartado, salvo que una ley obligue a conservarlos.</li><li><strong>Revisión:</strong> cada ${m} meses se revisa si siguen siendo necesarios; si no, se eliminan.</li></ul>`,
    "<h2>4. Con quién se comparten</h2>",
    "<p>No vendemos ni cedemos tus datos. Para que la web funcione intervienen estos proveedores:</p>",
    `<ul><li><strong>Railway</strong> (alojamiento de la web y de la base de datos). Los servidores están en Estados Unidos. ${P("datos de la entidad, contrato de encargado del tratamiento y garantías de la transferencia internacional (Marco de Privacidad UE-EE. UU. o cláusulas contractuales tipo)")}</li><li><strong>Brevo</strong> (envío de los emails de la web: confirmaciones de cita, pedidos y contacto). ${P("datos de la entidad y contrato de encargado del tratamiento")}</li><li><strong>CallMeBot</strong> (aviso por WhatsApp a Cristina de nuevas solicitudes de cita y pedidos): solo recibe el servicio, el día y la hora, o la referencia, el producto y el importe del pedido; nunca tu nombre, teléfono, email ni mensaje. ${P("datos de la entidad y condiciones del servicio")}</li><li><strong>Google</strong>: Google Analytics y Google Ads solo si aceptas esas cookies (ver la <a href="/politica-de-cookies">política de cookies</a>); nunca se les envía tu nombre, email, teléfono ni lo que escribes. Las tipografías se sirven desde la propia web.</li><li>Pagos por Bizum: se hacen desde tu banco, fuera de esta web.</li><li>Administraciones públicas, cuando exista una obligación legal (por ejemplo, fiscal).</li></ul>`,
    "<h2>5. Cuánto tiempo se guardan</h2>",
    `<ul><li>Primera visita y Acompañamiento: mientras mantengas el consentimiento y sean necesarios, con revisión cada ${m} meses.</li><li>Solicitudes, consultas, ficha de cliente y comentarios: mientras sean necesarios para la finalidad. ${P("plazos concretos")}</li><li>Facturas y datos de pedidos: durante los plazos que exija la normativa fiscal y mercantil. ${P("plazos concretos")}</li></ul>`,
    "<p>Después se suprimen o se bloquean durante el tiempo en que pudieran exigirse responsabilidades (art. 32 LOPDGDD).</p>",
    "<h2>6. Tus derechos</h2>",
    `<p>Puedes pedir el acceso a tus datos, su rectificación o supresión, la limitación u oposición a su tratamiento y su portabilidad, y retirar en cualquier momento los consentimientos que hayas dado, sin que afecte a lo tratado antes. Escribe a ${mail}. Respondemos en un mes como máximo.</p>`,
    '<p>Si consideras que no se han atendido bien tus derechos, puedes reclamar ante la Agencia Española de Protección de Datos (<a href="https://www.aepd.es">www.aepd.es</a>).</p>',
    "<h2>7. Seguridad</h2>",
    "<p>El acceso a la gestión de clientes requiere usuario y contraseña, los datos de Primera visita y Acompañamiento se guardan cifrados y los accesos quedan registrados. Ningún sistema es infalible; si ocurriera un incidente que afecte a tus datos, actuaremos según la normativa.</p>",
  ].join("");
}

const COOKIE_ROWS: Array<[string, string, string, string, string]> = [
  ["Sesión de acceso privado", "Técnica (propia)", "Mantener la sesión de Cristina en el área privada (CRM). Los visitantes no la reciben.", "Sesión / hasta cerrar sesión", "No requiere"],
  ["cvc_consent_v1", "Técnica (propia, localStorage)", "Recordar tus preferencias de cookies.", "Hasta que la borres", "No requiere"],
  ["Lista «Mi consulta»", "Técnica (propia, localStorage)", "Recordar los aceites que añades a tu consulta personalizada.", "Hasta que la borres", "No requiere"],
  ["Google Analytics", "Analítica (terceros)", "Medir de forma agregada cómo se usa la web (páginas vistas y solicitudes de reserva enviadas). Solo se activa si la aceptas.", "Hasta 2 años (según Google)", "Sí"],
  ["Google Ads", "Publicidad (terceros)", "Medir si un anuncio de Google lleva a una solicitud de reserva. No se usa para mostrarte anuncios personalizados. Solo se activa si la aceptas.", "Hasta 90 días (según Google)", "Sí"],
];

export function cookiesHtml(): string {
  return [
    "<p>Esta web (BION — Cristina Vive Consciente) usa únicamente las cookies y el almacenamiento local que se describen a continuación. Las técnicas son imprescindibles y no necesitan tu consentimiento; las de analítica y publicidad solo se activan si las aceptas, y puedes cambiar de opinión en cualquier momento.</p>",
    "<h2>Qué usamos</h2>",
    "<ul>" + COOKIE_ROWS.map(([name, type, purpose, duration, consent]) => `<li><strong>${name}</strong> — ${type}. ${purpose} Duración: ${duration}. Consentimiento: ${consent}.</li>`).join("") + "</ul>",
    "<h3>Qué datos se miden y cuáles no</h3>",
    "<p>Si activas la medición, solo se registran eventos como «solicitud de reserva enviada» junto con el servicio elegido. Nunca se envían a Google tu nombre, correo, teléfono, el texto que escribas ni datos de salud.</p>",
    "<h3>Cómo gestionar tus preferencias</h3>",
    '<p>Puedes aceptar, rechazar o elegir categorías en el aviso de cookies, y reabrirlo cuando quieras: <a href="action:cookie-settings">Gestionar cookies</a>. También puedes borrar los datos del sitio desde la configuración de tu navegador.</p>',
    "<h3>Contacto</h3>",
    '<p>Para cualquier duda sobre cookies o tus datos puedes escribir desde la página de <a href="/contacto">contacto</a>.</p>',
  ].join("");
}
