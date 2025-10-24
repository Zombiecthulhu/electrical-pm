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
import { successResponse, errorResponse } from '../utils/response';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * Get all clients with optional filters and pagination
 * GET /api/v1/clients
 */
export const getClients = async (req: AuthRequest, res: Response): Promise<Response | undefined> => {
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

    return res.json(successResponse(result.data, 'Clients retrieved successfully'));
  } catch (error: any) {
    logger.error('Error retrieving clients', {
      error: error.message,
      userId: req.user?.id,
      query: req.query
    });
    return res.status(500).json(errorResponse('Failed to retrieve clients', 'CLIENTS_RETRIEVAL_FAILED'));
  }
};

/**
 * Get single client by ID
 * GET /api/v1/clients/:id
 */
export const getClient = async (req: AuthRequest, res: Response): Promise<Response | undefined> => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json(errorResponse('Client ID is required', 'MISSING_CLIENT_ID'));
      return;
    }

    const result = await getClientById(id);

    logger.info('Client retrieved successfully', {
      userId: req.user?.id,
      clientId: id
    });

    return res.json(successResponse(result.data, 'Client retrieved successfully'));
  } catch (error: any) {
    logger.error('Error retrieving client', {
      error: error.message,
      userId: req.user?.id,
      clientId: req.params.id
    });

    if (error.message.includes('not found')) {
      return res.status(404).json(errorResponse('Client not found', 'CLIENT_NOT_FOUND'));
    } else {
      return res.status(500).json(errorResponse('Failed to retrieve client', 'CLIENT_RETRIEVAL_FAILED'));
    }
  }
};

/**
 * Create new client
 * POST /api/v1/clients
 */
export const createClientController = async (req: AuthRequest, res: Response): Promise<Response | undefined> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json(errorResponse('User authentication required', 'UNAUTHORIZED'));
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
      return res.status(400).json(errorResponse('Missing required fields: name', 'MISSING_REQUIRED_FIELDS'));
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

    return res.status(201).json(successResponse(result.data, 'Client created successfully'));
  } catch (error: any) {
    logger.error('Error creating client', {
      error: error.message,
      userId: req.user?.id,
      body: req.body
    });

    return res.status(500).json(errorResponse('Failed to create client', 'CLIENT_CREATION_FAILED'));
  }
};

/**
 * Update existing client
 * PUT /api/v1/clients/:id
 */
export const updateClientController = async (req: AuthRequest, res: Response): Promise<Response | undefined> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json(errorResponse('User authentication required', 'UNAUTHORIZED'));
      return;
    }

    if (!id) {
      return res.status(400).json(errorResponse('Client ID is required', 'MISSING_CLIENT_ID'));
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

    return res.json(successResponse(result.data, 'Client updated successfully'));
  } catch (error: any) {
    logger.error('Error updating client', {
      error: error.message,
      userId: req.user?.id,
      clientId: req.params.id,
      body: req.body
    });

    if (error.message.includes('not found')) {
      return res.status(404).json(errorResponse('Client not found', 'CLIENT_NOT_FOUND'));
    } else {
      return res.status(500).json(errorResponse('Failed to update client', 'CLIENT_UPDATE_FAILED'));
    }
  }
};

/**
 * Delete client (soft delete)
 * DELETE /api/v1/clients/:id
 */
export const deleteClientController = async (req: AuthRequest, res: Response): Promise<Response | undefined> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json(errorResponse('User authentication required', 'UNAUTHORIZED'));
      return;
    }

    if (!id) {
      return res.status(400).json(errorResponse('Client ID is required', 'MISSING_CLIENT_ID'));
      return;
    }

    const result = await deleteClient(id, userId);

    logger.info('Client deleted successfully', {
      userId,
      clientId: id
    });

    return res.json(successResponse(result, 'Client deleted successfully'));
  } catch (error: any) {
    logger.error('Error deleting client', {
      error: error.message,
      userId: req.user?.id,
      clientId: req.params.id
    });

    if (error.message.includes('not found')) {
      return res.status(404).json(errorResponse('Client not found', 'CLIENT_NOT_FOUND'));
    } else {
      return res.status(500).json(errorResponse('Failed to delete client', 'CLIENT_DELETE_FAILED'));
    }
  }
};
