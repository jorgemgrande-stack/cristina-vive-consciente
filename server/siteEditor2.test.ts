/**
 * Editar web, 2.ª parte: acciones de botón, migración de todas las páginas, textos legales con datos «Pendiente»
 * y plantillas de ficha por secciones (puro, sin BD).
 */
import { describe, expect, it } from "vitest";
import { normalizeBlocks, safeLink, cleanHtml } from "./siteContent";
import { migratedContent, MIGRATABLE_KEYS } from "./siteMigration";
import { privacyHtml, cookiesHtml } from "./legalMigration";
import { FICHA_SECTIONS } from "../shared/fichaSections";
import { LABEL_DEFS, SYSTEM_PAGES } from "../shared/siteEditor";
import { CONSENT_TEXTS } from "../shared/clientCare";

describe("acciones especiales de botón", () => {
  it("admite solo las acciones conocidas", () => {
    expect(safeLink("action:booking-masaje")).toBe("action:booking-masaje");
    expect(safeLink("action:cookie-settings")).toBe("action:cookie-settings");
    expect(safeLink("action:rm-rf")).toBe("");
    expect(safeLink("action:")).toBe("");
  });
  it("el texto con formato conserva el enlace de acción y descarta lo peligroso", () => {
    const out = cleanHtml('<p><a href="action:cookie-settings">Gestionar cookies</a> <a href="javascript:x">mal</a> <mark>[Pendiente: NIF]</mark></p>');
    expect(out).toContain('href="action:cookie-settings"');
    expect(out).not.toContain("javascript:");
    expect(out).toContain("<mark>[Pendiente: NIF]</mark>");
  });
  it("la cabecera guarda dos botones y un encuadre acotado", () => {
    const [h] = normalizeBlocks([{ type: "hero", data: { title: "x", buttonUrl: "action:booking-masaje", secondaryUrl: "action:toggle-technique", imageX: 250, imageY: -3, imageXM: "abc" } }]);
    expect(h.data).toMatchObject({ buttonUrl: "action:booking-masaje", secondaryUrl: "action:toggle-technique", imageX: 100, imageY: 0, imageXM: 50 });
  });
});

describe("migración de las páginas originales", () => {
  it("todas las páginas y plantillas del registro se migran y son repetibles", () => {
    for (const p of SYSTEM_PAGES) {
      const a = migratedContent(p.docKey);
      expect(a, p.docKey).not.toBeNull();
      expect(a!.blocks.length).toBeGreaterThan(0);
      expect(JSON.stringify(migratedContent(p.docKey))).toBe(JSON.stringify(a));
    }
    expect(MIGRATABLE_KEYS.length).toBe(SYSTEM_PAGES.length);
  });
  it("Masajes recupera sus dos botones con acción; Agua el asesoramiento; Aceites sus dos anclas", () => {
    const hero = (k: string) => migratedContent(k)!.blocks[0].data as unknown as Record<string, string>;
    expect(hero("/masajes")).toMatchObject({ buttonLabel: "Reservar sesión", buttonUrl: "action:booking-masaje", secondaryLabel: "Cómo funciona", secondaryUrl: "action:toggle-technique" });
    expect(hero("/sistemas-agua")).toMatchObject({ buttonUrl: "action:water-advice", secondaryUrl: "#productos" });
    expect(hero("/aceites-esenciales")).toMatchObject({ buttonUrl: "#servicios", secondaryUrl: "#catalogo" });
  });
  it("las plantillas de ficha llevan una sección conectada por cada parte de la ficha, en su orden", () => {
    for (const [kind, sections] of Object.entries(FICHA_SECTIONS)) {
      expect(sections.length, kind).toBeGreaterThan(2);
      const blocks = migratedContent(`tpl:/${kind}/:slug`)!.blocks;
      expect(blocks.map((b) => (b.data as { section: string }).section)).toEqual(sections.map((s) => s.key));
      expect(blocks.every((b) => b.type === "connected" && (b.data as { source: string }).source === "ficha")).toBe(true);
    }
  });
  it("los textos editables no repiten claves", () => {
    const keys = LABEL_DEFS.map((l) => l.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys.length).toBeGreaterThan(150);
  });
});

describe("textos legales como contenido", () => {
  it("conservan los datos «Pendiente» marcados y las versiones de consentimiento actuales", () => {
    const p = privacyHtml();
    const pend = [...p.matchAll(/<mark>\[Pendiente: /g)].length;
    expect(pend).toBeGreaterThanOrEqual(8);
    expect(p).toContain(CONSENT_TEXTS.first_visit.version);
    expect(p).toContain(CONSENT_TEXTS.emotional.version);
    expect(p).toContain("NIF");
    const c = cookiesHtml();
    expect(c).toContain("cvc_consent_v1");
    expect(c).toContain("action:cookie-settings");
  });
  it("sobreviven al saneado del servidor (sin perder marcas ni enlaces)", () => {
    const [b] = normalizeBlocks([{ type: "text", data: { html: privacyHtml() } }]);
    const html = (b.data as { html: string }).html;
    expect([...html.matchAll(/<mark>/g)].length).toBe([...privacyHtml().matchAll(/<mark>/g)].length);
    expect(html).toContain('href="/politica-de-cookies"');
  });
});
