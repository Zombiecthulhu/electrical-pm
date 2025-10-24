/**
 * Project Service
 * 
 * Handles all project-related API calls including CRUD operations,
 * filtering, pagination, and team management.
 */

import api from './api';

// Raw API response interface (snake_case)
interface ProjectApiResponse {
  id: string;
  name: string;
  project_number: string;
  client_id: string;
  contact_id?: string | null;
  status: 'QUOTED' | 'AWARDED' | 'IN_PROGRESS' | 'INSPECTION' | 'COMPLETE';
  type: string;
  billing_type: 'TIME_AND_MATERIALS' | 'LUMP_SUM' | 'SERVICE_CALL';
  location: string;
  start_date: string | null;
  end_date?: string | null;
  budget: string; // API returns as string
  actual_cost?: string | null;
  description?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  client?: {
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
  members?: ProjectMember[];
  creator?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  updater?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

// Frontend interface (camelCase)
export interface Project {
  id: string;
  name: string;
  projectNumber: string;
  clientId: string;
  contactId?: string | null;
  status: 'QUOTED' | 'AWARDED' | 'IN_PROGRESS' | 'INSPECTION' | 'COMPLETE';
  type: string;
  billingType: 'TIME_AND_MATERIALS' | 'LUMP_SUM' | 'SERVICE_CALL';
  location: string;
  startDate: string | null;
  endDate?: string | null;
  budget: number;
  actualCost?: number;
  description?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  client?: {
    id: string;
    name: string;
    email: string;
  };
  contact?: {
    id: string;
    name: string;
    title?: string;
    email?: string;
    phone?: string;
  };
  members?: ProjectMember[];
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
}

export interface ProjectFilters {
  status?: string;
  type?: string;
  clientId?: string;
  search?: string;
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
  budgetMin?: number;
  budgetMax?: number;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateProjectData {
  name: string;
  projectNumber: string;
  clientId: string;
  contactId?: string | null;
  status: 'QUOTED' | 'AWARDED' | 'IN_PROGRESS' | 'INSPECTION' | 'COMPLETE';
  type: string;
  billingType: 'TIME_AND_MATERIALS' | 'LUMP_SUM' | 'SERVICE_CALL';
  location: string;
  startDate: string;
  endDate?: string;
  budget: number;
  actualCost?: number;
  description?: string | null;
}

export interface UpdateProjectData {
  name?: string;
  projectNumber?: string;
  clientId?: string;
  contactId?: string | null;
  status?: 'QUOTED' | 'AWARDED' | 'IN_PROGRESS' | 'INSPECTION' | 'COMPLETE';
  type?: string;
  billingType?: 'TIME_AND_MATERIALS' | 'LUMP_SUM' | 'SERVICE_CALL';
  location?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  actualCost?: number;
  description?: string | null;
}

export interface ProjectsResponse {
  success: boolean;
  data: {
    projects: Project[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  message?: string;
}

export interface ProjectResponse {
  success: boolean;
  data: Project;
  message?: string;
}

export interface ProjectMembersResponse {
  success: boolean;
  data: ProjectMember[];
  message?: string;
}

/**
 * Transform API response to frontend format
 */
const transformProject = (apiProject: ProjectApiResponse): Project => {
  return {
    id: apiProject.id,
    name: apiProject.name,
    projectNumber: apiProject.project_number,
    clientId: apiProject.client_id,
    contactId: apiProject.contact_id,
    status: apiProject.status,
    type: apiProject.type,
    billingType: apiProject.billing_type,
    location: apiProject.location,
    startDate: apiProject.start_date,
    endDate: apiProject.end_date,
    budget: parseFloat(apiProject.budget) || 0,
    actualCost: apiProject.actual_cost ? parseFloat(apiProject.actual_cost) : undefined,
    description: apiProject.description,
    createdBy: apiProject.created_by,
    createdAt: apiProject.created_at,
    updatedAt: apiProject.updated_at,
    deletedAt: apiProject.deleted_at || undefined,
    client: apiProject.client ? {
      id: apiProject.client.id,
      name: apiProject.client.name,
      email: '', // API doesn't return email in this context
    } : undefined,
    contact: apiProject.contact ? {
      id: apiProject.contact.id,
      name: apiProject.contact.name,
      title: apiProject.contact.title,
      email: apiProject.contact.email,
      phone: apiProject.contact.phone,
    } : undefined,
    members: apiProject.members || [],
  };
};

export interface AssignMemberData {
  userId: string;
  role: string;
}

/**
 * Get all projects with optional filters and pagination
 */
export const getAllProjects = async (
  filters?: ProjectFilters,
  pagination?: PaginationOptions
): Promise<ProjectsResponse> => {
  const params = {
    ...filters,
    ...pagination,
  };

  const response = await api.get('/projects', { params });
  const data = response as unknown as {
    success: boolean;
    data: {
      projects: ProjectApiResponse[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    };
    message?: string;
  };
  
  // Transform projects from API format to frontend format
  if (data.success && data.data.projects) {
    const transformedProjects = data.data.projects.map(transformProject);
    return {
      success: data.success,
      data: {
        projects: transformedProjects,
        pagination: data.data.pagination,
      },
      message: data.message,
    };
  }
  
  return {
    success: false,
    data: {
      projects: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
    },
  };
};

/**
 * Get a single project by ID
 */
export const getProjectById = async (id: string): Promise<ProjectResponse> => {
  const response = await api.get(`/projects/${id}`);
  const data = response as unknown as {
    success: boolean;
    data: ProjectApiResponse;
    message?: string;
  };
  
  // Transform project from API format to frontend format
  if (data.success && data.data) {
    const transformedProject = transformProject(data.data);
    return {
      success: data.success,
      data: transformedProject,
      message: data.message,
    };
  }
  
  return {
    success: false,
    data: {} as Project,
  };
};

/**
 * Create a new project
 */
export const createProject = async (projectData: CreateProjectData): Promise<ProjectResponse> => {
  // Transform camelCase to snake_case for backend and convert enum values
  const transformedData = {
    name: projectData.name,
    project_number: projectData.projectNumber,
    client_id: projectData.clientId,
    status: projectData.status,
    type: projectData.type.toUpperCase(), // Convert to uppercase for backend enum
    billing_type: projectData.billingType,
    location: projectData.location,
    start_date: projectData.startDate,
    end_date: projectData.endDate,
    budget: projectData.budget,
    actual_cost: projectData.actualCost,
  };

  const response = await api.post('/projects', transformedData);
  const apiResponse = response as unknown as {
    success: boolean;
    data: ProjectApiResponse;
    message?: string;
  };
  
  // Transform project from API format to frontend format
  if (apiResponse.success && apiResponse.data) {
    const transformedProject = transformProject(apiResponse.data);
    return {
      success: apiResponse.success,
      data: transformedProject,
      message: apiResponse.message,
    };
  }
  
  return {
    success: false,
    data: {} as Project,
  };
};

/**
 * Update an existing project
 */
export const updateProject = async (id: string, projectData: UpdateProjectData): Promise<ProjectResponse> => {
  // Transform camelCase to snake_case for backend
  const transformedData: any = {};
  if (projectData.name !== undefined) transformedData.name = projectData.name;
  if (projectData.projectNumber !== undefined) transformedData.project_number = projectData.projectNumber;
  if (projectData.clientId !== undefined) transformedData.client_id = projectData.clientId;
  if (projectData.status !== undefined) transformedData.status = projectData.status;
  if (projectData.type !== undefined) transformedData.type = projectData.type.toUpperCase();
  if (projectData.billingType !== undefined) transformedData.billing_type = projectData.billingType;
  if (projectData.location !== undefined) transformedData.location = projectData.location;
  if (projectData.startDate !== undefined) transformedData.start_date = projectData.startDate;
  if (projectData.endDate !== undefined) transformedData.end_date = projectData.endDate;
  if (projectData.budget !== undefined) transformedData.budget = projectData.budget;
  if (projectData.actualCost !== undefined) transformedData.actual_cost = projectData.actualCost;

  const response = await api.put(`/projects/${id}`, transformedData);
  const apiResponse = response as unknown as {
    success: boolean;
    data: ProjectApiResponse;
    message?: string;
  };
  
  // Transform project from API format to frontend format
  if (apiResponse.success && apiResponse.data) {
    const transformedProject = transformProject(apiResponse.data);
    return {
      success: apiResponse.success,
      data: transformedProject,
      message: apiResponse.message,
    };
  }
  
  return {
    success: false,
    data: {} as Project,
  };
};

/**
 * Delete a project (soft delete)
 */
export const deleteProject = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/projects/${id}`);
  return response as unknown as { success: boolean; message: string };
};

/**
 * Assign a member to a project
 */
export const assignProjectMember = async (
  projectId: string,
  data: AssignMemberData
): Promise<{ success: boolean; message: string }> => {
  const response = await api.post(`/projects/${projectId}/members`, data);
  return response as unknown as { success: boolean; message: string };
};

/**
 * Remove a member from a project
 */
export const removeProjectMember = async (
  projectId: string,
  userId: string
): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/projects/${projectId}/members/${userId}`);
  return response as unknown as { success: boolean; message: string };
};

/**
 * Get all members of a project
 */
export const getProjectMembers = async (projectId: string): Promise<ProjectMembersResponse> => {
  const response = await api.get(`/projects/${projectId}/members`);
  return response as unknown as ProjectMembersResponse;
};

// Export all functions as a service object
export const projectService = {
  getAll: getAllProjects,
  getById: getProjectById,
  create: createProject,
  update: updateProject,
  delete: deleteProject,
  assignMember: assignProjectMember,
  removeMember: removeProjectMember,
  getMembers: getProjectMembers,
};

export default projectService;
