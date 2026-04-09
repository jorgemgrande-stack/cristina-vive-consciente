/**
 * Seed: Actualizar imágenes de aceites esenciales desde el sitio web
 * Mapea productos por nombre y asigna las URLs de imagen correctas
 */
import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config();

const db = await mysql.createConnection(process.env.DATABASE_URL);

// Mapeo directo: nombre en BD -> URL de imagen del sitio web
const imageMap = {
  // Guía digital
  "guía digital de aceites esenciales": "https://cristinaviveconsciente.es/cdn/shop/files/portada_e4e34078-0534-47f3-a6cb-e1e4abb56b36.jpg?v=1717019148",

  // Packs y accesorios
  "pack recovery bomb": "https://cristinaviveconsciente.es/cdn/shop/files/recoverybomb.jpg?v=1716670947",
  "trío difusor petal 2.0": "https://cristinaviveconsciente.es/cdn/shop/files/difusor.jpg?v=1716334446",
  "veggie caps - 160 cápsulas": "https://cristinaviveconsciente.es/cdn/shop/files/veggiecaps.png?v=1716671446",
  "veggie caps": "https://cristinaviveconsciente.es/cdn/shop/files/veggiecaps.png?v=1716671446",
  "aceite de coco fraccionado": "https://cristinaviveconsciente.es/cdn/shop/files/cocunutoil.png?v=1716671832",
  "dispensador de aceite de coco fraccionado": "https://cristinaviveconsciente.es/cdn/shop/files/dispensador.png?v=1716672512",

  // Aceites individuales (matching por nombre, case-insensitive)
  "lavanda": "https://cristinaviveconsciente.es/cdn/shop/files/lavanda.png?v=1716323493",
  "deep blue": "https://cristinaviveconsciente.es/cdn/shop/files/deepblue.png?v=1716325131",
  "frankincense": "https://cristinaviveconsciente.es/cdn/shop/files/franinciense.png?v=1716325767",
  "incienso": "https://cristinaviveconsciente.es/cdn/shop/files/franinciense.png?v=1716325767",
  "boswellia": "https://cristinaviveconsciente.es/cdn/shop/files/franinciense.png?v=1716325767",
  "serenity": "https://cristinaviveconsciente.es/cdn/shop/files/serenity.png?v=1716326366",
  "ylang ylang": "https://cristinaviveconsciente.es/cdn/shop/files/ylang.png?v=1716327734",
  "onguard": "https://cristinaviveconsciente.es/cdn/shop/files/onguard.png?v=1716328127",
  "guard": "https://cristinaviveconsciente.es/cdn/shop/files/onguard.png?v=1716328127",
  "zengest": "https://cristinaviveconsciente.es/cdn/shop/files/zengest.png?v=1716669149",
  "zendgest": "https://cristinaviveconsciente.es/cdn/shop/files/zengest.png?v=1716669149",
  "oregano": "https://cristinaviveconsciente.es/cdn/shop/files/oregano.png?v=1716328848",
  "orégano": "https://cristinaviveconsciente.es/cdn/shop/files/oregano.png?v=1716328848",
  "balance": "https://cristinaviveconsciente.es/cdn/shop/files/balance.png?v=1716329525",
  "tea tree": "https://cristinaviveconsciente.es/cdn/shop/files/teatree.png?v=1716329928",
  "árbol del té": "https://cristinaviveconsciente.es/cdn/shop/files/teatree.png?v=1716329928",
  "melaleuca": "https://cristinaviveconsciente.es/cdn/shop/files/teatree.png?v=1716329928",
  "peppermint": "https://cristinaviveconsciente.es/cdn/shop/files/peepermint.png?v=1716330347",
  "menta piperita": "https://cristinaviveconsciente.es/cdn/shop/files/peepermint.png?v=1716330347",
  "menta fuerte": "https://cristinaviveconsciente.es/cdn/shop/files/peepermint.png?v=1716330347",
  "limón": "https://cristinaviveconsciente.es/cdn/shop/files/lemmon.jpg?v=1716331168",
  "limon": "https://cristinaviveconsciente.es/cdn/shop/files/lemmon.jpg?v=1716331168",
  "air": "https://cristinaviveconsciente.es/cdn/shop/files/air.png?v=1716674025",
};

// Función para encontrar la imagen por nombre (busca una coincidencia parcial)
function findImageUrl(productName) {
  const nameLower = productName.toLowerCase();

  // Búsqueda exacta primero
  for (const [key, url] of Object.entries(imageMap)) {
    if (nameLower.includes(key.toLowerCase()) || key.toLowerCase().includes(nameLower)) {
      return url;
    }
  }

  // Si no encuentra, intenta buscar palabras clave
  return null;
}

// Obtener todos los productos actuales
const [products] = await db.execute("SELECT id, name, imagen FROM oil_products");

console.log(`📦 Encontrados ${products.length} productos de aceites\n`);

let updated = 0;
let skipped = 0;

for (const product of products) {
  const imageUrl = findImageUrl(product.name);

  if (imageUrl) {
    if (product.imagen !== imageUrl) {
      await db.execute(
        "UPDATE oil_products SET imagen = ?, updatedAt = NOW() WHERE id = ?",
        [imageUrl, product.id]
      );
      console.log(`✅ [${product.id}] ${product.name}`);
      console.log(`   → ${imageUrl}\n`);
      updated++;
    } else {
      console.log(`⏭  [${product.id}] ${product.name} (ya tiene imagen correcta)`);
      skipped++;
    }
  } else {
    console.log(`❌ [${product.id}] ${product.name} — NO encontrada`);
    skipped++;
  }
}

console.log(`\n📊 Resultado:`);
console.log(`   ✅ Actualizados: ${updated}`);
console.log(`   ⏭  Sin cambios/No encontrados: ${skipped}`);
console.log(`   📦 Total: ${products.length}`);

// Mostrar resumen final
const [updated_products] = await db.execute(
  `SELECT id, name, imagen FROM oil_products WHERE imagen IS NOT NULL AND imagen != '' ORDER BY name`
);
console.log(`\n🖼  Productos con imagen (${updated_products.length}):`);
updated_products.forEach(p => {
  const imageFileName = p.imagen.split('/').pop().split('?')[0];
  console.log(`  [${p.id}] ${p.name} — ${imageFileName}`);
});

await db.end();
console.log("\n✅ Seed completado.");
