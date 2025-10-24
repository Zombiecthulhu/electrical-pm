/**
 * Client Project Service
 * 
 * Frontend API client for client project management including:
 * - Get projects associated with a client
 * - Project filtering and search
 * - Project statistics and analytics
 */

import api from './api';

// Types for client project management
export interface ClientProject {
  id: string;
  name: string;
  project_number: string;
  status: string;
  type: string;
  location?: string;
  address?: string;
  start_date?: string;
  end_date?: string;
  estimated_end_date?: string;
  actual_end_date?: string;
  budget?: number;
  actual_cost?: number;
  description?: string;
  created_at: string;
  updated_at: string;
  creator?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  updater?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  members?: Array<{
    id: string;
    role: string;
    user: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
    };
  }>;
}

export interface ClientProjectFilters {
  status?: string;
  type?: string;
  search?: string;
  start_date_from?: string;
  start_date_to?: string;
  end_date_from?: string;
  end_date_to?: string;
}

export interface ClientProjectPaginationOptions {
  page?: number;
  limit?: number;
}

export interface ClientProjectResponse {
  success: boolean;
  data: ClientProject;
  message?: string;
}

export interface ClientProjectsResponse {
  success: boolean;
  data: {
    projects: ClientProject[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    statistics: {
      total_projects: number;
      active_projects: number;
      completed_projects: number;
      total_budget: number;
      total_actual_cost: number;
      average_project_value: number;
    };
  };
  message?: string;
}

export interface ClientProjectStatistics {
  total_projects: number;
  by_status: {
    QUOTED: number;
    AWARDED: number;
    IN_PROGRESS: number;
    INSPECTION: number;
    COMPLETE: number;
    ON_HOLD: number;
    CANCELLED: number;
  };
  by_type: {
    COMMERCIAL: number;
    RESIDENTIAL: number;
    INDUSTRIAL: number;
    MAINTENANCE: number;
    OTHER: number;
  };
  financial: {
    total_budget: number;
    total_actual_cost: number;
    average_project_value: number;
    profit_margin: number;
  };
  timeline: {
    projects_this_year: number;
    projects_this_month: number;
    average_project_duration: number;
  };
}

export interface ClientProjectStatisticsResponse {
  success: boolean;
  data: ClientProjectStatistics;
  message?: string;
}

/**
 * Get all projects for a client
 */
export const getClientProjects = async (
  clientId: string,
  filters?: ClientProjectFilters,
  pagination?: ClientProjectPaginationOptions
): Promise<ClientProjectsResponse> => {
  const params = {
    ...filters,
    ...pagination,
  };

  const response = await api.get(`/clients/${clientId}/projects`, { params });
  return response as unknown as ClientProjectsResponse;
};

/**
 * Get a single project by ID for a client
 */
export const getClientProjectById = async (clientId: string, projectId: string): Promise<ClientProjectResponse> => {
  const response = await api.get(`/clients/${clientId}/projects/${projectId}`);
  return response as unknown as ClientProjectResponse;
};

/**
 * Get project statistics for a client
 */
export const getClientProjectStatistics = async (clientId: string): Promise<ClientProjectStatisticsResponse> => {
  const response = await api.get(`/clients/${clientId}/projects/statistics`);
  return response as unknown as ClientProjectStatisticsResponse;
};

// Export all functions as a service object
export const clientProjectService = {
  getAll: getClientProjects,
  getById: getClientProjectById,
  getStatistics: getClientProjectStatistics,
};

export default clientProjectService;
