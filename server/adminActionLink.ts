/**
 * adminActionLink.ts — enlaces firmados del aviso a Cristina (Aceptar / Declinar / Posponer).
 *
 * El aviso de una solicitud lleva un enlace `https://…/a/<token>` que abre una página con los datos de la
 * cita y los tres botones, sin entrar al CRM. El token NO se guarda en la base de datos: es
 * `<idCita>.<caducidad>.<firma HMAC-SHA256>` firmado con el secreto del servidor (JWT_SECRET).
 *
 * Seguridad
 * - Sin secreto configurado no se generan enlaces (el aviso sigue funcionando sin botones).
 * - La firma se compara en tiempo constante; un token alterado o caducado no es válido.
 * - El token solo identifica la cita: las acciones están además limitadas a citas "pending" y pasan por
 *   las mismas transiciones de estado que el CRM, así que un enlace reutilizado no cambia una cita ya resuelta.
 * - La página ejecuta las acciones con un POST tras pulsar un botón (abrir el enlace no cambia nada).
 */
import crypto from "crypto";

export const ADMIN_LINK_TTL_DAYS = 14;
const PURPOSE = "admin-action-link:v1";

function key(secret: string): string {
  return `${PURPOSE}:${secret}`;
}

function sign(payload: string, secret: string): string {
  return crypto.createHmac("sha256", key(secret)).update(payload).digest("base64url");
}

export function signAdminActionToken(appointmentId: number, secret: string, now: number = Date.now(), ttlDays: number = ADMIN_LINK_TTL_DAYS): string {
  const exp = Math.floor(now / 1000) + ttlDays * 24 * 3600;
  const payload = `${appointmentId}.${exp}`;
  return `${payload}.${sign(payload, secret)}`;
}

/** Devuelve el id de la cita si el token es auténtico y no ha caducado; si no, null. */
export function verifyAdminActionToken(token: string, secret: string, now: number = Date.now()): { appointmentId: number } | null {
  if (!secret || typeof token !== "string" || token.length > 200) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [idStr, expStr, sig] = parts;
  if (!/^\d{1,10}$/.test(idStr) || !/^\d{1,12}$/.test(expStr)) return null;
  const expected = sign(`${idStr}.${expStr}`, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  if (Number(expStr) * 1000 < now) return null;
  return { appointmentId: Number(idStr) };
}

/** URL pública del enlace del aviso, o null si no hay secreto configurado. */
export function buildAdminActionUrl(appointmentId: number, secret: string | undefined, baseUrl: string, now: number = Date.now()): string | null {
  if (!secret) return null;
  return `${baseUrl}/a/${signAdminActionToken(appointmentId, secret, now)}`;
}
