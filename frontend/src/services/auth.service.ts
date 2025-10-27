/**
 * Authentication Service
 * 
 * Handles all authentication-related API calls:
 * - User login/logout
 * - User registration
 * - Current user information
 * - Token refresh
 */

import api from './api';
import { ApiResponse } from './api';

// Types for authentication
export interface User {
  id: string;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  message: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user?: User;
    accessToken?: string;
    message?: string;
  };
  message?: string;
  error?: {
    code: string;
    message: string;
    field?: string;
  };
}

/**
 * Login user with email and password
 * 
 * @param credentials - User login credentials
 * @returns Promise with user data and access token
 */
export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    const response: ApiResponse = await api.post('/auth/login', credentials);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Login failed');
    }

    return {
      user: response.data.user,
      accessToken: response.data.accessToken,
      message: response.data.message || 'Login successful',
    };
  } catch (error: any) {
    throw new Error(error.error?.message || error.message || 'Login failed');
  }
};

/**
 * Logout current user
 * 
 * @returns Promise with logout confirmation
 */
export const logout = async (): Promise<{ message: string }> => {
  try {
    const response: ApiResponse = await api.post('/auth/logout');
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Logout failed');
    }

    return {
      message: response.message || 'Logout successful',
    };
  } catch (error: any) {
    throw new Error(error.error?.message || error.message || 'Logout failed');
  }
};

/**
 * Get current user information
 * 
 * @returns Promise with current user data
 */
export const getCurrentUser = async (): Promise<User> => {
  try {
    const response: ApiResponse = await api.get('/auth/me');
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get user information');
    }

    return response.data.user;
  } catch (error: any) {
    throw new Error(error.error?.message || error.message || 'Failed to get user information');
  }
};

/**
 * Register new user
 * 
 * @param userData - User registration data
 * @returns Promise with user data and access token
 */
export const register = async (userData: RegisterData): Promise<LoginResponse> => {
  try {
    const response: ApiResponse = await api.post('/auth/register', userData);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Registration failed');
    }

    return {
      user: response.data.user,
      accessToken: response.data.accessToken,
      message: response.data.message || 'Registration successful',
    };
  } catch (error: any) {
    throw new Error(error.error?.message || error.message || 'Registration failed');
  }
};

/**
 * Refresh access token
 * 
 * @returns Promise with new access token
 */
export const refreshToken = async (): Promise<{ accessToken: string; message: string }> => {
  try {
    const response: ApiResponse = await api.post('/auth/refresh');
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Token refresh failed');
    }

    return {
      accessToken: response.data.accessToken,
      message: response.data.message || 'Token refreshed successfully',
    };
  } catch (error: any) {
    throw new Error(error.error?.message || error.message || 'Token refresh failed');
  }
};

/**
 * Change user password
 * 
 * @param passwordData - Current and new password
 * @returns Promise with success message
 */
export const changePassword = async (passwordData: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ message: string }> => {
  try {
    const response: ApiResponse = await api.put('/auth/password', passwordData);
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Password change failed');
    }

    return {
      message: response.message || 'Password changed successfully',
    };
  } catch (error: any) {
    throw new Error(error.error?.message || error.message || 'Password change failed');
  }
};

// Export all functions as a service object
export const authService = {
  login,
  logout,
  getCurrentUser,
  register,
  refreshToken,
  changePassword,
};

export default authService;
