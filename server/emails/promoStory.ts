/**
 * Correo de entrega del cuento de una promoción (plantilla de Cristina, HTML tal cual con marcadores {{…}} y {{#if …}}).
 * El PDF NO se adjunta: el botón abre el enlace personal de la promoción.
 */
import { PRINTED_STORY_EBOOK_SLUG, PRINTED_STORY_PRICE_CENTS, PRINTED_STORY_SHIPS_FROM } from "../../shared/printedStory";
import { formatEurosFixed } from "../../shared/orders";
import { escapeHtml } from "../ebookPages";

export const PROMO_STORY_TEMPLATE = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Tu cuento de regalo · Los cuatro regalos de la Tierra</title>
  <style>
    @media only screen and (max-width: 520px) {
      .content { padding-left: 22px !important; padding-right: 22px !important; }
      .column { display: block !important; width: 100% !important; }
      .cover { padding: 8px 0 28px !important; }
      .cover img { margin: 0 auto !important; }
      .service { padding: 0 0 12px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f3eee5;color:#28221a;font-family:Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">Descarga el cuento ilustrado de Cristina y guárdalo para leerlo en familia.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f3eee5;">
    <tr><td align="center" style="padding:22px 10px;">
      <!--[if mso]><table role="presentation" width="620" cellspacing="0" cellpadding="0"><tr><td><![endif]-->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background-color:#fcfaf6;">
        <tr><td align="center" style="padding:25px;border-bottom:1px solid #e7ddcf;">
          <a href="https://cristinaviveconsciente.es/" style="font-family:Georgia,serif;font-size:24px;color:#24482c;text-decoration:none;">Cristina Vive Consciente</a>
        </td></tr>
        <tr><td class="content" style="padding:34px 32px 32px;background-color:#f6eddf;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td class="column cover" width="37%" valign="middle" style="padding-right:24px;">
                <img src="{{portada_url}}" alt="Portada de Los cuatro regalos de la Tierra" width="180" style="display:block;width:100%;max-width:180px;height:auto;color:#3d392f;font-size:14px;">
              </td>
              <td class="column" width="63%" valign="middle">
                <h1 style="margin:0 0 14px;font:400 34px/1.08 Georgia,serif;color:#28221a;">Hay regalos que <em style="color:#315839;">no se envuelven.</em></h1>
                <p style="margin:0 0 21px;font:400 19px/1.35 Georgia,serif;">Los cuatro regalos de la Tierra</p>
                <table role="presentation" cellspacing="0" cellpadding="0">
                  <tr><td bgcolor="#24482c" style="mso-padding-alt:14px 21px;">
                    <a href="{{descarga_url}}" style="display:inline-block;padding:14px 21px;background-color:#24482c;color:#ffffff;font-weight:bold;font-size:15px;text-decoration:none;mso-padding-alt:0;">Descargar mi cuento</a>
                  </td></tr>
                </table>
                {{#if caducidad_texto}}<p style="margin:12px 0 0;font-size:13px;line-height:1.5;color:#4e4539;">{{caducidad_texto}}</p>{{/if}}
              </td>
            </tr>
          </table>
        </td></tr>
        <tr><td class="content" style="padding:26px 32px;font-size:16px;line-height:1.65;">
          <p style="margin:0 0 12px;">Hola, {{nombre}}:</p>
          <p style="margin:0 0 12px;">Gracias por llevarte a casa mi primer cuento ilustrado. Te lo dejo aquí para que lo tengas a mano cuando os apetezca leerlo en familia.</p>
          <p style="margin:0 0 12px;">Ojalá encontréis un ratito tranquilo para leerlo juntos.</p>
          <p style="margin:0;">Un abrazo,<br><strong>Cristina</strong></p>
        </td></tr>
        {{#if mostrar_impreso}}
        <tr>
          <td style="background-color:#e7eee4;padding:25px 32px;border-top:1px solid #d5dfd1;">
            <p style="margin:0 0 7px;color:#315839;font:700 11px/1.4 Arial,sans-serif;letter-spacing:1.5px;text-transform:uppercase;">Reserva abierta</p>
            <h2 style="margin:0 0 8px;color:#24482c;font:400 26px/1.2 Georgia,serif;">El cuento, también en papel</h2>
            <p style="margin:0 0 17px;color:#293b2b;font:15px/1.5 Arial,sans-serif;">{{impreso_detalle}}</p>
            <table role="presentation" cellpadding="0" cellspacing="0"><tr><td bgcolor="#24482c" style="padding:13px 18px;">
              <a href="{{impreso_url}}" style="color:#ffffff;text-decoration:none;font:700 14px/1.4 Arial,sans-serif;">Reservar la edición impresa</a>
            </td></tr></table>
          </td>
        </tr>
        {{/if}}

        {{#if mostrar_servicios}}
        <tr><td class="content" align="center" style="padding:26px 32px;background-color:#edf1e8;border-top:1px solid #e7ddcf;">
          <h2 style="margin:0 0 9px;font:400 26px/1.25 Georgia,serif;color:#24482c;">Sígueme en Instagram</h2>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#28221a;">Allí comparto recursos y reflexiones para vivir de forma más consciente.</p>
          <table role="presentation" align="center" cellspacing="0" cellpadding="0">
            <tr><td align="center" bgcolor="#902461" style="background-color:#902461;background-image:linear-gradient(110deg,#8134af,#ae185d,#a53e21);mso-padding-alt:14px 22px;">
              <a href="https://www.instagram.com/cristina.viveconsciente/" style="display:inline-block;padding:14px 22px;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;mso-padding-alt:0;">Seguir a Cristina en Instagram</a>
            </td></tr>
          </table>
          <p style="margin:10px 0 0;font-size:13px;line-height:1.4;color:#3e4a3b;">@cristina.viveconsciente</p>
        </td></tr>
        <tr><td class="content" style="padding:26px 32px 15px;border-top:1px solid #e7ddcf;">
          <h2 style="margin:0 0 16px;font:400 26px/1.25 Georgia,serif;color:#24482c;">Conoce mi trabajo</h2>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr><td style="padding:0 0 10px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#edf1e8" style="background-color:#edf1e8;">
                <tr>
                  <td class="service-photo" width="160" valign="middle" style="padding:16px 0 16px 16px;">
                    <img src="https://cristinaviveconsciente.es/site/email/masajes.jpg" alt="Sesión de masaje integrativo" width="160" style="display:block;width:100%;max-width:160px;height:auto;border-radius:4px;font-size:12px;color:#28221a;">
                  </td>
                  <td class="service-copy" valign="middle" style="padding:16px 18px;">
                    <h3 style="margin:0 0 6px;font:400 21px/1.25 Georgia,serif;color:#28221a;">Masajes integrativos</h3>
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.55;color:#28221a;">Sesiones de masaje y bienestar corporal con aceites esenciales.</p>
                    <a href="https://cristinaviveconsciente.es/masajes" style="display:inline-block;padding:4px 0;font-size:14px;font-weight:bold;color:#24482c;text-decoration:underline;">Ver masajes</a>
                  </td>
                </tr>
              </table>
            </td></tr>
            <tr><td style="padding:0 0 10px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#edf1e8" style="background-color:#edf1e8;">
                <tr>
                  <td class="service-photo" width="160" valign="middle" style="padding:16px 0 16px 16px;">
                    <img src="https://cristinaviveconsciente.es/site/email/consultas.jpg" alt="Consultas de Cristina Vive Consciente" width="160" style="display:block;width:100%;max-width:160px;height:auto;border-radius:4px;font-size:12px;color:#28221a;">
                  </td>
                  <td class="service-copy" valign="middle" style="padding:16px 18px;">
                    <h3 style="margin:0 0 6px;font:400 21px/1.25 Georgia,serif;color:#28221a;">Consultas</h3>
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.55;color:#28221a;">Sesiones individuales para revisar tus hábitos y encontrar pasos que encajen en tu día a día.</p>
                    <a href="https://cristinaviveconsciente.es/consultas" style="display:inline-block;padding:4px 0;font-size:14px;font-weight:bold;color:#24482c;text-decoration:underline;">Ver consultas</a>
                  </td>
                </tr>
              </table>
            </td></tr>
            <tr><td style="padding:0 0 10px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#edf1e8" style="background-color:#edf1e8;">
                <tr>
                  <td class="service-photo" width="160" valign="middle" style="padding:16px 0 16px 16px;">
                    <img src="https://cristinaviveconsciente.es/site/email/sistemas-agua.jpg" alt="Sistemas de agua para el hogar" width="160" style="display:block;width:100%;max-width:160px;height:auto;border-radius:4px;font-size:12px;color:#28221a;">
                  </td>
                  <td class="service-copy" valign="middle" style="padding:16px 18px;">
                    <h3 style="margin:0 0 6px;font:400 21px/1.25 Georgia,serif;color:#28221a;">Asesoramiento en máquinas de ósmosis</h3>
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.55;color:#28221a;">Te ayudo a comparar sistemas de ósmosis para el agua de casa y a elegir el que mejor encaje contigo.</p>
                    <a href="https://cristinaviveconsciente.es/sistemas-agua" style="display:inline-block;padding:4px 0;font-size:14px;font-weight:bold;color:#24482c;text-decoration:underline;">Ver asesoramiento</a>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </td></tr>
        {{/if}}
        <tr><td class="content" align="center" style="padding:20px 32px;border-top:1px solid #e7ddcf;font-size:12px;line-height:1.6;color:#574f43;">
          Recibes este correo porque solicitaste el cuento en Cristina Vive Consciente.<br>
          <a href="https://cristinaviveconsciente.es/privacidad" style="color:#24482c;">Política de privacidad</a>
          {{#if mostrar_servicios}} · <a href="{{baja_url}}" style="color:#24482c;">Dejar de recibir información comercial</a>{{/if}}
        </td></tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td></tr>
  </table>
</body>
</html>
`;

type Vars = Record<string, string | boolean | undefined>;

/** Bloques «{{#if x}}…{{/if}}» (sin anidar) y variables «{{x}}» con el HTML escapado. */
export function renderTemplate(tpl: string, vars: Vars): string {
  const out = tpl.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_m, k: string, body: string) => (vars[k] ? body : ""));
  return out.replace(/\{\{(\w+)\}\}/g, (_m, k: string) => escapeHtml(String(vars[k] ?? "")));
}

export interface PromoStoryInput {
  name: string;
  ebookTitle: string;
  /** Titular de la promoción: la línea 1 es el texto normal y el resto va en cursiva verde */
  headline: string;
  coverUrl: string | null;
  downloadUrl: string;
  /** Texto con la fecha o el plazo real de validez del enlace; vacío si no caduca */
  expiryText: string;
  showServices: boolean;
  printedShippingCents?: number | null;
  unsubscribeUrl?: string;
}

export function buildPromoStoryEmail(i: PromoStoryInput): { subject: string; html: string; text: string } {
  const [line1, ...rest] = i.headline.split("\n");
  const line2 = rest.join(" ").trim();
  let tpl = PROMO_STORY_TEMPLATE
    .replace(/<title>[\s\S]*?<\/title>/, () => `<title>${escapeHtml(`Tu cuento de regalo · ${i.ebookTitle}`)}</title>`)
    .replace('alt="Portada de Los cuatro regalos de la Tierra"', () => `alt="${escapeHtml(`Portada de ${i.ebookTitle}`)}"`)
    .replace('<p style="margin:0 0 21px;font:400 19px/1.35 Georgia,serif;">Los cuatro regalos de la Tierra</p>', () => `<p style="margin:0 0 21px;font:400 19px/1.35 Georgia,serif;">${escapeHtml(i.ebookTitle)}</p>`)
    .replace(
      'Hay regalos que <em style="color:#315839;">no se envuelven.</em>',
      () => (line2 ? `${escapeHtml(line1.trim())} <em style="color:#315839;">${escapeHtml(line2)}</em>` : escapeHtml(line1.trim())),
    );
  // Sin portada, la celda de la imagen no se pinta (no se deja un hueco roto)
  if (!i.coverUrl) tpl = tpl.replace(/<td class="column cover"[\s\S]*?<\/td>\s*/, "");
  const showPrinted = i.showServices && i.printedShippingCents != null;
  const printedUrl = `https://cristinaviveconsciente.es/guias-digitales/${PRINTED_STORY_EBOOK_SLUG}#edicion-impresa`;
  const printedDetail = i.printedShippingCents == null ? "" :
    `${formatEurosFixed(PRINTED_STORY_PRICE_CENTS)} + ${formatEurosFixed(i.printedShippingCents)} de envío a España peninsular. Envíos desde Segovia a partir del ${PRINTED_STORY_SHIPS_FROM}.`;
  const html = renderTemplate(tpl, {
    portada_url: i.coverUrl ?? "",
    descarga_url: i.downloadUrl,
    caducidad_texto: i.expiryText,
    nombre: i.name,
    mostrar_servicios: i.showServices,
    mostrar_impreso: showPrinted,
    impreso_url: printedUrl,
    impreso_detalle: printedDetail,
    baja_url: i.unsubscribeUrl ?? "",
  });
  const text = [
    `Hola, ${i.name}:`,
    "",
    "Gracias por llevarte a casa mi primer cuento ilustrado. Te lo dejo aquí para que lo tengas a mano cuando os apetezca leerlo en familia.",
    "",
    `Descargar mi cuento: ${i.downloadUrl}`,
    ...(i.expiryText ? [i.expiryText] : []),
    "",
    "Ojalá encontréis un ratito tranquilo para leerlo juntos.",
    "",
    "Un abrazo,",
    "Cristina",
    "",
    ...(showPrinted ? ["El cuento, también en papel", printedDetail, `Reservar la edición impresa: ${printedUrl}`, ""] : []),
    ...(i.showServices ? ["Sígueme en Instagram", "Allí comparto recursos y reflexiones para vivir de forma más consciente.", "Seguir a Cristina en Instagram: https://www.instagram.com/cristina.viveconsciente/", "", "Conoce mi trabajo", "Masajes integrativos (sesiones de masaje y bienestar corporal con aceites esenciales): https://cristinaviveconsciente.es/masajes", "Consultas (sesiones individuales para revisar tus hábitos): https://cristinaviveconsciente.es/consultas", "Asesoramiento en máquinas de ósmosis: https://cristinaviveconsciente.es/sistemas-agua", ""] : []),
    "Recibes este correo porque solicitaste el cuento en Cristina Vive Consciente.",
    "Política de privacidad: https://cristinaviveconsciente.es/privacidad",
    ...(i.showServices && i.unsubscribeUrl ? [`Dejar de recibir información comercial: ${i.unsubscribeUrl}`] : []),
  ].join("\n");
  return { subject: `Tu cuento de regalo · ${i.ebookTitle}`, html, text };
}
