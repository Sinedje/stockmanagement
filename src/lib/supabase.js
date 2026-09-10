import { createClient } from '@supabase/supabase-js';

/**
 * Client Supabase partagé.
 *
 * Les clés sont lues depuis l'environnement Vite : la clé « anon » est publique
 * par conception — c'est la Row Level Security, côté PostgreSQL, qui décide de
 * ce que chaque utilisateur peut lire ou écrire. Aucune clé `service_role` ne
 * doit jamais apparaître dans le code du navigateur.
 */
const url = import.meta.env.VITE_SUPABASE_URL;

// Supabase a renommé la clé publique : `sb_publishable_…` remplace l'ancienne
// clé « anon ». On accepte les deux noms pour ne pas casser les déploiements
// existants au moment de la bascule.
const publishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && publishableKey);

export const supabase = isSupabaseConfigured
  ? createClient(url, publishableKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;

/** Lève une erreur explicite plutôt qu'un « cannot read property of null ». */
export const requireSupabase = () => {
  if (!supabase) {
    throw new Error(
      "Supabase n'est pas configuré. Renseignez VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY."
    );
  }
  return supabase;
};

export default supabase;
