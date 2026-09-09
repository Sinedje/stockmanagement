/**
 * authService.js
 * All authentication-related API calls.
 * Uses the Axios instance from api.js.
 *
 * When your backend is ready, these functions will make real HTTP calls.
 * For now they simulate the server using localStorage + in-memory data.
 */
import api from './api';

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
  const cleanUsername = (username || '').toString().trim().toLowerCase();
  const cleanPassword = (password || '').toString().trim();

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
  const { password: _, ...safeUser } = user;
  const mockToken = `mock-token-${safeUser.id}-${Date.now()}`;
  return { user: { ...safeUser, isActive: true, storeId: 1 }, token: mockToken };
};

/**
 * Log out — informs the server and clears local tokens.
 * @returns {Promise<void>}
 */
export const logoutRequest = async () => {
  if (import.meta.env.VITE_API_URL) {
    try { await api.post('/auth/logout'); } catch (_) { /* ignore */ }
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
  if (import.meta.env.VITE_API_URL) {
    const response = await api.get('/auth/me');
    return response.data;
  }
  // Mock: restore from localStorage
  const raw = localStorage.getItem('auth_user');
  return raw ? JSON.parse(raw) : null;
};
