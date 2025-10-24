/**
 * Daily Log Controller
 * 
 * Handles HTTP requests for daily log operations including CRUD,
 * filtering, and statistics for construction daily reports.
 */

import { Request, Response } from 'express';
import { 
  getAllDailyLogs, 
  getDailyLogById, 
  createDailyLog, 
  updateDailyLog, 
  deleteDailyLog,
  getDailyLogsByProject,
  getDailyLogsByDateRange,
  getDailyLogStats,
  DailyLogFilters,
  PaginationOptions,
  CreateDailyLogData,
  UpdateDailyLogData
} from '../services/daily-log.service';
import { successResponse, errorResponse } from '../utils/response';
import { logger } from '../utils/logger';

/**
 * Get all daily logs with optional filters and pagination
 */
export const getAllDailyLogsController = async (req: Request, res: Response): Promise<Response | undefined> => {
  try {
    const {
      projectId,
      dateFrom,
      dateTo,
      createdBy,
      search,
      page = '1',
      limit = '20',
    } = req.query;

    const filters: DailyLogFilters = {};
    if (projectId) filters.projectId = projectId as string;
    if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
    if (dateTo) filters.dateTo = new Date(dateTo as string);
    if (createdBy) filters.createdBy = createdBy as string;
    if (search) filters.search = search as string;

    const pagination: PaginationOptions = {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
    };

    const result = await getAllDailyLogs(filters, pagination);

    logger.info('Daily logs retrieved successfully', {
      userId: req.user?.id,
      filters,
      pagination,
      count: result.dailyLogs.length,
    });

    return res.json(successResponse(result, 'Daily logs retrieved successfully'));
  } catch (error: any) {
    logger.error('Error retrieving daily logs', {
      error: error.message,
      userId: req.user?.id,
      query: req.query,
    });

    return res.status(500).json(errorResponse(
      'Failed to retrieve daily logs',
      'DAILY_LOGS_RETRIEVAL_FAILED'
    ));
  }
};

/**
 * Get single daily log by ID
 */
export const getDailyLogByIdController = async (req: Request, res: Response): Promise<Response | undefined> => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json(errorResponse('Daily log ID is required', 'MISSING_DAILY_LOG_ID'));
    }

    const dailyLog = await getDailyLogById(id);

    if (!dailyLog) {
      return res.status(404).json(errorResponse('Daily log not found', 'DAILY_LOG_NOT_FOUND'));
    }

    logger.info('Daily log retrieved successfully', {
      dailyLogId: id,
      userId: req.user?.id,
    });

    return res.json(successResponse(dailyLog, 'Daily log retrieved successfully'));
  } catch (error: any) {
    logger.error('Error retrieving daily log', {
      error: error.message,
      dailyLogId: req.params.id,
      userId: req.user?.id,
    });

    return res.status(500).json(errorResponse(
      'Failed to retrieve daily log',
      'DAILY_LOG_RETRIEVAL_FAILED'
    ));
  }
};

/**
 * Create new daily log
 */
export const createDailyLogController = async (req: Request, res: Response): Promise<Response | undefined> => {
  try {
    const {
      project_id,
      date,
      weather,
      crew_members,
      hours_worked,
      work_performed,
      materials_used,
      equipment_used,
      issues,
      inspector_visit,
    } = req.body;

    // Validate required fields
    if (!project_id || !date || !work_performed) {
      return res.status(400).json(errorResponse(
        'Missing required fields: project_id, date, work_performed',
        'MISSING_REQUIRED_FIELDS'
      ));
    }

    const data: CreateDailyLogData = {
      project_id,
      date: new Date(date),
      weather,
      crew_members,
      hours_worked,
      materials_used,
      work_performed,
      equipment_used,
      issues,
      inspector_visit,
    };

    const dailyLog = await createDailyLog(data, req.user!.id);

    logger.info('Daily log created successfully', {
      dailyLogId: dailyLog.id,
      projectId: project_id,
      userId: req.user?.id,
    });

    return res.status(201).json(successResponse(dailyLog, 'Daily log created successfully'));
  } catch (error: any) {
    logger.error('Error creating daily log', {
      error: error.message,
      userId: req.user?.id,
      body: req.body,
    });

    return res.status(500).json(errorResponse(
      error.message || 'Failed to create daily log',
      'DAILY_LOG_CREATION_FAILED'
    ));
  }
};

/**
 * Update existing daily log
 */
export const updateDailyLogController = async (req: Request, res: Response): Promise<Response | undefined> => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json(errorResponse('Daily log ID is required', 'MISSING_DAILY_LOG_ID'));
    }

    const {
      date,
      weather,
      crew_members,
      hours_worked,
      work_performed,
      materials_used,
      equipment_used,
      issues,
      inspector_visit,
    } = req.body;

    const data: UpdateDailyLogData = {};
    if (date !== undefined) data.date = new Date(date);
    if (weather !== undefined) data.weather = weather;
    if (crew_members !== undefined) data.crew_members = crew_members;
    if (hours_worked !== undefined) data.hours_worked = hours_worked;
    if (work_performed !== undefined) data.work_performed = work_performed;
    if (materials_used !== undefined) data.materials_used = materials_used;
    if (equipment_used !== undefined) data.equipment_used = equipment_used;
    if (issues !== undefined) data.issues = issues;
    if (inspector_visit !== undefined) data.inspector_visit = inspector_visit;

    const dailyLog = await updateDailyLog(id, data, req.user!.id);

    if (!dailyLog) {
      return res.status(404).json(errorResponse('Daily log not found', 'DAILY_LOG_NOT_FOUND'));
    }

    logger.info('Daily log updated successfully', {
      dailyLogId: id,
      userId: req.user?.id,
    });

    return res.json(successResponse(dailyLog, 'Daily log updated successfully'));
  } catch (error: any) {
    logger.error('Error updating daily log', {
      error: error.message,
      dailyLogId: req.params.id,
      userId: req.user?.id,
      body: req.body,
    });

    return res.status(500).json(errorResponse(
      error.message || 'Failed to update daily log',
      'DAILY_LOG_UPDATE_FAILED'
    ));
  }
};

/**
 * Delete daily log
 */
export const deleteDailyLogController = async (req: Request, res: Response): Promise<Response | undefined> => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json(errorResponse('Daily log ID is required', 'MISSING_DAILY_LOG_ID'));
    }

    const success = await deleteDailyLog(id, req.user!.id);

    if (!success) {
      return res.status(404).json(errorResponse('Daily log not found', 'DAILY_LOG_NOT_FOUND'));
    }

    logger.info('Daily log deleted successfully', {
      dailyLogId: id,
      userId: req.user?.id,
    });

    return res.json(successResponse(null, 'Daily log deleted successfully'));
  } catch (error: any) {
    logger.error('Error deleting daily log', {
      error: error.message,
      dailyLogId: req.params.id,
      userId: req.user?.id,
    });

    return res.status(500).json(errorResponse(
      error.message || 'Failed to delete daily log',
      'DAILY_LOG_DELETION_FAILED'
    ));
  }
};

/**
 * Get daily logs for a specific project
 */
export const getDailyLogsByProjectController = async (req: Request, res: Response): Promise<Response | undefined> => {
  try {
    const { projectId } = req.params;
    const { page = '1', limit = '20' } = req.query;

    if (!projectId) {
      return res.status(400).json(errorResponse('Project ID is required', 'MISSING_PROJECT_ID'));
    }

    const pagination: PaginationOptions = {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
    };

    const result = await getDailyLogsByProject(projectId, pagination);

    logger.info('Project daily logs retrieved successfully', {
      projectId,
      userId: req.user?.id,
      count: result.dailyLogs.length,
    });

    return res.json(successResponse(result, 'Project daily logs retrieved successfully'));
  } catch (error: any) {
    logger.error('Error retrieving project daily logs', {
      error: error.message,
      projectId: req.params.projectId,
      userId: req.user?.id,
    });

    return res.status(500).json(errorResponse(
      'Failed to retrieve project daily logs',
      'PROJECT_DAILY_LOGS_RETRIEVAL_FAILED'
    ));
  }
};

/**
 * Get daily logs by date range
 */
export const getDailyLogsByDateRangeController = async (req: Request, res: Response): Promise<Response | undefined> => {
  try {
    const { dateFrom, dateTo } = req.query;
    const { page = '1', limit = '20' } = req.query;

    if (!dateFrom || !dateTo) {
      return res.status(400).json(errorResponse(
        'Date range is required: dateFrom and dateTo',
        'MISSING_DATE_RANGE'
      ));
    }

    const pagination: PaginationOptions = {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
    };

    const result = await getDailyLogsByDateRange(
      new Date(dateFrom as string),
      new Date(dateTo as string),
      pagination
    );

    logger.info('Date range daily logs retrieved successfully', {
      dateFrom,
      dateTo,
      userId: req.user?.id,
      count: result.dailyLogs.length,
    });

    return res.json(successResponse(result, 'Date range daily logs retrieved successfully'));
  } catch (error: any) {
    logger.error('Error retrieving date range daily logs', {
      error: error.message,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      userId: req.user?.id,
    });

    return res.status(500).json(errorResponse(
      'Failed to retrieve date range daily logs',
      'DATE_RANGE_DAILY_LOGS_RETRIEVAL_FAILED'
    ));
  }
};

/**
 * Get daily log statistics
 */
export const getDailyLogStatsController = async (req: Request, res: Response): Promise<Response | undefined> => {
  try {
    const { projectId } = req.query;

    const stats = await getDailyLogStats(projectId as string);

    logger.info('Daily log statistics retrieved successfully', {
      projectId,
      userId: req.user?.id,
    });

    return res.json(successResponse(stats, 'Daily log statistics retrieved successfully'));
  } catch (error: any) {
    logger.error('Error retrieving daily log statistics', {
      error: error.message,
      projectId: req.query.projectId,
      userId: req.user?.id,
    });

    return res.status(500).json(errorResponse(
      'Failed to retrieve daily log statistics',
      'DAILY_LOG_STATS_RETRIEVAL_FAILED'
    ));
  }
};
