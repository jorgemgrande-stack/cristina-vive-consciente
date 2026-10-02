/**
 * healthClaims.ts — detector de afirmaciones de salud en textos comerciales (puro, testeable).
 *
 * Contexto: BION / Cristina Vive Consciente ofrece naturopatía, masajes y aromaterapia. Un naturópata no es
 * una profesión sanitaria regulada: atribuir a un servicio o producto la capacidad de diagnosticar, tratar,
 * curar o prevenir enfermedades, o de «reforzar el sistema inmune», puede ser publicidad sanitaria engañosa y,
 * según el caso, intrusismo. Los textos deben describir la experiencia, la técnica, los aromas y la logística, no
 * efectos sobre la salud. Esto es una ayuda editorial, NO asesoramiento jurídico: la revisión final es de un profesional.
 *
 * - STRICT: términos que no deben aparecer en textos de servicios, productos ni guías (enfermedad, tratamiento,
 *   inmunidad, inflamación, desintoxicación, dolor, uso interno…).
 * - SOFT: lenguaje que conviene revisar (terapéutico, refuerza, equilibra el sistema…).
 * Las frases del aviso legal («no diagnostica ni trata enfermedades…») se ignoran: es justo lo que debe decirse.
 */

/** Aviso legal estándar de la web. */
export const HEALTH_DISCLAIMER =
  "La información de esta web tiene carácter divulgativo y de bienestar. Los servicios de naturopatía, masaje y aromaterapia son propuestas complementarias de estilo de vida: no diagnostican, tratan ni curan enfermedades y no sustituyen la consulta ni el tratamiento de un profesional sanitario. Ante cualquier problema de salud, embarazo o medicación, consulta con tu médico.";

export type HealthClaimFinding = { level: "strict" | "soft"; term: string };

const STRICT = [
  "enfermedad\\p{L}*", "patolog\\p{L}*", "diagn[oó]stic\\p{L}*", "s[ií]ntoma\\p{L}*", "dolencia\\p{L}*", "trastorno\\p{L}*", "afecci[oó]n\\p{L}*",
  "c[aá]ncer", "diabet\\p{L}*", "artritis", "artrosis", "alergi\\p{L}*", "depresi[oó]n", "ansiedad", "insomnio", "hipertens\\p{L}*",
  "colesterol", "infecci\\p{L}*", "virus", "v[ií]ric\\p{L}*", "viral\\p{L}*", "antivir\\p{L}*", "antibacteri\\p{L}*", "antibi[oó]tic\\p{L}*",
  "antiparasit\\p{L}*", "parasitari\\p{L}*", "antigripal", "gripe", "resfriad\\p{L}*", "herpes", "psoriasis", "hongos", "acn[eé]",
  "inmun\\p{L}*", "defensas", "antiinflamator\\p{L}*", "antiinflamaci\\p{L}*", "inflamaci\\p{L}*", "inflamatori\\p{L}*", "analg[eé]sic\\p{L}*",
  "desintox\\p{L}*", "detox\\p{L}*", "depurativ\\p{L}*", "depurar", "t[oó]xic\\p{L}*", "toxinas?",
  "cura(r|n|ci[oó]n|tiv\\p{L}*)?", "sanaci[oó]n", "sanar", "tratamiento\\p{L}*", "tratar", "previen\\p{L}*", "prevenir", "prevenci[oó]n",
  "alivia\\p{L}*", "aliviar", "alivio", "dolor(es)?", "dolencias?",
  "respiratori\\p{L}*", "descongest\\p{L}*", "afrodis\\p{L}*", "fertilidad", "hormonal\\p{L}*", "hormonas?", "metab[oó]lic\\p{L}*",
  "posolog[ií]a", "dosis", "uso interno", "interno:", "ingerir", "ingesta", "internamente",
  "grado terap[eé]utico", "regenera\\p{L}*", "rejuvenec\\p{L}*", "cicatriz\\p{L}*", "milagro\\p{L}*",
];
const SOFT = [
  "terap[eé]utic\\p{L}*", "terapia\\p{L}*", "refuerza\\p{L}*", "fortalec\\p{L}*", "potencia(r|n)?", "restaura\\p{L}*",
  "sistema (nervioso|digestivo|endocrino|hormonal|energ[eé]tico)", "campo electromagn[eé]tico", "energ[ií]a primordial",
  "kinesiol\\p{L}*", "eficaz\\p{L}*", "comprobad\\p{L}*", "cient[ií]fic\\p{L}*", "salud",
];

const build = (list: string[]) => new RegExp(`(?<![\\p{L}])(?:${list.join("|")})(?![\\p{L}])`, "giu");
const STRICT_RE = build(STRICT);
const SOFT_RE = build(SOFT);

const DISCLAIMER_RE = new RegExp("\\bno (es una consulta m[eé]dica|diagnostic\\p{L}*|sustituye\\p{L}*)|\\bno diagnostican\\b|consulta con tu m[eé]dico|profesional sanitario", "iu");

/** Quita las frases del aviso legal (p. ej. «no diagnostica ni trata enfermedades»), que son lo correcto. */
export function stripDisclaimers(text: string): string {
  return text
    .split(/(?<=[.!?])\s+/)
    .filter((s) => !DISCLAIMER_RE.test(s))
    .join(" ");
}

function collect(re: RegExp, text: string): string[] {
  const out = new Set<string>();
  re.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) out.add(m[0].toLowerCase());
  return Array.from(out);
}

/** Términos de salud encontrados en un texto (ignorando el aviso legal). */
export function findHealthClaims(text: string | null | undefined): HealthClaimFinding[] {
  if (!text) return [];
  const t = stripDisclaimers(String(text).replace(/<[^>]+>/g, " "));
  return [
    ...collect(STRICT_RE, t).map((term) => ({ level: "strict" as const, term })),
    ...collect(SOFT_RE, t).map((term) => ({ level: "soft" as const, term })),
  ];
}

export const strictClaims = (text: string | null | undefined) => findHealthClaims(text).filter((f) => f.level === "strict").map((f) => f.term);
