import express from 'express';
import { getUsers, createUser, updateUser, toggleUserStatus } from '../controllers/users.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Allow all authenticated users to view the list (needed by POS to assign cashier letters A, B, C...)
router.use(protect);

router.get('/', getUsers);

// Only manager and ceo can create/edit users
router.post('/', authorize('manager', 'ceo'), createUser);
router.put('/:id', authorize('manager', 'ceo'), updateUser);
router.patch('/:id/toggle-status', authorize('manager', 'ceo'), toggleUserStatus);

export default router;
