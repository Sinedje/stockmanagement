/**
 * useUsers.js
 * Manages user (staff) state.
 * Calls userService for API operations; local state managed by StoreContext.
 */
import { useState, useCallback } from 'react';
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
      if (import.meta.env.VITE_API_URL) await apiCreateUser(userData);
      storeAddUser(userData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [storeAddUser]);

  const updateUser = useCallback(async (id, updates) => {
    setError(null);
    try {
      if (import.meta.env.VITE_API_URL) await apiUpdateUser(id, updates);
      storeUpdateUser(id, updates);
    } catch (err) {
      setError(err.message);
    }
  }, [storeUpdateUser]);

  const toggleUserStatus = useCallback(async (id) => {
    setError(null);
    try {
      if (import.meta.env.VITE_API_URL) await apiToggleUserStatus(id);
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
