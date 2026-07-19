/**
 * customerService.js
 * Customer accounts, deposits and refund API calls.
 */
import api from './api';

const simulateDelay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

export const fetchCustomers = async () => {
  if (import.meta.env.VITE_API_URL) {
    const response = await api.get('/customers');
    return response.data;
  }
  await simulateDelay();
  return null;
};

export const createCustomer = async (customerData) => {
  if (import.meta.env.VITE_API_URL) {
    const response = await api.post('/customers', customerData);
    return response.data;
  }
  await simulateDelay();
  return { ...customerData, id: Date.now(), balance: 0, totalSpent: 0 };
};

export const fetchCustomerTransactions = async (customerId) => {
  if (import.meta.env.VITE_API_URL) {
    const endpoint = customerId
      ? `/customers/${customerId}/transactions`
      : '/customer-transactions';
    const response = await api.get(endpoint);
    return response.data;
  }
  await simulateDelay();
  return null;
};

export const addDeposit = async (customerId, amount, method) => {
  if (import.meta.env.VITE_API_URL) {
    const response = await api.post(`/customers/${customerId}/deposit`, { amount, method });
    return response.data;
  }
  await simulateDelay();
  return {
    id: Date.now(),
    customerId,
    type: 'deposit',
    amount,
    method,
    date: new Date().toISOString(),
    reference: `DEP-${Date.now()}`,
  };
};

export const refundCustomer = async (customerId, amount) => {
  if (import.meta.env.VITE_API_URL) {
    const response = await api.post(`/customers/${customerId}/refund`, { amount });
    return response.data;
  }
  await simulateDelay();
  return {
    id: Date.now(),
    customerId,
    type: 'refund',
    amount: -amount,
    method: 'Espèces',
    date: new Date().toISOString(),
    reference: `RMB-${Date.now()}`,
  };
};
