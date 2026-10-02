/**
 * Afirmaciones de salud: el detector y, sobre todo, las sustituciones preparadas (scripts/health-claims-rewrite.json):
 * ninguna redacción nueva puede conservar una afirmación de salud.
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { findHealthClaims, strictClaims, stripDisclaimers, HEALTH_DISCLAIMER } from "../shared/healthClaims";

describe("detector de afirmaciones de salud", () => {
  it("detecta las afirmaciones típicas que se auditaron", () => {
    const casos: Array<[string, string]> = [
      ["Apoya el sistema inmunológico y promueve una respuesta antiinflamatoria", "inmun"],
      ["Poderosa opción natural para infecciones bacterianas, virales y parasitarias", "infecci"],
      ["Propiedades antivirales y antibacterianas", "antivir"],
      ["Alivia la tensión muscular y articular", "alivia"],
      ["Remedios naturales para diferentes patologías", "patolog"],
      ["Protocolos de desintoxicación con arcillas", "desintox"],
      ["Interno: 1-2 gotas en agua (solo grado terapéutico)", "interno"],
      ["Esta terapia restaura el flujo de energía primordial", "terap"],
      ["Refuerza tus defensas de forma natural", "defensas"],
      ["Indicado para insomnio y ansiedad", "insomnio"],
      ["Tratamientos del agua que bebes", "tratamiento"],
    ];
    for (const [texto, parte] of casos) {
      expect(findHealthClaims(texto).some((f) => f.term.includes(parte)), texto).toBe(true);
    }
  });

  it("no da falsos positivos en lenguaje de experiencia y aroma", () => {
    for (const t of [
      "Un momento de relajación profunda y desconexión del estrés cotidiano",
      "Aroma floral y herbal que crea una atmósfera tranquila",
      "Masaje relajante de cuerpo completo (45 min) con ritual de bienvenida",
      "Sensación refrescante en la piel",
      "Curso de cocina de otoño",
    ]) expect(strictClaims(t), t).toEqual([]);
  });

  it("ignora el aviso legal, que es justo lo que debe decirse", () => {
    expect(strictClaims(HEALTH_DISCLAIMER)).toEqual([]);
    expect(strictClaims("Es una consulta informativa: no es una consulta médica, no diagnostico ni trato enfermedades.")).toEqual([]);
    expect(stripDisclaimers("Texto normal. Consulta con tu médico ante cualquier duda.")).toBe("Texto normal.");
  });
});

type Entry = { table: string; id: number; label: string; field: string; fromSha1: string; to: string };
const file = path.resolve(__dirname, "../scripts/health-claims-rewrite.json");
const data = JSON.parse(fs.readFileSync(file, "utf8")) as { entries: Entry[] };

describe("sustituciones preparadas (health-claims-rewrite.json)", () => {
  it("hay sustituciones y todas apuntan a tablas y columnas conocidas", () => {
    expect(data.entries.length).toBeGreaterThan(50);
    const tablas = new Set(["services", "oil_products", "oil_categories", "water_products", "ebooks", "affiliate_products"]);
    for (const e of data.entries) {
      expect(tablas.has(e.table), `${e.table}`).toBe(true);
      expect(/^[A-Za-z][A-Za-z0-9_]*$/.test(e.field), e.field).toBe(true);
      expect(/^[a-f0-9]{40}$/.test(e.fromSha1)).toBe(true);
      expect(e.to.length).toBeGreaterThan(0);
    }
  });

  it("NINGUNA redacción nueva conserva una afirmación de salud", () => {
    const fallos = data.entries
      .map((e) => ({ e, terms: strictClaims(e.to) }))
      .filter((x) => x.terms.length > 0)
      .map((x) => `${x.e.table}#${x.e.id} ${x.e.field}: ${x.terms.join(", ")}`);
    expect(fallos).toEqual([]);
  });

  it("los campos que guardan listas siguen siendo JSON válido", () => {
    for (const e of data.entries.filter((x) => ["benefits", "includes", "beneficios", "indicaciones", "tags"].includes(x.field))) {
      const parsed = JSON.parse(e.to);
      expect(Array.isArray(parsed) && parsed.every((s) => typeof s === "string" && s.trim().length > 0), `${e.table}#${e.id}.${e.field}`).toBe(true);
    }
  });

  it("no se promete resultado ni se menciona el sistema inmune en ningún campo de servicio, aunque sea en lenguaje «suave»", () => {
    for (const e of data.entries.filter((x) => x.table === "services")) {
      expect(/inmun|defensas|antiinflam|sanaci[oó]n|curar|trat(a|ar|amiento)\b/i.test(stripDisclaimers(e.to)), `${e.id}.${e.field}`).toBe(false);
    }
  });
});
