/**
 * Correo de entrega del cuento de una promoción (plantilla de Cristina, HTML tal cual con marcadores {{…}} y {{#if …}}).
 * El PDF NO se adjunta: el botón abre el enlace personal de la promoción.
 */
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
        {{#if mostrar_servicios}}
        <tr><td class="content" align="center" style="padding:26px 32px;background-color:#edf1e8;border-top:1px solid #e7ddcf;">
          <h2 style="margin:0 0 9px;font:400 26px/1.25 Georgia,serif;color:#24482c;">Nos vemos en Instagram</h2>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#28221a;">Allí comparto recursos y reflexiones para vivir de forma más consciente.</p>
          <table role="presentation" align="center" cellspacing="0" cellpadding="0">
            <tr><td align="center" bgcolor="#315839" style="mso-padding-alt:14px 22px;">
              <a href="https://www.instagram.com/cristina.viveconsciente/" style="display:inline-block;padding:14px 22px;background-color:#315839;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;mso-padding-alt:0;">Seguir a Cristina en Instagram</a>
            </td></tr>
          </table>
          <p style="margin:10px 0 0;font-size:13px;line-height:1.4;color:#3e4a3b;">@cristina.viveconsciente</p>
        </td></tr>
        <tr><td class="content" style="padding:26px 32px 20px;border-top:1px solid #e7ddcf;">
          <h2 style="margin:0 0 16px;font:400 25px/1.25 Georgia,serif;color:#24482c;">¿Te apetece conocer mi trabajo?</h2>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td class="column service" width="50%" valign="top" style="padding-right:6px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#edf1e8;"><tr><td style="padding:16px;">
                  <h3 style="margin:0 0 6px;font:400 22px/1.25 Georgia,serif;">Consultas</h3>
                  <p style="margin:0 0 10px;font-size:14px;line-height:1.55;">Sesiones individuales para revisar tus hábitos y encontrar pasos que encajen en tu día a día.</p>
                  <a href="https://cristinaviveconsciente.es/consultas" style="font-size:14px;font-weight:bold;color:#24482c;text-decoration:underline;">Ver consultas</a>
                </td></tr></table>
              </td>
              <td class="column service" width="50%" valign="top" style="padding-left:6px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#edf1e8;"><tr><td style="padding:16px;">
                  <h3 style="margin:0 0 6px;font:400 22px/1.25 Georgia,serif;">Masajes</h3>
                  <p style="margin:0 0 10px;font-size:14px;line-height:1.55;">Un rato para ti, con sesiones de masaje y aceites esenciales.</p>
                  <a href="https://cristinaviveconsciente.es/masajes" style="font-size:14px;font-weight:bold;color:#24482c;text-decoration:underline;">Ver masajes</a>
                </td></tr></table>
              </td>
            </tr>
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
  const html = renderTemplate(tpl, {
    portada_url: i.coverUrl ?? "",
    descarga_url: i.downloadUrl,
    caducidad_texto: i.expiryText,
    nombre: i.name,
    mostrar_servicios: i.showServices,
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
    ...(i.showServices ? ["Nos vemos en Instagram", "Allí comparto recursos y reflexiones para vivir de forma más consciente.", "Seguir a Cristina en Instagram: https://www.instagram.com/cristina.viveconsciente/", "", "¿Te apetece conocer mi trabajo?", "Consultas: https://cristinaviveconsciente.es/consultas", "Masajes: https://cristinaviveconsciente.es/masajes", ""] : []),
    "Recibes este correo porque solicitaste el cuento en Cristina Vive Consciente.",
    "Política de privacidad: https://cristinaviveconsciente.es/privacidad",
    ...(i.showServices && i.unsubscribeUrl ? [`Dejar de recibir información comercial: ${i.unsubscribeUrl}`] : []),
  ].join("\n");
  return { subject: `Tu cuento de regalo · ${i.ebookTitle}`, html, text };
}
