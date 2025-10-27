/**
 * Project Store
 * 
 * Zustand store for managing project state including projects list,
 * selected project, loading states, and CRUD operations.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { 
  projectService, 
  Project, 
  ProjectFilters, 
  PaginationOptions,
  CreateProjectData,
  UpdateProjectData 
} from '../services/project.service';

// Store state interface
interface ProjectState {
  // State
  projects: Project[];
  selectedProject: Project | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  filters: ProjectFilters;
  
  // Actions
  fetchProjects: (filters?: ProjectFilters, pagination?: PaginationOptions) => Promise<void>;
  fetchProject: (id: string) => Promise<void>;
  createProject: (data: CreateProjectData) => Promise<Project | null>;
  updateProject: (id: string, data: UpdateProjectData) => Promise<Project | null>;
  deleteProject: (id: string) => Promise<boolean>;
  setSelectedProject: (project: Project | null) => void;
  setFilters: (filters: ProjectFilters) => void;
  clearError: () => void;
  reset: () => void;
}

// Initial state
const initialState = {
  projects: [],
  selectedProject: null,
  isLoading: false,
  error: null,
  pagination: null,
  filters: {},
};

// Create the store
export const useProjectStore = create<ProjectState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        /**
         * Fetch all projects with optional filters and pagination
         */
        fetchProjects: async (filters = {}, pagination = {}) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await projectService.getAll(filters, pagination);
            
            if (response.success) {
              set({
                projects: response.data.projects,
                pagination: response.data.pagination,
                isLoading: false,
                error: null,
              });
            } else {
              set({
                error: 'Failed to fetch projects',
                isLoading: false,
              });
            }
          } catch (error: any) {
            console.error('Error fetching projects:', error);
            set({
              error: error.message || 'Failed to fetch projects',
              isLoading: false,
            });
          }
        },

        /**
         * Fetch a single project by ID
         */
        fetchProject: async (id: string) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await projectService.getById(id);
            
            if (response.success) {
              set({
                selectedProject: response.data,
                isLoading: false,
                error: null,
              });
            } else {
              set({
                error: 'Failed to fetch project',
                isLoading: false,
              });
            }
          } catch (error: any) {
            console.error('Error fetching project:', error);
            set({
              error: error.message || 'Failed to fetch project',
              isLoading: false,
            });
          }
        },

        /**
         * Create a new project
         */
        createProject: async (data: CreateProjectData) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await projectService.create(data);
            
            if (response.success) {
              const newProject = response.data;
              
              // Add to projects list
              set((state) => ({
                projects: [newProject, ...state.projects],
                isLoading: false,
                error: null,
              }));
              
              return newProject;
            } else {
              set({
                error: 'Failed to create project',
                isLoading: false,
              });
              return null;
            }
          } catch (error: any) {
            console.error('Error creating project:', error);
            set({
              error: error.message || 'Failed to create project',
              isLoading: false,
            });
            return null;
          }
        },

        /**
         * Update an existing project
         */
        updateProject: async (id: string, data: UpdateProjectData) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await projectService.update(id, data);
            
            if (response.success) {
              const updatedProject = response.data;
              
              // Update in projects list
              set((state) => ({
                projects: state.projects.map(project =>
                  project.id === id ? updatedProject : project
                ),
                selectedProject: state.selectedProject?.id === id ? updatedProject : state.selectedProject,
                isLoading: false,
                error: null,
              }));
              
              return updatedProject;
            } else {
              set({
                error: 'Failed to update project',
                isLoading: false,
              });
              return null;
            }
          } catch (error: any) {
            console.error('Error updating project:', error);
            set({
              error: error.message || 'Failed to update project',
              isLoading: false,
            });
            return null;
          }
        },

        /**
         * Delete a project
         */
        deleteProject: async (id: string) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await projectService.delete(id);
            
            if (response.success) {
              // Remove from projects list
              set((state) => ({
                projects: state.projects.filter(project => project.id !== id),
                selectedProject: state.selectedProject?.id === id ? null : state.selectedProject,
                isLoading: false,
                error: null,
              }));
              
              return true;
            } else {
              set({
                error: 'Failed to delete project',
                isLoading: false,
              });
              return false;
            }
          } catch (error: any) {
            console.error('Error deleting project:', error);
            set({
              error: error.message || 'Failed to delete project',
              isLoading: false,
            });
            return false;
          }
        },

        /**
         * Set the selected project
         */
        setSelectedProject: (project: Project | null) => {
          set({ selectedProject: project });
        },

        /**
         * Set filters for project listing
         */
        setFilters: (filters: ProjectFilters) => {
          set({ filters });
        },

        /**
         * Clear any error state
         */
        clearError: () => {
          set({ error: null });
        },

        /**
         * Reset store to initial state
         */
        reset: () => {
          set(initialState);
        },
      }),
      {
        name: 'project-store',
        // Only persist essential data, not loading states
        partialize: (state) => ({
          projects: state.projects,
          selectedProject: state.selectedProject,
          filters: state.filters,
          pagination: state.pagination,
        }),
      }
    ),
    {
      name: 'project-store',
    }
  )
);

// Selector hooks for better performance
export const useProjects = () => useProjectStore((state) => state.projects);
export const useSelectedProject = () => useProjectStore((state) => state.selectedProject);
export const useProjectLoading = () => useProjectStore((state) => state.isLoading);
export const useProjectError = () => useProjectStore((state) => state.error);
export const useProjectPagination = () => useProjectStore((state) => state.pagination);
export const useProjectFilters = () => useProjectStore((state) => state.filters);

// Action selectors
export const useProjectActions = () => useProjectStore((state) => ({
  fetchProjects: state.fetchProjects,
  fetchProject: state.fetchProject,
  createProject: state.createProject,
  updateProject: state.updateProject,
  deleteProject: state.deleteProject,
  setSelectedProject: state.setSelectedProject,
  setFilters: state.setFilters,
  clearError: state.clearError,
  reset: state.reset,
}));

export default useProjectStore;
