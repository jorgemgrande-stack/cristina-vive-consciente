/**
 * Endurecimiento del acceso de administración (el CRM puede contener datos de clientes).
 * - Comparación de credenciales en tiempo constante.
 * - Límite de intentos fallidos por IP (en memoria; suficiente para una única instancia).
 * - Cookie de sesión httpOnly, sameSite=lax y secure en producción.
 */
import crypto from "node:crypto";

export function safeEqual(a: string, b: string): boolean {
  // Se comparan resúmenes de longitud fija para no revelar la longitud del valor esperado
  const ha = crypto.createHash("sha256").update(a, "utf8").digest();
  const hb = crypto.createHash("sha256").update(b, "utf8").digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function clientIp(req: { headers: Record<string, unknown>; ip?: string; socket?: { remoteAddress?: string } }): string {
  const fwd = req.headers["x-forwarded-for"];
  const first = (Array.isArray(fwd) ? fwd[0] : typeof fwd === "string" ? fwd : "").split(",")[0].trim();
  return first || req.ip || req.socket?.remoteAddress || "desconocida";
}

export function createLoginLimiter({ maxFailures = 5, windowMs = 15 * 60 * 1000, now = () => Date.now() } = {}) {
  const failures = new Map<string, number[]>();
  const recent = (key: string) => (failures.get(key) ?? []).filter((t) => now() - t < windowMs);
  return {
    isBlocked: (key: string) => recent(key).length >= maxFailures,
    fail: (key: string) => {
      const list = recent(key);
      list.push(now());
      failures.set(key, list);
    },
    reset: (key: string) => void failures.delete(key),
  };
}

export const loginLimiter = createLoginLimiter();

/** 30 días (antes 1 año): reduce el riesgo de un dispositivo olvidado con la sesión abierta. */
export const ADMIN_SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;

export function adminSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: ADMIN_SESSION_MAX_AGE_MS,
    path: "/",
  };
}
