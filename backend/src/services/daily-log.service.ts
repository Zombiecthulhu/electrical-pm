/**
 * Daily Log Service
 * 
 * Handles all daily log-related business logic including CRUD operations,
 * validation, filtering, and data processing for construction daily reports.
 */

import { PrismaClient, DailyLog } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Types for daily log operations
export interface DailyLogFilters {
  projectId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  createdBy?: string;
  search?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface DailyLogWithRelations extends DailyLog {
  project: {
    id: string;
    name: string;
    project_number: string;
  };
  creator: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface CreateDailyLogData {
  project_id: string;
  date: Date;
  weather?: string;
  crew_members?: any[];
  hours_worked?: any[];
  work_performed: string;
  materials_used?: any[];
  equipment_used?: string;
  issues?: string;
  inspector_visit?: string;
}

export interface UpdateDailyLogData {
  date?: Date;
  weather?: string;
  crew_members?: any[];
  hours_worked?: any[];
  work_performed?: string;
  materials_used?: any[];
  equipment_used?: string;
  issues?: string;
  inspector_visit?: string;
}

export interface DailyLogListResponse {
  dailyLogs: DailyLogWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Get all daily logs with optional filters and pagination
 */
export const getAllDailyLogs = async (
  filters: DailyLogFilters = {},
  pagination: PaginationOptions = {}
): Promise<DailyLogListResponse> => {
  try {
    const {
      projectId,
      dateFrom,
      dateTo,
      createdBy,
      search,
    } = filters;

    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (projectId) where.project_id = projectId;
    if (createdBy) where.created_by = createdBy;

    // Date range filters
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = dateFrom;
      if (dateTo) where.date.lte = dateTo;
    }

    // Search in work performed, issues, or equipment used
    if (search) {
      where.OR = [
        { work_performed: { contains: search, mode: 'insensitive' } },
        { issues: { contains: search, mode: 'insensitive' } },
        { equipment_used: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count for pagination
    const total = await prisma.dailyLog.count({ where });

    // Get daily logs with relations
    const dailyLogs = await prisma.dailyLog.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            project_number: true,
          },
        },
        creator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    logger.info('Daily logs retrieved successfully', {
      count: dailyLogs.length,
      total,
      page,
      limit,
      filters,
    });

    return {
      dailyLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  } catch (error) {
    logger.error('Error retrieving daily logs', { error, filters, pagination });
    throw error;
  }
};

/**
 * Get single daily log by ID with all relations
 */
export const getDailyLogById = async (id: string): Promise<DailyLogWithRelations | null> => {
  try {
    const dailyLog = await prisma.dailyLog.findFirst({
      where: {
        id,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            project_number: true,
          },
        },
        creator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    if (!dailyLog) {
      logger.warn('Daily log not found', { dailyLogId: id });
      return null;
    }

    logger.info('Daily log retrieved successfully', { dailyLogId: id });
    return dailyLog;
  } catch (error) {
    logger.error('Error retrieving daily log', { error, dailyLogId: id });
    throw error;
  }
};

/**
 * Create new daily log
 */
export const createDailyLog = async (
  data: CreateDailyLogData,
  userId: string
): Promise<DailyLogWithRelations> => {
  try {
    // Validate required fields
    if (!data.project_id || !data.date || !data.work_performed) {
      throw new Error('Missing required fields: project_id, date, work_performed');
    }

    // Check if project exists
    const project = await prisma.project.findFirst({
      where: {
        id: data.project_id,
        deleted_at: null,
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Check if daily log already exists for this project and date
    const existingLog = await prisma.dailyLog.findFirst({
      where: {
        project_id: data.project_id,
        date: {
          gte: new Date(data.date.getFullYear(), data.date.getMonth(), data.date.getDate()),
          lt: new Date(data.date.getFullYear(), data.date.getMonth(), data.date.getDate() + 1),
        },
      },
    });

    if (existingLog) {
      throw new Error('Daily log already exists for this project and date');
    }

    // Create daily log
    const dailyLog = await prisma.dailyLog.create({
      data: {
        ...data,
        created_by: userId,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            project_number: true,
          },
        },
        creator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    logger.info('Daily log created successfully', {
      dailyLogId: dailyLog.id,
      projectId: data.project_id,
      date: data.date,
      createdBy: userId,
    });

    return dailyLog;
  } catch (error) {
    logger.error('Error creating daily log', { error, data, userId });
    throw error;
  }
};

/**
 * Update existing daily log
 */
export const updateDailyLog = async (
  id: string,
  data: UpdateDailyLogData,
  userId: string
): Promise<DailyLogWithRelations | null> => {
  try {
    // Check if daily log exists
    const existingLog = await prisma.dailyLog.findFirst({
      where: { id },
    });

    if (!existingLog) {
      throw new Error('Daily log not found');
    }

    // Update daily log
    const dailyLog = await prisma.dailyLog.update({
      where: { id },
      data: {
        ...data,
        updated_at: new Date(),
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            project_number: true,
          },
        },
        creator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    logger.info('Daily log updated successfully', {
      dailyLogId: id,
      updatedBy: userId,
    });

    return dailyLog;
  } catch (error) {
    logger.error('Error updating daily log', { error, dailyLogId: id, data, userId });
    throw error;
  }
};

/**
 * Delete daily log (soft delete)
 */
export const deleteDailyLog = async (id: string, userId: string): Promise<boolean> => {
  try {
    // Check if daily log exists
    const existingLog = await prisma.dailyLog.findFirst({
      where: { id },
    });

    if (!existingLog) {
      throw new Error('Daily log not found');
    }

    // Soft delete by setting deleted_at
    await prisma.dailyLog.update({
      where: { id },
      data: {
        updated_at: new Date(),
      },
    });

    logger.info('Daily log deleted successfully', {
      dailyLogId: id,
      deletedBy: userId,
    });

    return true;
  } catch (error) {
    logger.error('Error deleting daily log', { error, dailyLogId: id, userId });
    throw error;
  }
};

/**
 * Get daily logs for a specific project
 */
export const getDailyLogsByProject = async (
  projectId: string,
  pagination: PaginationOptions = {}
): Promise<DailyLogListResponse> => {
  try {
    return await getAllDailyLogs({ projectId }, pagination);
  } catch (error) {
    logger.error('Error retrieving daily logs for project', { error, projectId });
    throw error;
  }
};

/**
 * Get daily logs for a specific date range
 */
export const getDailyLogsByDateRange = async (
  dateFrom: Date,
  dateTo: Date,
  pagination: PaginationOptions = {}
): Promise<DailyLogListResponse> => {
  try {
    return await getAllDailyLogs({ dateFrom, dateTo }, pagination);
  } catch (error) {
    logger.error('Error retrieving daily logs by date range', { error, dateFrom, dateTo });
    throw error;
  }
};

/**
 * Get daily log statistics
 */
export const getDailyLogStats = async (projectId?: string) => {
  try {
    const where = projectId ? { project_id: projectId } : {};

    const [
      totalLogs,
      thisMonthLogs,
      thisWeekLogs,
      recentLogs,
    ] = await Promise.all([
      prisma.dailyLog.count({ where }),
      prisma.dailyLog.count({
        where: {
          ...where,
          date: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      prisma.dailyLog.count({
        where: {
          ...where,
          date: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.dailyLog.findMany({
        where,
        orderBy: { date: 'desc' },
        take: 5,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              project_number: true,
            },
          },
          creator: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
            },
          },
        },
      }),
    ]);

    return {
      totalLogs,
      thisMonthLogs,
      thisWeekLogs,
      recentLogs,
    };
  } catch (error) {
    logger.error('Error retrieving daily log statistics', { error, projectId });
    throw error;
  }
};
