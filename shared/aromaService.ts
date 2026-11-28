/**
 * Consulta «Asesoramiento personalizado de aromaterapia». Estos datos solo sirven para DARLA DE ALTA una vez:
 * después manda CRM → Servicios (precio, textos, duración, publicación).
 */
export const AROMA_SERVICE_SLUG = "asesoramiento_aromaterapia";

export const AROMA_SERVICE = {
  slug: AROMA_SERVICE_SLUG,
  name: "Asesoramiento personalizado de aromaterapia",
  type: "consulta" as const,
  modality: "online" as const,
  price: "90.00",
  durationMinutes: 60,
  durationLabel: "Mínimo de una hora",
  shortDescription: "Tu botiquín de aceites esenciales en casa: acompañamiento online para elegir e incorporar los aceites a tu vida cotidiana y familiar.",
  longDescription: [
    "Tu botiquín de aceites esenciales en casa",
    "Un acompañamiento personalizado para descubrir las posibilidades de la aromaterapia e incorporar los aceites esenciales a tu vida cotidiana y familiar, teniendo en cuenta tus necesidades, intereses y circunstancias personales.",
    "Tras la consulta podrás valorar con tranquilidad los aceites recomendados y decidir cuáles deseas incorporar a tu botiquín.",
    "Recibirás tu documento personalizado en PDF en un plazo máximo de 10 días desde que me confirmes tu selección y, si lo deseas, puedo encargarme de gestionar la compra.",
    "No es necesario adquirir todos los aceites recomendados ni decidir cuáles comprar durante la consulta.",
    "Modalidad online. El importe de los aceites y los gastos de envío se abonan aparte.",
    "Antes de formalizar la reserva, puedes contactar conmigo por WhatsApp para resolver tus dudas y concretar el asesoramiento.",
  ].join("\n\n"),
  includes: JSON.stringify([
    "Consulta individual de un mínimo de una hora de duración.",
    "Selección personalizada de aceites esenciales según tus necesidades e intereses.",
    "Elaboración de un documento personalizado en PDF con los usos y aplicaciones de los aceites esenciales que hayas elegido.",
    "Guía básica de aceites esenciales en PDF.",
    "Gestión de la compra de los aceites seleccionados, si lo deseas.",
  ]),
  imageUrl: "/site/hero-aceites.webp",
  status: "active" as const,
  visibleEnPublico: true,
  featured: false,
  sortOrder: 7,
};

/** Preguntas de su ficha: las genéricas de consultas no valen aquí (plazo del documento y preparación distintos). */
export const AROMA_FAQ: ReadonlyArray<{ q: string; a: string }> = [
  { q: "¿Cómo se desarrolla el asesoramiento?", a: "Es una consulta individual de un mínimo de una hora. Después podrás valorar con tranquilidad los aceites recomendados y decidir cuáles deseas incorporar a tu botiquín." },
  { q: "¿Es online o presencial?", a: "Es online." },
  { q: "¿Cuándo recibiré el documento personalizado?", a: "Lo recibirás en PDF en un plazo máximo de 10 días desde que me confirmes tu selección de aceites." },
  { q: "¿Tengo que comprar los aceites recomendados?", a: "No es necesario adquirir todos los aceites recomendados ni decidir cuáles comprar durante la consulta. Si lo deseas, Cristina puede gestionar la compra; los aceites y el envío se abonan aparte." },
  { q: "¿Qué diferencia hay entre la guía básica y el PDF personalizado?", a: "La guía básica es un recurso general de aromaterapia. El PDF personalizado lo preparo para ti con los usos y aplicaciones de los aceites que elijas tras la consulta y te lo envío en un máximo de 10 días desde que me confirmes tu selección." },
];
