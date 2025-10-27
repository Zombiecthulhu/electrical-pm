/**
 * Employee Routes
 * 
 * API routes for employee directory management
 */

import express from 'express';
import {
  getEmployees,
  getEmployee,
  createEmployeeController,
  updateEmployeeController,
  deleteEmployeeController,
  getClassifications,
  getStats
} from '../controllers/employee.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/authorization.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Define allowed roles for different operations
const readRoles = ['SUPER_ADMIN', 'OFFICE_ADMIN', 'PROJECT_MANAGER', 'FIELD_SUPERVISOR'];
const writeRoles = ['SUPER_ADMIN', 'OFFICE_ADMIN'];

// Statistics (must come before /:id route)
router.get('/stats', authorizeRoles(readRoles), getStats);

// Classifications (must come before /:id route)
router.get('/classifications', authorizeRoles(readRoles), getClassifications);

// CRUD routes
router.get('/', authorizeRoles(readRoles), getEmployees);
router.get('/:id', authorizeRoles(readRoles), getEmployee);
router.post('/', authorizeRoles(writeRoles), createEmployeeController);
router.put('/:id', authorizeRoles(writeRoles), updateEmployeeController);
router.delete('/:id', authorizeRoles(writeRoles), deleteEmployeeController);

export default router;

