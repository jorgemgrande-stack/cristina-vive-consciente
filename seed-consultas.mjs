/**
 * seed-consultas.mjs
 * Migra las 6 consultas hardcodeadas en Consultas.tsx a la base de datos.
 * Solo inserta si el slug NO existe ya (idempotente).
 *
 * Uso: node seed-consultas.mjs
 */

import mysql from "mysql2/promise";

const DB_URL =
  process.env.DATABASE_URL ||
  "mysql://root:dLYimRwhxWJTnKKoqTPQsFFxKAfGvIfI@hopper.proxy.rlwy.net:41985/railway";

const CONSULTAS = [
  {
    slug: "consulta_acompanamiento",
    name: "Consulta + Acompañamiento 21 días",
    shortDescription:
      "Consulta integral con acompañamiento continuo hasta la implementación de un hábito.",
    price: "140.00",
    durationMinutes: 90,
    durationLabel: "Consulta inicial + 21 días seguimiento",
    type: "consulta",
    modality: "ambos",
    featured: 1,
    sortOrder: 1,
    longDescription:
      "Esta consulta incluye el contenido descrito en la consulta naturopata de 60 min y tiene un valor añadido que es clave: el acompañamiento continuo hasta la implementación de un hábito. Este tipo de seguimiento ofrece a los clientes apoyo cercano mientras hacen los cambios, lo que aumenta su compromiso y resultados. Es una consulta integral donde se ven un compendio de diferentes cuestiones que conforman la biohabitabilidad.\n\nEste servicio integral incluye una consulta inicial en la que evaluaremos tu caso a fondo, con un estudio personalizado y recomendaciones concretas. Además, contarás con 21 días de seguimiento por WhatsApp donde te acompañaré a través de audios y/o por escrito para resolver dudas que vayan surgiendo. También recibirás una lista de compra recomendada basada en tu dieta y cambios que consideremos oportunos, con recomendaciones de todo tipo de productos saludables y libres de tóxicos en áreas como: alimentación, utensilios de cocina, productos de limpieza, textil, cosmética, higiene electromagnética y lumínica.\n\nAdemás, un PDF donde también incluiremos pautas de suplementación ideal para acompañar este estilo de vida.\n\nDisponible presencialmente, por teléfono o vía Zoom.",
    benefits: JSON.stringify([
      "Adoptar un estilo de vida saludable y conectado con la naturaleza",
      "Implementar hábitos saludables y duraderos con apoyo real",
    ]),
    includes: JSON.stringify([
      "Consulta inicial completa con anamnesis",
      "21 días de seguimiento por WhatsApp (audios y mensajes)",
      "Lista de compra personalizada libre de tóxicos",
      "PDF con pautas de suplementación",
    ]),
    contraindications: null,
  },
  {
    slug: "consulta_naturopata",
    name: "Consulta Naturópata",
    shortDescription:
      "Estudio del caso con anamnesis, análisis de dieta y recomendaciones personalizadas.",
    price: "90.00",
    durationMinutes: 60,
    durationLabel: "Mínimo 60 min",
    type: "consulta",
    modality: "ambos",
    featured: 0,
    sortOrder: 2,
    longDescription:
      "Sesión que dura mínimo 1 hora y en función de la necesidad puede ser más larga. Se realiza un estudio del caso con anamnesis y análisis de dieta. Valoraremos posible mineralograma o análisis complementarios. Se requiere un registro de dieta 7 días antes de la consulta, donde el cliente interesado anotará lo que come y bebe durante este tiempo, de manera que podamos hacer cambios estructurales si así fuera conveniente.\n\nEsta consulta es útil para cualquier persona que quiera comprender mejor su salud desde un enfoque integral y basado en la naturaleza.",
    benefits: JSON.stringify([
      "Problemas de salud crónicos o recurrentes que buscan alternativas naturales",
      "Recuperar energía y equilibrio hormonal mediante alimentación y estilo de vida",
      "Protocolos de desintoxicación con arcillas y/o otros complementos",
      "Suplementación personalizada para el sistema inmune (adultos y niños)",
      "Futuros padres que quieren optimizar su fertilidad o llevar un embarazo saludable",
      "Familias que buscan mejorar la alimentación de sus hijos libre de aditivos",
      "Personas interesadas en reducir tóxicos en su entorno y productos de uso diario",
      "Sobrepeso o problemas metabólicos con enfoque natural y adaptado",
      "Dietas antiinflamatorias para molestias articulares, digestivas u otras",
    ]),
    includes: JSON.stringify([
      "Estudio del caso con anamnesis completa",
      "Análisis de dieta (registro previo de 7 días)",
      "Recomendaciones personalizadas por escrito",
    ]),
    contraindications: null,
  },
  {
    slug: "consulta_breve",
    name: "Consulta Breve Naturopatía 30 min",
    shortDescription:
      "Opción pensada para resolver dudas puntuales de forma rápida y económica.",
    price: "30.00",
    durationMinutes: 30,
    durationLabel: "30 min",
    type: "consulta",
    modality: "online",
    featured: 0,
    sortOrder: 3,
    longDescription:
      "Opción pensada para resolver dudas puntuales de forma rápida y económica. En esta consulta aclaramos inquietudes específicas sin necesidad de realizar anamnesis ni estudio de caso.\n\nSe realiza por vía telefónica o, si lo prefieres, por escrito (WhatsApp o email). La consulta es ideal para quienes necesitan una orientación breve y efectiva en una sola sesión. Las dudas se envían con antelación para optimizar el tiempo.",
    benefits: JSON.stringify([
      "Entender el entorno que habitas",
      "Estilo de vida saludable y conexión con la naturaleza",
      "Crianza consciente y respetuosa",
      "Eliminación de tóxicos del hogar",
      "Alimentación ecológica libre de aditivos",
      "Dietas antiinflamatorias y sin contar calorías",
      "Remedios naturales para diferentes patologías",
      "Higiene electromagnética y lumínica (ritmos circadianos)",
      "Problemas de peso y reequilibrio hormonal",
      "Fertilidad, embarazo y alimentación infantil",
      "Uso terapéutico de aceites esenciales",
    ]),
    includes: null,
    contraindications:
      "Si no quedas satisfecho te haré devolución. Si no puedo resolverla, te derivaré a otro profesional de mi competencia o te proporcionaré grupos de apoyo para que puedas buscar la información y autogestionar tu propia salud.",
  },
  {
    slug: "consulta_express",
    name: "Consulta Express Salud",
    shortDescription:
      "Para las dudas que me llegan a través de redes sociales, atendidas con todo detalle.",
    price: "10.00",
    durationMinutes: 15,
    durationLabel: "Por escrito o audio",
    type: "consulta",
    modality: "online",
    featured: 0,
    sortOrder: 4,
    longDescription:
      "Es casi seguro que si has llegado hasta aquí es porque yo misma te he derivado a esta sección de la web, debido a la alta demanda de consultas breves que recibo en las redes sociales. Me veo en la tesitura de atender cada una de ellas a través de esta plataforma; de esta manera mi tiempo y mi energía no se ven comprometidos y puedo atenderlas con todo lujo de detalles, como cada una merece, ya que todas son igual de importantes.\n\nEn mis años de estudio, divulgación y activismo he recopilado suficiente información como para dar soporte a casi cualquier duda que pueda surgirte.\n\nMándame tu consulta por escrito o por audio y te contesto de la misma manera.",
    benefits: JSON.stringify([
      "Entender el entorno que habitas",
      "Estilo de vida saludable y naturaleza",
      "Crianza consciente y respetuosa",
      "Eliminación de tóxicos del hogar",
      "Alimentación ecológica libre de aditivos",
      "Dietas antiinflamatorias",
      "Remedios naturales para diferentes patologías",
      "Problemas de peso y reequilibrio hormonal",
      "Fertilidad, embarazo y alimentación infantil",
      "Uso terapéutico de aceites esenciales",
    ]),
    includes: null,
    contraindications:
      "Si no quedas satisfecho te haré devolución. Si no puedo resolver tu consulta, te derivaré a otro profesional de mi competencia o te proporcionaré grupos de apoyo.",
  },
  {
    slug: "biohabitabilidad",
    name: "Asesoría de Biohabitabilidad",
    shortDescription:
      "Claves para redefinir tu espacio vital y ganar salud a través del entorno que habitas.",
    price: null,
    durationMinutes: 60,
    durationLabel: "A consultar",
    type: "consulta",
    modality: "ambos",
    featured: 0,
    sortOrder: 5,
    longDescription:
      "¿Quieres comprender el entorno en el que habitas para ganar salud a través de las características que lo conforman y no sabes por dónde empezar? Esta asesoría te dará las claves para redefinir tu espacio vital.",
    benefits: JSON.stringify([
      "Comprender cómo afecta tu entorno a tu salud",
      "Identificar y reducir fuentes de tóxicos en tu hogar",
      "Mejorar la higiene electromagnética y lumínica",
      "Crear un espacio vital más saludable y consciente",
    ]),
    includes: null,
    contraindications: null,
  },
  {
    slug: "kinesiologia",
    name: "Testaje Kinesiológico para Homeopatía",
    shortDescription:
      "Encuentra el remedio homeopático que tu organismo necesita mediante kinesiología cuántica.",
    price: "15.00",
    durationMinutes: 30,
    durationLabel: "A distancia",
    type: "consulta",
    modality: "online",
    featured: 0,
    sortOrder: 6,
    longDescription:
      "Encuentra el remedio homeopático que tu organismo necesita. Nuestro servicio de testaje kinesiológico está diseñado específicamente para identificar qué productos homeopáticos son más adecuados para ti. A través de un método no invasivo, evaluamos las respuestas de tu cuerpo para seleccionar los remedios y dosis que mejor se adapten a tus necesidades.\n\nUtilizamos la kinesiología cuántica a distancia para evaluar las respuestas energéticas de tu cuerpo frente a diferentes estímulos homeopáticos, permitiendo una selección personalizada y efectiva de los remedios más adecuados para ti.\n\nDescubre cómo la homeopatía puede ayudarte a alcanzar el equilibrio perfecto.",
    benefits: JSON.stringify([
      "Personas que buscan un tratamiento homeopático personalizado",
      "Complementar otros procesos de salud con un enfoque natural",
    ]),
    includes: JSON.stringify([
      "Determinación precisa de los remedios homeopáticos adecuados",
      "Ajuste de las dosis según las necesidades individuales",
      "Enfoque personalizado y natural para apoyar tu bienestar",
    ]),
    contraindications: null,
  },
];

async function main() {
  console.log("Conectando a la BD...\n");
  const conn = await mysql.createConnection(DB_URL);

  let inserted = 0;
  let skipped = 0;

  for (const c of CONSULTAS) {
    // Comprobar si el slug ya existe
    const [rows] = await conn.execute(
      "SELECT id FROM services WHERE slug = ?",
      [c.slug]
    );

    if (rows.length > 0) {
      console.log(`↩  ya existe: ${c.slug} (id=${rows[0].id})`);
      skipped++;
      continue;
    }

    await conn.execute(
      `INSERT INTO services
        (slug, name, shortDescription, price, durationMinutes, durationLabel,
         type, modality, longDescription, benefits, includes, contraindications,
         featured, status, sortOrder)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
      [
        c.slug,
        c.name,
        c.shortDescription,
        c.price,
        c.durationMinutes,
        c.durationLabel,
        c.type,
        c.modality,
        c.longDescription,
        c.benefits,
        c.includes,
        c.contraindications,
        c.featured,
        c.sortOrder,
      ]
    );
    console.log(`✓ insertada: ${c.slug}`);
    inserted++;
  }

  await conn.end();
  console.log(`\nInsertadas: ${inserted}  |  Omitidas (ya existían): ${skipped}`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
