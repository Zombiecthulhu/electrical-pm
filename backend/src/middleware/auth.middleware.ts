/**
 * Authentication Middleware
 * 
 * Provides JWT authentication and role-based authorization middleware.
 * Integrates with auth service for token verification and validation.
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { extractTokenFromHeader, verifyToken, DecodedToken } from '../services/auth.service';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Extended Request interface with user information
 */
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    first_name: string;
    last_name: string;
  };
}

/**
 * Authenticate middleware
 * 
 * Verifies JWT token from Authorization header or cookies.
 * Attaches decoded user information to req.user.
 * 
 * Token sources (in order of priority):
 * 1. Authorization header: "Bearer <token>"
 * 2. Cookie: "accessToken"
 * 
 * @example
 * router.get('/protected', authenticate, controller);
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Try to extract token from Authorization header first
    let token = extractTokenFromHeader(req.headers.authorization);
    
    // If no token in header, try cookies
    if (!token && req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
      logger.info('Token extracted from cookie');
    }
    
    // No token found
    if (!token) {
      logger.warn('Authentication failed: No token provided', {
        ip: req.ip,
        path: req.path,
      });
      
      res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'Authentication required. Please provide a valid token.',
        },
      });
      return;
    }
    
    // Verify token
    const decoded: DecodedToken = verifyToken(token);
    
    // Fetch full user data from database
    const user = await prisma.user.findUnique({
      where: { 
        id: decoded.userId,
        deleted_at: null
      },
      select: {
        id: true,
        email: true,
        role: true,
        first_name: true,
        last_name: true,
        is_active: true
      }
    });

    if (!user || !user.is_active) {
      logger.warn('Authentication failed: User not found or inactive', {
        userId: decoded.userId,
        ip: req.ip,
        path: req.path,
      });
      
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not found or inactive'
        }
      });
      return;
    }
    
    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
    };
    
    logger.info('User authenticated successfully', {
      userId: user.id,
      role: user.role,
      path: req.path,
    });
    
    // Continue to next middleware
    next();
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.warn('Authentication failed: Invalid token', {
      error: errorMessage,
      ip: req.ip,
      path: req.path,
    });
    
    // Determine error response based on error type
    if (errorMessage.includes('expired')) {
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Your session has expired. Please login again.',
        },
      });
      return;
    }
    
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token. Please login again.',
      },
    });
  }
}

/**
 * Optional authentication middleware
 * 
 * Similar to authenticate, but doesn't fail if no token is provided.
 * Useful for routes that have optional authentication (e.g., public content
 * that shows extra info for logged-in users).
 * 
 * @example
 * router.get('/public-projects', optionalAuthenticate, controller);
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
export async function optionalAuthenticate(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Try to extract token
    let token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token && req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }
    
    // No token - that's OK, just continue
    if (!token) {
      logger.info('Optional auth: No token provided, continuing as guest');
      next();
      return;
    }
    
    // Try to verify token
    const decoded: DecodedToken = verifyToken(token);
    
    // Fetch full user data from database
    const user = await prisma.user.findUnique({
      where: { 
        id: decoded.userId,
        deleted_at: null
      },
      select: {
        id: true,
        email: true,
        role: true,
        first_name: true,
        last_name: true,
        is_active: true
      }
    });

    if (user && user.is_active) {
      // Attach user info to request
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
      };
      
      logger.info('Optional auth: User authenticated', {
        userId: user.id,
        role: user.role,
      });
    } else {
      logger.info('Optional auth: User not found or inactive, continuing as guest');
    }
    
    next();
    
  } catch (error) {
    // Token was provided but invalid - just continue as guest
    logger.info('Optional auth: Invalid token provided, continuing as guest');
    next();
  }
}

/**
 * Authorization middleware factory
 * 
 * Creates middleware that checks if authenticated user has required role(s).
 * Must be used AFTER authenticate middleware.
 * 
 * Role hierarchy (higher roles have all permissions of lower roles):
 * 1. SUPER_ADMIN - Full system access
 * 2. PROJECT_MANAGER - Project management
 * 3. FIELD_SUPERVISOR - Field operations
 * 4. OFFICE_ADMIN - Office operations
 * 5. FIELD_WORKER - Basic access
 * 6. CLIENT_READ_ONLY - View only
 * 
 * @param allowedRoles - Array of role strings or single role string
 * @returns Express middleware function
 * 
 * @example
 * // Single role
 * router.post('/projects', authenticate, authorize('SUPER_ADMIN'), createProject);
 * 
 * // Multiple roles
 * router.get('/projects', authenticate, authorize(['PROJECT_MANAGER', 'SUPER_ADMIN']), getProjects);
 * 
 * // Using role hierarchy
 * router.delete('/users/:id', authenticate, authorizeMinRole('PROJECT_MANAGER'), deleteUser);
 */
export function authorizeRoles(allowedRoles: string | string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        logger.error('Authorization check failed: User not authenticated', {
          path: req.path,
        });
        
        res.status(401).json({
          success: false,
          error: {
            code: 'NOT_AUTHENTICATED',
            message: 'You must be logged in to access this resource.',
          },
        });
        return;
      }
      
      // Normalize allowedRoles to array
      const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      
      // Check if user has one of the allowed roles
      const hasPermission = rolesArray.includes(req.user.role);
      
      if (!hasPermission) {
        logger.warn('Authorization failed: Insufficient permissions', {
          userId: req.user.id,
          userRole: req.user.role,
          requiredRoles: rolesArray,
          path: req.path,
        });
        
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access this resource.',
          },
        });
        return;
      }
      
      logger.info('Authorization successful', {
        userId: req.user.id,
        role: req.user.role,
        path: req.path,
      });
      
      // User has permission, continue
      next();
      
    } catch (error) {
      logger.error('Authorization error:', error);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'An error occurred while checking permissions.',
        },
      });
    }
  };
}

/**
 * Role hierarchy definition
 * Higher number = more permissions
 */
const ROLE_HIERARCHY: Record<string, number> = {
  CLIENT_READ_ONLY: 1,
  FIELD_WORKER: 2,
  OFFICE_ADMIN: 3,
  FIELD_SUPERVISOR: 4,
  PROJECT_MANAGER: 5,
  SUPER_ADMIN: 6,
};

/**
 * Hierarchical authorization middleware factory
 * 
 * Checks if user's role is at or above the minimum required role.
 * Uses role hierarchy: SUPER_ADMIN > PROJECT_MANAGER > FIELD_SUPERVISOR > etc.
 * 
 * @param minRole - Minimum required role
 * @returns Express middleware function
 * 
 * @example
 * // Allows PROJECT_MANAGER and SUPER_ADMIN
 * router.post('/projects', authenticate, authorizeMinRole('PROJECT_MANAGER'), createProject);
 * 
 * // Allows FIELD_SUPERVISOR, PROJECT_MANAGER, and SUPER_ADMIN
 * router.post('/daily-logs', authenticate, authorizeMinRole('FIELD_SUPERVISOR'), createLog);
 */
export function authorizeMinRole(minRole: string) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        logger.error('Authorization check failed: User not authenticated');
        
        res.status(401).json({
          success: false,
          error: {
            code: 'NOT_AUTHENTICATED',
            message: 'You must be logged in to access this resource.',
          },
        });
        return;
      }
      
      // Get role levels
      const userRoleLevel = ROLE_HIERARCHY[req.user.role] || 0;
      const minRoleLevel = ROLE_HIERARCHY[minRole] || 0;
      
      // Check if user's role meets minimum requirement
      const hasPermission = userRoleLevel >= minRoleLevel;
      
      if (!hasPermission) {
        logger.warn('Authorization failed: Insufficient role level', {
          userId: req.user.id,
          userRole: req.user.role,
          userLevel: userRoleLevel,
          minRole,
          minLevel: minRoleLevel,
          path: req.path,
        });
        
        res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_ROLE',
            message: `This action requires at least ${minRole} role.`,
          },
        });
        return;
      }
      
      logger.info('Hierarchical authorization successful', {
        userId: req.user.id,
        role: req.user.role,
        minRole,
        path: req.path,
      });
      
      next();
      
    } catch (error) {
      logger.error('Authorization error:', error);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'An error occurred while checking permissions.',
        },
      });
    }
  };
}

/**
 * Resource ownership authorization middleware factory
 * 
 * Checks if the authenticated user owns the resource being accessed.
 * Useful for ensuring users can only modify their own resources.
 * SUPER_ADMIN bypasses ownership check.
 * 
 * @param getUserIdFromRequest - Function to extract resource owner ID from request
 * @returns Express middleware function
 * 
 * @example
 * router.put('/profile/:userId', 
 *   authenticate, 
 *   authorizeOwnership((req) => req.params.userId),
 *   updateProfile
 * );
 */
export function authorizeOwnership(
  getUserIdFromRequest: (req: AuthRequest) => string | Promise<string>
) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'NOT_AUTHENTICATED',
            message: 'You must be logged in to access this resource.',
          },
        });
        return;
      }
      
      // SUPER_ADMIN can access anything
      if (req.user.role === 'SUPER_ADMIN') {
        logger.info('Ownership check bypassed for SUPER_ADMIN', {
          userId: req.user.id,
          path: req.path,
        });
        next();
        return;
      }
      
      // Get resource owner ID
      const resourceOwnerId = await getUserIdFromRequest(req);
      
      // Check if user owns the resource
      if (req.user.id !== resourceOwnerId) {
        logger.warn('Authorization failed: User does not own resource', {
          userId: req.user.id,
          resourceOwnerId,
          path: req.path,
        });
        
        res.status(403).json({
          success: false,
          error: {
            code: 'NOT_OWNER',
            message: 'You do not have permission to access this resource.',
          },
        });
        return;
      }
      
      logger.info('Ownership authorization successful', {
        userId: req.user.id,
        path: req.path,
      });
      
      next();
      
    } catch (error) {
      logger.error('Ownership authorization error:', error);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'An error occurred while checking resource ownership.',
        },
      });
    }
  };
}

/**
 * Check if user has specific permission
 * Helper function for use in controllers
 * 
 * @param req - Auth request
 * @param allowedRoles - Allowed roles
 * @returns True if user has permission
 * 
 * @example
 * if (!hasPermission(req, ['SUPER_ADMIN', 'PROJECT_MANAGER'])) {
 *   return res.status(403).json({ error: 'Forbidden' });
 * }
 */
export function hasPermission(req: AuthRequest, allowedRoles: string[]): boolean {
  if (!req.user) {
    return false;
  }
  
  return allowedRoles.includes(req.user.role);
}

/**
 * Check if user meets minimum role level
 * Helper function for use in controllers
 * 
 * @param req - Auth request
 * @param minRole - Minimum required role
 * @returns True if user meets minimum role
 * 
 * @example
 * if (!hasMinRole(req, 'FIELD_SUPERVISOR')) {
 *   return res.status(403).json({ error: 'Insufficient permissions' });
 * }
 */
export function hasMinRole(req: AuthRequest, minRole: string): boolean {
  if (!req.user) {
    return false;
  }
  
  const userRoleLevel = ROLE_HIERARCHY[req.user.role] || 0;
  const minRoleLevel = ROLE_HIERARCHY[minRole] || 0;
  
  return userRoleLevel >= minRoleLevel;
}

/**
 * Check if user is resource owner or admin
 * Helper function for use in controllers
 * 
 * @param req - Auth request
 * @param resourceOwnerId - ID of resource owner
 * @returns True if user is owner or admin
 * 
 * @example
 * if (!isOwnerOrAdmin(req, project.created_by)) {
 *   return res.status(403).json({ error: 'Forbidden' });
 * }
 */
export function isOwnerOrAdmin(req: AuthRequest, resourceOwnerId: string): boolean {
  if (!req.user) {
    return false;
  }
  
  // SUPER_ADMIN can access anything
  if (req.user.role === 'SUPER_ADMIN') {
    return true;
  }
  
  // Check ownership
  return req.user.id === resourceOwnerId;
}

// Export all middleware and helpers
export default {
  authenticate,
  optionalAuthenticate,
  authorizeRoles,
  authorizeMinRole,
  authorizeOwnership,
  hasPermission,
  hasMinRole,
  isOwnerOrAdmin,
};

