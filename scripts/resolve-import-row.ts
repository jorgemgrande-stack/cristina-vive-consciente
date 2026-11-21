/**
 * Marca una fila de CLIENTAS-ES como resuelta: la deja constar en la ficha y en el pedido, sin importarla.
 *   npx tsx scripts/resolve-import-row.ts <fila> <fichaId> <GUIA-XXXXXX> "<texto de la fila>" --dry-run | --apply
 * No crea compras ni historial: exige que el pedido ya esté pagado, vinculado a esa ficha y con UN único registro en Servicios.
 */
import { config } from "dotenv";
config();

const [row, clientId, ref, text] = [Number(process.argv[2]), Number(process.argv[3]), (process.argv[4] ?? "").toUpperCase(), process.argv[5] ?? ""];
const apply = process.argv.includes("--apply");
if (!row || !clientId || !/^GUIA-[A-Z0-9]{6}$/.test(ref) || !text || (!apply && !process.argv.includes("--dry-run"))) {
  console.error('Uso: resolve-import-row.ts <fila> <fichaId> <GUIA-XXXXXX> "<texto de la fila>" --dry-run | --apply');
  process.exit(1);
}
const { markRowResolved } = await import("../server/clientImport");
if (!apply) {
  console.log(`Previsto: nota en la ficha #${clientId} (fila ${row} → pedido ${ref}); no se importa nada. Ejecuta con --apply.`);
  process.exit(0);
}
console.log(JSON.stringify(await markRowResolved(row, clientId, ref, text)));
process.exit(0);
