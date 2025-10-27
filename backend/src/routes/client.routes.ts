import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireProjectManager } from '../middleware/authorization.middleware';
import {
  getClients,
  getClient,
  createClientController,
  updateClientController,
  deleteClientController
} from '../controllers/client.controller';
import { logger } from '../utils/logger';

const router = Router();

// Log all client route access
router.use((req, _res, next) => {
  logger.info('Client route accessed', {
    method: req.method,
    path: req.path,
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  });
  next();
});

/**
 * @route GET /api/v1/clients
 * @desc Get all clients with optional filters and pagination
 * @access Private (authenticated users)
 */
router.get('/', authenticate, getClients);

/**
 * @route GET /api/v1/clients/:id
 * @desc Get single client by ID
 * @access Private (authenticated users)
 */
router.get('/:id', authenticate, getClient);

/**
 * @route POST /api/v1/clients
 * @desc Create new client
 * @access Private (project managers and above)
 */
router.post('/', authenticate, requireProjectManager, createClientController);

/**
 * @route PUT /api/v1/clients/:id
 * @desc Update existing client
 * @access Private (project managers and above)
 */
router.put('/:id', authenticate, requireProjectManager, updateClientController);

/**
 * @route DELETE /api/v1/clients/:id
 * @desc Delete client (soft delete)
 * @access Private (project managers and above)
 */
router.delete('/:id', authenticate, requireProjectManager, deleteClientController);

export default router;
