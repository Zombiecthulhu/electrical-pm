/**
 * API Service
 * 
 * Configured axios instance for making HTTP requests to the backend API.
 * Includes request/response interceptors for authentication and error handling.
 */

import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { logger } from '../utils/logger';

// Create configured axios instance
const api: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true, // Enable HTTP-only cookies for refresh tokens
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - runs before each request
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add timestamp to prevent caching
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }

    // Add authorization header if token exists in localStorage
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request (in development)
    if (process.env.NODE_ENV === 'development') {
      logger.info(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        baseURL: config.baseURL,
        params: config.params,
        data: config.data,
        hasAuth: !!token,
      });
    }

    return config;
  },
  (error: AxiosError) => {
    logger.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - runs after each response
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful response (in development)
    if (process.env.NODE_ENV === 'development') {
      logger.info(`API Response: ${response.status} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      });
    }

    // Return the response data directly (remove axios wrapper)
    return response.data;
  },
  (error: AxiosError) => {
    // Handle different types of errors
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      logger.error(`API Error: ${status} ${error.config?.url}`, {
        status,
        data,
        url: error.config?.url,
      });

      // Handle specific error cases
      switch (status) {
        case 401:
          // Unauthorized - token expired or invalid
          logger.warn('Authentication required or token expired');
          
          // Auto-logout and redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          
          // Only redirect if not already on login page
          if (window.location.pathname !== '/login') {
            logger.info('Redirecting to login page due to expired session');
            window.location.href = '/login?session=expired';
          }
          break;
        case 403:
          // Forbidden - insufficient permissions
          logger.warn('Insufficient permissions');
          break;
        case 404:
          // Not found
          logger.warn('Resource not found');
          break;
        case 422:
          // Validation error
          logger.warn('Validation error', data);
          break;
        case 429:
          // Rate limited
          logger.warn('Rate limited - too many requests');
          break;
        case 500:
          // Server error
          logger.error('Server error');
          break;
        default:
          logger.error(`Unexpected error: ${status}`);
      }

      // Type-safe error response handling
      const errorData = data as any;
      const errorResponse = {
        success: false,
        error: {
          code: errorData?.error?.code || 'API_ERROR',
          message: errorData?.error?.message || error.message,
          status,
          field: errorData?.error?.field,
        },
        data: null,
      };

      return Promise.reject(errorResponse);
    } else if (error.request) {
      // Network error - no response received
      logger.error('Network error - no response received', {
        url: error.config?.url,
        message: error.message,
      });

      return Promise.reject({
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Unable to connect to server. Please check your internet connection.',
          status: 0,
        },
        data: null,
      });
    } else {
      // Request setup error
      logger.error('Request setup error:', error.message);

      return Promise.reject({
        success: false,
        error: {
          code: 'REQUEST_ERROR',
          message: error.message,
          status: 0,
        },
        data: null,
      });
    }
  }
);

// Export the configured axios instance
export default api;

// Export types for use in other files
export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    status: number;
    field?: string;
  };
};

export type ApiError = {
  success: false;
  error: {
    code: string;
    message: string;
    status: number;
    field?: string;
  };
  data: null;
};
