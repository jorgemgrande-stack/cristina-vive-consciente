/**
 * Módulos con datos de salud o emocionales:
 *   - first_visit: ficha de primera visita (motivo, alergias, circunstancias para la sesión, zonas a evitar…)
 *   - emotional:   acompañamiento emocional (relato del cliente, observaciones, seguimiento)
 *
 * Operativos cuando el servidor puede cifrarlos. El único requisito de configuración es técnico:
 *
 *   SENSITIVE_DATA_KEY=<32 bytes en base64>   clave de cifrado de la aplicación (AES-256-GCM)
 *   SENSITIVE_KEY_VERSION=<p. ej. k1>         versión de la clave (opcional, por defecto «k1»; sirve para rotarla)
 *
 * Sin clave válida el servidor no puede cifrar ni descifrar, y rechaza leer o guardar esos datos.
 * El resto de salvaguardas no dependen de la configuración: consentimiento explícito vigente por módulo
 * (comprobado en el servidor antes de guardar), cifrado, rol de administración, auditoría sin contenido,
 * exportación, supresión y revisión periódica (ver docs/PRIVACIDAD_FICHAS.md).
 */

export const SENSITIVE_MODULES = ["first_visit", "emotional"] as const;
export type SensitiveModule = (typeof SENSITIVE_MODULES)[number];

export type ModuleReadiness = {
  module: SensitiveModule;
  enabled: boolean;
  /** Requisitos técnicos sin cumplir (nombres de variables, sin valores) */
  missing: string[];
};

type Env = Record<string, string | undefined>;

function keyIsValid(raw: string | undefined): boolean {
  if (!raw) return false;
  try {
    return Buffer.from(raw, "base64").length === 32;
  } catch {
    return false;
  }
}

export function moduleReadiness(module: SensitiveModule, env: Env = process.env): ModuleReadiness {
  const missing = keyIsValid(env.SENSITIVE_DATA_KEY) ? [] : ["SENSITIVE_DATA_KEY"];
  return { module, enabled: missing.length === 0, missing };
}

export function allModulesReadiness(env: Env = process.env): ModuleReadiness[] {
  return SENSITIVE_MODULES.map((m) => moduleReadiness(m, env));
}

export const keyVersion = (env: Env = process.env) => env.SENSITIVE_KEY_VERSION?.trim() || "k1";
