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
export const createCompany = async ({ name, slug, activity, phones, ncc, rccm, language, admin }) => {
  const sb = requireSupabase();
  const { data, error } = await sb.functions.invoke('create-company', {
    body: {
      company: { name, slug, activity, phones, ncc, rccm, language: language || 'fr' },
      admin: { email: admin.email, name: admin.name, username: admin.username },
    },
  });
  if (error) throw error;
  return data;
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

  const { data: signUp, error: signUpError } = await sb.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (signUpError) throw signUpError;

  // Sans session, la confirmation par e-mail est activée sur le projet :
  // le profil ne peut pas encore être créé (auth.uid() serait nul).
  if (!signUp.session) {
    return { pendingEmailConfirmation: true };
  }

  const { error: profileError } = await sb.from('profiles').insert({
    id: signUp.user.id,
    company_id: null,
    name,
    username: 'superadmin',
    role: 'superadmin',
  });
  if (profileError) throw profileError;

  return { pendingEmailConfirmation: false };
};
