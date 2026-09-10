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
} from '../services/saleService';
import { useStore } from '../context/StoreContext';
import { enqueueSale } from '../offline/pendingSales';

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
      // La vente est déjà passée en caisse : la laisser remonter en exception
      // la ferait disparaître. On la met en file comme l'autre chemin.
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
      // 1. Always update local state first (works offline too)
      const sale = storeCompleteInvoiceSale(...args);
      if (!sale) return null;

      // 2. Try to persist to server — failure here should NOT block the receipt
      if (import.meta.env.VITE_API_URL) {
        try {
          await apiCreateInvoiceSale(sale);
        } catch (apiErr) {
          console.warn('Vente non transmise au serveur :', apiErr?.message);
          // Le serveur n'a pas pris la vente. Elle est écrite sur le disque du
          // poste : sans cela, elle ne vivait que dans l'état React et
          // disparaissait au premier rafraîchissement, alors que le client
          // avait payé.
          try {
            await enqueueSale(sale, 'invoice');
            setError('Vente enregistrée sur ce poste. Elle sera transmise dès le retour du réseau.');
          } catch (queueErr) {
            // Dernier recours : on ne peut ni transmettre ni conserver.
            // Mieux vaut le dire franchement que laisser croire à un succès.
            console.error('Mise en file impossible :', queueErr?.message);
            setError(
              'ATTENTION : la vente n\'a pu être ni transmise ni enregistrée sur ce poste. '
              + 'Notez le numéro de facture ' + (sale.invoiceNumber || '') + ' avant de continuer.'
            );
          }
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
      if (import.meta.env.VITE_API_URL) {
        await apiDeliverSale(saleId, storeId);
        // Resync products and sales from server to reflect physical stock and delivery status changes
        await refreshProducts();
        await refreshSales();
      }
      storeDeliverSale(saleId, storeId);
    } catch (err) {
      setError(err.message);
    }
  }, [storeDeliverSale, refreshProducts, refreshSales]);

  const deliverPartial = useCallback(async (saleId, storeId, deliveries) => {
    setError(null);
    try {
      // Convert array [{productId, qtyNow}] to object {[productId]: qty} expected by server
      const deliveriesObj = {};
      deliveries.forEach(d => {
        deliveriesObj[d.productId] = d.qtyNow;
      });
      if (import.meta.env.VITE_API_URL) {
        await apiDeliverPartial(saleId, storeId, deliveriesObj);
        // Resync products and sales from server
        await refreshProducts();
        await refreshSales();
      }
      storeDeliverPartial(saleId, storeId, deliveries);
    } catch (err) {
      setError(err.message);
    }
  }, [storeDeliverPartial, refreshProducts, refreshSales]);

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
      const payload = {
        ...expense,
        cashier: currentUser?.name || 'Inconnu',
        storeId: activeStoreId,
      };
      if (import.meta.env.VITE_API_URL) {
        const saved = await apiCreateExpense(payload);
        storeAddExpense(saved || payload);
      } else {
        storeAddExpense(payload);
      }
    } catch (err) {
      setError(err.message);
    }
  }, [storeAddExpense]);

  // ── Versements ────────────────────────────────────────────────
  const addVersement = useCallback(async (amount) => {
    setError(null);
    try {
      const payload = {
        amount,
        cashier: currentUser?.name || 'Inconnu',
        storeId: activeStoreId,
      };
      if (import.meta.env.VITE_API_URL) {
        const saved = await apiCreateVersement(payload);
        storeAddVersement(saved ? saved : amount);
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
      if (import.meta.env.VITE_API_URL) {
        await apiInitCashFund({ 
          amount,
          cashier: currentUser?.name || 'Inconnu',
          storeId: activeStoreId, 
        });
      }
      storeInitializeCashFund(amount);
    } catch (err) {
      setError(err.message);
    }
  }, [storeInitializeCashFund]);

  const closeCashSession = useCallback(async (finalBalance, sessionStats) => {
    setError(null);
    try {
      if (import.meta.env.VITE_API_URL) {
        const saved = await apiCloseCashSession({ 
          finalBalance, 
          ...sessionStats,
          cashier: currentUser?.name || 'Inconnu',
          storeId: activeStoreId,
        });
        storeCloseCashSession(finalBalance, { ...sessionStats, id: saved._id || saved.id, date: saved.date });
      } else {
        storeCloseCashSession(finalBalance, sessionStats);
      }
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
    addVersement,
    initializeCashFund,
    closeCashSession,
  };
};

export default useSales;
