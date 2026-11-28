/**
 * Pasa el bloque de pedidos de un borrador a las condiciones nuevas sin pisar lo que Cristina haya editado.
 * El borrador puede estar tal como lo dejó la versión anterior (con groupMin, estado y fecha) o haberse guardado ya con
 * el editor nuevo, que descarta esos campos y deja vacíos los nuevos. Aplicarlo dos veces da lo mismo.
 */
type Data = Record<string, unknown>;

/** Textos de serie de la versión anterior: un campo que siga así se actualiza; si es otro, es una edición y se conserva. */
export const PREVIOUS_ORDERS: Readonly<Record<string, string>> = {
  title: "Pedidos de aceites esenciales",
  groupTitle: "Pedidos conjuntos",
  groupText: "A lo largo del año organizo pedidos agrupados de aceites esenciales y accesorios. Esta modalidad permite realizar compras de menor importe y centralizar la preparación de los envíos.",
  groupHint: "Consulta cuándo realizamos el próximo pedido",
  soloTitle: "Pedidos individuales",
  soloText: "Si necesitas adquirir o reponer tus aceites esenciales fuera de las fechas de pedidos conjuntos, puedes solicitar un pedido individual a partir de un importe mínimo de compra.",
  soloHint: "Si ya conoces los aceites que necesitas, no es necesario contratar un asesoramiento previo",
  soloLabel: "Solicitar pedido individual",
  conditionsTitle: "Condiciones generales",
  conditions: [
    "No se establece un número mínimo de aceites, sino un importe mínimo de compra según la modalidad de pedido.",
    "Los gastos de envío se abonan aparte.",
    "El pago se realizará por adelantado.",
    "No es obligatorio contratar un asesoramiento para realizar una compra.",
  ].join("\n"),
  closing: "Todos los pedidos se gestionarán mediante contacto directo conmigo, previa confirmación de disponibilidad, importe y condiciones",
};
const PREVIOUS_CLOSED_LABEL = "Consultar el próximo pedido";
/** Campos que no existían antes: vacíos significan «sin rellenar». */
const NEW_FIELDS = ["groupPoints", "soloPoints", "groupLabel", "groupUrl"];

const empty = (v: unknown) => v === undefined || v === null || v === "";

export function needsOrdersMigration(data: Data): boolean {
  return "groupMin" in data || (empty(data.groupPoints) && empty(data.soloPoints)) || data.conditions === PREVIOUS_ORDERS.conditions;
}

export function migrateOrdersBlock(data: Data, next: Data): { data: Data; changed: boolean; kept: string[] } {
  if (!needsOrdersMigration(data)) return { data, changed: false, kept: [] };
  const out: Data = {};
  const kept: string[] = [];
  for (const [key, value] of Object.entries(next)) {
    const current = data[key];
    const untouched = NEW_FIELDS.includes(key)
      ? empty(current)
      : current === undefined || current === PREVIOUS_ORDERS[key] || current === value;
    out[key] = untouched ? value : current;
    if (!untouched && current !== value) kept.push(key);
  }
  // Un botón de consulta personalizado en la versión anterior (aún presente) pasa al botón nuevo
  const closedUrl = data.groupClosedUrl, closedLabel = data.groupClosedLabel;
  if (empty(data.groupUrl) && typeof closedUrl === "string" && closedUrl && !closedUrl.startsWith("https://wa.me/34657165343")) { out.groupUrl = closedUrl; kept.push("groupUrl"); }
  if (empty(data.groupLabel) && typeof closedLabel === "string" && closedLabel && closedLabel !== PREVIOUS_CLOSED_LABEL) { out.groupLabel = closedLabel; kept.push("groupLabel"); }
  return { data: out, changed: JSON.stringify(out) !== JSON.stringify(data), kept };
}
