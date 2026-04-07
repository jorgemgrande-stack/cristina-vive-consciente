/**
 * Script para actualizar los productos de aceites esenciales con datos reales
 * extraídos de la web de Cristina en Shopify (cristinaviveconsciente.es)
 * 
 * Columnas reales de oil_products:
 * id, name, slug, category (slug de categoría), tipoProducto, descripcion,
 * beneficios, indicaciones, usoGeneral, mensajeConsulta, imagen, tags,
 * destacado, sortOrder, visibleEnPublico, status
 */

import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663410228097/hMJHx75NmU74XtvDrfPREU";

// Mapa: slug actual en BD → datos actualizados de Shopify
// Los slugs que no existen se crearán como nuevos
const UPDATES = [
  // ── ACEITES ESENCIALES ──────────────────────────────────────────────────────
  {
    existingSlug: "lavanda-angustifolia",
    name: "Aceite Esencial de Lavanda 15ml",
    category: "aceites-esenciales",
    tipoProducto: "aceite",
    descripcion: "La Lavanda es ampliamente considerada un aceite esencial imprescindible debido a su versatilidad. Se ha utilizado y apreciado durante siglos debido a su aroma inconfundible y su gran cantidad de beneficios. Los antiguos egipcios y romanos usaban la Lavanda para bañarse, cocinar y como perfume. Su aroma calmante y relajante promueve un ambiente tranquilo. Cuando se toma internamente, la Lavanda puede ayudar a calmar y relajar la mente. Cuando se aplica tópicamente, la Lavanda puede reducir la apariencia de las imperfecciones de la piel. Agrégalo al agua del baño para eliminar el estrés o aplícalo en las sienes y la nuca. Agrega unas gotas a las almohadas, la ropa de cama o las plantas de los pies para prepararte para una noche de sueño reparador.",
    beneficios: ["Calma y relaja la mente", "Promueve el sueño reparador", "Reduce imperfecciones de la piel", "Alivia el estrés y la tensión", "Versátil: aromaterapia, tópico e interno"],
    indicaciones: ["Insomnio", "Estrés y ansiedad", "Irritaciones cutáneas", "Dolores de cabeza", "Ambiente relajante"],
    usoGeneral: "Aromático: 3-4 gotas en difusor. Tópico: aplicar directamente o diluir con aceite portador. Interno: 1 gota en agua o bajo la lengua.",
    imagen: `${CDN}/lavanda_92f49507.jpg`,
    tags: ["lavanda", "relajante", "sueño", "piel", "doterra"],
    destacado: true,
  },
  {
    existingSlug: "deep-blue-mezcla-dolor",
    name: "Aceite Esencial Deep Blue 5ml / Roll-on",
    category: "aceites-esenciales",
    tipoProducto: "mezcla",
    descripcion: "DEEP BLUE / CALMANTE / ANTIINFLAMATORIO\n\nFormato sin fraccionar, en estado puro (ideal adquirir aceite fraccionado de coco para su uso y/o mezclarlo en casa con un aceite portador a elección).\n\nContiene: Gaulteria, Menta, Tanaceto azul, Manzanilla azul, Helicriso, Osmanto, Alcanfor.\n\nLa mezcla calmante Deep Blue reúne extractos de plantas y aceites esenciales con perfiles químicos únicos para ayudar a reconfortar y calmar las articulaciones y los músculos. Deep Blue proporciona beneficios calmantes y reconfortantes para la espalda, las piernas y los pies. Por lo tanto, es ideal como parte de un masaje postdeportivo.\n\nNueva fórmula mejorada, rigurosamente probada para ofrecer un mejor resultado con una eficacia increíble. Incluye los potentes beneficios del aceite esencial de Copaiba, conocido por sus cualidades calmantes. Incluye romero de España, que es naturalmente rico en alcanfor. Esta combinación calmante de aceites esenciales con CPTG (Grado Testado Puro Certificado) ayuda a liberar la tensión. Deep Blue proporciona un efecto calmante que alivia las articulaciones y refresca los músculos. Crea una sensación de frescor cuando se aplica sobre la piel para proporcionar la comodidad deseada.",
    beneficios: ["Alivia dolor muscular y articular", "Efecto antiinflamatorio natural", "Ideal para masajes postdeportivos", "Libera la tensión acumulada", "Sensación de frescor inmediato"],
    indicaciones: ["Inflamación", "Hematomas", "Tensión muscular", "Dolor articular", "Recuperación deportiva"],
    usoGeneral: "Tópico: aplicar sobre la zona afectada diluido en aceite portador. Para uso directo, mezclar con aceite de coco fraccionado.",
    imagen: `${CDN}/deep-blue_25ac18c9.jpg`,
    tags: ["deep blue", "antiinflamatorio", "músculos", "articulaciones", "doterra"],
    destacado: true,
  },
  {
    existingSlug: null, // NUEVO PRODUCTO
    newSlug: "deep-blue-rollon-10ml",
    name: "Aceite Esencial Deep Blue Roll-On 10ml",
    category: "aceites-esenciales",
    tipoProducto: "mezcla",
    descripcion: "DEEP BLUE / CALMANTE / ANTIINFLAMATORIO\n\nFormato ya fraccionado con aceite de coco y listo para su uso directo.\n\nContiene: Gaulteria, Menta, Tanaceto azul, Manzanilla azul, Helicriso, Osmanto, Alcanfor.\n\nLa mezcla calmante Deep Blue reúne extractos de plantas y aceites esenciales con perfiles químicos únicos para ayudar a reconfortar y calmar las articulaciones y los músculos. Deep Blue proporciona beneficios calmantes y reconfortantes para la espalda, las piernas y los pies. Por lo tanto, es ideal como parte de un masaje postdeportivo.\n\nNueva fórmula mejorada, rigurosamente probada para ofrecer un mejor resultado con una eficacia increíble. Crea una sensación de frescor cuando se aplica sobre la piel para proporcionar la comodidad deseada. Aplicar durante un masaje calmante tras un día largo para obtener beneficios relajantes.",
    beneficios: ["Listo para usar sin diluir", "Alivia dolor muscular y articular", "Efecto antiinflamatorio natural", "Formato roll-on cómodo y preciso", "Ideal para llevar a cualquier lugar"],
    indicaciones: ["Inflamación", "Hematomas", "Tensión muscular", "Dolor articular", "Recuperación deportiva"],
    usoGeneral: "Aplicar directamente sobre la zona afectada con el roll-on. Listo para usar sin necesidad de diluir.",
    imagen: `${CDN}/deep-blue-rollon_3c5a8f76.jpg`,
    tags: ["deep blue", "roll-on", "antiinflamatorio", "músculos", "doterra"],
    destacado: false,
  },
  {
    existingSlug: "frankincense-olibano",
    name: "Aceite Esencial Frankincense (Incienso) 15ml",
    category: "aceites-esenciales",
    tipoProducto: "aceite",
    descripcion: "INCIENSO / ACEITE SAGRADO / POTENCIADOR\n\nResinas de cuatro especies de árboles: Boswellia carterii, Boswellia sacra, Boswellia papyrifera y Boswellia frereana.\n\nEl Frankincense, conocido como el rey de los aceites esenciales, tiene una amplia variedad de usos y beneficios. Con un aroma terroso, amaderado y especiado, el Frankincense ha sido apreciado durante siglos por sus propiedades sagradas y medicinales. Es conocido por sus poderosas propiedades para el cuidado de la piel, que ayudan a reducir la apariencia de las imperfecciones y promover un tono de piel uniforme. Cuando se usa aromáticamente, el Frankincense favorece sentimientos de paz, relajación, satisfacción y bienestar general. Es un potenciador de otros aceites esenciales: amplifica sus propiedades cuando se mezcla con ellos.",
    beneficios: ["Potencia el efecto de otros aceites", "Favorece la paz y el bienestar", "Cuida y rejuvenece la piel", "Propiedades antiinflamatorias", "Apoyo al sistema inmune"],
    indicaciones: ["Meditación y espiritualidad", "Cuidado de la piel", "Inflamación", "Apoyo inmunológico", "Bienestar emocional"],
    usoGeneral: "Aromático: 3-4 gotas en difusor. Tópico: 1-2 gotas directamente sobre la piel o diluido. Interno: 1 gota bajo la lengua o en agua.",
    imagen: `${CDN}/frankinciense_1ccfa6a2.jpg`,
    tags: ["frankincense", "incienso", "sagrado", "piel", "meditación", "doterra"],
    destacado: true,
  },
  {
    existingSlug: "serenity-sueno-reparador",
    name: "Aceite Esencial Serenity 15ml",
    category: "aceites-esenciales",
    tipoProducto: "mezcla",
    descripcion: "SERENITY / RELAJANTE\n\nContiene: Flor de Lavanda, Cedro, Hoja de madera de Ho, Flor de Ylang Ylang, Hoja de Mejorana, Flor de Manzanilla Romana, Raíz de Vetiver, Absoluto de Grano.\n\ndoTERRA Serenity es una mezcla pacífica de aceites esenciales que favorece la tranquilidad y la relajación. Los efectos de esta mezcla serena se pueden percibir inmediatamente, transportándote a un estado de calma dichosa. dōTERRA Serenity combina aceites esenciales conocidos por su capacidad de liberar los sentimientos de tensión y calmar las emociones. Aplicar tópicamente antes de ir a dormir para reducir las preocupaciones y prepararte para un sueño reparador. Los aceites esenciales de madera de cedro, madera de Ho y vetiver le dan a esta mezcla un aroma a tierra que calma la mente y relaja los sentidos. Esta mezcla única Serenity ayuda al usuario a experimentar sentimientos de tranquilidad y relajación. Puede ayudar a calmar las emociones y los sentidos en los momentos de mayor alteración.",
    beneficios: ["Favorece la tranquilidad y relajación", "Prepara para un sueño reparador", "Calma emociones alteradas", "Efecto inmediato al aplicar", "Aroma terroso y calmante"],
    indicaciones: ["Tensión", "Insomnio", "Fatiga mental", "Ansiedad", "Estrés emocional"],
    usoGeneral: "Aromático: 3-4 gotas en difusor antes de dormir. Tópico: aplicar en plantas de pies, muñecas o nuca antes de acostarse.",
    imagen: null,
    tags: ["serenity", "relajante", "sueño", "ansiedad", "doterra"],
    destacado: true,
  },
  {
    existingSlug: "ylang-ylang",
    name: "Aceite Esencial Ylang Ylang 15ml",
    category: "aceites-esenciales",
    tipoProducto: "aceite",
    descripcion: "YLANG YLANG / ARMONIZADOR ENERGÉTICO\n\nEl aceite esencial de ylang ylang se obtiene de las flores en forma de estrella del árbol tropical ylang ylang. Este aceite esencial se utiliza ampliamente en la fabricación de perfumes y en la aromaterapia, y se ha utilizado en ceremonias religiosas y matrimoniales durante siglos. El ylang ylang se utiliza frecuentemente en productos de lujo para el cabello y la piel por su aroma rico y dulce y también por sus propiedades nutritivas y protectoras. El ylang ylang también es conocido por favorecer la calma y mejorar el estado de ánimo.\n\nEl aroma instantáneamente reconocible favorece la calma y ayuda a mejorar el ánimo con su fragancia. Popular por su aroma aromático, el ylang ylang se utiliza en perfumes y productos para el cuidado del cabello. Tiene poderosas propiedades protectoras y nutritivas que favorecen la salud de la piel y el cabello. Ideal para mezclar con cualquier otro aceite esencial de doTERRA para obtener un aroma dulce y refrescante.",
    beneficios: ["Armoniza la energía y el ánimo", "Propiedades afrodisíacas naturales", "Nutre y protege el cabello", "Favorece la calma y la relajación", "Perfume natural de lujo"],
    indicaciones: ["Energía negativa", "Estrés y miedo", "Cuidado del cabello", "Afrodisíaco", "Bienestar emocional"],
    usoGeneral: "Aromático: 3-4 gotas en difusor. Tópico: 1 gota en muñecas como perfume, o mezclar con aceite de coco para masaje capilar.",
    imagen: `${CDN}/ylang-ylang_4891300a.jpg`,
    tags: ["ylang ylang", "afrodisíaco", "cabello", "perfume", "doterra"],
    destacado: false,
  },
  {
    existingSlug: "on-guard-escudo-inmune",
    name: "Aceite Esencial On Guard 15ml",
    category: "aceites-esenciales",
    tipoProducto: "mezcla",
    descripcion: "ON GUARD / MEZCLA PROTECTORA\n\nContiene: Naranja, Clavo, Corteza de Canela, Eucalipto y Romero.\n\nOn Guard es una de las mezclas más populares de doTERRA por sus increíbles beneficios. Potente estimulador del sistema inmune. Con su aroma único, On Guard ofrece una alternativa natural, fragante y efectiva a los clásicos productos de venta libre que palian los típicos síntomas de bajada de defensas. Esta mezcla de aceites esenciales con propiedades antivíricas, antibacterianas y antifúngicas es el escudo natural de tu familia.",
    beneficios: ["Estimula el sistema inmune", "Propiedades antivíricas y antibacterianas", "Protege frente a infecciones", "Alternativa natural a medicamentos", "Aroma cálido y especiado"],
    indicaciones: ["Antiviral", "Antibacteriano", "Tos y dolor de garganta", "Bajada de defensas", "Prevención de enfermedades"],
    usoGeneral: "Aromático: 3-4 gotas en difusor. Tópico: diluir con aceite portador y aplicar en plantas de pies o pecho. Interno: 1 gota en agua o en cápsula vegetal.",
    imagen: `${CDN}/onguard_390aaa96.jpg`,
    tags: ["on guard", "inmune", "antiviral", "protector", "doterra"],
    destacado: true,
  },
  {
    existingSlug: "zendgest-apoyo-digestivo",
    name: "Aceite Esencial ZenGest 15ml",
    category: "aceites-esenciales",
    tipoProducto: "mezcla",
    descripcion: "ZENGEST / DIGESTIVO\n\nContiene: Semilla de Anís, Planta de Menta, Raíz de Jengibre, Semilla de Alcaravea, Semilla de Cilantro, Planta de Estragón, Semilla de Hinojo.\n\nEsta mezcla única contiene aceites esenciales muy populares en el alivio de las molestias estomacales. La mezcla ZenGest no puede faltar ni en casa ni en tu maleta; está llena de beneficios para que puedas disfrutar con total tranquilidad a cualquier hora del día. Indicado para calambres, gases, náuseas, acidez y digestión en general.",
    beneficios: ["Alivia calambres y gases", "Reduce náuseas y acidez", "Favorece la digestión", "Imprescindible para viajes", "Alivio rápido y natural"],
    indicaciones: ["Calambres digestivos", "Gases", "Náusea", "Acidez", "Digestión pesada"],
    usoGeneral: "Tópico: aplicar en sentido horario sobre el abdomen diluido con aceite portador. Interno: 1 gota en agua o en cápsula vegetal.",
    imagen: `${CDN}/zengest_b2304d4e.jpg`,
    tags: ["zengest", "digestivo", "náuseas", "gases", "doterra"],
    destacado: true,
  },
  {
    existingSlug: "oregano",
    name: "Aceite Esencial Orégano 15ml",
    category: "aceites-esenciales",
    tipoProducto: "aceite",
    descripcion: "ORÉGANO / ANTIBIÓTICO NATURAL\n\nDurante cientos de años, el Orégano ha sido conocido como uno de los aceites esenciales más potentes y beneficiosos. El orégano se puede encontrar en libros de cocina y hogares de todo el mundo, ya que su sabor versátil complementa una gran variedad de cocinas. Se extrae de las hojas fragantes de la planta de orégano, Origanum vulgare. El principal componente químico del orégano es el carvacrol, un fenol, que lo convierte en uno de los aceites esenciales más multifacéticos y poderosos. Aplicado tópicamente, el Orégano debe diluirse con un aceite portador.\n\nConsiderado como uno de los aceites esenciales más potentes con innumerables aplicaciones y beneficios. Sabor herbáceo y picante ideal para sopas, ensaladas y condimentos. Cuando se diluye con un aceite portador se puede utilizar en un masaje relajante.",
    beneficios: ["Antibiótico natural potente", "Propiedades antifúngicas y antiparasitarias", "Apoyo al sistema inmune", "Versátil en cocina y terapia", "Componente activo: carvacrol"],
    indicaciones: ["Infecciones bacterianas", "Infecciones virales", "Infecciones parasitarias", "Hongos", "Apoyo inmunológico"],
    usoGeneral: "Tópico: SIEMPRE diluir con aceite portador antes de aplicar. Interno: 1 gota en cápsula vegetal. No tomar más de 10 días seguidos.",
    imagen: `${CDN}/oregano_55326bac.jpg`,
    tags: ["orégano", "antibiótico", "antifúngico", "infecciones", "doterra"],
    destacado: true,
  },
  {
    existingSlug: "balance-equilibrio-emocional",
    name: "Aceite Esencial Balance 15ml",
    category: "aceites-esenciales",
    tipoProducto: "mezcla",
    descripcion: "BALANCE / MEZCLA DE EQUILIBRIO\n\nContiene: Hoja aguja de Abeto, Madera de Ho, Resina de Incienso, Flor de Tanaceto Azul, Flor de Manzanilla Azul.\n\nEl aroma fresco y amaderado de Balance es perfecto cuando necesitas un poco de armonía en tu vida. dōTERRA Balance está formulada con aceites esenciales emocionalmente beneficiosos que trabajan de la mano para crear una sensación de calma y bienestar. El aroma dulce y amaderado de dōTERRA Balance la convierte en una fragancia ideal para promover sensaciones de equilibrio y tranquilidad.",
    beneficios: ["Promueve el equilibrio emocional", "Crea sensación de calma y bienestar", "Aroma fresco y amaderado", "Armoniza mente y cuerpo", "Ideal para meditación"],
    indicaciones: ["Desequilibrio emocional", "Estrés", "Ansiedad", "Meditación", "Bienestar general"],
    usoGeneral: "Aromático: 3-4 gotas en difusor. Tópico: aplicar en muñecas, nuca o plantas de pies.",
    imagen: `${CDN}/balance_eb1b774a.jpg`,
    tags: ["balance", "equilibrio", "emocional", "calma", "doterra"],
    destacado: false,
  },
  {
    existingSlug: "tea-tree-melaleuca",
    name: "Aceite Esencial Tea Tree (Melaleuca) 15ml",
    category: "aceites-esenciales",
    tipoProducto: "aceite",
    descripcion: "MELALEUCA (ÁRBOL DE TÉ) / PURIFICADOR / ANTIBIÓTICO TÓPICO\n\nAceite esencial Árbol del Té, también llamado aceite esencial de Melaleuca, contiene más de 92 compuestos diferentes e increíbles aplicaciones tópicas. Las hojas del árbol del té fueron utilizadas por los aborígenes de Australia durante siglos. Machacaban las hojas para aplicarlas directamente sobre la piel y conseguir un efecto refrescante. Árbol del té es conocido por sus propiedades purificantes. Se puede utilizar para limpiar y purificar la piel y las uñas y para mantener una tez sana. El árbol del té se utiliza frecuentemente en caso de irritaciones aisladas y para calmar la piel.\n\nReconocida por sus efectos limpiadores y rejuvenecedores que proporcionan a la piel una frescura revitalizada. La Árbol del té (melaleuca) tiene propiedades beneficiosas que pueden ayudar a reducir la aparición de manchas. Proporciona beneficios para el pelo, la piel y las uñas.",
    beneficios: ["Purifica y limpia la piel", "Propiedades antibióticas tópicas", "Reduce manchas y acné", "Cuida uñas y cabello", "Más de 92 compuestos activos"],
    indicaciones: ["Infecciones cutáneas", "Irritaciones", "Herpes labial", "Psoriasis", "Hongos y acné"],
    usoGeneral: "Tópico: aplicar directamente sobre la zona afectada o diluir con aceite portador. No usar internamente.",
    imagen: `${CDN}/tea-tree_11aa32f0.jpg`,
    tags: ["tea tree", "melaleuca", "purificador", "piel", "acné", "doterra"],
    destacado: true,
  },
  {
    existingSlug: "peppermint",
    name: "Aceite Esencial Peppermint (Menta) 15ml",
    category: "aceites-esenciales",
    tipoProducto: "aceite",
    descripcion: "MENTA / REFRESCANTE\n\nSiempre es útil tener aceite de menta, uno de los aceites más vendidos de doTERRA. La menta añade un sabor refrescante y mentolado a los postres, bebidas, batidos e incluso a platos salados. Un alto contenido de mentol, como el que se encuentra en el aceite esencial de menta de doTERRA, distingue la mejor calidad de un aceite esencial de menta de otros aceites esenciales. La menta se utiliza frecuentemente en la pasta de dientes y en chicles para el cuidado bucal. Si eres fan de las bebidas refrescantes, ¡el aceite de menta va a ser tu mejor amigo! Cuando el calor del verano parezca abrumarte, añade una gota de menta al agua para refrescarte instantáneamente.",
    beneficios: ["Alivia cefaleas y migrañas", "Efecto refrescante inmediato", "Favorece la digestión", "Aumenta la energía y el enfoque", "Versátil en cocina y aromaterapia"],
    indicaciones: ["Cefalea", "Somnolencia", "Náuseas", "Digestión", "Calor y agotamiento"],
    usoGeneral: "Aromático: 3-4 gotas en difusor. Tópico: 1-2 gotas en sienes para cefalea. Interno: 1 gota en agua fría o en recetas.",
    imagen: null,
    tags: ["menta", "peppermint", "refrescante", "cefalea", "digestivo", "doterra"],
    destacado: true,
  },
  {
    existingSlug: "limon",
    name: "Aceite Esencial Limón 15ml",
    category: "aceites-esenciales",
    tipoProducto: "aceite",
    descripcion: "LIMÓN / ENERGÉTICO\n\nLimón es uno de los aceites esenciales más vendidos de dōTERRA y tiene multitud de beneficios y usos. El Limón se añade frecuentemente a las comidas para mejorar el sabor tanto de los postres como de los platos principales. Limón tiene un aroma estimulante y energizante. Puede utilizarse para añadir un sabor refrescante al agua o para un sinfín de recetas, desde saladas a postres dulces. Prensado en frío de cáscaras de limón para preservar su delicada naturaleza y sus útiles y potentes propiedades. Propiedades estimulantes y energizantes que promueven un estado de ánimo positivo con su aroma vigorizante.",
    beneficios: ["Energizante y estimulante", "Propiedades detox y depurativas", "Ideal para cocina y bebidas", "Promueve un ánimo positivo", "Prensado en frío para máxima pureza"],
    indicaciones: ["Resfriados", "Dolor de garganta", "Detox", "Falta de energía", "Cocina saludable"],
    usoGeneral: "Aromático: 3-4 gotas en difusor. Tópico: diluir antes de aplicar (fotosensibilizante). Interno: 1 gota en agua o zumos.",
    imagen: `${CDN}/limon_77a6ecb9.jpg`,
    tags: ["limón", "energético", "detox", "cocina", "doterra"],
    destacado: false,
  },
  {
    existingSlug: "air-respiracion-libre",
    name: "Aceite Esencial Air 15ml",
    category: "aceites-esenciales",
    tipoProducto: "mezcla",
    descripcion: "AIR / MEZCLA DESCONGESTIVA\n\nContiene: Laurel, Eucalipto, Menta, Melaleuca, Limón, Cardamomo, Ravintsara, Ravensara.\n\nEsta mezcla mentolada y vigorizante tiene un efecto calmante y relajante cuando se aplica tópicamente. Air está enriquecida con una combinación de aceites destinados a refrescar y vivificar el cuerpo, proporcionándote sensaciones de vías respiratorias despejadas. Ideal para los meses de invierno o cuando necesitas respirar con más libertad.",
    beneficios: ["Despeja las vías respiratorias", "Efecto descongestivo natural", "Aroma mentolado y vigorizante", "Ideal para difusor en invierno", "Combina 8 aceites sinérgicos"],
    indicaciones: ["Congestión nasal", "Problemas respiratorios", "Resfriados", "Sinusitis", "Ambiente purificado"],
    usoGeneral: "Aromático: 3-4 gotas en difusor. Tópico: aplicar en pecho y espalda diluido con aceite portador.",
    imagen: null,
    tags: ["air", "respiratorio", "descongestivo", "eucalipto", "doterra"],
    destacado: false,
  },
  // ── BASES Y DILUCIÓN ────────────────────────────────────────────────────────
  {
    existingSlug: "aceite-coco-fraccionado",
    name: "Aceite de Coco Fraccionado",
    category: "bases-y-dilucion",
    tipoProducto: "base",
    descripcion: "El aceite de coco fraccionado de doTERRA es un aceite portador natural que se absorbe fácilmente en la piel, lo que lo convierte en un aceite ideal para el uso tópico. Su efecto emoliente tan ligero como una pluma proporciona una barrera calmante sin obstruir los poros, y es excelente para pieles secas o con problemas. Deja la piel suave como la seda y no grasa, a diferencia de otros aceites vegetales. El aceite de coco fraccionado es completamente soluble con todos los aceites esenciales y es incoloro, inodoro y no mancha.",
    beneficios: ["Aceite portador ideal para dilución", "Se absorbe fácilmente sin obstruir poros", "Incoloro, inodoro y no mancha", "Compatible con todos los aceites esenciales", "Hidrata y suaviza la piel"],
    indicaciones: ["Dilución de aceites esenciales", "Pieles secas", "Masajes", "Mezclas personalizadas", "Uso diario"],
    usoGeneral: "Mezclar con aceites esenciales en la proporción deseada. Para masajes: 5-10 gotas de aceite esencial por 10ml de aceite de coco fraccionado.",
    imagen: `${CDN}/coco-fraccionado_3dfbb23a.jpg`,
    tags: ["coco fraccionado", "portador", "base", "dilución", "doterra"],
    destacado: true,
  },
  // ── ACCESORIOS ──────────────────────────────────────────────────────────────
  {
    existingSlug: null, // NUEVO: Veggie Caps
    newSlug: "veggie-caps-160",
    name: "Veggie Caps — 160 Cápsulas Vegetales",
    category: "accesorios",
    tipoProducto: "accesorio",
    descripcion: "Cápsulas vegetales hechas específicamente para ayudarte a personalizar tus necesidades. Las Cápsulas Vegetales proporcionan una forma cómoda y segura de ingerir los aceites esenciales. Perfectas para preparar la receta Recovery Bomb y otras fórmulas personalizadas de uso interno.",
    beneficios: ["Forma segura de ingerir aceites esenciales", "Cápsulas 100% vegetales", "Personalizables según necesidades", "160 unidades por envase", "Compatibles con todos los aceites doTERRA"],
    indicaciones: ["Uso interno de aceites esenciales", "Fórmulas personalizadas", "Recovery Bomb", "Suplementación natural"],
    usoGeneral: "Introducir las gotas de aceite esencial deseadas en la cápsula y cerrar. Tomar con agua después de las comidas.",
    imagen: `${CDN}/veggie-caps_0c18d1f8.jpg`,
    tags: ["veggie caps", "cápsulas", "interno", "accesorio", "doterra"],
    destacado: false,
  },
  {
    existingSlug: "difusor-petal-2",
    name: "Trío Difusor Petal 2.0",
    category: "accesorios",
    tipoProducto: "accesorio",
    descripcion: "El difusor dōTERRA Petal es un dispositivo pequeño y fácil de utilizar que proporciona una gran variedad de beneficios. Este práctico difusor es estable, ligero y fácil de utilizar.\n\nLa salida de vapor sustancial ayuda a humidificar el aire. Configuración para 2, 6 y 12 horas de difusión. Luz LED opcional. El vapor ultrafino alcanza hasta 33 m². Este difusor simple de 3 piezas es práctico y fácil de usar. Estable, ligero y perfecto para varias habitaciones.\n\nEl uso de un difusor de aceites esenciales es una manera fácil, cómoda y sin complicaciones de aprovechar los beneficios de los aceites esenciales. Llena tu hogar con el aroma de los aceites esenciales, transforma tu espacio de trabajo con sensaciones estimulantes o crea un ambiente de descanso antes de ir a la cama.",
    beneficios: ["Cubre hasta 33 m² de espacio", "3 modos de tiempo: 2, 6 y 12 horas", "Humidifica el aire mientras difunde", "Luz LED ambiental opcional", "Fácil limpieza y mantenimiento"],
    indicaciones: ["Aromaterapia en el hogar", "Ambiente relajante", "Purificación del aire", "Humidificación", "Uso nocturno"],
    usoGeneral: "Llenar con agua hasta la marca máxima. Añadir 5-12 gotas de aceite esencial. Seleccionar el tiempo de difusión deseado.",
    imagen: `${CDN}/trio-difusor-petal_3b94c55d.jpg`,
    tags: ["difusor", "petal", "aromaterapia", "humidificador", "doterra"],
    destacado: true,
  },
  {
    existingSlug: null, // NUEVO: Herramienta retirar tapas
    newSlug: "herramienta-retirar-tapas",
    name: "Herramienta para Retirar Tapas Roll-On",
    category: "accesorios",
    tipoProducto: "accesorio",
    descripcion: "Se usa para retirar fácilmente las tapas y las carcasas de la bola de los envases tipo roll-on de variedad de tamaños de frascos. Imprescindible para rellenar tus propios roll-ons o cambiar la bola aplicadora.",
    beneficios: ["Retira tapas roll-on sin esfuerzo", "Compatible con varios tamaños de frascos", "Imprescindible para rellenar roll-ons", "Herramienta duradera y reutilizable", "Facilita la preparación de mezclas"],
    indicaciones: ["Rellenar frascos roll-on", "Cambiar bola aplicadora", "Preparación de mezclas personalizadas"],
    usoGeneral: "Introducir la herramienta bajo la tapa del roll-on y hacer palanca suavemente para retirarla sin dañar el frasco.",
    imagen: `${CDN}/herramienta_7c2a4400.jpg`,
    tags: ["herramienta", "roll-on", "accesorio", "doterra"],
    destacado: false,
  },
  {
    existingSlug: null, // NUEVO: Caja de madera
    newSlug: "caja-madera-doterra",
    name: "Caja de Madera con Logo Grabado doTERRA",
    category: "accesorios",
    tipoProducto: "accesorio",
    descripcion: "Hecha a medida para contener 25 aceites esenciales, esta caja de madera grabada con el logotipo es ligera y compacta, lo que facilita el transporte de los aceites a cualquier lugar. También sirve como una vitrina preciosa para tus aceites cuando hagas presentaciones. Una forma elegante de organizar y mostrar tu colección de aceites esenciales doTERRA.",
    beneficios: ["Capacidad para 25 aceites esenciales", "Ligera y fácil de transportar", "Diseño elegante con logo grabado", "Perfecta para presentaciones", "Protege tus aceites esenciales"],
    indicaciones: ["Almacenamiento de aceites", "Transporte", "Presentaciones y talleres", "Regalo especial"],
    usoGeneral: "Colocar los frascos de aceites esenciales en los compartimentos. Ideal para llevar a talleres, consultas o viajes.",
    imagen: `${CDN}/caja-madera_9ffa8dfd.jpg`,
    tags: ["caja", "madera", "almacenamiento", "regalo", "doterra"],
    destacado: false,
  },
  {
    existingSlug: "humidificador-aromaterapia",
    name: "Cecotec Humidificador Ultrasónico 150 Yang",
    category: "accesorios",
    tipoProducto: "accesorio",
    descripcion: "Humidificador ultrasónico que ayuda a reducir la sequedad ambiental gracias a su caudal de vapor frío y continuo. Este humidificador es a su vez un magnífico difusor de aromas que te ayudará a mantener un estupendo olor y ambiente en tu hogar.\n\nCuenta con un gran depósito de 150 ml de capacidad. Temporizador de hasta 3 horas, una vez acabadas se apaga automáticamente. 7 colores LED con control manual y automático, pudiendo ser utilizado como una luz nocturna. Apto para estancias de hasta 10 m². Elegante diseño color madera que se adapta a cualquier estancia. Ultrasilencioso gracias a su tecnología ultrasónica. Al no emitir ruidos molestos es el complemento perfecto para los bebés.",
    beneficios: ["Humidifica y difunde aromas a la vez", "7 colores LED para ambiente", "Ultrasilencioso, ideal para bebés", "Temporizador automático hasta 3h", "Diseño elegante color madera"],
    indicaciones: ["Humidificación ambiental", "Aromaterapia", "Habitación de bebés", "Luz nocturna", "Ambientes secos"],
    usoGeneral: "Llenar el depósito con agua. Añadir unas gotas de aceite esencial. Seleccionar el tiempo y el color LED deseado.",
    imagen: `${CDN}/humidificador_818f5db4.jpg`,
    tags: ["humidificador", "cecotec", "difusor", "ultrasilencioso", "bebés"],
    destacado: false,
  },
  {
    existingSlug: "botellas-roll-on-cristal",
    name: "Pack 3 Botellas Roll-On de Cristal 5ml",
    category: "accesorios",
    tipoProducto: "accesorio",
    descripcion: "Pack de 3 botellas de vidrio tipo roll-on de 5ml equipadas con cubierta negra. Perfectas para preparar tus propias mezclas de aceites esenciales personalizadas y llevarlas contigo a cualquier lugar. El cristal preserva las propiedades de los aceites esenciales mejor que el plástico.",
    beneficios: ["Cristal de alta calidad", "Preserva las propiedades de los aceites", "Formato compacto y portátil", "Pack de 3 unidades", "Cubierta negra elegante"],
    indicaciones: ["Mezclas personalizadas", "Perfumes naturales", "Roll-on de viaje", "Regalos personalizados"],
    usoGeneral: "Rellenar con la mezcla de aceites esenciales deseada. Usar la herramienta de retirar tapas para abrirlas y rellenarlas.",
    imagen: null,
    tags: ["roll-on", "cristal", "botellas", "mezclas", "accesorio"],
    destacado: false,
  },
  // ── PACKS Y GUÍAS ───────────────────────────────────────────────────────────
  {
    existingSlug: "guia-digital-aceites-esenciales",
    name: "Guía Digital de Aceites Esenciales",
    category: "packs-y-guias",
    tipoProducto: "pack",
    descripcion: "Guía corta de aceites esenciales básicos para el hogar en formato PDF DIGITAL. Incluye soporte grupal y posibilidad de compra a través de Cristina. Una herramienta práctica y accesible para iniciarte en el mundo de los aceites esenciales con la guía experta de Cristina Battistelli.",
    beneficios: ["Formato PDF digital descargable", "Guía práctica para el hogar", "Incluye soporte grupal", "Redactada por Cristina Battistelli", "Acceso inmediato tras la consulta"],
    indicaciones: ["Iniciación a los aceites esenciales", "Referencia rápida en el hogar", "Aprendizaje autodidacta"],
    usoGeneral: "Consultar la guía para identificar el aceite adecuado según la necesidad. Disponible en formato PDF para consultar desde cualquier dispositivo.",
    imagen: `${CDN}/guia_b6d3fe08.jpg`,
    tags: ["guía", "digital", "PDF", "principiantes", "doterra"],
    destacado: true,
  },
  {
    existingSlug: null, // NUEVO: Recovery Bomb
    newSlug: "pack-recovery-bomb",
    name: "Pack Recovery Bomb — Bomba Antigripal",
    category: "packs-y-guias",
    tipoProducto: "pack",
    descripcion: "La Recovery Bomb es una receta que podréis ver por Internet como foto en diversos lugares. Aquí explico cómo funciona.\n\nIngredientes (aceites esenciales de dōTERRA): 4 gotas de Lemon, 2 gotas de Oregano, 2 gotas de Frankincense, 2 gotas de OnGuard, 2 gotas de Melaleuca.\n\nUsando cápsulas vacías (las de dōTERRA se llaman 'VeggieCaps' o cápsulas vegetales): Adultos: introducir las gotas en una cápsula vacía, tomar 2 veces al día después de comer. Niños mayores de 7 años (y muy enfermos): media dosis, en cápsula, 2 veces al día después de comer.\n\nNOTA: de ser posible, es mejor tomar media dosis (o un cuarto, para niños) 4-5 veces al día que no la dosis entera dos veces. El cuerpo responde mejor a dosis menores con mayor frecuencia.\n\nEn roll-on para niños: duplicar la receta, añadir a un roll-on vacío con la misma cantidad de aceite de coco fraccionado y aplicar 3-4 veces al día en la planta de los pies.\n\nObservaciones: No se debe tomar orégano de forma interna más de 10 días seguidos. Esta receta hace efecto muy rápidamente. Como es una fórmula muy potente, toma la cápsula después de haber comido una comida completa. Procura beber abundante agua durante el tratamiento.",
    beneficios: ["Fórmula antigripal potente y natural", "5 aceites esenciales sinérgicos", "Adaptable para adultos y niños", "Efecto rápido y comprobado", "Alternativa natural a medicamentos"],
    indicaciones: ["Gripe y resfriado", "Bajada de defensas", "Infecciones respiratorias", "Prevención en temporada de frío"],
    usoGeneral: "Adultos: 4+2+2+2+2 gotas en cápsula vegetal, 2 veces al día después de comer. Niños: en roll-on con aceite de coco en planta de pies.",
    imagen: `${CDN}/pack-recovery-bomb_3b5e0a2f.jpg`,
    tags: ["recovery bomb", "antigripal", "pack", "gripe", "doterra"],
    destacado: true,
  },
];

async function main() {
  const db = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log(`\n🌿 Actualizando ${UPDATES.length} productos de aceites esenciales...\n`);
  
  let updated = 0;
  let created = 0;
  let skipped = 0;
  
  for (const product of UPDATES) {
    const beneficiosJson = JSON.stringify(product.beneficios);
    const indicacionesJson = JSON.stringify(product.indicaciones);
    const tagsJson = JSON.stringify(product.tags);
    
    if (product.existingSlug) {
      // Actualizar producto existente
      const [result] = await db.execute(
        `UPDATE oil_products SET 
          name = ?, category = ?, tipoProducto = ?, descripcion = ?,
          beneficios = ?, indicaciones = ?, usoGeneral = ?,
          imagen = ?, tags = ?, destacado = ?
        WHERE slug = ?`,
        [
          product.name,
          product.category,
          product.tipoProducto,
          product.descripcion,
          beneficiosJson,
          indicacionesJson,
          product.usoGeneral,
          product.imagen || null,
          tagsJson,
          product.destacado ? 1 : 0,
          product.existingSlug,
        ]
      );
      if (result.affectedRows > 0) {
        console.log(`  ✅ Actualizado: ${product.name}`);
        updated++;
      } else {
        console.log(`  ⚠️  No encontrado: ${product.existingSlug}`);
        skipped++;
      }
    } else {
      // Crear nuevo producto
      const slug = product.newSlug;
      // Verificar si ya existe
      const [existing] = await db.execute('SELECT id FROM oil_products WHERE slug = ?', [slug]);
      if (existing.length > 0) {
        await db.execute(
          `UPDATE oil_products SET 
            name = ?, category = ?, tipoProducto = ?, descripcion = ?,
            beneficios = ?, indicaciones = ?, usoGeneral = ?,
            imagen = ?, tags = ?, destacado = ?
          WHERE slug = ?`,
          [
            product.name, product.category, product.tipoProducto, product.descripcion,
            beneficiosJson, indicacionesJson, product.usoGeneral,
            product.imagen || null, tagsJson, product.destacado ? 1 : 0, slug
          ]
        );
        console.log(`  🔄 Actualizado (ya existía): ${product.name}`);
        updated++;
      } else {
        await db.execute(
          `INSERT INTO oil_products 
            (name, slug, category, tipoProducto, descripcion, beneficios, indicaciones, usoGeneral, imagen, tags, destacado, sortOrder, visibleEnPublico, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 99, 1, 'active')`,
          [
            product.name, slug, product.category, product.tipoProducto,
            product.descripcion, beneficiosJson, indicacionesJson, product.usoGeneral,
            product.imagen || null, tagsJson, product.destacado ? 1 : 0,
          ]
        );
        console.log(`  ✨ Creado nuevo: ${product.name}`);
        created++;
      }
    }
  }
  
  await db.end();
  
  console.log(`\n📊 Resumen:`);
  console.log(`   ✅ Actualizados: ${updated}`);
  console.log(`   ✨ Creados nuevos: ${created}`);
  console.log(`   ⚠️  Omitidos: ${skipped}`);
  console.log(`\n✅ Proceso completado.\n`);
}

main().catch(console.error);
