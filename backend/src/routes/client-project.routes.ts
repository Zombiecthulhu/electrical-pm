/**
 * Client Project Routes
 * 
 * API routes for client project management including:
 * - Get projects associated with a client
 * - Project filtering and search
 * - Project statistics and analytics
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorization.middleware';
import {
  getClientProjectsController,
  getClientProjectController,
  getClientProjectStatisticsController
} from '../controllers/client-project.controller';
import { logger } from '../utils/logger';

const router = Router();

// Log all client project route access
router.use((req, _res, next) => {
  logger.info('Client project route accessed', {
    method: req.method,
    path: req.path,
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  });
  next();
});

/**
 * @route GET /api/v1/clients/:clientId/projects
 * @desc Get all projects for a client with optional filters and pagination
 * @access Private (authenticated users)
 */
router.get('/:clientId/projects', authenticate, authorize('clients', 'read'), getClientProjectsController);

/**
 * @route GET /api/v1/clients/:clientId/projects/:projectId
 * @desc Get single project by ID for a client
 * @access Private (authenticated users)
 */
router.get('/:clientId/projects/:projectId', authenticate, authorize('clients', 'read'), getClientProjectController);

/**
 * @route GET /api/v1/clients/:clientId/projects/statistics
 * @desc Get project statistics for a client
 * @access Private (authenticated users)
 */
router.get('/:clientId/projects/statistics', authenticate, authorize('clients', 'read'), getClientProjectStatisticsController);

export default router;
