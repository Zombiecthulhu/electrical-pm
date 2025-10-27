import { PrismaClient, Project, ProjectStatus, ProjectType, ProjectMember } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Types for project operations
export interface ProjectFilters {
  status?: ProjectStatus;
  type?: ProjectType;
  billingType?: string;
  clientId?: string;
  createdBy?: string;
  search?: string;
  startDateFrom?: Date;
  startDateTo?: Date;
  budgetMin?: number;
  budgetMax?: number;
}

export interface ProjectPaginationOptions {
  page?: number;
  limit?: number;
}

export interface ProjectWithRelations extends Project {
  client: {
    id: string;
    name: string;
    type: string;
  };
  contact?: {
    id: string;
    name: string;
    title?: string;
    email?: string;
    phone?: string;
  };
  members: Array<{
    id: string;
    user: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
    };
    role: string;
    assigned_at: Date;
  }>;
  creator: {
    id: string;
    first_name: string;
    last_name: string;
  };
  updater: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export interface CreateProjectData {
  name: string;
  project_number: string;
  client_id: string;
  contact_id?: string;
  status?: ProjectStatus;
  type: ProjectType;
  billing_type: 'TIME_AND_MATERIALS' | 'LUMP_SUM' | 'SERVICE_CALL';
  location?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  start_date?: Date;
  end_date?: Date;
  estimated_end_date?: Date;
  budget?: number;
  actual_cost?: number;
  description?: string;
}

export interface UpdateProjectData {
  name?: string;
  project_number?: string;
  client_id?: string;
  contact_id?: string;
  status?: ProjectStatus;
  type?: ProjectType;
  billing_type?: 'TIME_AND_MATERIALS' | 'LUMP_SUM' | 'SERVICE_CALL';
  location?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  start_date?: Date;
  end_date?: Date;
  estimated_end_date?: Date;
  actual_end_date?: Date;
  budget?: number;
  actual_cost?: number;
  description?: string;
}

export interface ProjectListResponse {
  projects: ProjectWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Get all projects with optional filters and pagination
 */
export const getAllProjects = async (
  filters: ProjectFilters = {},
  pagination: ProjectPaginationOptions = {}
): Promise<ProjectListResponse> => {
  try {
    const {
      status,
      type,
      billingType,
      clientId,
      createdBy,
      search,
      startDateFrom,
      startDateTo,
      budgetMin,
      budgetMax,
    } = filters;

    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      deleted_at: null, // Only non-deleted projects
    };

    if (status) where.status = status;
    if (type) where.type = type;
    if (billingType) where.billing_type = billingType;
    if (clientId) where.client_id = clientId;
    if (createdBy) where.created_by = createdBy;

    // Search in project name, project number, or description
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { project_number: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Date range filters
    if (startDateFrom || startDateTo) {
      where.start_date = {};
      if (startDateFrom) where.start_date.gte = startDateFrom;
      if (startDateTo) where.start_date.lte = startDateTo;
    }

    // Budget range filters
    if (budgetMin !== undefined || budgetMax !== undefined) {
      where.budget = {};
      if (budgetMin !== undefined) where.budget.gte = budgetMin;
      if (budgetMax !== undefined) where.budget.lte = budgetMax;
    }

    // Get total count for pagination
    const total = await prisma.project.count({ where });

    // Get projects with relations
    const projects = await prisma.project.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        contact: {
          select: {
            id: true,
            name: true,
            title: true,
            email: true,
            phone: true,
          },
        },
        members: {
          include: {
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
        creator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        updater: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    logger.info('Projects retrieved successfully', {
      count: projects.length,
      total,
      page,
      limit,
      filters,
    });

    return {
      projects: projects as ProjectWithRelations[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  } catch (error) {
    logger.error('Error retrieving projects', { error, filters, pagination });
    throw new Error('Failed to retrieve projects');
  }
};

/**
 * Get single project by ID with all relations
 */
export const getProjectById = async (id: string): Promise<ProjectWithRelations | null> => {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id,
        deleted_at: null,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        contact: {
          select: {
            id: true,
            name: true,
            title: true,
            email: true,
            phone: true,
          },
        },
        members: {
          include: {
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
        creator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        updater: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    if (!project) {
      logger.warn('Project not found', { projectId: id });
      return null;
    }

    logger.info('Project retrieved successfully', { projectId: id });
    return project as ProjectWithRelations;
  } catch (error) {
    logger.error('Error retrieving project', { error, projectId: id });
    throw new Error('Failed to retrieve project');
  }
};

/**
 * Create new project
 */
export const createProject = async (
  data: CreateProjectData,
  userId: string
): Promise<ProjectWithRelations> => {
  try {
    // Validate required fields
    if (!data.name || !data.project_number || !data.client_id || !data.type || !data.billing_type) {
      throw new Error('Missing required fields: name, project_number, client_id, type, billing_type');
    }

    // Check if project number already exists
    const existingProject = await prisma.project.findFirst({
      where: {
        project_number: data.project_number,
        deleted_at: null,
      },
    });

    if (existingProject) {
      throw new Error('Project number already exists');
    }

    // Check if client exists
    const client = await prisma.client.findFirst({
      where: {
        id: data.client_id,
        deleted_at: null,
      },
    });

    if (!client) {
      throw new Error('Client not found');
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        ...data,
        created_by: userId,
        updated_by: userId,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        contact: {
          select: {
            id: true,
            name: true,
            title: true,
            email: true,
            phone: true,
          },
        },
        members: {
          include: {
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
        creator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        updater: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    logger.info('Project created successfully', {
      projectId: project.id,
      projectNumber: project.project_number,
      createdBy: userId,
    });

    return project as ProjectWithRelations;
  } catch (error) {
    logger.error('Error creating project', { error, data, userId });
    throw error;
  }
};

/**
 * Update project
 */
export const updateProject = async (
  id: string,
  data: UpdateProjectData,
  userId: string
): Promise<ProjectWithRelations> => {
  try {
    // Check if project exists and is not deleted
    const existingProject = await prisma.project.findFirst({
      where: {
        id,
        deleted_at: null,
      },
    });

    if (!existingProject) {
      throw new Error('Project not found');
    }

    // If project number is being updated, check for duplicates
    if (data.project_number && data.project_number !== existingProject.project_number) {
      const duplicateProject = await prisma.project.findFirst({
        where: {
          project_number: data.project_number,
          deleted_at: null,
          id: { not: id },
        },
      });

      if (duplicateProject) {
        throw new Error('Project number already exists');
      }
    }

    // If client is being updated, check if client exists
    if (data.client_id && data.client_id !== existingProject.client_id) {
      const client = await prisma.client.findFirst({
        where: {
          id: data.client_id,
          deleted_at: null,
        },
      });

      if (!client) {
        throw new Error('Client not found');
      }
    }

    // Update project
    const project = await prisma.project.update({
      where: { id },
      data: {
        ...data,
        updated_by: userId,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        members: {
          include: {
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
        creator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        updater: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    logger.info('Project updated successfully', {
      projectId: id,
      updatedBy: userId,
    });

    return project as ProjectWithRelations;
  } catch (error) {
    logger.error('Error updating project', { error, projectId: id, data, userId });
    throw error;
  }
};

/**
 * Soft delete project
 */
export const deleteProject = async (id: string): Promise<void> => {
  try {
    // Check if project exists and is not already deleted
    const existingProject = await prisma.project.findFirst({
      where: {
        id,
        deleted_at: null,
      },
    });

    if (!existingProject) {
      throw new Error('Project not found');
    }

    // Soft delete project
    await prisma.project.update({
      where: { id },
      data: {
        deleted_at: new Date(),
      },
    });

    logger.info('Project deleted successfully', { projectId: id });
  } catch (error) {
    logger.error('Error deleting project', { error, projectId: id });
    throw error;
  }
};

/**
 * Assign team member to project
 */
export const assignMember = async (
  projectId: string,
  userId: string,
  role: string
): Promise<ProjectMember> => {
  try {
    // Check if project exists and is not deleted
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        deleted_at: null,
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Check if user exists and is active
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        is_active: true,
        deleted_at: null,
      },
    });

    if (!user) {
      throw new Error('User not found or inactive');
    }

    // Check if user is already assigned to this project
    const existingMember = await prisma.projectMember.findFirst({
      where: {
        project_id: projectId,
        user_id: userId,
      },
    });

    if (existingMember) {
      throw new Error('User is already assigned to this project');
    }

    // Assign member to project
    const projectMember = await prisma.projectMember.create({
      data: {
        project_id: projectId,
        user_id: userId,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    logger.info('Member assigned to project successfully', {
      projectId,
      userId,
      role,
    });

    return projectMember;
  } catch (error) {
    logger.error('Error assigning member to project', { error, projectId, userId, role });
    throw error;
  }
};

/**
 * Remove team member from project
 */
export const removeMember = async (projectId: string, userId: string): Promise<void> => {
  try {
    // Check if assignment exists
    const existingMember = await prisma.projectMember.findFirst({
      where: {
        project_id: projectId,
        user_id: userId,
      },
    });

    if (!existingMember) {
      throw new Error('User is not assigned to this project');
    }

    // Remove member from project
    await prisma.projectMember.delete({
      where: {
        id: existingMember.id,
      },
    });

    logger.info('Member removed from project successfully', {
      projectId,
      userId,
    });
  } catch (error) {
    logger.error('Error removing member from project', { error, projectId, userId });
    throw error;
  }
};

/**
 * Get project members
 */
export const getProjectMembers = async (projectId: string) => {
  try {
    const members = await prisma.projectMember.findMany({
      where: {
        project_id: projectId,
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        assigned_at: 'asc',
      },
    });

    logger.info('Project members retrieved successfully', {
      projectId,
      memberCount: members.length,
    });

    return members;
  } catch (error) {
    logger.error('Error retrieving project members', { error, projectId });
    throw new Error('Failed to retrieve project members');
  }
};
