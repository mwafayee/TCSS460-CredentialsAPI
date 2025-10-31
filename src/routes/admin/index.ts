// src/routes/admin/index.ts
import express from 'express';
import { AdminController } from '@controllers/adminController';
import { checkToken } from '@middleware/jwt';
import { requireAdmin } from '@middleware/adminAuth';

const router = express.Router();

/**
 * Admin Routes
 * All routes here are protected and require Admin+ access
 */

// create user
router.post('/users/create', checkToken, requireAdmin, AdminController.createUser);

// list users
router.get('/users', checkToken, requireAdmin, AdminController.listUsers);

// get single user
router.get('/users/:id', checkToken, requireAdmin, AdminController.getUserById);

// update user
router.put('/users/:id', checkToken, requireAdmin, AdminController.updateUser);

// delete user (soft delete)
router.delete('/users/:id', checkToken, requireAdmin, AdminController.deleteUser);

// dashboard stats
router.get('/users/stats/dashboard', checkToken, requireAdmin, AdminController.getDashboardStats);

export default router;
