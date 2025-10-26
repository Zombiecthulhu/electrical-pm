import { Request, Response } from 'express';
import * as timesheetService from '../services/timesheet.service';
import { logger } from '../utils/logger';
import { generateTimesheetPDF } from '../utils/pdf-generator';

/**
 * Timesheet Controller
 * Handles HTTP requests for timesheet operations
 */

/**
 * GET /api/v1/timesheets
 * Get all timesheets with optional filters
 */
export const getAllTimesheets = async (req: Request, res: Response) => {
  try {
    const { status, startDate, endDate, createdBy } = req.query;

    const filters: any = {};

    if (status) filters.status = status as string;
    if (createdBy) filters.createdBy = createdBy as string;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const timesheets = await timesheetService.getAllTimesheets(filters);

    return res.status(200).json({
      success: true,
      data: timesheets,
    });
  } catch (error: any) {
    logger.error('Error in getAllTimesheets controller', { error: error.message });
    return res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_TIMESHEETS_FAILED',
        message: error.message || 'Failed to fetch timesheets',
      },
    });
  }
};

/**
 * GET /api/v1/timesheets/:id
 * Get a single timesheet by ID with all time entries
 */
export const getTimesheetById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Timesheet ID is required',
        },
      });
    }

    const timesheet = await timesheetService.getTimesheetById(id);

    return res.status(200).json({
      success: true,
      data: timesheet,
    });
  } catch (error: any) {
    logger.error('Error in getTimesheetById controller', { error: error.message });

    if (error.message === 'Timesheet not found') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TIMESHEET_NOT_FOUND',
          message: error.message,
        },
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_TIMESHEET_FAILED',
        message: error.message || 'Failed to fetch timesheet',
      },
    });
  }
};

/**
 * GET /api/v1/timesheets/date/:date
 * Get timesheets for a specific date
 */
export const getTimesheetsForDate = async (req: Request, res: Response) => {
  try {
    const { date } = req.params;

    if (!date) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Date is required',
        },
      });
    }

    const dateObj = new Date(date);
    const timesheets = await timesheetService.getTimesheetsForDate(dateObj);

    return res.status(200).json({
      success: true,
      data: timesheets,
    });
  } catch (error: any) {
    logger.error('Error in getTimesheetsForDate controller', { error: error.message });
    return res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_TIMESHEETS_FAILED',
        message: error.message || 'Failed to fetch timesheets for date',
      },
    });
  }
};

/**
 * POST /api/v1/timesheets
 * Create a new timesheet
 */
export const createTimesheet = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
    }

    const { date, title, notes, employeeIds, timeEntries } = req.body;

    if (!date) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Date is required',
        },
      });
    }

    if (!timeEntries || timeEntries.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'At least one time entry is required',
        },
      });
    }

    const dateObj = new Date(date);

    const timesheetData = {
      date: dateObj,
      title,
      notes,
      employeeIds: employeeIds || [],
      timeEntries,
    };

    const timesheet = await timesheetService.createTimesheet(timesheetData, userId);

    return res.status(201).json({
      success: true,
      data: timesheet,
      message: 'Timesheet created successfully',
    });
  } catch (error: any) {
    logger.error('Error in createTimesheet controller', { error: error.message });
    return res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_TIMESHEET_FAILED',
        message: error.message || 'Failed to create timesheet',
      },
    });
  }
};

/**
 * PUT /api/v1/timesheets/:id
 * Update an existing timesheet
 */
export const updateTimesheet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Timesheet ID is required',
        },
      });
    }

    const { title, notes, status, timeEntries } = req.body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;
    if (timeEntries !== undefined) updateData.timeEntries = timeEntries;

    const timesheet = await timesheetService.updateTimesheet(id, updateData, userId);

    return res.status(200).json({
      success: true,
      data: timesheet,
      message: 'Timesheet updated successfully',
    });
  } catch (error: any) {
    logger.error('Error in updateTimesheet controller', { error: error.message });

    if (error.message === 'Timesheet not found') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TIMESHEET_NOT_FOUND',
          message: error.message,
        },
      });
    }

    if (error.message === 'Cannot edit approved timesheet') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'TIMESHEET_LOCKED',
          message: error.message,
        },
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_TIMESHEET_FAILED',
        message: error.message || 'Failed to update timesheet',
      },
    });
  }
};

/**
 * POST /api/v1/timesheets/:id/submit
 * Submit a timesheet
 */
export const submitTimesheet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Timesheet ID is required',
        },
      });
    }

    const timesheet = await timesheetService.submitTimesheet(id, userId);

    return res.status(200).json({
      success: true,
      data: timesheet,
      message: 'Timesheet submitted successfully',
    });
  } catch (error: any) {
    logger.error('Error in submitTimesheet controller', { error: error.message });
    return res.status(500).json({
      success: false,
      error: {
        code: 'SUBMIT_TIMESHEET_FAILED',
        message: error.message || 'Failed to submit timesheet',
      },
    });
  }
};

/**
 * POST /api/v1/timesheets/:id/approve
 * Approve a timesheet
 */
export const approveTimesheet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Timesheet ID is required',
        },
      });
    }

    const timesheet = await timesheetService.approveTimesheet(id, userId);

    return res.status(200).json({
      success: true,
      data: timesheet,
      message: 'Timesheet approved successfully',
    });
  } catch (error: any) {
    logger.error('Error in approveTimesheet controller', { error: error.message });
    return res.status(500).json({
      success: false,
      error: {
        code: 'APPROVE_TIMESHEET_FAILED',
        message: error.message || 'Failed to approve timesheet',
      },
    });
  }
};

/**
 * DELETE /api/v1/timesheets/:id
 * Delete a timesheet (only drafts)
 */
export const deleteTimesheet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Timesheet ID is required',
        },
      });
    }

    await timesheetService.deleteTimesheet(id);

    return res.status(200).json({
      success: true,
      message: 'Timesheet deleted successfully',
    });
  } catch (error: any) {
    logger.error('Error in deleteTimesheet controller', { error: error.message });

    if (error.message === 'Timesheet not found') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TIMESHEET_NOT_FOUND',
          message: error.message,
        },
      });
    }

    if (error.message === 'Only draft timesheets can be deleted') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'TIMESHEET_LOCKED',
          message: error.message,
        },
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_TIMESHEET_FAILED',
        message: error.message || 'Failed to delete timesheet',
      },
    });
  }
};

/**
 * GET /api/v1/timesheets/:id/pdf
 * Export timesheet as PDF
 */
export const exportTimesheetToPDF = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Timesheet ID is required',
        },
      });
    }

    // Fetch timesheet with all data
    const timesheet = await timesheetService.getTimesheetById(id);

    if (!timesheet) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TIMESHEET_NOT_FOUND',
          message: 'Timesheet not found',
        },
      });
    }

    // Generate and stream PDF
    return generateTimesheetPDF(timesheet, res);
  } catch (error: any) {
    logger.error('Error in exportTimesheetToPDF controller', { error: error.message });

    // Check if headers were already sent (PDF generation started)
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'PDF_GENERATION_FAILED',
          message: error.message || 'Failed to generate PDF',
        },
      });
    }
  }
};

