/**
 * File Routes
 * 
 * Defines API endpoints for file upload, download, and management operations.
 * All routes require authentication and appropriate authorization.
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorization.middleware';
import {
  uploadSingleFile,
  uploadMultipleFiles,
  getFile,
  getProjectFiles,
  downloadFileById,
  getFilePreview,
  deleteFileById,
  getFileStatistics,
  searchFiles
} from '../controllers/file.controller';

const router = Router();

// All file routes require authentication
router.use(authenticate);

/**
 * File Upload Routes
 * POST /api/v1/files/upload - Upload single file
 * POST /api/v1/files/upload-multiple - Upload multiple files
 */
router.post('/upload', authorize('files', 'create'), uploadSingleFile);
router.post('/upload-multiple', authorize('files', 'create'), uploadMultipleFiles);

/**
 * File Retrieval Routes
 * GET /api/v1/files/:id - Get file metadata
 * GET /api/v1/files/project/:projectId - Get files by project
 * GET /api/v1/files/stats - Get file statistics
 * GET /api/v1/files/search - Search files
 */
router.get('/:id', authorize('files', 'read'), getFile);
router.get('/project/:projectId', authorize('files', 'read'), getProjectFiles);
router.get('/stats', authorize('files', 'read'), getFileStatistics);
router.get('/search', authorize('files', 'read'), searchFiles);

/**
 * File Download Routes
 * GET /api/v1/files/:id/download - Download file
 * GET /api/v1/files/:id/preview - Get file preview/thumbnail
 */
router.get('/:id/download', authorize('files', 'read'), downloadFileById);
router.get('/:id/preview', authorize('files', 'read'), getFilePreview);

/**
 * File Management Routes
 * DELETE /api/v1/files/:id - Delete file (soft delete)
 */
router.delete('/:id', authorize('files', 'delete'), deleteFileById);

export default router;
