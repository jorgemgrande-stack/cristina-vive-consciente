/** Carga inicial de la web actual: ejemplos frente a ediciones reales, sin duplicar ni sobrescribir (puro). */
import { describe, expect, it } from "vitest";
import { createBlock, SYSTEM_PAGES, type PageContent } from "../shared/siteEditor";
import { isExampleBlock, mergeSeed } from "./siteSeed";
import { migratedContent } from "./siteMigration";

const emptySeo = { title: "", description: "", ogImage: "", noindex: false };
const draft = (blocks: PageContent["blocks"], extra: Partial<PageContent> = {}): PageContent => ({ v: 1, seo: emptySeo, blocks, ...extra });
const masajes = () => migratedContent("/masajes")!;

describe("bloques de ejemplo", () => {
  it("un bloque recién añadido es de ejemplo; con texto propio, diseño u oculto, no", () => {
    expect(isExampleBlock(createBlock("hero"))).toBe(true);
    expect(isExampleBlock(createBlock("hero", { title: "Masajes" }))).toBe(false);
    const withStyle = createBlock("text");
    withStyle.style = { background: "soft", bgImage: "", overlay: "dark", padTop: "0", padBottom: "0", align: "auto", mobileAlign: "auto", mobileSpacing: "same", contentWidth: "auto", minHeight: "auto", hideOn: [], anchor: "", animation: "none" };
    expect(isExampleBlock(withStyle)).toBe(false);
    const hidden = createBlock("text");
    hidden.hidden = true;
    expect(isExampleBlock(hidden)).toBe(false);
  });
});

describe("carga inicial (mergeSeed)", () => {
  it("borrador vacío → página completa de la web actual", () => {
    const { content, report } = mergeSeed(null, masajes());
    expect(report.action).toBe("created");
    expect(content.blocks.map((b) => b.type)).toEqual(["hero", "connected"]);
    expect(content.blocks[0].data).toMatchObject({ eyebrow: "Terapia corporal", title: "Masajes Terapéuticos", buttonLabel: "Reservar sesión", buttonUrl: "action:booking-masaje", secondaryLabel: "Cómo funciona" });
    expect(content.seed).toEqual(masajes().blocks.map((b) => b.id));
  });
  it("el caso de producción: dos cabeceras «Título de la página» sin tocar se sustituyen", () => {
    const { content, report } = mergeSeed(draft([createBlock("hero"), createBlock("hero")]), masajes());
    expect(report).toMatchObject({ action: "replaced-examples", removedExamples: 2 });
    expect(content.blocks.map((b) => b.type)).toEqual(["hero", "connected"]);
    expect(JSON.stringify(content)).not.toContain("Título de la página");
  });
  it("mezcla: conserva la cabecera editada, retira el ejemplo y añade lo que falta", () => {
    const edited = createBlock("hero", { title: "Mis masajes", subtitle: "Texto de Cristina" });
    const extra = createBlock("text", { html: "<p>Nota propia</p>" });
    const { content, report } = mergeSeed(draft([createBlock("hero"), edited, extra]), masajes());
    expect(report).toMatchObject({ action: "merged", removedExamples: 1, added: ["listado"] });
    expect(content.blocks.map((b) => b.type)).toEqual(["hero", "connected", "text"]);
    expect(content.blocks[0].data).toMatchObject({ title: "Mis masajes", subtitle: "Texto de Cristina" });
    expect(content.blocks[2].id).toBe(extra.id);
  });
  it("repetir la carga no duplica ni cambia nada", () => {
    const first = mergeSeed(null, masajes()).content;
    const second = mergeSeed(first, masajes());
    expect(second.report.action).toBe("unchanged");
    expect(second.content.blocks).toHaveLength(2);
    const mixed = mergeSeed(draft([createBlock("hero", { title: "Propia" })]), masajes()).content;
    const again = mergeSeed(mixed, masajes());
    expect(again.report.action).toBe("unchanged");
    expect(again.content.blocks).toHaveLength(mixed.blocks.length);
  });
  it("lo que Cristina borró tras la carga no vuelve", () => {
    const loaded = mergeSeed(null, masajes()).content;
    const withoutList = { ...loaded, blocks: loaded.blocks.filter((b) => b.id !== "listado") };
    const again = mergeSeed(withoutList, masajes());
    expect(again.report.action).toBe("unchanged");
    expect(again.content.blocks.map((b) => b.id)).toEqual(["hero"]);
  });
  it("sus ediciones posteriores no se sobrescriben", () => {
    const loaded = mergeSeed(null, masajes()).content;
    const edited = { ...loaded, blocks: loaded.blocks.map((b) => (b.type === "hero" ? { ...b, data: { ...b.data, title: "Otro título" } } : b)) } as PageContent;
    expect(mergeSeed(edited, masajes()).content.blocks[0].data).toMatchObject({ title: "Otro título" });
  });
  it("el SEO propio se respeta y el vacío toma el de la web actual", () => {
    expect(mergeSeed(draft([createBlock("hero", { title: "X" })]), masajes()).content.seo.title).toMatch(/Cristina Vive Consciente/);
    const own = draft([createBlock("hero", { title: "X" })], { seo: { ...emptySeo, title: "Mi SEO" } });
    expect(mergeSeed(own, masajes()).content.seo.title).toBe("Mi SEO");
  });
  it("todas las páginas y plantillas tienen contenido que cargar", () => {
    for (const p of SYSTEM_PAGES) expect(migratedContent(p.docKey)!.blocks.length, p.docKey).toBeGreaterThan(0);
  });
});
