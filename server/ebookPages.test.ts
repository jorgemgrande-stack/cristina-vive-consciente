/**
 * Ficha pública de ebooks: URL, galería, contenido incluido, SEO en el HTML y 404/301 del servidor.
 * La parte con base de datos corre solo con SITE_TEST_DATABASE_URL.
 */
import { describe, expect, it } from "vitest";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { ebookImages, ebookIncludes, ebookPath, ebookPriceLabel, ebookSeo, matchesEbookSlug, plainSnippet } from "../shared/ebookPage";
import { injectEbookSeo, injectNoindex } from "./ebookPages";

const BASE = {
  slug: "los_cuatro_regalos_de_la_tierra",
  title: "Los cuatro regalos de la Tierra",
  subtitle: "Un cuento ilustrado de invierno para leer en familia",
  description: "Cada mañana, el Sol sale un poquito más tarde. Lino se pregunta por qué.\nEscrito por Cristina.",
  price: "10.00",
  coverImage: "/uploads/crm-uploads/images/portada.jpg",
  galleryImages: JSON.stringify(["/uploads/crm-uploads/images/a.jpg", "/uploads/crm-uploads/images/portada.jpg", "/uploads/crm-uploads/images/b.jpg"]),
  includesSession: 0,
};

const TEMPLATE = `<!doctype html><html lang="es"><head><meta charset="UTF-8" />
<title>Cristina Vive Consciente — Bienestar Holístico Natural</title>
<meta name="description" content="genérica" />
<meta property="og:title" content="genérico" />
<meta property="og:description" content="genérica" />
<meta property="og:type" content="website" />
</head><body><div id="root"></div></body></html>`;

describe("URL de la ficha", () => {
  it("el slug de la BD con «_» se publica con «-» y se acepta de las dos formas", () => {
    expect(ebookPath("los_cuatro_regalos_de_la_tierra")).toBe("/guias-digitales/los-cuatro-regalos-de-la-tierra");
    expect(ebookPath("agua")).toBe("/guias-digitales/agua");
    expect(matchesEbookSlug("los-cuatro-regalos-de-la-tierra", "los_cuatro_regalos_de_la_tierra")).toBe(true);
    expect(matchesEbookSlug("los_cuatro_regalos_de_la_tierra", "los_cuatro_regalos_de_la_tierra")).toBe(true);
    expect(matchesEbookSlug("agua", "aceites")).toBe(false);
  });
  it("precio: sin decimales si es entero", () => {
    expect(ebookPriceLabel("10.00")).toBe("10€");
    expect(ebookPriceLabel("12.5")).toBe("12,50€");
  });
});

describe("galería y contenido incluido", () => {
  it("la portada va la primera y no se repite si también está en el carrusel", () => {
    expect(ebookImages(BASE)).toEqual(["/uploads/crm-uploads/images/portada.jpg", "/uploads/crm-uploads/images/a.jpg", "/uploads/crm-uploads/images/b.jpg"]);
  });
  it("sin portada o con JSON roto no falla", () => {
    expect(ebookImages({ coverImage: null, galleryImages: "no es json" })).toEqual([]);
    expect(ebookImages({ coverImage: "/c.jpg", galleryImages: null })).toEqual(["/c.jpg"]);
  });
  it("los extras salen solo si están configurados: sesión solo con includesSession; no se inventa soporte grupal", () => {
    expect(ebookIncludes({ slug: "x", includesSession: 0 }).map((i) => i.key)).toEqual(["pdf"]);
    expect(ebookIncludes({ slug: "x", includesSession: 1 }).map((i) => i.key)).toEqual(["pdf", "session"]);
    expect(ebookIncludes({ slug: "agua", includesSession: 1 }).map((i) => i.key)).toEqual(["pdf", "session", "discount"]);
    expect(ebookIncludes({ slug: "x", includesSession: 0 }).map((i) => i.text).join(" ")).not.toMatch(/grupal/i);
  });
});

describe("SEO", () => {
  const seo = ebookSeo(BASE, "https://cristinaviveconsciente.es/");
  it("título, descripción, canónica e imagen absoluta a partir de los datos del ebook", () => {
    expect(seo.title).toBe("Los cuatro regalos de la Tierra | Cristina Vive Consciente");
    expect(seo.canonical).toBe("https://cristinaviveconsciente.es/guias-digitales/los-cuatro-regalos-de-la-tierra");
    expect(seo.image).toBe("https://cristinaviveconsciente.es/uploads/crm-uploads/images/portada.jpg");
    expect(seo.description.length).toBeLessThanOrEqual(156);
    expect(seo.description).toMatch(/^Un cuento ilustrado/);
  });
  it("plainSnippet recorta sin cortar palabras", () => {
    const t = plainSnippet("palabra ".repeat(60), 50);
    expect(t.length).toBeLessThanOrEqual(51);
    expect(t.endsWith("…")).toBe(true);
    expect(t).not.toMatch(/palab…$/);
  });
  it("el HTML inicial lleva las etiquetas del ebook y no las genéricas (los rastreadores no ejecutan JS)", () => {
    const html = injectEbookSeo(TEMPLATE, { ...BASE, title: 'Guía "especial" <b>&' });
    expect(html).toContain("<title>Guía &quot;especial&quot; &lt;b&gt;&amp; | Cristina Vive Consciente</title>");
    expect(html).toContain('<link rel="canonical" href="https://cristinaviveconsciente.es/guias-digitales/los-cuatro-regalos-de-la-tierra" />');
    expect(html).toContain('property="og:image" content="https://cristinaviveconsciente.es/uploads/crm-uploads/images/portada.jpg"');
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
    expect(html).not.toContain("genérica");
    expect(html).not.toContain("Bienestar Holístico Natural");
    expect(html.match(/<title>/g)).toHaveLength(1);
    expect(html.match(/name="description"/g)).toHaveLength(1);
    const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)![1]);
    expect(ld).toMatchObject({ "@type": "Product", offers: { price: "10.00", priceCurrency: "EUR" } });
  });
  it("la respuesta 404 no se indexa", () => {
    expect(injectNoindex(TEMPLATE)).toContain('name="robots" content="noindex, nofollow"');
  });
});

const URL = process.env.SITE_TEST_DATABASE_URL;
const d = describe.runIf(!!URL && /(_test|test_)/.test(URL ?? ""));

d("servidor con base de datos de pruebas", () => {
  it("200 con SEO para un ebook activo, 301 desde «_», 404 para inexistentes e inactivos, y el sitemap solo lista activos", async () => {
    process.env.DATABASE_URL = URL;
    const { default: express } = await import("express");
    const { registerEbookPages } = await import("./ebookPages");
    const dbm = await import("./db");
    const s = await import("../drizzle/schema");
    const { like } = await import("drizzle-orm");
    const conn = (await dbm.getDb())!;
    const tag = `ebt${Date.now()}`;
    const row = (slug: string, status: "active" | "inactive", title: string) => ({ slug, title, subtitle: "Sub", description: "Descripción larga.", price: "9.00", priceCents: 900, status, coverImage: "/uploads/c.jpg", galleryImages: "[]" });
    try {
      await conn.insert(s.ebooks).values([row(`${tag}_activo_uno`, "active", "Ebook activo uno"), row(`${tag}_activo_dos`, "active", "Ebook activo dos"), row(`${tag}_inactivo`, "inactive", "Ebook inactivo")]);
      const app = express();
      registerEbookPages(app, async () => TEMPLATE);
      const server = http.createServer(app);
      await new Promise<void>((r) => server.listen(0, r));
      const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
      try {
        const ok = await fetch(`${base}/guias-digitales/${tag}-activo-uno`);
        expect(ok.status).toBe(200);
        const body = await ok.text();
        expect(body).toContain("<title>Ebook activo uno | ");
        expect(body).toContain(`/guias-digitales/${tag}-activo-uno" />`);
        // segundo ebook con datos distintos
        const two = await (await fetch(`${base}/guias-digitales/${tag}-activo-dos`)).text();
        expect(two).toContain("<title>Ebook activo dos | ");
        expect(two).not.toContain("Ebook activo uno");

        const redir = await fetch(`${base}/guias-digitales/${tag}_activo_uno`, { redirect: "manual" });
        expect(redir.status).toBe(301);
        expect(redir.headers.get("location")).toBe(`/guias-digitales/${tag}-activo-uno`);

        for (const slug of [`${tag}-inactivo`, "no-existe-nunca"]) {
          const r = await fetch(`${base}/guias-digitales/${slug}`);
          expect(r.status).toBe(404);
          expect(await r.text()).toContain("noindex");
        }

        // sitemap
        const { sitemapRouter } = await import("./sitemap");
        const app2 = express();
        app2.use(sitemapRouter);
        const srv2 = http.createServer(app2);
        await new Promise<void>((r) => srv2.listen(0, r));
        try {
          const xml = await (await fetch(`http://127.0.0.1:${(srv2.address() as AddressInfo).port}/sitemap.xml`)).text();
          expect(xml).toContain(`/guias-digitales/${tag}-activo-uno</loc>`);
          expect(xml).toContain(`/guias-digitales/${tag}-activo-dos</loc>`);
          expect(xml).not.toContain(`${tag}-inactivo`);
        } finally {
          await new Promise<void>((r) => srv2.close(() => r()));
        }
      } finally {
        await new Promise<void>((r) => server.close(() => r()));
      }
    } finally {
      await conn.delete(s.ebooks).where(like(s.ebooks.slug, `${tag}%`));
    }
  }, 60_000);
});
