/**
 * invoicePdf.ts — Generador de facturas en PDF
 * Diseño "Luz Botánica" — Cristina Vive Consciente
 *
 * Paleta:
 *   Verde principal: #3a6b3a  (oklch 0.52 0.08 148)
 *   Beige claro:     #f5f0e8
 *   Texto oscuro:    #1a1a1a
 *   Gris suave:      #6b7280
 */

import PDFDocument from "pdfkit";
import { getInvoiceById } from "./db";

// ── Colores ────────────────────────────────────────────────────────────────────
const COLOR_GREEN   = "#3a6b3a";
const COLOR_BEIGE   = "#f5f0e8";
const COLOR_DARK    = "#1a1a1a";
const COLOR_GRAY    = "#6b7280";
const COLOR_LIGHT   = "#e8e0d0";
const COLOR_WHITE   = "#ffffff";

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatDate(ts: number | null | undefined): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatCurrency(amount: string | number | null | undefined): string {
  const n = parseFloat(String(amount ?? 0));
  return n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    draft:     "Borrador",
    sent:      "Enviada",
    paid:      "Pagada",
    cancelled: "Cancelada",
  };
  return map[status] ?? status;
}

function statusColor(status: string): string {
  const map: Record<string, string> = {
    draft:     "#9ca3af",
    sent:      "#2563eb",
    paid:      "#16a34a",
    cancelled: "#dc2626",
  };
  return map[status] ?? COLOR_GRAY;
}

// ── Generador principal ────────────────────────────────────────────────────────
export async function generateInvoicePdf(invoiceId: number): Promise<Buffer> {
  const row = await getInvoiceById(invoiceId);
  if (!row) throw new Error("Factura no encontrada");

  const { invoice, client } = row;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 0,
      info: {
        Title: `Factura ${invoice.invoiceNumber}`,
        Author: "Cristina Vive Consciente",
        Subject: "Factura de servicios",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = 595.28; // A4 width in points
    const H = 841.89; // A4 height in points
    const MARGIN = 48;
    const CONTENT_W = W - MARGIN * 2;

    // ── CABECERA VERDE ─────────────────────────────────────────────────────────
    doc.rect(0, 0, W, 130).fill(COLOR_GREEN);

    // Logo / nombre empresa
    doc
      .fillColor(COLOR_WHITE)
      .font("Helvetica-Bold")
      .fontSize(22)
      .text("CRISTINA VIVE CONSCIENTE", MARGIN, 38, { width: CONTENT_W });

    doc
      .fillColor("rgba(255,255,255,0.75)")
      .font("Helvetica")
      .fontSize(10)
      .text("Bienestar Holístico Natural", MARGIN, 64, { width: CONTENT_W });

    // Número de factura (derecha)
    doc
      .fillColor(COLOR_WHITE)
      .font("Helvetica-Bold")
      .fontSize(14)
      .text(`FACTURA`, W - MARGIN - 160, 38, { width: 160, align: "right" });

    doc
      .fillColor("rgba(255,255,255,0.9)")
      .font("Helvetica")
      .fontSize(11)
      .text(invoice.invoiceNumber, W - MARGIN - 160, 58, { width: 160, align: "right" });

    // Badge de estado
    const badgeColor = statusColor(invoice.status);
    const badgeLabel = statusLabel(invoice.status).toUpperCase();
    const badgeW = 80;
    const badgeX = W - MARGIN - badgeW;
    const badgeY = 82;
    doc.roundedRect(badgeX, badgeY, badgeW, 22, 4).fill(badgeColor);
    doc
      .fillColor(COLOR_WHITE)
      .font("Helvetica-Bold")
      .fontSize(9)
      .text(badgeLabel, badgeX, badgeY + 6, { width: badgeW, align: "center" });

    // ── SECCIÓN DE DATOS (beige) ───────────────────────────────────────────────
    doc.rect(0, 130, W, 110).fill(COLOR_BEIGE);

    // Datos del emisor (izquierda)
    const col1X = MARGIN;
    const col2X = W / 2 + 10;
    const dataY = 148;

    doc
      .fillColor(COLOR_GREEN)
      .font("Helvetica-Bold")
      .fontSize(8)
      .text("EMISOR", col1X, dataY);

    doc
      .fillColor(COLOR_DARK)
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("Cristina Battistelli", col1X, dataY + 14);

    doc
      .fillColor(COLOR_GRAY)
      .font("Helvetica")
      .fontSize(9)
      .text("Cristina Vive Consciente", col1X, dataY + 28)
      .text("hola@cristinaviveconsciente.es", col1X, dataY + 40)
      .text("cristinaviveconsciente.es", col1X, dataY + 52);

    // Datos del cliente (derecha)
    const clientName = client
      ? `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim()
      : "Cliente";

    doc
      .fillColor(COLOR_GREEN)
      .font("Helvetica-Bold")
      .fontSize(8)
      .text("FACTURADO A", col2X, dataY);

    doc
      .fillColor(COLOR_DARK)
      .font("Helvetica-Bold")
      .fontSize(10)
      .text(clientName || "—", col2X, dataY + 14, { width: CONTENT_W / 2 });

    doc
      .fillColor(COLOR_GRAY)
      .font("Helvetica")
      .fontSize(9);

    let clientY = dataY + 28;
    if (client?.email) {
      doc.text(client.email, col2X, clientY, { width: CONTENT_W / 2 });
      clientY += 12;
    }
    if (client?.address) {
      doc.text(client.address, col2X, clientY, { width: CONTENT_W / 2 });
      clientY += 12;
    }
    if (client?.city) {
      doc.text(client.city, col2X, clientY, { width: CONTENT_W / 2 });
    }

    // ── FECHAS ─────────────────────────────────────────────────────────────────
    const datesY = 248;
    doc.rect(0, 240, W, 1).fill(COLOR_LIGHT);

    const dateFields = [
      { label: "Fecha de emisión", value: formatDate(invoice.issuedAt) },
      { label: "Fecha de vencimiento", value: formatDate(invoice.dueAt) },
      invoice.paidAt
        ? { label: "Fecha de pago", value: formatDate(invoice.paidAt) }
        : null,
    ].filter(Boolean) as { label: string; value: string }[];

    const dateColW = CONTENT_W / dateFields.length;
    dateFields.forEach((f, i) => {
      const dx = MARGIN + i * dateColW;
      doc
        .fillColor(COLOR_GREEN)
        .font("Helvetica-Bold")
        .fontSize(8)
        .text(f.label.toUpperCase(), dx, datesY);
      doc
        .fillColor(COLOR_DARK)
        .font("Helvetica")
        .fontSize(10)
        .text(f.value, dx, datesY + 14);
    });

    // ── CONCEPTO / TABLA ───────────────────────────────────────────────────────
    const tableY = 300;

    // Cabecera tabla
    doc.rect(MARGIN, tableY, CONTENT_W, 26).fill(COLOR_GREEN);
    doc
      .fillColor(COLOR_WHITE)
      .font("Helvetica-Bold")
      .fontSize(9)
      .text("CONCEPTO / DESCRIPCIÓN", MARGIN + 10, tableY + 8, { width: CONTENT_W * 0.6 })
      .text("IMPORTE", MARGIN + CONTENT_W * 0.6, tableY + 8, {
        width: CONTENT_W * 0.4 - 10,
        align: "right",
      });

    // Fila de concepto
    const rowY = tableY + 26;
    doc.rect(MARGIN, rowY, CONTENT_W, 40).fill(COLOR_BEIGE);
    doc
      .fillColor(COLOR_DARK)
      .font("Helvetica")
      .fontSize(10)
      .text(invoice.concept || "Servicio profesional", MARGIN + 10, rowY + 12, {
        width: CONTENT_W * 0.6 - 10,
      });
    doc
      .fillColor(COLOR_DARK)
      .font("Helvetica-Bold")
      .fontSize(10)
      .text(formatCurrency(invoice.subtotal), MARGIN + CONTENT_W * 0.6, rowY + 12, {
        width: CONTENT_W * 0.4 - 10,
        align: "right",
      });

    // Separador
    doc.rect(MARGIN, rowY + 40, CONTENT_W, 1).fill(COLOR_LIGHT);

    // ── TOTALES ────────────────────────────────────────────────────────────────
    const totalsY = rowY + 55;
    const totalsX = W - MARGIN - 220;
    const totalsW = 220;

    const taxAmount = parseFloat(String(invoice.tax ?? 0));
    const subtotal  = parseFloat(String(invoice.subtotal ?? 0));
    const total     = parseFloat(String(invoice.total ?? 0));

    const totalsRows = [
      { label: "Subtotal", value: formatCurrency(subtotal) },
      ...(taxAmount > 0 ? [{ label: "IVA", value: formatCurrency(taxAmount) }] : []),
    ];

    totalsRows.forEach((row, i) => {
      const ty = totalsY + i * 22;
      doc
        .fillColor(COLOR_GRAY)
        .font("Helvetica")
        .fontSize(10)
        .text(row.label, totalsX, ty, { width: totalsW / 2 });
      doc
        .fillColor(COLOR_DARK)
        .font("Helvetica")
        .fontSize(10)
        .text(row.value, totalsX + totalsW / 2, ty, {
          width: totalsW / 2,
          align: "right",
        });
    });

    // Total final (caja verde)
    const totalBoxY = totalsY + totalsRows.length * 22 + 8;
    doc.rect(totalsX, totalBoxY, totalsW, 36).fill(COLOR_GREEN);
    doc
      .fillColor(COLOR_WHITE)
      .font("Helvetica")
      .fontSize(11)
      .text("TOTAL", totalsX + 12, totalBoxY + 11);
    doc
      .fillColor(COLOR_WHITE)
      .font("Helvetica-Bold")
      .fontSize(14)
      .text(formatCurrency(total), totalsX, totalBoxY + 9, {
        width: totalsW - 12,
        align: "right",
      });

    // ── NOTAS ──────────────────────────────────────────────────────────────────
    if (invoice.notes) {
      const notesY = totalBoxY + 60;
      doc.rect(MARGIN, notesY, CONTENT_W, 1).fill(COLOR_LIGHT);
      doc
        .fillColor(COLOR_GREEN)
        .font("Helvetica-Bold")
        .fontSize(8)
        .text("NOTAS", MARGIN, notesY + 10);
      doc
        .fillColor(COLOR_GRAY)
        .font("Helvetica")
        .fontSize(9)
        .text(invoice.notes, MARGIN, notesY + 24, { width: CONTENT_W });
    }

    // ── PIE DE PÁGINA ──────────────────────────────────────────────────────────
    doc.rect(0, H - 60, W, 60).fill(COLOR_GREEN);
    doc
      .fillColor("rgba(255,255,255,0.7)")
      .font("Helvetica")
      .fontSize(8)
      .text(
        "Cristina Vive Consciente · hola@cristinaviveconsciente.es · cristinaviveconsciente.es",
        MARGIN,
        H - 38,
        { width: CONTENT_W, align: "center" }
      );
    doc
      .fillColor("rgba(255,255,255,0.5)")
      .fontSize(7)
      .text(
        "Gracias por confiar en nosotros. Este documento es una factura oficial.",
        MARGIN,
        H - 24,
        { width: CONTENT_W, align: "center" }
      );

    doc.end();
  });
}
