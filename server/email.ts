/**
 * Email helper — Cristina Vive Consciente
 * Sistema completo de emails automáticos:
 * - Confirmación de reserva al cliente
 * - Notificación de reserva al admin
 * - Entrega de ebook con enlace seguro
 * - Bienvenida a nuevo lead (formulario de contacto)
 * - Secuencia de 3 emails para leads (día 0, día 3, día 7)
 *
 * Usa SMTP configurable via variables de entorno.
 * Si no hay SMTP configurado, registra el email en consola (modo dev).
 */

import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST ?? "";
const SMTP_PORT = parseInt(process.env.SMTP_PORT ?? "25", 10);
const SMTP_USER = process.env.SMTP_USER ?? "";
const SMTP_PASS = process.env.SMTP_PASS ?? "";
const SMTP_FROM = process.env.SMTP_FROM ?? "Cristina Vive Consciente <hola@cristinaviveconsciente.es>";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";

// URL base de la web (para enlaces en emails)
const BASE_URL = "https://cristinaviveconsciente.es";

// Logo de marca — AVIF alojado en CloudFront (soportado por Apple Mail, Gmail web, Outlook moderno)
// Fallback visual mediante alt text + estructura de tabla para clientes sin imágenes
const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/logo-bion-original_f6b56924.avif";

function getTransporter() {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null; // modo dev: solo log
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    tls: {
      rejectUnauthorized: false, // Dinahosting puede usar cert autofirmado
    },
  });
}

// ─── HELPERS DE PLANTILLA ─────────────────────────────────────────────────────

// Cabecera unificada con logo para todos los emails
function emailHeader() {
  return `
    <tr>
      <td style="background:#FFFFFF;padding:28px 40px 20px;text-align:center;border-bottom:3px solid #3A5A3A;">
        <!--[if !mso]><!-->
        <img src="${LOGO_URL}"
             alt="BION | Cristina Vive Consciente"
             width="160" height="auto"
             style="display:block;margin:0 auto;max-width:160px;height:auto;" />
        <!--<![endif]-->
        <!--[if mso]>
        <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
          <p style="margin:0;font-size:18px;font-weight:bold;color:#4A5A2A;font-family:Georgia,serif;letter-spacing:4px;">BION</p>
          <p style="margin:2px 0 0;font-size:10px;color:#6B7A4A;font-family:Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;">Cristina Vive Consciente</p>
        </td></tr></table>
        <![endif]-->
      </td>
    </tr>`;
}

// Pie de página unificado para todos los emails
function emailFooter() {
  return `
    <tr>
      <td style="padding:20px 40px;background:#F5F2EC;border-top:1px solid #E8E4DC;text-align:center;">
        <p style="margin:0;font-size:11px;color:#A09080;font-family:'DM Sans',Arial,sans-serif;letter-spacing:1px;">
          BION — Cristina Vive Consciente &nbsp;·&nbsp; hola@cristinaviveconsciente.es
        </p>
        <p style="margin:6px 0 0;font-size:10px;color:#C0B8A8;font-family:'DM Sans',Arial,sans-serif;">
          <a href="${BASE_URL}" style="color:#A09080;text-decoration:none;">cristinaviveconsciente.es</a>
        </p>
      </td>
    </tr>`;
}

// Badge para emails de administración (aparece debajo del header)
function adminBadge(label: string) {
  return `
    <tr>
      <td style="background:#3A5A3A;padding:10px 40px;text-align:center;">
        <p style="margin:0;color:#FFFFFF;font-size:10px;letter-spacing:3px;text-transform:uppercase;font-family:'DM Sans',Arial,sans-serif;font-weight:500;">${label}</p>
      </td>
    </tr>`;
}

function wrapEmail(content: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#FAFAF7;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF7;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #E8E4DC;">
          ${content}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

function ctaButton(href: string, label: string) {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td align="center">
          <a href="${href}"
             style="display:inline-block;background:#3A5A3A;color:#FFFFFF;text-decoration:none;font-family:'DM Sans',Arial,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;padding:16px 40px;font-weight:500;border-radius:2px;">
            ${label}
          </a>
        </td>
      </tr>
    </table>`;
}

// ─── TIPOS ────────────────────────────────────────────────────────────────────

const MODALITY_LABELS: Record<string, string> = {
  zoom: "Videollamada (Zoom)",
  telefono: "Teléfono",
  presencial: "Presencial",
  whatsapp: "WhatsApp",
};

export interface BookingEmailData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  serviceLabel: string;
  preferredDate: string;
  preferredTime?: string;
  modality: string;
  message?: string;
}

export interface LeadEmailData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  subject?: string;
  message?: string;
}

export interface EbookDeliveryEmailData {
  customerEmail: string;
  customerName?: string;
  ebookTitle: string;
  downloadToken: string;
  downloadExpiresAt: number;
  includesSession: boolean;
}

// ─── FUNCIÓN DE ENVÍO GENÉRICA ────────────────────────────────────────────────

async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  const transporter = getTransporter();

  if (!transporter) {
    console.log(`[Email DEV] To: ${opts.to} | Subject: ${opts.subject}`);
    return;
  }

  await transporter.sendMail({
    from: SMTP_FROM,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });
}

// ─── EMAIL 1: CONFIRMACIÓN DE RESERVA AL CLIENTE ─────────────────────────────

export async function sendClientConfirmationEmail(data: BookingEmailData): Promise<void> {
  const modalityLabel = MODALITY_LABELS[data.modality] ?? data.modality;
  const dateFormatted = new Date(data.preferredDate + "T12:00:00").toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const subject = "Hemos recibido tu solicitud de cita — BION";

  const html = wrapEmail(`
    ${emailHeader()}
    <tr>
      <td style="padding:40px 40px 32px;">
        <h1 style="margin:0 0 8px;font-size:24px;font-weight:400;color:#1A1208;font-family:'Georgia',serif;">
          Hola, ${data.firstName}
        </h1>
        <p style="margin:0 0 24px;font-size:14px;color:#7A6E5E;font-family:'DM Sans',Arial,sans-serif;font-weight:300;line-height:1.6;">
          Hemos recibido tu solicitud de cita. Cristina la revisará y se pondrá en contacto contigo en las próximas <strong>24–48 horas</strong> para confirmar los detalles.
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F2EC;border-left:3px solid #3A5A3A;margin-bottom:24px;">
          <tr>
            <td style="padding:20px 24px;">
              <p style="margin:0 0 12px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#3A5A3A;font-family:'DM Sans',Arial,sans-serif;font-weight:500;">Resumen de tu solicitud</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:4px 0;font-size:13px;color:#5A4E3E;font-family:'DM Sans',Arial,sans-serif;width:120px;">Servicio</td>
                  <td style="padding:4px 0;font-size:13px;color:#1A1208;font-family:'DM Sans',Arial,sans-serif;">${data.serviceLabel}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;font-size:13px;color:#5A4E3E;font-family:'DM Sans',Arial,sans-serif;">Fecha preferida</td>
                  <td style="padding:4px 0;font-size:13px;color:#1A1208;font-family:'DM Sans',Arial,sans-serif;">${dateFormatted}</td>
                </tr>
                ${data.preferredTime ? `
                <tr>
                  <td style="padding:4px 0;font-size:13px;color:#5A4E3E;font-family:'DM Sans',Arial,sans-serif;">Hora preferida</td>
                  <td style="padding:4px 0;font-size:13px;color:#1A1208;font-family:'DM Sans',Arial,sans-serif;">${data.preferredTime}</td>
                </tr>` : ""}
                <tr>
                  <td style="padding:4px 0;font-size:13px;color:#5A4E3E;font-family:'DM Sans',Arial,sans-serif;">Modalidad</td>
                  <td style="padding:4px 0;font-size:13px;color:#1A1208;font-family:'DM Sans',Arial,sans-serif;">${modalityLabel}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        ${data.message ? `
        <p style="margin:0 0 24px;font-size:13px;color:#7A6E5E;font-family:'DM Sans',Arial,sans-serif;font-weight:300;font-style:italic;line-height:1.6;">
          Tu mensaje: "${data.message}"
        </p>` : ""}

        <p style="margin:0 0 8px;font-size:14px;color:#1A1208;font-family:'DM Sans',Arial,sans-serif;font-weight:300;line-height:1.6;">
          Si tienes alguna pregunta antes de la cita, puedes responder a este email o escribirme directamente.
        </p>
        <p style="margin:0;font-size:14px;color:#7A6E5E;font-family:'DM Sans',Arial,sans-serif;font-weight:300;line-height:1.6;">
          Con cariño,<br>
          <strong style="color:#3A5A3A;font-weight:500;">Cristina</strong>
        </p>
      </td>
    </tr>
    ${emailFooter()}
  `);

  const text = `Hola ${data.firstName},\n\nHemos recibido tu solicitud de cita.\n\nServicio: ${data.serviceLabel}\nFecha preferida: ${dateFormatted}\n${data.preferredTime ? `Hora preferida: ${data.preferredTime}\n` : ""}Modalidad: ${modalityLabel}\n\nCristina se pondrá en contacto contigo en las próximas 24–48 horas.\n\nCon cariño,\nCristina — BION`;

  await sendEmail({ to: data.email, subject, html, text });
}

// ─── EMAIL 2: NOTIFICACIÓN DE RESERVA AL ADMIN ────────────────────────────────

export async function sendAdminNotificationEmail(data: BookingEmailData): Promise<void> {
  if (!ADMIN_EMAIL) {
    console.log("[Email DEV] Admin notification (no ADMIN_EMAIL configured)");
    return;
  }

  const modalityLabel = MODALITY_LABELS[data.modality] ?? data.modality;
  const subject = `Nueva solicitud de cita — ${data.firstName} ${data.lastName}`;

  const html = wrapEmail(`
    ${emailHeader()}
    ${adminBadge("Nueva solicitud de cita")}
    <tr>
      <td style="padding:32px 40px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td colspan="2" style="padding-bottom:16px;border-bottom:1px solid #E8E4DC;">
            <p style="margin:0;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#3A5A3A;font-family:'DM Sans',Arial,sans-serif;font-weight:500;">Datos del cliente</p>
          </td></tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#7A6E5E;font-family:'DM Sans',Arial,sans-serif;width:140px;">Nombre</td>
            <td style="padding:6px 0;font-size:13px;color:#1A1208;font-family:'DM Sans',Arial,sans-serif;font-weight:500;">${data.firstName} ${data.lastName}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#7A6E5E;font-family:'DM Sans',Arial,sans-serif;">Email</td>
            <td style="padding:6px 0;font-size:13px;font-family:'DM Sans',Arial,sans-serif;"><a href="mailto:${data.email}" style="color:#3A5A3A;">${data.email}</a></td>
          </tr>
          ${data.phone ? `
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#7A6E5E;font-family:'DM Sans',Arial,sans-serif;">Teléfono</td>
            <td style="padding:6px 0;font-size:13px;font-family:'DM Sans',Arial,sans-serif;"><a href="tel:${data.phone}" style="color:#3A5A3A;">${data.phone}</a></td>
          </tr>` : ""}
          <tr><td colspan="2" style="padding:16px 0;border-bottom:1px solid #E8E4DC;">
            <p style="margin:0;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#3A5A3A;font-family:'DM Sans',Arial,sans-serif;font-weight:500;">Datos de la cita</p>
          </td></tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#7A6E5E;font-family:'DM Sans',Arial,sans-serif;">Servicio</td>
            <td style="padding:6px 0;font-size:13px;color:#1A1208;font-family:'DM Sans',Arial,sans-serif;font-weight:500;">${data.serviceLabel}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#7A6E5E;font-family:'DM Sans',Arial,sans-serif;">Fecha preferida</td>
            <td style="padding:6px 0;font-size:13px;color:#1A1208;font-family:'DM Sans',Arial,sans-serif;">${data.preferredDate}</td>
          </tr>
          ${data.preferredTime ? `
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#7A6E5E;font-family:'DM Sans',Arial,sans-serif;">Hora preferida</td>
            <td style="padding:6px 0;font-size:13px;color:#1A1208;font-family:'DM Sans',Arial,sans-serif;">${data.preferredTime}</td>
          </tr>` : ""}
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#7A6E5E;font-family:'DM Sans',Arial,sans-serif;">Modalidad</td>
            <td style="padding:6px 0;font-size:13px;color:#1A1208;font-family:'DM Sans',Arial,sans-serif;">${modalityLabel}</td>
          </tr>
          ${data.message ? `
          <tr>
            <td colspan="2" style="padding:12px 0 0;">
              <p style="margin:0 0 4px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#7A6E5E;font-family:'DM Sans',Arial,sans-serif;">Mensaje del cliente</p>
              <p style="margin:0;font-size:13px;color:#1A1208;font-family:'DM Sans',Arial,sans-serif;font-style:italic;">"${data.message}"</p>
            </td>
          </tr>` : ""}
        </table>
        ${ctaButton(`${BASE_URL}/crm`, "Gestionar en el CRM")}
      </td>
    </tr>
    ${emailFooter()}
  `);

  await sendEmail({ to: ADMIN_EMAIL, subject, html });
}

// ─── EMAIL 3: ENTREGA DE EBOOK ────────────────────────────────────────────────

export async function sendEbookDeliveryEmail(data: EbookDeliveryEmailData): Promise<void> {
  const firstName = data.customerName?.split(" ")[0] ?? "Hola";
  const expiryDate = new Date(data.downloadExpiresAt).toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const downloadUrl = `${BASE_URL}/ebooks/descarga?token=${data.downloadToken}`;
  const subject = `Tu ebook está listo — ${data.ebookTitle}`;

  const html = wrapEmail(`
    ${emailHeader()}
    <tr>
      <td style="padding:40px 40px 32px;">
        <h1 style="margin:0 0 8px;font-size:24px;font-weight:400;color:#1A1208;font-family:'Georgia',serif;">
          ${firstName}, tu ebook está listo 🌿
        </h1>
        <p style="margin:0 0 24px;font-size:14px;color:#7A6E5E;font-family:'DM Sans',Arial,sans-serif;font-weight:300;line-height:1.6;">
          Gracias por tu compra de <strong style="color:#1A1208;">${data.ebookTitle}</strong>. A continuación tienes tu enlace de descarga.
        </p>

        ${ctaButton(downloadUrl, "Descargar mi ebook")}

        <p style="margin:0 0 24px;font-size:12px;color:#A09080;font-family:'DM Sans',Arial,sans-serif;font-weight:300;text-align:center;">
          Este enlace es válido hasta el <strong>${expiryDate}</strong>.<br>
          Si tienes problemas para descargar, responde a este email.
        </p>

        ${data.includesSession ? `
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F2EC;border-left:3px solid #8B7355;margin-bottom:24px;">
          <tr>
            <td style="padding:20px 24px;">
              <p style="margin:0 0 6px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#8B7355;font-family:'DM Sans',Arial,sans-serif;font-weight:500;">Incluido en tu compra</p>
              <p style="margin:0;font-size:13px;color:#1A1208;font-family:'DM Sans',Arial,sans-serif;font-weight:400;line-height:1.6;">
                <strong>Sesión de 30 minutos con Cristina</strong> — Responde a este email para coordinar tu sesión cuando hayas leído la guía.
              </p>
            </td>
          </tr>
        </table>` : ""}

        <p style="margin:0;font-size:14px;color:#7A6E5E;font-family:'DM Sans',Arial,sans-serif;font-weight:300;line-height:1.6;">
          Espero que esta guía te aporte mucha claridad y bienestar.<br>
          Con cariño,<br>
          <strong style="color:#3A5A3A;font-weight:500;">Cristina</strong>
        </p>
      </td>
    </tr>
    ${emailFooter()}
  `);

  const text = `${firstName}, tu ebook está listo!\n\nGracias por comprar "${data.ebookTitle}".\n\nDescarga tu ebook aquí: ${downloadUrl}\n\nEste enlace es válido hasta el ${expiryDate}.\n${data.includesSession ? "\nTu compra incluye una sesión de 30 minutos con Cristina. Responde a este email para coordinarla.\n" : ""}\nCon cariño,\nCristina — BION`;

  await sendEmail({ to: data.customerEmail, subject, html, text });
}

// ─── EMAIL 4: BIENVENIDA A NUEVO LEAD ────────────────────────────────────────

export async function sendLeadWelcomeEmail(data: LeadEmailData): Promise<void> {
  const subject = `Hola ${data.firstName}, me alegra que hayas contactado 🌿`;

  const html = wrapEmail(`
    ${emailHeader()}
    <tr>
      <td style="padding:40px 40px 32px;">
        <h1 style="margin:0 0 8px;font-size:24px;font-weight:400;color:#1A1208;font-family:'Georgia',serif;">
          Hola, ${data.firstName}
        </h1>
        <p style="margin:0 0 20px;font-size:14px;color:#7A6E5E;font-family:'DM Sans',Arial,sans-serif;font-weight:300;line-height:1.8;">
          He recibido tu mensaje y me alegra mucho que hayas dado este primer paso. Responderé personalmente en las próximas <strong>24–48 horas</strong>.
        </p>
        <p style="margin:0 0 20px;font-size:14px;color:#7A6E5E;font-family:'DM Sans',Arial,sans-serif;font-weight:300;line-height:1.8;">
          Mientras tanto, quiero que sepas que cada consulta es un espacio seguro y sin juicios. Mi enfoque es acompañarte desde la consciencia, la naturaleza y la integralidad — cuerpo, mente y espíritu.
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F2EC;border-left:3px solid #3A5A3A;margin-bottom:24px;">
          <tr>
            <td style="padding:20px 24px;">
              <p style="margin:0 0 12px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#3A5A3A;font-family:'DM Sans',Arial,sans-serif;font-weight:500;">Mientras esperas mi respuesta</p>
              <p style="margin:0 0 8px;font-size:13px;color:#1A1208;font-family:'DM Sans',Arial,sans-serif;line-height:1.6;">
                🌿 Explora mis <a href="${BASE_URL}/consultas" style="color:#3A5A3A;text-decoration:underline;">servicios de consulta</a> para saber qué modalidad encaja mejor contigo.
              </p>
              <p style="margin:0 0 8px;font-size:13px;color:#1A1208;font-family:'DM Sans',Arial,sans-serif;line-height:1.6;">
                📖 Descubre mis <a href="${BASE_URL}/guias-digitales" style="color:#3A5A3A;text-decoration:underline;">guías digitales</a> sobre agua estructurada y aceites esenciales.
              </p>
              <p style="margin:0;font-size:13px;color:#1A1208;font-family:'DM Sans',Arial,sans-serif;line-height:1.6;">
                🛒 Visita los <a href="${BASE_URL}/recomendados" style="color:#3A5A3A;text-decoration:underline;">productos que recomiendo</a> para tu bienestar diario.
              </p>
            </td>
          </tr>
        </table>

        <p style="margin:0;font-size:14px;color:#7A6E5E;font-family:'DM Sans',Arial,sans-serif;font-weight:300;line-height:1.6;">
          Gracias por confiar en mí.<br>
          Con cariño,<br>
          <strong style="color:#3A5A3A;font-weight:500;">Cristina</strong>
        </p>
      </td>
    </tr>
    ${emailFooter()}
  `);

  const text = `Hola ${data.firstName},\n\nHe recibido tu mensaje y me alegra mucho que hayas dado este primer paso. Responderé personalmente en las próximas 24–48 horas.\n\nMientras tanto, puedes explorar mis servicios en ${BASE_URL}/consultas\n\nCon cariño,\nCristina — BION`;

  await sendEmail({ to: data.email, subject, html, text });
}

// ─── EMAIL 5: NOTIFICACIÓN DE NUEVO LEAD AL ADMIN ────────────────────────────

export async function sendAdminLeadNotificationEmail(data: LeadEmailData): Promise<void> {
  if (!ADMIN_EMAIL) return;

  const subject = `Nuevo lead — ${data.firstName} ${data.lastName}`;

  const html = wrapEmail(`
    ${emailHeader()}
    ${adminBadge("Nuevo lead")}
    <tr>
      <td style="padding:32px 40px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#7A6E5E;font-family:'DM Sans',Arial,sans-serif;width:140px;">Nombre</td>
            <td style="padding:6px 0;font-size:13px;color:#1A1208;font-family:'DM Sans',Arial,sans-serif;font-weight:500;">${data.firstName} ${data.lastName}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#7A6E5E;font-family:'DM Sans',Arial,sans-serif;">Email</td>
            <td style="padding:6px 0;font-size:13px;font-family:'DM Sans',Arial,sans-serif;"><a href="mailto:${data.email}" style="color:#3A5A3A;">${data.email}</a></td>
          </tr>
          ${data.phone ? `
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#7A6E5E;font-family:'DM Sans',Arial,sans-serif;">Teléfono</td>
            <td style="padding:6px 0;font-size:13px;font-family:'DM Sans',Arial,sans-serif;"><a href="tel:${data.phone}" style="color:#3A5A3A;">${data.phone}</a></td>
          </tr>` : ""}
          ${data.subject ? `
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#7A6E5E;font-family:'DM Sans',Arial,sans-serif;">Asunto</td>
            <td style="padding:6px 0;font-size:13px;color:#1A1208;font-family:'DM Sans',Arial,sans-serif;">${data.subject}</td>
          </tr>` : ""}
          ${data.message ? `
          <tr>
            <td colspan="2" style="padding:12px 0 0;">
              <p style="margin:0 0 4px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#7A6E5E;font-family:'DM Sans',Arial,sans-serif;">Mensaje</p>
              <p style="margin:0;font-size:13px;color:#1A1208;font-family:'DM Sans',Arial,sans-serif;font-style:italic;line-height:1.6;">"${data.message}"</p>
            </td>
          </tr>` : ""}
        </table>
        ${ctaButton(`${BASE_URL}/crm/clientes`, "Ver en el CRM")}
      </td>
    </tr>
    ${emailFooter()}
  `);

  await sendEmail({ to: ADMIN_EMAIL, subject, html });
}

// ─── EMAILS DE SECUENCIA (días 3 y 7) ────────────────────────────────────────

export async function sendLeadSequenceEmail(
  step: 1 | 2 | 3,
  data: { email: string; firstName: string }
): Promise<void> {
  const configs = {
    1: {
      subject: `${data.firstName}, ¿sabes qué es el bienestar consciente? 🌿`,
      headline: `El bienestar consciente empieza por una pregunta`,
      body: `
        <p style="margin:0 0 16px;font-size:14px;color:#7A6E5E;font-family:'DM Sans',Arial,sans-serif;font-weight:300;line-height:1.8;">
          Hace unos días contactaste conmigo y quiero compartir algo contigo antes de que hablemos.
        </p>
        <p style="margin:0 0 16px;font-size:14px;color:#7A6E5E;font-family:'DM Sans',Arial,sans-serif;font-weight:300;line-height:1.8;">
          El bienestar consciente no es una dieta, ni un suplemento, ni una rutina. Es una <strong style="color:#1A1208;">forma de relacionarte contigo mismo</strong> que lo cambia todo.
        </p>
        <p style="margin:0 0 16px;font-size:14px;color:#7A6E5E;font-family:'DM Sans',Arial,sans-serif;font-weight:300;line-height:1.8;">
          En mis consultas no te doy una lista de cosas que hacer. Te acompaño a <em>escuchar</em> lo que tu cuerpo ya sabe.
        </p>
        <p style="margin:0 0 24px;font-size:14px;color:#7A6E5E;font-family:'DM Sans',Arial,sans-serif;font-weight:300;line-height:1.8;">
          ¿Quieres dar ese primer paso?
        </p>
        ${ctaButton(`${BASE_URL}/consultas`, "Conocer mis consultas")}
      `,
    },
    2: {
      subject: `El agua que bebes importa más de lo que crees 💧`,
      headline: `El agua es el primer paso hacia el bienestar`,
      body: `
        <p style="margin:0 0 16px;font-size:14px;color:#7A6E5E;font-family:'DM Sans',Arial,sans-serif;font-weight:300;line-height:1.8;">
          Una de las preguntas que más me hacen mis clientes es: <em>"¿Por qué me siento tan cansada si como bien?"</em>
        </p>
        <p style="margin:0 0 16px;font-size:14px;color:#7A6E5E;font-family:'DM Sans',Arial,sans-serif;font-weight:300;line-height:1.8;">
          La respuesta muchas veces está en el agua. El agua que bebemos en casa puede contener cloro, metales pesados y otras sustancias que interfieren con nuestro bienestar. Yo misma lo viví.
        </p>
        <p style="margin:0 0 24px;font-size:14px;color:#7A6E5E;font-family:'DM Sans',Arial,sans-serif;font-weight:300;line-height:1.8;">
          Por eso creé una guía completa sobre el agua estructurada. Es el recurso que ojalá hubiera tenido cuando empecé mi camino.
        </p>
        ${ctaButton(`${BASE_URL}/guias-digitales`, "Ver la guía del agua")}
      `,
    },
    3: {
      subject: `Un regalo para ti — recursos gratuitos de bienestar 🎁`,
      headline: `Porque el bienestar es un camino, no un destino`,
      body: `
        <p style="margin:0 0 16px;font-size:14px;color:#7A6E5E;font-family:'DM Sans',Arial,sans-serif;font-weight:300;line-height:1.8;">
          Llevas unos días en mi comunidad y quiero agradecerte tu confianza con algo especial.
        </p>
        <p style="margin:0 0 16px;font-size:14px;color:#7A6E5E;font-family:'DM Sans',Arial,sans-serif;font-weight:300;line-height:1.8;">
          He reunido los productos que uso personalmente en casa y que recomiendo a mis clientes. Desde aceites esenciales hasta sistemas de filtración de agua — todo con el criterio de alguien que los ha probado de verdad.
        </p>
        <p style="margin:0 0 24px;font-size:14px;color:#7A6E5E;font-family:'DM Sans',Arial,sans-serif;font-weight:300;line-height:1.8;">
          Y si sientes que es el momento de dar un paso más, estaré encantada de acompañarte en una consulta personalizada.
        </p>
        ${ctaButton(`${BASE_URL}/recomendados`, "Ver mis recomendados")}
        <p style="margin:16px 0 0;font-size:13px;color:#A09080;font-family:'DM Sans',Arial,sans-serif;text-align:center;">
          o <a href="${BASE_URL}/consultas" style="color:#3A5A3A;">reserva una consulta</a> cuando estés lista
        </p>
      `,
    },
  };

  const config = configs[step];
  const subject = config.subject;

  const html = wrapEmail(`
    ${emailHeader()}
    <tr>
      <td style="padding:40px 40px 32px;">
        <h1 style="margin:0 0 16px;font-size:22px;font-weight:400;color:#1A1208;font-family:'Georgia',serif;">
          ${config.headline}
        </h1>
        ${config.body}
        <p style="margin:24px 0 0;font-size:14px;color:#7A6E5E;font-family:'DM Sans',Arial,sans-serif;font-weight:300;line-height:1.6;">
          Con cariño,<br>
          <strong style="color:#3A5A3A;font-weight:500;">Cristina</strong>
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 40px;background:#F5F2EC;border-top:1px solid #E8E4DC;">
        <p style="margin:0;font-size:11px;color:#A09080;font-family:'DM Sans',Arial,sans-serif;text-align:center;">
          Recibes este email porque contactaste a través de cristinaviveconsciente.es.
          <a href="mailto:hola@cristinaviveconsciente.es?subject=Baja%20lista" style="color:#A09080;">Darse de baja</a>
        </p>
      </td>
    </tr>
    ${emailFooter()}
  `);

  const text = `Hola ${data.firstName},\n\n${config.headline}\n\nVisita: ${BASE_URL}\n\nCon cariño,\nCristina — BION\n\n---\nPara darte de baja, responde a este email con "Baja".`;

  await sendEmail({ to: data.email, subject, html, text });
}

// ─── EMAIL: FACTURA AL CLIENTE (CON PDF ADJUNTO) ──────────────────────────────

export interface InvoiceEmailData {
  to: string;
  clientName: string;
  invoiceNumber: string;
  concept: string;
  total: string | number;
  issuedAt?: number | null;
  pdfBuffer: Buffer;
}

export async function sendInvoiceEmail(data: InvoiceEmailData): Promise<void> {
  const totalFormatted = parseFloat(String(data.total ?? 0)).toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
  });
  const dateFormatted = data.issuedAt
    ? new Date(data.issuedAt).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });

  const firstName = data.clientName.split(" ")[0];
  const subject = `Tu factura ${data.invoiceNumber} — BION · Cristina Vive Consciente`;

  const html = wrapEmail(`
    ${emailHeader()}
    <tr>
      <td style="padding:40px 40px 32px;">
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:400;color:#1A1208;font-family:'Georgia',serif;">
          Hola, ${firstName}
        </h1>
        <p style="margin:0 0 24px;font-size:14px;color:#7A6E5E;font-family:'DM Sans',Arial,sans-serif;font-weight:300;line-height:1.8;">
          Adjunta a este email encontrarás tu factura en formato PDF.
        </p>

        <table width="100%" cellpadding="0" cellspacing="0"
               style="border:1px solid #E8E4DC;margin:0 0 24px;">
          <tr>
            <td style="padding:16px 20px;background:#F5F2EC;border-bottom:1px solid #E8E4DC;">
              <p style="margin:0;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#3A5A3A;font-family:'DM Sans',Arial,sans-serif;font-weight:500;">
                Resumen de factura
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:13px;color:#7A6E5E;font-family:'DM Sans',Arial,sans-serif;padding-bottom:8px;">Número</td>
                  <td align="right" style="font-size:13px;color:#1A1208;font-family:'DM Sans',Arial,sans-serif;font-weight:500;padding-bottom:8px;">${data.invoiceNumber}</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:#7A6E5E;font-family:'DM Sans',Arial,sans-serif;padding-bottom:8px;">Fecha</td>
                  <td align="right" style="font-size:13px;color:#1A1208;font-family:'DM Sans',Arial,sans-serif;padding-bottom:8px;">${dateFormatted}</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:#7A6E5E;font-family:'DM Sans',Arial,sans-serif;padding-bottom:8px;">Concepto</td>
                  <td align="right" style="font-size:13px;color:#1A1208;font-family:'DM Sans',Arial,sans-serif;padding-bottom:8px;">${data.concept}</td>
                </tr>
                <tr>
                  <td style="font-size:14px;color:#3A5A3A;font-family:'DM Sans',Arial,sans-serif;font-weight:600;border-top:1px solid #E8E4DC;padding-top:12px;">Total</td>
                  <td align="right" style="font-size:16px;color:#3A5A3A;font-family:'DM Sans',Arial,sans-serif;font-weight:700;border-top:1px solid #E8E4DC;padding-top:12px;">${totalFormatted}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <p style="margin:0 0 24px;font-size:13px;color:#A09080;font-family:'DM Sans',Arial,sans-serif;font-weight:300;line-height:1.7;">
          Si tienes alguna pregunta sobre esta factura, no dudes en contactarme respondiendo a este email.
        </p>

        <p style="margin:24px 0 0;font-size:14px;color:#7A6E5E;font-family:'DM Sans',Arial,sans-serif;font-weight:300;line-height:1.6;">
          Con cariño,<br>
          <strong style="color:#3A5A3A;font-weight:500;">Cristina</strong>
        </p>
      </td>
    </tr>
    ${emailFooter()}
  `);

  const text = `Hola ${firstName},\n\nAdjunta encontrarás tu factura ${data.invoiceNumber} por importe de ${totalFormatted}.\n\nConcepto: ${data.concept}\nFecha: ${dateFormatted}\n\nSi tienes alguna pregunta, responde a este email.\n\nCon cariño,\nCristina — BION\nhola@cristinaviveconsciente.es`;

  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[Email DEV] Factura ${data.invoiceNumber} → ${data.to} (PDF adjunto: ${data.pdfBuffer.length} bytes)`);
    return;
  }

  await transporter.sendMail({
    from: SMTP_FROM,
    to: data.to,
    subject,
    html,
    text,
    attachments: [
      {
        filename: `factura-${data.invoiceNumber}.pdf`,
        content: data.pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
}
