/**
 * Config Index
 * 
 * This file exports configuration modules.
 * Configuration includes database connections, environment variables, and app settings.
 * 
 * Config modules:
 * - Database connection (Prisma)
 * - Environment variables
 * - JWT configuration
 * - File storage configuration
 * - API configuration
 * 
 * Export pattern:
 * export { default as prisma } from './database';
 * export { config } from './env';
 * export { jwtConfig } from './jwt';
 */

// Export existing config
export { default as prisma, connectDatabase, disconnectDatabase } from './database';

// Additional config modules will be exported here as they are created

