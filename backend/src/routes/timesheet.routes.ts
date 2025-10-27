import { Router } from 'express';
import * as timesheetController from '../controllers/timesheet.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorization.middleware';

const router = Router();

/**
 * Timesheet Routes
 * Base path: /api/v1/timesheets
 */

// Apply authentication to all routes
router.use(authenticate);

/**
 * GET /api/v1/timesheets
 * Get all timesheets with optional filters
 * Accessible by: SUPER_ADMIN, OFFICE_ADMIN, PROJECT_MANAGER, FIELD_SUPERVISOR
 */
router.get(
  '/',
  authorize('timesheets', 'read'),
  timesheetController.getAllTimesheets
);

/**
 * GET /api/v1/timesheets/date/:date
 * Get timesheets for a specific date
 * Accessible by: SUPER_ADMIN, OFFICE_ADMIN, PROJECT_MANAGER, FIELD_SUPERVISOR
 */
router.get(
  '/date/:date',
  authorize('timesheets', 'read'),
  timesheetController.getTimesheetsForDate
);

/**
 * GET /api/v1/timesheets/:id/pdf
 * Export timesheet as PDF
 * Accessible by: SUPER_ADMIN, OFFICE_ADMIN, PROJECT_MANAGER, FIELD_SUPERVISOR
 * Note: This must come before '/:id' route to avoid conflict
 */
router.get(
  '/:id/pdf',
  authorize('timesheets', 'read'),
  timesheetController.exportTimesheetToPDF
);

/**
 * GET /api/v1/timesheets/:id
 * Get a single timesheet by ID
 * Accessible by: SUPER_ADMIN, OFFICE_ADMIN, PROJECT_MANAGER, FIELD_SUPERVISOR
 */
router.get(
  '/:id',
  authorize('timesheets', 'read'),
  timesheetController.getTimesheetById
);

/**
 * POST /api/v1/timesheets
 * Create a new timesheet
 * Accessible by: SUPER_ADMIN, OFFICE_ADMIN, PROJECT_MANAGER, FIELD_SUPERVISOR
 */
router.post(
  '/',
  authorize('timesheets', 'create'),
  timesheetController.createTimesheet
);

/**
 * PUT /api/v1/timesheets/:id
 * Update an existing timesheet
 * Accessible by: SUPER_ADMIN, OFFICE_ADMIN, PROJECT_MANAGER, FIELD_SUPERVISOR
 */
router.put(
  '/:id',
  authorize('timesheets', 'update'),
  timesheetController.updateTimesheet
);

/**
 * POST /api/v1/timesheets/:id/submit
 * Submit a timesheet
 * Accessible by: SUPER_ADMIN, OFFICE_ADMIN, PROJECT_MANAGER, FIELD_SUPERVISOR
 */
router.post(
  '/:id/submit',
  authorize('timesheets', 'update'),
  timesheetController.submitTimesheet
);

/**
 * POST /api/v1/timesheets/:id/approve
 * Approve a timesheet
 * Accessible by: SUPER_ADMIN, OFFICE_ADMIN, PROJECT_MANAGER
 */
router.post(
  '/:id/approve',
  authorize('timesheets', 'approve'),
  timesheetController.approveTimesheet
);

/**
 * DELETE /api/v1/timesheets/:id
 * Delete a timesheet (only drafts)
 * Accessible by: SUPER_ADMIN, OFFICE_ADMIN, PROJECT_MANAGER
 */
router.delete(
  '/:id',
  authorize('timesheets', 'delete'),
  timesheetController.deleteTimesheet
);

export default router;

