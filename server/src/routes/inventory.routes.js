import express from 'express';
import * as inventoryCtrl from '../controllers/inventory.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All routes require authentication

router.post('/adjustments', inventoryCtrl.logAdjustment);
router.post('/adjustments/bulk', inventoryCtrl.logBulkAdjustments);
router.get('/adjustments', inventoryCtrl.getAdjustments);
router.get('/history', inventoryCtrl.getGlobalHistory); // This will fetch the aggregated history

export default router;
