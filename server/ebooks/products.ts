/**
 * Catálogo de ebooks — Cristina Vive Consciente
 * Define los productos, precios y metadatos de cada ebook.
 * Los PDF se sirven desde S3 con tokens de descarga temporales.
 *
 * Para añadir un nuevo ebook:
 * 1. Sube el PDF a S3 con manus-upload-file --webdev
 * 2. Añade una entrada en EBOOKS con la URL del CDN
 * 3. Crea el Price en Stripe Dashboard y añade el priceId aquí
 */

export interface EbookProduct {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  price: number;       // en euros
  priceCents: number;  // en céntimos para Stripe
  currency: string;
  /** ID del Price en Stripe (modo test y producción) */
  stripePriceId: string | null;
  /** URL del PDF en S3/CDN — null hasta que se suba el archivo */
  pdfUrl: string | null;
  /** Horas de validez del enlace de descarga */
  downloadExpiryHours: number;
  /** Imagen de portada */
  coverImage: string;
  /** Tags para etiquetar al cliente en el CRM */
  crmTag: string;
  /** Incluye sesión de 30 min */
  includesSession: boolean;
}

export const EBOOKS: Record<string, EbookProduct> = {
  agua: {
    id: "agua",
    title: "Guía del Agua Estructurada",
    subtitle: "Transforma el agua que bebes",
    description:
      "Todo lo que necesitas saber sobre el agua estructurada: qué es, cómo funciona, cómo prepararla en casa y por qué puede transformar tu salud. Incluye protocolos prácticos y recomendaciones de uso diario. Incluye sesión de 30 minutos con Cristina para resolver tus dudas.",
    price: 12,
    priceCents: 1200,
    currency: "EUR",
    stripePriceId: null, // Añadir cuando se configure Stripe: "price_xxxxxxxxxxxxxxxx"
    pdfUrl: null,        // Añadir URL del PDF tras subirlo: "https://cdn.../guia-agua.pdf"
    downloadExpiryHours: 72,
    coverImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/hero-agua-BJHXyW4FibywwKgaqzvu2q.webp",
    crmTag: "comprador_ebook_agua",
    includesSession: true,
  },
  aceites: {
    id: "aceites",
    title: "Guía de Aceites Esenciales",
    subtitle: "La sabiduría de las plantas en tu vida diaria",
    description:
      "Aprende a usar los aceites esenciales de forma segura y efectiva: aromaterapia, aplicación tópica, uso interno, combinaciones y protocolos para las situaciones más comunes del día a día. Una guía práctica para integrar el poder de las plantas en tu rutina de bienestar.",
    price: 7,
    priceCents: 700,
    currency: "EUR",
    stripePriceId: null, // Añadir cuando se configure Stripe: "price_xxxxxxxxxxxxxxxx"
    pdfUrl: null,        // Añadir URL del PDF tras subirlo: "https://cdn.../guia-aceites.pdf"
    downloadExpiryHours: 72,
    coverImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU/hero-aceites-cn5cmPNwkFkzA35ejtXJUa.webp",
    crmTag: "comprador_ebook_aceites",
    includesSession: false,
  },
};

export function getEbook(id: string): EbookProduct | null {
  return EBOOKS[id] ?? null;
}

export function getAllEbooks(): EbookProduct[] {
  return Object.values(EBOOKS);
}
