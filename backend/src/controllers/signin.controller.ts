import { Request, Response } from 'express';
import * as signInService from '../services/signin.service';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';

/**
 * Sign-In Controller
 * Handles HTTP requests for employee sign-in/sign-out operations
 */

/**
 * Get today's sign-ins
 * GET /api/v1/sign-ins/today
 */
export const getTodaySignIns = async (req: Request, res: Response) => {
  try {
    const signIns = await signInService.getTodaySignIns();
    sendSuccess(res, signIns, 'Today\'s sign-ins retrieved successfully');
  } catch (error: any) {
    logger.error('Error in getTodaySignIns controller', { error });
    sendError(res, error.message);
  }
};

/**
 * Get sign-ins for a specific date
 * GET /api/v1/sign-ins/date?date=YYYY-MM-DD&employeeId=xxx&projectId=xxx
 */
export const getSignInsForDate = async (req: Request, res: Response) => {
  try {
    const { date, employeeId, projectId } = req.query;

    if (!date) {
      return sendError(res, 'Date parameter is required', 400);
    }

    const dateObj = new Date(date as string);
    if (isNaN(dateObj.getTime())) {
      return sendError(res, 'Invalid date format', 400);
    }

    const filters: any = {};
    if (employeeId) filters.employeeId = employeeId as string;
    if (projectId) filters.projectId = projectId as string;

    const signIns = await signInService.getSignInsForDate(dateObj, filters);
    sendSuccess(res, signIns, 'Sign-ins retrieved successfully');
  } catch (error: any) {
    logger.error('Error in getSignInsForDate controller', { error });
    sendError(res, error.message);
  }
};

/**
 * Get active sign-ins (not signed out yet)
 * GET /api/v1/sign-ins/active
 */
export const getActiveSignIns = async (req: Request, res: Response) => {
  try {
    const signIns = await signInService.getActiveSignIns();
    sendSuccess(res, signIns, 'Active sign-ins retrieved successfully');
  } catch (error: any) {
    logger.error('Error in getActiveSignIns controller', { error });
    sendError(res, error.message);
  }
};

/**
 * Get employee sign-in history
 * GET /api/v1/sign-ins/employee/:employeeId/history?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
export const getEmployeeHistory = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return sendError(res, 'startDate and endDate parameters are required', 400);
    }

    const startDateObj = new Date(startDate as string);
    const endDateObj = new Date(endDate as string);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return sendError(res, 'Invalid date format', 400);
    }

    const history = await signInService.getEmployeeSignInHistory(
      employeeId,
      startDateObj,
      endDateObj
    );
    sendSuccess(res, history, 'Employee sign-in history retrieved successfully');
  } catch (error: any) {
    logger.error('Error in getEmployeeHistory controller', { error });
    sendError(res, error.message);
  }
};

/**
 * Sign in an employee
 * POST /api/v1/sign-ins
 * Body: { employeeId, date, signInTime, location?, projectId?, notes? }
 */
export const signIn = async (req: Request, res: Response) => {
  try {
    const { employeeId, date, signInTime, location, projectId, notes } = req.body;
    const userId = req.user?.userId;

    // Validation
    if (!employeeId || !date || !signInTime) {
      return sendError(res, 'employeeId, date, and signInTime are required', 400);
    }

    if (!userId) {
      return sendError(res, 'User not authenticated', 401);
    }

    const dateObj = new Date(date);
    const signInTimeObj = new Date(signInTime);

    if (isNaN(dateObj.getTime()) || isNaN(signInTimeObj.getTime())) {
      return sendError(res, 'Invalid date format', 400);
    }

    const signInData = {
      employeeId,
      date: dateObj,
      signInTime: signInTimeObj,
      location,
      projectId,
      notes,
    };

    const signInRecord = await signInService.signIn(signInData, userId);
    sendSuccess(res, signInRecord, 'Employee signed in successfully', 201);
  } catch (error: any) {
    logger.error('Error in signIn controller', { error });
    
    if (error.message.includes('already signed in')) {
      return sendError(res, error.message, 409);
    }
    
    sendError(res, error.message);
  }
};

/**
 * Bulk sign in multiple employees
 * POST /api/v1/sign-ins/bulk
 * Body: { employeeIds[], date, signInTime, location?, projectId? }
 */
export const bulkSignIn = async (req: Request, res: Response) => {
  try {
    const { employeeIds, date, signInTime, location, projectId } = req.body;
    const userId = req.user?.userId;

    // Validation
    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return sendError(res, 'employeeIds array is required', 400);
    }

    if (!date || !signInTime) {
      return sendError(res, 'date and signInTime are required', 400);
    }

    if (!userId) {
      return sendError(res, 'User not authenticated', 401);
    }

    const dateObj = new Date(date);
    const signInTimeObj = new Date(signInTime);

    if (isNaN(dateObj.getTime()) || isNaN(signInTimeObj.getTime())) {
      return sendError(res, 'Invalid date format', 400);
    }

    const result = await signInService.bulkSignIn(
      employeeIds,
      dateObj,
      signInTimeObj,
      userId,
      location,
      projectId
    );

    sendSuccess(res, result, 'Bulk sign-in completed successfully', 201);
  } catch (error: any) {
    logger.error('Error in bulkSignIn controller', { error });
    sendError(res, error.message);
  }
};

/**
 * Sign out an employee
 * PUT /api/v1/sign-ins/:id/sign-out
 * Body: { signOutTime }
 */
export const signOut = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { signOutTime } = req.body;
    const userId = req.user?.userId;

    if (!signOutTime) {
      return sendError(res, 'signOutTime is required', 400);
    }

    if (!userId) {
      return sendError(res, 'User not authenticated', 401);
    }

    const signOutTimeObj = new Date(signOutTime);
    if (isNaN(signOutTimeObj.getTime())) {
      return sendError(res, 'Invalid date format', 400);
    }

    const signInRecord = await signInService.signOut(id, signOutTimeObj, userId);
    sendSuccess(res, signInRecord, 'Employee signed out successfully');
  } catch (error: any) {
    logger.error('Error in signOut controller', { error });
    
    if (error.message.includes('not found')) {
      return sendError(res, error.message, 404);
    }
    
    if (error.message.includes('already signed out')) {
      return sendError(res, error.message, 409);
    }
    
    sendError(res, error.message);
  }
};

