/**
 * Standardized API Response Helpers
 * 
 * Provides consistent response formatting across all API endpoints.
 */

import { Response } from 'express';

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode: number = 400, code: string = 'API_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Success response format
 */
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Error response format
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    field?: string;
  };
}

/**
 * Paginated response format
 */
export interface PaginatedResponse<T = any> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Send success response
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): Response => {
  const response: SuccessResponse<T> = {
    success: true,
    data,
  };

  if (message) {
    response.message = message;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send error response
 */
export const sendError = (
  res: Response,
  code: string,
  message: string,
  statusCode: number = 400,
  field?: string
): Response => {
  const response: ErrorResponse = {
    success: false,
    error: {
      code,
      message,
    },
  };

  if (field) {
    response.error.field = field;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send paginated response
 */
export const sendPaginated = <T>(
  res: Response,
  data: T[],
  page: number,
  pageSize: number,
  total: number
): Response => {
  const response: PaginatedResponse<T> = {
    success: true,
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };

  return res.status(200).json(response);
};

/**
 * Send created response (201)
 */
export const sendCreated = <T>(
  res: Response,
  data: T,
  message: string = 'Resource created successfully'
): Response => {
  return sendSuccess(res, data, message, 201);
};

/**
 * Send no content response (204)
 */
export const sendNoContent = (res: Response): Response => {
  return res.status(204).send();
};

/**
 * Send success response with custom format
 */
export const successResponse = <T>(
  data: T,
  message?: string
): SuccessResponse<T> => {
  const response: SuccessResponse<T> = {
    success: true,
    data,
  };

  if (message) {
    response.message = message;
  }

  return response;
};

/**
 * Send error response with custom format
 */
export const errorResponse = (
  message: string,
  code: string = 'ERROR'
): ErrorResponse => {
  return {
    success: false,
    error: {
      code,
      message,
    },
  };
};

