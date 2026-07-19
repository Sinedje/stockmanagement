/**
 * AuthContext.jsx
 * Manages ONLY authentication state: currentUser, login, logout, and token.
 * All other app state lives in StoreContext or custom hooks.
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { loginRequest, logoutRequest, fetchCurrentUser } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true); // true while restoring session
  const [authError, setAuthError] = useState(null);

  // ── Restore session on mount ──────────────────────────────────
  useEffect(() => {
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
    const handle = () => setCurrentUser(null);
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
