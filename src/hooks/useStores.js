/**
 * useStores.js
 * Manages store, transfer, and stock-entry state.
 * Calls storeService for API operations; local state managed by StoreContext.
 */
import { useState, useCallback } from 'react';
import {
  createStore as apiCreateStore,
  updateStore as apiUpdateStore,
  deleteStore as apiDeleteStore,
  createTransfer as apiCreateTransfer,
  receiveTransfer as apiReceiveTransfer,
  createStockEntry as apiCreateStockEntry,
} from '../services/storeService';
import { useStore } from '../context/StoreContext';

const useStores = () => {
  const {
    stores,
    activeStoreId,
    activeStore,
    switchStore,
    addStore: storeAddStore,
    updateStore: storeUpdateStore,
    deleteStore: storeDeleteStore,
    transfers,
    createTransfer: storeCreateTransfer,
    receiveTransfer: storeReceiveTransfer,
    stockEntries,
    breakages,
    declareBreakage,
    repackagings,
    createRepackaging,
  } = useStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addStore = useCallback(async (storeData) => {
    setLoading(true);
    setError(null);
    try {
      if (import.meta.env.VITE_API_URL) {
        const saved = await apiCreateStore(storeData);
        // Use server-returned store (with real _id) for local state
        storeAddStore(saved || storeData);
      } else {
        storeAddStore(storeData);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [storeAddStore]);

  const updateStore = useCallback(async (id, updates) => {
    setError(null);
    try {
      if (import.meta.env.VITE_API_URL) {
        const saved = await apiUpdateStore(id, updates);
        storeUpdateStore(id, saved || updates);
      } else {
        storeUpdateStore(id, updates);
      }
    } catch (err) {
      setError(err.message);
    }
  }, [storeUpdateStore]);

  const deleteStore = useCallback(async (id) => {
    setError(null);
    try {
      if (import.meta.env.VITE_API_URL) await apiDeleteStore(id);
      storeDeleteStore(id);
    } catch (err) {
      setError(err.message);
    }
  }, [storeDeleteStore]);

  const createTransfer = useCallback(async (toStoreId, items, notes) => {
    setLoading(true);
    setError(null);
    try {
      const result = storeCreateTransfer(toStoreId, items, notes);
      if (import.meta.env.VITE_API_URL) await apiCreateTransfer(result);
      return result;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [storeCreateTransfer]);

  const receiveTransfer = useCallback(async (transferId) => {
    setError(null);
    try {
      if (import.meta.env.VITE_API_URL) await apiReceiveTransfer(transferId);
      storeReceiveTransfer(transferId);
    } catch (err) {
      setError(err.message);
    }
  }, [storeReceiveTransfer]);

  return {
    stores,
    activeStoreId,
    activeStore,
    switchStore,
    addStore,
    updateStore,
    deleteStore,
    transfers,
    createTransfer,
    receiveTransfer,
    stockEntries,
    breakages,
    declareBreakage,
    repackagings,
    createRepackaging,
    loading,
    error,
  };
};

export default useStores;
