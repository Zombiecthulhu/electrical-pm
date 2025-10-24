import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        first_name: string;
        last_name: string;
      };
    }
  }
}

/**
 * Authorization middleware for role-based access control
 * @param allowedRoles - Array of roles that are allowed to access the endpoint
 * @returns Middleware function
 */
export const authorizeRoles = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        logger.warn('Authorization failed: No user found in request', {
          ip: req.ip,
          path: req.path,
          method: req.method,
          service: 'electrical-pm-api',
          timestamp: new Date().toISOString()
        });
        
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        });
      }

      // Check if user has required role
      if (!allowedRoles.includes(req.user.role)) {
        logger.warn('Authorization failed: Insufficient permissions', {
          userId: req.user.id,
          userRole: req.user.role,
          allowedRoles,
          ip: req.ip,
          path: req.path,
          method: req.method,
          service: 'electrical-pm-api',
          timestamp: new Date().toISOString()
        });
        
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions'
          }
        });
      }

      // User is authorized
      logger.info('Authorization successful', {
        userId: req.user.id,
        userRole: req.user.role,
        allowedRoles,
        ip: req.ip,
        path: req.path,
        method: req.method,
        service: 'electrical-pm-api',
        timestamp: new Date().toISOString()
      });

      return next();
    } catch (error) {
      logger.error('Authorization middleware error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: req.ip,
        path: req.path,
        method: req.method,
        service: 'electrical-pm-api',
        timestamp: new Date().toISOString()
      });
      
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Authorization check failed'
        }
      });
    }
  };
};

/**
 * Middleware to require SUPER_ADMIN role
 */
export const requireSuperAdmin = authorizeRoles(['SUPER_ADMIN']);

/**
 * Middleware to require admin roles (SUPER_ADMIN or OFFICE_ADMIN)
 */
export const requireAdmin = authorizeRoles(['SUPER_ADMIN', 'OFFICE_ADMIN']);

/**
 * Middleware to require any authenticated user
 */
export const requireAuth = authorizeRoles(['SUPER_ADMIN', 'OFFICE_ADMIN', 'PROJECT_MANAGER', 'FIELD_SUPERVISOR', 'FIELD_WORKER', 'CLIENT_READ_ONLY']);
