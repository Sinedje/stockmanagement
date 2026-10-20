/**
 * Test: vérifie que create_stock_entry met bien le stock dans le bon magasin
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vemghnhwwhabdsoojjro.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlbWdobmh3d2hhYmRzb29qanJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTAzOTAxNSwiZXhwIjoyMTA0NjE1MDE1fQ.o_LtXULq3k8kPgAR29ctPfJnyiqDjiyWsxIunj1_ieU';
const ANON_KEY = 'sb_publishable_dA6YU6DNijZ_QhDnjddIdQ_6DLsrQg9';

const COMPANY_ID = '0ba12ceb-6107-40a8-bc2e-f008ce55b9d4';
// Stores
const MOKOLO_ID    = 'b0877f72-873d-47bd-b5ac-b0151a76f61d';
const FLAMENCO_ID  = 'e032ec73-39d8-47a8-b7fd-1023fd9de514';

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

async function run() {
  console.log('=== TEST ISOLATION STOCK PAR MAGASIN ===\n');

  // 1. Créer un produit test dans MOKOLO
  const testProductName = 'TEST_ISOLATION_' + Date.now();
  console.log('1. Création produit test dans MOKOLO:', testProductName);
  const { data: prodMokolo, error: e1 } = await admin.from('products').insert({
    company_id: COMPANY_ID,
    store_id: MOKOLO_ID,
    name: testProductName,
    designation: 'Produit test isolation',
    category: 'TEST',
    price: 1000, cost: 500, stock: 0, min_stock: 0
  }).select('id, name, stock, store_id').single();

  if (e1) { console.error('Erreur création:', e1); return; }
  console.log('   → Créé:', prodMokolo);

  // 2. Créer le même produit dans FLAMENCO
  console.log('\n2. Création du MÊME produit dans FLAMENCO');
  const { data: prodFlamenco, error: e2 } = await admin.from('products').insert({
    company_id: COMPANY_ID,
    store_id: FLAMENCO_ID,
    name: testProductName,
    designation: 'Produit test isolation',
    category: 'TEST',
    price: 1000, cost: 500, stock: 0, min_stock: 0
  }).select('id, name, stock, store_id').single();

  if (e2) { console.error('Erreur création FLAMENCO:', e2); return; }
  console.log('   → Créé:', prodFlamenco);

  // 3. Simuler une entrée de stock dans MOKOLO via la RPC
  // On doit se connecter en tant que manager MOKOLO
  console.log('\n3. Connexion du manager MOKOLO...');
  const client = createClient(SUPABASE_URL, ANON_KEY);
  const { data: authData, error: authErr } = await client.auth.signInWithPassword({
    email: 'admin@feu-flamenco.local',
    password: 'Password123!'
  });
  if (authErr) { console.error('Erreur login:', authErr); return; }
  console.log('   → Connecté en tant que:', authData.user.email);

  // 4. Appeler la RPC create_stock_entry pour ajouter 50 unités dans MOKOLO
  console.log('\n4. Entrée de stock: 50 unités dans MOKOLO via RPC...');
  const entryPayload = {
    store_id: MOKOLO_ID,
    supplier: 'Fournisseur Test',
    note_number: 'TEST-ISOLATION',
    date: new Date().toISOString(),
    items: [{
      product_id: prodMokolo.id,
      name: testProductName,
      quantity: 50,
      cost: 500
    }]
  };

  const { data: entryResult, error: rpcErr } = await client.rpc('create_stock_entry', { p_entry: entryPayload });
  if (rpcErr) { console.error('Erreur RPC:', rpcErr); }
  else console.log('   → Entrée créée, ID:', entryResult);

  // 5. Vérifier les stocks après
  console.log('\n5. Vérification des stocks après entrée...');
  const { data: after } = await admin.from('products')
    .select('id, name, stock, store_id')
    .in('id', [prodMokolo.id, prodFlamenco.id]);

  for (const p of after) {
    const storeName = p.store_id === MOKOLO_ID ? 'MOKOLO' : 'FLAMENCO';
    console.log(`   → ${storeName}: ${p.name} → stock = ${p.stock}`);
  }

  console.log('\n=== RÉSULTAT ATTENDU ===');
  console.log('MOKOLO: stock = 50  ✅ (entrée faite ici)');
  console.log('FLAMENCO: stock = 0 ✅ (non touché)');

  // 6. Nettoyer
  console.log('\n6. Nettoyage des données test...');
  await admin.from('products').delete().in('id', [prodMokolo.id, prodFlamenco.id]);
  console.log('   → Produits test supprimés');
}

run();
