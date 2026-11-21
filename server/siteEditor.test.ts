/**
 * Editar web: saneado de contenido, árbol de bloques y reglas de páginas (puro, sin BD).
 * El flujo borrador → publicar → restaurar contra MySQL está en siteEditor.db.test.ts.
 */
import { describe, it, expect } from "vitest";
import { cleanHtml, normalizeBlocks, normalizeGlobal, normalizePageContent, safeImage, safeLink, safeVideo } from "./siteContent";
import {
  createBlock, duplicateBlock, findBlock, insertBlocks, moveBlock, removeBlock, shiftBlock, slugProblem, slugify, templateKeyFor, labelText,
  DEFAULT_GLOBAL, type PageBlock,
} from "../shared/siteEditor";
import { stripHidden } from "./siteDb";

describe("enlaces e imágenes seguros", () => {
  it("admite rutas propias, anclas, https, correo y teléfono", () => {
    expect(safeLink("/contacto")).toBe("/contacto");
    expect(safeLink("#reservar")).toBe("#reservar");
    expect(safeLink("https://ejemplo.es/a?b=1")).toBe("https://ejemplo.es/a?b=1");
    expect(safeLink("mailto:hola@x.es")).toBe("mailto:hola@x.es");
    expect(safeLink("www.ejemplo.es")).toBe("https://www.ejemplo.es");
  });
  it("rechaza javascript:, data: y rutas con doble barra", () => {
    for (const bad of ["javascript:alert(1)", "data:text/html,x", "//evil.com", " JaVaScRiPt:alert(1)", "vbscript:x"]) expect(safeLink(bad)).toBe("");
    expect(safeImage("javascript:alert(1)")).toBe("");
    expect(safeImage("/uploads/a.jpg")).toBe("/uploads/a.jpg");
  });
  it("vídeo solo de YouTube o Vimeo", () => {
    expect(safeVideo("https://www.youtube.com/watch?v=abc")).toContain("youtube.com");
    expect(safeVideo("https://evil.com/v.mp4")).toBe("");
  });
});

describe("texto con formato", () => {
  it("quita scripts, eventos y estilos pero conserva negrita, listas y enlaces", () => {
    const out = cleanHtml('<p onclick="x()">Hola <strong>mundo</strong><script>alert(1)</script></p><ul><li>uno</li></ul><a href="javascript:alert(1)">mal</a><a href="https://a.es">bien</a><img src=x onerror=alert(1)>');
    expect(out).not.toMatch(/script|onclick|onerror|javascript:|<img/i);
    expect(out).toContain("<strong>mundo</strong>");
    expect(out).toContain("<li>uno</li>");
    expect(out).toContain('href="https://a.es"');
    expect(out).toContain('rel="noopener noreferrer"');
  });
});

describe("normalización de bloques", () => {
  it("descarta tipos desconocidos, corrige valores y fija ids únicos", () => {
    const blocks = normalizeBlocks([
      { id: "x", type: "hero", data: { title: "Hola", height: "gigante", imageUrl: "javascript:x" } },
      { id: "x", type: "text", data: { html: "<p>a</p><script>1</script>" } },
      { id: "z", type: "inventado", data: {} },
    ]);
    expect(blocks.map((b) => b.type)).toEqual(["hero", "text"]);
    expect(new Set(blocks.map((b) => b.id)).size).toBe(2);
    expect(blocks[0].data).toMatchObject({ title: "Hola", height: "m", imageUrl: "" });
    expect(JSON.stringify(blocks[1].data)).not.toContain("script");
  });
  it("el diseño por defecto no se guarda y un fondo con imagen solo conserva su imagen", () => {
    const [a, b] = normalizeBlocks([
      { type: "text", style: { background: "none", padTop: "0" } },
      { type: "text", style: { background: "soft", bgImage: "/uploads/a.jpg", anchor: "Mal Ancla!", hideOn: ["mobile", "tele"] } },
    ]);
    expect(a.style).toBeUndefined();
    expect(b.style).toMatchObject({ background: "soft", bgImage: "", anchor: "", hideOn: ["mobile"] });
  });
  it("las secciones respetan el número de columnas y la profundidad máxima", () => {
    const deep = { type: "section", data: { layout: "1-1", columns: [{ blocks: [{ type: "section", data: { layout: "1", columns: [{ blocks: [{ type: "section", data: {} }, { type: "text", data: {} }] }] } }, { type: "hero", data: {} }] }] } };
    const [s] = normalizeBlocks([deep]);
    if (s.type !== "section") throw new Error("sección");
    expect(s.data.columns).toHaveLength(2);
    expect(s.data.columns[0].blocks.map((b) => b.type)).toEqual(["section"]); // el hero no cabe en una columna
    const inner = s.data.columns[0].blocks[0];
    if (inner.type !== "section") throw new Error("sección interior");
    expect(inner.data.columns[0].blocks.map((b) => b.type)).toEqual(["text"]); // un tercer nivel de sección se descarta
  });
  it("el bloque conectado solo admite orígenes conocidos", () => {
    const [c] = normalizeBlocks([{ type: "connected", data: { source: "usuarios_privados" } }]);
    expect(c.data).toMatchObject({ source: "consultas" });
    const [d] = normalizeBlocks([{ type: "connected", data: { source: "detalle" } }]);
    expect(d.data).toMatchObject({ source: "detalle" });
  });
  it("el contenido de una página trae SEO saneado", () => {
    const c = normalizePageContent({ seo: { title: "T", description: "D", ogImage: "javascript:x", noindex: true }, blocks: [] });
    expect(c.seo).toEqual({ title: "T", description: "D", ogImage: "", noindex: true });
  });
  it("los bloques ocultos no llegan al visitante, tampoco dentro de secciones", () => {
    const blocks = normalizeBlocks([
      { id: "a", type: "text", data: {} },
      { id: "b", type: "text", hidden: true, data: {} },
      { id: "s", type: "section", data: { layout: "1", columns: [{ blocks: [{ id: "c", type: "text", hidden: true, data: {} }, { id: "d", type: "text", data: {} }] }] } },
    ]);
    const pub = stripHidden(blocks);
    expect(pub.map((b) => b.id)).toEqual(["a", "s"]);
    const sec = pub[1];
    if (sec.type !== "section") throw new Error("sección");
    expect(sec.data.columns[0].blocks.map((b) => b.id)).toEqual(["d"]);
  });
});

describe("ajustes globales", () => {
  it("parte de los valores actuales de la web si no hay nada guardado", () => {
    const g = normalizeGlobal(undefined);
    expect(g.header.nav.map((n) => n.url)).toEqual(DEFAULT_GLOBAL.header.nav.map((n) => n.url));
    expect(g.identity.logoUrl).toBe("/logo-bion.png");
  });
  it("sanea enlaces del menú y redes y limita el número de teléfono a cifras", () => {
    const g = normalizeGlobal({
      header: { nav: [{ label: "Bien", url: "/a" }, { label: "Mal", url: "javascript:x" }, { label: "", url: "/b" }] },
      footer: { instagram: "http://insegura.com", facebook: "https://facebook.com/x" },
      whatsapp: { number: "+34 657-16.53.43" },
      labels: { "booking.title": "Reserva", "mala clave!": "x" },
    });
    expect(g.header.nav).toEqual([{ label: "Bien", url: "/a" }]);
    expect(g.footer.instagram).toBe("");
    expect(g.footer.facebook).toBe("https://facebook.com/x");
    expect(g.whatsapp.number).toBe("34657165343");
    expect(g.labels).toEqual({ "booking.title": "Reserva" });
  });
  it("los textos usan el de serie si no se han editado", () => {
    expect(labelText({}, "booking.title")).toBe("Reservar consulta");
    expect(labelText({ "booking.title": "Pide tu cita" }, "booking.title")).toBe("Pide tu cita");
  });
});

describe("árbol de bloques", () => {
  const sec = () => {
    const s = createBlock("section");
    s.data.columns = [{ blocks: [createBlock("text")] }, { blocks: [] }];
    return s;
  };
  it("inserta, mueve entre columnas, duplica con ids nuevos y elimina", () => {
    let blocks: PageBlock[] = [createBlock("heading"), sec(), createBlock("button")];
    const section = blocks[1];
    const inner = (section.type === "section" ? section.data.columns[0].blocks[0] : null)!;
    blocks = moveBlock(blocks, inner.id, { parent: section.id, col: 1, index: 0 });
    const s2 = findBlock(blocks, section.id)!.block;
    if (s2.type !== "section") throw new Error("sección");
    expect(s2.data.columns[0].blocks).toHaveLength(0);
    expect(s2.data.columns[1].blocks[0].id).toBe(inner.id);
    const dup = duplicateBlock(blocks, section.id);
    expect(dup.blocks).toHaveLength(4);
    const copy = findBlock(dup.blocks, dup.newId!)!.block;
    if (copy.type !== "section") throw new Error("sección");
    expect(copy.data.columns[1].blocks[0].id).not.toBe(inner.id);
    expect(removeBlock(blocks, inner.id)).toHaveLength(3);
  });
  it("no deja meter una cabecera con imagen en una columna ni una sección dentro de sí misma", () => {
    const blocks: PageBlock[] = [sec()];
    const hero = createBlock("hero");
    const result = insertBlocks(blocks, { parent: blocks[0].id, col: 0, index: 0 }, [hero]);
    expect(result).toBeDefined(); // insertBlocks no valida: lo hace placeProblem en el editor
    const moved = moveBlock([...blocks, hero], hero.id, { parent: blocks[0].id, col: 0, index: 0 });
    expect(findBlock(moved, hero.id)!.place.parent).toBeNull();
    const self = moveBlock(blocks, blocks[0].id, { parent: blocks[0].id, col: 0, index: 0 });
    expect(self).toEqual(blocks);
  });
  it("sube y baja un bloque dentro de su lista", () => {
    const a = createBlock("heading"), b = createBlock("text"), c = createBlock("button");
    expect(shiftBlock([a, b, c], b.id, -1).map((x) => x.id)).toEqual([b.id, a.id, c.id]);
    expect(shiftBlock([a, b, c], b.id, 1).map((x) => x.id)).toEqual([a.id, c.id, b.id]);
    expect(shiftBlock([a, b, c], a.id, -1).map((x) => x.id)).toEqual([a.id, b.id, c.id]);
  });
});

describe("direcciones de páginas", () => {
  it("valida la dirección y evita las rutas que ya usa la web", () => {
    expect(slugProblem("sobre-mi")).toBeNull();
    expect(slugProblem("Sobre Mí")).toMatch(/minúsculas/);
    expect(slugProblem("consultas")).toMatch(/ya la usa/);
    expect(slugProblem("crm")).toMatch(/ya la usa/);
    expect(slugProblem("")).toMatch(/Escribe/);
  });
  it("convierte títulos en direcciones", () => {
    expect(slugify("Sobre mí: ¡Cristina!")).toBe("sobre-mi-cristina");
  });
  it("reconoce la plantilla de cada ficha", () => {
    expect(templateKeyFor("/consultas/mi-consulta")).toBe("tpl:/consultas/:slug");
    expect(templateKeyFor("/blog/un-post")).toBe("tpl:/blog/:slug");
    expect(templateKeyFor("/consultas")).toBeNull();
    expect(templateKeyFor("/otra/cosa")).toBeNull();
  });
});
