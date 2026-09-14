/**
 * memberService.js
 * Comptes employés : résolution du lien d'entreprise et administration.
 *
 * Un employé de commerce n'a pas d'adresse professionnelle. Il se connecte
 * depuis le lien de son entreprise avec son seul nom d'utilisateur ; l'adresse
 * « pseudo@slug.local » attendue par Supabase Auth est composée ici, et ne lui
 * est jamais montrée.
 */
import { supabase } from '../lib/supabase';

/** Adresse interne d'un employé. Jamais affichée, jamais saisie. */
export const internalEmail = (username, slug) =>
  `${String(username || '').trim().toLowerCase()}@${String(slug || '').trim().toLowerCase()}.local`;

/**
 * Nom de l'entreprise derrière un lien, avant toute authentification.
 * Renvoie null si le lien ne correspond à aucune entreprise active.
 */
export const fetchCompanyBySlug = async (slug) => {
  if (!supabase || !slug) return null;
  const { data, error } = await supabase.rpc('company_by_slug', { p_slug: slug });
  if (error) return null;
  return data?.[0] || null;
};

/** Appelle l'Edge Function d'administration des comptes. */
const call = async (action, payload) => {
  if (!supabase) throw new Error('Supabase non configuré.');
  const { data, error } = await supabase.functions.invoke('manage-member', {
    body: { action, ...payload },
  });
  // Les erreurs métier arrivent avec un statut HTTP : le message utile est
  // dans le corps, que supabase-js n'expose pas directement.
  if (error) {
    let detail = '';
    try { detail = (await error.context?.json())?.error || ''; } catch { /* corps illisible */ }
    throw new Error(detail || error.message);
  }
  if (data?.error) throw new Error(data.error);
  return data;
};

/**
 * Crée un employé avec le mot de passe choisi par son administrateur.
 * L'entreprise n'est pas transmise : la fonction retient celle de l'appelant.
 */
export const createMember = ({ name, username, password, role, storeId }) =>
  call('create', { name, username, password, role, storeId });

/** Attribue un nouveau mot de passe à un employé. */
export const setMemberPassword = (profileId, password) =>
  call('set_password', { profileId, password });
