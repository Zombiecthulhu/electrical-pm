/**
 * Employee Store
 * 
 * Zustand store for employee directory state management
 */

import { create } from 'zustand';
import employeeService, {
  Employee,
  CreateEmployeeData,
  UpdateEmployeeData,
  EmployeeFilters,
  EmployeePaginationOptions
} from '../services/employee.service';

interface EmployeeState {
  // State
  employees: Employee[];
  selectedEmployee: Employee | null;
  isLoading: boolean;
  error: string | null;
  
  // Pagination
  currentPage: number;
  totalPages: number;
  totalEmployees: number;
  pageSize: number;
  
  // Filters
  filters: EmployeeFilters;
  
  // Actions
  fetchEmployees: (filters?: EmployeeFilters, pagination?: EmployeePaginationOptions) => Promise<void>;
  fetchEmployeeById: (id: string) => Promise<void>;
  createEmployee: (data: CreateEmployeeData) => Promise<Employee | null>;
  updateEmployee: (id: string, data: UpdateEmployeeData) => Promise<Employee | null>;
  deleteEmployee: (id: string) => Promise<boolean>;
  setSelectedEmployee: (employee: Employee | null) => void;
  setFilters: (filters: EmployeeFilters) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  employees: [],
  selectedEmployee: null,
  isLoading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  totalEmployees: 0,
  pageSize: 20,
  filters: {},
};

export const useEmployeeStore = create<EmployeeState>((set, get) => ({
  ...initialState,

  /**
   * Fetch all employees with filters and pagination
   */
  fetchEmployees: async (filters?: EmployeeFilters, pagination?: EmployeePaginationOptions) => {
    set({ isLoading: true, error: null });

    try {
      const currentFilters = filters || get().filters;
      const currentPagination = pagination || {
        page: get().currentPage,
        limit: get().pageSize
      };

      const response = await employeeService.getAll(currentFilters, currentPagination);

      if (response.success) {
        set({
          employees: response.data.employees,
          totalEmployees: response.data.total,
          currentPage: response.data.page,
          totalPages: Math.ceil(response.data.total / response.data.limit),
          isLoading: false,
          error: null
        });
      } else {
        set({
          error: 'Failed to fetch employees',
          isLoading: false
        });
      }
    } catch (error: any) {
      console.error('Error fetching employees:', error);
      const errorMessage = error?.response?.data?.error?.message 
        || error?.message 
        || 'Failed to fetch employees';
      set({
        error: errorMessage,
        isLoading: false
      });
    }
  },

  /**
   * Fetch single employee by ID
   */
  fetchEmployeeById: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await employeeService.getById(id);

      if (response.success) {
        set({
          selectedEmployee: response.data,
          isLoading: false,
          error: null
        });
      } else {
        set({
          error: 'Failed to fetch employee',
          isLoading: false
        });
      }
    } catch (error: any) {
      console.error('Error fetching employee:', error);
      const errorMessage = error?.response?.data?.error?.message 
        || error?.message 
        || 'Failed to fetch employee';
      set({
        error: errorMessage,
        isLoading: false
      });
    }
  },

  /**
   * Create new employee
   */
  createEmployee: async (data: CreateEmployeeData) => {
    set({ isLoading: true, error: null });

    try {
      const response = await employeeService.create(data);

      if (response.success) {
        // Refresh employee list
        await get().fetchEmployees();

        set({
          selectedEmployee: response.data,
          isLoading: false,
          error: null
        });

        return response.data;
      } else {
        set({
          error: 'Failed to create employee',
          isLoading: false
        });
        return null;
      }
    } catch (error: any) {
      console.error('Error creating employee:', error);
      const errorMessage = error?.response?.data?.error?.message 
        || error?.message 
        || 'Failed to create employee';
      set({
        error: errorMessage,
        isLoading: false
      });
      return null;
    }
  },

  /**
   * Update employee
   */
  updateEmployee: async (id: string, data: UpdateEmployeeData) => {
    set({ isLoading: true, error: null });

    try {
      const response = await employeeService.update(id, data);

      if (response.success) {
        // Refresh employee list
        await get().fetchEmployees();

        // Update selected employee if it's the one being updated
        if (get().selectedEmployee?.id === id) {
          set({ selectedEmployee: response.data });
        }

        set({
          isLoading: false,
          error: null
        });

        return response.data;
      } else {
        set({
          error: 'Failed to update employee',
          isLoading: false
        });
        return null;
      }
    } catch (error: any) {
      console.error('Error updating employee:', error);
      const errorMessage = error?.response?.data?.error?.message 
        || error?.message 
        || 'Failed to update employee';
      set({
        error: errorMessage,
        isLoading: false
      });
      return null;
    }
  },

  /**
   * Delete employee (soft delete)
   */
  deleteEmployee: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await employeeService.remove(id);

      if (response.success) {
        // Refresh employee list
        await get().fetchEmployees();

        // Clear selected employee if it's the one being deleted
        if (get().selectedEmployee?.id === id) {
          set({ selectedEmployee: null });
        }

        set({
          isLoading: false,
          error: null
        });

        return true;
      } else {
        set({
          error: 'Failed to delete employee',
          isLoading: false
        });
        return false;
      }
    } catch (error: any) {
      console.error('Error deleting employee:', error);
      const errorMessage = error?.response?.data?.error?.message 
        || error?.message 
        || 'Failed to delete employee';
      set({
        error: errorMessage,
        isLoading: false
      });
      return false;
    }
  },

  /**
   * Set selected employee
   */
  setSelectedEmployee: (employee: Employee | null) => {
    set({ selectedEmployee: employee });
  },

  /**
   * Set filters
   */
  setFilters: (filters: EmployeeFilters) => {
    set({ filters, currentPage: 1 }); // Reset to page 1 when filters change
  },

  /**
   * Set current page
   */
  setPage: (page: number) => {
    set({ currentPage: page });
  },

  /**
   * Set page size
   */
  setPageSize: (size: number) => {
    set({ pageSize: size, currentPage: 1 }); // Reset to page 1 when page size changes
  },

  /**
   * Clear error
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Reset store to initial state
   */
  reset: () => {
    set(initialState);
  }
}));

// Convenience selectors
export const useEmployees = () => useEmployeeStore((state) => state.employees);
export const useSelectedEmployee = () => useEmployeeStore((state) => state.selectedEmployee);
export const useEmployeeLoading = () => useEmployeeStore((state) => state.isLoading);
export const useEmployeeError = () => useEmployeeStore((state) => state.error);

