import { Response } from 'express';
import { 
  getAllProjects, 
  getProjectById, 
  createProject, 
  updateProject, 
  deleteProject,
  assignMember,
  removeMember,
  getProjectMembers,
  ProjectFilters,
  PaginationOptions,
  CreateProjectData,
  UpdateProjectData
} from '../services/project.service';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * Get all projects with optional filters and pagination
 * GET /api/v1/projects
 */
export const getProjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      status,
      type,
      clientId,
      createdBy,
      search,
      startDateFrom,
      startDateTo,
      budgetMin,
      budgetMax,
      page,
      limit
    } = req.query;

    // Build filters object
    const filters: ProjectFilters = {};
    
    if (status) filters.status = status as any;
    if (type) filters.type = type as any;
    if (clientId) filters.clientId = clientId as string;
    if (createdBy) filters.createdBy = createdBy as string;
    if (search) filters.search = search as string;
    if (startDateFrom) filters.startDateFrom = new Date(startDateFrom as string);
    if (startDateTo) filters.startDateTo = new Date(startDateTo as string);
    if (budgetMin) filters.budgetMin = parseFloat(budgetMin as string);
    if (budgetMax) filters.budgetMax = parseFloat(budgetMax as string);

    // Build pagination object
    const pagination: PaginationOptions = {};
    if (page) pagination.page = parseInt(page as string);
    if (limit) pagination.limit = parseInt(limit as string);

    const result = await getAllProjects(filters, pagination);

    logger.info('Projects retrieved successfully', {
      userId: req.user?.id,
      filters,
      pagination,
      resultCount: result.projects.length
    });

    sendSuccess(res, result, 'Projects retrieved successfully');
  } catch (error: any) {
    logger.error('Error retrieving projects', {
      error: error.message,
      userId: req.user?.id,
      query: req.query
    });
    sendError(res, 'PROJECTS_RETRIEVAL_FAILED', 'Failed to retrieve projects', 500);
  }
};

/**
 * Get single project by ID
 * GET /api/v1/projects/:id
 */
export const getProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      sendError(res, 'MISSING_PROJECT_ID', 'Project ID is required', 400);
      return;
    }

    const project = await getProjectById(id);

    if (!project) {
      sendError(res, 'PROJECT_NOT_FOUND', 'Project not found', 404);
      return;
    }

    logger.info('Project retrieved successfully', {
      userId: req.user?.id,
      projectId: id
    });

    sendSuccess(res, project, 'Project retrieved successfully');
  } catch (error: any) {
    logger.error('Error retrieving project', {
      error: error.message,
      userId: req.user?.id,
      projectId: req.params.id
    });
    sendError(res, 'PROJECT_RETRIEVAL_FAILED', 'Failed to retrieve project', 500);
  }
};

/**
 * Create new project
 * POST /api/v1/projects
 */
export const createProjectController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      sendError(res, 'UNAUTHORIZED', 'User authentication required', 401);
      return;
    }

    const {
      name,
      project_number,
      client_id,
      status,
      type,
      billing_type,
      location,
      address,
      latitude,
      longitude,
      start_date,
      end_date,
      estimated_end_date,
      budget,
      actual_cost,
      description
    } = req.body;

    // Validate required fields
    if (!name || !project_number || !client_id || !type || !billing_type) {
      sendError(res, 'MISSING_REQUIRED_FIELDS', 'Missing required fields: name, project_number, client_id, type, billing_type', 400);
      return;
    }

    const projectData: CreateProjectData = {
      name,
      project_number,
      client_id,
      status,
      type,
      billing_type,
      location,
      address,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      start_date: start_date ? new Date(start_date) : undefined,
      end_date: end_date ? new Date(end_date) : undefined,
      estimated_end_date: estimated_end_date ? new Date(estimated_end_date) : undefined,
      budget: budget ? parseFloat(budget) : undefined,
      actual_cost: actual_cost ? parseFloat(actual_cost) : undefined,
      description
    };

    const project = await createProject(projectData, userId);

    logger.info('Project created successfully', {
      userId,
      projectId: project.id,
      projectNumber: project.project_number
    });

    sendSuccess(res, project, 'Project created successfully', 201);
  } catch (error: any) {
    logger.error('Error creating project', {
      error: error.message,
      userId: req.user?.id,
      body: req.body
    });

    // Handle specific error cases
    if (error.message.includes('already exists')) {
      sendError(res, 'PROJECT_NUMBER_EXISTS', error.message, 409);
    } else if (error.message.includes('not found')) {
      sendError(res, 'CLIENT_NOT_FOUND', error.message, 404);
    } else if (error.message.includes('Missing required fields')) {
      sendError(res, 'MISSING_REQUIRED_FIELDS', error.message, 400);
    } else {
      sendError(res, 'PROJECT_CREATION_FAILED', 'Failed to create project', 500);
    }
  }
};

/**
 * Update project
 * PUT /api/v1/projects/:id
 */
export const updateProjectController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      sendError(res, 'UNAUTHORIZED', 'User authentication required', 401);
      return;
    }

    if (!id) {
      sendError(res, 'MISSING_PROJECT_ID', 'Project ID is required', 400);
      return;
    }

    const {
      name,
      project_number,
      client_id,
      status,
      type,
      billing_type,
      location,
      address,
      latitude,
      longitude,
      start_date,
      end_date,
      estimated_end_date,
      actual_end_date,
      budget,
      actual_cost,
      description
    } = req.body;

    const projectData: UpdateProjectData = {};

    // Only include fields that are provided
    if (name !== undefined) projectData.name = name;
    if (project_number !== undefined) projectData.project_number = project_number;
    if (client_id !== undefined) projectData.client_id = client_id;
    if (status !== undefined) projectData.status = status;
    if (type !== undefined) projectData.type = type;
    if (billing_type !== undefined) projectData.billing_type = billing_type;
    if (location !== undefined) projectData.location = location;
    if (address !== undefined) projectData.address = address;
    if (latitude !== undefined) projectData.latitude = parseFloat(latitude);
    if (longitude !== undefined) projectData.longitude = parseFloat(longitude);
    if (start_date !== undefined) projectData.start_date = new Date(start_date);
    if (end_date !== undefined) projectData.end_date = new Date(end_date);
    if (estimated_end_date !== undefined) projectData.estimated_end_date = new Date(estimated_end_date);
    if (actual_end_date !== undefined) projectData.actual_end_date = new Date(actual_end_date);
    if (budget !== undefined) projectData.budget = parseFloat(budget);
    if (actual_cost !== undefined) projectData.actual_cost = parseFloat(actual_cost);
    if (description !== undefined) projectData.description = description;

    const project = await updateProject(id, projectData, userId);

    logger.info('Project updated successfully', {
      userId,
      projectId: id
    });

    sendSuccess(res, project, 'Project updated successfully');
  } catch (error: any) {
    logger.error('Error updating project', {
      error: error.message,
      userId: req.user?.id,
      projectId: req.params.id,
      body: req.body
    });

    // Handle specific error cases
    if (error.message.includes('not found')) {
      sendError(res, 'PROJECT_NOT_FOUND', error.message, 404);
    } else if (error.message.includes('already exists')) {
      sendError(res, 'PROJECT_NUMBER_EXISTS', error.message, 409);
    } else {
      sendError(res, 'PROJECT_UPDATE_FAILED', 'Failed to update project', 500);
    }
  }
};

/**
 * Delete project (soft delete)
 * DELETE /api/v1/projects/:id
 */
export const deleteProjectController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      sendError(res, 'MISSING_PROJECT_ID', 'Project ID is required', 400);
      return;
    }

    await deleteProject(id);

    logger.info('Project deleted successfully', {
      userId: req.user?.id,
      projectId: id
    });

    sendSuccess(res, null, 'Project deleted successfully');
  } catch (error: any) {
    logger.error('Error deleting project', {
      error: error.message,
      userId: req.user?.id,
      projectId: req.params.id
    });

    if (error.message.includes('not found')) {
      sendError(res, 'PROJECT_NOT_FOUND', error.message, 404);
    } else {
      sendError(res, 'PROJECT_DELETE_FAILED', 'Failed to delete project', 500);
    }
  }
};

/**
 * Assign member to project
 * POST /api/v1/projects/:id/members
 */
export const assignProjectMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id: projectId } = req.params;
    const { userId, role } = req.body;

    if (!projectId) {
      sendError(res, 'MISSING_PROJECT_ID', 'Project ID is required', 400);
      return;
    }

    if (!userId || !role) {
      sendError(res, 'MISSING_REQUIRED_FIELDS', 'User ID and role are required', 400);
      return;
    }

    const member = await assignMember(projectId, userId, role);

    logger.info('Member assigned to project successfully', {
      userId: req.user?.id,
      projectId,
      assignedUserId: userId,
      role
    });

    sendSuccess(res, member, 'Member assigned to project successfully', 201);
  } catch (error: any) {
    logger.error('Error assigning member to project', {
      error: error.message,
      userId: req.user?.id,
      projectId: req.params.id,
      body: req.body
    });

    if (error.message.includes('not found')) {
      sendError(res, 'PROJECT_OR_USER_NOT_FOUND', error.message, 404);
    } else if (error.message.includes('already assigned')) {
      sendError(res, 'USER_ALREADY_ASSIGNED', error.message, 409);
    } else {
      sendError(res, 'MEMBER_ASSIGNMENT_FAILED', 'Failed to assign member to project', 500);
    }
  }
};

/**
 * Remove member from project
 * DELETE /api/v1/projects/:id/members/:userId
 */
export const removeProjectMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id: projectId, userId } = req.params;

    if (!projectId || !userId) {
      sendError(res, 'MISSING_REQUIRED_FIELDS', 'Project ID and User ID are required', 400);
      return;
    }

    await removeMember(projectId, userId);

    logger.info('Member removed from project successfully', {
      userId: req.user?.id,
      projectId,
      removedUserId: userId
    });

    sendSuccess(res, null, 'Member removed from project successfully');
  } catch (error: any) {
    logger.error('Error removing member from project', {
      error: error.message,
      userId: req.user?.id,
      projectId: req.params.id,
      removedUserId: req.params.userId
    });

    if (error.message.includes('not assigned')) {
      sendError(res, 'USER_NOT_ASSIGNED', error.message, 404);
    } else {
      sendError(res, 'MEMBER_REMOVAL_FAILED', 'Failed to remove member from project', 500);
    }
  }
};

/**
 * Get project members
 * GET /api/v1/projects/:id/members
 */
export const getProjectMembersController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id: projectId } = req.params;

    if (!projectId) {
      sendError(res, 'MISSING_PROJECT_ID', 'Project ID is required', 400);
      return;
    }

    const members = await getProjectMembers(projectId);

    logger.info('Project members retrieved successfully', {
      userId: req.user?.id,
      projectId,
      memberCount: members.length
    });

    sendSuccess(res, members, 'Project members retrieved successfully');
  } catch (error: any) {
    logger.error('Error retrieving project members', {
      error: error.message,
      userId: req.user?.id,
      projectId: req.params.id
    });
    sendError(res, 'MEMBERS_RETRIEVAL_FAILED', 'Failed to retrieve project members', 500);
  }
};
