/**
 * useSales.js
 * Manages cart, sales, expenses, versements, and cash session state.
 * Calls saleService for API operations; local state managed by StoreContext.
 * Pattern: API first → use server response to update local state (preserves MongoDB _id).
 */
import { useState, useCallback } from 'react';
import {
  createSale as apiCreateSale,
  createInvoiceSale as apiCreateInvoiceSale,
  cancelSale as apiCancelSale,
  recordPayment as apiRecordPayment,
  processReturn as apiProcessReturn,
  deliverSale as apiDeliverSale,
  deliverPartial as apiDeliverPartial,
  unlockDelivery as apiUnlockDelivery,
  createExpense as apiCreateExpense,
  createVersement as apiCreateVersement,
  initCashFund as apiInitCashFund,
  closeCashSession as apiCloseCashSession,
} from '../services/saleService';
import { useStore } from '../context/StoreContext';

const useSales = () => {
  const {
    sales,
    allSales,
    cart,
    cartTotal,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    completeSale: storeCompleteSale,
    completeInvoiceSale: storeCompleteInvoiceSale,
    cancelSale: storeCancelSale,
    recordInvoicePayment: storeRecordInvoicePayment,
    processReturn: storeProcessReturn,
    deliverSale: storeDeliverSale,
    deliverPartial: storeDeliverPartial,
    unlockDelivery: storeUnlockDelivery,
    expenses,
    addExpense: storeAddExpense,
    versements,
    addVersement: storeAddVersement,
    initialCashFund,
    isCashFundInitialized,
    cashInitializationDate,
    initializeCashFund: storeInitializeCashFund,
    closeCashSession: storeCloseCashSession,
    currentCashBalance,
    lastClosingBalance,
    cashReports,
    todaySales,
    todayRevenue,
    totalRevenue,
    nextInvoiceNumber,
    currentCashierCode,
    invoiceCounters,
  } = useStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Cart operations (local only — no server round-trip needed) ──

  // ── Completing a sale ─────────────────────────────────────────
  const completeSale = useCallback(async (paymentMethod) => {
    setLoading(true);
    setError(null);
    try {
      const sale = storeCompleteSale(paymentMethod);
      if (import.meta.env.VITE_API_URL && sale) {
        const saved = await apiCreateSale(sale);
        // Patch local state id with server _id if returned
        if (saved?.id && saved.id !== sale.id) {
          storeCancelSale(sale.id);   // remove optimistic
          storeCompleteSale && null; // already in state, skip re-add
        }
      }
      return sale;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [storeCompleteSale, storeCancelSale]);

  const completeInvoiceSale = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const sale = storeCompleteInvoiceSale(...args);
      if (import.meta.env.VITE_API_URL && sale) {
        await apiCreateInvoiceSale(sale);
      }
      return sale;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [storeCompleteInvoiceSale]);

  const cancelSale = useCallback(async (saleId) => {
    setError(null);
    try {
      if (import.meta.env.VITE_API_URL) await apiCancelSale(saleId);
      storeCancelSale(saleId);
    } catch (err) {
      setError(err.message);
    }
  }, [storeCancelSale]);

  const recordInvoicePayment = useCallback(async (saleId, amount, method) => {
    setError(null);
    try {
      if (import.meta.env.VITE_API_URL) {
        const saved = await apiRecordPayment(saleId, amount, method);
        // Update local state with server-confirmed sale
        if (saved) storeRecordInvoicePayment(saleId, amount, method);
        else storeRecordInvoicePayment(saleId, amount, method);
      } else {
        storeRecordInvoicePayment(saleId, amount, method);
      }
    } catch (err) {
      setError(err.message);
    }
  }, [storeRecordInvoicePayment]);

  const processReturn = useCallback(async (originalSale, itemsToReturn) => {
    setError(null);
    try {
      if (import.meta.env.VITE_API_URL) await apiProcessReturn(originalSale.id, itemsToReturn);
      return storeProcessReturn(originalSale, itemsToReturn);
    } catch (err) {
      setError(err.message);
    }
  }, [storeProcessReturn]);

  const deliverSale = useCallback(async (saleId, storeId) => {
    setError(null);
    try {
      if (import.meta.env.VITE_API_URL) await apiDeliverSale(saleId, storeId);
      storeDeliverSale(saleId, storeId);
    } catch (err) {
      setError(err.message);
    }
  }, [storeDeliverSale]);

  const deliverPartial = useCallback(async (saleId, storeId, deliveries) => {
    setError(null);
    try {
      if (import.meta.env.VITE_API_URL) await apiDeliverPartial(saleId, storeId, deliveries);
      storeDeliverPartial(saleId, storeId, deliveries);
    } catch (err) {
      setError(err.message);
    }
  }, [storeDeliverPartial]);

  const unlockDelivery = useCallback(async (saleId) => {
    setError(null);
    try {
      if (import.meta.env.VITE_API_URL) await apiUnlockDelivery(saleId);
      storeUnlockDelivery(saleId);
    } catch (err) {
      setError(err.message);
    }
  }, [storeUnlockDelivery]);

  // ── Expenses ──────────────────────────────────────────────────
  const addExpense = useCallback(async (expense) => {
    setError(null);
    try {
      if (import.meta.env.VITE_API_URL) {
        const saved = await apiCreateExpense(expense);
        storeAddExpense(saved || expense);
      } else {
        storeAddExpense(expense);
      }
    } catch (err) {
      setError(err.message);
    }
  }, [storeAddExpense]);

  // ── Versements ────────────────────────────────────────────────
  const addVersement = useCallback(async (amount) => {
    setError(null);
    try {
      if (import.meta.env.VITE_API_URL) {
        const saved = await apiCreateVersement({ amount });
        storeAddVersement(saved ? saved.amount : amount);
      } else {
        storeAddVersement(amount);
      }
    } catch (err) {
      setError(err.message);
    }
  }, [storeAddVersement]);

  // ── Cash session ──────────────────────────────────────────────
  const initializeCashFund = useCallback(async (amount) => {
    setError(null);
    try {
      if (import.meta.env.VITE_API_URL) await apiInitCashFund({ amount });
      storeInitializeCashFund(amount);
    } catch (err) {
      setError(err.message);
    }
  }, [storeInitializeCashFund]);

  const closeCashSession = useCallback(async (finalBalance, sessionStats) => {
    setError(null);
    try {
      if (import.meta.env.VITE_API_URL) await apiCloseCashSession({ finalBalance, ...sessionStats });
      storeCloseCashSession(finalBalance, sessionStats);
    } catch (err) {
      setError(err.message);
    }
  }, [storeCloseCashSession]);

  return {
    // State
    sales,
    allSales,
    cart,
    cartTotal,
    expenses,
    versements,
    initialCashFund,
    isCashFundInitialized,
    cashInitializationDate,
    currentCashBalance,
    lastClosingBalance,
    cashReports,
    todaySales,
    todayRevenue,
    totalRevenue,
    nextInvoiceNumber,
    currentCashierCode,
    invoiceCounters,
    loading,
    error,
    // Cart
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    // Sales
    completeSale,
    completeInvoiceSale,
    cancelSale,
    recordInvoicePayment,
    processReturn,
    deliverSale,
    deliverPartial,
    unlockDelivery,
    // Finance
    addExpense,
    addVersement,
    initializeCashFund,
    closeCashSession,
  };
};

export default useSales;
