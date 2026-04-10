/**
 * update-aceites-shopify.mjs
 *
 * 1. Borra todos los oil_products existentes
 * 2. Descarga las imágenes de Shopify y las guarda en uploads/crm-uploads/images/
 * 3. Inserta los 26 productos actualizados con las rutas locales
 *
 * Uso local:  node update-aceites-shopify.mjs
 * En Railway: railway run node update-aceites-shopify.mjs
 */

import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import { fileURLToPath } from "url";

const DB_URL =
  process.env.DATABASE_URL ||
  "mysql://root:dLYimRwhxWJTnKKoqTPQsFFxKAfGvIfI@hopper.proxy.rlwy.net:41985/railway";

const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "uploads");

const DEST_FOLDER = path.join(UPLOAD_DIR, "crm-uploads", "images");

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    protocol
      .get(url, { timeout: 20000 }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return downloadFile(res.headers.location).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode} — ${url}`));
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      })
      .on("error", reject)
      .on("timeout", () => reject(new Error(`Timeout — ${url}`)));
  });
}

function extFromUrl(url) {
  const clean = url.split("?")[0];
  const ext = path.extname(clean).toLowerCase();
  return [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"].includes(ext) ? ext : ".jpg";
}

async function downloadImage(shopifyUrl, localName) {
  fs.mkdirSync(DEST_FOLDER, { recursive: true });
  const ext = extFromUrl(shopifyUrl);
  const filename = `shopify-${localName}${ext}`;
  const filePath = path.join(DEST_FOLDER, filename);
  const relUrl = `/uploads/crm-uploads/images/${filename}`;

  // Si ya existe, reutilizamos (evita descargar dos veces en re-ejecuciones)
  if (fs.existsSync(filePath)) {
    console.log(`   ↩  ya existe: ${filename}`);
    return relUrl;
  }

  const buffer = await downloadFile(shopifyUrl);
  fs.writeFileSync(filePath, buffer);
  return relUrl;
}

// ─── DATOS DE PRODUCTOS ───────────────────────────────────────────────────────

const PRODUCTS = [
  {
    name: "GUÍA DIGITAL DE ACEITES ESENCIALES",
    slug: "guia-digital-aceites-esenciales",
    tipoProducto: "pack",
    descripcion:
      "El formato de envío de esta guía es PDF DIGITAL. Guía corta de aceites esenciales básicos para el hogar, incluye soporte grupal y posibilidad de compra a través de mí. Más información, consultar.",
    beneficios: [],
    indicaciones: [],
    tags: ["guia", "digital", "pdf", "principiantes"],
    destacado: 0,
    imageUrl: "https://618258-f9.myshopify.com/cdn/shop/files/portada_e4e34078-0534-47f3-a6cb-e1e4abb56b36.jpg?v=1717019148",
    imageKey: "guia-digital",
  },
  {
    name: "Pack Recovery Bomb - Bomba Antigripal",
    slug: "pack-recovery-bomb",
    tipoProducto: "pack",
    descripcion:
      "Receta natural con cinco aceites esenciales doTERRA: 4 gotas de Limón, 2 gotas de Orégano, 2 gotas de Frankincense, 2 gotas de On Guard y 2 gotas de Melaleuca (Tea Tree). Uso interno: introducir las gotas en una cápsula vegetal, tomar 2 veces al día después de comer. Uso tópico (roll-on): duplicar la receta con aceite de coco fraccionado y aplicar 3-4 veces al día en la planta del pie. El orégano no debe tomarse internamente más de 10 días consecutivos. Usar únicamente aceites doTERRA grado terapéutico certificados para consumo interno.",
    beneficios: ["Apoyo al sistema inmune", "Propiedades antivirales y antibacterianas", "Uso interno y tópico"],
    indicaciones: ["Adultos: 2 cápsulas al día después de comer", "Niños +7 años: media dosis", "Tópico: aplicar en planta del pie 3-4 veces al día"],
    tags: ["pack", "inmunidad", "antigripal", "invierno"],
    destacado: 1,
    imageUrl: "https://618258-f9.myshopify.com/cdn/shop/files/recoverybomb.jpg?v=1716670947",
    imageKey: "pack-recovery-bomb",
  },
  {
    name: "Trío difusor Petal 2.0",
    slug: "trio-difusor-petal",
    tipoProducto: "accesorio",
    descripcion:
      "El difusor doTERRA Petal es un dispositivo pequeño y fácil de usar que proporciona una amplia variedad de beneficios. Diseño estable y ligero, ideal para cualquier habitación. Produce una gran cantidad de vapor que humidifica el aire de forma eficaz. Tres ajustes de difusión: 2, 6 y 12 horas. Iluminación LED opcional. La ultra-fina niebla alcanza hasta 33 m². Diseño de 3 piezas para una operación sencilla. Mantenimiento mensual: llenar hasta la mitad con agua, añadir vinagre blanco, encender 5 minutos, vaciar y limpiar con bastoncillos impregnados en vinagre.",
    beneficios: ["Difusión ultrasónica hasta 33 m²", "3 ajustes de tiempo: 2, 6 y 12 horas", "Luz LED opcional", "Fácil limpieza y mantenimiento"],
    indicaciones: ["Añadir 5-12 gotas de aceite esencial al agua limpia", "No superar el nivel máximo de agua"],
    tags: ["difusor", "accesorio", "aromaterapia"],
    destacado: 0,
    imageUrl: "https://618258-f9.myshopify.com/cdn/shop/files/difusor.jpg?v=1716334446",
    imageKey: "trio-difusor-petal",
  },
  {
    name: "Veggie Caps - 160 cápsulas",
    slug: "veggie-caps-160-capsulas",
    tipoProducto: "accesorio",
    descripcion:
      "Cápsulas vegetales. Hechas específicamente para ayudarte a personalizar tus necesidades, las Cápsulas vegetales proporcionan una forma cómoda y segura de ingerir los aceites esenciales.",
    beneficios: ["Cómoda ingesta de aceites esenciales", "Material 100% vegetal", "Personalizables según necesidades"],
    indicaciones: ["Introducir las gotas de aceite en la cápsula antes de cerrarla", "Tomar siempre después de las comidas"],
    tags: ["capsulas", "ingestion", "accesorio"],
    destacado: 0,
    imageUrl: "https://618258-f9.myshopify.com/cdn/shop/files/veggiecaps.png?v=1716671446",
    imageKey: "veggie-caps",
  },
  {
    name: "Aceite Esencial de Lavanda 15ml",
    slug: "aceite-esencial-lavanda-15ml",
    tipoProducto: "aceite",
    descripcion:
      "La Lavanda es ampliamente considerada un aceite esencial imprescindible debido a su versatilidad. Se ha utilizado y apreciado durante siglos debido a su aroma inconfundible y su gran cantidad de beneficios. Egipcios y romanos la empleaban para el baño, la cocina y el perfume. Promueve una atmósfera tranquila, favorece la relajación mental al tomarse internamente y reduce imperfecciones de la piel en aplicación tópica.",
    beneficios: ["Relajación y calma mental", "Mejora la calidad del sueño", "Reduce imperfecciones cutáneas", "Alivia el estrés"],
    indicaciones: ["Aromaterapia: 3-4 gotas en difusor", "Tópico: aplicar en sienes y nuca diluido", "Sueño: 1-2 gotas en la almohada"],
    tags: ["lavanda", "relajacion", "sueño", "piel", "estres"],
    destacado: 1,
    imageUrl: "https://618258-f9.myshopify.com/cdn/shop/files/lavanda.png?v=1716323493",
    imageKey: "aceite-lavanda",
  },
  {
    name: "Aceite Esencial Deep Blue 5ml / Roll-on",
    slug: "aceite-esencial-deep-blue-5ml",
    tipoProducto: "mezcla",
    descripcion:
      "Mezcla calmante y antiinflamatoria. El formato sin diluir se recomienda mezclado con un aceite portador. Contiene: gaulteria, menta, tánaceto azul, manzanilla azul, helicriso, osmanthus y alcanfor. Nueva fórmula mejorada con aceite de copaiba para propiedades calmantes adicionales y romero español rico en alcanfor. Aceites CPTG certificados para liberar la tensión física. Proporciona sensación refrescante y alivio articular. Ideal para masaje post-ejercicio.",
    beneficios: ["Alivia la tensión muscular y articular", "Efecto refrescante y antiinflamatorio", "Ideal para uso post-ejercicio", "Nueva fórmula mejorada con copaiba"],
    indicaciones: ["Mezclar con aceite de coco fraccionado antes de aplicar", "Masajear en la zona afectada 3-4 veces al día"],
    tags: ["deep-blue", "muscular", "articulaciones", "inflamacion", "deporte"],
    destacado: 1,
    imageUrl: "https://618258-f9.myshopify.com/cdn/shop/files/deepblue.png?v=1716325131",
    imageKey: "aceite-deep-blue",
  },
  {
    name: "Aceite Esencial Deep Blue Roll-On 10ml",
    slug: "aceite-esencial-deep-blue-roll-on-10ml",
    tipoProducto: "mezcla",
    descripcion:
      "Mezcla calmante y antiinflamatoria en formato roll-on de 10ml, pre-diluido con aceite de coco. Contiene: gaulteria, menta, tánaceto azul, manzanilla azul, helicriso, osmanthus y alcanfor. Nueva fórmula mejorada con aceite de copaiba. Romero español rico en alcanfor. Proporciona sensación refrescante y alivio articular. Formato listo para usar, sin necesidad de aceite portador.",
    beneficios: ["Listo para usar, sin diluir", "Alivia tensión muscular y articular", "Efecto refrescante", "Cómodo formato roll-on"],
    indicaciones: ["Aplicar directamente sobre la zona afectada", "Masajear suavemente 3-4 veces al día", "Ideal para espalda, piernas y pies"],
    tags: ["deep-blue", "roll-on", "muscular", "articulaciones", "inflamacion"],
    destacado: 0,
    imageUrl: "https://618258-f9.myshopify.com/cdn/shop/files/rooldeep.png?v=1716498640",
    imageKey: "deep-blue-roll-on",
  },
  {
    name: "Aceite Esencial Frankincense 15ml",
    slug: "aceite-esencial-frankincense-15ml",
    tipoProducto: "aceite",
    descripcion:
      "Obtenido de las resinas de cuatro especies de árboles: Boswellia carterii, Boswellia sacra, Boswellia papyrifera y Boswellia frereana. Llamado el «rey» de los aceites esenciales. Los antiguos egipcios lo usaban en perfumes y bálsamos para la piel. Calma la piel reduciendo imperfecciones, promueve sentimientos de paz, relajación y satisfacción, hidrata y rejuvenece el cutis.",
    beneficios: ["Regeneración celular y cicatrización", "Propiedades antiarrugas", "Mejora del estado de ánimo", "Apoyo al sistema inmune", "Meditación y bienestar emocional"],
    indicaciones: ["Tópico: mezclar con crema hidratante para reducir manchas", "Aromaterapia: 2-3 gotas en difusor", "Masaje: aplicar sobre la piel para relajación"],
    tags: ["frankincense", "piel", "antiedad", "meditacion", "inmunidad", "artritis"],
    destacado: 1,
    imageUrl: "https://618258-f9.myshopify.com/cdn/shop/files/franinciense.png?v=1716325767",
    imageKey: "aceite-frankincense",
  },
  {
    name: "Aceite Esencial Serenity 15ml",
    slug: "aceite-esencial-serenity-15ml",
    tipoProducto: "mezcla",
    descripcion:
      "Mezcla tranquila de aceites esenciales que promueve la tranquilidad y la relajación. Contiene: flor de lavanda, cedro, hoja de árbol ho, flor de ylang ylang, hoja de mejorana, flor de manzanilla romana, raíz de vetiver y absoluto de grano. Diseñada para tensión, insomnio, fatiga mental y ansiedad. Sus efectos se sienten de inmediato al aplicarse tópicamente, transportando a un estado de calma. El aroma terroso del cedro, árbol ho y vetiver calma la mente y relaja los sentidos.",
    beneficios: ["Favorece la tranquilidad y relajación", "Ayuda a conciliar el sueño", "Reduce la ansiedad y el estrés", "Calma emocional inmediata"],
    indicaciones: ["Aplicar tópicamente antes de dormir", "3-4 gotas en difusor por las noches", "Masajear en cuello y muñecas"],
    tags: ["serenity", "sueño", "insomnio", "ansiedad", "relajacion", "estres"],
    destacado: 1,
    imageUrl: "https://618258-f9.myshopify.com/cdn/shop/files/serenity.png?v=1716326366",
    imageKey: "aceite-serenity",
  },
  {
    name: "Aceite Esencial Ylang Ylang 15ml",
    slug: "aceite-esencial-ylang-ylang-15ml",
    tipoProducto: "aceite",
    descripcion:
      "ARMONIZADOR ENERGÉTICO. Indicado para: energía negativa, estrés, miedo, usos afrodisíacos. Obtenido de las flores en forma de estrella de un árbol tropical. Ampliamente utilizado en perfumería y aromaterapia, con siglos de uso en ceremonias religiosas y matrimoniales. Frecuentemente incorporado en productos de lujo para el cabello y la piel por su rico y dulce aroma, propiedades nutritivas y protectoras.",
    beneficios: ["Armoniza la energía emocional", "Propiedades afrodisíacas", "Nutre y protege el cabello y la piel", "Reduce el estrés y el miedo"],
    indicaciones: [
      "Aromaterapia: 3-4 gotas en difusor",
      "Masaje tópico: 5 gotas con 10ml de aceite portador",
      "Baño: 5 gotas con 5ml de aceite portador",
      "Perfume: 1 gota con 10 gotas de aceite portador",
    ],
    tags: ["ylang-ylang", "estres", "afrodisiaco", "cabello", "piel", "perfume"],
    destacado: 0,
    imageUrl: "https://618258-f9.myshopify.com/cdn/shop/files/ylang.png?v=1716327734",
    imageKey: "aceite-ylang-ylang",
  },
  {
    name: "Aceite Esencial OnGuard 15ml",
    slug: "aceite-esencial-onguard-15ml",
    tipoProducto: "mezcla",
    descripcion:
      "Una de las mezclas más populares de doTERRA por sus beneficios de apoyo inmunitario. Contiene: naranja, clavo, corteza de canela, eucalipto y romero. Ofrece una alternativa natural, fragante y eficaz a los productos convencionales para síntomas de defensas bajas. Potente estimulante del sistema inmune con propiedades antivirales y antibacterianas.",
    beneficios: ["Apoyo al sistema inmune", "Propiedades antivirales y antibacterianas", "Alivia tos y dolor de garganta", "Alternativa natural a medicamentos"],
    indicaciones: ["Aromaterapia: difundir para purificar el ambiente", "Tópico: aplicar en planta del pie diluido", "Interno: 1-2 gotas en agua caliente (solo aceite doTERRA grado terapéutico)"],
    tags: ["onguard", "inmunidad", "antiviral", "antibacteriano", "tos", "resfriado"],
    destacado: 1,
    imageUrl: "https://618258-f9.myshopify.com/cdn/shop/files/onguard.png?v=1716328127",
    imageKey: "aceite-onguard",
  },
  {
    name: "Aceite Esencial ZenGest 15ml",
    slug: "aceite-esencial-zengest-15ml",
    tipoProducto: "mezcla",
    descripcion:
      "Mezcla digestiva con aceites esenciales populares. Contiene: semilla de anís, menta, raíz de jengibre, semilla de alcaravea, semilla de cilantro, planta de estragón y semilla de hinojo. Indicado para calambres, gases, náuseas, acidez e indigestión. Mezcla única para aliviar las molestias estomacales, portátil y beneficiosa para el uso diario.",
    beneficios: ["Alivia calambres y gases digestivos", "Reduce náuseas y acidez", "Apoya la digestión saludable", "Práctico para llevar a diario"],
    indicaciones: ["Tópico: aplicar en abdomen con movimientos circulares", "Aromaterapia: difundir para reducir náuseas", "Interno: 1-2 gotas en cápsula vegetal (solo doTERRA grado terapéutico)"],
    tags: ["zengest", "digestion", "nauseas", "gases", "estomago", "acidez"],
    destacado: 0,
    imageUrl: "https://618258-f9.myshopify.com/cdn/shop/files/zengest.png?v=1716669149",
    imageKey: "aceite-zengest",
  },
  {
    name: "Aceite Esencial Orégano 15ml",
    slug: "aceite-esencial-oregano-15ml",
    tipoProducto: "aceite",
    descripcion:
      "Uno de los aceites esenciales más potentes con innumerables aplicaciones. Extraído de las hojas de Origanum vulgare, contiene carvacrol como principal componente. Poderosa opción natural para infecciones bacterianas, virales y parasitarias. Su fragancia herbácea y picante lo hace ideal en pequeñas cantidades para sopas, ensaladas y condimentos. Para cocinar, usar el método del palillo: sumergir la punta en el aceite y remover los ingredientes.",
    beneficios: ["Potente antibacteriano y antiviral", "Antiparasitario natural", "Refuerza el sistema inmune", "Versátil en cocina y aromaterapia"],
    indicaciones: ["No tomar internamente más de 10 días consecutivos", "Diluir siempre con aceite portador para uso tópico", "En cocina: usar el método del palillo por su alta concentración"],
    tags: ["oregano", "antibacteriano", "antiviral", "antiparasitario", "inmunidad"],
    destacado: 0,
    imageUrl: "https://618258-f9.myshopify.com/cdn/shop/files/oregano.png?v=1716328848",
    imageKey: "aceite-oregano",
  },
  {
    name: "Aceite Esencial Balance 15ml",
    slug: "aceite-esencial-balance-15ml",
    tipoProducto: "mezcla",
    descripcion:
      "Mezcla equilibrante. Contiene: aguja y hoja de abeto, árbol ho, resina de frankincense, flor de tánaceto azul y flor de manzanilla azul. El fresco y amaderado aroma de Balance es perfecto cuando necesitas un poco de armonía en tu vida. Los aceites emocionalmente beneficiosos trabajan juntos para crear una sensación de calma y bienestar. Su dulce y amaderado aroma lo convierte en la fragancia ideal para promover sensaciones de equilibrio y tranquilidad.",
    beneficios: ["Sensación de equilibrio y armonía", "Calma emocional y bienestar", "Aroma amaderado y fresco", "Apoyo en momentos de estrés"],
    indicaciones: ["Aromaterapia: 3-4 gotas en difusor", "Tópico: aplicar en muñecas o plantas de los pies", "Mezclar con aceite portador para masaje relajante"],
    tags: ["balance", "equilibrio", "relajacion", "estres", "bienestar"],
    destacado: 0,
    imageUrl: "https://618258-f9.myshopify.com/cdn/shop/files/balance.png?v=1716329525",
    imageKey: "aceite-balance",
  },
  {
    name: "Aceite Esencial Tea Tree 15ml",
    slug: "aceite-esencial-tea-tree-15ml",
    tipoProducto: "aceite",
    descripcion:
      "Aceite purificante y antibiótico natural. Contiene más de 92 compuestos diferentes con múltiples aplicaciones tópicas. Los aborígenes australianos lo utilizaban históricamente triturando las hojas para aplicarlas sobre la piel. Indicado para infecciones, irritaciones, herpes labial, psoriasis, hongos y acné. Sus propiedades purificadoras lo hacen ideal para mantener una piel y uñas saludables.",
    beneficios: ["Purificante y antibiótico natural", "Combate hongos e infecciones", "Calma irritaciones cutáneas", "Beneficioso para piel, cabello y uñas"],
    indicaciones: ["Tópico: aplicar directamente sobre irritaciones con bastoncillo", "Diluir con aceite portador para áreas extensas", "No ingerir"],
    tags: ["tea-tree", "antibiotico", "hongos", "acne", "piel", "purificante"],
    destacado: 0,
    imageUrl: "https://618258-f9.myshopify.com/cdn/shop/files/teatree.png?v=1716329928",
    imageKey: "aceite-tea-tree",
  },
  {
    name: "Aceite Esencial Peppermint 15ml",
    slug: "aceite-esencial-peppermint-15ml",
    tipoProducto: "aceite",
    descripcion:
      "La menta añade un sabor refrescante y mentolado a postres, bebidas, batidos e incluso platos salados. Indicado para dolores de cabeza, somnolencia, náuseas y apoyo digestivo. Un alto contenido en mentol es indicador de calidad en los aceites esenciales de menta. Frecuentemente utilizado en productos de higiene oral. Añadir una gota a bebidas de verano con frutas para una bebida refrescante sin azúcares procesados.",
    beneficios: ["Alivia dolores de cabeza", "Combate la somnolencia y fatiga", "Apoya la digestión", "Efecto refrescante inmediato"],
    indicaciones: ["Tópico: aplicar en sienes para el dolor de cabeza", "Aromaterapia: difundir para aumentar la concentración", "Interno: 1 gota en vaso de agua o bebida (solo doTERRA grado terapéutico)"],
    tags: ["peppermint", "menta", "cabeza", "digestion", "nauseas", "energia"],
    destacado: 0,
    imageUrl: "https://618258-f9.myshopify.com/cdn/shop/files/peepermint.png?v=1716330347",
    imageKey: "aceite-peppermint",
  },
  {
    name: "Aceite Esencial Limón 15ml",
    slug: "aceite-esencial-limon-15ml",
    tipoProducto: "aceite",
    descripcion:
      "ENERGIZANTE. Indicado para resfriados, dolor de garganta, detox y cocina. Prensado en frío de pieles de limón para preservar su delicada naturaleza y sus poderosas propiedades. Sus propiedades estimulantes y energizantes promueven un estado de ánimo positivo con su aroma vigorizante. Uno de los aceites más vendidos de doTERRA. Ideal para añadir sabor refrescante al agua o a innumerables recetas, tanto saladas como dulces.",
    beneficios: ["Energizante y estimulante del ánimo", "Apoyo en resfriados y garganta", "Propiedades detox y depurativas", "Versátil en cocina y bebidas"],
    indicaciones: ["Interno: 1-2 gotas en agua o zumo (solo doTERRA grado terapéutico)", "Aromaterapia: difundir para mejorar el ambiente", "Cocina: usar el método del palillo para condimentar"],
    tags: ["limon", "detox", "energia", "resfriado", "cocina"],
    destacado: 0,
    imageUrl: "https://618258-f9.myshopify.com/cdn/shop/files/lemmon.jpg?v=1716331168",
    imageKey: "aceite-limon",
  },
  {
    name: "Aceite Esencial Air 15ml",
    slug: "aceite-esencial-air-15ml",
    tipoProducto: "mezcla",
    descripcion:
      "MEZCLA DE ACEITES / DESCONGESTIVO. Contiene: laurel, eucalipto, menta, melaleuca, limón, cardamomo, ravintsara y ravensara. Esta mezcla mentolada y vigorizante tiene un efecto calmante y relajante cuando se aplica tópicamente. Air está enriquecida con una combinación de aceites destinados a refrescar y vivificar el cuerpo, proporcionando sensaciones de vías respiratorias despejadas.",
    beneficios: ["Despeja las vías respiratorias", "Efecto descongestivo natural", "Calmante y relajante tópico", "Aroma vigorizante y mentolado"],
    indicaciones: ["Aromaterapia: difundir para despejar ambientes", "Tópico: aplicar en pecho y espalda diluido con aceite portador", "Inhalación directa: 2-3 gotas en las manos, frotar y respirar"],
    tags: ["air", "respiratorio", "descongestivo", "eucalipto", "menta"],
    destacado: 0,
    imageUrl: "https://618258-f9.myshopify.com/cdn/shop/files/air.png?v=1716674025",
    imageKey: "aceite-air",
  },
  {
    name: "Aceite de Coco Fraccionado",
    slug: "aceite-de-coco-fraccionado",
    tipoProducto: "base",
    descripcion:
      "Aceite portador natural de doTERRA que se absorbe fácilmente en la piel. Proporciona una barrera suavizante sin obstruir los poros, ideal para pieles secas o problemáticas. Deja la piel suave sin sensación grasa, a diferencia de muchos aceites vegetales. Completamente soluble con los aceites esenciales, incoloro, inodoro y sin manchas.",
    beneficios: ["Hidrata sin obstruir poros", "Potencia la absorción de aceites esenciales", "Incoloro e inodoro", "Ideal para pieles secas y sensibles"],
    indicaciones: ["Mezclar con aceites esenciales antes de aplicar tópicamente", "Usar como base en masajes corporales", "Aplicar directamente como hidratante"],
    tags: ["coco", "portador", "base", "hidratante", "piel"],
    destacado: 0,
    imageUrl: "https://618258-f9.myshopify.com/cdn/shop/files/cocunutoil.png?v=1716671832",
    imageKey: "aceite-coco-fraccionado",
  },
  {
    name: "Dispensador de Aceite de Coco Fraccionado",
    slug: "dispensador-aceite-coco-fraccionado",
    tipoProducto: "accesorio",
    descripcion:
      "Este dispensador se puede usar en el frasco de Aceite de coco fraccionado doTERRA. Sustituye la tapa y la parte superior del frasco para dispensar fácilmente el aceite.",
    beneficios: ["Dispensado fácil y controlado", "Compatible con el frasco de coco fraccionado doTERRA", "Reutilizable"],
    indicaciones: ["Sustituir la tapa original del frasco de aceite de coco fraccionado"],
    tags: ["dispensador", "coco", "accesorio"],
    destacado: 0,
    imageUrl: "https://618258-f9.myshopify.com/cdn/shop/files/dispensador.png?v=1716672512",
    imageKey: "dispensador-coco",
  },
  {
    name: "Herramienta para Retirar Tapas Roll-On",
    slug: "herramienta-para-retirar-tapas",
    tipoProducto: "accesorio",
    descripcion:
      "Se usa para retirar fácilmente las tapas y las carcasas de la bola de los envases tipo roll-on de variedad de tamaños de frascos.",
    beneficios: ["Retira tapas sin esfuerzo", "Compatible con múltiples tamaños de roll-on", "Imprescindible para crear mezclas personalizadas"],
    indicaciones: ["Insertar en la tapa del roll-on y girar suavemente para retirar"],
    tags: ["herramienta", "roll-on", "accesorio"],
    destacado: 0,
    imageUrl: "https://618258-f9.myshopify.com/cdn/shop/files/herramienta.png?v=1716672919",
    imageKey: "herramienta-tapas",
  },
  {
    name: "Caja de Madera con Logo Grabado doTERRA",
    slug: "caja-de-madera-doterra",
    tipoProducto: "accesorio",
    descripcion:
      "Hecha a medida para contener 25 aceites esenciales, esta caja de madera grabada con el logotipo es ligera y compacta, lo que facilita el transporte de los aceites a cualquier lugar. También sirve como una preciosa vitrina para tus aceites cuando hagas presentaciones.",
    beneficios: ["Capacidad para 25 aceites esenciales", "Ligera y fácil de transportar", "Ideal para presentaciones y exposición"],
    indicaciones: ["Para transporte y almacenamiento de frascos de aceites esenciales de 15ml"],
    tags: ["caja", "madera", "almacenamiento", "accesorio", "doterra"],
    destacado: 0,
    imageUrl: "https://618258-f9.myshopify.com/cdn/shop/files/caja.png?v=1716673059",
    imageKey: "caja-madera-doterra",
  },
  {
    name: "Cecotec Humidificador Ultrasónico 150 Yang",
    slug: "cecotec-humidificador-ultrasonico-150-yang",
    tipoProducto: "accesorio",
    descripcion:
      "Humidificador ultrasónico que reduce la sequedad ambiental mediante vapor frío continuo. Funciona también como difusor de aromas para mantener un ambiente agradable. Capacidad de 150ml con temporizador de hasta 3 horas que se apaga automáticamente. Siete opciones de color LED con control manual y automático, funciona como lámpara nocturna. Diseñado para habitaciones de hasta 10 m². Acabado en tono madera que encaja en cualquier decoración. Funcionamiento casi silencioso gracias a la tecnología ultrasónica.",
    beneficios: ["Hidrata el ambiente y reduce la sequedad", "Doble función: humidificador y difusor de aromas", "7 colores LED, ideal como lámpara nocturna", "Ultra silencioso, apto para bebés"],
    indicaciones: ["Capacidad máxima 150ml de agua", "Temporizador automático hasta 3 horas", "Colocar en habitaciones de hasta 10 m²"],
    tags: ["humidificador", "difusor", "ultrasonico", "accesorio", "bebe"],
    destacado: 0,
    imageUrl: "https://618258-f9.myshopify.com/cdn/shop/files/61wOxmC_RlL._AC_SX679.jpg?v=1716674801",
    imageKey: "humidificador-yang",
  },
  {
    name: "Pack 3 Botellas de Vidrio 5ml Roll-On",
    slug: "pack-3-botellas-5ml-roll-on",
    tipoProducto: "accesorio",
    descripcion:
      "Pack de 3 botellas de vidrio de 5ml con bola roll-on y cubierta negra. Medidas: 5.9cm de altura, 1.5cm de diámetro. Ideales para crear tus propias mezclas personalizadas de aceites esenciales.",
    beneficios: ["Vidrio de calidad para conservar los aceites", "Formato de bolsillo, fácil de llevar", "Perfectas para mezclas personalizadas"],
    indicaciones: ["Llenar con la mezcla deseada de aceites esenciales y aceite portador", "Compatible con la herramienta para retirar tapas"],
    tags: ["botellas", "roll-on", "5ml", "vidrio", "accesorio"],
    destacado: 0,
    imageUrl: "https://618258-f9.myshopify.com/cdn/shop/files/botellas5.png?v=1717179447",
    imageKey: "botellas-5ml",
  },
  {
    name: "Pack 3 Botellas de Vidrio 10ml Roll-On",
    slug: "pack-3-botellas-10ml-roll-on",
    tipoProducto: "accesorio",
    descripcion:
      "Pack de 3 botellas de vidrio de 10ml con bola roll-on y cubierta negra. Medidas: 9.1cm de altura, 1.5cm de diámetro, capacidad 10ml. Ideales para crear tus propias mezclas personalizadas de aceites esenciales.",
    beneficios: ["Mayor capacidad que las de 5ml", "Vidrio de calidad para conservar los aceites", "Perfectas para mezclas de uso habitual"],
    indicaciones: ["Llenar con la mezcla deseada de aceites esenciales y aceite portador", "Compatible con la herramienta para retirar tapas"],
    tags: ["botellas", "roll-on", "10ml", "vidrio", "accesorio"],
    destacado: 0,
    imageUrl: "https://618258-f9.myshopify.com/cdn/shop/files/botellas10.png?v=1717179405",
    imageKey: "botellas-10ml",
  },
  {
    name: "Asesoría Aceites Esenciales para Perros",
    slug: "asesoria-aceites-esenciales-perros",
    tipoProducto: "pack",
    descripcion:
      "En este espacio dedicado a las mascotas, la aromaterapista Ruth Barreña Hernández ofrece consultas individualizadas para perros. La sesión aborda el uso adecuado de aceites esenciales y las precauciones necesarias al utilizarlos con compañeros caninos.",
    beneficios: ["Consulta personalizada para tu perro", "Orientación experta de aromaterapista certificada", "Protocolos de seguridad específicos para caninos"],
    indicaciones: ["Sesión individual con Ruth Barreña Hernández", "Se abordan aceites seguros, dosis y formas de aplicación"],
    tags: ["perros", "mascotas", "asesoria", "aromaterapia-animal"],
    destacado: 0,
    imageUrl: "https://618258-f9.myshopify.com/cdn/shop/files/perro_ffa0b2df-49e9-4cd5-8b8d-7d30bc111ce8.jpg?v=1731619925",
    imageKey: "asesoria-perros",
  },
];

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("UPLOAD_DIR:", UPLOAD_DIR);
  console.log("Conectando a la BD...\n");

  const conn = await mysql.createConnection(DB_URL);

  // 1. Borrar todos los productos existentes
  console.log("🗑  Borrando todos los oil_products existentes...");
  const [del] = await conn.execute("DELETE FROM oil_products");
  console.log(`   → ${del.affectedRows} productos eliminados\n`);

  // 2. Resetear el auto_increment
  await conn.execute("ALTER TABLE oil_products AUTO_INCREMENT = 1");

  // 3. Descargar imágenes e insertar productos
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < PRODUCTS.length; i++) {
    const p = PRODUCTS[i];
    process.stdout.write(`[${i + 1}/${PRODUCTS.length}] ${p.name}...`);

    let imagenUrl = null;
    try {
      imagenUrl = await downloadImage(p.imageUrl, p.imageKey);
      process.stdout.write(` 📷 ${imagenUrl}`);
    } catch (err) {
      // Si falla la descarga, guardar la URL original de Shopify como fallback
      imagenUrl = p.imageUrl;
      process.stdout.write(` ⚠ imagen fallback (${err.message})`);
      errors++;
    }

    try {
      await conn.execute(
        `INSERT INTO oil_products
          (name, slug, category, tipoProducto, descripcion, beneficios, indicaciones,
           imagen, tags, destacado, sortOrder, visibleEnPublico, status)
         VALUES (?, ?, 'aceites-esenciales', ?, ?, ?, ?, ?, ?, ?, ?, 1, 'active')`,
        [
          p.name,
          p.slug,
          p.tipoProducto,
          p.descripcion,
          JSON.stringify(p.beneficios),
          JSON.stringify(p.indicaciones),
          imagenUrl,
          JSON.stringify(p.tags),
          p.destacado,
          i + 1,
        ]
      );
      console.log(" ✓");
      inserted++;
    } catch (err) {
      console.log(` ✗ BD: ${err.message}`);
      errors++;
    }
  }

  await conn.end();

  console.log(`\n${"─".repeat(60)}`);
  console.log(`Insertados: ${inserted}  |  Errores: ${errors}`);
  console.log("Listo.");
}

main().catch((err) => {
  console.error("Error fatal:", err.message);
  process.exit(1);
});
