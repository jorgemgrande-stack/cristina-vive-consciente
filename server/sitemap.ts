/**
 * Sitemap XML y robots.txt — Cristina Vive Consciente
 *
 * GET /sitemap.xml  → páginas estáticas + fichas dinámicas activas
 *                     (consultas, masajes, sistemas de agua, aceites, blog)
 * GET /robots.txt   → permite todo salvo CRM/admin/API y enlaza el sitemap
 */

import { Router } from "express";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { services, waterProducts, oilProducts, blogPosts } from "../drizzle/schema";

const SITE_URL = (process.env.SITE_URL ?? "https://cristinaviveconsciente.es").replace(/\/+$/, "");

interface SitemapEntry {
  path: string;
  lastmod?: Date | null;
  changefreq?: "daily" | "weekly" | "monthly" | "yearly";
  priority?: number;
}

const STATIC_PAGES: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: 1.0 },
  { path: "/consultas", changefreq: "monthly", priority: 0.9 },
  { path: "/masajes", changefreq: "monthly", priority: 0.9 },
  { path: "/sistemas-agua", changefreq: "monthly", priority: 0.8 },
  { path: "/aceites-esenciales", changefreq: "monthly", priority: 0.8 },
  { path: "/guias-digitales", changefreq: "monthly", priority: 0.7 },
  { path: "/recomendados", changefreq: "monthly", priority: 0.6 },
  { path: "/blog", changefreq: "weekly", priority: 0.8 },
  { path: "/contacto", changefreq: "yearly", priority: 0.5 },
];

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function renderUrl(entry: SitemapEntry): string {
  const loc = escapeXml(SITE_URL + encodeURI(entry.path));
  const parts = [`    <loc>${loc}</loc>`];
  if (entry.lastmod) parts.push(`    <lastmod>${entry.lastmod.toISOString().slice(0, 10)}</lastmod>`);
  if (entry.changefreq) parts.push(`    <changefreq>${entry.changefreq}</changefreq>`);
  if (entry.priority !== undefined) parts.push(`    <priority>${entry.priority.toFixed(1)}</priority>`);
  return `  <url>\n${parts.join("\n")}\n  </url>`;
}

async function getDynamicEntries(): Promise<SitemapEntry[]> {
  const db = await getDb();
  if (!db) return [];

  const [serviceRows, waterRows, oilRows, postRows] = await Promise.all([
    db
      .select({ slug: services.slug, type: services.type, updatedAt: services.updatedAt })
      .from(services)
      .where(eq(services.status, "active")),
    db
      .select({ slug: waterProducts.slug, updatedAt: waterProducts.updatedAt })
      .from(waterProducts)
      .where(eq(waterProducts.status, "active")),
    db
      .select({ slug: oilProducts.slug, updatedAt: oilProducts.updatedAt })
      .from(oilProducts)
      .where(eq(oilProducts.status, "active")),
    db
      .select({ slug: blogPosts.slug, updatedAt: blogPosts.updatedAt })
      .from(blogPosts)
      .where(eq(blogPosts.status, "published")),
  ]);

  const entries: SitemapEntry[] = [];
  for (const s of serviceRows) {
    if (s.type === "consulta") entries.push({ path: `/consultas/${s.slug}`, lastmod: s.updatedAt, changefreq: "monthly", priority: 0.8 });
    else if (s.type === "masaje") entries.push({ path: `/masajes/${s.slug}`, lastmod: s.updatedAt, changefreq: "monthly", priority: 0.8 });
  }
  for (const p of waterRows) entries.push({ path: `/sistemas-agua/${p.slug}`, lastmod: p.updatedAt, changefreq: "monthly", priority: 0.7 });
  for (const p of oilRows) entries.push({ path: `/aceites-esenciales/${p.slug}`, lastmod: p.updatedAt, changefreq: "monthly", priority: 0.6 });
  for (const p of postRows) entries.push({ path: `/blog/${p.slug}`, lastmod: p.updatedAt, changefreq: "monthly", priority: 0.7 });
  return entries;
}

export const sitemapRouter = Router();

sitemapRouter.get("/sitemap.xml", async (_req, res) => {
  let dynamic: SitemapEntry[] = [];
  try {
    dynamic = await getDynamicEntries();
  } catch (err) {
    // Si la BD falla, servimos al menos las páginas estáticas
    console.error("[sitemap] Error loading dynamic entries:", err);
  }
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    [...STATIC_PAGES, ...dynamic].map(renderUrl).join("\n") +
    `\n</urlset>\n`;
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.send(xml);
});

sitemapRouter.get("/robots.txt", (_req, res) => {
  res.type("text/plain").send(
    [
      "User-agent: *",
      "Allow: /",
      "Disallow: /crm",
      "Disallow: /admin",
      "Disallow: /api/",
      "Disallow: /mi-consulta",
      "Disallow: /cita/",
      "Disallow: /ebooks/",
      "",
      `Sitemap: ${SITE_URL}/sitemap.xml`,
      "",
    ].join("\n")
  );
});
