/**
 * Middleware Index
 * 
 * This file exports all middleware functions.
 * Middleware functions process requests before they reach controllers.
 * 
 * Common middleware types:
 * - Authentication (verify JWT tokens)
 * - Authorization (check user permissions)
 * - Validation (validate request data)
 * - Error handling (catch and format errors)
 * - Rate limiting (prevent abuse)
 * - Logging (request/response logging)
 * 
 * Export pattern:
 * export { authenticate } from './authenticate';
 * export { authorize } from './authorize';
 * export { validateRequest } from './validate-request';
 */

// Export existing middleware
export { errorHandler, AppError } from './error-handler';

// Additional middleware will be exported here as they are created

