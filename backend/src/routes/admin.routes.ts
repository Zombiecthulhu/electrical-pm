import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireSuperAdmin } from '../middleware/authorization.middleware';
import {
  createUserController,
  getAllUsersController,
  getUserByIdController,
  updateUserController,
  deleteUserController,
  resetUserPasswordController
} from '../controllers/admin.controller';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Admin Routes
 * 
 * All admin routes require:
 * 1. Authentication (valid JWT token)
 * 2. SUPER_ADMIN role authorization
 * 
 * Routes:
 * POST   /api/v1/admin/users          - Create user
 * GET    /api/v1/admin/users          - List all users
 * GET    /api/v1/admin/users/:id      - Get user details
 * PUT    /api/v1/admin/users/:id      - Update user
 * DELETE /api/v1/admin/users/:id      - Delete user
 * POST   /api/v1/admin/users/:id/reset-password - Reset password
 */

// Apply authentication and SUPER_ADMIN authorization to all admin routes
router.use(authenticate);
router.use(requireSuperAdmin);

// User Management Routes
router.post('/users', createUserController);
router.get('/users', getAllUsersController);
router.get('/users/:id', getUserByIdController);
router.put('/users/:id', updateUserController);
router.delete('/users/:id', deleteUserController);
router.post('/users/:id/reset-password', resetUserPasswordController);

// Log admin route access
router.use((req, _res, next) => {
  logger.info('Admin route accessed', {
    method: req.method,
    path: req.path,
    userId: req.user?.id,
    userRole: req.user?.role,
    ip: req.ip,
    service: 'electrical-pm-api',
    timestamp: new Date().toISOString()
  });
  next();
});

export default router;
