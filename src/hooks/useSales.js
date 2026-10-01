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
  fetchSales as apiFetchSales,
  deleteExpense as apiDeleteExpense,
  deleteVersement as apiDeleteVersement,
} from '../services/saleService';
import { useStore } from '../context/StoreContext';
import { enqueueSale } from '../offline/pendingSales';
import { hasSupabaseSession } from '../services/supabaseData';

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
    removeExpense: storeRemoveExpense,
    versements,
    addVersement: storeAddVersement,
    removeVersement: storeRemoveVersement,
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
    refreshProducts,
    refreshSales,
    currentUser,
    activeStoreId,
  } = useStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Cart operations (local only — no server round-trip needed) ──

  // ── Completing a sale ─────────────────────────────────────────
  const completeSale = useCallback(async (paymentMethod) => {
    setLoading(true);
    setError(null);
    const sale = storeCompleteSale(paymentMethod);
    try {
      if (sale) {
        const saved = await apiCreateSale(sale);
        if (saved?.id && saved.id !== sale.id) {
          storeCancelSale(sale.id);
          // (storeCompleteSale handles local state updates, we rely on refresh via websockets or reload for perfect sync)
        }
      }
      return sale;
    } catch (err) {
      console.warn('Vente non transmise au serveur :', err?.message);
      if (sale) {
        try {
          await enqueueSale(sale, 'direct');
          setError('Vente enregistrée sur ce poste. Elle sera transmise dès le retour du réseau.');
          return sale;
        } catch (queueErr) {
          console.error('Mise en file impossible :', queueErr?.message);
          setError(
            'ATTENTION : la vente n\'a pu être ni transmise ni enregistrée sur ce poste. '
            + 'Notez le numéro de facture ' + (sale.invoiceNumber || '') + ' avant de continuer.'
          );
          return sale;
        }
      }
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
      if (!sale) return null;

      try {
        await apiCreateInvoiceSale(sale);
      } catch (apiErr) {
        console.warn('Vente non transmise au serveur :', apiErr?.message);
        try {
          await enqueueSale(sale, 'invoice');
          setError('Vente enregistrée sur ce poste. Elle sera transmise dès le retour du réseau.');
        } catch (queueErr) {
          console.error('Mise en file impossible :', queueErr?.message);
          setError(
            'ATTENTION : la vente n\'a pu être ni transmise ni enregistrée sur ce poste. '
            + 'Notez le numéro de facture ' + (sale.invoiceNumber || '') + ' avant de continuer.'
          );
        }
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
      await apiCancelSale(saleId);
      storeCancelSale(saleId);
    } catch (err) {
      setError(err.message);
    }
  }, [storeCancelSale]);

  const recordInvoicePayment = useCallback(async (saleId, amount, method) => {
    setError(null);
    try {
      const saved = await apiRecordPayment(saleId, amount, method);
      storeRecordInvoicePayment(saleId, amount, method);
    } catch (err) {
      setError(err.message);
    }
  }, [storeRecordInvoicePayment]);

  const processReturn = useCallback(async (originalSale, itemsToReturn) => {
    setError(null);
    try {
      await apiProcessReturn(originalSale.id, itemsToReturn);
      return storeProcessReturn(originalSale, itemsToReturn);
    } catch (err) {
      setError(err.message);
    }
  }, [storeProcessReturn]);

  const deliverSale = useCallback(async (saleId, storeId) => {
    setError(null);
    try {
      if (await hasSupabaseSession()) {
        await apiDeliverSale(saleId, storeId);
        await refreshProducts();
        await refreshSales();
      } else {
        storeDeliverSale(saleId, storeId);
      }
    } catch (err) {
      setError(err.message);
    }
  }, [storeDeliverSale, refreshProducts, refreshSales]);

  const deliverPartial = useCallback(async (saleId, storeId, deliveries) => {
    setError(null);
    try {
      if (await hasSupabaseSession()) {
        await apiDeliverPartial(saleId, storeId, deliveries);
        await refreshProducts();
        await refreshSales();
      } else {
        storeDeliverPartial(saleId, storeId, deliveries);
      }
    } catch (err) {
      setError(err.message);
    }
  }, [storeDeliverPartial, refreshProducts, refreshSales]);

  const unlockDelivery = useCallback(async (saleId) => {
    setError(null);
    try {
      await apiUnlockDelivery(saleId);
      storeUnlockDelivery(saleId);
    } catch (err) {
      setError(err.message);
    }
  }, [storeUnlockDelivery]);

  // ── Expenses ──────────────────────────────────────────────────
  const addExpense = useCallback(async (expense) => {
    setError(null);
    try {
      const payload = {
        ...expense,
        cashier: currentUser?.name || 'Inconnu',
        storeId: activeStoreId,
      };
      const saved = await apiCreateExpense(payload);
      storeAddExpense(saved || payload);
    } catch (err) {
      setError(err.message);
    }
  }, [storeAddExpense, currentUser, activeStoreId]);

  // ── Versements ────────────────────────────────────────────────
  const addVersement = useCallback(async (amount) => {
    setError(null);
    try {
      const payload = {
        amount,
        cashier: currentUser?.name || 'Inconnu',
        storeId: activeStoreId,
      };
      const saved = await apiCreateVersement(payload);
      storeAddVersement(saved ? saved : amount);
    } catch (err) {
      setError(err.message);
    }
  }, [storeAddVersement, currentUser, activeStoreId]);

  const removeExpense = useCallback(async (id) => {
    setError(null);
    try {
      await apiDeleteExpense(id);
      storeRemoveExpense(id);
    } catch (err) {
      setError(err.message);
    }
  }, [storeRemoveExpense]);

  const removeVersement = useCallback(async (id) => {
    setError(null);
    try {
      await apiDeleteVersement(id);
      storeRemoveVersement(id);
    } catch (err) {
      setError(err.message);
    }
  }, [storeRemoveVersement]);

  // ── Cash session ──────────────────────────────────────────────
  const initializeCashFund = useCallback(async (amount) => {
    setError(null);
    try {
      await apiInitCashFund({ 
        amount,
        cashier: currentUser?.name || 'Inconnu',
        storeId: activeStoreId, 
      });
      storeInitializeCashFund(amount);
    } catch (err) {
      setError(err.message);
    }
  }, [storeInitializeCashFund, currentUser, activeStoreId]);

  const closeCashSession = useCallback(async (finalBalance, sessionStats) => {
    setError(null);
    try {
      const saved = await apiCloseCashSession({ 
        finalBalance, 
        ...sessionStats,
        cashier: currentUser?.name || 'Inconnu',
        storeId: activeStoreId,
      });
      storeCloseCashSession(finalBalance, { ...sessionStats, id: saved?._id || saved?.id, date: saved?.date });
    } catch (err) {
      setError(err.message);
    }
  }, [storeCloseCashSession, currentUser, activeStoreId]);

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
    removeExpense,
    addVersement,
    removeVersement,
    initializeCashFund,
    closeCashSession,
  };
};

export default useSales;
