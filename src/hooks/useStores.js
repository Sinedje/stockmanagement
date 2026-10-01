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
    refreshProducts,
    refreshTransfers,
  } = useStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addStore = useCallback(async (storeData) => {
    setLoading(true);
    setError(null);
    try {
      const saved = await apiCreateStore(storeData);
      storeAddStore(saved || storeData);
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
      const saved = await apiUpdateStore(id, updates);
      storeUpdateStore(id, saved || updates);
    } catch (err) {
      setError(err.message);
    }
  }, [storeUpdateStore]);

  const deleteStore = useCallback(async (id) => {
    setError(null);
    try {
      await apiDeleteStore(id);
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
      await apiCreateTransfer(result);
      await refreshProducts(); // Resync local physical stock with DB
      await refreshTransfers(); // Get correct MongoDB _id for the new transfer
      return result;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [storeCreateTransfer, refreshProducts, refreshTransfers]);

  const receiveTransfer = useCallback(async (transferId) => {
    setError(null);
    try {
      await apiReceiveTransfer(transferId);
      await refreshProducts(); // Resync destination local physical stock with DB
      await refreshTransfers(); // Update status of transfer from backend
      storeReceiveTransfer(transferId);
    } catch (err) {
      setError(err.message);
    }
  }, [storeReceiveTransfer, refreshProducts, refreshTransfers]);

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
