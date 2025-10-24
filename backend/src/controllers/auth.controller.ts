/**
 * Authentication Controller
 * 
 * Handles user authentication endpoints:
 * - login: Authenticate user and return tokens
 * - logout: Clear authentication cookies
 * - getCurrentUser: Get current user information
 * 
 * Note: User registration is now handled by admin-only endpoints
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { 
  hashPassword, 
  comparePassword, 
  generateTokenPair, 
  validatePasswordStrength 
} from '../services/auth.service';
import { logger } from '../utils/logger';
import { sendSuccess, sendError } from '../utils/response';

const prisma = new PrismaClient();

// Types

interface LoginRequest extends Request {
  body: {
    email: string;
    password: string;
  };
}

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    first_name: string;
    last_name: string;
  };
}


/**
 * Login user
 * 
 * POST /api/v1/auth/login
 * 
 * @param req - Request with credentials
 * @param res - Response
 */
export async function login(req: LoginRequest, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      logger.warn('Login failed: Missing credentials');
      sendError(res, 'VALIDATION_ERROR', 'Email and password are required', 400);
      return;
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      logger.warn('Login failed: User not found', { email });
      sendError(res, 'INVALID_CREDENTIALS', 'Invalid credentials', 401);
      return;
    }

    // Check if user is active
    if (!user.is_active) {
      logger.warn('Login failed: User account disabled', { userId: user.id, email });
      sendError(res, 'ACCOUNT_DISABLED', 'Account is disabled', 401);
      return;
    }

    // Check if user is soft deleted
    if (user.deleted_at) {
      logger.warn('Login failed: User account deleted', { userId: user.id, email });
      sendError(res, 'ACCOUNT_NOT_FOUND', 'Account not found', 401);
      return;
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      logger.warn('Login failed: Invalid password', { userId: user.id, email });
      sendError(res, 'INVALID_CREDENTIALS', 'Invalid credentials', 401);
      return;
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { last_login: new Date() }
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair(
      user.id,
      user.role,
      user.email
    );

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return user data (without password)
    const userData = {
      id: user.id,
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      avatar_url: user.avatar_url,
      is_active: user.is_active,
      last_login: user.last_login,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    logger.info('User logged in successfully', {
      userId: user.id,
      email: user.email,
      role: user.role
    });

    sendSuccess(res, {
      user: userData,
      accessToken,
      message: 'Login successful'
    }, 'Login successful');

  } catch (error) {
    logger.error('Login error:', error);
    sendError(res, 'INTERNAL_ERROR', 'Login failed', 500);
  }
}

/**
 * Logout user
 * 
 * POST /api/v1/auth/logout
 * 
 * @param req - Request
 * @param res - Response
 */
export async function logout(_req: Request, res: Response): Promise<void> {
  try {
    // Clear refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    logger.info('User logged out successfully');

    sendSuccess(res, {
      message: 'Logout successful'
    }, 'Logout successful');

  } catch (error) {
    logger.error('Logout error:', error);
    sendError(res, 'INTERNAL_ERROR', 'Logout failed', 500);
  }
}

/**
 * Get current user information
 * 
 * GET /api/v1/auth/me
 * 
 * @param req - Authenticated request
 * @param res - Response
 */
export async function getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    // User should be attached by authenticate middleware
    if (!req.user) {
      logger.warn('Get current user failed: No user in request');
      sendError(res, 'NOT_AUTHENTICATED', 'Authentication required', 401);
      return;
    }

    // Get fresh user data from database
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        first_name: true,
        last_name: true,
        phone: true,
        avatar_url: true,
        is_active: true,
        last_login: true,
        created_at: true,
        updated_at: true,
      }
    });

    if (!user) {
      logger.warn('Get current user failed: User not found', { userId: req.user.id });
      sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
      return;
    }

    // Check if user is still active
    if (!user.is_active) {
      logger.warn('Get current user failed: User account disabled', { userId: user.id });
      sendError(res, 'ACCOUNT_DISABLED', 'Account is disabled', 401);
      return;
    }

    logger.info('Current user retrieved successfully', {
      userId: user.id,
      email: user.email,
      role: user.role
    });

    sendSuccess(res, {
      user,
      message: 'User information retrieved successfully'
    }, 'User information retrieved successfully');

  } catch (error) {
    logger.error('Get current user error:', error);
    sendError(res, 'INTERNAL_ERROR', 'Failed to get user information', 500);
  }
}

/**
 * Refresh access token
 * 
 * POST /api/v1/auth/refresh
 * 
 * @param req - Request with refresh token
 * @param res - Response
 */
export async function refreshToken(req: Request, res: Response): Promise<void> {
  try {
    // Get refresh token from cookie
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      logger.warn('Token refresh failed: No refresh token');
      sendError(res, 'NO_REFRESH_TOKEN', 'Refresh token required', 401);
      return;
    }

    // Verify refresh token
    const { verifyRefreshToken } = await import('../services/auth.service');
    const decoded = verifyRefreshToken(refreshToken);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        is_active: true,
        deleted_at: true,
      }
    });

    if (!user) {
      logger.warn('Token refresh failed: User not found', { userId: decoded.userId });
      sendError(res, 'INVALID_REFRESH_TOKEN', 'Invalid refresh token', 401);
      return;
    }

    // Check if user is still active
    if (!user.is_active || user.deleted_at) {
      logger.warn('Token refresh failed: User account disabled or deleted', { userId: user.id });
      sendError(res, 'ACCOUNT_DISABLED', 'Account is disabled', 401);
      return;
    }

    // Generate new token pair
    const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(
      user.id,
      user.role,
      user.email
    );

    // Set new refresh token as HTTP-only cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    logger.info('Token refreshed successfully', {
      userId: user.id,
      email: user.email
    });

    sendSuccess(res, {
      accessToken,
      message: 'Token refreshed successfully'
    }, 'Token refreshed successfully');

  } catch (error) {
    logger.error('Token refresh error:', error);
    sendError(res, 'INVALID_REFRESH_TOKEN', 'Invalid refresh token', 401);
  }
}

/**
 * Change user password
 * 
 * PUT /api/v1/auth/password
 * 
 * @param req - Authenticated request with password data
 * @param res - Response
 */
export async function changePassword(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      sendError(res, 'VALIDATION_ERROR', 'Current password and new password are required', 400);
      return;
    }

    // User should be attached by authenticate middleware
    if (!req.user) {
      sendError(res, 'NOT_AUTHENTICATED', 'Authentication required', 401);
      return;
    }

    // Get user with password hash
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        password_hash: true,
        is_active: true,
        deleted_at: true,
      }
    });

    if (!user) {
      sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
      return;
    }

    // Check if user is still active
    if (!user.is_active || user.deleted_at) {
      sendError(res, 'ACCOUNT_DISABLED', 'Account is disabled', 401);
      return;
    }

    // Verify current password
    const isValidPassword = await comparePassword(currentPassword, user.password_hash);
    if (!isValidPassword) {
      logger.warn('Password change failed: Invalid current password', { userId: user.id });
      sendError(res, 'INVALID_CURRENT_PASSWORD', 'Current password is incorrect', 401);
      return;
    }

    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      sendError(res, 'VALIDATION_ERROR', 'New password does not meet requirements', 400);
      return;
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password_hash: newPasswordHash }
    });

    logger.info('Password changed successfully', { userId: user.id });

    sendSuccess(res, {
      message: 'Password changed successfully'
    }, 'Password changed successfully');

  } catch (error) {
    logger.error('Password change error:', error);
    sendError(res, 'INTERNAL_ERROR', 'Password change failed', 500);
  }
}

// Export all controller functions
export default {
  login,
  logout,
  getCurrentUser,
  refreshToken,
  changePassword,
};
