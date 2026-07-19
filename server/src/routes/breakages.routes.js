import express from 'express';
import {
  getBreakages, createBreakage, getRepackagings, createRepackaging
} from '../controllers/breakages.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Breakages
router.get('/breakages', getBreakages);
router.post('/breakages', authorize('manager', 'ceo'), createBreakage);

// Repackagings
router.get('/repackagings', getRepackagings);
router.post('/repackagings', authorize('manager', 'ceo'), createRepackaging);

export default router;
