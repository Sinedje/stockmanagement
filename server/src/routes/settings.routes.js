import express from 'express';
import { getCompanySettings, updateCompanySettings } from '../controllers/settings.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/company', getCompanySettings);
router.put('/company', authorize('ceo'), updateCompanySettings); // CEO only

export default router;
