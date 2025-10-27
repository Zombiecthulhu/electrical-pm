/**
 * Client Project Controller
 * 
 * API route handlers for client project management including:
 * - Get projects associated with a client
 * - Project filtering and search
 * - Project statistics and analytics
 */

import { Response } from 'express';
import { 
  getClientProjects, 
  getClientProjectById, 
  getClientProjectStatistics,
  ClientProjectFilters,
  ClientProjectPaginationOptions
} from '../services/client-project.service';
import { successResponse, errorResponse } from '../utils/response';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * Get all projects for a client
 * GET /api/v1/clients/:clientId/projects
 */
export const getClientProjectsController = async (req: AuthRequest, res: Response): Promise<Response | undefined> => {
  try {
    const { clientId } = req.params;
    const { 
      status, 
      type, 
      search, 
      start_date_from, 
      start_date_to, 
      end_date_from, 
      end_date_to, 
      page, 
      limit 
    } = req.query;

    if (!clientId) {
      return res.status(400).json(errorResponse('Client ID is required', 'MISSING_CLIENT_ID'));
    }

    // Build filters object
    const filters: ClientProjectFilters = {};
    if (status) filters.status = status as string;
    if (type) filters.type = type as string;
    if (search) filters.search = search as string;
    if (start_date_from) filters.start_date_from = start_date_from as string;
    if (start_date_to) filters.start_date_to = start_date_to as string;
    if (end_date_from) filters.end_date_from = end_date_from as string;
    if (end_date_to) filters.end_date_to = end_date_to as string;

    // Build pagination object
    const pagination: ClientProjectPaginationOptions = {};
    if (page) pagination.page = parseInt(page as string);
    if (limit) pagination.limit = parseInt(limit as string);

    const result = await getClientProjects(clientId, filters, pagination);

    logger.info('Client projects retrieved successfully', {
      userId: req.user?.id,
      clientId,
      filters,
      pagination,
      resultCount: result.data.projects.length
    });

    return res.json(successResponse(result.data, 'Client projects retrieved successfully'));
  } catch (error: any) {
    logger.error('Error retrieving client projects', {
      error: error.message,
      userId: req.user?.id,
      clientId: req.params.clientId,
      query: req.query
    });
    return res.status(500).json(errorResponse('Failed to retrieve client projects', 'PROJECTS_RETRIEVAL_FAILED'));
  }
};

/**
 * Get single project by ID for a client
 * GET /api/v1/clients/:clientId/projects/:projectId
 */
export const getClientProjectController = async (req: AuthRequest, res: Response): Promise<Response | undefined> => {
  try {
    const { clientId, projectId } = req.params;

    if (!clientId) {
      return res.status(400).json(errorResponse('Client ID is required', 'MISSING_CLIENT_ID'));
    }

    if (!projectId) {
      return res.status(400).json(errorResponse('Project ID is required', 'MISSING_PROJECT_ID'));
    }

    const result = await getClientProjectById(clientId, projectId);

    logger.info('Client project retrieved successfully', {
      userId: req.user?.id,
      clientId,
      projectId
    });

    return res.json(successResponse(result.data, 'Client project retrieved successfully'));
  } catch (error: any) {
    logger.error('Error retrieving client project', {
      error: error.message,
      userId: req.user?.id,
      clientId: req.params.clientId,
      projectId: req.params.projectId
    });

    if (error.message.includes('not found')) {
      return res.status(404).json(errorResponse('Project not found', 'PROJECT_NOT_FOUND'));
    } else {
      return res.status(500).json(errorResponse('Failed to retrieve client project', 'PROJECT_RETRIEVAL_FAILED'));
    }
  }
};

/**
 * Get client project statistics
 * GET /api/v1/clients/:clientId/projects/statistics
 */
export const getClientProjectStatisticsController = async (req: AuthRequest, res: Response): Promise<Response | undefined> => {
  try {
    const { clientId } = req.params;

    if (!clientId) {
      return res.status(400).json(errorResponse('Client ID is required', 'MISSING_CLIENT_ID'));
    }

    const result = await getClientProjectStatistics(clientId);

    logger.info('Client project statistics retrieved successfully', {
      userId: req.user?.id,
      clientId
    });

    return res.json(successResponse(result.data, 'Client project statistics retrieved successfully'));
  } catch (error: any) {
    logger.error('Error retrieving client project statistics', {
      error: error.message,
      userId: req.user?.id,
      clientId: req.params.clientId
    });
    return res.status(500).json(errorResponse('Failed to retrieve client project statistics', 'PROJECT_STATISTICS_FAILED'));
  }
};
