/**
 * Routes Index
 * 
 * This file exports all API route modules.
 * Routes define the API endpoints and map them to controller functions.
 * 
 * API Structure:
 * - /api/v1/auth         - Authentication (login, register, refresh)
 * - /api/v1/users        - User management
 * - /api/v1/projects     - Project management
 * - /api/v1/clients      - Client management
 * - /api/v1/files        - File upload/download
 * - /api/v1/documents    - Document management
 * - /api/v1/photos       - Photo management
 * - /api/v1/daily-logs   - Daily logs
 * - /api/v1/quotes       - Quote/bid management
 * - /api/v1/employees    - Employee directory
 * - /api/v1/sign-ins     - Daily sign-in/sign-out
 * - /api/v1/time-entries - Project time allocation
 * - /api/v1/payroll      - Payroll reports and exports
 * 
 * Export pattern:
 * export { authRoutes } from './auth.routes';
 * export { projectRoutes } from './project.routes';
 */

import { Router } from 'express';

// Create a router for API v1
const router = Router();

// Health check endpoint (example)
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Import route modules
import authRoutes from './auth.routes';
import adminRoutes from './admin.routes';
import healthRoutes from './health.routes';
import projectRoutes from './project.routes';
import clientRoutes from './client.routes';
import clientContactRoutes from './client-contact.routes';
import clientProjectRoutes from './client-project.routes';
import fileRoutes from './file.routes';
import dailyLogRoutes from './daily-log.routes';
import quoteRoutes from './quote.routes';
import employeeRoutes from './employee.routes';
import signInRoutes from './signin.routes';
import timeEntryRoutes from './timeentry.routes';
import payrollRoutes from './payroll.routes';

// Mount route modules
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/health', healthRoutes);
router.use('/projects', projectRoutes);
router.use('/clients', clientRoutes);
router.use('/clients', clientContactRoutes);
router.use('/clients', clientProjectRoutes);
router.use('/files', fileRoutes);
router.use('/daily-logs', dailyLogRoutes);
router.use('/quotes', quoteRoutes);
router.use('/employees', employeeRoutes);
router.use('/sign-ins', signInRoutes);
router.use('/time-entries', timeEntryRoutes);
router.use('/payroll', payrollRoutes);

// Additional route modules will be added here as they are created
// Example:
// import projectRoutes from './project.routes';
// router.use('/projects', projectRoutes);

// Export individual route modules for direct use if needed
export { default as authRoutes } from './auth.routes';
export { default as adminRoutes } from './admin.routes';

export default router;

