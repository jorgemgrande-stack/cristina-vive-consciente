/**
 * seed-water-products.mjs
 * Carga inicial de categorías y 3 productos de sistemas de agua
 * Ejecutar: node scripts/seed-water-products.mjs
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// ─── CATEGORÍAS ───────────────────────────────────────────────────────────────

const categories = [
  {
    name: "Ósmosis inversa",
    slug: "osmosis-inversa",
    shortDescription: "Sistemas de purificación de alta eficiencia que eliminan hasta el 99% de contaminantes del agua.",
    icon: "💧",
    sortOrder: 1,
    visibleEnPublico: 1,
    status: "active",
  },
  {
    name: "Descalcificadores",
    slug: "descalcificadores",
    shortDescription: "Eliminan la cal y los metales pesados del agua de toda la vivienda, protegiendo tuberías y electrodomésticos.",
    icon: "🌊",
    sortOrder: 2,
    visibleEnPublico: 1,
    status: "active",
  },
  {
    name: "Sistemas premium",
    slug: "sistemas-premium",
    shortDescription: "La gama más completa y avanzada para hogares que exigen la máxima calidad del agua.",
    icon: "⭐",
    sortOrder: 3,
    visibleEnPublico: 1,
    status: "active",
  },
  {
    name: "Sistemas compactos",
    slug: "sistemas-compactos",
    shortDescription: "Soluciones de bajo perfil ideales para cocinas pequeñas o bajo el fregadero.",
    icon: "🏠",
    sortOrder: 4,
    visibleEnPublico: 1,
    status: "active",
  },
];

// ─── PRODUCTOS ────────────────────────────────────────────────────────────────

const products = [
  // ── 1. AWAES DIRECT PREMIUM ──────────────────────────────────────────────────
  {
    title: "Awaes Direct Premium",
    slug: "awaes-direct-premium",
    subtitle: "Agua pura directa del grifo, sin depósito, con remineralización e ionización",
    categorySlug: "osmosis-inversa",
    shortDescription:
      "El sistema de ósmosis inversa más avanzado del mercado doméstico. Sin depósito, agua siempre fresca, con membrana de 1200 GPD, remineralización activa e ionización antioxidante. Mantenimiento sencillo que puede realizar el propio usuario.",
    longDescription:
      "El Awaes Direct Premium es la evolución natural de los sistemas de ósmosis doméstica. Su diseño sin depósito garantiza que el agua que bebes es siempre fresca, nunca estancada. La membrana de alto rendimiento de 1200 GPD elimina hasta el 99% de los contaminantes presentes en el agua del grifo: cloro, nitratos, metales pesados, microplásticos y más de 200 sustancias nocivas.\n\nEl sistema integra un regulador de pH y un remineralizador que devuelven al agua los minerales esenciales en las proporciones ideales para la salud. El ionizador y el módulo antioxidante completan una experiencia de agua que va mucho más allá de la simple filtración.\n\nEl display TDS incorporado te permite conocer en tiempo real la calidad del agua que estás bebiendo. El sistema de flushing automático mantiene la membrana limpia y prolonga su vida útil. Los avisos inteligentes te informan cuando es el momento de cambiar filtros o si se detecta alguna anomalía.\n\nEl grifo de acero inoxidable 304, libre de plomo, completa un sistema pensado para durar décadas con un mantenimiento mínimo que puede realizar el propio usuario sin necesidad de técnico.",
    claimsHighlighted: JSON.stringify([
      "Membrana de ósmosis de 1200 GPD — alta producción sin esperas",
      "Sin depósito: agua siempre fresca, nunca estancada",
      "Remineralización activa + ionización antioxidante",
      "Display TDS para monitorizar la calidad del agua en tiempo real",
      "Flushing automático y avisos inteligentes de mantenimiento",
      "Grifo de acero inoxidable 304, libre de plomo",
      "Mantenimiento sencillo: lo realiza el propio usuario",
    ]),
    benefits: JSON.stringify([
      "Elimina hasta el 99% de contaminantes: cloro, nitratos, metales pesados, microplásticos",
      "Agua con pH equilibrado y mineralización óptima para la salud",
      "Propiedades antioxidantes que contribuyen al bienestar celular",
      "Ahorro significativo frente al agua embotellada",
      "Reducción del plástico de un solo uso en tu hogar",
      "Instalación bajo el fregadero, sin ocupar espacio en encimera",
    ]),
    forWhom:
      "Ideal para familias que quieren la máxima calidad del agua para beber y cocinar. Especialmente recomendado para personas con sensibilidad al cloro, familias con niños pequeños, personas que siguen una alimentación consciente y hogares que desean reducir el consumo de plástico.",
    priceVisible: "1.995,00 €",
    priceOrientative: "Precio orientativo. Consulta disponibilidad y condiciones de instalación.",
    badge: "Premium",
    badgeColor: "#3A5A3A",
    technicalSpecs: JSON.stringify([
      { key: "Tipo de sistema", value: "Ósmosis inversa directa sin depósito" },
      { key: "Capacidad de membrana", value: "1200 GPD" },
      { key: "Etapas de filtración", value: "6 etapas" },
      { key: "Etapas incluidas", value: "Sedimentos, carbón activado, membrana OI, regulador pH, remineralizador, ionizador" },
      { key: "Display", value: "TDS en tiempo real" },
      { key: "Flushing", value: "Automático" },
      { key: "Avisos", value: "Averías y cambio de filtros" },
      { key: "Grifo", value: "Acero inoxidable 304, libre de plomo" },
      { key: "Mantenimiento", value: "Realizable por el usuario" },
      { key: "Depósito", value: "Sin depósito" },
    ]),
    installationText:
      "Instalación profesional incluida en el precio. El sistema se instala bajo el fregadero de cocina. El proceso completo dura aproximadamente 2 horas. Cristina te acompaña en la puesta en marcha y te explica el mantenimiento.",
    maintenanceText:
      "Mantenimiento anual sencillo que puede realizar el propio usuario: cambio de filtros de sedimentos y carbón activado (cada 6-12 meses según calidad del agua) y membrana (cada 2-3 años). El sistema avisa automáticamente cuando es necesario actuar.",
    warrantyText:
      "2 años de garantía oficial del fabricante. Asistencia técnica y servicio posventa a través de Cristina Vive Consciente.",
    bulletAdvantages: JSON.stringify([
      "Sin depósito: agua siempre fresca y sin riesgo de bacterias",
      "Membrana de 1200 GPD: alta producción, sin esperas",
      "Remineralización e ionización: agua viva y antioxidante",
      "Display TDS: control total de la calidad del agua",
      "Mantenimiento DIY: sin necesidad de técnico para los filtros",
      "Grifo premium de acero inoxidable libre de plomo",
    ]),
    whyChooseBlock:
      "El Awaes Direct Premium no es un filtro de agua convencional. Es un sistema de transformación del agua diseñado para quienes entienden que lo que bebemos cada día tiene un impacto directo en nuestra salud. Su tecnología de membrana de 1200 GPD, combinada con la remineralización activa y la ionización antioxidante, ofrece una calidad de agua que ningún sistema con depósito puede igualar.",
    expertBlock:
      "Cristina Battistelli analiza personalmente las características del agua de tu zona y las necesidades de tu hogar antes de recomendarte este sistema. La instalación incluye una sesión de orientación sobre hidratación consciente y uso óptimo del sistema.",
    faqBlock: JSON.stringify([
      {
        q: "¿Por qué es mejor sin depósito?",
        a: "Los sistemas con depósito almacenan el agua filtrada, lo que puede favorecer la proliferación de bacterias y hace que el agua pierda frescura. El Awaes Direct Premium produce el agua en el momento en que la necesitas, garantizando siempre la máxima frescura y calidad.",
      },
      {
        q: "¿Cuánto tarda en producir agua?",
        a: "Gracias a su membrana de 1200 GPD, el caudal es prácticamente instantáneo. No tendrás que esperar a que se llene ningún depósito.",
      },
      {
        q: "¿Puedo instalar el sistema yo mismo?",
        a: "La instalación inicial la realiza un técnico profesional. El mantenimiento posterior (cambio de filtros) está diseñado para que lo realice el propio usuario sin herramientas especiales.",
      },
      {
        q: "¿Qué elimina exactamente?",
        a: "La membrana de ósmosis inversa elimina hasta el 99% de los contaminantes: cloro y sus subproductos, nitratos, nitritos, metales pesados (plomo, mercurio, arsénico), microplásticos, bacterias, virus y más de 200 sustancias nocivas.",
      },
    ]),
    trustBlock:
      "Cristina Battistelli lleva años estudiando y recomendando sistemas de purificación de agua. El Awaes Direct Premium es el sistema que ella misma utiliza en su hogar y recomienda a sus clientes más exigentes. Cada instalación va acompañada de orientación personalizada.",
    ctaPrimaryLabel: "Reservar sistema",
    ctaSecondaryLabel: "Conocer más detalles",
    seoTitle: "Awaes Direct Premium — Sistema de ósmosis inversa sin depósito | Cristina Vive Consciente",
    seoDescription:
      "El sistema de ósmosis inversa más avanzado del mercado doméstico. Sin depósito, membrana 1200 GPD, remineralización e ionización antioxidante. Instalación incluida.",
    sortOrder: 1,
    visibleEnPublico: 1,
    destacadoEnHome: 1,
    productoPrincipal: 1,
    status: "active",
  },

  // ── 2. ÓPTIMA COMPACT ────────────────────────────────────────────────────────
  {
    title: "Óptima Compact",
    slug: "optima-compact",
    subtitle: "Descalcificador inteligente con control WiFi que también elimina el cloro",
    categorySlug: "descalcificadores",
    shortDescription:
      "Descalcificador compacto de última generación que no solo elimina la cal, sino también el cloro, los metales pesados y el ácido sulfhídrico. Control total desde el smartphone con válvula WiFi y regeneración inteligente.",
    longDescription:
      "El Óptima Compact redefine lo que puede hacer un descalcificador doméstico. Más allá de eliminar la dureza del agua y proteger tus tuberías y electrodomésticos, este sistema actúa sobre el cloro, los metales pesados, el hierro y el ácido sulfhídrico, ofreciendo un agua de calidad superior en todos los puntos de consumo de tu hogar.\n\nSu válvula WiFi te permite controlar y monitorizar el sistema desde tu smartphone: consulta el estado del equipo, programa regeneraciones, recibe alertas y ajusta los parámetros desde cualquier lugar. La regeneración inteligente optimiza el consumo de sal y agua, reduciendo el impacto ambiental y el coste de mantenimiento.\n\nEl aviso acústico por falta de sal te garantiza que nunca te quedarás sin protección. La pantalla LCD y el teclado táctil hacen que la configuración sea intuitiva y sencilla. El detector de fugas y la barrera automática ante fugas protegen tu hogar ante cualquier incidencia.\n\nLa válvula cerámica, de larga durabilidad, y el sistema de regeneración con agua ya descalcificada completan un equipo diseñado para ofrecer el máximo rendimiento con el mínimo mantenimiento.",
    claimsHighlighted: JSON.stringify([
      "Elimina cal, cloro, metales pesados, hierro y ácido sulfhídrico",
      "Control total desde smartphone con válvula WiFi",
      "Regeneración inteligente: ahorra sal y agua",
      "Detector de fugas + barrera automática de protección",
      "Aviso acústico por falta de sal",
      "Válvula cerámica de alta durabilidad",
    ]),
    benefits: JSON.stringify([
      "Protege tuberías, calderas y electrodomésticos de la cal",
      "Agua más suave en ducha y baño: piel e cabello notarán la diferencia",
      "Elimina el cloro y mejora el sabor del agua de toda la casa",
      "Ahorro en detergentes y productos de limpieza",
      "Control y monitorización remota desde el móvil",
      "Regeneración eficiente que reduce el consumo de sal",
    ]),
    forWhom:
      "Ideal para hogares con agua muy calcárea que quieren proteger sus instalaciones y mejorar la calidad del agua en todos los puntos de consumo. Especialmente recomendado para casas con caldera, piscina o jacuzzi, y para personas con piel sensible o problemas capilares relacionados con el agua dura.",
    priceVisible: "2.050,00 €",
    priceOrientative: "Precio orientativo. Consulta disponibilidad y condiciones de instalación.",
    badge: "Más vendido",
    badgeColor: "#5A6A3A",
    technicalSpecs: JSON.stringify([
      { key: "Tipo de sistema", value: "Descalcificador + filtración de cloro y metales" },
      { key: "Conectividad", value: "WiFi — control por smartphone" },
      { key: "Regeneración", value: "Inteligente, optimizada" },
      { key: "Pantalla", value: "LCD con teclado táctil" },
      { key: "Avisos", value: "Acústico por falta de sal" },
      { key: "Seguridad", value: "Detector de fugas + barrera automática" },
      { key: "Válvula", value: "Cerámica de alta durabilidad" },
      { key: "Regeneración con", value: "Agua ya descalcificada" },
      { key: "Contaminantes eliminados", value: "Cal, cloro, metales pesados, hierro, ácido sulfhídrico" },
    ]),
    installationText:
      "Instalación profesional en la entrada general de agua de la vivienda. El proceso incluye la configuración del sistema WiFi y la puesta en marcha supervisada por técnico. Cristina te acompaña en la primera configuración desde el smartphone.",
    maintenanceText:
      "Mantenimiento sencillo: añadir sal de regeneración periódicamente (el sistema avisa cuando es necesario). Revisión anual recomendada. La regeneración inteligente optimiza automáticamente el consumo.",
    warrantyText:
      "2 años de garantía oficial. Soporte técnico y seguimiento personalizado a través de Cristina Vive Consciente.",
    bulletAdvantages: JSON.stringify([
      "Descalcificación + eliminación de cloro en un solo equipo",
      "WiFi: control total desde el móvil, en cualquier momento",
      "Regeneración inteligente: menos sal, menos agua, más eficiencia",
      "Detector de fugas con barrera automática: tranquilidad total",
      "Válvula cerámica: máxima durabilidad y fiabilidad",
      "Aviso acústico: nunca te quedarás sin sal sin saberlo",
    ]),
    whyChooseBlock:
      "El Óptima Compact es la solución ideal cuando quieres proteger toda tu instalación de agua y mejorar la calidad en todos los puntos de consumo, no solo en el grifo de cocina. Su capacidad para eliminar simultáneamente la cal, el cloro y otros contaminantes lo convierte en una solución integral que ningún descalcificador convencional puede ofrecer.",
    expertBlock:
      "Cristina evalúa la dureza del agua de tu zona y las características de tu hogar para determinar si el Óptima Compact es la solución más adecuada. La instalación incluye orientación sobre el mantenimiento y la configuración óptima del sistema para tu agua específica.",
    faqBlock: JSON.stringify([
      {
        q: "¿Un descalcificador también filtra el agua para beber?",
        a: "El Óptima Compact mejora significativamente la calidad del agua en todos los puntos de la vivienda, incluyendo el grifo de cocina. Sin embargo, para obtener agua de la máxima pureza para beber, puede combinarse con un sistema de ósmosis en el punto de consumo.",
      },
      {
        q: "¿Cuánta sal consume?",
        a: "La regeneración inteligente optimiza el consumo de sal según el uso real del agua. El sistema solo regenera cuando es necesario, reduciendo significativamente el consumo frente a los descalcificadores convencionales.",
      },
      {
        q: "¿Puedo controlar el sistema cuando estoy de vacaciones?",
        a: "Sí. La válvula WiFi te permite monitorizar y controlar el sistema desde cualquier lugar del mundo a través de tu smartphone.",
      },
      {
        q: "¿Qué pasa si se detecta una fuga?",
        a: "El detector de fugas activa automáticamente la barrera de protección, cortando el suministro de agua para evitar daños. Recibirás una notificación en tu smartphone.",
      },
    ]),
    trustBlock:
      "El Óptima Compact está fabricado con componentes de primera calidad y ha sido seleccionado por Cristina Battistelli tras evaluar decenas de sistemas del mercado. Su fiabilidad y las funciones de control inteligente lo hacen especialmente adecuado para hogares que valoran la tecnología al servicio del bienestar.",
    ctaPrimaryLabel: "Reservar sistema",
    ctaSecondaryLabel: "Conocer más detalles",
    seoTitle: "Óptima Compact — Descalcificador inteligente WiFi con eliminación de cloro | Cristina Vive Consciente",
    seoDescription:
      "Descalcificador compacto con control WiFi que elimina cal, cloro, metales pesados y ácido sulfhídrico. Regeneración inteligente, detector de fugas y barrera automática.",
    sortOrder: 2,
    visibleEnPublico: 1,
    destacadoEnHome: 1,
    productoPrincipal: 0,
    status: "active",
  },

  // ── 3. ÓPTIMA PLUS ───────────────────────────────────────────────────────────
  {
    title: "Óptima Plus",
    slug: "optima-plus",
    subtitle: "El descalcificador premium fabricado en España con la tecnología más avanzada",
    categorySlug: "descalcificadores",
    shortDescription:
      "La versión más completa y avanzada de la gama Óptima. Fabricado en España, con válvula WiFi, control inteligente, detector de fugas y la misma capacidad de eliminar cal, cloro y metales pesados que el Compact, pero con mayor potencia y prestaciones.",
    longDescription:
      "El Óptima Plus representa la cúspide de la tecnología en descalcificadores domésticos fabricados en España. Diseñado para hogares que no quieren compromisos en la calidad del agua, ofrece todas las prestaciones del Óptima Compact y las supera con una mayor capacidad de tratamiento y componentes de gama superior.\n\nAl igual que el Compact, el Óptima Plus no se limita a eliminar la cal: actúa sobre el cloro, los metales pesados, el hierro y el ácido sulfhídrico, garantizando un agua de calidad superior en todos los puntos de consumo de tu vivienda. La diferencia está en la potencia y en los detalles de fabricación.\n\nFabricado íntegramente en España, el Óptima Plus cumple con los más estrictos estándares de calidad europeos. Su válvula WiFi de última generación ofrece un control total desde el smartphone, con regeneración inteligente que se adapta al consumo real de tu hogar. El detector de fugas con barrera automática y la válvula cerámica de alta durabilidad garantizan años de funcionamiento sin incidencias.\n\nSi tu hogar tiene una instalación de agua exigente, una caldera de alta gama, una piscina o simplemente quieres lo mejor del mercado para proteger tu inversión y la salud de tu familia, el Óptima Plus es tu sistema.",
    claimsHighlighted: JSON.stringify([
      "Fabricado en España — máxima calidad y garantía europea",
      "Elimina cal, cloro, metales pesados, hierro y ácido sulfhídrico",
      "Control total desde smartphone con válvula WiFi de última generación",
      "Regeneración inteligente de alta eficiencia",
      "Detector de fugas + barrera automática de protección",
      "Válvula cerámica premium de larga durabilidad",
    ]),
    benefits: JSON.stringify([
      "Máxima protección para instalaciones, calderas y electrodomésticos de gama alta",
      "Agua suave y sin cloro en todos los puntos de la vivienda",
      "Mayor capacidad de tratamiento para hogares con alto consumo",
      "Control y monitorización remota con las funciones más avanzadas del mercado",
      "Fabricación española: calidad, servicio técnico y repuestos garantizados",
      "Regeneración eficiente que minimiza el consumo de sal y agua",
    ]),
    forWhom:
      "Ideal para hogares grandes, viviendas con instalaciones de alto valor (calderas de condensación, suelo radiante, piscinas, jacuzzis) y familias que quieren la máxima calidad del agua en todos los puntos de consumo. Recomendado especialmente para zonas con agua muy dura y para quienes valoran la fabricación nacional y el servicio técnico de proximidad.",
    priceVisible: "2.750,00 €",
    priceOrientative: "Precio orientativo. Consulta disponibilidad y condiciones de instalación.",
    badge: "Gama alta",
    badgeColor: "#8B6914",
    technicalSpecs: JSON.stringify([
      { key: "Tipo de sistema", value: "Descalcificador premium + filtración integral" },
      { key: "Fabricación", value: "España" },
      { key: "Conectividad", value: "WiFi — control por smartphone" },
      { key: "Regeneración", value: "Inteligente de alta eficiencia" },
      { key: "Seguridad", value: "Detector de fugas + barrera automática" },
      { key: "Válvula", value: "Cerámica premium de alta durabilidad" },
      { key: "Regeneración con", value: "Agua ya descalcificada" },
      { key: "Contaminantes eliminados", value: "Cal, cloro, metales pesados, hierro, ácido sulfhídrico" },
      { key: "Capacidad", value: "Mayor que Óptima Compact — para hogares con alto consumo" },
    ]),
    installationText:
      "Instalación profesional en la entrada general de agua de la vivienda. Incluye configuración WiFi, puesta en marcha y orientación personalizada por Cristina. Servicio técnico nacional disponible gracias a la fabricación española.",
    maintenanceText:
      "Mantenimiento sencillo con sal de regeneración. La regeneración inteligente optimiza automáticamente el consumo. Revisión anual recomendada. Repuestos y servicio técnico disponibles en toda España.",
    warrantyText:
      "2 años de garantía oficial del fabricante español. Repuestos disponibles en toda España. Soporte técnico y seguimiento personalizado a través de Cristina Vive Consciente.",
    bulletAdvantages: JSON.stringify([
      "Fabricado en España: calidad certificada y servicio técnico nacional",
      "Descalcificación + eliminación de cloro y metales en un solo equipo",
      "WiFi de última generación: control total desde el móvil",
      "Mayor capacidad para hogares con alto consumo",
      "Detector de fugas con barrera automática: protección total",
      "Válvula cerámica premium: máxima durabilidad garantizada",
    ]),
    whyChooseBlock:
      "El Óptima Plus es la elección natural para quienes quieren lo mejor del mercado sin renunciar a la garantía de fabricación nacional. Su mayor capacidad de tratamiento lo hace ideal para hogares grandes o con instalaciones de alto valor. La combinación de tecnología WiFi avanzada, fabricación española y la misma capacidad de eliminar múltiples contaminantes que el Compact lo convierten en una inversión a largo plazo.",
    expertBlock:
      "Cristina Battistelli evalúa personalmente la dureza del agua de tu zona, el tamaño de tu hogar y las características de tu instalación antes de recomendar el Óptima Plus. Este sistema está especialmente indicado para hogares donde el agua dura ha causado problemas en el pasado o donde la instalación requiere la máxima protección.",
    faqBlock: JSON.stringify([
      {
        q: "¿Qué diferencia hay entre el Óptima Compact y el Óptima Plus?",
        a: "El Óptima Plus tiene mayor capacidad de tratamiento, está fabricado en España con componentes de gama superior y ofrece las funciones WiFi más avanzadas del mercado. Es la elección ideal para hogares grandes o con instalaciones de alto valor.",
      },
      {
        q: "¿Por qué es importante que esté fabricado en España?",
        a: "La fabricación española garantiza el cumplimiento de los estándares europeos más exigentes, la disponibilidad de repuestos y un servicio técnico de proximidad. En caso de cualquier incidencia, la respuesta es más rápida y eficiente.",
      },
      {
        q: "¿Puedo combinar el Óptima Plus con un sistema de ósmosis?",
        a: "Sí, es una combinación muy habitual y recomendada. El Óptima Plus protege toda la instalación y mejora el agua en todos los puntos de la vivienda, mientras que un sistema de ósmosis en el punto de cocina proporciona agua de la máxima pureza para beber y cocinar.",
      },
      {
        q: "¿Cuánto tiempo dura la instalación?",
        a: "La instalación completa, incluyendo la configuración WiFi y la puesta en marcha, se realiza en una visita de aproximadamente 3 horas. Cristina te acompaña en la primera configuración desde el smartphone.",
      },
    ]),
    trustBlock:
      "El Óptima Plus ha sido seleccionado por Cristina Battistelli como la referencia de gama alta en descalcificadores domésticos. Su fabricación española, la calidad de sus componentes y las funciones de control inteligente lo hacen el sistema más completo y fiable del mercado para hogares exigentes.",
    ctaPrimaryLabel: "Reservar sistema",
    ctaSecondaryLabel: "Conocer más detalles",
    seoTitle: "Óptima Plus — Descalcificador premium fabricado en España con WiFi | Cristina Vive Consciente",
    seoDescription:
      "El descalcificador premium fabricado en España. Elimina cal, cloro y metales pesados con control WiFi, regeneración inteligente y detector de fugas. Para hogares exigentes.",
    sortOrder: 3,
    visibleEnPublico: 1,
    destacadoEnHome: 1,
    productoPrincipal: 0,
    status: "active",
  },
];

// ─── INSERCIÓN ────────────────────────────────────────────────────────────────

console.log("🌱 Iniciando seed de sistemas de agua...\n");

// Insertar categorías
console.log("📁 Insertando categorías...");
const categoryIds = {};

for (const cat of categories) {
  try {
    const [existing] = await connection.execute(
      "SELECT id FROM water_categories WHERE slug = ?",
      [cat.slug]
    );
    if (existing.length > 0) {
      console.log(`  ⏭  Categoría "${cat.name}" ya existe (id: ${existing[0].id})`);
      categoryIds[cat.slug] = existing[0].id;
      continue;
    }

    const [result] = await connection.execute(
      `INSERT INTO water_categories (name, slug, shortDescription, icon, sortOrder, visibleEnPublico, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [cat.name, cat.slug, cat.shortDescription, cat.icon, cat.sortOrder, cat.visibleEnPublico, cat.status]
    );
    categoryIds[cat.slug] = result.insertId;
    console.log(`  ✅ Categoría "${cat.name}" creada (id: ${result.insertId})`);
  } catch (err) {
    console.error(`  ❌ Error en categoría "${cat.name}":`, err.message);
  }
}

// Insertar productos
console.log("\n📦 Insertando productos...");

for (const product of products) {
  try {
    const [existing] = await connection.execute(
      "SELECT id FROM water_products WHERE slug = ?",
      [product.slug]
    );
    if (existing.length > 0) {
      console.log(`  ⏭  Producto "${product.title}" ya existe (id: ${existing[0].id})`);
      continue;
    }

    const categoryId = categoryIds[product.categorySlug] ?? null;
    const { categorySlug, ...productData } = product;

    const [result] = await connection.execute(
      `INSERT INTO water_products 
       (title, slug, subtitle, categoryId, shortDescription, longDescription,
        claimsHighlighted, benefits, forWhom, priceVisible, priceOrientative,
        badge, badgeColor, technicalSpecs, installationText, maintenanceText,
        warrantyText, bulletAdvantages, whyChooseBlock, expertBlock, faqBlock,
        trustBlock, ctaPrimaryLabel, ctaSecondaryLabel, seoTitle, seoDescription,
        sortOrder, visibleEnPublico, destacadoEnHome, productoPrincipal, status,
        createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        productData.title,
        productData.slug,
        productData.subtitle,
        categoryId,
        productData.shortDescription,
        productData.longDescription,
        productData.claimsHighlighted,
        productData.benefits,
        productData.forWhom,
        productData.priceVisible,
        productData.priceOrientative,
        productData.badge,
        productData.badgeColor,
        productData.technicalSpecs,
        productData.installationText,
        productData.maintenanceText,
        productData.warrantyText,
        productData.bulletAdvantages,
        productData.whyChooseBlock,
        productData.expertBlock,
        productData.faqBlock,
        productData.trustBlock,
        productData.ctaPrimaryLabel,
        productData.ctaSecondaryLabel,
        productData.seoTitle,
        productData.seoDescription,
        productData.sortOrder,
        productData.visibleEnPublico,
        productData.destacadoEnHome,
        productData.productoPrincipal,
        productData.status,
      ]
    );
    console.log(`  ✅ Producto "${productData.title}" creado (id: ${result.insertId})`);
  } catch (err) {
    console.error(`  ❌ Error en producto "${product.title}":`, err.message);
  }
}

await connection.end();
console.log("\n✨ Seed completado.");
