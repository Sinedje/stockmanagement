import { requireSupabase } from '../lib/supabase';

/**
 * Gestion du parc d'entreprises — réservé au superadmin.
 *
 * Aucune vérification de rôle n'est faite ici : c'est la Row Level Security de
 * PostgreSQL qui autorise ou refuse. Un contrôle côté navigateur serait
 * contournable ; celui de la base ne l'est pas.
 */

/** Liste des entreprises, avec le nombre de magasins et de membres. */
export const fetchCompanies = async () => {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from('companies')
    .select('*, stores(count), profiles(count)')
    .order('created_at', { ascending: false });
  if (error) throw error;

  return (data || []).map(c => ({
    ...c,
    storeCount: c.stores?.[0]?.count ?? 0,
    memberCount: c.profiles?.[0]?.count ?? 0,
  }));
};

export const fetchCompany = async (id) => {
  const sb = requireSupabase();
  const { data, error } = await sb.from('companies').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
};

/**
 * Crée une entreprise ET son premier administrateur.
 *
 * Les deux vont ensemble : une entreprise sans compte d'accès est inutilisable.
 * La création du compte exige la clé `service_role`, qui n'a pas sa place dans
 * le navigateur — l'appel passe donc par une Edge Function côté serveur.
 */
/**
 * Crée une entreprise ET son premier administrateur.
 *
 * Les deux vont ensemble : une entreprise sans compte d'accès est inutilisable.
 *
 * Deux chemins, dans cet ordre :
 *
 *  1. L'Edge Function `create-company`, qui détient la clé `service_role`.
 *     C'est la voie correcte : la création du compte y est faite avec des
 *     privilèges administrateur, sans dépendre des inscriptions publiques.
 *
 *  2. À défaut (fonction non déployée), un repli côté navigateur. Il n'utilise
 *     aucune clé privilégiée : le compte est créé par une inscription normale,
 *     depuis un client Supabase isolé pour que la session du superadmin ne soit
 *     pas remplacée par celle du nouveau compte.
 */
export const createCompany = async (payload) => {
  const sb = requireSupabase();
  const { admin, ...company } = payload;

  const { data, error } = await sb.functions.invoke('create-company', {
    body: {
      company,
      admin: { email: admin.email, name: admin.name, username: admin.username },
    },
  });

  if (!error) return data;

  // Fonction absente : on bascule sur le repli. Toute autre erreur est réelle.
  const notDeployed =
    error?.context?.status === 404 || /not found|failed to send/i.test(error.message || '');
  if (!notDeployed) throw error;

  return createCompanyFromBrowser(sb, company, admin);
};

/**
 * Repli sans Edge Function.
 *
 * Exige que les inscriptions publiques soient actives sur le projet, puisque
 * le compte est créé par un signUp ordinaire. C'est précisément la raison pour
 * laquelle l'Edge Function reste la voie recommandée.
 */
const createCompanyFromBrowser = async (sb, company, admin) => {
  const { createClient } = await import('@supabase/supabase-js');

  const { data: created, error: companyError } = await sb
    .from('companies').insert(company).select().single();
  if (companyError) throw companyError;

  const rollback = async () => { await sb.from('companies').delete().eq('id', created.id); };

  try {
    // Client jetable : sans persistance ni clé de stockage partagée, la session
    // du superadmin reste intacte pendant l'inscription du nouveau compte.
    const throwaway = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY,
      { auth: { persistSession: false, autoRefreshToken: false, storageKey: 'sb-temp-signup' } }
    );

    const tempPassword = `${crypto.randomUUID().slice(0, 10)}Aa1!`;
    const { data: signUp, error: signUpError } = await throwaway.auth.signUp({
      email: admin.email,
      password: tempPassword,
      options: { data: { name: admin.name } },
    });
    if (signUpError) throw signUpError;

    if (!signUp?.user?.id) {
      throw new Error(
        "Le compte n'a pas pu être créé. Vérifiez que les inscriptions sont autorisées "
        + '(Authentication → Providers), ou déployez la fonction create-company.'
      );
    }

    // Pour ne pas révéler quelles adresses sont enregistrées, Supabase renvoie
    // un utilisateur factice — identifiant aléatoire, `identities` vide —
    // lorsque l'adresse existe déjà. L'insérer tel quel violait la clé
    // étrangère vers auth.users, avec un message incompréhensible.
    if (Array.isArray(signUp.user.identities) && signUp.user.identities.length === 0) {
      throw new Error(
        `L'adresse ${admin.email} est déjà utilisée par un compte. `
        + 'Choisissez-en une autre, ou supprimez le compte existant dans '
        + 'Authentication → Users.'
      );
    }

    // Le profil est inséré par le superadmin : sa politique RLS l'autorise à
    // écrire pour n'importe quelle entreprise.
    const { error: profileError } = await sb.from('profiles').insert({
      id: signUp.user.id,
      company_id: created.id,
      name: admin.name,
      username: admin.username || 'admin',
      role: 'ceo',
    });
    if (profileError) {
      if (profileError.code === '23503') {
        throw new Error(
          "Le compte d'authentification n'a pas été créé (adresse déjà prise, ou "
          + 'inscriptions désactivées). Déployez la fonction create-company pour '
          + 'contourner cette limite.'
        );
      }
      throw profileError;
    }

    return { company: created, adminEmail: admin.email, tempPassword, viaFallback: true };
  } catch (err) {
    await rollback();          // pas d'entreprise orpheline si le compte échoue
    throw err;
  }
};

/** Suspend ou réactive. On ne supprime pas : l'historique comptable doit survivre. */
export const setCompanyStatus = async (id, status) => {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from('companies')
    .update({ status })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateCompany = async (id, patch) => {
  const sb = requireSupabase();
  const { data, error } = await sb.from('companies').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data;
};

/** Membres d'une entreprise — vue superadmin. */
export const fetchCompanyMembers = async (companyId) => {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from('profiles')
    .select('id, name, username, role, is_active, store_id, created_at')
    .eq('company_id', companyId)
    .order('created_at');
  if (error) throw error;
  return data || [];
};

/**
 * Reste-t-il un superadmin à créer ?
 *
 * Fonction SQL `security definer` : elle ne renvoie qu'un booléen, sans
 * exposer le moindre compte. Utilisée par l'écran d'installation.
 */
export const needsBootstrap = async () => {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc('needs_bootstrap');
  if (error) throw error;
  return Boolean(data);
};

/**
 * Crée le tout premier superadmin depuis l'application.
 *
 * L'autorisation n'est pas décidée ici : la politique RLS
 * `profiles_bootstrap_first_superadmin` n'accepte cette insertion que tant
 * qu'aucun superadmin n'existe. Un second appel échouera côté base, même si
 * quelqu'un contournait cet écran.
 */
export const bootstrapSuperadmin = async ({ email, password, name }) => {
  const sb = requireSupabase();

  // Le compte existe peut-être déjà : c'est le cas après une confirmation
  // d'e-mail, où l'inscription a réussi mais le profil n'a pas pu être créé
  // faute de session. On tente donc d'abord une connexion.
  let session = null;
  const { data: signIn } = await sb.auth.signInWithPassword({ email, password });
  if (signIn?.session) {
    session = signIn.session;
  } else {
    const { data: signUp, error: signUpError } = await sb.auth.signUp({
      email, password, options: { data: { name } },
    });
    if (signUpError) throw signUpError;
    session = signUp.session;
  }

  // Toujours pas de session : le projet exige une confirmation par e-mail.
  // L'utilisateur reviendra sur cet écran une fois l'adresse validée, et la
  // connexion ci-dessus prendra alors le relais.
  if (!session) return { pendingEmailConfirmation: true };

  const { error: profileError } = await sb.from('profiles').insert({
    id: session.user.id,
    company_id: null,
    name,
    username: 'superadmin',
    role: 'superadmin',
  });

  // Un profil déjà présent n'est pas une erreur : l'installation est faite.
  if (profileError && profileError.code !== '23505') throw profileError;

  return { pendingEmailConfirmation: false };
};

/** Réglages de la plateforme (ligne unique) : valeurs par défaut des nouvelles entreprises. */
export const fetchPlatformSettings = async () => {
  const sb = requireSupabase();
  const { data, error } = await sb.from('platform_settings').select('*').limit(1).single();
  if (error) throw error;
  return data;
};

export const updatePlatformSettings = async (patch) => {
  const sb = requireSupabase();
  const { data: current } = await sb.from('platform_settings').select('id').limit(1).single();
  const { data, error } = await sb
    .from('platform_settings').update(patch).eq('id', current.id).select().single();
  if (error) throw error;
  return data;
};

/** Active ou coupe une fonctionnalité pour une entreprise donnée. */
export const setCompanyFeatures = async (companyId, features) => {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from('companies').update({ features }).eq('id', companyId).select().single();
  if (error) throw error;
  return data;
};

/** Profil de l'utilisateur connecté (nom, identifiant). */
export const updateMyProfile = async ({ name, username }) => {
  const sb = requireSupabase();
  const { data: { user } } = await sb.auth.getUser();
  const { data, error } = await sb
    .from('profiles').update({ name, username }).eq('id', user.id).select().single();
  if (error) throw error;
  return data;
};

/**
 * Change l'adresse de connexion.
 *
 * Supabase envoie un lien de confirmation à la NOUVELLE adresse : le
 * changement n'est effectif qu'une fois ce lien suivi. On ne peut donc pas
 * annoncer un succès immédiat.
 */
export const updateMyEmail = async (email) => {
  const sb = requireSupabase();
  const { error } = await sb.auth.updateUser({ email: email.trim() });
  if (error) throw error;
};

export const updateMyPassword = async (password) => {
  const sb = requireSupabase();
  const { error } = await sb.auth.updateUser({ password });
  if (error) throw error;
};

/** Membres d'une entreprise — le superadmin les voit tous (politique RLS dédiée). */
export const setMemberActive = async (profileId, isActive) => {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from('profiles').update({ is_active: isActive }).eq('id', profileId).select().single();
  if (error) throw error;
  return data;
};

export const setMemberRole = async (profileId, role) => {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from('profiles').update({ role }).eq('id', profileId).select().single();
  if (error) throw error;
  return data;
};

/**
 * Envoie un lien de réinitialisation à un membre.
 *
 * Passe par le flux public de récupération : aucune clé privilégiée n'est
 * nécessaire, et le superadmin ne voit jamais le mot de passe.
 */
export const sendMemberPasswordReset = async (email) => {
  const sb = requireSupabase();
  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
};

/**
 * Supprime définitivement une entreprise.
 *
 * Les clés étrangères sont en `on delete cascade` : magasins, produits, ventes
 * et profils partent avec elle. Irréversible — l'appelant doit exiger une
 * confirmation explicite.
 */
export const deleteCompany = async (id) => {
  const sb = requireSupabase();
  const { error } = await sb.from('companies').delete().eq('id', id);
  if (error) throw error;
};
