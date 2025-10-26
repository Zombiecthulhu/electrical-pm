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
 * Middleware to require project manager roles (SUPER_ADMIN, OFFICE_ADMIN, or PROJECT_MANAGER)
 */
export const requireProjectManager = authorizeRoles(['SUPER_ADMIN', 'OFFICE_ADMIN', 'PROJECT_MANAGER']);

/**
 * Middleware to require any authenticated user
 */
export const requireAuth = authorizeRoles(['SUPER_ADMIN', 'OFFICE_ADMIN', 'PROJECT_MANAGER', 'FIELD_SUPERVISOR', 'FIELD_WORKER', 'CLIENT_READ_ONLY']);

/**
 * Generic authorization middleware for resource-based permissions
 * @param resource - The resource being accessed (e.g., 'files', 'projects')
 * @param action - The action being performed (e.g., 'read', 'create', 'update', 'delete')
 * @returns Middleware function
 */
export const authorize = (resource: string, action: string) => {
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

      // Define role-based permissions
      const permissions: Record<string, Record<string, string[]>> = {
        files: {
          read: ['SUPER_ADMIN', 'OFFICE_ADMIN', 'PROJECT_MANAGER', 'FIELD_SUPERVISOR', 'FIELD_WORKER', 'CLIENT_READ_ONLY'],
          create: ['SUPER_ADMIN', 'OFFICE_ADMIN', 'PROJECT_MANAGER', 'FIELD_SUPERVISOR', 'FIELD_WORKER'],
          update: ['SUPER_ADMIN', 'OFFICE_ADMIN', 'PROJECT_MANAGER', 'FIELD_SUPERVISOR'],
          delete: ['SUPER_ADMIN', 'OFFICE_ADMIN', 'PROJECT_MANAGER']
        },
        projects: {
          read: ['SUPER_ADMIN', 'OFFICE_ADMIN', 'PROJECT_MANAGER', 'FIELD_SUPERVISOR', 'FIELD_WORKER', 'CLIENT_READ_ONLY'],
          create: ['SUPER_ADMIN', 'OFFICE_ADMIN', 'PROJECT_MANAGER'],
          update: ['SUPER_ADMIN', 'OFFICE_ADMIN', 'PROJECT_MANAGER'],
          delete: ['SUPER_ADMIN', 'OFFICE_ADMIN']
        },
        clients: {
          read: ['SUPER_ADMIN', 'OFFICE_ADMIN', 'PROJECT_MANAGER', 'FIELD_SUPERVISOR', 'CLIENT_READ_ONLY'],
          create: ['SUPER_ADMIN', 'OFFICE_ADMIN', 'PROJECT_MANAGER'],
          update: ['SUPER_ADMIN', 'OFFICE_ADMIN', 'PROJECT_MANAGER'],
          delete: ['SUPER_ADMIN', 'OFFICE_ADMIN']
        },
        daily_logs: {
          read: ['SUPER_ADMIN', 'OFFICE_ADMIN', 'PROJECT_MANAGER', 'FIELD_SUPERVISOR', 'FIELD_WORKER', 'CLIENT_READ_ONLY'],
          create: ['SUPER_ADMIN', 'OFFICE_ADMIN', 'PROJECT_MANAGER', 'FIELD_SUPERVISOR', 'FIELD_WORKER'],
          update: ['SUPER_ADMIN', 'OFFICE_ADMIN', 'PROJECT_MANAGER', 'FIELD_SUPERVISOR'],
          delete: ['SUPER_ADMIN', 'OFFICE_ADMIN', 'PROJECT_MANAGER']
        },
        users: {
          read: ['SUPER_ADMIN', 'OFFICE_ADMIN'],
          create: ['SUPER_ADMIN'],
          update: ['SUPER_ADMIN', 'OFFICE_ADMIN'],
          delete: ['SUPER_ADMIN']
        },
        timesheets: {
          read: ['SUPER_ADMIN', 'OFFICE_ADMIN', 'PROJECT_MANAGER', 'FIELD_SUPERVISOR'],
          create: ['SUPER_ADMIN', 'OFFICE_ADMIN', 'PROJECT_MANAGER', 'FIELD_SUPERVISOR'],
          update: ['SUPER_ADMIN', 'OFFICE_ADMIN', 'PROJECT_MANAGER', 'FIELD_SUPERVISOR'],
          delete: ['SUPER_ADMIN', 'OFFICE_ADMIN', 'PROJECT_MANAGER'],
          approve: ['SUPER_ADMIN', 'OFFICE_ADMIN', 'PROJECT_MANAGER']
        },
        quotes: {
          read: ['SUPER_ADMIN', 'OFFICE_ADMIN'],
          create: ['SUPER_ADMIN', 'OFFICE_ADMIN'],
          update: ['SUPER_ADMIN', 'OFFICE_ADMIN'],
          delete: ['SUPER_ADMIN', 'OFFICE_ADMIN']
        },
        employees: {
          read: ['SUPER_ADMIN', 'OFFICE_ADMIN'],
          create: ['SUPER_ADMIN', 'OFFICE_ADMIN'],
          update: ['SUPER_ADMIN', 'OFFICE_ADMIN'],
          delete: ['SUPER_ADMIN', 'OFFICE_ADMIN']
        },
        photos: {
          read: ['SUPER_ADMIN', 'OFFICE_ADMIN', 'PROJECT_MANAGER', 'FIELD_SUPERVISOR', 'FIELD_WORKER', 'CLIENT_READ_ONLY'],
          create: ['SUPER_ADMIN', 'OFFICE_ADMIN', 'PROJECT_MANAGER', 'FIELD_SUPERVISOR', 'FIELD_WORKER'],
          update: ['SUPER_ADMIN', 'OFFICE_ADMIN', 'PROJECT_MANAGER', 'FIELD_SUPERVISOR'],
          delete: ['SUPER_ADMIN', 'OFFICE_ADMIN', 'PROJECT_MANAGER']
        },
        documents: {
          read: ['SUPER_ADMIN', 'OFFICE_ADMIN', 'PROJECT_MANAGER', 'FIELD_SUPERVISOR'],
          create: ['SUPER_ADMIN', 'OFFICE_ADMIN', 'PROJECT_MANAGER', 'FIELD_SUPERVISOR'],
          update: ['SUPER_ADMIN', 'OFFICE_ADMIN', 'PROJECT_MANAGER', 'FIELD_SUPERVISOR'],
          delete: ['SUPER_ADMIN', 'OFFICE_ADMIN', 'PROJECT_MANAGER']
        }
      };

      // Check if user has permission for the resource and action
      const allowedRoles = permissions[resource]?.[action];
      if (!allowedRoles || !allowedRoles.includes(req.user.role)) {
        logger.warn('Authorization failed: Insufficient permissions', {
          userId: req.user.id,
          userRole: req.user.role,
          resource,
          action,
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
        resource,
        action,
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