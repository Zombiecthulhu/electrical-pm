/**
 * Module Components Index
 * 
 * This file exports module-specific components.
 * Each module has its own subdirectory with related components.
 * 
 * Module structure:
 * /modules
 *   /Hub          - Dashboard and module launcher
 *   /Projects     - Project management components
 *   /Clients      - Client management components
 *   /Documents    - Document management components
 *   /Photos       - Photo management components
 *   /DailyLogs    - Daily logs components
 *   /Quotes       - Quote/bid management components
 *   /Users        - User management components
 * 
 * Each module should contain:
 * - List view components (tables, cards)
 * - Detail view components
 * - Form components (create/edit)
 * - Module-specific components
 * 
 * Export pattern:
 * export * from './Hub';
 * export * from './Projects';
 * export * from './Clients';
 */

// Module components will be exported here as they are created

// File management module
export { default as FileManager } from './FileManager';

// Client management module
export { default as ClientList } from './ClientList';
export { default as ClientForm } from './ClientForm';
export { default as ClientContactForm } from './ClientContactForm';

// Daily log management module
export { default as DailyLogList } from './DailyLogList';
export { default as DailyLogForm } from './DailyLogForm';
export { default as DailyLogDetail } from './DailyLogDetail';

// Quote management module
export { default as QuoteList } from './QuoteList';
export { default as QuoteForm } from './QuoteForm';
export { default as QuoteDetail } from './QuoteDetail';

