/**
 * Client Contact Controller
 * 
 * API route handlers for client contact management including:
 * - CRUD operations for client contacts
 * - Primary contact management
 * - Contact validation and error handling
 */

import { Response } from 'express';
import { 
  getClientContacts, 
  getClientContactById, 
  createClientContact, 
  updateClientContact, 
  deleteClientContact,
  setPrimaryContact,
  ClientContactFilters,
  CreateClientContactData,
  UpdateClientContactData
} from '../services/client-contact.service';
import { successResponse, errorResponse } from '../utils/response';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * Get all contacts for a client
 * GET /api/v1/clients/:clientId/contacts
 */
export const getClientContactsController = async (req: AuthRequest, res: Response): Promise<Response | undefined> => {
  try {
    const { clientId } = req.params;
    const { search, is_primary, page, limit } = req.query;

    if (!clientId) {
      return res.status(400).json(errorResponse('Client ID is required', 'MISSING_CLIENT_ID'));
    }

    // Build filters object
    const filters: ClientContactFilters = {};
    if (search) filters.search = search as string;
    if (is_primary !== undefined) filters.is_primary = is_primary === 'true';

    // Build pagination object
    const pagination: { page?: number; limit?: number } = {};
    if (page) pagination.page = parseInt(page as string);
    if (limit) pagination.limit = parseInt(limit as string);

    const result = await getClientContacts(clientId, filters, pagination);

    logger.info('Client contacts retrieved successfully', {
      userId: req.user?.id,
      clientId,
      filters,
      pagination,
      resultCount: result.data.contacts.length
    });

    return res.json(successResponse(result.data, 'Client contacts retrieved successfully'));
  } catch (error: any) {
    logger.error('Error retrieving client contacts', {
      error: error.message,
      userId: req.user?.id,
      clientId: req.params.clientId,
      query: req.query
    });
    return res.status(500).json(errorResponse('Failed to retrieve client contacts', 'CONTACTS_RETRIEVAL_FAILED'));
  }
};

/**
 * Get single contact by ID
 * GET /api/v1/clients/:clientId/contacts/:contactId
 */
export const getClientContactController = async (req: AuthRequest, res: Response): Promise<Response | undefined> => {
  try {
    const { contactId } = req.params;

    if (!contactId) {
      return res.status(400).json(errorResponse('Contact ID is required', 'MISSING_CONTACT_ID'));
    }

    const result = await getClientContactById(contactId);

    logger.info('Client contact retrieved successfully', {
      userId: req.user?.id,
      contactId
    });

    return res.json(successResponse(result.data, 'Client contact retrieved successfully'));
  } catch (error: any) {
    logger.error('Error retrieving client contact', {
      error: error.message,
      userId: req.user?.id,
      contactId: req.params.contactId
    });

    if (error.message.includes('not found')) {
      return res.status(404).json(errorResponse('Contact not found', 'CONTACT_NOT_FOUND'));
    } else {
      return res.status(500).json(errorResponse('Failed to retrieve client contact', 'CONTACT_RETRIEVAL_FAILED'));
    }
  }
};

/**
 * Create new client contact
 * POST /api/v1/clients/:clientId/contacts
 */
export const createClientContactController = async (req: AuthRequest, res: Response): Promise<Response | undefined> => {
  try {
    const { clientId } = req.params;
    const {
      name,
      title,
      phone,
      email,
      is_primary
    } = req.body;

    if (!clientId) {
      return res.status(400).json(errorResponse('Client ID is required', 'MISSING_CLIENT_ID'));
    }

    // Validate required fields
    if (!name) {
      return res.status(400).json(errorResponse('Contact name is required', 'MISSING_REQUIRED_FIELDS'));
    }

    const contactData: CreateClientContactData = {
      client_id: clientId,
      name,
      title,
      phone,
      email,
      is_primary
    };

    const result = await createClientContact(contactData);

    logger.info('Client contact created successfully', {
      userId: req.user?.id,
      clientId,
      contactId: result.data.id,
      contactName: result.data.name
    });

    return res.status(201).json(successResponse(result.data, 'Client contact created successfully'));
  } catch (error: any) {
    logger.error('Error creating client contact', {
      error: error.message,
      userId: req.user?.id,
      clientId: req.params.clientId,
      body: req.body
    });

    return res.status(500).json(errorResponse('Failed to create client contact', 'CONTACT_CREATION_FAILED'));
  }
};

/**
 * Update existing client contact
 * PUT /api/v1/clients/:clientId/contacts/:contactId
 */
export const updateClientContactController = async (req: AuthRequest, res: Response): Promise<Response | undefined> => {
  try {
    const { contactId } = req.params;
    const {
      name,
      title,
      phone,
      email,
      is_primary
    } = req.body;

    if (!contactId) {
      return res.status(400).json(errorResponse('Contact ID is required', 'MISSING_CONTACT_ID'));
    }

    const contactData: UpdateClientContactData = {
      name,
      title,
      phone,
      email,
      is_primary
    };

    const result = await updateClientContact(contactId, contactData);

    logger.info('Client contact updated successfully', {
      userId: req.user?.id,
      contactId,
      contactName: result.data.name
    });

    return res.json(successResponse(result.data, 'Client contact updated successfully'));
  } catch (error: any) {
    logger.error('Error updating client contact', {
      error: error.message,
      userId: req.user?.id,
      contactId: req.params.contactId,
      body: req.body
    });

    if (error.message.includes('not found')) {
      return res.status(404).json(errorResponse('Contact not found', 'CONTACT_NOT_FOUND'));
    } else {
      return res.status(500).json(errorResponse('Failed to update client contact', 'CONTACT_UPDATE_FAILED'));
    }
  }
};

/**
 * Delete client contact
 * DELETE /api/v1/clients/:clientId/contacts/:contactId
 */
export const deleteClientContactController = async (req: AuthRequest, res: Response): Promise<Response | undefined> => {
  try {
    const { contactId } = req.params;

    if (!contactId) {
      return res.status(400).json(errorResponse('Contact ID is required', 'MISSING_CONTACT_ID'));
    }

    const result = await deleteClientContact(contactId);

    logger.info('Client contact deleted successfully', {
      userId: req.user?.id,
      contactId
    });

    return res.json(successResponse(result, 'Client contact deleted successfully'));
  } catch (error: any) {
    logger.error('Error deleting client contact', {
      error: error.message,
      userId: req.user?.id,
      contactId: req.params.contactId
    });

    if (error.message.includes('not found')) {
      return res.status(404).json(errorResponse('Contact not found', 'CONTACT_NOT_FOUND'));
    } else {
      return res.status(500).json(errorResponse('Failed to delete client contact', 'CONTACT_DELETE_FAILED'));
    }
  }
};

/**
 * Set primary contact for a client
 * POST /api/v1/clients/:clientId/contacts/:contactId/primary
 */
export const setPrimaryContactController = async (req: AuthRequest, res: Response): Promise<Response | undefined> => {
  try {
    const { contactId } = req.params;

    if (!contactId) {
      return res.status(400).json(errorResponse('Contact ID is required', 'MISSING_CONTACT_ID'));
    }

    const result = await setPrimaryContact(contactId);

    logger.info('Primary contact set successfully', {
      userId: req.user?.id,
      contactId
    });

    return res.json(successResponse(result.data, 'Primary contact set successfully'));
  } catch (error: any) {
    logger.error('Error setting primary contact', {
      error: error.message,
      userId: req.user?.id,
      contactId: req.params.contactId
    });

    if (error.message.includes('not found')) {
      return res.status(404).json(errorResponse('Contact not found', 'CONTACT_NOT_FOUND'));
    } else {
      return res.status(500).json(errorResponse('Failed to set primary contact', 'PRIMARY_CONTACT_SET_FAILED'));
    }
  }
};
