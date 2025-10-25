/**
 * Employee Controller
 * 
 * Handles HTTP requests for employee directory management
 */

import { Response } from 'express';
import {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeClassifications,
  getEmploymentStats,
  EmployeeFilters,
  EmployeePaginationOptions,
  CreateEmployeeData,
  UpdateEmployeeData
} from '../services/employee.service';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * Get all employees with optional filters and pagination
 * GET /api/v1/employees
 */
export const getEmployees = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      classification,
      employment_status,
      department,
      is_active,
      search,
      page,
      limit,
      sortBy,
      sortOrder
    } = req.query;

    // Build filters object
    const filters: EmployeeFilters = {};
    
    if (classification) filters.classification = classification as string;
    if (employment_status) filters.employment_status = employment_status as string;
    if (department) filters.department = department as string;
    if (is_active !== undefined) filters.is_active = is_active === 'true';
    if (search) filters.search = search as string;

    // Build pagination object
    const pagination: EmployeePaginationOptions = {};
    if (page) pagination.page = parseInt(page as string);
    if (limit) pagination.limit = parseInt(limit as string);
    if (sortBy) pagination.sortBy = sortBy as string;
    if (sortOrder) pagination.sortOrder = sortOrder as 'asc' | 'desc';

    const result = await getAllEmployees(filters, pagination);

    logger.info('Employees retrieved successfully', {
      userId: req.user?.id,
      filters,
      pagination,
      resultCount: result.employees.length
    });

    sendSuccess(res, result, 'Employees retrieved successfully');
  } catch (error: any) {
    logger.error('Error retrieving employees', {
      error: error.message,
      userId: req.user?.id,
      query: req.query
    });
    sendError(res, 'EMPLOYEES_RETRIEVAL_FAILED', 'Failed to retrieve employees', 500);
  }
};

/**
 * Get single employee by ID
 * GET /api/v1/employees/:id
 */
export const getEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      sendError(res, 'MISSING_EMPLOYEE_ID', 'Employee ID is required', 400);
      return;
    }

    const employee = await getEmployeeById(id);

    if (!employee) {
      sendError(res, 'EMPLOYEE_NOT_FOUND', 'Employee not found', 404);
      return;
    }

    logger.info('Employee retrieved successfully', {
      userId: req.user?.id,
      employeeId: id
    });

    sendSuccess(res, employee, 'Employee retrieved successfully');
  } catch (error: any) {
    logger.error('Error retrieving employee', {
      error: error.message,
      userId: req.user?.id,
      employeeId: req.params.id
    });
    sendError(res, 'EMPLOYEE_RETRIEVAL_FAILED', 'Failed to retrieve employee', 500);
  }
};

/**
 * Create new employee
 * POST /api/v1/employees
 */
export const createEmployeeController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      sendError(res, 'UNAUTHORIZED', 'User authentication required', 401);
      return;
    }

    const {
      first_name,
      last_name,
      classification,
      user_id,
      email,
      phone,
      mobile_phone,
      hire_date,
      employment_status,
      employee_number,
      department,
      notes
    } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !classification) {
      sendError(res, 'MISSING_REQUIRED_FIELDS', 'Missing required fields: first_name, last_name, classification', 400);
      return;
    }

    const employeeData: CreateEmployeeData = {
      first_name,
      last_name,
      classification,
      user_id: user_id || null,
      email,
      phone,
      mobile_phone,
      hire_date: hire_date ? new Date(hire_date) : undefined,
      employment_status,
      employee_number,
      department,
      notes
    };

    const employee = await createEmployee(employeeData, userId);

    logger.info('Employee created successfully', {
      userId,
      employeeId: employee.id,
      name: `${employee.first_name} ${employee.last_name}`
    });

    sendSuccess(res, employee, 'Employee created successfully', 201);
  } catch (error: any) {
    logger.error('Error creating employee', {
      error: error.message,
      userId: req.user?.id,
      body: req.body
    });

    // Handle specific error cases
    if (error.message.includes('already exists')) {
      sendError(res, 'EMPLOYEE_NUMBER_EXISTS', error.message, 409);
    } else if (error.message.includes('already linked')) {
      sendError(res, 'USER_ALREADY_LINKED', error.message, 409);
    } else {
      sendError(res, 'EMPLOYEE_CREATION_FAILED', 'Failed to create employee', 500);
    }
  }
};

/**
 * Update employee
 * PUT /api/v1/employees/:id
 */
export const updateEmployeeController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      sendError(res, 'UNAUTHORIZED', 'User authentication required', 401);
      return;
    }

    if (!id) {
      sendError(res, 'MISSING_EMPLOYEE_ID', 'Employee ID is required', 400);
      return;
    }

    const {
      first_name,
      last_name,
      classification,
      user_id,
      email,
      phone,
      mobile_phone,
      hire_date,
      employment_status,
      employee_number,
      department,
      notes,
      is_active
    } = req.body;

    const employeeData: UpdateEmployeeData = {};

    if (first_name !== undefined) employeeData.first_name = first_name;
    if (last_name !== undefined) employeeData.last_name = last_name;
    if (classification !== undefined) employeeData.classification = classification;
    if (user_id !== undefined) employeeData.user_id = user_id;
    if (email !== undefined) employeeData.email = email;
    if (phone !== undefined) employeeData.phone = phone;
    if (mobile_phone !== undefined) employeeData.mobile_phone = mobile_phone;
    if (hire_date !== undefined) employeeData.hire_date = new Date(hire_date);
    if (employment_status !== undefined) employeeData.employment_status = employment_status;
    if (employee_number !== undefined) employeeData.employee_number = employee_number;
    if (department !== undefined) employeeData.department = department;
    if (notes !== undefined) employeeData.notes = notes;
    if (is_active !== undefined) employeeData.is_active = is_active;

    const employee = await updateEmployee(id, employeeData, userId);

    logger.info('Employee updated successfully', {
      userId,
      employeeId: id,
      name: `${employee.first_name} ${employee.last_name}`
    });

    sendSuccess(res, employee, 'Employee updated successfully');
  } catch (error: any) {
    logger.error('Error updating employee', {
      error: error.message,
      userId: req.user?.id,
      employeeId: req.params.id,
      body: req.body
    });

    // Handle specific error cases
    if (error.message.includes('not found')) {
      sendError(res, 'EMPLOYEE_NOT_FOUND', error.message, 404);
    } else if (error.message.includes('already exists')) {
      sendError(res, 'EMPLOYEE_NUMBER_EXISTS', error.message, 409);
    } else if (error.message.includes('already linked')) {
      sendError(res, 'USER_ALREADY_LINKED', error.message, 409);
    } else {
      sendError(res, 'EMPLOYEE_UPDATE_FAILED', 'Failed to update employee', 500);
    }
  }
};

/**
 * Delete employee (soft delete)
 * DELETE /api/v1/employees/:id
 */
export const deleteEmployeeController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      sendError(res, 'UNAUTHORIZED', 'User authentication required', 401);
      return;
    }

    if (!id) {
      sendError(res, 'MISSING_EMPLOYEE_ID', 'Employee ID is required', 400);
      return;
    }

    await deleteEmployee(id, userId);

    logger.info('Employee deleted successfully', {
      userId,
      employeeId: id
    });

    sendSuccess(res, null, 'Employee deleted successfully');
  } catch (error: any) {
    logger.error('Error deleting employee', {
      error: error.message,
      userId: req.user?.id,
      employeeId: req.params.id
    });

    if (error.message.includes('not found')) {
      sendError(res, 'EMPLOYEE_NOT_FOUND', error.message, 404);
    } else {
      sendError(res, 'EMPLOYEE_DELETION_FAILED', 'Failed to delete employee', 500);
    }
  }
};

/**
 * Get employee classifications
 * GET /api/v1/employees/classifications
 */
export const getClassifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const classifications = await getEmployeeClassifications();

    logger.info('Employee classifications retrieved', {
      userId: req.user?.id,
      count: classifications.length
    });

    sendSuccess(res, classifications, 'Classifications retrieved successfully');
  } catch (error: any) {
    logger.error('Error retrieving classifications', {
      error: error.message,
      userId: req.user?.id
    });
    sendError(res, 'CLASSIFICATIONS_RETRIEVAL_FAILED', 'Failed to retrieve classifications', 500);
  }
};

/**
 * Get employment statistics
 * GET /api/v1/employees/stats
 */
export const getStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stats = await getEmploymentStats();

    logger.info('Employment stats retrieved', {
      userId: req.user?.id,
      totalEmployees: stats.total
    });

    sendSuccess(res, stats, 'Statistics retrieved successfully');
  } catch (error: any) {
    logger.error('Error retrieving stats', {
      error: error.message,
      userId: req.user?.id
    });
    sendError(res, 'STATS_RETRIEVAL_FAILED', 'Failed to retrieve statistics', 500);
  }
};

