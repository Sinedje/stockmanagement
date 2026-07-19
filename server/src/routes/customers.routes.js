import express from 'express';
import {
  getCustomers, createCustomer, getTransactions, recordDeposit, recordRefund
} from '../controllers/customers.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getCustomers);
router.post('/', createCustomer);
router.get('/transactions', getTransactions);
router.post('/:id/deposit', recordDeposit);
router.post('/:id/refund', recordRefund);

export default router;
