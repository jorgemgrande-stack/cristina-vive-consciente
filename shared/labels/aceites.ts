import type { LabelDef } from "./types";

const G = "Aceites esenciales";

/** Textos editables del catálogo de aceites esenciales (clave «aceites.<nombre>»). */
export const ACEITES_LABELS: readonly LabelDef[] = [
  { key: "aceites.search.ph", group: G, where: "Aceites esenciales · buscador: texto de ejemplo", text: "Buscar por nombre o uso" },
  { key: "aceites.filter.all", group: G, where: "Aceites esenciales · filtro: todos", text: "Todos" },
  { key: "aceites.filter.aceite", group: G, where: "Aceites esenciales · filtro: aceites puros", text: "Aceites esenciales puros" },
  { key: "aceites.filter.mezcla", group: G, where: "Aceites esenciales · filtro: sinergias", text: "Sinergias de aceites esenciales" },
  { key: "aceites.filter.base", group: G, where: "Aceites esenciales · filtro: vegetales", text: "Aceites vegetales y dilución" },
  { key: "aceites.filter.pack", group: G, where: "Aceites esenciales · filtro: packs", text: "Kits y packs" },
  { key: "aceites.filter.accesorio", group: G, where: "Aceites esenciales · filtro: accesorios", text: "Accesorios" },
  { key: "aceites.count.one", group: G, where: "Aceites esenciales · contador, singular (usa {n})", text: "{n} producto" },
  { key: "aceites.count.many", group: G, where: "Aceites esenciales · contador, plural (usa {n})", text: "{n} productos" },
  { key: "aceites.empty.text", group: G, where: "Aceites esenciales · sin resultados: texto", text: "No hay productos con esa búsqueda. Prueba con otro término." },
  { key: "aceites.empty.button", group: G, where: "Aceites esenciales · sin resultados: botón", text: "Ver todos los productos" },
  { key: "aceites.card.featured", group: G, where: "Aceites esenciales · tarjeta: insignia de destacado", text: "Destacado" },
  { key: "aceites.card.detail", group: G, where: "Aceites esenciales · tarjeta: botón “Ver detalle”", text: "Ver detalle" },
  { key: "aceites.type.aceite", group: G, where: "Aceites esenciales · tipo de producto: aceite", text: "Aceite esencial" },
  { key: "aceites.type.mezcla", group: G, where: "Aceites esenciales · tipo de producto: sinergia", text: "Sinergia" },
  { key: "aceites.type.base", group: G, where: "Aceites esenciales · tipo de producto: aceite vegetal", text: "Aceite vegetal y dilución" },
  { key: "aceites.type.pack", group: G, where: "Aceites esenciales · tipo de producto: kit o pack", text: "Kit o pack" },
  { key: "aceites.type.accesorio", group: G, where: "Aceites esenciales · tipo de producto: accesorio", text: "Accesorio" },
];
