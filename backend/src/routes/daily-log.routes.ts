/**
 * Daily Log Routes
 * 
 * Defines API routes for daily log operations including CRUD,
 * filtering, and statistics for construction daily reports.
 */

import { Router } from 'express';
import {
  getAllDailyLogsController,
  getDailyLogByIdController,
  createDailyLogController,
  updateDailyLogController,
  deleteDailyLogController,
  getDailyLogsByProjectController,
  getDailyLogsByDateRangeController,
  getDailyLogStatsController,
} from '../controllers/daily-log.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorization.middleware';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route GET /api/v1/daily-logs
 * @desc Get all daily logs with optional filters and pagination
 * @access Private (requires authentication)
 * @permissions Read daily logs
 */
router.get('/', authorize('daily_logs', 'read'), getAllDailyLogsController);

/**
 * @route GET /api/v1/daily-logs/stats
 * @desc Get daily log statistics
 * @access Private (requires authentication)
 * @permissions Read daily logs
 */
router.get('/stats', authorize('daily_logs', 'read'), getDailyLogStatsController);

/**
 * @route GET /api/v1/daily-logs/project/:projectId
 * @desc Get daily logs for a specific project
 * @access Private (requires authentication)
 * @permissions Read daily logs
 */
router.get('/project/:projectId', authorize('daily_logs', 'read'), getDailyLogsByProjectController);

/**
 * @route GET /api/v1/daily-logs/date-range
 * @desc Get daily logs by date range
 * @access Private (requires authentication)
 * @permissions Read daily logs
 */
router.get('/date-range', authorize('daily_logs', 'read'), getDailyLogsByDateRangeController);

/**
 * @route GET /api/v1/daily-logs/:id
 * @desc Get single daily log by ID
 * @access Private (requires authentication)
 * @permissions Read daily logs
 */
router.get('/:id', authorize('daily_logs', 'read'), getDailyLogByIdController);

/**
 * @route POST /api/v1/daily-logs
 * @desc Create new daily log
 * @access Private (requires authentication)
 * @permissions Create daily logs
 */
router.post('/', authorize('daily_logs', 'create'), createDailyLogController);

/**
 * @route PUT /api/v1/daily-logs/:id
 * @desc Update existing daily log
 * @access Private (requires authentication)
 * @permissions Update daily logs
 */
router.put('/:id', authorize('daily_logs', 'update'), updateDailyLogController);

/**
 * @route DELETE /api/v1/daily-logs/:id
 * @desc Delete daily log
 * @access Private (requires authentication)
 * @permissions Delete daily logs
 */
router.delete('/:id', authorize('daily_logs', 'delete'), deleteDailyLogController);

export default router;
