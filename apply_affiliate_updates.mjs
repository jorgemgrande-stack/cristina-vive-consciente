import mysql2 from 'mysql2/promise';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config({ path: '/home/ubuntu/cristina-vive-consciente/.env' });

const updates = JSON.parse(readFileSync('/home/ubuntu/db_update_plan.json', 'utf8'));

async function main() {
  const conn = await mysql2.createConnection(process.env.DATABASE_URL);
  
  console.log(`Actualizando ${updates.length} productos en la BD...`);
  
  let updated = 0;
  let errors = 0;
  
  for (const u of updates) {
    try {
      await conn.execute(
        `UPDATE affiliate_products 
         SET affiliateUrl = ?, provider = ?, isAffiliate = ?, sourceUrl = ?
         WHERE id = ?`,
        [
          u.affiliateUrl || '',
          u.provider || '',
          u.isAffiliate ? 1 : 0,
          u.shopify_url || '',
          u.id
        ]
      );
      updated++;
      
      const status = u.isAffiliate ? '✓ afiliado' : (u.provider === 'Propio' ? '○ propio' : '✗ sin URL');
      console.log(`[${updated}/${updates.length}] ${status} ID ${u.id}: ${u.name?.slice(0, 50) || ''}`);
      if (u.affiliateUrl) {
        console.log(`  → ${u.affiliateUrl.slice(0, 80)}`);
      }
    } catch (err) {
      errors++;
      console.error(`ERROR ID ${u.id}: ${err.message}`);
    }
  }
  
  await conn.end();
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`ACTUALIZACIÓN COMPLETADA:`);
  console.log(`  Actualizados: ${updated}`);
  console.log(`  Errores: ${errors}`);
  
  // Estadísticas finales
  const [rows] = await (await mysql2.createConnection(process.env.DATABASE_URL))
    .execute('SELECT isAffiliate, provider, COUNT(*) as cnt FROM affiliate_products GROUP BY isAffiliate, provider ORDER BY isAffiliate DESC, cnt DESC');
  
  console.log('\nDistribución en BD:');
  for (const row of rows) {
    const type = row.isAffiliate ? 'Afiliado' : 'Propio/Sin URL';
    console.log(`  [${type}] ${row.provider || '(sin proveedor)'}: ${row.cnt}`);
  }
}

main().catch(console.error);
