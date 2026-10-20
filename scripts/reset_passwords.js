import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vemghnhwwhabdsoojjro.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlbWdobmh3d2hhYmRzb29qanJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTAzOTAxNSwiZXhwIjoyMTA0NjE1MDE1fQ.o_LtXULq3k8kPgAR29ctPfJnyiqDjiyWsxIunj1_ieU';

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

async function reset() {
  const COMPANY_ID = '0ba12ceb-6107-40a8-bc2e-f008ce55b9d4';
  const { data: profiles, error: fetchError } = await admin
    .from('profiles')
    .select('id, name, username, role')
    .eq('company_id', COMPANY_ID);
    
  if (fetchError) {
    console.error('Erreur de récupération des profils:', fetchError);
    return;
  }
  
  console.log('Trouvé ' + profiles.length + ' comptes pour cette entreprise.');
  
  for (const profile of profiles) {
    const { error: updateError } = await admin.auth.admin.updateUserById(profile.id, {
      password: 'Password123!'
    });
    
    if (updateError) {
      console.error('Erreur pour ' + profile.username + ' (' + profile.name + '):', updateError.message);
    } else {
      console.log('✅ Mot de passe réinitialisé pour: ' + profile.username + ' (' + profile.name + ' - ' + profile.role + ')');
    }
  }
  
  console.log('\nTerminé avec succès !');
}

reset();
