/** Filtros del catálogo de aceites, en el orden que pidió Cristina. Cada uno es un tipo de producto de la ficha. */
export const OIL_FILTERS = [
  { value: "", labelKey: "aceites.filter.all" },
  { value: "aceite", labelKey: "aceites.filter.aceite" },
  { value: "mezcla", labelKey: "aceites.filter.mezcla" },
  { value: "base", labelKey: "aceites.filter.base" },
  { value: "pack", labelKey: "aceites.filter.pack" },
  { value: "accesorio", labelKey: "aceites.filter.accesorio" },
] as const;

export const oilTypeLabelKey = (tipo: string): string => (OIL_FILTERS.some((f) => f.value === tipo && tipo) ? `aceites.type.${tipo}` : "");

const fold = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** «Todos» (filtro vacío) no descarta ningún producto, tenga el tipo que tenga. */
export function filterOils<T extends { tipoProducto: string; name: string; tags?: string | null }>(products: T[], filter: string, search: string): T[] {
  const q = fold(search.trim());
  return products.filter((p) => {
    if (filter && p.tipoProducto !== filter) return false;
    if (!q) return true;
    let tags: string[] = [];
    try { tags = JSON.parse(p.tags ?? "[]") as string[]; } catch { /* etiquetas mal guardadas: se busca solo por nombre */ }
    return fold(p.name).includes(q) || tags.some((t) => !String(t).includes(":") && fold(String(t)).includes(q));
  });
}
