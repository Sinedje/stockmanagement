import express from 'express';
import { getUsers, createUser, updateUser, toggleUserStatus } from '../controllers/users.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Only manager and ceo roles can manage users/staff members
router.use(protect);
router.use(authorize('manager', 'ceo'));

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.patch('/:id/toggle-status', toggleUserStatus);

export default router;
