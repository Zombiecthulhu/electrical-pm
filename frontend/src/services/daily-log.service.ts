/**
 * Daily Log Service
 * 
 * Handles all daily log-related API calls including CRUD operations,
 * filtering, pagination, and statistics for construction daily reports.
 */

import api from './api';

// Raw API response interface (snake_case)
interface DailyLogApiResponse {
  id: string;
  project_id: string;
  date: string;
  weather?: string | null;
  crew_members?: any[] | null;
  hours_worked?: any[] | null;
  work_performed: string;
  materials_used?: any[] | null;
  equipment_used?: string | null;
  issues?: string | null;
  inspector_visit?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  project?: {
    id: string;
    name: string;
    project_number: string;
  };
  creator?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

// Frontend interface (camelCase)
export interface DailyLog {
  id: string;
  projectId: string;
  date: string;
  weather?: string | null;
  crewMembers?: any[] | null;
  hoursWorked?: any[] | null;
  workPerformed: string;
  materialsUsed?: any[] | null;
  equipmentUsed?: string | null;
  issues?: string | null;
  inspectorVisit?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
    projectNumber: string;
  };
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface DailyLogFilters {
  projectId?: string;
  dateFrom?: string;
  dateTo?: string;
  createdBy?: string;
  search?: string;
}

export interface DailyLogPaginationOptions {
  page?: number;
  limit?: number;
}

export interface CreateDailyLogData {
  projectId: string;
  date: string;
  weather?: string;
  crewMembers?: any[];
  hoursWorked?: any[];
  workPerformed: string;
  materialsUsed?: any[];
  equipmentUsed?: string;
  issues?: string;
  inspectorVisit?: string;
}

export interface UpdateDailyLogData {
  date?: string;
  weather?: string;
  crewMembers?: any[];
  hoursWorked?: any[];
  workPerformed?: string;
  materialsUsed?: any[];
  equipmentUsed?: string;
  issues?: string;
  inspectorVisit?: string;
}

export interface DailyLogsResponse {
  success: boolean;
  data: {
    dailyLogs: DailyLog[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  message?: string;
}

export interface DailyLogResponse {
  success: boolean;
  data: DailyLog;
  message?: string;
}

export interface DailyLogStatsResponse {
  success: boolean;
  data: {
    totalLogs: number;
    thisMonthLogs: number;
    thisWeekLogs: number;
    recentLogs: DailyLog[];
  };
  message?: string;
}

/**
 * Transform API response to frontend format
 */
const transformDailyLog = (apiDailyLog: DailyLogApiResponse): DailyLog => {
  return {
    id: apiDailyLog.id,
    projectId: apiDailyLog.project_id,
    date: apiDailyLog.date,
    weather: apiDailyLog.weather,
    crewMembers: apiDailyLog.crew_members,
    hoursWorked: apiDailyLog.hours_worked,
    workPerformed: apiDailyLog.work_performed,
    materialsUsed: apiDailyLog.materials_used,
    equipmentUsed: apiDailyLog.equipment_used,
    issues: apiDailyLog.issues,
    inspectorVisit: apiDailyLog.inspector_visit,
    createdBy: apiDailyLog.created_by,
    createdAt: apiDailyLog.created_at,
    updatedAt: apiDailyLog.updated_at,
    project: apiDailyLog.project ? {
      id: apiDailyLog.project.id,
      name: apiDailyLog.project.name,
      projectNumber: apiDailyLog.project.project_number,
    } : undefined,
    creator: apiDailyLog.creator ? {
      id: apiDailyLog.creator.id,
      firstName: apiDailyLog.creator.first_name,
      lastName: apiDailyLog.creator.last_name,
      email: apiDailyLog.creator.email,
    } : undefined,
  };
};

/**
 * Get all daily logs with optional filters and pagination
 */
export const getAllDailyLogs = async (
  filters?: DailyLogFilters,
  pagination?: DailyLogPaginationOptions
): Promise<DailyLogsResponse> => {
  const params = {
    ...filters,
    ...pagination,
  };

  const response = await api.get('/daily-logs', { params });
  const data = response as unknown as {
    success: boolean;
    data: {
      dailyLogs: DailyLogApiResponse[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    };
    message?: string;
  };
  
  // Transform daily logs from API format to frontend format
  if (data.success && data.data.dailyLogs) {
    const transformedDailyLogs = data.data.dailyLogs.map(transformDailyLog);
    return {
      success: data.success,
      data: {
        dailyLogs: transformedDailyLogs,
        pagination: data.data.pagination,
      },
      message: data.message,
    };
  }

  return data as unknown as DailyLogsResponse;
};

/**
 * Get single daily log by ID
 */
export const getDailyLogById = async (id: string): Promise<DailyLogResponse> => {
  const response = await api.get(`/daily-logs/${id}`);
  const data = response as unknown as {
    success: boolean;
    data: DailyLogApiResponse;
    message?: string;
  };

  if (data.success && data.data) {
    return {
      success: data.success,
      data: transformDailyLog(data.data),
      message: data.message,
    };
  }

  return data as unknown as DailyLogResponse;
};

/**
 * Create new daily log
 */
export const createDailyLog = async (data: CreateDailyLogData): Promise<DailyLogResponse> => {
  // Transform frontend format to API format
  const apiData = {
    project_id: data.projectId,
    date: data.date,
    weather: data.weather,
    crew_members: data.crewMembers,
    hours_worked: data.hoursWorked,
    work_performed: data.workPerformed,
    materials_used: data.materialsUsed,
    equipment_used: data.equipmentUsed,
    issues: data.issues,
    inspector_visit: data.inspectorVisit,
  };

  const response = await api.post('/daily-logs', apiData);
  const result = response as unknown as {
    success: boolean;
    data: DailyLogApiResponse;
    message?: string;
  };

  if (result.success && result.data) {
    return {
      success: result.success,
      data: transformDailyLog(result.data),
      message: result.message,
    };
  }

  return result as unknown as DailyLogResponse;
};

/**
 * Update existing daily log
 */
export const updateDailyLog = async (id: string, data: UpdateDailyLogData): Promise<DailyLogResponse> => {
  // Transform frontend format to API format
  const apiData: any = {};
  if (data.date !== undefined) apiData.date = data.date;
  if (data.weather !== undefined) apiData.weather = data.weather;
  if (data.crewMembers !== undefined) apiData.crew_members = data.crewMembers;
  if (data.hoursWorked !== undefined) apiData.hours_worked = data.hoursWorked;
  if (data.workPerformed !== undefined) apiData.work_performed = data.workPerformed;
  if (data.materialsUsed !== undefined) apiData.materials_used = data.materialsUsed;
  if (data.equipmentUsed !== undefined) apiData.equipment_used = data.equipmentUsed;
  if (data.issues !== undefined) apiData.issues = data.issues;
  if (data.inspectorVisit !== undefined) apiData.inspector_visit = data.inspectorVisit;

  const response = await api.put(`/daily-logs/${id}`, apiData);
  const result = response as unknown as {
    success: boolean;
    data: DailyLogApiResponse;
    message?: string;
  };

  if (result.success && result.data) {
    return {
      success: result.success,
      data: transformDailyLog(result.data),
      message: result.message,
    };
  }

  return result as unknown as DailyLogResponse;
};

/**
 * Delete daily log
 */
export const deleteDailyLog = async (id: string): Promise<{ success: boolean; message?: string }> => {
  const response = await api.delete(`/daily-logs/${id}`);
  return response as unknown as { success: boolean; message?: string };
};

/**
 * Get daily logs for a specific project
 */
export const getDailyLogsByProject = async (
  projectId: string,
  pagination?: DailyLogPaginationOptions
): Promise<DailyLogsResponse> => {
  const params = { ...pagination };
  const response = await api.get(`/daily-logs/project/${projectId}`, { params });
  const data = response as unknown as {
    success: boolean;
    data: {
      dailyLogs: DailyLogApiResponse[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    };
    message?: string;
  };

  if (data.success && data.data.dailyLogs) {
    const transformedDailyLogs = data.data.dailyLogs.map(transformDailyLog);
    return {
      success: data.success,
      data: {
        dailyLogs: transformedDailyLogs,
        pagination: data.data.pagination,
      },
      message: data.message,
    };
  }

  return data as unknown as DailyLogsResponse;
};

/**
 * Get daily logs by date range
 */
export const getDailyLogsByDateRange = async (
  dateFrom: string,
  dateTo: string,
  pagination?: DailyLogPaginationOptions
): Promise<DailyLogsResponse> => {
  const params = {
    dateFrom,
    dateTo,
    ...pagination,
  };

  const response = await api.get('/daily-logs/date-range', { params });
  const data = response as unknown as {
    success: boolean;
    data: {
      dailyLogs: DailyLogApiResponse[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    };
    message?: string;
  };

  if (data.success && data.data.dailyLogs) {
    const transformedDailyLogs = data.data.dailyLogs.map(transformDailyLog);
    return {
      success: data.success,
      data: {
        dailyLogs: transformedDailyLogs,
        pagination: data.data.pagination,
      },
      message: data.message,
    };
  }

  return data as unknown as DailyLogsResponse;
};

/**
 * Get daily log statistics
 */
export const getDailyLogStats = async (projectId?: string): Promise<DailyLogStatsResponse> => {
  const params = projectId ? { projectId } : {};
  const response = await api.get('/daily-logs/stats', { params });
  const data = response as unknown as {
    success: boolean;
    data: {
      totalLogs: number;
      thisMonthLogs: number;
      thisWeekLogs: number;
      recentLogs: DailyLogApiResponse[];
    };
    message?: string;
  };

  if (data.success && data.data.recentLogs) {
    return {
      success: data.success,
      data: {
        totalLogs: data.data.totalLogs,
        thisMonthLogs: data.data.thisMonthLogs,
        thisWeekLogs: data.data.thisWeekLogs,
        recentLogs: data.data.recentLogs.map(transformDailyLog),
      },
      message: data.message,
    };
  }

  return data as unknown as DailyLogStatsResponse;
};

// Export the service as default
const dailyLogService = {
  getAllDailyLogs,
  getDailyLogById,
  createDailyLog,
  updateDailyLog,
  deleteDailyLog,
  getDailyLogsByProject,
  getDailyLogsByDateRange,
  getDailyLogStats,
};

export default dailyLogService;
