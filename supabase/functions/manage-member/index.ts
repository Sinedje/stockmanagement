// ============================================================================
//  manage-member — création et réinitialisation des comptes employés
//
//  Les employés d'un commerce n'ont pas d'adresse e-mail : leur compte est créé
//  avec une adresse interne « pseudo@slug.local » et un mot de passe choisi par
//  leur administrateur, puis marqué confirmé d'office — aucun lien de
//  confirmation ne pourrait leur parvenir.
//
//  Créer un compte confirmé exige la clé `service_role`, qui contourne toute la
//  RLS. Elle ne doit jamais atteindre le navigateur : l'appel passe donc par
//  cette fonction, exécutée côté Supabase.
//
//  Déploiement :  supabase functions deploy manage-member
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

/** Seuls ces rôles administrent les comptes de leur entreprise. */
const ADMIN_ROLES = ['ceo', 'manager'];
const MEMBER_ROLES = ['ceo', 'manager', 'accountant', 'cashier', 'storekeeper'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader) return json({ error: 'Authentification requise' }, 401);

    const url = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // 1. Identifier l'appelant avec SON jeton, donc soumis à la RLS. Le client
    //    annonce ce qu'il veut ; on ne le croit sur rien.
    const asCaller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    // Le profil doit être cherché par l'identifiant du porteur du jeton : la
    // RLS laisse un PDG voir toute son équipe, si bien qu'un .single() sans
    // filtre échouait dès la deuxième personne inscrite.
    const { data: { user: caller } } = await asCaller.auth.getUser();
    if (!caller) return json({ error: 'Session invalide' }, 401);
    const { data: me } = await asCaller
      .from('profiles').select('id, role, company_id').eq('id', caller.id).single();
    if (!me) return json({ error: 'Profil introuvable' }, 403);

    const isSuperadmin = me.role === 'superadmin';
    if (!isSuperadmin && !ADMIN_ROLES.includes(me.role)) {
      return json({ error: 'Réservé à la direction de l’entreprise' }, 403);
    }

    const body = await req.json();
    const action = String(body.action ?? '');
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

    // L'entreprise visée est TOUJOURS celle de l'appelant, jamais celle qu'il
    // annonce — sans quoi un gérant pourrait créer des comptes ailleurs.
    const companyId = isSuperadmin ? String(body.companyId ?? '') : me.company_id;
    if (!companyId) return json({ error: 'Entreprise non déterminée' }, 400);

    const { data: company } = await admin
      .from('companies').select('id, slug, name, max_users').eq('id', companyId).single();
    if (!company) return json({ error: 'Entreprise introuvable' }, 404);

    /* ── Créer un employé ────────────────────────────────────────────────── */
    if (action === 'create') {
      const username = String(body.username ?? '').trim().toLowerCase();
      const name = String(body.name ?? '').trim();
      const password = String(body.password ?? '');
      const role = String(body.role ?? '');
      const storeId = body.storeId ? String(body.storeId) : null;

      if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
        return json({ error: 'Nom d’utilisateur : 3 à 32 caractères, sans espace ni accent.' }, 400);
      }
      if (!name) return json({ error: 'Le nom est obligatoire.' }, 400);
      if (password.length < 8) return json({ error: 'Mot de passe : 8 caractères minimum.' }, 400);
      if (!MEMBER_ROLES.includes(role)) return json({ error: 'Rôle inconnu.' }, 400);
      // Un gérant ne peut pas se hisser au-dessus de lui-même.
      if (!isSuperadmin && me.role === 'manager' && role === 'ceo') {
        return json({ error: 'Un gérant ne peut pas créer un compte de direction.' }, 403);
      }

      const { count } = await admin
        .from('profiles').select('id', { count: 'exact', head: true }).eq('company_id', companyId);
      if (company.max_users && (count ?? 0) >= company.max_users) {
        return json({ error: `Plafond atteint : ${company.max_users} utilisateurs.` }, 409);
      }

      const email = `${username}@${company.slug}.local`;
      const { data: created, error: authError } = await admin.auth.admin.createUser({
        email,
        password,
        // Aucun message ne peut atteindre un domaine .local : confirmer
        // d'office est la seule façon de rendre le compte utilisable.
        email_confirm: true,
        user_metadata: { name },
      });
      if (authError) return json({ error: authError.message }, 400);

      const { error: profileError } = await admin.from('profiles').insert({
        id: created.user.id, company_id: companyId, name, username, role,
        store_id: storeId, is_active: true,
      });
      if (profileError) {
        // Sans profil, le compte Auth est un orphelin inaccessible : on le retire.
        await admin.auth.admin.deleteUser(created.user.id);
        return json({ error: profileError.message }, 400);
      }
      return json({ id: created.user.id, username, email, name, role });
    }

    /* ── Changer le mot de passe d'un employé ────────────────────────────── */
    if (action === 'set_password') {
      const profileId = String(body.profileId ?? '');
      const password = String(body.password ?? '');
      if (password.length < 8) return json({ error: 'Mot de passe : 8 caractères minimum.' }, 400);

      const { data: target } = await admin
        .from('profiles').select('id, company_id, role, name').eq('id', profileId).single();
      if (!target) return json({ error: 'Membre introuvable' }, 404);
      // La cible doit appartenir à l'entreprise de l'appelant.
      if (!isSuperadmin && target.company_id !== me.company_id) {
        return json({ error: 'Ce membre n’appartient pas à votre entreprise.' }, 403);
      }
      if (!isSuperadmin && me.role === 'manager' && target.role === 'ceo') {
        return json({ error: 'Un gérant ne peut pas réinitialiser un compte de direction.' }, 403);
      }

      const { error } = await admin.auth.admin.updateUserById(profileId, { password });
      if (error) return json({ error: error.message }, 400);
      return json({ id: profileId, name: target.name });
    }

    return json({ error: 'Action inconnue' }, 400);
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
