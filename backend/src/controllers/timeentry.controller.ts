import { Request, Response } from 'express';
import * as timeEntryService from '../services/timeentry.service';
import { sendSuccess, sendError } from '../utils/response';
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
      return sendError(res, 'Date parameter is required', 400);
    }

    const dateObj = new Date(date as string);
    if (isNaN(dateObj.getTime())) {
      return sendError(res, 'Invalid date format', 400);
    }

    const filters: any = {};
    if (employeeId) filters.employeeId = employeeId as string;
    if (projectId) filters.projectId = projectId as string;
    if (status) filters.status = status as string;

    const timeEntries = await timeEntryService.getTimeEntriesForDate(dateObj, filters);
    sendSuccess(res, timeEntries, 'Time entries retrieved successfully');
  } catch (error: any) {
    logger.error('Error in getTimeEntriesForDate controller', { error });
    sendError(res, error.message);
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

    if (!startDate || !endDate) {
      return sendError(res, 'startDate and endDate parameters are required', 400);
    }

    const startDateObj = new Date(startDate as string);
    const endDateObj = new Date(endDate as string);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return sendError(res, 'Invalid date format', 400);
    }

    const timeEntries = await timeEntryService.getTimeEntriesForEmployee(
      employeeId,
      startDateObj,
      endDateObj
    );
    sendSuccess(res, timeEntries, 'Employee time entries retrieved successfully');
  } catch (error: any) {
    logger.error('Error in getTimeEntriesForEmployee controller', { error });
    sendError(res, error.message);
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

    if (!startDate || !endDate) {
      return sendError(res, 'startDate and endDate parameters are required', 400);
    }

    const startDateObj = new Date(startDate as string);
    const endDateObj = new Date(endDate as string);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return sendError(res, 'Invalid date format', 400);
    }

    const timeEntries = await timeEntryService.getTimeEntriesForProject(
      projectId,
      startDateObj,
      endDateObj
    );
    sendSuccess(res, timeEntries, 'Project time entries retrieved successfully');
  } catch (error: any) {
    logger.error('Error in getTimeEntriesForProject controller', { error });
    sendError(res, error.message);
  }
};

/**
 * Get unapproved time entries
 * GET /api/v1/time-entries/unapproved
 */
export const getUnapprovedEntries = async (req: Request, res: Response) => {
  try {
    const timeEntries = await timeEntryService.getUnapprovedEntries();
    sendSuccess(res, timeEntries, 'Unapproved time entries retrieved successfully');
  } catch (error: any) {
    logger.error('Error in getUnapprovedEntries controller', { error });
    sendError(res, error.message);
  }
};

/**
 * Calculate day total for an employee
 * GET /api/v1/time-entries/:employeeId/:date/total
 */
export const calculateDayTotal = async (req: Request, res: Response) => {
  try {
    const { employeeId, date } = req.params;

    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return sendError(res, 'Invalid date format', 400);
    }

    const totalHours = await timeEntryService.calculateDayTotal(employeeId, dateObj);
    sendSuccess(res, { totalHours }, 'Day total calculated successfully');
  } catch (error: any) {
    logger.error('Error in calculateDayTotal controller', { error });
    sendError(res, error.message);
  }
};

/**
 * Create a time entry
 * POST /api/v1/time-entries
 * Body: { employeeId, date, projectId, hoursWorked, workType?, description?, taskPerformed?, hourlyRate?, startTime?, endTime?, signInId? }
 */
export const createTimeEntry = async (req: Request, res: Response) => {
  try {
    const {
      employeeId,
      date,
      projectId,
      hoursWorked,
      workType,
      description,
      taskPerformed,
      hourlyRate,
      startTime,
      endTime,
      signInId,
    } = req.body;
    const userId = req.user?.userId;

    // Validation
    if (!employeeId || !date || !projectId || hoursWorked === undefined) {
      return sendError(
        res,
        'employeeId, date, projectId, and hoursWorked are required',
        400
      );
    }

    if (!userId) {
      return sendError(res, 'User not authenticated', 401);
    }

    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return sendError(res, 'Invalid date format', 400);
    }

    const timeEntryData: any = {
      employeeId,
      date: dateObj,
      projectId,
      hoursWorked: parseFloat(hoursWorked),
      workType,
      description,
      taskPerformed,
      hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
      signInId,
    };

    if (startTime) {
      timeEntryData.startTime = new Date(startTime);
    }
    if (endTime) {
      timeEntryData.endTime = new Date(endTime);
    }

    const timeEntry = await timeEntryService.create(timeEntryData, userId);
    sendSuccess(res, timeEntry, 'Time entry created successfully', 201);
  } catch (error: any) {
    logger.error('Error in createTimeEntry controller', { error });
    
    if (error.message.includes('must be between')) {
      return sendError(res, error.message, 400);
    }
    
    sendError(res, error.message);
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
    const userId = req.user?.userId;

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return sendError(res, 'entries array is required', 400);
    }

    if (!userId) {
      return sendError(res, 'User not authenticated', 401);
    }

    // Parse and validate entries
    const timeEntryData = entries.map((entry: any) => {
      const dateObj = new Date(entry.date);
      if (isNaN(dateObj.getTime())) {
        throw new Error(`Invalid date format for employee ${entry.employeeId}`);
      }

      return {
        employeeId: entry.employeeId,
        date: dateObj,
        projectId: entry.projectId,
        hoursWorked: parseFloat(entry.hoursWorked),
        workType: entry.workType,
        description: entry.description,
        taskPerformed: entry.taskPerformed,
        hourlyRate: entry.hourlyRate ? parseFloat(entry.hourlyRate) : undefined,
        startTime: entry.startTime ? new Date(entry.startTime) : undefined,
        endTime: entry.endTime ? new Date(entry.endTime) : undefined,
        signInId: entry.signInId,
      };
    });

    const createdEntries = await timeEntryService.bulkCreate(timeEntryData, userId);
    sendSuccess(res, createdEntries, 'Time entries created successfully', 201);
  } catch (error: any) {
    logger.error('Error in bulkCreateTimeEntries controller', { error });
    sendError(res, error.message);
  }
};

/**
 * Update a time entry
 * PUT /api/v1/time-entries/:id
 * Body: { hoursWorked?, workType?, description?, taskPerformed?, hourlyRate?, startTime?, endTime? }
 */
export const updateTimeEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return sendError(res, 'User not authenticated', 401);
    }

    const updateData: any = {};

    if (req.body.hoursWorked !== undefined) {
      updateData.hoursWorked = parseFloat(req.body.hoursWorked);
    }
    if (req.body.workType !== undefined) updateData.workType = req.body.workType;
    if (req.body.description !== undefined)
      updateData.description = req.body.description;
    if (req.body.taskPerformed !== undefined)
      updateData.taskPerformed = req.body.taskPerformed;
    if (req.body.hourlyRate !== undefined) {
      updateData.hourlyRate = parseFloat(req.body.hourlyRate);
    }
    if (req.body.startTime !== undefined) {
      updateData.startTime = new Date(req.body.startTime);
    }
    if (req.body.endTime !== undefined) {
      updateData.endTime = new Date(req.body.endTime);
    }

    const timeEntry = await timeEntryService.update(id, updateData, userId);
    sendSuccess(res, timeEntry, 'Time entry updated successfully');
  } catch (error: any) {
    logger.error('Error in updateTimeEntry controller', { error });
    
    if (error.message.includes('must be between')) {
      return sendError(res, error.message, 400);
    }
    
    sendError(res, error.message);
  }
};

/**
 * Delete a time entry
 * DELETE /api/v1/time-entries/:id
 */
export const deleteTimeEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await timeEntryService.deleteTimeEntry(id);
    sendSuccess(res, null, 'Time entry deleted successfully');
  } catch (error: any) {
    logger.error('Error in deleteTimeEntry controller', { error });
    sendError(res, error.message);
  }
};

/**
 * Approve a time entry
 * PUT /api/v1/time-entries/:id/approve
 */
export const approveTimeEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return sendError(res, 'User not authenticated', 401);
    }

    const timeEntry = await timeEntryService.approve(id, userId);
    sendSuccess(res, timeEntry, 'Time entry approved successfully');
  } catch (error: any) {
    logger.error('Error in approveTimeEntry controller', { error });
    sendError(res, error.message);
  }
};

/**
 * Reject a time entry
 * PUT /api/v1/time-entries/:id/reject
 * Body: { reason }
 */
export const rejectTimeEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.userId;

    if (!reason) {
      return sendError(res, 'Reason is required for rejection', 400);
    }

    if (!userId) {
      return sendError(res, 'User not authenticated', 401);
    }

    const timeEntry = await timeEntryService.reject(id, userId, reason);
    sendSuccess(res, timeEntry, 'Time entry rejected successfully');
  } catch (error: any) {
    logger.error('Error in rejectTimeEntry controller', { error });
    sendError(res, error.message);
  }
};

