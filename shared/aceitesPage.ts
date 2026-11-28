/**
 * Contenido de serie de /aceites-esenciales. Es la página que se ve mientras Cristina no publique otra desde «Editar web»,
 * y el punto de partida de su borrador: una sola fuente para la web, el editor y la preparación del borrador.
 */
import { createBlock, DEFAULT_BLOCK_STYLE, type BlockDataMap, type BlockStyle, type BlockType, type PageBlock, type PageContent } from "./siteEditor";
import { BIZUM_PHONE } from "./orders";

/** Ebook «Guía de Aceites Esenciales» (CRM → Ebooks): de él salen el precio y la compra. */
export const ACEITES_GUIDE_SLUG = "aceites";

/** Canal oficial (el mismo WhatsApp de Cristina) con un mensaje inicial distinto por motivo. */
const wa = (text: string) => `https://wa.me/34${BIZUM_PHONE.replace(/^\+?34(?=\d{9}$)/, "")}?text=${encodeURIComponent(text)}`;
export const ACEITES_CONTACT = {
  group: wa("Hola Cristina, quiero hacer un pedido conjunto de aceites esenciales."),
  next: wa("Hola Cristina, ¿cuándo es el próximo pedido conjunto de aceites esenciales?"),
  individual: wa("Hola Cristina, quiero hacer un pedido individual de aceites esenciales."),
};

function B<K extends BlockType>(id: string, type: K, data: Partial<BlockDataMap[K]>, style?: Partial<BlockStyle>): PageBlock {
  const block = createBlock(type, data) as PageBlock;
  block.id = id;
  if (style) block.style = { ...DEFAULT_BLOCK_STYLE, ...style };
  return block;
}

export function aceitesBlocks(): PageBlock[] {
  return [
    B("hero", "hero", {
      eyebrow: "Aromaterapia consciente", title: "Aceites esenciales",
      subtitle: "Descubre las posibilidades de la aromaterapia e incorpora los aceites esenciales a tu vida cotidiana de una manera consciente, personalizada y segura",
      imageUrl: "/site/hero-aceites.webp", imageAlt: "Aceites esenciales y plantas aromáticas",
      buttonLabel: "Conocer servicios", buttonUrl: "#servicios", secondaryLabel: "Explorar catálogo", secondaryUrl: "#catalogo",
      height: "l", breadcrumb: "on",
    }),
    B("ac-servicios", "features", {
      title: "", intro: "", columns: "4",
      items: [
        { icon: "droplets", title: "Catálogo de aceites", text: "Descubre mi selección de aceites esenciales, sinergias, aceites vegetales y accesorios.", buttonLabel: "Explorar catálogo", buttonUrl: "#catalogo" },
        { icon: "clock", title: "Pedidos conjuntos", text: "Realizamos pedidos agrupados en determinadas fechas del año. Consulta cuándo realizamos el próximo pedido.", buttonLabel: "Próximo pedido", buttonUrl: "#pedidos" },
        { icon: "hand", title: "Asesoramiento personalizado", text: "Te acompaño a elegir los aceites más adecuados para ti y tu familia, a aprender cómo utilizarlos y a crear tu propio botiquín de aromaterapia.", buttonLabel: "Conocer asesoramiento", buttonUrl: "#asesoramiento" },
        { icon: "leaf", title: "Guías y recursos", text: "Material práctico para aprender y profundizar en el mundo de la aromaterapia a tu propio ritmo.", buttonLabel: "Ver recursos", buttonUrl: "#guias" },
      ],
    }, { background: "soft", anchor: "servicios" }),
    B("catalogo", "connected", {
      source: "aceites", title: "Catálogo de aceites",
      intro: "Aquí encontrarás una selección de los aceites esenciales, sinergias y accesorios que habitualmente recomiendo. Puedes explorar sus características y conocer sus posibilidades de uso.\n\nSi deseas adquirir alguno de estos productos, consulta nuestras modalidades de pedido.",
      buttonLabel: "Consultar pedidos", secondaryUrl: "#pedidos",
    }, { anchor: "catalogo" }),
    B("ac-pedidos", "oil_orders", {
      title: "Pedidos de aceites esenciales",
      groupTitle: "Pedidos conjuntos",
      groupText: "A lo largo del año organizo pedidos agrupados de aceites esenciales y accesorios. Esta modalidad permite realizar compras de menor importe y centralizar la preparación de los envíos.",
      groupMin: "25 €", groupNote: "Gastos de envío no incluidos.", groupHint: "Consulta cuándo realizamos el próximo pedido",
      groupOpen: "off", groupDeadline: "",
      groupOpenLabel: "Solicitar pedido conjunto", groupOpenUrl: ACEITES_CONTACT.group,
      groupClosedLabel: "Consultar el próximo pedido", groupClosedUrl: ACEITES_CONTACT.next,
      soloTitle: "Pedidos individuales",
      soloText: "Si necesitas adquirir o reponer tus aceites esenciales fuera de las fechas de pedidos conjuntos, puedes solicitar un pedido individual a partir de un importe mínimo de compra.",
      soloMin: "100 €", soloNote: "Gastos de envío no incluidos.", soloHint: "Si ya conoces los aceites que necesitas, no es necesario contratar un asesoramiento previo",
      soloLabel: "Solicitar pedido individual", soloUrl: ACEITES_CONTACT.individual,
      conditionsTitle: "Condiciones generales",
      conditions: [
        "No se establece un número mínimo de aceites, sino un importe mínimo de compra según la modalidad de pedido.",
        "Los gastos de envío se abonan aparte.",
        "El pago se realizará por adelantado.",
        "No es obligatorio contratar un asesoramiento para realizar una compra.",
      ].join("\n"),
      closing: "Todos los pedidos se gestionarán mediante contacto directo conmigo, previa confirmación de disponibilidad, importe y condiciones",
    }, { background: "soft", anchor: "pedidos" }),
    B("ac-asesoramiento", "service_offer", {
      eyebrow: "Asesoramiento personalizado de aromaterapia",
      title: "Tu botiquín de aceites esenciales en casa",
      intro: "Un acompañamiento personalizado para descubrir las posibilidades de la aromaterapia e incorporar los aceites esenciales a tu vida cotidiana y familiar, teniendo en cuenta tus necesidades, intereses y circunstancias personales.",
      includesTitle: "¿Qué incluye?",
      includes: [
        "Consulta individual de aromaterapia de 60 minutos.",
        "Selección personalizada de aceites esenciales según tus necesidades e intereses.",
        "Orientación sobre usos, formas de aplicación, diluciones y precauciones.",
        "Documento personalizado en PDF con la información y las recomendaciones de la consulta.",
        "Posibilidad de diseñar tu propio botiquín de aromaterapia, desde una pequeña selección de aceites esenciales hasta un botiquín familiar más completo.",
        "Guía básica de aceites esenciales en PDF incluida, valorada en 14,90 €.",
        "Gestión de la compra de los aceites seleccionados, si lo deseas.",
      ].join("\n"),
      howTitle: "¿Cómo funciona?",
      howText: "Tras la consulta recibirás toda la información personalizada en formato PDF, para que puedas revisarla con tranquilidad, explorar los aceites recomendados y decidir cuáles deseas incorporar a tu botiquín.\n\nUna vez hayas realizado tu selección, puedo encargarme de gestionar la compra.\n\nNo es necesario adquirir todos los aceites recomendados ni decidir cuáles comprar durante la consulta.",
      priceLabel: "Precio del servicio: 120 €",
      priceNote: "Incluye la consulta individual de 60 minutos, el trabajo posterior de elaboración del documento personalizado, la guía básica de aceites esenciales y la gestión de la compra.\n\nEl importe de los aceites y los gastos de envío se abonan aparte.",
      buttonLabel: "Reservar asesoramiento", buttonUrl: "",
      pendingText: "La reserva online de este asesoramiento todavía no está disponible.",
    }, { anchor: "asesoramiento" }),
    B("ac-guias", "resources", {
      title: "Guías y recursos",
      intro: "Material práctico para aprender y profundizar en el mundo de la aromaterapia a tu propio ritmo.",
      items: [{ ebookSlug: ACEITES_GUIDE_SLUG, title: "Guía de Aceites Esenciales", text: "PDF digital. Incluida sin coste adicional en el asesoramiento personalizado de aromaterapia.", buttonLabel: "Adquirir guía" }],
    }, { background: "soft", anchor: "guias" }),
  ];
}

export const ACEITES_SEO = {
  title: "Aceites esenciales · Aromaterapia consciente | Cristina Vive Consciente",
  description: "Catálogo de aceites esenciales, pedidos, asesoramiento personalizado de aromaterapia y guías digitales con Cristina.",
  ogImage: "", noindex: false,
};

export const aceitesContent = (): PageContent => ({ v: 1, seo: { ...ACEITES_SEO }, blocks: aceitesBlocks() });
