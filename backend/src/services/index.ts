/**
 * Services Index
 * 
 * This file exports all business logic services.
 * Services contain reusable business logic that can be called from multiple controllers.
 * They interact with the database through Prisma and handle complex operations.
 * 
 * Service responsibilities:
 * - Business logic implementation
 * - Database operations (CRUD)
 * - Data validation and transformation
 * - Third-party API integrations
 * 
 * Export pattern:
 * export { authService } from './auth.service';
 * export { projectService } from './project.service';
 * export { fileStorageService } from './file-storage.service';
 */

// Authentication Service
export * from './auth.service';
export { default as authService } from './auth.service';

// Admin Service
export * from './admin.service';

