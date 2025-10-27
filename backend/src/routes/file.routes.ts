/**
 * File Routes
 * 
 * Defines API endpoints for file management operations.
 * All routes require authentication and appropriate authorization.
 */

import { Router } from 'express';
import multer from 'multer';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';
import {
  uploadFileHandler,
  getFileByIdHandler,
  listFilesHandler,
  updateFileHandler,
  deleteFileHandler,
  permanentDeleteFileHandler,
  downloadFileHandler,
  viewFileHandler,
  downloadThumbnailHandler,
  toggleFavoriteHandler,
  getFileStatisticsHandler
} from '../controllers/file.controller';

const router = Router();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800') // 50MB default
  }
});

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route   POST /api/v1/files/upload
 * @desc    Upload a file
 * @access  Private (Authenticated users)
 */
router.post('/upload', upload.single('file'), uploadFileHandler);

/**
 * @route   GET /api/v1/files/stats
 * @desc    Get file statistics
 * @access  Private (Authenticated users)
 */
router.get('/stats', getFileStatisticsHandler);

/**
 * @route   GET /api/v1/files
 * @desc    List files with filtering and pagination
 * @access  Private (Authenticated users)
 */
router.get('/', listFilesHandler);

/**
 * @route   GET /api/v1/files/:id
 * @desc    Get file by ID
 * @access  Private (Authenticated users)
 */
router.get('/:id', getFileByIdHandler);

/**
 * @route   PUT /api/v1/files/:id
 * @desc    Update file metadata
 * @access  Private (Authenticated users)
 */
router.put('/:id', updateFileHandler);

/**
 * @route   DELETE /api/v1/files/:id
 * @desc    Soft delete file
 * @access  Private (Authenticated users)
 */
router.delete('/:id', deleteFileHandler);

/**
 * @route   DELETE /api/v1/files/:id/permanent
 * @desc    Permanently delete file
 * @access  Private (SUPER_ADMIN only)
 */
router.delete('/:id/permanent', authorizeRoles(['SUPER_ADMIN']), permanentDeleteFileHandler);

/**
 * @route   GET /api/v1/files/:id/download
 * @desc    Download file
 * @access  Private (Authenticated users)
 */
router.get('/:id/download', downloadFileHandler);

/**
 * @route   GET /api/v1/files/:id/view
 * @desc    View file inline (for images, PDFs)
 * @access  Private (Authenticated users)
 */
router.get('/:id/view', viewFileHandler);

/**
 * @route   GET /api/v1/files/:id/thumbnail
 * @desc    Download thumbnail
 * @access  Private (Authenticated users)
 */
router.get('/:id/thumbnail', downloadThumbnailHandler);

/**
 * @route   PATCH /api/v1/files/:id/favorite
 * @desc    Toggle favorite status
 * @access  Private (Authenticated users)
 */
router.patch('/:id/favorite', toggleFavoriteHandler);

export default router;
