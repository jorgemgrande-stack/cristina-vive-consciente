/**
 * Middleware de redirecciones 301 SEO — Cristina Vive Consciente
 *
 * Carga redirects.json en memoria al arrancar el servidor y resuelve
 * cada petición en O(1) usando un Map. Gestiona las rutas heredadas de
 * Shopify (productos, colecciones, páginas, blogs) que quedaron indexadas
 * en Google cuando el dominio apuntaba a la tienda antigua.
 *
 * Integración en server/_core/index.ts (ANTES de serveStatic/setupVite):
 *
 *   import { createRedirectMiddleware } from "../redirects";
 *   app.use(createRedirectMiddleware());
 */

import fs from "fs";
import path from "path";
import type { Request, Response, NextFunction } from "express";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface RedirectEntry {
  from: string;
  to: string;
  type?: string;
  source?: string;
  priority?: string;
}

// ─── Normalización de path ────────────────────────────────────────────────────

/**
 * Normaliza un path para lookup:
 * - Convierte a minúsculas
 * - Elimina trailing slash (excepto "/")
 * - Decodifica %XX para comparar slugs correctamente
 */
function normalizePath(rawPath: string): string {
  try {
    const decoded = decodeURIComponent(rawPath);
    const lower = decoded.toLowerCase();
    return lower.length > 1 ? lower.replace(/\/+$/, "") : lower;
  } catch {
    // Si decodeURIComponent falla (secuencia inválida) usar tal cual
    const lower = rawPath.toLowerCase();
    return lower.length > 1 ? lower.replace(/\/+$/, "") : lower;
  }
}

// ─── Carga de redirects.json ──────────────────────────────────────────────────

function loadRedirectMap(): Map<string, string> {
  const redirectMap = new Map<string, string>();

  const jsonPath = path.resolve(
    process.cwd(),
    "redirects.json"
  );

  if (!fs.existsSync(jsonPath)) {
    console.warn("[redirects] redirects.json no encontrado en:", jsonPath);
    return redirectMap;
  }

  try {
    const raw = fs.readFileSync(jsonPath, "utf-8");
    const entries: RedirectEntry[] = JSON.parse(raw);

    for (const entry of entries) {
      if (!entry.from || !entry.to) continue;
      const key = normalizePath(entry.from);
      redirectMap.set(key, entry.to);
    }

    console.log(`[redirects] ${redirectMap.size} reglas cargadas desde redirects.json`);
  } catch (err) {
    console.error("[redirects] Error al cargar redirects.json:", err);
  }

  return redirectMap;
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export function createRedirectMiddleware() {
  // Carga en memoria al arrancar — O(1) en cada request
  const redirectMap = loadRedirectMap();

  // Rutas que nunca deben pasar por el middleware (API, assets, uploads)
  const SKIP_PREFIXES = ["/api/", "/uploads/", "/_vite", "/__vite"];

  return function redirectMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    const rawPath = req.path;

    // Saltamos rutas internas
    if (SKIP_PREFIXES.some((prefix) => rawPath.startsWith(prefix))) {
      return next();
    }

    const normalizedPath = normalizePath(rawPath);

    const destination = redirectMap.get(normalizedPath);

    if (!destination) {
      return next();
    }

    // Protección anti-bucle: si el destino coincide con la URL actual, pasamos
    if (normalizePath(destination) === normalizedPath) {
      console.warn("[redirects] Bucle detectado para:", rawPath);
      return next();
    }

    // Preservar query string original
    const query = req.url.includes("?")
      ? req.url.slice(req.url.indexOf("?"))
      : "";

    const finalUrl = destination + query;

    res.redirect(301, finalUrl);
  };
}
