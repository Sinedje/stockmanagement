import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vemghnhwwhabdsoojjro.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlbWdobmh3d2hhYmRzb29qanJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTAzOTAxNSwiZXhwIjoyMTA0NjE1MDE1fQ.o_LtXULq3k8kPgAR29ctPfJnyiqDjiyWsxIunj1_ieU';

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

async function run() {
  console.log('=== SYNC PHYSICAL STOCK ===');
  // Copy stock to physical_stock for all products where physical_stock is 0
  const { data, error } = await admin.from('products').select('id, stock, physical_stock');
  if (error) { console.error(error); return; }

  let updated = 0;
  for (const p of data) {
    if (p.physical_stock === 0 && p.stock > 0) {
      const { error: updateErr } = await admin.from('products').update({ physical_stock: p.stock }).eq('id', p.id);
      if (updateErr) console.error(updateErr);
      else updated++;
    }
  }
  console.log(`Updated ${updated} products physical_stock to match theoretical stock.`);
}

run();
