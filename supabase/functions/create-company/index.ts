// ============================================================================
//  create-company — création d'une entreprise et de son premier administrateur
//
//  Cette opération exige la clé `service_role` (création d'un compte dans
//  auth.users). Cette clé ne doit jamais atteindre le navigateur : l'appel passe
//  donc par cette fonction, exécutée côté Supabase.
//
//  Déploiement :  supabase functions deploy create-company
// ============================================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader) return json({ error: 'Authentification requise' }, 401);

    const url = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // 1. Vérifier que l'appelant est bien superadmin — avec SON jeton, donc
    //    soumis à la RLS. On ne se fie jamais au client sur ce point.
    const asCaller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await asCaller.auth.getUser();
    if (!caller) return json({ error: 'Session invalide' }, 401);
    // Filtré sur l'appelant : la RLS du superadmin lui montre tous les profils,
    // et un .single() sans filtre échoue dès qu'il y en a plus d'un.
    const { data: me } = await asCaller
      .from('profiles').select('role').eq('id', caller.id).single();
    if (me?.role !== 'superadmin') return json({ error: 'Réservé au superadmin' }, 403);

    const { company, admin } = await req.json();
    if (!company?.name || !company?.slug) return json({ error: 'Nom et identifiant requis' }, 400);
    if (!admin?.email || !admin?.name) return json({ error: 'Administrateur incomplet' }, 400);

    // 2. À partir d'ici, privilèges élevés.
    const asAdmin = createClient(url, serviceKey);

    const { data: created, error: companyError } = await asAdmin
      .from('companies').insert(company).select().single();
    if (companyError) return json({ error: companyError.message }, 400);

    // 3. Compte d'accès. Mot de passe provisoire : l'exploitant le transmet,
    //    l'administrateur le changera à la première connexion.
    const tempPassword = crypto.randomUUID().slice(0, 12);
    const { data: user, error: userError } = await asAdmin.auth.admin.createUser({
      email: admin.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name: admin.name },
    });

    if (userError) {
      // L'entreprise ne doit pas rester orpheline si le compte échoue.
      await asAdmin.from('companies').delete().eq('id', created.id);
      return json({ error: `Compte non créé : ${userError.message}` }, 400);
    }

    const { error: profileError } = await asAdmin.from('profiles').insert({
      id: user.user.id,
      company_id: created.id,
      name: admin.name,
      username: admin.username || 'admin',
      role: 'ceo',
    });

    if (profileError) {
      await asAdmin.auth.admin.deleteUser(user.user.id);
      await asAdmin.from('companies').delete().eq('id', created.id);
      return json({ error: `Profil non créé : ${profileError.message}` }, 400);
    }

    return json({ company: created, adminEmail: admin.email, tempPassword });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
