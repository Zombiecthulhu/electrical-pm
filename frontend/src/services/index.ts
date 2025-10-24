/**
 * Services Index
 * 
 * This file exports all API service modules.
 * Services handle HTTP requests to the backend API.
 * 
 * Service structure:
 * - api.ts           - Axios instance configuration
 * - authService.ts   - Authentication API calls
 * - userService.ts   - User management API calls
 * - projectService.ts - Project API calls
 * - clientService.ts - Client API calls
 * - fileService.ts   - File upload/download
 * - dailyLogService.ts - Daily logs API calls
 * - quoteService.ts  - Quote/bid API calls
 * 
 * Each service should provide:
 * - CRUD operations (create, read, update, delete)
 * - Search and filter functions
 * - Type-safe request/response interfaces
 * 
 * Export pattern:
 * export { api } from './api';
 * export * from './authService';
 * export * from './projectService';
 */

// Export API service
export { default as api } from './api';
export type { ApiResponse, ApiError } from './api';

// Export auth service
export { default as authService } from './auth.service';
export * from './auth.service';

// Export admin service
export { default as adminService } from './admin.service';
export * from './admin.service';

// Export project service
export { default as projectService } from './project.service';
export * from './project.service';

// Export client service
export { default as clientService } from './client.service';
export * from './client.service';

// Export file service
export { default as fileService } from './file.service';
export * from './file.service';

