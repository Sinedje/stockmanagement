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
      : '/customers/transactions';
    const response = await api.get(endpoint);
    return response.data;
  }
  await simulateDelay();
  return null;
};

export const addDeposit = async (customerId, amount, method, reference) => {
  if (import.meta.env.VITE_API_URL) {
    const response = await api.post(`/customers/${customerId}/deposit`, { amount, method, reference });
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
    reference: `DEP-${Math.floor(1000 + Math.random() * 9000)}`,
  };
};

export const refundCustomer = async (customerId, amount, reference) => {
  if (import.meta.env.VITE_API_URL) {
    const response = await api.post(`/customers/${customerId}/refund`, { amount, reference });
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
    reference: `REM-${Math.floor(1000 + Math.random() * 9000)}`,
  };
};
