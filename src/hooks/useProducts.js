/**
 * useProducts.js
 * Manages product and category state.
 * Calls productService for API operations; maintains local state for offline/mock mode.
 */
import { useState, useCallback } from 'react';
import {
  createProduct as apiCreateProduct,
  updateProduct as apiUpdateProduct,
  deleteProduct as apiDeleteProduct,
  bulkUpdateStock as apiBulkUpdateStock,
  createCategory as apiCreateCategory,
  importProducts as apiImportProducts,
} from '../services/productService';
import { createStockEntry as apiCreateStockEntry } from '../services/storeService';
import { useStore } from '../context/StoreContext';

const useProducts = () => {
  const {
    products,
    allProducts,
    categories,
    addProduct: storeAddProduct,
    updateProduct: storeUpdateProduct,
    deleteProduct: storeDeleteProduct,
    bulkUpdateStock: storeBulkUpdateStock,
    addStockEntry: storeAddStockEntry,
    refreshProducts: storeRefreshProducts,
    addCategory: storeAddCategory,
    lowStockProducts,
    totalStockValue,
    activeStoreId,
  } = useStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addProduct = useCallback(async (productData) => {
    setLoading(true);
    setError(null);
    try {
      // Inject the current activeStoreId if not already present
      const payload = { ...productData, storeId: productData.storeId || activeStoreId };
      if (import.meta.env.VITE_API_URL) {
        const saved = await apiCreateProduct(payload);
        // Use server-returned product (with real _id → id) for local state
        storeAddProduct(saved || payload);
      } else {
        storeAddProduct(payload);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [storeAddProduct, activeStoreId]);

  const importProducts = useCallback(async (productsData) => {
    setLoading(true);
    setError(null);
    try {
      const payload = productsData.map(p => ({ ...p, storeId: p.storeId || activeStoreId }));
      if (import.meta.env.VITE_API_URL) {
        await apiImportProducts(payload);
        await storeRefreshProducts(); // Refresh to get all the new/updated products with correct IDs
      } else {
        // Offline mock
        payload.forEach(p => storeAddProduct(p));
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [storeAddProduct, storeRefreshProducts, activeStoreId]);

  const updateProduct = useCallback(async (id, updates) => {
    setLoading(true);
    setError(null);
    try {
      if (import.meta.env.VITE_API_URL) {
        const saved = await apiUpdateProduct(id, updates);
        storeUpdateProduct(id, saved || updates);
      } else {
        storeUpdateProduct(id, updates);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [storeUpdateProduct]);

  const deleteProduct = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      if (import.meta.env.VITE_API_URL) await apiDeleteProduct(id);
      storeDeleteProduct(id);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [storeDeleteProduct]);

  const bulkUpdateStock = useCallback(async (items, entryMeta) => {
    setLoading(true);
    setError(null);
    try {
      if (import.meta.env.VITE_API_URL) await apiBulkUpdateStock(items, entryMeta);
      storeBulkUpdateStock(items, entryMeta);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [storeBulkUpdateStock]);

  /**
   * receiveStock — preferred function for stock receptions.
   * Calls the /stock-entries endpoint which:
   *   1. Creates / updates product stock in the database
   *   2. Creates a StockEntry document for history
   * Then synchronises local state so the UI reflects the new quantities
   * without requiring a full page reload.
   *
   * @param {Array}  items      - Array of { productId, name, quantity, cost }
   * @param {Object} entryMeta - { supplier, noteNumber, storeId }
   */
  const receiveStock = useCallback(async (items, entryMeta) => {
    setLoading(true);
    setError(null);
    try {
      if (import.meta.env.VITE_API_URL) {
        // Server creates StockEntry + updates Product.stock in MongoDB
        const savedEntry = await apiCreateStockEntry({
          supplier: entryMeta.supplier,
          noteNumber: entryMeta.noteNumber,
          storeId: entryMeta.storeId || activeStoreId,
          items,
        });
        
        // The backend might have cloned a product from another store.
        // Instead of a risky optimistic update with the wrong productId, 
        // we just refresh the whole product list to get the real IDs.
        if (savedEntry) {
          storeAddStockEntry(savedEntry);
          await storeRefreshProducts();
        }
      } else {
        // Offline mode: full local update including stockEntries creation
        storeBulkUpdateStock(items, entryMeta);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [storeBulkUpdateStock, storeAddStockEntry, activeStoreId]);

  const addCategory = useCallback(async (name) => {
    setError(null);
    try {
      if (import.meta.env.VITE_API_URL) await apiCreateCategory(name);
      storeAddCategory(name);
    } catch (err) {
      setError(err.message);
    }
  }, [storeAddCategory]);

  return {
    products,
    allProducts,
    categories,
    lowStockProducts,
    totalStockValue,
    loading,
    error,
    addProduct,
    importProducts,
    updateProduct,
    deleteProduct,
    bulkUpdateStock,
    receiveStock,
    addCategory,
    refreshProducts: storeRefreshProducts,
  };
};

export default useProducts;
