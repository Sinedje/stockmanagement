import express from 'express';
import {
  getSales, createSale, createInvoiceSale, cancelSale, deliverSale, 
  deliverPartial, unlockDelivery, recordPayment, processReturn,
  getExpenses, createExpense, getVersements, createVersement, initCashFund, closeCashSession, getCashReports
} from '../controllers/sales.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Sales endpoints
router.get('/sales', getSales);
router.post('/sales', createSale);
router.post('/sales/invoice', createInvoiceSale);
router.patch('/sales/:id/cancel', cancelSale);
router.patch('/sales/:id/deliver', deliverSale);
router.patch('/sales/:id/deliver-partial', deliverPartial);
router.post('/sales/:id/return', processReturn);
router.post('/sales/:id/payment', recordPayment);
router.patch('/sales/:id/unlock-delivery', authorize('manager', 'ceo'), unlockDelivery);

// Expenses & Versements
router.get('/expenses', getExpenses);
router.post('/expenses', createExpense);
router.get('/versements', getVersements);
router.post('/versements', createVersement);

// Cashier sessions
router.post('/cash/init', initCashFund);
router.post('/cash/close', closeCashSession);
router.get('/cash/reports', getCashReports);

export default router;
