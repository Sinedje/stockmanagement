/**
 * useProducts.js
 * Manages product and category state.
 *
 * Toutes les opérations passent par productService / storeService, qui
 * routent vers Supabase si une session existe. Le mode hors-ligne (state
 * local uniquement) n'est utilisé qu'en dernier recours.
 */
import { useState, useCallback } from 'react';
import {
  createProduct as apiCreateProduct,
  updateProduct as apiUpdateProduct,
  deleteProduct as apiDeleteProduct,
  createCategory as apiCreateCategory,
  importProducts as apiImportProducts,
} from '../services/productService';
import { createStockEntry as supabaseCreateStockEntry } from '../services/storeService';
import { hasSupabaseSession } from '../services/supabaseData';
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

  // ── Créer un produit ────────────────────────────────────────────────────
  const addProduct = useCallback(async (productData) => {
    setLoading(true);
    setError(null);
    try {
      const payload = { ...productData, storeId: productData.storeId || activeStoreId };
      // apiCreateProduct route déjà vers Supabase si session existe
      const saved = await apiCreateProduct(payload);
      if (saved?.id) {
        storeAddProduct(saved);
      } else {
        storeAddProduct(payload);
      }
      // Rafraîchir pour avoir les vrais IDs UUID de la BDD
      await storeRefreshProducts();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [storeAddProduct, storeRefreshProducts, activeStoreId]);

  // ── Import Excel ────────────────────────────────────────────────────────
  const importProducts = useCallback(async (productsData) => {
    setLoading(true);
    setError(null);
    try {
      const payload = productsData.map(p => ({ ...p, storeId: p.storeId || activeStoreId }));
      await apiImportProducts(payload);
      await storeRefreshProducts();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [storeRefreshProducts, activeStoreId]);

  // ── Modifier un produit ─────────────────────────────────────────────────
  const updateProduct = useCallback(async (id, updates) => {
    setLoading(true);
    setError(null);
    try {
      const saved = await apiUpdateProduct(id, updates);
      storeUpdateProduct(id, saved || updates);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [storeUpdateProduct]);

  // ── Supprimer un produit ────────────────────────────────────────────────
  const deleteProduct = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await apiDeleteProduct(id);
      storeDeleteProduct(id);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [storeDeleteProduct]);

  // ── Mise à jour de stock en masse (legacy) ──────────────────────────────
  const bulkUpdateStock = useCallback(async (items, entryMeta) => {
    setLoading(true);
    setError(null);
    try {
      storeBulkUpdateStock(items, entryMeta);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [storeBulkUpdateStock]);

  // ── Entrée de stock (réception) ─────────────────────────────────────────
  const receiveStock = useCallback(async (items, entryMeta) => {
    setLoading(true);
    setError(null);
    try {
      const isOnline = await hasSupabaseSession();
      if (isOnline) {
        const savedEntry = await supabaseCreateStockEntry({
          supplier: entryMeta.supplier,
          noteNumber: entryMeta.noteNumber,
          storeId: entryMeta.storeId || activeStoreId,
          items,
        });
        if (savedEntry) {
          storeAddStockEntry(savedEntry);
          await storeRefreshProducts();
        }
      } else {
        storeBulkUpdateStock(items, entryMeta);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [storeBulkUpdateStock, storeAddStockEntry, storeRefreshProducts, activeStoreId]);

  // ── Ajouter une catégorie ───────────────────────────────────────────────
  const addCategory = useCallback(async (name) => {
    setError(null);
    try {
      await apiCreateCategory(name);
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

