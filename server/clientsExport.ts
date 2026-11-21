/**
 * Exportación del listado de clientes: Excel (.xlsx), CSV (.csv) y PDF (.pdf).
 * Siempre TODOS los clientes (sin filtros ni paginación de pantalla), con las mismas columnas y el mismo orden
 * que el listado de /crm/clientes (más recientes primero). Solo admin (ver registerClientsExport).
 */
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import type { Express, Request, Response } from "express";
import { getClients } from "./db";
import { CLIENT_EXPORT_FORMATS, CLIENT_EXPORT_MIME, CLIENT_LIST_COLUMNS, clientExportRow, type ClientExportFormat } from "../shared/clientsExport";

export interface ExportTable {
  headers: readonly string[];
  rows: string[][];
}

/** Todos los clientes, en el orden del listado. No recibe filtros a propósito. */
export async function loadClientsTable(): Promise<ExportTable> {
  const all = await getClients();
  return { headers: CLIENT_LIST_COLUMNS, rows: all.map((c) => clientExportRow(c)) };
}

// ─── CSV ─────────────────────────────────────────────────────────────────────

const csvCell = (v: string) => (/[",\r\n;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/**
 * UTF-8 con BOM (Excel lo abre con tildes y ñ), separador «;» (Excel en español), saltos CRLF y campos con
 * comillas o saltos de línea entre comillas.
 */
export function toCsv(t: ExportTable): Buffer {
  const lines = [t.headers.map(csvCell).join(";"), ...t.rows.map((r) => r.map(csvCell).join(";"))];
  return Buffer.from("﻿" + lines.join("\r\n") + "\r\n", "utf8");
}

// ─── Excel ───────────────────────────────────────────────────────────────────

/** .xlsx real. Todas las celdas son texto (teléfonos con prefijo «+34», ceros iniciales…): nunca se convierten en números. */
export async function toXlsx(t: ExportTable): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Cristina Vive Consciente";
  wb.created = new Date();
  const ws = wb.addWorksheet("Clientes", { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = t.headers.map((h, i) => ({ header: h, key: `c${i}`, width: [28, 38, 18, 12][i] ?? 20, style: { numFmt: "@", alignment: { vertical: "top", wrapText: true } } }));
  const head = ws.getRow(1);
  head.font = { bold: true, color: { argb: "FFFFFFFF" } };
  head.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF3A6B3A" } };
  head.alignment = { vertical: "middle" };
  for (const r of t.rows) {
    const row = ws.addRow(r);
    row.eachCell((cell, n) => {
      cell.value = String(r[n - 1] ?? ""); // texto explícito
      cell.numFmt = "@";
      cell.alignment = { vertical: "top", wrapText: true };
    });
  }
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: t.headers.length } };
  return Buffer.from(await wb.xlsx.writeBuffer());
}

// ─── PDF ─────────────────────────────────────────────────────────────────────

export interface PdfLayoutInfo {
  pages: number;
  /** Páginas en las que se dibujó la fila de encabezados (debe ser == pages) */
  headerPages: number;
  rows: number;
}

/** PDF A4 vertical: la tabla ocupa el ancho útil de la página y repite los encabezados en cada página. */
export function toPdf(t: ExportTable, opts: { compress?: boolean } = {}): Promise<{ buffer: Buffer; info: PdfLayoutInfo }> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40, bufferPages: true, compress: opts.compress ?? true, info: { Title: "Clientes", Author: "Cristina Vive Consciente" } });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("error", reject);

    const left = doc.page.margins.left;
    const width = doc.page.width - doc.page.margins.left - doc.page.margins.right; // ancho útil
    const fractions = [0.28, 0.4, 0.17, 0.15];
    const colW = t.headers.map((_, i) => width * (fractions[i] ?? 1 / t.headers.length));
    const colX = colW.map((_, i) => left + colW.slice(0, i).reduce((a, b) => a + b, 0));
    const pad = 5;
    const FONT = 8.5;
    const bottom = () => doc.page.height - doc.page.margins.bottom - 18; // deja sitio al pie con la página
    const info: PdfLayoutInfo = { pages: 0, headerPages: 0, rows: 0 };

    const drawHeader = (y: number) => {
      doc.save().rect(left, y, width, 20).fill("#3a6b3a").restore();
      doc.font("Helvetica-Bold").fontSize(FONT).fillColor("#ffffff");
      t.headers.forEach((h, i) => doc.text(h, colX[i] + pad, y + 6, { width: colW[i] - pad * 2, lineBreak: false }));
      info.headerPages++;
      return y + 20;
    };

    // Título y fecha solo en la primera página
    doc.font("Helvetica-Bold").fontSize(15).fillColor("#1a1a1a").text("Clientes", left, doc.page.margins.top, { width });
    doc.font("Helvetica").fontSize(8.5).fillColor("#6b7280").text(`Cristina Vive Consciente · ${t.rows.length} cliente${t.rows.length === 1 ? "" : "s"} · ${new Date().toLocaleDateString("es-ES", { timeZone: "Europe/Madrid", day: "2-digit", month: "long", year: "numeric" })}`, left, doc.y + 2, { width });
    let y = drawHeader(doc.y + 10);

    doc.font("Helvetica").fontSize(FONT);
    t.rows.forEach((r, n) => {
      const h = Math.max(...r.map((cell, i) => doc.heightOfString(cell, { width: colW[i] - pad * 2 }))) + pad * 2;
      if (y + h > bottom()) {
        doc.addPage();
        y = drawHeader(doc.page.margins.top);
        doc.font("Helvetica").fontSize(FONT);
      }
      if (n % 2 === 1) doc.save().rect(left, y, width, h).fill("#f5f0e8").restore();
      doc.fillColor("#1a1a1a");
      r.forEach((cell, i) => doc.text(cell, colX[i] + pad, y + pad, { width: colW[i] - pad * 2 }));
      doc.save().moveTo(left, y + h).lineTo(left + width, y + h).lineWidth(0.4).strokeColor("#e8e0d0").stroke().restore();
      y += h;
      info.rows++;
    });

    // Pie con la numeración (todas las páginas)
    const range = doc.bufferedPageRange();
    info.pages = range.count;
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.font("Helvetica").fontSize(8).fillColor("#6b7280").text(`Página ${i + 1} de ${range.count}`, left, doc.page.height - doc.page.margins.bottom + 6, { width, align: "right", lineBreak: false });
    }
    doc.on("end", () => resolve({ buffer: Buffer.concat(chunks), info }));
    doc.end();
  });
}

// ─── Descarga (Express) ──────────────────────────────────────────────────────

export const exportFileName = (format: ClientExportFormat, now = new Date()) =>
  `clientes-${new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).format(now)}.${format}`;

export async function buildExport(format: ClientExportFormat): Promise<{ body: Buffer; rows: number }> {
  const table = await loadClientsTable();
  const body = format === "csv" ? toCsv(table) : format === "xlsx" ? await toXlsx(table) : (await toPdf(table)).buffer;
  return { body, rows: table.rows.length };
}

type AuthFn = (req: Request) => Promise<{ role?: string } | null>;

/**
 * GET /api/crm/clientes/export?format=xlsx|csv|pdf — solo administradora (mismo control que la factura en PDF).
 * Ignora cualquier filtro de la URL: exporta siempre todos los clientes.
 */
export function registerClientsExport(app: Express, authenticate: AuthFn) {
  app.get("/api/crm/clientes/export", async (req: Request, res: Response) => {
    let user: { role?: string } | null = null;
    try {
      user = await authenticate(req);
    } catch {
      user = null;
    }
    if (!user || user.role !== "admin") return res.status(401).json({ error: "No autorizado" });
    const format = String(req.query.format ?? "").toLowerCase() as ClientExportFormat;
    if (!CLIENT_EXPORT_FORMATS.includes(format)) return res.status(400).json({ error: "Formato no válido: usa xlsx, csv o pdf" });
    try {
      const { body, rows } = await buildExport(format);
      res.setHeader("Content-Type", CLIENT_EXPORT_MIME[format]);
      res.setHeader("Content-Disposition", `attachment; filename="${exportFileName(format)}"`);
      res.setHeader("Content-Length", body.length);
      res.setHeader("X-Total-Clientes", String(rows));
      res.setHeader("Cache-Control", "no-store");
      return res.end(body);
    } catch (err: any) {
      console.error("[Export clientes] Error:", err);
      return res.status(500).json({ error: "No se pudo generar el archivo" });
    }
  });
}
