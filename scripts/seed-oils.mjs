/**
 * seed-oils.mjs — Carga inicial de categorías y productos de aceites esenciales
 * Cristina Vive Consciente
 *
 * Ejecutar con: node scripts/seed-oils.mjs
 */

import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const db = await mysql.createConnection(process.env.DATABASE_URL);

// ─── CATEGORÍAS ───────────────────────────────────────────────────────────────

const categories = [
  { name: "Aceites esenciales", slug: "aceites-esenciales", description: "Aceites esenciales puros de origen botánico, extraídos mediante destilación al vapor o prensado en frío.", icon: "🌿", sortOrder: 1 },
  { name: "Mezclas terapéuticas", slug: "mezclas-terapeuticas", description: "Sinergia de aceites formuladas para objetivos terapéuticos específicos: dolor, inmunidad, digestión, emociones.", icon: "💧", sortOrder: 2 },
  { name: "Bases y dilución", slug: "bases-y-dilucion", description: "Aceites vegetales y bases para diluir los aceites esenciales y aplicarlos de forma segura sobre la piel.", icon: "🫙", sortOrder: 3 },
  { name: "Packs y guías", slug: "packs-y-guias", description: "Kits de inicio y guías digitales para aprender a usar los aceites esenciales con seguridad y eficacia.", icon: "📦", sortOrder: 4 },
  { name: "Accesorios", slug: "accesorios", description: "Difusores, humidificadores y accesorios para integrar los aceites esenciales en tu rutina diaria.", icon: "✨", sortOrder: 5 },
];

console.log("🌿 Insertando categorías...");
const catMap = {};

for (const cat of categories) {
  const [existing] = await db.execute("SELECT id FROM oil_categories WHERE slug = ?", [cat.slug]);
  if (existing.length > 0) {
    catMap[cat.slug] = existing[0].id;
    console.log(`  ↳ Categoría ya existe: ${cat.name}`);
    continue;
  }
  const [result] = await db.execute(
    "INSERT INTO oil_categories (name, slug, description, icon, sortOrder, status) VALUES (?, ?, ?, ?, ?, 'active')",
    [cat.name, cat.slug, cat.description, cat.icon, cat.sortOrder]
  );
  catMap[cat.slug] = result.insertId;
  console.log(`  ✓ Categoría creada: ${cat.name}`);
}

// ─── PRODUCTOS ────────────────────────────────────────────────────────────────

const products = [
  // ─── ACEITES ESENCIALES ───────────────────────────────────────────────────
  {
    name: "Lavanda Angustifolia",
    slug: "lavanda-angustifolia",
    category: "aceites-esenciales",
    tipoProducto: "aceite",
    descripcion: "El aceite esencial de lavanda es uno de los más versátiles y estudiados de la aromaterapia. Extraído de las flores de Lavandula angustifolia mediante destilación al vapor, es conocido por su aroma floral suave y sus propiedades calmantes, cicatrizantes y equilibrantes.",
    beneficios: JSON.stringify(["Calma el sistema nervioso y reduce la ansiedad", "Favorece un sueño profundo y reparador", "Regenera y cuida la piel en quemaduras leves y picaduras"]),
    indicaciones: JSON.stringify(["Difusión: 4-6 gotas en difusor 30 min antes de dormir", "Tópico: 1-2 gotas diluidas en aceite portador para masaje", "Inhalación directa: 1 gota en palmas, frotar y respirar"]),
    usoGeneral: "Diluir siempre en aceite portador para uso tópico. No aplicar en ojos ni mucosas. Apto para niños mayores de 2 años con dilución adecuada.",
    mensajeConsulta: "La lavanda tiene múltiples usos terapéuticos. Cristina te ayudará a encontrar la aplicación más adecuada para tu situación específica.",
    tags: JSON.stringify(["ansiedad", "sueño", "piel", "relajante", "niños"]),
    destacado: 1,
    sortOrder: 1,
  },
  {
    name: "Árbol del Té",
    slug: "arbol-del-te",
    category: "aceites-esenciales",
    tipoProducto: "aceite",
    descripcion: "El aceite de árbol del té (Melaleuca alternifolia) es un potente antimicrobiano natural con amplio espectro de acción. Ideal para el cuidado de la piel, infecciones cutáneas y como apoyo al sistema inmune.",
    beneficios: JSON.stringify(["Acción antimicrobiana de amplio espectro", "Purifica y cuida la piel con tendencia acneica", "Refuerza las defensas naturales del organismo"]),
    indicaciones: JSON.stringify(["Tópico: 1-2 gotas diluidas al 2% en aceite portador", "Difusión: 3-5 gotas para purificar el ambiente", "Cuidado bucal: 1 gota en el cepillo de dientes (no tragar)"]),
    usoGeneral: "No ingerir. Diluir antes de aplicar en piel sensible. Evitar contacto con ojos.",
    mensajeConsulta: "El árbol del té tiene múltiples aplicaciones terapéuticas. Consulta con Cristina para un protocolo personalizado.",
    tags: JSON.stringify(["piel", "infecciones", "antimicrobiano", "inmunidad"]),
    destacado: 1,
    sortOrder: 2,
  },
  {
    name: "Menta Piperita",
    slug: "menta-piperita",
    category: "aceites-esenciales",
    tipoProducto: "aceite",
    descripcion: "La menta piperita es uno de los aceites esenciales más refrescantes y energizantes. Su alto contenido en mentol le confiere propiedades digestivas, analgésicas y estimulantes mentales.",
    beneficios: JSON.stringify(["Alivia molestias digestivas y náuseas", "Estimula la concentración y claridad mental", "Efecto refrescante y analgésico local"]),
    indicaciones: JSON.stringify(["Digestivo: 1 gota diluida en aceite portador, masaje abdominal", "Energizante: 1-2 gotas en difusor para concentración", "Cefalea: 1 gota diluida en sienes (evitar ojos)"]),
    usoGeneral: "No usar en niños menores de 6 años. Evitar cerca de ojos y mucosas. Puede interferir con medicamentos homeopáticos.",
    mensajeConsulta: "La menta piperita requiere precauciones específicas según tu situación. Cristina te guiará en su uso seguro.",
    tags: JSON.stringify(["digestivo", "energía", "concentración", "cefalea"]),
    destacado: 0,
    sortOrder: 3,
  },
  {
    name: "Eucalipto Radiata",
    slug: "eucalipto-radiata",
    category: "aceites-esenciales",
    tipoProducto: "aceite",
    descripcion: "El eucalipto radiata es la variedad más suave y segura del eucalipto, especialmente indicada para el sistema respiratorio. Ideal para resfriados, sinusitis y congestión nasal.",
    beneficios: JSON.stringify(["Despeja las vías respiratorias de forma natural", "Acción antiviral y antibacteriana suave", "Apto para niños mayores de 3 años con dilución adecuada"]),
    indicaciones: JSON.stringify(["Difusión: 4-6 gotas para ambientes con congestión", "Inhalación: 2-3 gotas en agua caliente, inhalar vapor", "Tópico: diluido al 2% en pecho y espalda"]),
    usoGeneral: "Usar el eucalipto radiata (no globulus) para niños. Evitar en bebés menores de 3 años.",
    mensajeConsulta: "Para problemas respiratorios recurrentes, Cristina puede diseñar un protocolo completo con aceites esenciales.",
    tags: JSON.stringify(["respiratorio", "resfriado", "sinusitis", "niños"]),
    destacado: 0,
    sortOrder: 4,
  },
  {
    name: "Limón",
    slug: "limon",
    category: "aceites-esenciales",
    tipoProducto: "aceite",
    descripcion: "El aceite esencial de limón, extraído por prensado en frío de la corteza, es un poderoso detoxificante y energizante. Aporta frescura, claridad mental y apoya la función hepática.",
    beneficios: JSON.stringify(["Apoya la detoxificación hepática y digestiva", "Eleva el estado de ánimo y la energía vital", "Purifica el ambiente y elimina malos olores"]),
    indicaciones: JSON.stringify(["Difusión: 4-6 gotas para purificar ambientes", "Interno: 1 gota en agua o zumo (solo grado terapéutico)", "Tópico: diluido al 1%, evitar exposición solar 12h"]),
    usoGeneral: "Fotosensibilizante: no aplicar en piel expuesta al sol. Usar solo aceite de grado terapéutico para uso interno.",
    mensajeConsulta: "El limón tiene muchas aplicaciones pero requiere precauciones. Consulta con Cristina para un uso seguro y efectivo.",
    tags: JSON.stringify(["detox", "energía", "digestivo", "purificante"]),
    destacado: 0,
    sortOrder: 5,
  },
  {
    name: "Ravintsara",
    slug: "ravintsara",
    category: "aceites-esenciales",
    tipoProducto: "aceite",
    descripcion: "El ravintsara, originario de Madagascar, es uno de los aceites antivirales más potentes de la aromaterapia. Excelente para reforzar el sistema inmune y combatir infecciones virales.",
    beneficios: JSON.stringify(["Potente acción antiviral y antibacteriana", "Refuerza el sistema inmune de forma natural", "Apoya la recuperación en procesos gripales"]),
    indicaciones: JSON.stringify(["Difusión: 4-6 gotas durante la temporada de gripes", "Tópico: diluido al 3% en espalda y plantas de los pies", "Preventivo: 1-2 gotas en muñecas antes de exposición"]),
    usoGeneral: "No confundir con ravensara. Apto para adultos y niños mayores de 6 años.",
    mensajeConsulta: "Para un protocolo de refuerzo inmunológico completo, Cristina puede combinar el ravintsara con otros aceites sinérgicos.",
    tags: JSON.stringify(["sistema inmune", "antiviral", "gripe", "preventivo"]),
    destacado: 1,
    sortOrder: 6,
  },
  {
    name: "Romero ct. Alcanfor",
    slug: "romero-ct-alcanfor",
    category: "aceites-esenciales",
    tipoProducto: "aceite",
    descripcion: "El romero es un aceite estimulante y tonificante, especialmente indicado para mejorar la circulación, aliviar dolores musculares y estimular la memoria y concentración.",
    beneficios: JSON.stringify(["Estimula la circulación sanguínea y linfática", "Alivia tensiones musculares y dolores articulares", "Mejora la concentración y la memoria"]),
    indicaciones: JSON.stringify(["Masaje: diluido al 3% en aceite portador para músculos", "Difusión: 3-4 gotas para estimular la concentración", "Capilar: 2-3 gotas en champú para estimular el cuero cabelludo"]),
    usoGeneral: "Evitar en embarazo, epilepsia e hipertensión. No usar en niños menores de 6 años.",
    mensajeConsulta: "El romero tiene diferentes quimiotipos con propiedades distintas. Cristina te ayudará a elegir el más adecuado para ti.",
    tags: JSON.stringify(["energía", "circulación", "memoria", "muscular"]),
    destacado: 0,
    sortOrder: 7,
  },
  {
    name: "Manzanilla Romana",
    slug: "manzanilla-romana",
    category: "aceites-esenciales",
    tipoProducto: "aceite",
    descripcion: "La manzanilla romana es uno de los aceites más suaves y seguros, especialmente indicado para niños y personas sensibles. Calma el sistema nervioso y alivia molestias digestivas.",
    beneficios: JSON.stringify(["Calma el llanto y la irritabilidad en bebés y niños", "Alivia cólicos y molestias digestivas", "Reduce la ansiedad y favorece el sueño reparador"]),
    indicaciones: JSON.stringify(["Niños: 1 gota diluida al 0.5% en aceite portador", "Difusión: 2-3 gotas en habitación infantil", "Masaje: diluida al 1% en abdomen para cólicos"]),
    usoGeneral: "Uno de los aceites más seguros para niños. Diluir siempre. Apto desde los 3 meses con dilución mínima.",
    mensajeConsulta: "Para el uso en bebés y niños pequeños, es fundamental la orientación profesional. Cristina te guiará con seguridad.",
    tags: JSON.stringify(["niños", "calma", "cólicos", "bebés", "sueño"]),
    destacado: 1,
    sortOrder: 8,
  },
  {
    name: "Incienso (Boswellia)",
    slug: "incienso-boswellia",
    category: "aceites-esenciales",
    tipoProducto: "aceite",
    descripcion: "El incienso o boswellia es uno de los aceites más preciados de la historia. Sus propiedades antiinflamatorias, inmunomoduladoras y de apoyo emocional lo convierten en un aliado excepcional para el bienestar integral.",
    beneficios: JSON.stringify(["Profundo apoyo emocional y espiritual", "Potente antiinflamatorio natural", "Apoya el sistema inmune y la regeneración celular"]),
    indicaciones: JSON.stringify(["Meditación: 1-2 gotas en difusor o palmas para inhalar", "Tópico: diluido al 2% para pieles maduras y antiedad", "Emocional: 1 gota en plexo solar en momentos de estrés"]),
    usoGeneral: "Uno de los aceites más seguros y versátiles. Apto para adultos y niños mayores de 6 años.",
    mensajeConsulta: "El incienso es un aceite con múltiples dimensiones terapéuticas. Cristina puede ayudarte a integrarlo en tu práctica de bienestar.",
    tags: JSON.stringify(["emocional", "meditación", "antiinflamatorio", "inmunidad"]),
    destacado: 1,
    sortOrder: 9,
  },
  {
    name: "Geranio",
    slug: "geranio",
    category: "aceites-esenciales",
    tipoProducto: "aceite",
    descripcion: "El geranio es el gran equilibrador hormonal de la aromaterapia. Su aroma floral suave actúa sobre el sistema endocrino, apoya la salud femenina y equilibra las emociones.",
    beneficios: JSON.stringify(["Equilibra el sistema hormonal femenino", "Alivia síntomas del síndrome premenstrual y menopausia", "Regula la producción de sebo y cuida la piel"]),
    indicaciones: JSON.stringify(["Hormonal: diluido al 2% en abdomen inferior y espalda", "Piel: 1-2 gotas en crema hidratante", "Difusión: 3-4 gotas para equilibrio emocional"]),
    usoGeneral: "Especialmente indicado para mujeres. Usar con precaución en embarazo. Puede potenciar efectos de medicamentos hormonales.",
    mensajeConsulta: "Para desequilibrios hormonales, Cristina puede diseñar un protocolo personalizado con geranio y otros aceites complementarios.",
    tags: JSON.stringify(["hormonal", "femenino", "piel", "menopausia", "SPM"]),
    destacado: 0,
    sortOrder: 10,
  },
  {
    name: "Naranja Dulce",
    slug: "naranja-dulce",
    category: "aceites-esenciales",
    tipoProducto: "aceite",
    descripcion: "El aceite de naranja dulce es uno de los más alegres y accesibles de la aromaterapia. Eleva el estado de ánimo, reduce la ansiedad y crea un ambiente cálido y positivo.",
    beneficios: JSON.stringify(["Eleva el estado de ánimo y combate la tristeza", "Reduce la ansiedad y el estrés cotidiano", "Crea un ambiente cálido y acogedor en el hogar"]),
    indicaciones: JSON.stringify(["Difusión: 4-6 gotas para ambientes alegres", "Tópico: diluido al 2% en cremas corporales", "Combinación: mezcla bien con lavanda y bergamota"]),
    usoGeneral: "Fotosensibilizante si se usa en piel expuesta al sol. Seguro para niños en difusión.",
    mensajeConsulta: "La naranja dulce es perfecta para comenzar con los aceites esenciales. Cristina puede ayudarte a crear tu primera rutina aromática.",
    tags: JSON.stringify(["emocional", "alegría", "ansiedad", "niños", "hogar"]),
    destacado: 0,
    sortOrder: 11,
  },
  {
    name: "Ylang Ylang",
    slug: "ylang-ylang",
    category: "aceites-esenciales",
    tipoProducto: "aceite",
    descripcion: "El ylang ylang es conocido como el aceite del amor y la relajación profunda. Su aroma floral intenso actúa sobre el sistema nervioso, reduce la presión arterial y equilibra las emociones.",
    beneficios: JSON.stringify(["Reduce la ansiedad y el estrés de forma profunda", "Equilibra las emociones y eleva el estado de ánimo", "Apoya la salud cardiovascular y reduce la presión arterial"]),
    indicaciones: JSON.stringify(["Difusión: 2-3 gotas (aroma intenso, usar con moderación)", "Tópico: diluido al 1% en pecho y muñecas", "Relajación: 1 gota en baño caliente"]),
    usoGeneral: "Usar en cantidades pequeñas por su aroma intenso. Puede causar cefalea en exceso. Evitar en hipotensión.",
    mensajeConsulta: "El ylang ylang requiere un uso preciso para obtener sus beneficios sin efectos adversos. Cristina te guiará en su aplicación.",
    tags: JSON.stringify(["ansiedad", "relajante", "emocional", "cardiovascular"]),
    destacado: 0,
    sortOrder: 12,
  },
  {
    name: "Orégano",
    slug: "oregano",
    category: "aceites-esenciales",
    tipoProducto: "aceite",
    descripcion: "El aceite de orégano es uno de los antimicrobianos naturales más potentes conocidos. Su uso requiere conocimiento y precisión, pero sus resultados en infecciones son notables.",
    beneficios: JSON.stringify(["Potente antimicrobiano de amplio espectro", "Apoya el sistema inmune en infecciones activas", "Acción antifúngica y antiparasitaria"]),
    indicaciones: JSON.stringify(["Siempre diluido: máximo 1% en aceite portador", "Nunca aplicar puro en piel", "Uso interno solo bajo supervisión profesional"]),
    usoGeneral: "Aceite cáustico: NUNCA usar sin diluir. Requiere supervisión profesional para uso interno. Evitar en embarazo y niños.",
    mensajeConsulta: "El orégano es un aceite de uso avanzado. Es imprescindible la orientación de Cristina antes de utilizarlo.",
    tags: JSON.stringify(["infecciones", "antimicrobiano", "inmunidad", "avanzado"]),
    destacado: 0,
    sortOrder: 13,
  },
  {
    name: "Tea Tree (Melaleuca)",
    slug: "tea-tree-melaleuca",
    category: "aceites-esenciales",
    tipoProducto: "aceite",
    descripcion: "El tea tree o melaleuca es el aceite antiséptico por excelencia. Versátil, seguro y eficaz, es ideal para el cuidado de la piel, infecciones leves y purificación del hogar.",
    beneficios: JSON.stringify(["Antiséptico natural para heridas y cortes leves", "Cuida la piel con tendencia acneica", "Purifica superficies y ambientes del hogar"]),
    indicaciones: JSON.stringify(["Piel: 1-2 gotas diluidas al 2% en aceite portador", "Limpieza: 10 gotas en spray con agua para superficies", "Difusión: 3-4 gotas para purificar el ambiente"]),
    usoGeneral: "Diluir para uso en piel. Seguro para adultos y niños mayores de 2 años con dilución adecuada.",
    mensajeConsulta: "El tea tree tiene múltiples aplicaciones domésticas y terapéuticas. Cristina puede ayudarte a sacarle el máximo partido.",
    tags: JSON.stringify(["piel", "antiséptico", "acné", "hogar"]),
    destacado: 0,
    sortOrder: 14,
  },
  {
    name: "Peppermint (Menta Fuerte)",
    slug: "peppermint",
    category: "aceites-esenciales",
    tipoProducto: "aceite",
    descripcion: "El peppermint es la versión más concentrada y potente de la menta. Ideal para dolores de cabeza, energía mental y apoyo digestivo, requiere un uso preciso y consciente.",
    beneficios: JSON.stringify(["Alivia cefaleas y migrañas de forma rápida", "Estimula la energía y la claridad mental", "Apoya la digestión y alivia náuseas"]),
    indicaciones: JSON.stringify(["Cefalea: 1 gota diluida en sienes y nuca", "Energía: 1 gota en palmas, inhalar profundamente", "Digestivo: 1 gota diluida en aceite portador, masaje abdominal"]),
    usoGeneral: "Muy potente: usar en pequeñas cantidades. No usar en niños menores de 6 años. Evitar cerca de ojos.",
    mensajeConsulta: "El peppermint es muy potente y requiere un uso preciso. Cristina te guiará para obtener sus beneficios de forma segura.",
    tags: JSON.stringify(["digestivo", "energía", "cefalea", "concentración"]),
    destacado: 0,
    sortOrder: 15,
  },
  {
    name: "Frankincense (Olíbano)",
    slug: "frankincense-olibano",
    category: "aceites-esenciales",
    tipoProducto: "aceite",
    descripcion: "El frankincense u olíbano es considerado el 'rey de los aceites esenciales'. Sus propiedades antiinflamatorias, inmunomoduladoras y de apoyo emocional son excepcionales.",
    beneficios: JSON.stringify(["Potente antiinflamatorio y regenerador celular", "Profundo apoyo emocional y espiritual", "Apoya el sistema inmune y la salud cerebral"]),
    indicaciones: JSON.stringify(["Meditación: 1-2 gotas en difusor", "Antiedad: diluido al 2% en sérum facial", "Emocional: 1 gota en plexo solar o coronilla"]),
    usoGeneral: "Uno de los aceites más seguros y versátiles. Apto para adultos y niños mayores de 6 años.",
    mensajeConsulta: "El frankincense es un aceite con múltiples dimensiones terapéuticas. Cristina puede ayudarte a integrarlo en tu bienestar.",
    tags: JSON.stringify(["emocional", "antiinflamatorio", "antiedad", "meditación"]),
    destacado: 1,
    sortOrder: 16,
  },

  // ─── MEZCLAS TERAPÉUTICAS ─────────────────────────────────────────────────
  {
    name: "Deep Blue — Mezcla para el Dolor",
    slug: "deep-blue-mezcla-dolor",
    category: "mezclas-terapeuticas",
    tipoProducto: "mezcla",
    descripcion: "Deep Blue es una mezcla terapéutica formulada específicamente para el alivio del dolor muscular y articular. Combina aceites con propiedades analgésicas, antiinflamatorias y refrescantes.",
    beneficios: JSON.stringify(["Alivia el dolor muscular y articular de forma rápida", "Reduce la inflamación local de forma natural", "Efecto refrescante y analgésico duradero"]),
    indicaciones: JSON.stringify(["Aplicar diluida al 3-5% en la zona afectada", "Masaje: 3-5 gotas en aceite portador para masaje terapéutico", "Aguda: aplicar cada 2-4 horas en dolor intenso"]),
    usoGeneral: "Uso exclusivamente tópico. Diluir siempre. No aplicar en heridas abiertas. Evitar en embarazo.",
    mensajeConsulta: "Para dolores crónicos o recurrentes, Cristina puede diseñar un protocolo completo de aromaterapia terapéutica.",
    tags: JSON.stringify(["dolor", "muscular", "articular", "antiinflamatorio"]),
    destacado: 1,
    sortOrder: 1,
  },
  {
    name: "On Guard — Escudo Inmune",
    slug: "on-guard-escudo-inmune",
    category: "mezclas-terapeuticas",
    tipoProducto: "mezcla",
    descripcion: "On Guard es una mezcla de aceites esenciales con potente acción antimicrobiana y de refuerzo inmunológico. Ideal para la temporada de resfriados y como protección preventiva.",
    beneficios: JSON.stringify(["Refuerza el sistema inmune de forma natural", "Acción antimicrobiana y antiviral de amplio espectro", "Purifica el ambiente en espacios cerrados"]),
    indicaciones: JSON.stringify(["Difusión: 4-6 gotas para purificar ambientes", "Preventivo: diluido al 2% en plantas de los pies", "Limpieza: 10-15 gotas en spray para superficies"]),
    usoGeneral: "Diluir para uso tópico. Contiene aceites picantes: evitar en piel sensible sin dilución adecuada.",
    mensajeConsulta: "Para un protocolo preventivo completo durante la temporada de gripes, consulta con Cristina.",
    tags: JSON.stringify(["sistema inmune", "antiviral", "preventivo", "gripe"]),
    destacado: 1,
    sortOrder: 2,
  },
  {
    name: "Zendgest — Apoyo Digestivo",
    slug: "zendgest-apoyo-digestivo",
    category: "mezclas-terapeuticas",
    tipoProducto: "mezcla",
    descripcion: "Zendgest es una mezcla terapéutica formulada para apoyar la digestión saludable. Combina aceites con propiedades carminativas, antiespasmódicas y digestivas.",
    beneficios: JSON.stringify(["Alivia la hinchazón y los gases intestinales", "Reduce los espasmos y cólicos digestivos", "Apoya una digestión saludable y eficiente"]),
    indicaciones: JSON.stringify(["Masaje abdominal: diluida al 2% en aceite portador", "Antes de comer: 1-2 gotas en abdomen para preparar la digestión", "Agudo: aplicar en sentido horario sobre el abdomen"]),
    usoGeneral: "Uso tópico. Diluir siempre. Evitar en embarazo y niños menores de 6 años.",
    mensajeConsulta: "Para problemas digestivos crónicos, Cristina puede diseñar un protocolo personalizado con aceites esenciales.",
    tags: JSON.stringify(["digestivo", "hinchazón", "gases", "cólicos"]),
    destacado: 0,
    sortOrder: 3,
  },
  {
    name: "Balance — Equilibrio Emocional",
    slug: "balance-equilibrio-emocional",
    category: "mezclas-terapeuticas",
    tipoProducto: "mezcla",
    descripcion: "Balance es una mezcla de aceites maderosos y florales que actúa como ancla emocional. Ideal para momentos de estrés, ansiedad o desequilibrio emocional.",
    beneficios: JSON.stringify(["Ancla emocionalmente en momentos de estrés", "Reduce la ansiedad y promueve la calma interior", "Favorece la conexión mente-cuerpo"]),
    indicaciones: JSON.stringify(["Muñecas: 1-2 gotas para inhalar en momentos de estrés", "Difusión: 3-4 gotas para crear ambiente de calma", "Meditación: 1 gota en palmas antes de meditar"]),
    usoGeneral: "Seguro para adultos y niños mayores de 6 años. Apto para uso diario.",
    mensajeConsulta: "Para trabajar el equilibrio emocional de forma integral, Cristina puede guiarte en el uso de Balance junto a otras herramientas.",
    tags: JSON.stringify(["emocional", "ansiedad", "estrés", "equilibrio", "meditación"]),
    destacado: 1,
    sortOrder: 4,
  },
  {
    name: "Air — Respiración Libre",
    slug: "air-respiracion-libre",
    category: "mezclas-terapeuticas",
    tipoProducto: "mezcla",
    descripcion: "Air es una mezcla terapéutica formulada para apoyar la salud respiratoria. Combina aceites con propiedades expectorantes, broncodilatadoras y descongestionantes.",
    beneficios: JSON.stringify(["Despeja las vías respiratorias de forma natural", "Apoya la función pulmonar y bronquial", "Alivia la congestión nasal y sinusal"]),
    indicaciones: JSON.stringify(["Difusión: 4-6 gotas en difusor durante 30-60 min", "Tópico: diluida al 2% en pecho y espalda", "Inhalación: 2-3 gotas en agua caliente, inhalar vapor"]),
    usoGeneral: "Diluir para uso tópico. Evitar en niños menores de 3 años.",
    mensajeConsulta: "Para problemas respiratorios recurrentes, Cristina puede diseñar un protocolo completo de aromaterapia respiratoria.",
    tags: JSON.stringify(["respiratorio", "congestión", "bronquios", "sinusitis"]),
    destacado: 0,
    sortOrder: 5,
  },
  {
    name: "Serenity — Sueño Reparador",
    slug: "serenity-sueno-reparador",
    category: "mezclas-terapeuticas",
    tipoProducto: "mezcla",
    descripcion: "Serenity es una mezcla de aceites florales y herbáceos formulada para favorecer un sueño profundo y reparador. Calma el sistema nervioso y prepara el cuerpo para el descanso.",
    beneficios: JSON.stringify(["Favorece la conciliación del sueño de forma natural", "Calma el sistema nervioso antes de dormir", "Mejora la calidad y profundidad del sueño"]),
    indicaciones: JSON.stringify(["Difusión: 4-6 gotas 30 min antes de dormir", "Tópico: diluida al 2% en plantas de los pies", "Almohada: 1-2 gotas en la almohada"]),
    usoGeneral: "Seguro para adultos y niños mayores de 3 años. Ideal para uso nocturno regular.",
    mensajeConsulta: "Para problemas de insomnio o sueño no reparador, Cristina puede diseñar un protocolo personalizado.",
    tags: JSON.stringify(["sueño", "insomnio", "relajante", "nocturno"]),
    destacado: 1,
    sortOrder: 6,
  },

  // ─── BASES Y DILUCIÓN ─────────────────────────────────────────────────────
  {
    name: "Aceite de Coco Fraccionado",
    slug: "aceite-coco-fraccionado",
    category: "bases-y-dilucion",
    tipoProducto: "base",
    descripcion: "El aceite de coco fraccionado es el aceite portador más versátil y popular de la aromaterapia. Líquido a temperatura ambiente, absorción rápida y sin olor, es ideal para diluir cualquier aceite esencial.",
    beneficios: JSON.stringify(["Diluyente ideal para todos los aceites esenciales", "Absorción rápida sin dejar residuo graso", "Hidrata y nutre la piel de forma natural"]),
    indicaciones: JSON.stringify(["Dilución estándar: 2-3% de aceite esencial en aceite de coco", "Masaje: mezclar directamente en palmas antes de aplicar", "Facial: 1-2 gotas como base para sérum"]),
    usoGeneral: "Seguro para todos los tipos de piel. Apto para bebés y niños. Conservar en lugar fresco.",
    mensajeConsulta: "Cristina puede enseñarte a crear tus propias mezclas personalizadas con aceite de coco como base.",
    tags: JSON.stringify(["base", "dilución", "portador", "masaje"]),
    destacado: 0,
    sortOrder: 1,
  },

  // ─── PACKS Y GUÍAS ────────────────────────────────────────────────────────
  {
    name: "Guía Digital de Aceites Esenciales",
    slug: "guia-digital-aceites-esenciales",
    category: "packs-y-guias",
    tipoProducto: "pack",
    descripcion: "Guía práctica y completa para iniciarte en el mundo de los aceites esenciales con seguridad y eficacia. Incluye protocolos básicos, diluciones, combinaciones y fichas de los aceites más importantes.",
    beneficios: JSON.stringify(["Aprende a usar los aceites esenciales con seguridad", "Protocolos prácticos para las situaciones más comunes", "Fichas detalladas de los 20 aceites más importantes"]),
    indicaciones: JSON.stringify(["Consultar antes de comenzar cualquier protocolo", "Referencia rápida para diluciones y combinaciones", "Guía de seguridad para uso en niños y embarazo"]),
    usoGeneral: "Recurso educativo complementario. No sustituye la consulta profesional.",
    mensajeConsulta: "La guía es un excelente punto de partida. Para una aplicación personalizada a tu situación, consulta con Cristina.",
    tags: JSON.stringify(["guía", "educativo", "principiantes", "protocolos"]),
    destacado: 1,
    sortOrder: 1,
  },

  // ─── ACCESORIOS ───────────────────────────────────────────────────────────
  {
    name: "Difusor Petal 2.0",
    slug: "difusor-petal-2",
    category: "accesorios",
    tipoProducto: "accesorio",
    descripcion: "El difusor Petal 2.0 es un difusor ultrasónico de diseño elegante y silencioso. Ideal para uso doméstico, crea una niebla fina que dispersa los aceites esenciales sin alterar sus propiedades.",
    beneficios: JSON.stringify(["Difusión ultrasónica que preserva las propiedades de los aceites", "Diseño elegante y silencioso para cualquier espacio", "Temporizador y ajuste de intensidad"]),
    indicaciones: JSON.stringify(["Llenar con agua hasta la línea indicada", "Añadir 4-8 gotas de aceite esencial", "Usar en ciclos de 30-60 min con descansos"]),
    usoGeneral: "Limpiar regularmente para evitar residuos. No usar aceites cítricos en exceso para preservar el depósito.",
    mensajeConsulta: "Cristina puede recomendarte las mejores combinaciones de aceites para tu difusor según tus necesidades.",
    tags: JSON.stringify(["difusor", "ultrasónico", "hogar", "aromaterapia"]),
    destacado: 0,
    sortOrder: 1,
  },
  {
    name: "Humidificador Aromaterapia",
    slug: "humidificador-aromaterapia",
    category: "accesorios",
    tipoProducto: "accesorio",
    descripcion: "Humidificador de gran capacidad con función de aromaterapia integrada. Ideal para habitaciones grandes, mantiene la humedad óptima mientras difunde los aceites esenciales.",
    beneficios: JSON.stringify(["Humidifica y aromatiza simultáneamente", "Gran capacidad para habitaciones amplias", "Función de luz nocturna y temporizador"]),
    indicaciones: JSON.stringify(["Llenar con agua destilada o filtrada", "Añadir 5-10 gotas en el compartimento de aceites", "Limpiar semanalmente para evitar bacterias"]),
    usoGeneral: "Usar solo agua destilada o filtrada. Limpiar regularmente. No añadir aceites directamente al depósito de agua.",
    mensajeConsulta: "Consulta con Cristina qué aceites son más adecuados para usar en tu humidificador según la temporada y tus necesidades.",
    tags: JSON.stringify(["humidificador", "aromaterapia", "hogar", "habitación"]),
    destacado: 0,
    sortOrder: 2,
  },
  {
    name: "Botellas Roll-On de Cristal",
    slug: "botellas-roll-on-cristal",
    category: "accesorios",
    tipoProducto: "accesorio",
    descripcion: "Set de botellas roll-on de cristal ámbar para crear tus propias mezclas personalizadas de aceites esenciales. El cristal ámbar protege los aceites de la luz UV.",
    beneficios: JSON.stringify(["Cristal ámbar que protege los aceites de la luz", "Aplicación precisa y cómoda en muñecas y sienes", "Perfectas para llevar tus mezclas a cualquier lugar"]),
    indicaciones: JSON.stringify(["Llenar con aceite portador (coco fraccionado)", "Añadir 10-15 gotas de aceite esencial por 10ml", "Etiquetar con el contenido y la fecha"]),
    usoGeneral: "Lavar antes del primer uso. Conservar alejadas del calor y la luz directa.",
    mensajeConsulta: "Cristina puede ayudarte a crear mezclas personalizadas en roll-on para tus necesidades específicas.",
    tags: JSON.stringify(["roll-on", "accesorios", "mezclas", "portátil"]),
    destacado: 0,
    sortOrder: 3,
  },
];

console.log("\n🌿 Insertando productos...");

for (const product of products) {
  const [existing] = await db.execute("SELECT id FROM oil_products WHERE slug = ?", [product.slug]);
  if (existing.length > 0) {
    console.log(`  ↳ Producto ya existe: ${product.name}`);
    continue;
  }
  await db.execute(
    `INSERT INTO oil_products 
     (name, slug, category, tipoProducto, descripcion, beneficios, indicaciones, usoGeneral, mensajeConsulta, tags, destacado, sortOrder, visibleEnPublico, status) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'active')`,
    [
      product.name,
      product.slug,
      product.category,
      product.tipoProducto,
      product.descripcion,
      product.beneficios,
      product.indicaciones,
      product.usoGeneral,
      product.mensajeConsulta,
      product.tags,
      product.destacado,
      product.sortOrder,
    ]
  );
  console.log(`  ✓ Producto creado: ${product.name}`);
}

await db.end();
console.log("\n✅ Seed completado: 5 categorías y 27 productos de aceites esenciales.");
