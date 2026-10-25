/**
 * «Mi consulta» de aceites esenciales: reglas compartidas por el formulario y el servidor.
 *
 * - Sin texto libre sobre objetivos o experiencia: solo opciones prácticas cerradas, para no invitar a
 *   escribir datos de salud en texto plano (se guardan sin cifrar y se notifican a Cristina).
 * - El consentimiento de privacidad se exige también en el servidor (`acceptPrivacy: true`); sin él no se
 *   acepta ni se guarda nada.
 * - Cualquier campo no previsto (p. ej. el antiguo `mensaje` libre) se descarta al validar.
 */
import { z } from "zod";

export const OIL_USES = [
  ["hogar", "Ambientar el hogar (difusor)"],
  ["limpieza", "Limpieza natural"],
  ["cosmetica", "Cosmética y cuidado de la piel"],
  ["aprender", "Aprender a usarlos con seguridad"],
  ["regalo", "Para regalar"],
  ["otro", "Otro: prefiero hablarlo con Cristina"],
] as const;

export const OIL_EXPERIENCE = [
  ["ninguna", "Nunca los he usado"],
  ["algo", "Los he probado alguna vez"],
  ["habitual", "Los uso con frecuencia"],
] as const;

type UseKey = (typeof OIL_USES)[number][0];
type ExperienceKey = (typeof OIL_EXPERIENCE)[number][0];
const useKeys = OIL_USES.map(([k]) => k) as [UseKey, ...UseKey[]];
const experienceKeys = OIL_EXPERIENCE.map(([k]) => k) as [ExperienceKey, ...ExperienceKey[]];

export const OIL_CONSULTATION_PRIVACY_REQUIRED = "Debes aceptar la política de privacidad para enviar la consulta.";

export const oilConsultationInput = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  apellidos: z.string().trim().max(120).optional(),
  email: z.string().trim().email("Email no válido").max(320),
  telefono: z.string().trim().max(30).optional(),
  provincia: z.string().trim().max(80).optional(),
  usos: z.array(z.enum(useKeys)).min(1, "Elige al menos un uso").max(OIL_USES.length),
  experiencia: z.enum(experienceKeys),
  /** JSON array de {id, name, slug} */
  productsList: z.string().max(10_000).optional(),
  acceptPrivacy: z.literal(true, { error: OIL_CONSULTATION_PRIVACY_REQUIRED }),
});
export type OilConsultationInput = z.infer<typeof oilConsultationInput>;

const label = (list: readonly (readonly [string, string])[], key: string) => list.find(([k]) => k === key)?.[1] ?? key;

/** Resumen legible para Cristina, construido solo con opciones cerradas (nunca con texto libre del visitante). */
export function buildOilConsultationMessage(input: Pick<OilConsultationInput, "apellidos" | "provincia" | "usos" | "experiencia">): string {
  return [
    input.apellidos ? `Apellidos: ${input.apellidos}` : null,
    input.provincia ? `Provincia: ${input.provincia}` : null,
    `Usos: ${input.usos.map((u) => label(OIL_USES, u)).join(", ")}`,
    `Experiencia: ${label(OIL_EXPERIENCE, input.experiencia)}`,
  ]
    .filter(Boolean)
    .join(" | ");
}
