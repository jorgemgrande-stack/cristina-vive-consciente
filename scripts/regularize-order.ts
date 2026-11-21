/**
 * Regulariza UN pedido ya pagado: lo vincula a la ficha (por el email del pedido) o crea la ficha, y lo
 * registra en «Servicios recibidos». NO reenvía la guía ni repite la confirmación de pago: solo escribe en
 * clients (si hace falta), orders.clientId/clientLinkStatus y client_services.
 *
 *   npx tsx scripts/regularize-order.ts GUIA-XXXXXX --dry-run
 *   npx tsx scripts/regularize-order.ts GUIA-XXXXXX --apply
 * La salida no muestra nombres, emails ni teléfonos.
 */
import { config } from "dotenv";
config();

const ref = (process.argv[2] ?? "").trim().toUpperCase();
const apply = process.argv.includes("--apply");
if (!/^GUIA-[A-Z0-9]{6}$/.test(ref) || (!apply && !process.argv.includes("--dry-run"))) {
  console.error("Uso: regularize-order.ts GUIA-XXXXXX --dry-run | --apply");
  process.exit(1);
}
const { getDb } = await import("../server/db");
const { orders, clientServices } = await import("../drizzle/schema");
const { eq } = await import("drizzle-orm");
const sr = await import("../server/servicesReceivedDb");

const db = (await getDb())!;
const [o] = await db.select().from(orders).where(eq(orders.reference, ref)).limit(1);
if (!o) { console.error(`No existe el pedido ${ref}`); process.exit(2); }
console.log(`Pedido ${ref}: ${o.productTitle} · ${o.amountCents / 100} € · estado ${o.status} · guía enviada: ${o.deliveryEmailSentAt ? "sí" : "no"} · ficha vinculada: ${o.clientId ?? "ninguna"} (${o.clientLinkStatus ?? "sin estado"})`);
if (o.status !== "paid") { console.error("El pedido no está pagado: no se regulariza."); process.exit(3); }
const matches = o.clientId ? [{ id: o.clientId }] : await sr.clientsByEmail(o.customerEmail);
console.log(`Fichas con el email del pedido: ${matches.length}${matches.length ? ` (ids ${matches.map((m) => m.id).join(", ")})` : ""}`);
const already = o.clientId ? (await db.select().from(clientServices).where(eq(clientServices.orderId, o.id))).length : 0;
console.log(`Registros ya existentes en Servicios recibidos para este pedido: ${already}`);
console.log(matches.length > 1 ? "→ Resultado previsto: REVISIÓN (varias fichas); no se vincula nada." : matches.length === 1 ? "→ Resultado previsto: vincular a la ficha existente y registrar la compra." : "→ Resultado previsto: crear la ficha y registrar la compra.");

if (apply) {
  const before = { delivery: o.deliveryEmailSentAt, paidAt: o.paidAt, status: o.status };
  const r = await sr.linkOrderToClient(o.id);
  const [after] = await db.select().from(orders).where(eq(orders.id, o.id)).limit(1);
  const unchanged = after.deliveryEmailSentAt === before.delivery && after.paidAt === before.paidAt && after.status === before.status;
  console.log(`RESULTADO: ${JSON.stringify(r)} · pago y envío de la guía sin cambios: ${unchanged ? "sí" : "NO"}`);
}
process.exit(0);
