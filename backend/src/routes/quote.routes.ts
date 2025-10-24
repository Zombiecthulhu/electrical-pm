/**
 * Quote Routes
 * 
 * Defines API endpoints for quote/bid management operations.
 * All routes require authentication and appropriate authorization.
 */

import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';
import {
  createQuoteHandler,
  getQuoteByIdHandler,
  getQuoteByNumberHandler,
  listQuotesHandler,
  updateQuoteHandler,
  updateQuoteStatusHandler,
  deleteQuoteHandler,
  getQuoteStatsHandler,
  duplicateQuoteHandler
} from '../controllers/quote.controller';

const router = Router();

// All quote routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/quotes
 * @desc    Create a new quote
 * @access  Private (PROJECT_MANAGER, OFFICE_ADMIN, SUPER_ADMIN)
 */
router.post(
  '/',
  authorizeRoles(['PROJECT_MANAGER', 'OFFICE_ADMIN', 'SUPER_ADMIN']),
  createQuoteHandler
);

/**
 * @route   GET /api/v1/quotes
 * @desc    List quotes with filtering and pagination
 * @access  Private (All authenticated users)
 */
router.get('/', listQuotesHandler);

/**
 * @route   GET /api/v1/quotes/stats
 * @desc    Get quote statistics
 * @access  Private (All authenticated users)
 */
router.get('/stats', getQuoteStatsHandler);

/**
 * @route   GET /api/v1/quotes/number/:quoteNumber
 * @desc    Get quote by quote number
 * @access  Private (All authenticated users)
 */
router.get('/number/:quoteNumber', getQuoteByNumberHandler);

/**
 * @route   GET /api/v1/quotes/:id
 * @desc    Get quote by ID
 * @access  Private (All authenticated users)
 */
router.get('/:id', getQuoteByIdHandler);

/**
 * @route   PUT /api/v1/quotes/:id
 * @desc    Update quote
 * @access  Private (PROJECT_MANAGER, OFFICE_ADMIN, SUPER_ADMIN)
 */
router.put(
  '/:id',
  authorizeRoles(['PROJECT_MANAGER', 'OFFICE_ADMIN', 'SUPER_ADMIN']),
  updateQuoteHandler
);

/**
 * @route   PATCH /api/v1/quotes/:id/status
 * @desc    Update quote status
 * @access  Private (PROJECT_MANAGER, OFFICE_ADMIN, SUPER_ADMIN)
 */
router.patch(
  '/:id/status',
  authorizeRoles(['PROJECT_MANAGER', 'OFFICE_ADMIN', 'SUPER_ADMIN']),
  updateQuoteStatusHandler
);

/**
 * @route   POST /api/v1/quotes/:id/duplicate
 * @desc    Duplicate quote
 * @access  Private (PROJECT_MANAGER, OFFICE_ADMIN, SUPER_ADMIN)
 */
router.post(
  '/:id/duplicate',
  authorizeRoles(['PROJECT_MANAGER', 'OFFICE_ADMIN', 'SUPER_ADMIN']),
  duplicateQuoteHandler
);

/**
 * @route   DELETE /api/v1/quotes/:id
 * @desc    Delete quote
 * @access  Private (SUPER_ADMIN only)
 */
router.delete(
  '/:id',
  authorizeRoles(['SUPER_ADMIN']),
  deleteQuoteHandler
);

export default router;
