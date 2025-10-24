/**
 * Quote Controller
 * 
 * Handles HTTP requests for quote/bid management operations.
 * Implements proper validation, error handling, and response formatting.
 */

import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { ApiError, successResponse, errorResponse } from '../utils/response';
import {
  createQuote,
  getQuoteById,
  getQuoteByNumber,
  listQuotes,
  updateQuote,
  updateQuoteStatus,
  deleteQuote,
  getQuoteStats,
  duplicateQuote,
  CreateQuoteData,
  UpdateQuoteData,
  QuoteFilters,
} from '../services/quote.service';
import { QuoteStatus } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * Create a new quote
 * POST /api/v1/quotes
 */
export const createQuoteHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json(errorResponse('Authentication required', 'UNAUTHORIZED'));
      return;
    }

    const {
      client_id,
      project_name,
      line_items,
      subtotal,
      tax,
      total,
      notes,
      valid_until,
      status
    } = req.body;

    // Validate required fields
    if (!client_id || !project_name || !line_items) {
      res.status(400).json(errorResponse('Missing required fields', 'VALIDATION_ERROR'));
      return;
    }

    // Validate line items structure
    if (!Array.isArray(line_items) || line_items.length === 0) {
      res.status(400).json(errorResponse('At least one line item is required', 'VALIDATION_ERROR'));
      return;
    }

    // Validate status if provided
    if (status && !Object.values(QuoteStatus).includes(status)) {
      res.status(400).json(errorResponse('Invalid quote status', 'VALIDATION_ERROR'));
      return;
    }

    const quoteData: CreateQuoteData = {
      client_id,
      project_name,
      line_items,
      subtotal,
      tax,
      total,
      notes,
      valid_until: valid_until ? new Date(valid_until) : undefined,
      status: status as QuoteStatus
    };

    const quote = await createQuote(quoteData, userId);

    logger.info('Quote created via API', {
      quoteId: quote.id,
      quoteNumber: quote.quote_number,
      clientId: client_id,
      userId
    });

    res.status(201).json(successResponse(quote, 'Quote created successfully'));
  } catch (error) {
    logger.error('Create quote API error', { error, body: req.body, userId: req.user?.id });
    
    if (error instanceof ApiError) {
      res.status(error.statusCode).json(errorResponse(error.message, error.code));
      return;
    }
    
    res.status(500).json(errorResponse('Failed to create quote', 'INTERNAL_ERROR'));
  }
};

/**
 * Get quote by ID
 * GET /api/v1/quotes/:id
 */
export const getQuoteByIdHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json(errorResponse('Quote ID is required', 'VALIDATION_ERROR'));
      return;
    }

    const quote = await getQuoteById(id);

    if (!quote) {
      res.status(404).json(errorResponse('Quote not found', 'NOT_FOUND'));
      return;
    }

    res.json(successResponse(quote, 'Quote retrieved successfully'));
  } catch (error) {
    logger.error('Get quote by ID API error', { error, quoteId: req.params.id });
    
    if (error instanceof ApiError) {
      res.status(error.statusCode).json(errorResponse(error.message, error.code));
      return;
    }
    
    res.status(500).json(errorResponse('Failed to retrieve quote', 'INTERNAL_ERROR'));
  }
};

/**
 * Get quote by quote number
 * GET /api/v1/quotes/number/:quoteNumber
 */
export const getQuoteByNumberHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { quoteNumber } = req.params;

    if (!quoteNumber) {
      res.status(400).json(errorResponse('Quote number is required', 'VALIDATION_ERROR'));
      return;
    }

    const quote = await getQuoteByNumber(quoteNumber);

    if (!quote) {
      res.status(404).json(errorResponse('Quote not found', 'NOT_FOUND'));
      return;
    }

    res.json(successResponse(quote, 'Quote retrieved successfully'));
  } catch (error) {
    logger.error('Get quote by number API error', { error, quoteNumber: req.params.quoteNumber });
    
    if (error instanceof ApiError) {
      res.status(error.statusCode).json(errorResponse(error.message, error.code));
      return;
    }
    
    res.status(500).json(errorResponse('Failed to retrieve quote', 'INTERNAL_ERROR'));
  }
};

/**
 * List quotes with filtering and pagination
 * GET /api/v1/quotes
 */
export const listQuotesHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      client_id,
      status,
      created_by,
      search,
      date_from,
      date_to,
      page = '1',
      limit = '20'
    } = req.query;

    // Parse pagination parameters
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    if (isNaN(pageNum) || pageNum < 1) {
      res.status(400).json(errorResponse('Invalid page number', 'VALIDATION_ERROR'));
      return;
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      res.status(400).json(errorResponse('Invalid limit (must be 1-100)', 'VALIDATION_ERROR'));
      return;
    }

    // Validate status if provided
    if (status && !Object.values(QuoteStatus).includes(status as QuoteStatus)) {
      res.status(400).json(errorResponse('Invalid quote status', 'VALIDATION_ERROR'));
      return;
    }

    // Build filters
    const filters: QuoteFilters = {
      client_id: client_id as string,
      status: status as QuoteStatus,
      created_by: created_by as string,
      search: search as string,
      date_from: date_from ? new Date(date_from as string) : undefined,
      date_to: date_to ? new Date(date_to as string) : undefined
    };

    const result = await listQuotes(filters, pageNum, limitNum);

    res.json(successResponse(result, 'Quotes retrieved successfully'));
  } catch (error) {
    logger.error('List quotes API error', { error, query: req.query });
    
    if (error instanceof ApiError) {
      res.status(error.statusCode).json(errorResponse(error.message, error.code));
      return;
    }
    
    res.status(500).json(errorResponse('Failed to retrieve quotes', 'INTERNAL_ERROR'));
  }
};

/**
 * Update quote
 * PUT /api/v1/quotes/:id
 */
export const updateQuoteHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json(errorResponse('Authentication required', 'UNAUTHORIZED'));
      return;
    }

    if (!id) {
      res.status(400).json(errorResponse('Quote ID is required', 'VALIDATION_ERROR'));
      return;
    }

    const {
      project_name,
      line_items,
      subtotal,
      tax,
      total,
      notes,
      valid_until,
      status
    } = req.body;

    // Validate status if provided
    if (status && !Object.values(QuoteStatus).includes(status)) {
      res.status(400).json(errorResponse('Invalid quote status', 'VALIDATION_ERROR'));
      return;
    }

    // Validate line items if provided
    if (line_items && (!Array.isArray(line_items) || line_items.length === 0)) {
      res.status(400).json(errorResponse('At least one line item is required', 'VALIDATION_ERROR'));
      return;
    }

    const updateData: UpdateQuoteData = {
      project_name,
      line_items,
      subtotal,
      tax,
      total,
      notes,
      valid_until: valid_until ? new Date(valid_until) : undefined,
      status: status as QuoteStatus
    };

    const quote = await updateQuote(id, updateData, userId);

    logger.info('Quote updated via API', {
      quoteId: quote.id,
      quoteNumber: quote.quote_number,
      userId
    });

    res.json(successResponse(quote, 'Quote updated successfully'));
  } catch (error) {
    logger.error('Update quote API error', { error, quoteId: req.params.id, body: req.body, userId: req.user?.id });
    
    if (error instanceof ApiError) {
      res.status(error.statusCode).json(errorResponse(error.message, error.code));
      return;
    }
    
    res.status(500).json(errorResponse('Failed to update quote', 'INTERNAL_ERROR'));
  }
};

/**
 * Update quote status
 * PATCH /api/v1/quotes/:id/status
 */
export const updateQuoteStatusHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json(errorResponse('Authentication required', 'UNAUTHORIZED'));
      return;
    }

    if (!id) {
      res.status(400).json(errorResponse('Quote ID is required', 'VALIDATION_ERROR'));
      return;
    }

    if (!status || !Object.values(QuoteStatus).includes(status)) {
      res.status(400).json(errorResponse('Valid quote status is required', 'VALIDATION_ERROR'));
      return;
    }

    const quote = await updateQuoteStatus(id, status, userId);

    logger.info('Quote status updated via API', {
      quoteId: quote.id,
      quoteNumber: quote.quote_number,
      status,
      userId
    });

    res.json(successResponse(quote, 'Quote status updated successfully'));
  } catch (error) {
    logger.error('Update quote status API error', { error, quoteId: req.params.id, status: req.body.status, userId: req.user?.id });
    
    if (error instanceof ApiError) {
      res.status(error.statusCode).json(errorResponse(error.message, error.code));
      return;
    }
    
    res.status(500).json(errorResponse('Failed to update quote status', 'INTERNAL_ERROR'));
  }
};

/**
 * Delete quote
 * DELETE /api/v1/quotes/:id
 */
export const deleteQuoteHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json(errorResponse('Quote ID is required', 'VALIDATION_ERROR'));
      return;
    }

    await deleteQuote(id);

    logger.info('Quote deleted via API', {
      quoteId: id,
      userId: req.user?.id
    });

    res.json(successResponse(null, 'Quote deleted successfully'));
  } catch (error) {
    logger.error('Delete quote API error', { error, quoteId: req.params.id, userId: req.user?.id });
    
    if (error instanceof ApiError) {
      res.status(error.statusCode).json(errorResponse(error.message, error.code));
      return;
    }
    
    res.status(500).json(errorResponse('Failed to delete quote', 'INTERNAL_ERROR'));
  }
};

/**
 * Get quote statistics
 * GET /api/v1/quotes/stats
 */
export const getQuoteStatsHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      client_id,
      created_by,
      date_from,
      date_to
    } = req.query;

    const filters: QuoteFilters = {
      client_id: client_id as string,
      created_by: created_by as string,
      date_from: date_from ? new Date(date_from as string) : undefined,
      date_to: date_to ? new Date(date_to as string) : undefined
    };

    const stats = await getQuoteStats(filters);

    res.json(successResponse(stats, 'Quote statistics retrieved successfully'));
  } catch (error) {
    logger.error('Get quote stats API error', { error, query: req.query });
    
    if (error instanceof ApiError) {
      res.status(error.statusCode).json(errorResponse(error.message, error.code));
      return;
    }
    
    res.status(500).json(errorResponse('Failed to retrieve quote statistics', 'INTERNAL_ERROR'));
  }
};

/**
 * Duplicate quote
 * POST /api/v1/quotes/:id/duplicate
 */
export const duplicateQuoteHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { project_name } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json(errorResponse('Authentication required', 'UNAUTHORIZED'));
      return;
    }

    if (!id) {
      res.status(400).json(errorResponse('Quote ID is required', 'VALIDATION_ERROR'));
      return;
    }

    if (!project_name) {
      res.status(400).json(errorResponse('Project name is required for duplication', 'VALIDATION_ERROR'));
      return;
    }

    const quote = await duplicateQuote(id, project_name, userId);

    logger.info('Quote duplicated via API', {
      originalQuoteId: id,
      newQuoteId: quote.id,
      quoteNumber: quote.quote_number,
      userId
    });

    res.status(201).json(successResponse(quote, 'Quote duplicated successfully'));
  } catch (error) {
    logger.error('Duplicate quote API error', { error, quoteId: req.params.id, body: req.body, userId: req.user?.id });
    
    if (error instanceof ApiError) {
      res.status(error.statusCode).json(errorResponse(error.message, error.code));
      return;
    }
    
    res.status(500).json(errorResponse('Failed to duplicate quote', 'INTERNAL_ERROR'));
  }
};
