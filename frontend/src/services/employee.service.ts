/**
 * Employee Service
 * 
 * Frontend API client for employee directory management
 */

import api from './api';

// Employee interfaces
export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  classification: string;
  userId?: string | null;
  // Phase 2 fields
  email?: string | null;
  phone?: string | null;
  mobilePhone?: string | null;
  hireDate?: string | null;
  employmentStatus?: string | null;
  employeeNumber?: string | null;
  department?: string | null;
  notes?: string | null;
  // Audit
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Relations
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  projectMembers?: any[];
}

export interface CreateEmployeeData {
  firstName: string;
  lastName: string;
  classification: string;
  userId?: string | null;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  hireDate?: string;
  employmentStatus?: string;
  employeeNumber?: string;
  department?: string;
  notes?: string;
}

export interface UpdateEmployeeData {
  firstName?: string;
  lastName?: string;
  classification?: string;
  userId?: string | null;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  hireDate?: string;
  employmentStatus?: string;
  employeeNumber?: string;
  department?: string;
  notes?: string;
  isActive?: boolean;
}

export interface EmployeeFilters {
  classification?: string;
  employmentStatus?: string;
  department?: string;
  isActive?: boolean;
  search?: string;
}

export interface EmployeePaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface EmployeesResponse {
  success: boolean;
  data: {
    employees: any[]; // Raw from API
    total: number;
    page: number;
    limit: number;
  };
  message?: string;
}

export interface EmployeeResponse {
  success: boolean;
  data: any; // Raw from API
  message?: string;
}

/**
 * Transform API employee (snake_case) to frontend format (camelCase)
 */
const transformEmployee = (apiEmployee: any): Employee => {
  return {
    id: apiEmployee.id,
    firstName: apiEmployee.first_name,
    lastName: apiEmployee.last_name,
    classification: apiEmployee.classification,
    userId: apiEmployee.user_id,
    email: apiEmployee.email,
    phone: apiEmployee.phone,
    mobilePhone: apiEmployee.mobile_phone,
    hireDate: apiEmployee.hire_date,
    employmentStatus: apiEmployee.employment_status,
    employeeNumber: apiEmployee.employee_number,
    department: apiEmployee.department,
    notes: apiEmployee.notes,
    isActive: apiEmployee.is_active,
    createdAt: apiEmployee.created_at,
    updatedAt: apiEmployee.updated_at,
    user: apiEmployee.user ? {
      id: apiEmployee.user.id,
      email: apiEmployee.user.email,
      firstName: apiEmployee.user.first_name,
      lastName: apiEmployee.user.last_name,
      role: apiEmployee.user.role
    } : undefined,
    projectMembers: apiEmployee.project_members
  };
};

/**
 * Get all employees
 */
export const getAll = async (
  filters?: EmployeeFilters,
  pagination?: EmployeePaginationOptions
): Promise<EmployeesResponse> => {
  const params: any = {};
  
  if (filters?.classification) params.classification = filters.classification;
  if (filters?.employmentStatus) params.employment_status = filters.employmentStatus;
  if (filters?.department) params.department = filters.department;
  if (filters?.isActive !== undefined) params.is_active = filters.isActive;
  if (filters?.search) params.search = filters.search;
  
  if (pagination?.page) params.page = pagination.page;
  if (pagination?.limit) params.limit = pagination.limit;
  if (pagination?.sortBy) params.sortBy = pagination.sortBy;
  if (pagination?.sortOrder) params.sortOrder = pagination.sortOrder;

  const response = await api.get('/employees', { params });
  const apiResponse = response as unknown as {
    success: boolean;
    data: {
      employees: any[];
      total: number;
      page: number;
      limit: number;
    };
    message?: string;
  };

  // Transform all employees
  const transformedEmployees = apiResponse.data.employees.map(transformEmployee);

  return {
    success: apiResponse.success,
    data: {
      employees: transformedEmployees,
      total: apiResponse.data.total,
      page: apiResponse.data.page,
      limit: apiResponse.data.limit
    },
    message: apiResponse.message
  };
};

/**
 * Get single employee by ID
 */
export const getById = async (id: string): Promise<EmployeeResponse> => {
  const response = await api.get(`/employees/${id}`);
  const apiResponse = response as unknown as {
    success: boolean;
    data: any;
    message?: string;
  };

  const transformedEmployee = transformEmployee(apiResponse.data);

  return {
    success: apiResponse.success,
    data: transformedEmployee,
    message: apiResponse.message
  };
};

/**
 * Create new employee
 */
export const create = async (data: CreateEmployeeData): Promise<EmployeeResponse> => {
  // Transform to snake_case for backend
  const transformedData = {
    first_name: data.firstName,
    last_name: data.lastName,
    classification: data.classification,
    user_id: data.userId,
    email: data.email,
    phone: data.phone,
    mobile_phone: data.mobilePhone,
    hire_date: data.hireDate,
    employment_status: data.employmentStatus,
    employee_number: data.employeeNumber,
    department: data.department,
    notes: data.notes
  };

  const response = await api.post('/employees', transformedData);
  const apiResponse = response as unknown as {
    success: boolean;
    data: any;
    message?: string;
  };

  const transformedEmployee = transformEmployee(apiResponse.data);

  return {
    success: apiResponse.success,
    data: transformedEmployee,
    message: apiResponse.message
  };
};

/**
 * Update employee
 */
export const update = async (id: string, data: UpdateEmployeeData): Promise<EmployeeResponse> => {
  // Transform to snake_case for backend
  const transformedData: any = {};
  
  if (data.firstName !== undefined) transformedData.first_name = data.firstName;
  if (data.lastName !== undefined) transformedData.last_name = data.lastName;
  if (data.classification !== undefined) transformedData.classification = data.classification;
  if (data.userId !== undefined) transformedData.user_id = data.userId;
  if (data.email !== undefined) transformedData.email = data.email;
  if (data.phone !== undefined) transformedData.phone = data.phone;
  if (data.mobilePhone !== undefined) transformedData.mobile_phone = data.mobilePhone;
  if (data.hireDate !== undefined) transformedData.hire_date = data.hireDate;
  if (data.employmentStatus !== undefined) transformedData.employment_status = data.employmentStatus;
  if (data.employeeNumber !== undefined) transformedData.employee_number = data.employeeNumber;
  if (data.department !== undefined) transformedData.department = data.department;
  if (data.notes !== undefined) transformedData.notes = data.notes;
  if (data.isActive !== undefined) transformedData.is_active = data.isActive;

  const response = await api.put(`/employees/${id}`, transformedData);
  const apiResponse = response as unknown as {
    success: boolean;
    data: any;
    message?: string;
  };

  const transformedEmployee = transformEmployee(apiResponse.data);

  return {
    success: apiResponse.success,
    data: transformedEmployee,
    message: apiResponse.message
  };
};

/**
 * Delete employee (soft delete)
 */
export const remove = async (id: string): Promise<{ success: boolean; message?: string }> => {
  const response = await api.delete(`/employees/${id}`);
  return response as unknown as { success: boolean; message?: string };
};

/**
 * Get employee classifications
 */
export const getClassifications = async (): Promise<string[]> => {
  const response = await api.get('/employees/classifications');
  const apiResponse = response as unknown as {
    success: boolean;
    data: string[];
  };
  return apiResponse.data;
};

/**
 * Get employment statistics
 */
export const getStats = async (): Promise<any> => {
  const response = await api.get('/employees/stats');
  const apiResponse = response as unknown as {
    success: boolean;
    data: any;
  };
  return apiResponse.data;
};

const employeeService = {
  getAll,
  getById,
  create,
  update,
  remove,
  getClassifications,
  getStats
};

export default employeeService;

