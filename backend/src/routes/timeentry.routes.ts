import express from 'express';
import {
  getTimeEntriesForDate,
  getTimeEntriesForEmployee,
  getTimeEntriesForProject,
  getUnapprovedEntries,
  calculateDayTotal,
  createTimeEntry,
  bulkCreateTimeEntries,
  updateTimeEntry,
  deleteTimeEntry,
  approveTimeEntry,
  rejectTimeEntry,
} from '../controllers/timeentry.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/authorization.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Define allowed roles for different operations
const readRoles = [
  'SUPER_ADMIN',
  'OFFICE_ADMIN',
  'PROJECT_MANAGER',
  'FIELD_SUPERVISOR',
];

const writeRoles = ['SUPER_ADMIN', 'OFFICE_ADMIN', 'PROJECT_MANAGER'];

const approvalRoles = ['SUPER_ADMIN', 'OFFICE_ADMIN', 'PROJECT_MANAGER'];

const adminRoles = ['SUPER_ADMIN', 'OFFICE_ADMIN'];

// Read routes (specific routes first)
router.get('/unapproved', authorizeRoles(approvalRoles), getUnapprovedEntries);
router.get('/date', authorizeRoles(readRoles), getTimeEntriesForDate);
router.get(
  '/employee/:employeeId',
  authorizeRoles(readRoles),
  getTimeEntriesForEmployee
);
router.get(
  '/project/:projectId',
  authorizeRoles(readRoles),
  getTimeEntriesForProject
);
router.get(
  '/:employeeId/:date/total',
  authorizeRoles(readRoles),
  calculateDayTotal
);

// Write routes
router.post('/', authorizeRoles(writeRoles), createTimeEntry);
router.post('/bulk', authorizeRoles(writeRoles), bulkCreateTimeEntries);
router.put('/:id', authorizeRoles(writeRoles), updateTimeEntry);
router.delete('/:id', authorizeRoles(adminRoles), deleteTimeEntry);

// Approval routes
router.put('/:id/approve', authorizeRoles(approvalRoles), approveTimeEntry);
router.put('/:id/reject', authorizeRoles(approvalRoles), rejectTimeEntry);

export default router;

