import { Request, Response } from 'express';
import * as timeEntryService from '../services/timeentry.service';
import { sendSuccess, sendError, sendCreated } from '../utils/response';
import { logger } from '../utils/logger';

/**
 * Time Entry Controller
 * Handles HTTP requests for project time allocation
 */

/**
 * Get time entries for a specific date
 * GET /api/v1/time-entries/date?date=YYYY-MM-DD&employeeId=xxx&projectId=xxx&status=xxx
 */
export const getTimeEntriesForDate = async (req: Request, res: Response) => {
  try {
    const { date, employeeId, projectId, status } = req.query;

    if (!date) {
      return sendError(res, 'VALIDATION_ERROR', 'Date parameter is required', 400);
    }

    const dateObj = new Date(date as string);
    if (isNaN(dateObj.getTime())) {
      return sendError(res, 'VALIDATION_ERROR', 'Invalid date format', 400);
    }

    const filters: any = {};
    if (employeeId) filters.employeeId = employeeId as string;
    if (projectId) filters.projectId = projectId as string;
    if (status) filters.status = status as string;

    const timeEntries = await timeEntryService.getTimeEntriesForDate(dateObj, filters);
    return sendSuccess(res, timeEntries, 'Time entries retrieved successfully');
  } catch (error: any) {
    logger.error('Error in getTimeEntriesForDate controller', { error });
    return sendError(res, 'FETCH_ERROR', error.message || 'Failed to fetch time entries');
  }
};

/**
 * Get time entries for an employee
 * GET /api/v1/time-entries/employee/:employeeId?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
export const getTimeEntriesForEmployee = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;

    if (!employeeId) {
      return sendError(res, 'VALIDATION_ERROR', 'employeeId parameter is required', 400);
    }

    if (!startDate || !endDate) {
      return sendError(res, 'VALIDATION_ERROR', 'startDate and endDate parameters are required', 400);
    }

    const startDateObj = new Date(startDate as string);
    const endDateObj = new Date(endDate as string);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return sendError(res, 'VALIDATION_ERROR', 'Invalid date format', 400);
    }

    const timeEntries = await timeEntryService.getTimeEntriesForEmployee(
      employeeId,
      startDateObj,
      endDateObj
    );
    return sendSuccess(res, timeEntries, 'Employee time entries retrieved successfully');
  } catch (error: any) {
    logger.error('Error in getTimeEntriesForEmployee controller', { error });
    return sendError(res, 'FETCH_ERROR', error.message || 'Failed to fetch employee time entries');
  }
};

/**
 * Get time entries for a project
 * GET /api/v1/time-entries/project/:projectId?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
export const getTimeEntriesForProject = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { startDate, endDate } = req.query;

    if (!projectId) {
      return sendError(res, 'VALIDATION_ERROR', 'projectId parameter is required', 400);
    }

    if (!startDate || !endDate) {
      return sendError(res, 'VALIDATION_ERROR', 'startDate and endDate parameters are required', 400);
    }

    const startDateObj = new Date(startDate as string);
    const endDateObj = new Date(endDate as string);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return sendError(res, 'VALIDATION_ERROR', 'Invalid date format', 400);
    }

    const timeEntries = await timeEntryService.getTimeEntriesForProject(
      projectId,
      startDateObj,
      endDateObj
    );
    return sendSuccess(res, timeEntries, 'Project time entries retrieved successfully');
  } catch (error: any) {
    logger.error('Error in getTimeEntriesForProject controller', { error });
    return sendError(res, 'FETCH_ERROR', error.message || 'Failed to fetch project time entries');
  }
};

/**
 * Create a time entry
 * POST /api/v1/time-entries
 * Body: { employeeId, date, projectId, hoursWorked, startTime?, endTime?, workType?, description?, taskPerformed? }
 */
export const createTimeEntry = async (req: Request, res: Response) => {
  try {
    const { employeeId, date, projectId, hoursWorked, startTime, endTime, workType, description, taskPerformed } = req.body;
    const userId = req.user?.id;

    // Validation
    if (!employeeId || !date || !projectId || !hoursWorked) {
      return sendError(res, 'VALIDATION_ERROR', 'employeeId, date, projectId, and hoursWorked are required', 400);
    }

    if (!userId) {
      return sendError(res, 'AUTH_ERROR', 'User not authenticated', 401);
    }

    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return sendError(res, 'VALIDATION_ERROR', 'Invalid date format', 400);
    }

    const timeEntryData: any = {
      employeeId,
      date: dateObj,
      projectId,
      hoursWorked: parseFloat(hoursWorked),
      workType,
      description,
      taskPerformed,
    };

    if (startTime) {
      const startTimeObj = new Date(startTime);
      if (!isNaN(startTimeObj.getTime())) {
        timeEntryData.startTime = startTimeObj;
      }
    }

    if (endTime) {
      const endTimeObj = new Date(endTime);
      if (!isNaN(endTimeObj.getTime())) {
        timeEntryData.endTime = endTimeObj;
      }
    }

    const timeEntry = await timeEntryService.create(timeEntryData, userId);
    return sendCreated(res, timeEntry, 'Time entry created successfully');
  } catch (error: any) {
    logger.error('Error in createTimeEntry controller', { error });
    return sendError(res, 'CREATE_ERROR', error.message || 'Failed to create time entry');
  }
};

/**
 * Update a time entry
 * PUT /api/v1/time-entries/:id
 */
export const updateTimeEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user?.id;

    if (!id) {
      return sendError(res, 'VALIDATION_ERROR', 'Time entry ID is required', 400);
    }

    if (!userId) {
      return sendError(res, 'AUTH_ERROR', 'User not authenticated', 401);
    }

    // Convert date strings to Date objects
    if (updateData.date) {
      const dateObj = new Date(updateData.date);
      if (isNaN(dateObj.getTime())) {
        return sendError(res, 'VALIDATION_ERROR', 'Invalid date format', 400);
      }
      updateData.date = dateObj;
    }

    if (updateData.startTime) {
      const startTimeObj = new Date(updateData.startTime);
      if (!isNaN(startTimeObj.getTime())) {
        updateData.startTime = startTimeObj;
      }
    }

    if (updateData.endTime) {
      const endTimeObj = new Date(updateData.endTime);
      if (!isNaN(endTimeObj.getTime())) {
        updateData.endTime = endTimeObj;
      }
    }

    if (updateData.hoursWorked) {
      updateData.hoursWorked = parseFloat(updateData.hoursWorked);
    }

    const timeEntry = await timeEntryService.update(id, updateData, userId);
    return sendSuccess(res, timeEntry, 'Time entry updated successfully');
  } catch (error: any) {
    logger.error('Error in updateTimeEntry controller', { error });
    
    if (error.message.includes('not found')) {
      return sendError(res, 'NOT_FOUND', error.message, 404);
    }
    
    return sendError(res, 'UPDATE_ERROR', error.message || 'Failed to update time entry');
  }
};

/**
 * Delete a time entry
 * DELETE /api/v1/time-entries/:id
 */
export const deleteTimeEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return sendError(res, 'VALIDATION_ERROR', 'Time entry ID is required', 400);
    }

    await timeEntryService.deleteTimeEntry(id);
    return sendSuccess(res, { id }, 'Time entry deleted successfully');
  } catch (error: any) {
    logger.error('Error in deleteTimeEntry controller', { error });
    
    if (error.message.includes('not found')) {
      return sendError(res, 'NOT_FOUND', error.message, 404);
    }
    
    return sendError(res, 'DELETE_ERROR', error.message || 'Failed to delete time entry');
  }
};

/**
 * Bulk create time entries
 * POST /api/v1/time-entries/bulk
 * Body: { entries: [{ employeeId, date, projectId, hoursWorked, ... }] }
 */
export const bulkCreateTimeEntries = async (req: Request, res: Response) => {
  try {
    const { entries } = req.body;
    const userId = req.user?.id;

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return sendError(res, 'VALIDATION_ERROR', 'entries array is required', 400);
    }

    if (!userId) {
      return sendError(res, 'AUTH_ERROR', 'User not authenticated', 401);
    }

    // Process and validate all entries
    const processedEntries = entries.map((entry: any) => {
      const dateObj = new Date(entry.date);
      if (isNaN(dateObj.getTime())) {
        throw new Error(`Invalid date format in entry for employee ${entry.employeeId}`);
      }

      const processed: any = {
        employeeId: entry.employeeId,
        date: dateObj,
        projectId: entry.projectId,
        hoursWorked: parseFloat(entry.hoursWorked),
        workType: entry.workType,
        description: entry.description,
        taskPerformed: entry.taskPerformed,
      };

      if (entry.startTime) {
        const startTimeObj = new Date(entry.startTime);
        if (!isNaN(startTimeObj.getTime())) {
          processed.startTime = startTimeObj;
        }
      }

      if (entry.endTime) {
        const endTimeObj = new Date(entry.endTime);
        if (!isNaN(endTimeObj.getTime())) {
          processed.endTime = endTimeObj;
        }
      }

      return processed;
    });

    const timeEntries = await timeEntryService.bulkCreate(processedEntries, userId);
    return sendCreated(res, timeEntries, 'Time entries created successfully');
  } catch (error: any) {
    logger.error('Error in bulkCreateTimeEntries controller', { error });
    return sendError(res, 'BULK_CREATE_ERROR', error.message || 'Failed to bulk create time entries');
  }
};

/**
 * Calculate day total for employee
 * GET /api/v1/time-entries/:employeeId/:date/total
 */
export const calculateDayTotal = async (req: Request, res: Response) => {
  try {
    const { employeeId, date } = req.params;

    if (!employeeId || !date) {
      return sendError(res, 'VALIDATION_ERROR', 'employeeId and date parameters are required', 400);
    }

    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return sendError(res, 'VALIDATION_ERROR', 'Invalid date format', 400);
    }

    const total = await timeEntryService.calculateDayTotal(employeeId, dateObj);
    return sendSuccess(res, { employeeId, date, totalHours: total }, 'Day total calculated successfully');
  } catch (error: any) {
    logger.error('Error in calculateDayTotal controller', { error });
    return sendError(res, 'CALCULATION_ERROR', error.message || 'Failed to calculate day total');
  }
};

/**
 * Approve a time entry
 * PUT /api/v1/time-entries/:id/approve
 */
export const approveTimeEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!id) {
      return sendError(res, 'VALIDATION_ERROR', 'Time entry ID is required', 400);
    }

    if (!userId) {
      return sendError(res, 'AUTH_ERROR', 'User not authenticated', 401);
    }

    const timeEntry = await timeEntryService.approve(id, userId);
    return sendSuccess(res, timeEntry, 'Time entry approved successfully');
  } catch (error: any) {
    logger.error('Error in approveTimeEntry controller', { error });
    
    if (error.message.includes('not found')) {
      return sendError(res, 'NOT_FOUND', error.message, 404);
    }
    
    return sendError(res, 'APPROVAL_ERROR', error.message || 'Failed to approve time entry');
  }
};

/**
 * Reject a time entry
 * PUT /api/v1/time-entries/:id/reject
 * Body: { reason: string }
 */
export const rejectTimeEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id;

    if (!id) {
      return sendError(res, 'VALIDATION_ERROR', 'Time entry ID is required', 400);
    }

    if (!userId) {
      return sendError(res, 'AUTH_ERROR', 'User not authenticated', 401);
    }

    if (!reason) {
      return sendError(res, 'VALIDATION_ERROR', 'Rejection reason is required', 400);
    }

    const timeEntry = await timeEntryService.reject(id, userId, reason);
    return sendSuccess(res, timeEntry, 'Time entry rejected successfully');
  } catch (error: any) {
    logger.error('Error in rejectTimeEntry controller', { error });
    
    if (error.message.includes('not found')) {
      return sendError(res, 'NOT_FOUND', error.message, 404);
    }
    
    return sendError(res, 'REJECTION_ERROR', error.message || 'Failed to reject time entry');
  }
};

/**
 * Get unapproved time entries
 * GET /api/v1/time-entries/unapproved
 */
export const getUnapprovedEntries = async (_req: Request, res: Response) => {
  try {
    const timeEntries = await timeEntryService.getUnapprovedEntries();
    return sendSuccess(res, timeEntries, 'Unapproved time entries retrieved successfully');
  } catch (error: any) {
    logger.error('Error in getUnapprovedEntries controller', { error });
    return sendError(res, 'FETCH_ERROR', error.message || 'Failed to fetch unapproved entries');
  }
};
