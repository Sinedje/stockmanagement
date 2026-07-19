/**
 * saleService.js
 * All sales, invoices, expenses, versements and returns API calls.
 */
import api from './api';

const simulateDelay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

export const fetchSales = async (filters = {}) => {
  if (import.meta.env.VITE_API_URL) {
    const response = await api.get('/sales', { params: filters });
    return response.data;
  }
  await simulateDelay();
  return null;
};

export const createSale = async (saleData) => {
  if (import.meta.env.VITE_API_URL) {
    const response = await api.post('/sales', saleData);
    return response.data;
  }
  await simulateDelay();
  return { ...saleData, id: Date.now() };
};

export const createInvoiceSale = async (saleData) => {
  if (import.meta.env.VITE_API_URL) {
    const response = await api.post('/sales/invoice', saleData);
    return response.data;
  }
  await simulateDelay();
  return { ...saleData, id: Date.now() };
};

export const cancelSale = async (saleId) => {
  if (import.meta.env.VITE_API_URL) {
    const response = await api.patch(`/sales/${saleId}/cancel`);
    return response.data;
  }
  await simulateDelay();
  return { id: saleId, status: 'cancelled' };
};

export const recordPayment = async (saleId, amount, method) => {
  if (import.meta.env.VITE_API_URL) {
    const response = await api.post(`/sales/${saleId}/payment`, { amount, method });
    return response.data;
  }
  await simulateDelay();
  return { saleId, amount, method };
};

export const processReturn = async (originalSaleId, itemsToReturn) => {
  if (import.meta.env.VITE_API_URL) {
    const response = await api.post(`/sales/${originalSaleId}/return`, { items: itemsToReturn });
    return response.data;
  }
  await simulateDelay();
  return { originalSaleId, itemsToReturn };
};

export const deliverSale = async (saleId, storeId) => {
  if (import.meta.env.VITE_API_URL) {
    const response = await api.patch(`/sales/${saleId}/deliver`, { storeId });
    return response.data;
  }
  await simulateDelay();
  return { saleId, storeId };
};

export const deliverPartial = async (saleId, storeId, deliveries) => {
  if (import.meta.env.VITE_API_URL) {
    const response = await api.patch(`/sales/${saleId}/deliver-partial`, { storeId, deliveries });
    return response.data;
  }
  await simulateDelay();
  return { saleId, storeId, deliveries };
};

export const unlockDelivery = async (saleId) => {
  if (import.meta.env.VITE_API_URL) {
    const response = await api.patch(`/sales/${saleId}/unlock-delivery`);
    return response.data;
  }
  await simulateDelay();
  return { saleId };
};

// ── Expenses ──────────────────────────────────────────────────
export const fetchExpenses = async () => {
  if (import.meta.env.VITE_API_URL) {
    const response = await api.get('/expenses');
    return response.data;
  }
  await simulateDelay();
  return [];
};

export const createExpense = async (expenseData) => {
  if (import.meta.env.VITE_API_URL) {
    const response = await api.post('/expenses', expenseData);
    return response.data;
  }
  await simulateDelay();
  return { ...expenseData, id: Date.now() };
};

// ── Versements (cash handover) ────────────────────────────────
export const fetchVersements = async () => {
  if (import.meta.env.VITE_API_URL) {
    const response = await api.get('/versements');
    return response.data;
  }
  await simulateDelay();
  return [];
};

export const createVersement = async (versementData) => {
  if (import.meta.env.VITE_API_URL) {
    const response = await api.post('/versements', versementData);
    return response.data;
  }
  await simulateDelay();
  return { ...versementData, id: Date.now() };
};

// ── Cash session ──────────────────────────────────────────────
export const fetchCashReports = async () => {
  if (import.meta.env.VITE_API_URL) {
    const response = await api.get('/cash/reports');
    return response.data;
  }
  await simulateDelay();
  return [];
};

export const initCashFund = async (payload) => {
  if (import.meta.env.VITE_API_URL) {
    const response = await api.post('/cash/init', payload);
    return response.data;
  }
  await simulateDelay();
  return payload;
};

export const closeCashSession = async (payload) => {
  if (import.meta.env.VITE_API_URL) {
    const response = await api.post('/cash/close', payload);
    return response.data;
  }
  await simulateDelay();
  return payload;
};
