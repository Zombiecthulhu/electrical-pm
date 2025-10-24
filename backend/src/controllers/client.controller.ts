import { Response } from 'express';
import { 
  getAllClients, 
  getClientById, 
  createClient, 
  updateClient, 
  deleteClient,
  ClientFilters,
  ClientPaginationOptions,
  CreateClientData,
  UpdateClientData
} from '../services/client.service';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * Get all clients with optional filters and pagination
 * GET /api/v1/clients
 */
export const getClients = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, type, page, limit } = req.query;

    // Build filters object
    const filters: ClientFilters = {};
    if (search) filters.search = search as string;
    if (type) filters.type = type as string;

    // Build pagination object
    const pagination: ClientPaginationOptions = {};
    if (page) pagination.page = parseInt(page as string);
    if (limit) pagination.limit = parseInt(limit as string);

    const result = await getAllClients(filters, pagination);

    logger.info('Clients retrieved successfully', {
      userId: req.user?.id,
      filters,
      pagination,
      resultCount: result.data.clients.length
    });

    sendSuccess(res, result.data, 'Clients retrieved successfully');
  } catch (error: any) {
    logger.error('Error retrieving clients', {
      error: error.message,
      userId: req.user?.id,
      query: req.query
    });
    sendError(res, 'CLIENTS_RETRIEVAL_FAILED', 'Failed to retrieve clients', 500);
  }
};

/**
 * Get single client by ID
 * GET /api/v1/clients/:id
 */
export const getClient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      sendError(res, 'MISSING_CLIENT_ID', 'Client ID is required', 400);
      return;
    }

    const result = await getClientById(id);

    logger.info('Client retrieved successfully', {
      userId: req.user?.id,
      clientId: id
    });

    sendSuccess(res, result.data, 'Client retrieved successfully');
  } catch (error: any) {
    logger.error('Error retrieving client', {
      error: error.message,
      userId: req.user?.id,
      clientId: req.params.id
    });

    if (error.message.includes('not found')) {
      sendError(res, 'CLIENT_NOT_FOUND', 'Client not found', 404);
    } else {
      sendError(res, 'CLIENT_RETRIEVAL_FAILED', 'Failed to retrieve client', 500);
    }
  }
};

/**
 * Create new client
 * POST /api/v1/clients
 */
export const createClientController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      sendError(res, 'UNAUTHORIZED', 'User authentication required', 401);
      return;
    }

    const {
      name,
      type,
      address,
      phone,
      email,
      website,
      tax_id,
      notes
    } = req.body;

    // Validate required fields
    if (!name) {
      sendError(res, 'MISSING_REQUIRED_FIELDS', 'Missing required fields: name', 400);
      return;
    }

    const clientData: CreateClientData = {
      name,
      type,
      address,
      phone,
      email,
      website,
      tax_id,
      notes
    };

    const result = await createClient(clientData, userId);

    logger.info('Client created successfully', {
      userId,
      clientId: result.data.id,
      clientName: result.data.name
    });

    sendSuccess(res, result.data, 'Client created successfully', 201);
  } catch (error: any) {
    logger.error('Error creating client', {
      error: error.message,
      userId: req.user?.id,
      body: req.body
    });

    sendError(res, 'CLIENT_CREATION_FAILED', 'Failed to create client', 500);
  }
};

/**
 * Update existing client
 * PUT /api/v1/clients/:id
 */
export const updateClientController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      sendError(res, 'UNAUTHORIZED', 'User authentication required', 401);
      return;
    }

    if (!id) {
      sendError(res, 'MISSING_CLIENT_ID', 'Client ID is required', 400);
      return;
    }

    const {
      name,
      type,
      address,
      phone,
      email,
      website,
      tax_id,
      notes
    } = req.body;

    const clientData: UpdateClientData = {
      name,
      type,
      address,
      phone,
      email,
      website,
      tax_id,
      notes
    };

    const result = await updateClient(id, clientData, userId);

    logger.info('Client updated successfully', {
      userId,
      clientId: id,
      clientName: result.data.name
    });

    sendSuccess(res, result.data, 'Client updated successfully');
  } catch (error: any) {
    logger.error('Error updating client', {
      error: error.message,
      userId: req.user?.id,
      clientId: req.params.id,
      body: req.body
    });

    if (error.message.includes('not found')) {
      sendError(res, 'CLIENT_NOT_FOUND', 'Client not found', 404);
    } else {
      sendError(res, 'CLIENT_UPDATE_FAILED', 'Failed to update client', 500);
    }
  }
};

/**
 * Delete client (soft delete)
 * DELETE /api/v1/clients/:id
 */
export const deleteClientController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      sendError(res, 'UNAUTHORIZED', 'User authentication required', 401);
      return;
    }

    if (!id) {
      sendError(res, 'MISSING_CLIENT_ID', 'Client ID is required', 400);
      return;
    }

    const result = await deleteClient(id, userId);

    logger.info('Client deleted successfully', {
      userId,
      clientId: id
    });

    sendSuccess(res, result, 'Client deleted successfully');
  } catch (error: any) {
    logger.error('Error deleting client', {
      error: error.message,
      userId: req.user?.id,
      clientId: req.params.id
    });

    if (error.message.includes('not found')) {
      sendError(res, 'CLIENT_NOT_FOUND', 'Client not found', 404);
    } else {
      sendError(res, 'CLIENT_DELETE_FAILED', 'Failed to delete client', 500);
    }
  }
};
