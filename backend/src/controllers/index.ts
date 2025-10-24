/**
 * Controllers Index
 * 
 * This file exports all controllers for the application.
 * Controllers handle HTTP requests and responses, coordinating between routes and services.
 * 
 * Export pattern:
 * export { authController } from './auth.controller';
 * export { projectController } from './project.controller';
 */

// Authentication Controller
export * from './auth.controller';
export { default as authController } from './auth.controller';

// Admin Controller
export * from './admin.controller';

// Project Controller
export * from './project.controller';

// Client Controller
export * from './client.controller';

