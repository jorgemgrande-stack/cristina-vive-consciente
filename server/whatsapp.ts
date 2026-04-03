/**
 * WhatsApp Helper — Cristina Vive Consciente
 *
 * ESTADO ACTUAL: Infraestructura preparada para activación futura.
 * Los mensajes se generan como URLs de wa.me (sin API).
 *
 * ACTIVACIÓN FUTURA:
 * Cuando se disponga de WhatsApp Business API (Meta Cloud API o Twilio),
 * añadir las credenciales como secrets y descomentar el bloque de envío real.
 *
 * Variables de entorno necesarias (futuro):
 * - WHATSAPP_API_TOKEN: Token de la API de WhatsApp Business
 * - WHATSAPP_PHONE_ID: ID del número de teléfono de WhatsApp Business
 * - WHATSAPP_ADMIN_NUMBER: Número de Cristina (sin +, ej: 34612345678)
 */

const WHATSAPP_ADMIN_NUMBER = process.env.WHATSAPP_ADMIN_NUMBER ?? "34600000000";

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export interface WhatsAppBookingData {
  firstName: string;
  lastName: string;
  phone?: string;
  serviceLabel: string;
  preferredDate: string;
  preferredTime?: string;
  modality: string;
}

// ─── GENERADORES DE MENSAJES ──────────────────────────────────────────────────

/**
 * Genera el texto del mensaje de WhatsApp para el cliente tras una reserva.
 * El cliente puede enviarlo a Cristina directamente.
 */
export function generateBookingWhatsAppText(data: WhatsAppBookingData): string {
  const lines = [
    `Hola Cristina, acabo de solicitar una cita de ${data.serviceLabel}`,
    `para el ${data.preferredDate}${data.preferredTime ? ` a las ${data.preferredTime}` : ""}.`,
    `Modalidad: ${data.modality}.`,
    `Quedo a la espera de tu confirmación. Gracias 🌿`,
  ];
  return lines.join(" ");
}

/**
 * Genera la URL de wa.me para que el cliente contacte a Cristina.
 * Funciona sin API — abre WhatsApp con el mensaje pre-rellenado.
 */
export function generateBookingWhatsAppUrl(data: WhatsAppBookingData): string {
  const text = generateBookingWhatsAppText(data);
  return `https://wa.me/${WHATSAPP_ADMIN_NUMBER}?text=${encodeURIComponent(text)}`;
}

/**
 * Genera el texto de notificación para el admin cuando llega una reserva.
 * Para uso futuro con WhatsApp Business API.
 */
export function generateAdminBookingNotification(data: WhatsAppBookingData): string {
  return [
    `🌿 *Nueva solicitud de cita*`,
    ``,
    `👤 ${data.firstName} ${data.lastName}`,
    data.phone ? `📱 ${data.phone}` : "",
    ``,
    `📋 Servicio: ${data.serviceLabel}`,
    `📅 Fecha: ${data.preferredDate}${data.preferredTime ? ` a las ${data.preferredTime}` : ""}`,
    `💻 Modalidad: ${data.modality}`,
    ``,
    `Accede al CRM para gestionar esta solicitud.`,
  ]
    .filter(Boolean)
    .join("\n");
}

// ─── ENVÍO REAL (FUTURO — WhatsApp Business API) ──────────────────────────────

/**
 * Envía un mensaje de WhatsApp usando la API de Meta Cloud.
 * DESACTIVADO hasta que se configuren las credenciales.
 *
 * Para activar:
 * 1. Crear cuenta en Meta for Developers
 * 2. Configurar WhatsApp Business API
 * 3. Añadir WHATSAPP_API_TOKEN y WHATSAPP_PHONE_ID como secrets
 * 4. Descomentar el código de abajo
 */
export async function sendWhatsAppMessage(
  _to: string,
  _message: string
): Promise<{ sent: boolean; note: string }> {
  const apiToken = process.env.WHATSAPP_API_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;

  if (!apiToken || !phoneId) {
    // Modo preparado: registrar en consola
    console.log(`[WhatsApp READY] To: ${_to}`);
    console.log(`[WhatsApp READY] Message: ${_message.substring(0, 100)}...`);
    return { sent: false, note: "WhatsApp API not configured yet. Message logged." };
  }

  // ─── Activar cuando se tengan las credenciales ───────────────────────────
  // try {
  //   const response = await fetch(
  //     `https://graph.facebook.com/v18.0/${phoneId}/messages`,
  //     {
  //       method: "POST",
  //       headers: {
  //         "Authorization": `Bearer ${apiToken}`,
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         messaging_product: "whatsapp",
  //         to: _to,
  //         type: "text",
  //         text: { body: _message },
  //       }),
  //     }
  //   );
  //   if (!response.ok) throw new Error(`WhatsApp API error: ${response.status}`);
  //   return { sent: true, note: "Message sent via WhatsApp Business API" };
  // } catch (err) {
  //   console.error("[WhatsApp] Send error:", err);
  //   return { sent: false, note: err instanceof Error ? err.message : "Unknown error" };
  // }

  return { sent: false, note: "WhatsApp API configured but sending disabled" };
}
