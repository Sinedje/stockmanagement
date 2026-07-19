/**
 * useBreakages.js
 * Manages breakages (casses) and repackagings (reconditionnements).
 * Calls breakageService for API operations; local state managed by StoreContext.
 */
import { useState, useCallback } from 'react';
import {
  createBreakage as apiCreateBreakage,
  createRepackaging as apiCreateRepackaging,
} from '../services/breakageService';
import { useStore } from '../context/StoreContext';

const useBreakages = () => {
  const {
    breakages,
    declareBreakage: storeDeclareBreakage,
    repackagings,
    createRepackaging: storeCreateRepackaging,
    categories,
    addCategory,
  } = useStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const declareBreakage = useCallback(async (productId, quantity, reason) => {
    setLoading(true);
    setError(null);
    try {
      const record = storeDeclareBreakage(productId, quantity, reason);
      if (import.meta.env.VITE_API_URL && record) {
        await apiCreateBreakage(record);
      }
      return record;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [storeDeclareBreakage]);

  const createRepackaging = useCallback(async (brokenProductId, brokenQty, newProductName, newProductQty, defaultPrice) => {
    setLoading(true);
    setError(null);
    try {
      const record = storeCreateRepackaging(brokenProductId, brokenQty, newProductName, newProductQty, defaultPrice);
      if (import.meta.env.VITE_API_URL && record) {
        await apiCreateRepackaging(record);
      }
      return record;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [storeCreateRepackaging]);

  return {
    breakages,
    repackagings,
    loading,
    error,
    declareBreakage,
    createRepackaging,
  };
};

export default useBreakages;
