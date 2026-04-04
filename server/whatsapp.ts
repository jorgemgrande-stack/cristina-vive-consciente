/**
 * WhatsApp Helper — Cristina Vive Consciente
 *
 * ESTRATEGIA ACTUAL: Notificaciones al admin mediante wa.me links.
 * Cuando el servidor detecta un evento (reserva, lead, compra), genera
 * un enlace wa.me con el mensaje pre-rellenado y lo registra en automation_logs.
 *
 * Sin WhatsApp Business API, el envío automático al admin no es posible
 * (WhatsApp no permite envíos server-side sin API oficial). Sin embargo,
 * el sistema registra cada notificación pendiente en la BD y genera el
 * enlace para que Cristina pueda abrirlo directamente desde el CRM.
 *
 * ACTIVACIÓN FUTURA con WhatsApp Business API:
 * - Añadir WHATSAPP_API_TOKEN y WHATSAPP_PHONE_ID como secrets
 * - El bloque de envío real se activará automáticamente
 */

import { getDb } from "./db";
import { automationLogs } from "../drizzle/schema";

const WHATSAPP_ADMIN_NUMBER = process.env.WHATSAPP_ADMIN_NUMBER ?? "34657165343";

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export interface WhatsAppBookingData {
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  serviceLabel: string;
  preferredDate: string;
  preferredTime?: string;
  modality: string;
  notes?: string;
}

export interface WhatsAppLeadData {
  firstName: string;
  lastName?: string;
  phone?: string;
  email?: string;
  message?: string;
  interest?: string;
}

export interface WhatsAppPurchaseData {
  firstName: string;
  lastName?: string;
  email: string;
  productName: string;
  amount: string;
}

// ─── GENERADORES DE MENSAJES ──────────────────────────────────────────────────

export function generateAdminBookingNotification(data: WhatsAppBookingData): string {
  return [
    `🌿 *Nueva solicitud de cita*`,
    ``,
    `👤 ${data.firstName} ${data.lastName}`,
    data.phone ? `📱 ${data.phone}` : "",
    data.email ? `📧 ${data.email}` : "",
    ``,
    `📋 Servicio: ${data.serviceLabel}`,
    `📅 Fecha preferida: ${data.preferredDate}${data.preferredTime ? ` a las ${data.preferredTime}` : ""}`,
    `💻 Modalidad: ${data.modality}`,
    data.notes ? `📝 Notas: ${data.notes}` : "",
    ``,
    `Accede al CRM → cristinaviveconsciente.es/crm`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function generateAdminLeadNotification(data: WhatsAppLeadData): string {
  return [
    `🌱 *Nuevo lead / contacto*`,
    ``,
    `👤 ${data.firstName}${data.lastName ? ` ${data.lastName}` : ""}`,
    data.phone ? `📱 ${data.phone}` : "",
    data.email ? `📧 ${data.email}` : "",
    data.interest ? `💡 Interés: ${data.interest}` : "",
    data.message ? `💬 Mensaje: "${data.message?.substring(0, 120)}${(data.message?.length ?? 0) > 120 ? "…" : ""}"` : "",
    ``,
    `Accede al CRM → cristinaviveconsciente.es/crm/clientes`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function generateAdminPurchaseNotification(data: WhatsAppPurchaseData): string {
  return [
    `💚 *Nueva compra de ebook*`,
    ``,
    `👤 ${data.firstName}${data.lastName ? ` ${data.lastName}` : ""}`,
    `📧 ${data.email}`,
    ``,
    `📖 Producto: ${data.productName}`,
    `💶 Importe: ${data.amount}`,
    ``,
    `El PDF se ha enviado automáticamente al cliente.`,
    `Accede al CRM → cristinaviveconsciente.es/crm`,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Genera la URL de wa.me para el cliente (para que contacte a Cristina).
 */
export function generateBookingWhatsAppUrl(data: WhatsAppBookingData): string {
  const text = [
    `Hola Cristina, acabo de solicitar una cita de ${data.serviceLabel}`,
    `para el ${data.preferredDate}${data.preferredTime ? ` a las ${data.preferredTime}` : ""}.`,
    `Modalidad: ${data.modality}.`,
    `Quedo a la espera de tu confirmación. Gracias 🌿`,
  ].join(" ");
  return `https://wa.me/${WHATSAPP_ADMIN_NUMBER}?text=${encodeURIComponent(text)}`;
}

// ─── ENVÍO / REGISTRO DE NOTIFICACIONES ──────────────────────────────────────

/**
 * Intenta enviar un mensaje de WhatsApp al admin.
 *
 * - Si hay WhatsApp Business API configurada: envía el mensaje directamente.
 * - Si no: genera el enlace wa.me y lo registra en automation_logs para
 *   que Cristina pueda acceder desde el CRM.
 */
export async function notifyAdminWhatsApp(
  event: "booking" | "lead" | "purchase",
  message: string,
  recipientInfo: string
): Promise<{ sent: boolean; waUrl: string; note: string }> {
  const apiToken = process.env.WHATSAPP_API_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;

  const waUrl = `https://wa.me/${WHATSAPP_ADMIN_NUMBER}?text=${encodeURIComponent(message)}`;

  // Intentar envío con WhatsApp Business API si está configurada
  if (apiToken && phoneId) {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${phoneId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: WHATSAPP_ADMIN_NUMBER,
            type: "text",
            text: { body: message },
          }),
        }
      );

      if (response.ok) {
        // Registrar envío exitoso
        const dbInst = await getDb();
        const eventKey = `whatsapp_${event}` as "whatsapp_booking" | "whatsapp_lead" | "whatsapp_purchase";
        await dbInst?.insert(automationLogs).values({
          event: eventKey,
          channel: "whatsapp",
          recipientPhone: WHATSAPP_ADMIN_NUMBER,
          status: "sent",
          subject: recipientInfo.substring(0, 300),
          sentAt: Date.now(),
        }).catch(() => {});

        return { sent: true, waUrl, note: "Enviado via WhatsApp Business API" };
      }
    } catch (err) {
      console.error("[WhatsApp API] Error:", err);
    }
  }

  // Sin API: registrar como pendiente con el enlace wa.me
  const dbInst2 = await getDb();
  const eventKey2 = `whatsapp_${event}` as "whatsapp_booking" | "whatsapp_lead" | "whatsapp_purchase";
  await dbInst2?.insert(automationLogs).values({
    event: eventKey2,
    channel: "whatsapp",
    recipientPhone: WHATSAPP_ADMIN_NUMBER,
    status: "pending",
    subject: recipientInfo.substring(0, 300),
    errorMessage: `wa.me link: ${waUrl.substring(0, 400)}`,
    sentAt: Date.now(),
  }).catch(() => {});

  console.log(`[WhatsApp] Notificación generada para admin (${event}): ${message.substring(0, 80)}...`);

  return {
    sent: false,
    waUrl,
    note: "Enlace wa.me generado (API no configurada). Disponible en CRM → Automatizaciones.",
  };
}

/**
 * Notifica al admin sobre una nueva reserva.
 */
export async function notifyAdminNewBooking(data: WhatsAppBookingData) {
  const message = generateAdminBookingNotification(data);
  return notifyAdminWhatsApp(
    "booking",
    message,
    `${data.firstName} ${data.lastName} (${data.phone ?? data.email ?? "sin contacto"})`
  );
}

/**
 * Notifica al admin sobre un nuevo lead.
 */
export async function notifyAdminNewLead(data: WhatsAppLeadData) {
  const message = generateAdminLeadNotification(data);
  return notifyAdminWhatsApp(
    "lead",
    message,
    `${data.firstName}${data.lastName ? ` ${data.lastName}` : ""} (${data.email ?? data.phone ?? "sin contacto"})`
  );
}

/**
 * Notifica al admin sobre una nueva compra de ebook.
 */
export async function notifyAdminNewPurchase(data: WhatsAppPurchaseData) {
  const message = generateAdminPurchaseNotification(data);
  return notifyAdminWhatsApp(
    "purchase",
    message,
    `${data.firstName} (${data.email})`
  );
}
