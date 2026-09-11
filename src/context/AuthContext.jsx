/**
 * AuthContext.jsx
 * Manages ONLY authentication state: currentUser, login, logout, and token.
 * All other app state lives in StoreContext or custom hooks.
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { loginRequest, logoutRequest, fetchCurrentUser } from '../services/authService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true); // true while restoring session
  const [authError, setAuthError] = useState(null);

  // StrictMode monte les effets deux fois en développement : sans garde, la
  // session était vérifiée deux fois auprès du serveur à chaque chargement.
  const restoredRef = React.useRef(false);

  // ── Restore session on mount ──────────────────────────────────
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    const restore = async () => {
      try {
        const user = await fetchCurrentUser();
        if (user) setCurrentUser(user);
      } catch (err) {
        // Distinguer un refus d'un serveur injoignable. Un 401 signifie que la
        // session n'est plus valable : il faut se déconnecter. Une panne réseau
        // ne dit rien de la session — déconnecter dans ce cas empêche la caisse
        // de fonctionner pendant une coupure, alors que tout est en cache.
        const status = err?.response?.status;
        const unreachable = !status || status >= 500;

        if (unreachable) {
          try {
            const cached = JSON.parse(localStorage.getItem('auth_user') || 'null');
            if (cached) {
              console.warn('Serveur injoignable : session restaurée depuis ce poste.');
              setCurrentUser(cached);
            }
          } catch { /* rien de exploitable en local */ }
        }
        // Session refusée (401/403) : on reste déconnecté.
      } finally {
        setAuthLoading(false);
      }
    };
    restore();
  }, []);

  // ── Listen for 401 events emitted by the Axios interceptor ───
  useEffect(() => {
    // Ce 401 vient de l'API MongoDB historique. Un compte Supabase n'y a pas
    // de session : ses appels y sont donc légitimement refusés, et cela ne
    // doit surtout pas le déconnecter de Supabase.
    const handle = async () => {
      if (isSupabaseConfigured) {
        const { data } = await supabase.auth.getSession();
        if (data?.session) return;
      }
      setCurrentUser(null);
    };
    window.addEventListener('auth:unauthorized', handle);
    return () => window.removeEventListener('auth:unauthorized', handle);
  }, []);

  // ── Login ─────────────────────────────────────────────────────
  const login = useCallback(async (username, password) => {
    setAuthError(null);
    try {
      const { user, token } = await loginRequest(username, password);
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
      setCurrentUser(user);
      return { success: true, user };
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Erreur de connexion.';
      setAuthError(message);
      return { success: false, error: message };
    }
  }, []);

  // ── Logout ────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await logoutRequest();
    setCurrentUser(null);
    setAuthError(null);
  }, []);

  const value = {
    currentUser,
    // Exposé pour refléter immédiatement un changement de préférence (langue)
    // sans imposer un rechargement de session.
    setCurrentUser,
    authLoading,
    authError,
    login,
    logout,
    isAuthenticated: !!currentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/** Hook to consume the AuthContext — auth components only. */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside an <AuthProvider>');
  return ctx;
};

export default AuthContext;
