/**
 * useUsers.js
 * Manages user (staff) state.
 * Calls userService for API operations; local state managed by StoreContext.
 */
import { useState, useCallback } from 'react';
import { hasSupabaseSession } from '../services/supabaseData';
import {
  createUser as apiCreateUser,
  updateUser as apiUpdateUser,
  toggleUserStatus as apiToggleUserStatus,
} from '../services/userService';
import { useStore } from '../context/StoreContext';

const useUsers = () => {
  const {
    users,
    addUser: storeAddUser,
    updateUser: storeUpdateUser,
    toggleUserStatus: storeToggleUserStatus,
    staffWithCodes,
    allCashierProducts,
  } = useStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addUser = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    try {
      // Un compte Supabase se crée par l'Edge Function : elle seule détient la
      // clé qui permet de confirmer d'office une adresse interne .local, à
      // laquelle aucun lien de confirmation ne pourrait parvenir.
      if (await hasSupabaseSession()) {
        const { createMember } = await import('../services/memberService');
        const saved = await createMember(userData);
        storeAddUser(saved);
        return saved;
      }
      if (import.meta.env.VITE_API_URL) {
        const saved = await apiCreateUser(userData);
        // Use the server-returned user (with real _id) for local state
        storeAddUser(saved || userData);
      } else {
        storeAddUser(userData);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [storeAddUser]);

  const updateUser = useCallback(async (id, updates) => {
    setError(null);
    try {
      if (import.meta.env.VITE_API_URL) {
        const saved = await apiUpdateUser(id, updates);
        storeUpdateUser(id, saved || updates);
      } else {
        storeUpdateUser(id, updates);
      }
    } catch (err) {
      setError(err.message);
    }
  }, [storeUpdateUser]);

  const toggleUserStatus = useCallback(async (id) => {
    setError(null);
    try {
      if (import.meta.env.VITE_API_URL) {
        await apiToggleUserStatus(id);
      }
      storeToggleUserStatus(id);
    } catch (err) {
      setError(err.message);
    }
  }, [storeToggleUserStatus]);

  return {
    users,
    staffWithCodes,
    allCashierProducts,
    loading,
    error,
    addUser,
    updateUser,
    toggleUserStatus,
  };
};

export default useUsers;
