/**
 * storeService.js
 * Stores, transfers, stock entries, and inventory API calls.
 */
import api from './api';

const simulateDelay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

// ── Stores ────────────────────────────────────────────────────
export const fetchStores = async () => {
  if (import.meta.env.VITE_API_URL) {
    const response = await api.get('/stores');
    return response.data;
  }
  await simulateDelay();
  return null;
};

export const createStore = async (storeData) => {
  if (import.meta.env.VITE_API_URL) {
    const response = await api.post('/stores', storeData);
    return response.data;
  }
  await simulateDelay();
  return { ...storeData, id: Date.now() };
};

export const updateStore = async (id, updates) => {
  if (import.meta.env.VITE_API_URL) {
    const response = await api.put(`/stores/${id}`, updates);
    return response.data;
  }
  await simulateDelay();
  return { id, ...updates };
};

export const deleteStore = async (id) => {
  if (import.meta.env.VITE_API_URL) {
    await api.delete(`/stores/${id}`);
  }
  await simulateDelay();
  return { id };
};

// ── Transfers ─────────────────────────────────────────────────
export const fetchTransfers = async () => {
  if (import.meta.env.VITE_API_URL) {
    const response = await api.get('/transfers');
    return response.data;
  }
  await simulateDelay();
  return null;
};

export const createTransfer = async (transferData) => {
  if (import.meta.env.VITE_API_URL) {
    const response = await api.post('/transfers', transferData);
    return response.data;
  }
  await simulateDelay();
  return { ...transferData, id: Date.now() };
};

export const receiveTransfer = async (transferId, receivedBy) => {
  if (import.meta.env.VITE_API_URL) {
    const response = await api.patch(`/transfers/${transferId}/receive`, { receivedBy });
    return response.data;
  }
  await simulateDelay();
  return { id: transferId, status: 'completed', receivedBy };
};

// ── Stock entries ─────────────────────────────────────────────
export const fetchStockEntries = async (storeId) => {
  if (import.meta.env.VITE_API_URL) {
    const response = await api.get('/stock-entries', { params: { storeId } });
    return response.data;
  }
  await simulateDelay();
  return null;
};

export const createStockEntry = async (entryData) => {
  if (import.meta.env.VITE_API_URL) {
    const response = await api.post('/stock-entries', entryData);
    return response.data;
  }
  await simulateDelay();
  return { ...entryData, id: Date.now() };
};
