/**
 * Client Contact Routes
 * 
 * API routes for client contact management including:
 * - CRUD operations for client contacts
 * - Primary contact management
 * - Contact search and filtering
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorization.middleware';
import {
  getClientContactsController,
  getClientContactController,
  createClientContactController,
  updateClientContactController,
  deleteClientContactController,
  setPrimaryContactController
} from '../controllers/client-contact.controller';
import { logger } from '../utils/logger';

const router = Router();

// Log all client contact route access
router.use((req, _res, next) => {
  logger.info('Client contact route accessed', {
    method: req.method,
    path: req.path,
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  });
  next();
});

/**
 * @route GET /api/v1/clients/:clientId/contacts
 * @desc Get all contacts for a client with optional filters and pagination
 * @access Private (authenticated users)
 */
router.get('/:clientId/contacts', authenticate, authorize('clients', 'read'), getClientContactsController);

/**
 * @route GET /api/v1/clients/:clientId/contacts/:contactId
 * @desc Get single contact by ID
 * @access Private (authenticated users)
 */
router.get('/:clientId/contacts/:contactId', authenticate, authorize('clients', 'read'), getClientContactController);

/**
 * @route POST /api/v1/clients/:clientId/contacts
 * @desc Create new client contact
 * @access Private (project managers and above)
 */
router.post('/:clientId/contacts', authenticate, authorize('clients', 'create'), createClientContactController);

/**
 * @route PUT /api/v1/clients/:clientId/contacts/:contactId
 * @desc Update existing client contact
 * @access Private (project managers and above)
 */
router.put('/:clientId/contacts/:contactId', authenticate, authorize('clients', 'update'), updateClientContactController);

/**
 * @route DELETE /api/v1/clients/:clientId/contacts/:contactId
 * @desc Delete client contact
 * @access Private (project managers and above)
 */
router.delete('/:clientId/contacts/:contactId', authenticate, authorize('clients', 'delete'), deleteClientContactController);

/**
 * @route POST /api/v1/clients/:clientId/contacts/:contactId/primary
 * @desc Set contact as primary for the client
 * @access Private (project managers and above)
 */
router.post('/:clientId/contacts/:contactId/primary', authenticate, authorize('clients', 'update'), setPrimaryContactController);

export default router;
