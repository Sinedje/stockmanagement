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
