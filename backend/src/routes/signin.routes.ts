import express from 'express';
import {
  getTodaySignIns,
  getSignInsForDate,
  getActiveSignIns,
  getEmployeeHistory,
  signIn,
  bulkSignIn,
  signOut,
} from '../controllers/signin.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/authorization.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Define allowed roles for sign-in operations
// Foremen, Field Supervisors, and above can manage sign-ins
const signInRoles = [
  'SUPER_ADMIN',
  'OFFICE_ADMIN',
  'PROJECT_MANAGER',
  'FIELD_SUPERVISOR',
];

// Read-only roles (can view sign-ins but not create/modify)
const readRoles = [...signInRoles, 'FIELD_WORKER'];

// Routes (specific routes first, parameterized routes last)
router.get('/today', authorizeRoles(readRoles), getTodaySignIns);
router.get('/active', authorizeRoles(readRoles), getActiveSignIns);
router.get('/date', authorizeRoles(readRoles), getSignInsForDate);
router.get(
  '/employee/:employeeId/history',
  authorizeRoles(readRoles),
  getEmployeeHistory
);

router.post('/', authorizeRoles(signInRoles), signIn);
router.post('/bulk', authorizeRoles(signInRoles), bulkSignIn);
router.put('/:id/sign-out', authorizeRoles(signInRoles), signOut);

export default router;

