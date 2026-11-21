import type { LabelDef } from "./types";

const G = "Aceites esenciales";

/** Textos editables de la página de aceites esenciales (clave «aceites.<nombre>»). */
export const ACEITES_LABELS: readonly LabelDef[] = [
  { key: "aceites.notice.title", group: G, where: "Aceites esenciales · aviso superior: título en negrita (“Catálogo educativo:”)", text: "Catálogo educativo:" },
  { key: "aceites.notice.text", group: G, where: "Aceites esenciales · aviso superior: texto", text: "Este espacio no permite compra directa. Los aceites esenciales son herramientas terapéuticas que requieren orientación profesional. Añade los que te interesen a tu consulta y Cristina te guiará personalmente.", long: true },
  { key: "aceites.search.ph", group: G, where: "Aceites esenciales · buscador: texto de ejemplo", text: "Buscar por nombre o uso (ej: ansiedad, sueño, digestivo...)" },
  { key: "aceites.filter.all", group: G, where: "Aceites esenciales · filtros: botón “Todos” (usa {n} para el total)", text: "Todos ({n})" },
  { key: "aceites.cartBar.pre", group: G, where: "Aceites esenciales · barra de consulta: texto antes del número de productos", text: "Tienes" },
  { key: "aceites.cartBar.post", group: G, where: "Aceites esenciales · barra de consulta: texto después del número de productos", text: "en tu consulta personalizada" },
  { key: "aceites.cartBar.button", group: G, where: "Aceites esenciales · barra de consulta: botón", text: "Solicitar consulta" },
  { key: "aceites.count.one", group: G, where: "Aceites esenciales · contador, singular (usa {n})", text: "{n} producto" },
  { key: "aceites.count.many", group: G, where: "Aceites esenciales · contador, plural (usa {n})", text: "{n} productos" },
  { key: "aceites.empty.text", group: G, where: "Aceites esenciales · sin resultados: texto", text: "No hay productos con esa búsqueda. Prueba con otro término." },
  { key: "aceites.empty.button", group: G, where: "Aceites esenciales · sin resultados: botón", text: "Ver todos los productos" },
  { key: "aceites.card.featured", group: G, where: "Aceites esenciales · tarjeta: insignia de destacado", text: "Destacado" },
  { key: "aceites.card.detail", group: G, where: "Aceites esenciales · tarjeta: botón “Ver detalle”", text: "Ver detalle" },
  { key: "aceites.card.added", group: G, where: "Aceites esenciales · tarjeta: botón cuando ya está en la consulta", text: "Añadido" },
  { key: "aceites.card.consult", group: G, where: "Aceites esenciales · tarjeta: botón “Consultar”", text: "Consultar" },
  { key: "aceites.toast.removed", group: G, where: "Aceites esenciales · aviso al quitar de la consulta (usa {name})", text: "\"{name}\" eliminado de tu consulta" },
  { key: "aceites.toast.added", group: G, where: "Aceites esenciales · aviso al añadir a la consulta (usa {name})", text: "\"{name}\" añadido a tu consulta" },
  { key: "aceites.toast.view", group: G, where: "Aceites esenciales · aviso al añadir: botón de acción", text: "Ver consulta" },
  { key: "aceites.type.aceite", group: G, where: "Aceites esenciales · tipo de producto: aceite", text: "Aceite esencial" },
  { key: "aceites.type.mezcla", group: G, where: "Aceites esenciales · tipo de producto: mezcla", text: "Mezcla terapéutica" },
  { key: "aceites.type.base", group: G, where: "Aceites esenciales · tipo de producto: base", text: "Base y dilución" },
  { key: "aceites.type.pack", group: G, where: "Aceites esenciales · tipo de producto: pack", text: "Pack y guía" },
  { key: "aceites.type.accesorio", group: G, where: "Aceites esenciales · tipo de producto: accesorio", text: "Accesorio" },
  { key: "aceites.cta.title", group: G, where: "Aceites esenciales · bloque final: título", text: "¿No sabes por dónde empezar?" },
  { key: "aceites.cta.text", group: G, where: "Aceites esenciales · bloque final: texto", text: "Añade los aceites que te llaman la atención a tu consulta y Cristina te orientará sobre cuáles son los más adecuados para ti, cómo usarlos y en qué orden.", long: true },
  { key: "aceites.cta.book", group: G, where: "Aceites esenciales · bloque final: botón de reserva", text: "Reservar consulta con Cristina" },
  { key: "aceites.cta.cart", group: G, where: "Aceites esenciales · bloque final: botón “Ver mi consulta” (usa {n})", text: "Ver mi consulta ({n})" },
];
