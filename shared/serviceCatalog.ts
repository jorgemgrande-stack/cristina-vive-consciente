/** Servicios recibidos: catálogo en árbol (categoría → tipo → artículo) y estados de pago. */

export type CatalogKind = "category" | "group" | "item";

export interface CatalogNode {
  id: number;
  parentId: number | null;
  kind: CatalogKind;
  name: string;
  slug: string;
  ebookSlug: string | null;
  priceCents: number | null;
  sortOrder: number;
  archived: number;
}

export type PaymentStatus = "free" | "paid" | "pending";
export const PAYMENT_LABELS: Record<PaymentStatus, string> = { free: "Gratuito", paid: "Pagado", pending: "Pendiente de pago" };

/** «12 €» / «12,50 €» */
export function euros(cents: number | null | undefined): string {
  if (cents == null) return "";
  const v = cents / 100;
  return `${Number.isInteger(v) ? v : v.toFixed(2).replace(".", ",")} €`;
}

/** Hijos de un nodo no archivados, en orden. */
export function childrenOf(nodes: CatalogNode[], parentId: number | null, includeArchived = false): CatalogNode[] {
  return nodes
    .filter((n) => n.parentId === parentId && (includeArchived || !n.archived))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "es"));
}

/** Cadena de nodos desde la categoría hasta el nodo (para guardar categoría/tipo/artículo y la ruta escrita). */
export function pathTo(nodes: CatalogNode[], id: number): CatalogNode[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const out: CatalogNode[] = [];
  for (let cur = byId.get(id); cur && out.length < 5; cur = cur.parentId ? byId.get(cur.parentId) : undefined) out.unshift(cur);
  return out;
}

export const pathLabel = (path: CatalogNode[]) => path.map((n) => n.name).join(" → ");

/** Línea de la ficha: «Productos → Ebooks → Guía Digital del Agua · 12 € · Pagado» */
export function serviceLine(s: { pathLabel: string; amountCents: number | null; paymentStatus: PaymentStatus }): string {
  return [s.pathLabel, euros(s.amountCents), PAYMENT_LABELS[s.paymentStatus]].filter(Boolean).join(" · ");
}

/** Qué se puede crear dentro de un nodo: en la raíz, categorías; en una categoría, tipos o artículos; en un tipo, artículos. */
export function allowedChildKinds(parent: CatalogNode | null): CatalogKind[] {
  if (!parent) return ["category"];
  if (parent.kind === "category") return ["group", "item"];
  if (parent.kind === "group") return ["item"];
  return [];
}

export function slugify(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100) || "elemento";
}
