/**
 * Activación controlada de los módulos con datos de categoría especial (art. 9 RGPD):
 *   - first_visit: ficha de primera visita (alergias, salud relevante para la sesión, zonas, bienestar…)
 *   - emotional:   acompañamiento emocional (relato, emociones, historia familiar, objetivos…)
 *
 * DESACTIVADOS POR DEFECTO. Un módulo solo queda habilitado si TODO esto está configurado en el entorno
 * del servidor (nunca en el repositorio). Cada requisito corresponde a un punto de la lista de
 * preparación de docs/PRIVACIDAD_FICHAS.md, que debe estar resuelto ANTES de configurarlo:
 *
 *   SENSITIVE_FIRST_VISIT_ENABLED=true | SENSITIVE_EMOTIONAL_ENABLED=true   interruptor explícito por módulo
 *   SENSITIVE_DATA_KEY=<32 bytes en base64>        clave de cifrado de la aplicación (AES-256-GCM)
 *   SENSITIVE_KEY_VERSION=<p. ej. k1>              versión de la clave (para rotación)
 *   PRIVACY_REVIEW_REF=<referencia>                revisión de privacidad / EIPD completada (fecha o código del documento)
 *   PRIVACY_LEGAL_BASIS=explicit_consent           base elegida por Cristina con asesoramiento; la aplicación solo
 *                                                  implementa el consentimiento explícito (art. 9.2.a) como control
 *   PRIVACY_NOTICE_VERSION=<versión>               versión del texto informativo/consentimiento revisado por Cristina
 *
 * Si falta cualquiera, el módulo sigue bloqueado en el servidor (lectura, creación y modificación).
 */

export const SENSITIVE_MODULES = ["first_visit", "emotional"] as const;
export type SensitiveModule = (typeof SENSITIVE_MODULES)[number];

/** Bases implementadas como control técnico. Cualquier otra exige revisar el código antes de activarla. */
export const SUPPORTED_LEGAL_BASES = ["explicit_consent"] as const;

const FLAG: Record<SensitiveModule, string> = {
  first_visit: "SENSITIVE_FIRST_VISIT_ENABLED",
  emotional: "SENSITIVE_EMOTIONAL_ENABLED",
};

export type ModuleReadiness = {
  module: SensitiveModule;
  enabled: boolean;
  /** Requisitos sin cumplir (claves de configuración, sin valores) */
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
  const missing: string[] = [];
  if (env[FLAG[module]] !== "true") missing.push(FLAG[module]);
  if (!keyIsValid(env.SENSITIVE_DATA_KEY)) missing.push("SENSITIVE_DATA_KEY");
  if (!env.SENSITIVE_KEY_VERSION?.trim()) missing.push("SENSITIVE_KEY_VERSION");
  if (!env.PRIVACY_REVIEW_REF?.trim()) missing.push("PRIVACY_REVIEW_REF");
  if (!(SUPPORTED_LEGAL_BASES as readonly string[]).includes(env.PRIVACY_LEGAL_BASIS ?? "")) missing.push("PRIVACY_LEGAL_BASIS");
  if (!env.PRIVACY_NOTICE_VERSION?.trim()) missing.push("PRIVACY_NOTICE_VERSION");
  return { module, enabled: missing.length === 0, missing };
}

export function allModulesReadiness(env: Env = process.env): ModuleReadiness[] {
  return SENSITIVE_MODULES.map((m) => moduleReadiness(m, env));
}
