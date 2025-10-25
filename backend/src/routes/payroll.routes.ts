import express from 'express';
import {
  getDailyReport,
  getWeeklyReport,
  getProjectCostReport,
  getPayrollSummary,
  downloadDailyCSV,
  downloadWeeklyCSV,
} from '../controllers/payroll.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/authorization.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Define allowed roles for payroll operations
// Only managers and admins can access payroll reports
const payrollRoles = ['SUPER_ADMIN', 'OFFICE_ADMIN', 'PROJECT_MANAGER'];

// Report routes
router.get('/daily', authorizeRoles(payrollRoles), getDailyReport);
router.get('/weekly', authorizeRoles(payrollRoles), getWeeklyReport);
router.get('/summary', authorizeRoles(payrollRoles), getPayrollSummary);
router.get(
  '/project/:projectId',
  authorizeRoles(payrollRoles),
  getProjectCostReport
);

// CSV export routes
router.get('/export/daily', authorizeRoles(payrollRoles), downloadDailyCSV);
router.get('/export/weekly', authorizeRoles(payrollRoles), downloadWeeklyCSV);

export default router;

