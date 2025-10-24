/**
 * Pages Index
 * 
 * This file exports all route-level page components.
 * Pages are top-level components that correspond to routes.
 * 
 * Page structure:
 * - LoginPage
 * - DashboardPage
 * - ProjectsPage
 * - ProjectDetailPage
 * - ClientsPage
 * - ClientDetailPage
 * - DocumentsPage
 * - PhotosPage
 * - DailyLogsPage
 * - QuotesPage
 * - SettingsPage
 * - ProfilePage
 * - NotFoundPage
 * 
 * Pages should:
 * - Handle route params
 * - Fetch data (via hooks or services)
 * - Compose layout and components
 * - Handle page-level state
 * 
 * Export pattern:
 * export { LoginPage } from './LoginPage';
 * export { DashboardPage } from './DashboardPage';
 * export { ProjectsPage } from './ProjectsPage';
 */

// Pages exports
export { default as Login } from './Login';
export { default as Dashboard } from './Dashboard';
export { default as UserManagement } from './UserManagement';
export { default as Settings } from './Settings';
export { default as FileManagement } from './FileManagement';
export { default as ClientManagement } from './ClientManagement';
export { default as ClientDetail } from './ClientDetail';

// Project pages
export * from './Projects';

