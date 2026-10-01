/**
 * useUsers.js
 * Manages user (staff) state.
 * Calls userService for API operations; local state managed by StoreContext.
 */
import { useState, useCallback } from 'react';
import { hasSupabaseSession } from '../services/supabaseData';
import {
  fetchUsers as apiFetchUsers,
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
      if (await hasSupabaseSession()) {
        const { createMember } = await import('../services/memberService');
        const saved = await createMember(userData);
        storeAddUser(saved);
        return saved;
      }
      const saved = await apiCreateUser(userData);
      storeAddUser(saved || userData);
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
      const saved = await apiUpdateUser(id, updates);
      storeUpdateUser(id, saved || updates);
    } catch (err) {
      setError(err.message);
    }
  }, [storeUpdateUser]);

  const toggleUserStatus = useCallback(async (id) => {
    setError(null);
    try {
      await apiToggleUserStatus(id);
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
