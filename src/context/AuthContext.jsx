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
      } catch (_) {
        // Token may be expired — just stay logged out
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
