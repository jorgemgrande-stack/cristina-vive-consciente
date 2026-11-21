/**
 * Columnas del listado de Clientes (/crm/clientes) y de su exportación.
 * El listado y los tres archivos (Excel, CSV, PDF) usan ESTOS encabezados y ESTE orden. Sin la columna de acciones
 * ni datos de la ficha que no aparecen en la tabla.
 */
export const CLIENT_LIST_COLUMNS = ["Cliente", "Contacto", "Ciudad", "Estado"] as const;
export const CLIENT_LIST_ACTIONS_COLUMN = "Acciones";

export const CLIENT_STATUS_LABELS: Record<string, string> = { active: "Activa", inactive: "Inactiva", lead: "Lead" };
export const clientStatusLabel = (status: string) => CLIENT_STATUS_LABELS[status] ?? CLIENT_STATUS_LABELS.active;

export const CLIENT_EXPORT_FORMATS = ["xlsx", "csv", "pdf"] as const;
export type ClientExportFormat = (typeof CLIENT_EXPORT_FORMATS)[number];
export const CLIENT_EXPORT_MIME: Record<ClientExportFormat, string> = {
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv; charset=utf-8",
  pdf: "application/pdf",
};

/** Celda de una fila del listado: lo mismo que se ve en pantalla (email y teléfono en líneas separadas). */
export function clientExportRow(c: { firstName: string; lastName: string; email: string | null; phone: string | null; city: string | null; status: string }): string[] {
  return [
    `${c.firstName} ${c.lastName}`.replace(/\s+/g, " ").trim(),
    [c.email, c.phone].filter((x) => x && String(x).trim()).join("\n"),
    c.city ?? "—",
    clientStatusLabel(c.status),
  ];
}
