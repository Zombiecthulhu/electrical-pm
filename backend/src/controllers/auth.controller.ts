/**
 * Authentication Controller
 * 
 * Handles user authentication endpoints:
 * - register: Create new user account
 * - login: Authenticate user and return tokens
 * - logout: Clear authentication cookies
 * - getCurrentUser: Get current user information
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
interface RegisterRequest extends Request {
  body: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: string;
  };
}

interface LoginRequest extends Request {
  body: {
    email: string;
    password: string;
  };
}

interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    email?: string;
  };
}

/**
 * Register a new user
 * 
 * POST /api/v1/auth/register
 * 
 * @param req - Request with user data
 * @param res - Response
 */
export async function register(req: RegisterRequest, res: Response): Promise<void> {
  try {
    const { email, password, firstName, lastName, phone, role = 'FIELD_WORKER' } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      logger.warn('Registration failed: Missing required fields', { email });
      res.status(400).json(sendError('Missing required fields', 'VALIDATION_ERROR', {
        required: ['email', 'password', 'firstName', 'lastName']
      }));
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      logger.warn('Registration failed: Invalid email format', { email });
      res.status(400).json(sendError('Invalid email format', 'VALIDATION_ERROR'));
      return;
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      logger.warn('Registration failed: Weak password', { email });
      res.status(400).json(sendError('Password does not meet requirements', 'VALIDATION_ERROR', {
        errors: passwordValidation.errors
      }));
      return;
    }

    // Validate role
    const validRoles = ['SUPER_ADMIN', 'PROJECT_MANAGER', 'FIELD_SUPERVISOR', 'OFFICE_ADMIN', 'FIELD_WORKER', 'CLIENT_READ_ONLY'];
    if (!validRoles.includes(role)) {
      logger.warn('Registration failed: Invalid role', { email, role });
      res.status(400).json(sendError('Invalid role', 'VALIDATION_ERROR', {
        validRoles
      }));
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      logger.warn('Registration failed: User already exists', { email });
      res.status(409).json(sendError('User with this email already exists', 'USER_EXISTS'));
      return;
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password_hash,
        role,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone?.trim() || null,
        is_active: true,
      },
      select: {
        id: true,
        email: true,
        role: true,
        first_name: true,
        last_name: true,
        phone: true,
        avatar_url: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      }
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

    logger.info('User registered successfully', {
      userId: user.id,
      email: user.email,
      role: user.role
    });

    res.status(201).json(sendSuccess({
      user,
      accessToken,
      message: 'User registered successfully'
    }));

  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json(sendError('Registration failed', 'INTERNAL_ERROR'));
  }
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
      res.status(400).json(sendError('Email and password are required', 'VALIDATION_ERROR'));
      return;
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      logger.warn('Login failed: User not found', { email });
      res.status(401).json(sendError('Invalid credentials', 'INVALID_CREDENTIALS'));
      return;
    }

    // Check if user is active
    if (!user.is_active) {
      logger.warn('Login failed: User account disabled', { userId: user.id, email });
      res.status(401).json(sendError('Account is disabled', 'ACCOUNT_DISABLED'));
      return;
    }

    // Check if user is soft deleted
    if (user.deleted_at) {
      logger.warn('Login failed: User account deleted', { userId: user.id, email });
      res.status(401).json(sendError('Account not found', 'ACCOUNT_NOT_FOUND'));
      return;
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      logger.warn('Login failed: Invalid password', { userId: user.id, email });
      res.status(401).json(sendError('Invalid credentials', 'INVALID_CREDENTIALS'));
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

    res.json(sendSuccess({
      user: userData,
      accessToken,
      message: 'Login successful'
    }));

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json(sendError('Login failed', 'INTERNAL_ERROR'));
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
export async function logout(req: Request, res: Response): Promise<void> {
  try {
    // Clear refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    logger.info('User logged out successfully');

    res.json(sendSuccess({
      message: 'Logout successful'
    }));

  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json(sendError('Logout failed', 'INTERNAL_ERROR'));
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
      res.status(401).json(sendError('Authentication required', 'NOT_AUTHENTICATED'));
      return;
    }

    // Get fresh user data from database
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
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
      logger.warn('Get current user failed: User not found', { userId: req.user.userId });
      res.status(404).json(sendError('User not found', 'USER_NOT_FOUND'));
      return;
    }

    // Check if user is still active
    if (!user.is_active) {
      logger.warn('Get current user failed: User account disabled', { userId: user.id });
      res.status(401).json(sendError('Account is disabled', 'ACCOUNT_DISABLED'));
      return;
    }

    logger.info('Current user retrieved successfully', {
      userId: user.id,
      email: user.email,
      role: user.role
    });

    res.json(sendSuccess({
      user,
      message: 'User information retrieved successfully'
    }));

  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json(sendError('Failed to get user information', 'INTERNAL_ERROR'));
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
      res.status(401).json(sendError('Refresh token required', 'NO_REFRESH_TOKEN'));
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
      res.status(401).json(sendError('Invalid refresh token', 'INVALID_REFRESH_TOKEN'));
      return;
    }

    // Check if user is still active
    if (!user.is_active || user.deleted_at) {
      logger.warn('Token refresh failed: User account disabled or deleted', { userId: user.id });
      res.status(401).json(sendError('Account is disabled', 'ACCOUNT_DISABLED'));
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

    res.json(sendSuccess({
      accessToken,
      message: 'Token refreshed successfully'
    }));

  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json(sendError('Invalid refresh token', 'INVALID_REFRESH_TOKEN'));
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
      res.status(400).json(sendError('Current password and new password are required', 'VALIDATION_ERROR'));
      return;
    }

    // User should be attached by authenticate middleware
    if (!req.user) {
      res.status(401).json(sendError('Authentication required', 'NOT_AUTHENTICATED'));
      return;
    }

    // Get user with password hash
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        password_hash: true,
        is_active: true,
        deleted_at: true,
      }
    });

    if (!user) {
      res.status(404).json(sendError('User not found', 'USER_NOT_FOUND'));
      return;
    }

    // Check if user is still active
    if (!user.is_active || user.deleted_at) {
      res.status(401).json(sendError('Account is disabled', 'ACCOUNT_DISABLED'));
      return;
    }

    // Verify current password
    const isValidPassword = await comparePassword(currentPassword, user.password_hash);
    if (!isValidPassword) {
      logger.warn('Password change failed: Invalid current password', { userId: user.id });
      res.status(401).json(sendError('Current password is incorrect', 'INVALID_CURRENT_PASSWORD'));
      return;
    }

    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      res.status(400).json(sendError('New password does not meet requirements', 'VALIDATION_ERROR', {
        errors: passwordValidation.errors
      }));
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

    res.json(sendSuccess({
      message: 'Password changed successfully'
    }));

  } catch (error) {
    logger.error('Password change error:', error);
    res.status(500).json(sendError('Password change failed', 'INTERNAL_ERROR'));
  }
}

// Export all controller functions
export default {
  register,
  login,
  logout,
  getCurrentUser,
  refreshToken,
  changePassword,
};
