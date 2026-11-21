/**
 * Exportar clientes: formatos (Excel real, CSV UTF-8 para Excel, PDF con encabezados repetidos), permisos de la
 * descarga y mismo número de clientes y columnas en los tres archivos aunque la URL lleve un filtro.
 * La parte con base de datos corre solo con SITE_TEST_DATABASE_URL.
 */
import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { buildExport, exportFileName, registerClientsExport, toCsv, toPdf, toXlsx, type ExportTable } from "./clientsExport";
import { CLIENT_LIST_ACTIONS_COLUMN, CLIENT_LIST_COLUMNS, clientExportRow } from "../shared/clientsExport";

/** Lector CSV (RFC 4180, separador «;») para comprobar que lo escrito se lee igual. */
function parseCsv(buf: Buffer): string[][] {
  let text = buf.toString("utf8");
  expect(text.charCodeAt(0)).toBe(0xfeff); // BOM: Excel detecta UTF-8
  text = text.slice(1);
  const rows: string[][] = [];
  let row: string[] = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') q = false;
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ";") { row.push(cell); cell = ""; }
    else if (ch === "\r" && text[i + 1] === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; i++; }
    else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

const hex = (s: string) => Buffer.from(s, "latin1").toString("hex");

const SAMPLE: ExportTable = {
  headers: CLIENT_LIST_COLUMNS,
  rows: [
    clientExportRow({ firstName: "Peñalver", lastName: "Núñez Ibáñez", email: "pe@mail.es", phone: "+34 0600 123 456", city: "Cádiz", status: "active" }),
    clientExportRow({ firstName: "Dani", lastName: 'O"Brien "el Grande"', email: "d@x.es", phone: "0034 600 000 001", city: "Línea 1\nLínea 2; (con punto y coma)", status: "lead" }),
    clientExportRow({ firstName: "Ángela", lastName: "", email: null, phone: "0012345", city: null, status: "inactive" }),
  ],
};

describe("columnas del listado", () => {
  it("encabezados y orden: Cliente, Contacto, Ciudad, Estado (sin Acciones)", () => {
    expect([...CLIENT_LIST_COLUMNS]).toEqual(["Cliente", "Contacto", "Ciudad", "Estado"]);
    expect(CLIENT_LIST_COLUMNS).not.toContain(CLIENT_LIST_ACTIONS_COLUMN);
  });
  it("la fila repite lo que ve el listado: nombre, email y teléfono en líneas, ciudad o «—», estado", () => {
    expect(SAMPLE.rows[0]).toEqual(["Peñalver Núñez Ibáñez", "pe@mail.es\n+34 0600 123 456", "Cádiz", "Activa"]);
    expect(SAMPLE.rows[2]).toEqual(["Ángela", "0012345", "—", "Inactiva"]);
  });
});

describe("CSV", () => {
  it("UTF-8 con BOM; tildes, ñ, comillas, punto y coma y saltos de línea se leen igual", () => {
    const parsed = parseCsv(toCsv(SAMPLE));
    expect(parsed[0]).toEqual([...CLIENT_LIST_COLUMNS]);
    expect(parsed.slice(1)).toEqual(SAMPLE.rows);
    expect(parsed[2][0]).toBe('Dani O"Brien "el Grande"');
    expect(parsed[2][2]).toBe("Línea 1\nLínea 2; (con punto y coma)");
    expect(parsed[3][1]).toBe("0012345"); // ceros iniciales conservados
  });
});

describe("Excel (.xlsx)", () => {
  it("es un xlsx real y conserva teléfonos con prefijo y ceros iniciales como texto", async () => {
    const buf = await toXlsx(SAMPLE);
    expect(buf.subarray(0, 2).toString()).toBe("PK"); // contenedor zip de un .xlsx
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as any);
    const ws = wb.getWorksheet("Clientes")!;
    expect(ws.rowCount).toBe(1 + SAMPLE.rows.length);
    expect((ws.getRow(1).values as any[]).slice(1)).toEqual([...CLIENT_LIST_COLUMNS]);
    for (let r = 0; r < SAMPLE.rows.length; r++) {
      for (let c = 0; c < 4; c++) {
        const cell = ws.getRow(r + 2).getCell(c + 1);
        expect(typeof cell.value).toBe("string"); // nunca número
        expect(String(cell.value)).toBe(SAMPLE.rows[r][c]);
        expect(cell.numFmt).toBe("@");
      }
    }
    expect(ws.getRow(4).getCell(2).value).toBe("0012345");
    expect(ws.getRow(2).getCell(2).value).toBe("pe@mail.es\n+34 0600 123 456");
  });
});

describe("PDF", () => {
  const many: ExportTable = { headers: CLIENT_LIST_COLUMNS, rows: Array.from({ length: 140 }, (_, i) => clientExportRow({ firstName: `Cliente${i}`, lastName: "Núñez", email: `c${i}@mail.es`, phone: `+34 6${String(i).padStart(8, "0")}`, city: "Cádiz", status: "active" })) };

  it("es un PDF válido, usa el ancho de la página y repite los encabezados en cada página", async () => {
    const { buffer, info } = await toPdf(many, { compress: false });
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
    expect(buffer.subarray(-8).toString()).toContain("%%EOF");
    expect(info.rows).toBe(140);
    expect(info.pages).toBeGreaterThan(1);
    expect(info.headerPages).toBe(info.pages); // encabezado en TODAS las páginas
    // sin comprimir, el texto está en hexadecimal: «Contacto» aparece una vez por página
    const raw = buffer.toString("latin1");
    expect(raw.split(hex("Contacto")).length - 1).toBe(info.pages);
    // todas las páginas son A4 (595 pt) y la tabla cabe en su ancho útil
    expect(raw).toContain("/MediaBox [0 0 595.28 841.89]");
  });
  it("con una sola página también lleva encabezado y recuento", async () => {
    const { info } = await toPdf(SAMPLE);
    expect(info).toMatchObject({ pages: 1, headerPages: 1, rows: 3 });
  });
});

describe("nombre del archivo", () => {
  it("clientes-AAAA-MM-DD.ext con la fecha de Madrid", () => {
    expect(exportFileName("xlsx", new Date("2026-11-21T23:30:00Z"))).toBe("clientes-2026-11-22.xlsx");
    expect(exportFileName("csv", new Date("2026-06-01T12:00:00Z"))).toBe("clientes-2026-06-01.csv");
  });
});

const URL = process.env.SITE_TEST_DATABASE_URL;
const d = describe.runIf(!!URL && /(_test|test_)/.test(URL ?? ""));

d("descarga real con permisos (BD de pruebas)", () => {
  it("mismo número de clientes y mismas columnas en los tres archivos, también con un filtro en la URL; 401 sin ser admin", async () => {
    process.env.DATABASE_URL = URL;
    const { default: express } = await import("express");
    const dbm = await import("./db");
    const s = await import("../drizzle/schema");
    const { like } = await import("drizzle-orm");
    const conn = (await dbm.getDb())!;
    const tag = `exp${Date.now()}`;
    try {
      // datos de prueba con tildes, ñ, comillas, saltos de línea y teléfonos con ceros/prefijo
      await conn.insert(s.clients).values([
        { firstName: "Peñalver", lastName: `${tag} Núñez`, email: `a@${tag}.test`, phone: "+34 0600 111 222", city: "Cádiz", status: "active" },
        { firstName: "Dani", lastName: `${tag} O"Brien`, email: `b@${tag}.test`, phone: "0034 600 333 444", city: "Línea 1\nLínea 2", status: "lead" },
        { firstName: "Ángela", lastName: tag, email: null, phone: "0012345", city: null, status: "inactive" },
      ]);
      const total = (await dbm.getClients()).length;
      expect(total).toBeGreaterThanOrEqual(3);

      let role: string | null = "admin";
      const app = express();
      registerClientsExport(app, async () => (role ? { role } : null));
      const server = http.createServer(app);
      await new Promise<void>((r) => server.listen(0, r));
      const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/crm/clientes/export`;
      try {
        // el filtro de la URL (estado, búsqueda, categoría) NO limita la descarga
        const q = "&status=lead&search=Dani&category=guias";
        const csv = await fetch(`${base}?format=csv${q}`);
        const xlsx = await fetch(`${base}?format=xlsx${q}`);
        const pdf = await fetch(`${base}?format=pdf${q}`);
        for (const [r, ct, ext] of [[csv, "text/csv", "csv"], [xlsx, "spreadsheetml.sheet", "xlsx"], [pdf, "application/pdf", "pdf"]] as const) {
          expect(r.status).toBe(200);
          expect(r.headers.get("content-type")).toContain(ct);
          expect(r.headers.get("content-disposition")).toMatch(new RegExp(`attachment; filename="clientes-\\d{4}-\\d{2}-\\d{2}\\.${ext}"`));
          expect(Number(r.headers.get("x-total-clientes"))).toBe(total);
        }
        const csvRows = parseCsv(Buffer.from(await csv.arrayBuffer()));
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(Buffer.from(await xlsx.arrayBuffer()) as any);
        const ws = wb.getWorksheet("Clientes")!;
        const pdfBuf = Buffer.from(await pdf.arrayBuffer());
        expect(pdfBuf.subarray(0, 5).toString()).toBe("%PDF-");

        // mismo número de clientes (aunque el listado de pantalla filtrase)
        expect(csvRows.length - 1).toBe(total);
        expect(ws.rowCount - 1).toBe(total);
        const { info } = await toPdf((await (await import("./clientsExport")).loadClientsTable()));
        expect(info.rows).toBe(total);
        // mismas columnas y mismo orden
        expect(csvRows[0]).toEqual([...CLIENT_LIST_COLUMNS]);
        expect((ws.getRow(1).values as any[]).slice(1)).toEqual([...CLIENT_LIST_COLUMNS]);
        // y mismo contenido fila a fila entre CSV y Excel
        for (let i = 1; i <= total; i++) expect((ws.getRow(i + 1).values as any[]).slice(1).map(String)).toEqual(csvRows[i]);
        // los datos de prueba se leen bien
        const mine = csvRows.filter((r) => r[0].includes(tag));
        expect(mine.map((r) => r[0]).sort()).toEqual([`Peñalver ${tag} Núñez`, `Dani ${tag} O"Brien`, `Ángela ${tag}`].sort());
        expect(mine.find((r) => r[0].startsWith("Dani"))![2]).toBe("Línea 1\nLínea 2");
        expect(mine.find((r) => r[0].startsWith("Ángela"))![1]).toBe("0012345");

        // permisos: sin sesión de administradora, nada se descarga
        role = null;
        expect((await fetch(`${base}?format=csv`)).status).toBe(401);
        role = "user";
        expect((await fetch(`${base}?format=pdf`)).status).toBe(401);
        role = "admin";
        expect((await fetch(`${base}?format=docx`)).status).toBe(400);
        expect((await buildExport("csv")).rows).toBe(total);
      } finally {
        await new Promise<void>((r) => server.close(() => r()));
      }
    } finally {
      await conn.delete(s.clients).where(like(s.clients.lastName, `%${tag}%`));
    }
  }, 90_000);
});
