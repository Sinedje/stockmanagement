import express from 'express';
import {
  getStores, createStore, updateStore, deleteStore,
  getTransfers, createTransfer, receiveTransfer,
  getStockEntries, createStockEntry
} from '../controllers/stores.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Stores endpoints
router.get('/stores', getStores);
router.post('/stores', authorize('manager', 'ceo'), createStore);
router.put('/stores/:id', authorize('manager', 'ceo'), updateStore);
router.delete('/stores/:id', authorize('manager', 'ceo'), deleteStore);

// Transfers endpoints
router.get('/transfers', getTransfers);
router.post('/transfers', createTransfer);
router.patch('/transfers/:id/receive', receiveTransfer);

// Stock entries / purchase order receipts endpoints
router.get('/stock-entries', getStockEntries);
router.post('/stock-entries', createStockEntry);

export default router;
