/**
 * productService.js
 * All product and category API calls.
 *
 * When VITE_API_URL is set, real HTTP requests are made via the Axios instance.
 * Otherwise, operations are simulated in-memory (local state is managed by the hook).
 */
import api from './api';
import { hasSupabaseSession, fetchProducts as sbProducts, fetchCategories as sbCategories } from './supabaseData';

const simulateDelay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

export const fetchProducts = async (storeId) => {
  if (await hasSupabaseSession()) return sbProducts(storeId);
  if (import.meta.env.VITE_API_URL) {
    const response = await api.get('/products', { params: { storeId } });
    return response.data;
  }
  await simulateDelay();
  return null; // Hook uses its own local state when null
};

export const createProduct = async (productData) => {
  if (import.meta.env.VITE_API_URL) {
    const response = await api.post('/products', productData);
    return response.data;
  }
  await simulateDelay();
  return { ...productData, id: Date.now() };
};

export const importProducts = async (productsData) => {
  if (import.meta.env.VITE_API_URL) {
    const response = await api.post('/products/import', { products: productsData });
    return response.data;
  }
  await simulateDelay();
  return { message: "Mock import successful" };
};

export const updateProduct = async (id, updates) => {
  if (import.meta.env.VITE_API_URL) {
    const response = await api.put(`/products/${id}`, updates);
    return response.data;
  }
  await simulateDelay();
  return { id, ...updates };
};

export const deleteProduct = async (id) => {
  if (import.meta.env.VITE_API_URL) {
    await api.delete(`/products/${id}`);
  }
  await simulateDelay();
  return { id };
};

export const bulkUpdateStock = async (items, entryMeta) => {
  if (import.meta.env.VITE_API_URL) {
    // Map items to the format the backend expects: { id, quantity }
    const updates = items.map(item => ({ id: item.productId, quantity: item.quantity }));
    const response = await api.post('/products/bulk-update', { updates });
    return response.data;
  }
  await simulateDelay();
  return { items, entryMeta };
};

export const fetchCategories = async () => {
  if (await hasSupabaseSession()) return sbCategories();
  if (import.meta.env.VITE_API_URL) {
    const response = await api.get('/categories');
    return response.data;
  }
  await simulateDelay();
  return null; // Hook manages locally
};

export const createCategory = async (name) => {
  if (import.meta.env.VITE_API_URL) {
    const response = await api.post('/categories', { name });
    return response.data;
  }
  await simulateDelay();
  return { name };
};
