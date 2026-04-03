/**
 * Email helper — Cristina Vive Consciente
 * Envía emails de confirmación al cliente y notificación al admin
 * cuando se recibe una nueva solicitud de cita.
 *
 * Usa SMTP configurable via variables de entorno.
 * Si no hay SMTP configurado, registra el email en consola (modo dev).
 */

import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST ?? "";
const SMTP_PORT = parseInt(process.env.SMTP_PORT ?? "587", 10);
const SMTP_USER = process.env.SMTP_USER ?? "";
const SMTP_PASS = process.env.SMTP_PASS ?? "";
const SMTP_FROM = process.env.SMTP_FROM ?? "BION — Cristina Vive Consciente <hola@cristinaviveconsciente.com>";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";

function getTransporter() {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null; // modo dev: solo log
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

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

/**
 * Email de confirmación al cliente
 */
export async function sendClientConfirmationEmail(data: BookingEmailData): Promise<void> {
  const modalityLabel = MODALITY_LABELS[data.modality] ?? data.modality;
  const dateFormatted = new Date(data.preferredDate + "T12:00:00").toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const subject = "Hemos recibido tu solicitud de cita — BION";

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#FAFAF7;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF7;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #E8E4DC;">
          
          <!-- Header -->
          <tr>
            <td style="background:#3A5A3A;padding:32px 40px;text-align:center;">
              <p style="margin:0;color:#FFFFFF;font-size:11px;letter-spacing:3px;text-transform:uppercase;font-family:'DM Sans',Arial,sans-serif;">BION</p>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:10px;letter-spacing:2px;text-transform:uppercase;font-family:'DM Sans',Arial,sans-serif;">Cristina Vive Consciente</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h1 style="margin:0 0 8px;font-size:24px;font-weight:400;color:#1A1208;font-family:'Georgia',serif;">
                Hola, ${data.firstName}
              </h1>
              <p style="margin:0 0 24px;font-size:14px;color:#7A6E5E;font-family:'DM Sans',Arial,sans-serif;font-weight:300;line-height:1.6;">
                Hemos recibido tu solicitud de cita. Cristina la revisará y se pondrá en contacto contigo en las próximas <strong>24–48 horas</strong> para confirmar los detalles.
              </p>

              <!-- Resumen de la cita -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F2EC;border-left:3px solid #3A5A3A;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 12px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#3A5A3A;font-family:'DM Sans',Arial,sans-serif;font-weight:500;">Resumen de tu solicitud</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:4px 0;font-size:13px;color:#5A4E3E;font-family:'DM Sans',Arial,sans-serif;font-weight:400;width:120px;">Servicio</td>
                        <td style="padding:4px 0;font-size:13px;color:#1A1208;font-family:'DM Sans',Arial,sans-serif;font-weight:400;">${data.serviceLabel}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;font-size:13px;color:#5A4E3E;font-family:'DM Sans',Arial,sans-serif;font-weight:400;">Fecha preferida</td>
                        <td style="padding:4px 0;font-size:13px;color:#1A1208;font-family:'DM Sans',Arial,sans-serif;font-weight:400;">${dateFormatted}</td>
                      </tr>
                      ${data.preferredTime ? `
                      <tr>
                        <td style="padding:4px 0;font-size:13px;color:#5A4E3E;font-family:'DM Sans',Arial,sans-serif;font-weight:400;">Hora preferida</td>
                        <td style="padding:4px 0;font-size:13px;color:#1A1208;font-family:'DM Sans',Arial,sans-serif;font-weight:400;">${data.preferredTime}</td>
                      </tr>` : ""}
                      <tr>
                        <td style="padding:4px 0;font-size:13px;color:#5A4E3E;font-family:'DM Sans',Arial,sans-serif;font-weight:400;">Modalidad</td>
                        <td style="padding:4px 0;font-size:13px;color:#1A1208;font-family:'DM Sans',Arial,sans-serif;font-weight:400;">${modalityLabel}</td>
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

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #E8E4DC;text-align:center;">
              <p style="margin:0;font-size:11px;color:#A09080;font-family:'DM Sans',Arial,sans-serif;letter-spacing:1px;">
                BION — Cristina Vive Consciente &nbsp;·&nbsp; Bienestar holístico natural
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `Hola ${data.firstName},\n\nHemos recibido tu solicitud de cita.\n\nServicio: ${data.serviceLabel}\nFecha preferida: ${dateFormatted}\n${data.preferredTime ? `Hora preferida: ${data.preferredTime}\n` : ""}Modalidad: ${modalityLabel}\n\nCristina se pondrá en contacto contigo en las próximas 24–48 horas para confirmar.\n\nCon cariño,\nCristina — BION`;

  const transporter = getTransporter();

  if (!transporter) {
    console.log("[Email DEV] Client confirmation email:");
    console.log(`  To: ${data.email}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Body: ${text.substring(0, 200)}...`);
    return;
  }

  await transporter.sendMail({
    from: SMTP_FROM,
    to: data.email,
    subject,
    html,
    text,
  });
}

/**
 * Email de notificación al admin con todos los datos
 */
export async function sendAdminNotificationEmail(data: BookingEmailData): Promise<void> {
  if (!ADMIN_EMAIL) {
    console.log("[Email DEV] Admin notification email (no ADMIN_EMAIL configured)");
    console.log(`  New booking from: ${data.firstName} ${data.lastName} <${data.email}>`);
    return;
  }

  const modalityLabel = MODALITY_LABELS[data.modality] ?? data.modality;
  const subject = `Nueva solicitud de cita — ${data.firstName} ${data.lastName}`;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#F5F2EC;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 20px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #E8E4DC;">
          <tr>
            <td style="background:#1A1208;padding:20px 32px;">
              <p style="margin:0;color:#FFFFFF;font-size:11px;letter-spacing:3px;text-transform:uppercase;">BION — NUEVA SOLICITUD DE CITA</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td colspan="2" style="padding-bottom:16px;border-bottom:1px solid #E8E4DC;margin-bottom:16px;">
                  <p style="margin:0;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#3A5A3A;font-weight:500;">Datos del cliente</p>
                </td></tr>
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#7A6E5E;width:140px;">Nombre</td>
                  <td style="padding:6px 0;font-size:13px;color:#1A1208;font-weight:500;">${data.firstName} ${data.lastName}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#7A6E5E;">Email</td>
                  <td style="padding:6px 0;font-size:13px;color:#1A1208;"><a href="mailto:${data.email}" style="color:#3A5A3A;">${data.email}</a></td>
                </tr>
                ${data.phone ? `
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#7A6E5E;">Teléfono</td>
                  <td style="padding:6px 0;font-size:13px;color:#1A1208;"><a href="tel:${data.phone}" style="color:#3A5A3A;">${data.phone}</a></td>
                </tr>` : ""}
                <tr><td colspan="2" style="padding:16px 0 16px;border-bottom:1px solid #E8E4DC;">
                  <p style="margin:0;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#3A5A3A;font-weight:500;">Datos de la cita</p>
                </td></tr>
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#7A6E5E;">Servicio</td>
                  <td style="padding:6px 0;font-size:13px;color:#1A1208;font-weight:500;">${data.serviceLabel}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#7A6E5E;">Fecha preferida</td>
                  <td style="padding:6px 0;font-size:13px;color:#1A1208;">${data.preferredDate}</td>
                </tr>
                ${data.preferredTime ? `
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#7A6E5E;">Hora preferida</td>
                  <td style="padding:6px 0;font-size:13px;color:#1A1208;">${data.preferredTime}</td>
                </tr>` : ""}
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#7A6E5E;">Modalidad</td>
                  <td style="padding:6px 0;font-size:13px;color:#1A1208;">${modalityLabel}</td>
                </tr>
                ${data.message ? `
                <tr>
                  <td colspan="2" style="padding:12px 0 0;">
                    <p style="margin:0 0 4px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#7A6E5E;">Mensaje del cliente</p>
                    <p style="margin:0;font-size:13px;color:#1A1208;font-style:italic;">"${data.message}"</p>
                  </td>
                </tr>` : ""}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;background:#F5F2EC;text-align:center;">
              <p style="margin:0;font-size:11px;color:#A09080;letter-spacing:1px;">Accede al CRM para gestionar esta solicitud</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const transporter = getTransporter();

  if (!transporter) {
    console.log("[Email DEV] Admin notification email:");
    console.log(`  To: ${ADMIN_EMAIL}`);
    console.log(`  Subject: ${subject}`);
    return;
  }

  await transporter.sendMail({
    from: SMTP_FROM,
    to: ADMIN_EMAIL,
    subject,
    html,
  });
}
