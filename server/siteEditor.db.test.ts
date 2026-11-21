/**
 * Editar web contra MySQL: borrador → vista privada → publicar → historial → restaurar, páginas nuevas, redirecciones.
 * Solo corre con SITE_TEST_DATABASE_URL (una BD de pruebas con la migración 0028; nunca producción):
 *   SITE_TEST_DATABASE_URL=mysql://cvc:cvc_dev@127.0.0.1:3350/cristina_test pnpm test server/siteEditor.db.test.ts
 */
import { beforeAll, afterAll, describe, expect, it } from "vitest";

const URL = process.env.SITE_TEST_DATABASE_URL;
const d = describe.runIf(!!URL && /(_test|test_)/.test(URL ?? ""));

d("Editar web con base de datos", () => {
  let site: typeof import("./siteDb");
  let content: typeof import("../shared/siteEditor");
  let schema: typeof import("../drizzle/schema");
  let getDb: typeof import("./db").getDb;
  const A = "/consultas";

  beforeAll(async () => {
    process.env.DATABASE_URL = URL;
    site = await import("./siteDb");
    content = await import("../shared/siteEditor");
    schema = await import("../drizzle/schema");
    getDb = (await import("./db")).getDb;
    const db = (await getDb())!;
    await db.delete(schema.siteDocumentVersions);
    await db.delete(schema.siteDocuments);
    await db.delete(schema.siteRedirects);
  });
  afterAll(async () => {
    const db = await getDb();
    if (db) {
      await db.delete(schema.siteDocumentVersions);
      await db.delete(schema.siteDocuments);
      await db.delete(schema.siteRedirects);
    }
  });

  const hero = (title: string) => ({ v: 1, seo: { title: "", description: "", ogImage: "", noindex: false }, blocks: [content.createBlock("hero", { title })] });

  it("antes de publicar el visitante no ve nada (la web sirve la página de siempre)", async () => {
    await site.saveDraft(A, hero("Borrador A"), 1);
    site.invalidateSiteCache();
    expect(await site.readPublishedPage(A)).toBeNull();
    const draft = await site.readDraft(A);
    expect((draft.content as { blocks: { data: { title: string } }[] }).blocks[0].data.title).toBe("Borrador A");
  });

  it("publica, y los cambios posteriores del borrador no se ven hasta publicar de nuevo", async () => {
    await site.publishDraft(A, 1, "primera");
    const pub = await site.readPublishedPage(A);
    expect(pub?.content.blocks[0].data).toMatchObject({ title: "Borrador A" });
    await site.saveDraft(A, hero("Borrador B"), 1);
    site.invalidateSiteCache();
    expect((await site.readPublishedPage(A))?.content.blocks[0].data).toMatchObject({ title: "Borrador A" });
    const list = await site.listDocuments();
    expect(list.find((x) => x.docKey === A)).toMatchObject({ servedFrom: "cms", published: true, draftChanged: true });
    await site.publishDraft(A, 1, "segunda");
    expect((await site.readPublishedPage(A))?.content.blocks[0].data).toMatchObject({ title: "Borrador B" });
    expect((await site.listDocuments()).find((x) => x.docKey === A)?.draftChanged).toBe(false);
  });

  it("historial y restauración de la versión anterior", async () => {
    const versions = await site.listVersions(A);
    expect(versions).toHaveLength(2);
    expect(versions[0].current).toBe(true);
    const first = versions[1];
    await site.restoreVersion(A, first.id, 1);
    expect((await site.readPublishedPage(A))?.content.blocks[0].data).toMatchObject({ title: "Borrador A" });
    const after = await site.listVersions(A);
    expect(after).toHaveLength(3);
    expect(after[0]).toMatchObject({ action: "restore", current: true });
    expect((await site.readDraft(A)).content).toMatchObject({ blocks: [{ data: { title: "Borrador A" } }] });
  });

  it("los bloques ocultos se guardan en el borrador pero no se sirven", async () => {
    const h = content.createBlock("text");
    h.hidden = true;
    await site.saveDraft(A, { ...hero("Con oculto"), blocks: [content.createBlock("hero", { title: "Con oculto" }), h] }, 1);
    await site.publishDraft(A, 1);
    expect((await site.readPublishedPage(A))?.content.blocks).toHaveLength(1);
    expect(((await site.readDraft(A)).content as { blocks: unknown[] }).blocks).toHaveLength(2);
  });

  it("volver a la página de siempre deja de servir el documento sin borrarlo", async () => {
    await site.serveLegacy(A);
    site.invalidateSiteCache();
    expect(await site.readPublishedPage(A)).toBeNull();
    expect((await site.listVersions(A)).length).toBeGreaterThan(0);
  });

  it("ajustes globales: sin publicar valen los de serie; publicados se leen", async () => {
    site.invalidateSiteCache();
    expect((await site.readPublishedGlobal()).header.nav[0].url).toBe("/");
    const g = structuredClone(content.DEFAULT_GLOBAL);
    g.header.nav[1] = { label: "Consultas nuevas", url: "/consultas-nuevas" };
    await site.saveDraft(content.GLOBAL_KEY, { v: 1, global: g }, 1);
    site.invalidateSiteCache();
    expect((await site.readPublishedGlobal()).header.nav[1].url).toBe("/consultas"); // aún en borrador
    await site.publishDraft(content.GLOBAL_KEY, 1);
    expect((await site.readPublishedGlobal()).header.nav[1]).toEqual({ label: "Consultas nuevas", url: "/consultas-nuevas" });
  });

  it("página nueva: se crea, se publica, se sirve, cambia de dirección con redirección y se elimina", async () => {
    await expect(site.createCustomPage("Mal", "consultas", 1)).rejects.toThrow(/ya la usa/);
    const { docKey } = await site.createCustomPage("Sobre mí", "sobre-mi", 1);
    expect(docKey).toBe("/sobre-mi");
    await expect(site.createCustomPage("Otra", "sobre-mi", 1)).rejects.toThrow(/Ya existe/);
    site.invalidateSiteCache();
    expect(await site.readPublishedPage("/sobre-mi")).toBeNull();
    await site.publishDraft("/sobre-mi", 1);
    expect((await site.readPublishedPage("/sobre-mi"))?.content.blocks[0].type).toBe("hero");
    expect((await site.publishedCustomPaths()).map((p) => p.path)).toContain("/sobre-mi");
    await site.renameCustomPage("/sobre-mi", "conoceme");
    site.invalidateRedirects();
    expect((await site.redirectMap()).get("/sobre-mi")).toBe("/conoceme");
    expect(await site.readPublishedPage("/conoceme")).not.toBeNull();
    expect(await site.readPublishedPage("/sobre-mi")).toBeNull();
    await site.deleteCustomPage("/conoceme");
    site.invalidateSiteCache();
    expect(await site.readPublishedPage("/conoceme")).toBeNull();
  });

  it("las páginas originales no se eliminan ni cambian de dirección", async () => {
    await expect(site.deleteCustomPage("/consultas")).rejects.toThrow(/originales/);
    await expect(site.renameCustomPage("/consultas", "otra")).rejects.toThrow(/originales/);
  });

  it("redirecciones: validación, bucles y borrado", async () => {
    await expect(site.addRedirect("/crm/algo", "/x")).rejects.toThrow(/interna/);
    await expect(site.addRedirect("/a", "/a")).rejects.toThrow(/iguales/);
    await site.addRedirect("https://cristinaviveconsciente.es/vieja/?x=1", "/nueva");
    expect((await site.redirectMap()).get("/vieja")).toBe("/nueva");
    await expect(site.addRedirect("/nueva", "/vieja")).rejects.toThrow(/bucle/);
    const [r] = (await site.listRedirects()).filter((x) => x.fromPath === "/vieja");
    await site.removeRedirect(r.id);
    expect((await site.redirectMap()).has("/vieja")).toBe(false);
  });

  it("una plantilla de ficha publicada se sirve para cualquier ficha de su tipo", async () => {
    await site.saveDraft("tpl:/consultas/:slug", { v: 1, seo: {}, blocks: [content.createBlock("connected", { source: "detalle" })] }, 1);
    await site.publishDraft("tpl:/consultas/:slug", 1);
    const p = await site.readPublishedPage("/consultas/lo-que-sea");
    expect(p?.kind).toBe("template");
    expect(p?.content.blocks[0].data).toMatchObject({ source: "detalle" });
    expect(await site.readPublishedPage("/masajes/lo-que-sea")).toBeNull();
  });
});

d("Carga inicial de la web actual con base de datos", () => {
  it("carga todo como borrador, copia lo previo, no publica y es repetible", async () => {
    process.env.DATABASE_URL = URL;
    const site = await import("./siteDb");
    const { loadInitialDrafts } = await import("./siteSeedRun");
    const content = await import("../shared/siteEditor");
    const schema = await import("../drizzle/schema");
    const db = (await (await import("./db")).getDb())!;
    await db.delete(schema.siteDocumentVersions);
    await db.delete(schema.siteDocuments);
    await db.delete(schema.siteRedirects);
    // Estado de producción: /masajes con dos cabeceras de ejemplo
    await site.saveDraft("/masajes", { v: 1, seo: {}, blocks: [content.createBlock("hero"), content.createBlock("hero")] }, 1);
    const saved: string[] = [];
    const dry = await loadInitialDrafts({ dryRun: true });
    expect(dry.find((r) => r.docKey === "/masajes")?.action).toBe("replaced-examples");
    expect(((await site.readDraft("/masajes")).content as { blocks: unknown[] }).blocks).toHaveLength(2);
    const run = await loadInitialDrafts({ backup: (doc) => { saved.push(doc.docKey + ":" + doc.draftJson); } });
    expect(run.length).toBe(content.SYSTEM_PAGES.length + 1);
    expect(saved).toHaveLength(1);
    expect(saved[0]).toContain("Título de la página");
    const m = (await site.readDraft("/masajes")).content as { blocks: { type: string; data: Record<string, string> }[] };
    expect(m.blocks.map((b) => b.type)).toEqual(["hero", "connected"]);
    expect(m.blocks[0].data.title).toBe("Masajes Terapéuticos");
    site.invalidateSiteCache();
    for (const p of content.SYSTEM_PAGES) {
      const doc = await site.getDocument(p.docKey);
      expect(doc?.servedFrom, p.docKey).toBe("legacy");
      expect(doc?.publishedVersionId, p.docKey).toBeNull();
    }
    expect(await site.readPublishedPage("/masajes")).toBeNull();
    expect((await site.readPublishedGlobal()).header.nav[0].url).toBe("/");
    expect(await site.getDocument(content.GLOBAL_KEY)).not.toBeNull();
    const again = await loadInitialDrafts({ backup: () => { throw new Error("no debe haber copias"); } });
    expect(again.every((r) => r.action === "unchanged")).toBe(true);
    expect((await site.listDocuments()).filter((x) => x.draftChanged && !x.custom)).toHaveLength(0);
    await db.delete(schema.siteDocumentVersions);
    await db.delete(schema.siteDocuments);
  });
});
