/**
 * Cifrado de aplicación para datos de categoría especial: AES-256-GCM (confidencialidad + integridad).
 * - La clave viene del entorno (SENSITIVE_DATA_KEY, 32 bytes en base64); nunca del repositorio.
 * - Cada registro se liga a su cliente y módulo como datos autenticados (AAD): un texto cifrado copiado a
 *   otra ficha o a otro módulo no se descifra.
 * - Formato: "v1.<iv base64url>.<tag base64url>.<texto cifrado base64url>". Nunca se registra el contenido.
 */
import crypto from "node:crypto";

const ALG = "aes-256-gcm";

function getKey(env: Record<string, string | undefined> = process.env): Buffer {
  const raw = env.SENSITIVE_DATA_KEY;
  const key = raw ? Buffer.from(raw, "base64") : Buffer.alloc(0);
  if (key.length !== 32) throw new Error("Clave de cifrado no configurada");
  return key;
}

const aad = (clientId: number, module: string) => Buffer.from(`cvc:${module}:${clientId}`, "utf8");

export function encryptPayload(payload: unknown, clientId: number, module: string, env?: Record<string, string | undefined>): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALG, getKey(env), iv);
  cipher.setAAD(aad(clientId, module));
  const ct = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), ct.toString("base64url")].join(".");
}

export function decryptPayload<T = unknown>(blob: string, clientId: number, module: string, env?: Record<string, string | undefined>): T {
  const [v, iv, tag, ct] = blob.split(".");
  if (v !== "v1" || !iv || !tag || !ct) throw new Error("Formato de cifrado no reconocido");
  const decipher = crypto.createDecipheriv(ALG, getKey(env), Buffer.from(iv, "base64url"));
  decipher.setAAD(aad(clientId, module));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  const pt = Buffer.concat([decipher.update(Buffer.from(ct, "base64url")), decipher.final()]);
  return JSON.parse(pt.toString("utf8")) as T;
}
