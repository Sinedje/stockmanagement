/**
 * useCustomers.js
 * Manages customer accounts and transactions state.
 * Calls customerService for API operations; local state managed by StoreContext.
 */
import { useState, useCallback } from 'react';
import {
  createCustomer as apiCreateCustomer,
  addDeposit as apiAddDeposit,
  refundCustomer as apiRefundCustomer,
} from '../services/customerService';
import { useStore } from '../context/StoreContext';

const useCustomers = () => {
  const {
    customers,
    customerTransactions,
    addCustomer: storeAddCustomer,
    addCustomerDeposit: storeAddDeposit,
    refundCustomer: storeRefundCustomer,
  } = useStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addCustomer = useCallback(async (customerData) => {
    setLoading(true);
    setError(null);
    try {
      if (import.meta.env.VITE_API_URL) await apiCreateCustomer(customerData);
      return storeAddCustomer(customerData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [storeAddCustomer]);

  const addCustomerDeposit = useCallback(async (customerId, amount, method) => {
    setError(null);
    try {
      if (import.meta.env.VITE_API_URL) await apiAddDeposit(customerId, amount, method);
      return storeAddDeposit(customerId, amount, method);
    } catch (err) {
      setError(err.message);
    }
  }, [storeAddDeposit]);

  const refundCustomer = useCallback(async (customerId, amount) => {
    setError(null);
    try {
      if (import.meta.env.VITE_API_URL) await apiRefundCustomer(customerId, amount);
      return storeRefundCustomer(customerId, amount);
    } catch (err) {
      setError(err.message);
    }
  }, [storeRefundCustomer]);

  return {
    customers,
    customerTransactions,
    loading,
    error,
    addCustomer,
    addCustomerDeposit,
    refundCustomer,
  };
};

export default useCustomers;
