/**
 * Admin Service
 * Handles admin-only operations like user management
 */

import api from './api';

// Types for admin operations
export interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
}

export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: string;
  isActive?: boolean;
}

export interface UsersResponse {
  success: boolean;
  data: {
    users: AdminUser[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface UserResponse {
  success: boolean;
  data: AdminUser;
}

export interface ResetPasswordRequest {
  newPassword: string;
}

// Admin service functions
export const adminService = {
  // Get all users with pagination
  getAllUsers: async (page: number = 1, limit: number = 20): Promise<UsersResponse> => {
    const response = await api.get(`/admin/users?page=${page}&limit=${limit}`);
    return response as unknown as UsersResponse;
  },

  // Get user by ID
  getUserById: async (userId: string): Promise<UserResponse> => {
    const response = await api.get(`/admin/users/${userId}`);
    return response as unknown as UserResponse;
  },

  // Create new user
  createUser: async (userData: CreateUserRequest): Promise<UserResponse> => {
    const response = await api.post('/admin/users', userData);
    return response as unknown as UserResponse;
  },

  // Update user
  updateUser: async (userId: string, userData: UpdateUserRequest): Promise<UserResponse> => {
    const response = await api.put(`/admin/users/${userId}`, userData);
    return response as unknown as UserResponse;
  },

  // Delete user (soft delete)
  deleteUser: async (userId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response as unknown as { success: boolean; message: string };
  },

  // Reset user password
  resetUserPassword: async (userId: string, passwordData: ResetPasswordRequest): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/admin/users/${userId}/reset-password`, passwordData);
    return response as unknown as { success: boolean; message: string };
  }
};

export default adminService;
