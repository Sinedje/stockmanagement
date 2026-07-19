import express from 'express';
import { 
  getProducts, createProduct, updateProduct, deleteProduct, bulkUpdateStock,
  getCategories, createCategory 
} from '../controllers/products.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Products routes
router.get('/products', getProducts);
router.post('/products', authorize('manager', 'ceo'), createProduct);
router.put('/products/:id', authorize('manager', 'ceo'), updateProduct);
router.delete('/products/:id', authorize('manager', 'ceo'), deleteProduct);
router.post('/products/bulk-update', authorize('manager', 'ceo'), bulkUpdateStock);

// Categories routes
router.get('/categories', getCategories);
router.post('/categories', authorize('manager', 'ceo'), createCategory);

export default router;
