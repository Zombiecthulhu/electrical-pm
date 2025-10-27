import { Router } from 'express';
import {
  getProjects,
  getProject,
  createProjectController,
  updateProjectController,
  deleteProjectController,
  assignProjectMember,
  removeProjectMember,
  getProjectMembersController
} from '../controllers/project.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/authorization.middleware';
import { logger } from '../utils/logger';

const router = Router();

// Apply authentication to all project routes
router.use(authenticate);

// Log all project route access
router.use((req, _res, next) => {
  logger.info('Project route accessed', {
    method: req.method,
    path: req.path,
    userId: req.user?.id,
    userRole: req.user?.role
  });
  next();
});

/**
 * GET /api/v1/projects
 * List all projects with optional filters and pagination
 * Access: Authenticated users
 */
router.get('/', getProjects);

/**
 * GET /api/v1/projects/:id
 * Get single project by ID with all relations
 * Access: Authenticated users
 */
router.get('/:id', getProject);

/**
 * POST /api/v1/projects
 * Create new project
 * Access: Authenticated users with PROJECT_MANAGER role or higher
 */
router.post(
  '/',
  authorizeRoles(['PROJECT_MANAGER', 'SUPER_ADMIN']),
  createProjectController
);

/**
 * PUT /api/v1/projects/:id
 * Update project
 * Access: Authenticated users with PROJECT_MANAGER role or higher
 */
router.put(
  '/:id',
  authorizeRoles(['PROJECT_MANAGER', 'SUPER_ADMIN']),
  updateProjectController
);

/**
 * DELETE /api/v1/projects/:id
 * Delete project (soft delete)
 * Access: Authenticated users with PROJECT_MANAGER role or higher
 */
router.delete(
  '/:id',
  authorizeRoles(['PROJECT_MANAGER', 'SUPER_ADMIN']),
  deleteProjectController
);

/**
 * POST /api/v1/projects/:id/members
 * Assign member to project
 * Access: Authenticated users with PROJECT_MANAGER role or higher
 */
router.post(
  '/:id/members',
  authorizeRoles(['PROJECT_MANAGER', 'SUPER_ADMIN']),
  assignProjectMember
);

/**
 * DELETE /api/v1/projects/:id/members/:userId
 * Remove member from project
 * Access: Authenticated users with PROJECT_MANAGER role or higher
 */
router.delete(
  '/:id/members/:userId',
  authorizeRoles(['PROJECT_MANAGER', 'SUPER_ADMIN']),
  removeProjectMember
);

/**
 * GET /api/v1/projects/:id/members
 * Get project members
 * Access: Authenticated users
 */
router.get('/:id/members', getProjectMembersController);

export default router;
