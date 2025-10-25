/**
 * Utils Index
 * 
 * This file exports utility functions and helpers.
 * Utilities are pure functions that don't contain business logic.
 * 
 * Utility categories:
 * - formatters.ts    - Date, currency, number formatting
 * - validators.ts    - Input validation functions
 * - constants.ts     - Application constants
 * - helpers.ts       - General helper functions
 * - api-helpers.ts   - API request helpers
 * - storage.ts       - LocalStorage/SessionStorage helpers
 * 
 * Utility guidelines:
 * - Keep functions pure (no side effects)
 * - Make functions reusable
 * - Add TypeScript types
 * - Write JSDoc comments
 * - Keep functions small and focused
 * 
 * Export pattern:
 * export * from './formatters';
 * export * from './validators';
 * export * from './constants';
 */

// Export logger utility
export { logger } from './logger';

// Mobile UI utilities
export * from './mobile';

// Validation utilities
export * from './validation';

// Formatting utilities
export * from './formatters';

// Token utilities
export * from './token';

// Utilities will be exported here as they are created
// export * from './constants';

