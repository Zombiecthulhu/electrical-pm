/**
 * Employee Service
 * 
 * Business logic for employee directory management.
 * Phase 1: Basic CRUD with first_name, last_name, classification
 * Future: Will expand to include all employee data fields
 */

import { PrismaClient, Employee } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// DTOs for Employee
export interface CreateEmployeeData {
  first_name: string;
  last_name: string;
  classification: string;
  user_id?: string | null;
  // Phase 2 fields (optional)
  email?: string;
  phone?: string;
  mobile_phone?: string;
  hire_date?: Date;
  employment_status?: string;
  employee_number?: string;
  department?: string;
  notes?: string;
}

export interface UpdateEmployeeData {
  first_name?: string;
  last_name?: string;
  classification?: string;
  user_id?: string | null;
  // Phase 2 fields (optional)
  email?: string;
  phone?: string;
  mobile_phone?: string;
  hire_date?: Date;
  employment_status?: string;
  employee_number?: string;
  department?: string;
  notes?: string;
  is_active?: boolean;
}

export interface EmployeeFilters {
  classification?: string;
  employment_status?: string;
  department?: string;
  is_active?: boolean;
  search?: string; // Search by name
}

export interface EmployeePaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Get all employees with optional filters and pagination
 */
export const getAllEmployees = async (
  filters: EmployeeFilters = {},
  pagination: EmployeePaginationOptions = {}
): Promise<{ employees: Employee[]; total: number; page: number; limit: number }> => {
  const {
    classification,
    employment_status,
    department,
    is_active = true, // Default to active employees only
    search
  } = filters;

  const {
    page = 1,
    limit = 20,
    sortBy = 'last_name',
    sortOrder = 'asc'
  } = pagination;

  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {
    deleted_at: null, // Exclude soft-deleted
  };

  if (is_active !== undefined) {
    where.is_active = is_active;
  }

  if (classification) {
    where.classification = classification;
  }

  if (employment_status) {
    where.employment_status = employment_status;
  }

  if (department) {
    where.department = department;
  }

  if (search) {
    where.OR = [
      { first_name: { contains: search, mode: 'insensitive' } },
      { last_name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { employee_number: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Get total count
  const total = await prisma.employee.count({ where });

  // Get employees
  const employees = await prisma.employee.findMany({
    where,
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          role: true
        }
      }
    }
  });

  return {
    employees,
    total,
    page,
    limit
  };
};

/**
 * Get single employee by ID
 */
export const getEmployeeById = async (id: string): Promise<Employee | null> => {
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          role: true
        }
      },
      project_members: {
        include: {
          project: {
            select: {
              id: true,
              name: true,
              project_number: true,
              status: true
            }
          }
        }
      }
    }
  });

  if (!employee || employee.deleted_at) {
    return null;
  }

  return employee;
};

/**
 * Create new employee
 */
export const createEmployee = async (
  data: CreateEmployeeData,
  userId: string
): Promise<Employee> => {
  // Check if employee number already exists (if provided)
  if (data.employee_number) {
    const existing = await prisma.employee.findUnique({
      where: { employee_number: data.employee_number }
    });

    if (existing && !existing.deleted_at) {
      throw new Error(`Employee number ${data.employee_number} already exists`);
    }
  }

  // Check if user_id already linked (if provided)
  if (data.user_id) {
    const existingUser = await prisma.employee.findUnique({
      where: { user_id: data.user_id }
    });

    if (existingUser && !existingUser.deleted_at) {
      throw new Error(`User is already linked to another employee`);
    }
  }

  const employee = await prisma.employee.create({
    data: {
      ...data,
      created_by: userId,
      updated_by: userId
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          role: true
        }
      }
    }
  });

  logger.info('Employee created', {
    employeeId: employee.id,
    userId,
    name: `${employee.first_name} ${employee.last_name}`
  });

  return employee;
};

/**
 * Update employee
 */
export const updateEmployee = async (
  id: string,
  data: UpdateEmployeeData,
  userId: string
): Promise<Employee> => {
  // Check if employee exists
  const existing = await prisma.employee.findUnique({
    where: { id }
  });

  if (!existing || existing.deleted_at) {
    throw new Error('Employee not found');
  }

  // Check if employee number already exists (if changed)
  if (data.employee_number && data.employee_number !== existing.employee_number) {
    const duplicate = await prisma.employee.findUnique({
      where: { employee_number: data.employee_number }
    });

    if (duplicate && duplicate.id !== id && !duplicate.deleted_at) {
      throw new Error(`Employee number ${data.employee_number} already exists`);
    }
  }

  // Check if user_id already linked (if changed)
  if (data.user_id !== undefined && data.user_id !== existing.user_id) {
    if (data.user_id) {
      const existingUser = await prisma.employee.findUnique({
        where: { user_id: data.user_id }
      });

      if (existingUser && existingUser.id !== id && !existingUser.deleted_at) {
        throw new Error(`User is already linked to another employee`);
      }
    }
  }

  const employee = await prisma.employee.update({
    where: { id },
    data: {
      ...data,
      updated_by: userId
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          role: true
        }
      }
    }
  });

  logger.info('Employee updated', {
    employeeId: employee.id,
    userId,
    name: `${employee.first_name} ${employee.last_name}`
  });

  return employee;
};

/**
 * Delete employee (soft delete)
 */
export const deleteEmployee = async (
  id: string,
  userId: string
): Promise<void> => {
  // Check if employee exists
  const existing = await prisma.employee.findUnique({
    where: { id }
  });

  if (!existing || existing.deleted_at) {
    throw new Error('Employee not found');
  }

  await prisma.employee.update({
    where: { id },
    data: {
      deleted_at: new Date(),
      updated_by: userId
    }
  });

  logger.info('Employee deleted (soft)', {
    employeeId: id,
    userId,
    name: `${existing.first_name} ${existing.last_name}`
  });
};

/**
 * Get employee classifications (for dropdown)
 */
export const getEmployeeClassifications = async (): Promise<string[]> => {
  const employees = await prisma.employee.findMany({
    where: {
      deleted_at: null,
      is_active: true
    },
    select: {
      classification: true
    },
    distinct: ['classification']
  });

  return employees.map(e => e.classification).sort();
};

/**
 * Get employment statistics
 */
export const getEmploymentStats = async () => {
  const total = await prisma.employee.count({
    where: {
      deleted_at: null,
      is_active: true
    }
  });

  const byClassification = await prisma.employee.groupBy({
    by: ['classification'],
    where: {
      deleted_at: null,
      is_active: true
    },
    _count: true
  });

  const byStatus = await prisma.employee.groupBy({
    by: ['employment_status'],
    where: {
      deleted_at: null
    },
    _count: true
  });

  return {
    total,
    byClassification,
    byStatus
  };
};

