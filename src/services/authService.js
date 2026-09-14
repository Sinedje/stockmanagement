/**
 * authService.js
 * All authentication-related API calls.
 * Uses the Axios instance from api.js.
 *
 * When your backend is ready, these functions will make real HTTP calls.
 * For now they simulate the server using localStorage + in-memory data.
 */
import api from './api';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { forgetCompany } from './supabaseData';

/**
 * Deux systèmes d'authentification coexistent pendant la migration :
 *
 *  - Supabase, pour les comptes multi-entreprises (identifiant = e-mail) ;
 *  - Express + MongoDB, pour les comptes historiques (identifiant = pseudo).
 *
 * La présence d'un « @ » sépare les deux sans ambiguïté : les pseudos existants
 * (admin, caisse1, comptable…) n'en contiennent pas. Les utilisateurs actuels
 * ne changent donc rien à leurs habitudes.
 */
const looksLikeEmail = (v) => /@/.test(v || '');

/**
 * Traduit les messages d'erreur de Supabase, renvoyés en anglais.
 *
 * « Identifiants incorrects » couvre volontairement l'utilisateur inconnu comme
 * le mot de passe erroné : distinguer les deux permettrait de découvrir quelles
 * adresses sont enregistrées.
 */
const AUTH_ERRORS = [
  [/invalid login credentials/i,      'Identifiants incorrects.'],
  [/email not confirmed/i,            "Adresse non confirmée. Ouvrez le lien reçu par e-mail."],
  [/user is banned|user not found/i,  'Identifiants incorrects.'],
  [/too many requests|rate limit/i,   'Trop de tentatives. Réessayez dans quelques minutes.'],
  [/network|fetch failed/i,           'Connexion au serveur impossible. Vérifiez votre réseau.'],
  [/password.*at least|weak password/i, 'Mot de passe trop court.'],
];

export const translateAuthError = (message) => {
  const found = AUTH_ERRORS.find(([rx]) => rx.test(message || ''));
  return found ? found[1] : (message || 'Connexion impossible.');
};

/** Traduit un profil Supabase vers la forme attendue par l'application. */
const toAppUser = (authUser, profile) => ({
  id: authUser.id,
  username: profile.username,
  name: profile.name,
  role: profile.role,
  storeId: profile.store_id || null,
  companyId: profile.company_id || null,
  isActive: profile.is_active,
  email: authUser.email,
  language: profile.language || null,   // null = suivre l'entreprise
});

/** Connexion Supabase : renvoie null si l'identifiant n'est pas un e-mail. */
const supabaseLogin = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const message = translateAuthError(error.message);
    throw Object.assign(new Error(message), {
      response: { status: 401, data: { message } },
    });
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles').select('*').eq('id', data.user.id).single();

  if (profileError || !profile) {
    // Compte d'authentification sans profil : l'installation n'est pas terminée.
    await supabase.auth.signOut();
    throw Object.assign(
      new Error("Ce compte n'a pas encore de profil. Terminez l'installation sur /setup."),
      { response: { status: 401, data: { message: 'Profil manquant' } } }
    );
  }

  if (!profile.is_active) {
    await supabase.auth.signOut();
    throw Object.assign(new Error('Compte désactivé.'), {
      response: { status: 401, data: { message: 'Compte désactivé' } },
    });
  }

  // Horodatage de connexion : alimente le suivi d'activité par entreprise.
  // Volontairement sans await — un échec ici ne doit pas retarder l'entrée.
  import('./operationsService')
    .then(m => m.touchLastLogin(data.user.id))
    .catch(() => { /* sans incidence */ });

  return { user: toAppUser(data.user, profile), token: data.session.access_token };
};

// ─────────────────────────────────────────────────────────────
// MOCK DATA  (remove this block once a real server exists)
// ─────────────────────────────────────────────────────────────
const MOCK_USERS = [
  { id: 1, username: 'admin',     password: '1234', name: 'Administrateur',    role: 'ceo' },
  { id: 2, username: 'manager',   password: '1234', name: 'Manager Principal', role: 'manager' },
  { id: 3, username: 'caisse1',   password: '1234', name: 'Caissière Magasin 1', role: 'cashier' },
  { id: 4, username: 'caisse2',   password: '1234', name: 'Caissière Magasin 2', role: 'cashier' },
  { id: 5, username: 'ceo',       password: '1234', name: 'Directeur Général',  role: 'ceo' },
  { id: 6, username: 'comptable', password: '1234', name: 'Comptable',          role: 'accountant' },
  { id: 7, username: 'lucie',     password: '1234', name: 'Lucie',              role: 'cashier' },
];

const simulateDelay = (ms = 300) => new Promise((r) => setTimeout(r, ms));
// ─────────────────────────────────────────────────────────────

/**
 * Attempt to log in a user.
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{ user: object, token: string }>}
 */
export const loginRequest = async (username, password) => {
  // L'identifiant est normalisé (les espaces autour n'ont jamais de sens),
  // mais surtout PAS le mot de passe : un mot de passe est une chaîne opaque.
  // Le rogner ici alors qu'il est enregistré tel quel à l'inscription rendait
  // la connexion impossible dès qu'il commençait ou finissait par un espace.
  const cleanUsername = (username || '').toString().trim().toLowerCase();
  const rawPassword = (password ?? '').toString();

  // Un e-mail désigne un compte Supabase ; un pseudo, un compte historique.
  if (isSupabaseConfigured && looksLikeEmail(cleanUsername)) {
    return supabaseLogin(cleanUsername, rawPassword);
  }

  // L'API historique conserve son comportement d'origine, pour ne rien changer
  // aux comptes MongoDB existants.
  const cleanPassword = rawPassword.trim();

  if (import.meta.env.VITE_API_URL) {
    // ── Real server call ──
    try {
      const response = await api.post('/auth/login', { username: cleanUsername, password: cleanPassword });
      return response.data; // expected: { user, token }
    } catch (error) {
      if (!error.response) {
        const netError = new Error('Impossible de se connecter au serveur backend. Veuillez vérifier que le serveur est démarré.');
        netError.response = { status: 503, data: { message: netError.message } };
        throw netError;
      }
      throw error;
    }
  }

  // ── Mock (no server yet) ──
  await simulateDelay();
  const user = MOCK_USERS.find(
    (u) => u.username === cleanUsername && u.password === cleanPassword
  );
  if (!user) {
    const error = new Error('Identifiants incorrects.');
    error.response = { status: 401, data: { message: 'Identifiants incorrects.' } };
    throw error;
  }
  const { password: _unused, ...safeUser } = user;
  const mockToken = `mock-token-${safeUser.id}-${Date.now()}`;
  return { user: { ...safeUser, isActive: true, storeId: 1 }, token: mockToken };
};

/**
 * Log out — informs the server and clears local tokens.
 * @returns {Promise<void>}
 */
export const logoutRequest = async () => {
  // Le prochain compte connecté n'appartient pas forcément à la même
  // entreprise : garder l'identifiant en mémoire écrirait chez le voisin.
  forgetCompany();
  // La session Supabase doit être fermée même si l'API historique répond mal.
  if (isSupabaseConfigured) {
    try { await supabase.auth.signOut(); } catch { /* session déjà close */ }
  }
  if (import.meta.env.VITE_API_URL) {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
  }
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
};

/**
 * Fetch the currently authenticated user from the server.
 * Used to re-hydrate the session on page reload.
 * @returns {Promise<object|null>}
 */
export const fetchCurrentUser = async () => {
  // Une session Supabase active a priorité : c'est le système cible.
  if (isSupabaseConfigured) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: profile } = await supabase
        .from('profiles').select('*').eq('id', session.user.id).single();
      if (profile) return toAppUser(session.user, profile);
    }
  }

  if (import.meta.env.VITE_API_URL) {
    const response = await api.get('/auth/me');
    return response.data;
  }
  // Mock: restore from localStorage
  const raw = localStorage.getItem('auth_user');
  return raw ? JSON.parse(raw) : null;
};

/**
 * Envoie un e-mail de réinitialisation (Supabase uniquement).
 *
 * Supabase répond volontairement de la même façon que l'adresse existe ou non,
 * pour ne pas révéler quels comptes sont enregistrés. On ne peut donc pas
 * confirmer l'envoi — seulement dire qu'il a été demandé.
 */
export const requestPasswordReset = async (email) => {
  if (!isSupabaseConfigured) {
    throw new Error("La réinitialisation n'est disponible qu'avec Supabase.");
  }
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
};

/**
 * Définit le nouveau mot de passe.
 *
 * À n'appeler qu'après avoir suivi le lien reçu par e-mail : Supabase place
 * alors une session de récupération, seule autorisée à changer le mot de passe.
 */
export const updatePassword = async (password) => {
  if (!isSupabaseConfigured) {
    throw new Error("La réinitialisation n'est disponible qu'avec Supabase.");
  }
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
};
