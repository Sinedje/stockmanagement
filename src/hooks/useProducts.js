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
} from '../services/productService';
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
  }, [storeAddProduct]);

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
    updateProduct,
    deleteProduct,
    bulkUpdateStock,
    addCategory,
  };
};

export default useProducts;
