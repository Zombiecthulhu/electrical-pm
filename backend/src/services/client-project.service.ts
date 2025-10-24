/**
 * Client Project Service
 * 
 * Business logic for managing client projects including:
 * - Get projects associated with a client
 * - Project filtering and search
 * - Project statistics and analytics
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

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

export interface ClientProjectsResponse {
  success: boolean;
  data: {
    projects: any[];
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

export interface ClientProjectResponse {
  success: boolean;
  data: any;
  message?: string;
}

/**
 * Get all projects for a client
 */
export const getClientProjects = async (
  clientId: string,
  filters: ClientProjectFilters = {},
  pagination: ClientProjectPaginationOptions = {}
): Promise<ClientProjectsResponse> => {
  try {
    const { page = 1, limit = 20 } = pagination;
    const { 
      status, 
      type, 
      search, 
      start_date_from, 
      start_date_to, 
      end_date_from, 
      end_date_to 
    } = filters;

    // Build where clause
    const where: any = {
      client_id: clientId,
      deleted_at: null,
    };

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { project_number: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (start_date_from || start_date_to) {
      where.start_date = {};
      if (start_date_from) {
        where.start_date.gte = new Date(start_date_from);
      }
      if (start_date_to) {
        where.start_date.lte = new Date(start_date_to);
      }
    }

    if (end_date_from || end_date_to) {
      where.end_date = {};
      if (end_date_from) {
        where.end_date.gte = new Date(end_date_from);
      }
      if (end_date_to) {
        where.end_date.lte = new Date(end_date_to);
      }
    }

    // Get total count
    const total = await prisma.project.count({ where });

    // Get projects with pagination
    const projects = await prisma.project.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        creator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        updater: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        members: {
          select: {
            id: true,
            role: true,
            user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Calculate statistics
    const allProjects = await prisma.project.findMany({
      where: { client_id: clientId, deleted_at: null },
      select: {
        status: true,
        budget: true,
        actual_cost: true,
      },
    });

    const statistics = {
      total_projects: allProjects.length,
      active_projects: allProjects.filter(p => ['QUOTED', 'AWARDED', 'IN_PROGRESS', 'INSPECTION'].includes(p.status)).length,
      completed_projects: allProjects.filter(p => p.status === 'COMPLETE').length,
      total_budget: allProjects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0),
      total_actual_cost: allProjects.reduce((sum, p) => sum + (Number(p.actual_cost) || 0), 0),
      average_project_value: allProjects.length > 0 ? 
        allProjects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0) / allProjects.length : 0,
    };

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        projects,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
        statistics,
      },
    };
  } catch (error: any) {
    logger.error('Error fetching client projects', { error: error.message, clientId, filters, pagination });
    throw new Error('Failed to fetch client projects');
  }
};

/**
 * Get single project by ID for a client
 */
export const getClientProjectById = async (clientId: string, projectId: string): Promise<ClientProjectResponse> => {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        client_id: clientId,
        deleted_at: null,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            type: true,
            email: true,
            phone: true,
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
        updater: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        members: {
          select: {
            id: true,
            role: true,
            assigned_at: true,
            user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        files: {
          where: { deleted_at: null },
          select: {
            id: true,
            original_filename: true,
            category: true,
            file_size: true,
            uploaded_at: true,
            uploader: {
              select: {
                first_name: true,
                last_name: true,
              },
            },
          },
          orderBy: { uploaded_at: 'desc' },
          take: 10,
        },
        daily_logs: {
          select: {
            id: true,
            date: true,
            work_performed: true,
            hours_worked: true,
            creator: {
              select: {
                first_name: true,
                last_name: true,
              },
            },
          },
          orderBy: { date: 'desc' },
          take: 5,
        },
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    return {
      success: true,
      data: project,
    };
  } catch (error: any) {
    logger.error('Error fetching client project', { error: error.message, clientId, projectId });
    throw error;
  }
};

/**
 * Get client project statistics
 */
export const getClientProjectStatistics = async (clientId: string): Promise<ClientProjectResponse> => {
  try {
    const projects = await prisma.project.findMany({
      where: { client_id: clientId, deleted_at: null },
      select: {
        status: true,
        type: true,
        budget: true,
        actual_cost: true,
        start_date: true,
        end_date: true,
        created_at: true,
      },
    });

    // Calculate detailed statistics
    const statistics = {
      total_projects: projects.length,
      by_status: {
        QUOTED: projects.filter(p => p.status === 'QUOTED').length,
        AWARDED: projects.filter(p => p.status === 'AWARDED').length,
        IN_PROGRESS: projects.filter(p => p.status === 'IN_PROGRESS').length,
        INSPECTION: projects.filter(p => p.status === 'INSPECTION').length,
        COMPLETE: projects.filter(p => p.status === 'COMPLETE').length,
        ON_HOLD: projects.filter(p => p.status === 'ON_HOLD').length,
        CANCELLED: projects.filter(p => p.status === 'CANCELLED').length,
      },
      by_type: {
        COMMERCIAL: projects.filter(p => p.type === 'COMMERCIAL').length,
        RESIDENTIAL: projects.filter(p => p.type === 'RESIDENTIAL').length,
        INDUSTRIAL: projects.filter(p => p.type === 'INDUSTRIAL').length,
        MAINTENANCE: projects.filter(p => p.type === 'MAINTENANCE').length,
        OTHER: projects.filter(p => p.type === 'OTHER').length,
      },
      financial: {
        total_budget: projects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0),
        total_actual_cost: projects.reduce((sum, p) => sum + (Number(p.actual_cost) || 0), 0),
        average_project_value: projects.length > 0 ? 
          projects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0) / projects.length : 0,
        profit_margin: (() => {
          const totalBudget = projects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);
          const totalActual = projects.reduce((sum, p) => sum + (Number(p.actual_cost) || 0), 0);
          return totalBudget > 0 ? ((totalBudget - totalActual) / totalBudget) * 100 : 0;
        })(),
      },
      timeline: {
        projects_this_year: projects.filter(p => 
          new Date(p.created_at).getFullYear() === new Date().getFullYear()
        ).length,
        projects_this_month: projects.filter(p => {
          const now = new Date();
          const projectDate = new Date(p.created_at);
          return projectDate.getFullYear() === now.getFullYear() && 
                 projectDate.getMonth() === now.getMonth();
        }).length,
        average_project_duration: (() => {
          const completedProjects = projects.filter(p => p.start_date && p.end_date);
          if (completedProjects.length === 0) return 0;
          const totalDays = completedProjects.reduce((sum, p) => {
            const start = new Date(p.start_date!);
            const end = new Date(p.end_date!);
            return sum + Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          }, 0);
          return totalDays / completedProjects.length;
        })(),
      },
    };

    return {
      success: true,
      data: statistics,
    };
  } catch (error: any) {
    logger.error('Error fetching client project statistics', { error: error.message, clientId });
    throw error;
  }
};
