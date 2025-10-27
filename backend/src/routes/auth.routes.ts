/**
 * Authentication Routes
 * 
 * Handles all authentication-related endpoints:
 * - POST /login - User authentication
 * - POST /logout - User logout (requires authentication)
 * - GET /me - Get current user info (requires authentication)
 * - POST /refresh - Refresh access token
 * - PUT /password - Change password (requires authentication)
 * 
 * Note: User registration is now handled by admin-only endpoints
 */

import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  login,
  logout,
  getCurrentUser,
  refreshToken,
  changePassword
} from '../controllers/auth.controller';

const router = express.Router();

// Public routes (no authentication required)
router.post('/login', login);
router.post('/refresh', refreshToken);

// Protected routes (authentication required)
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getCurrentUser);
router.put('/password', authenticate, changePassword);

export default router;
