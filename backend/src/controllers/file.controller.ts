/**
 * File Controller
 * 
 * Handles HTTP requests for file management operations.
 * Implements file upload, download, organization, and metadata management.
 */

import { Response } from 'express';
import { logger } from '../utils/logger';
import { ApiError, successResponse, errorResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  uploadFile,
  getFileById,
  listFiles,
  updateFile,
  deleteFile,
  permanentlyDeleteFile,
  downloadFile,
  getFileStatistics,
  type UploadFileData,
  type FileFilters
} from '../services/file.service';
import { FileCategory } from '@prisma/client';

/**
 * Upload file
 * POST /api/v1/files/upload
 */
export const uploadFileHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json(errorResponse('Unauthorized'));
      return;
    }

    // Check if file is present
    if (!req.file) {
      res.status(400).json(errorResponse('No file uploaded'));
      return;
    }

    const {
      category,
      projectId,
      dailyLogId,
      description,
      tags,
      folderPath
    } = req.body;

    // Validate category
    if (!category || !Object.values(FileCategory).includes(category)) {
      res.status(400).json(errorResponse('Invalid file category'));
      return;
    }

    const uploadData: UploadFileData = {
      buffer: req.file.buffer,
      originalFilename: req.file.originalname,
      mimeType: req.file.mimetype,
      category: category as FileCategory,
      projectId: projectId || undefined,
      dailyLogId: dailyLogId || undefined,
      description: description || undefined,
      tags: tags ? JSON.parse(tags) : undefined,
      folderPath: folderPath || undefined
    };

    const file = await uploadFile(uploadData, userId);

    res.status(201).json(successResponse(file, 'File uploaded successfully'));
  } catch (error) {
    logger.error('Upload file handler error', { error });
    if (error instanceof ApiError) {
      res.status(error.statusCode).json(errorResponse(error.message));
    } else {
      res.status(500).json(errorResponse('Failed to upload file'));
    }
  }
};

/**
 * Get file by ID
 * GET /api/v1/files/:id
 */
export const getFileByIdHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json(errorResponse('File ID is required'));
      return;
    }

    const file = await getFileById(id);

    if (!file) {
      res.status(404).json(errorResponse('File not found'));
      return;
    }

    res.json(successResponse(file));
  } catch (error) {
    logger.error('Get file by ID handler error', { error });
    res.status(500).json(errorResponse('Failed to retrieve file'));
  }
};

/**
 * List files with filtering and pagination
 * GET /api/v1/files
 */
export const listFilesHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      projectId,
      dailyLogId,
      category,
      mimeType,
      uploadedBy,
      tags,
      isFavorite,
      folderPath,
      dateFrom,
      dateTo,
      search,
      page,
      limit,
      sortBy,
      sortOrder
    } = req.query;

    const filters: FileFilters = {
      projectId: projectId as string,
      dailyLogId: dailyLogId as string,
      category: category as FileCategory,
      mimeType: mimeType as string,
      uploadedBy: uploadedBy as string,
      tags: tags ? (tags as string).split(',') : undefined,
      isFavorite: isFavorite === 'true' ? true : isFavorite === 'false' ? false : undefined,
      folderPath: folderPath as string,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
      search: search as string
    };

    const pagination = {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc'
    };

    const result = await listFiles(filters, pagination);

    res.json(successResponse(result));
  } catch (error) {
    logger.error('List files handler error', { error });
    res.status(500).json(errorResponse('Failed to retrieve files'));
  }
};

/**
 * Update file metadata
 * PUT /api/v1/files/:id
 */
export const updateFileHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json(errorResponse('File ID is required'));
      return;
    }

    const { description, tags, folderPath, isFavorite } = req.body;

    const file = await updateFile(id, {
      description,
      tags,
      folderPath,
      isFavorite
    });

    res.json(successResponse(file, 'File updated successfully'));
  } catch (error) {
    logger.error('Update file handler error', { error });
    res.status(500).json(errorResponse('Failed to update file'));
  }
};

/**
 * Delete file (soft delete)
 * DELETE /api/v1/files/:id
 */
export const deleteFileHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json(errorResponse('File ID is required'));
      return;
    }

    await deleteFile(id);

    res.json(successResponse(null, 'File deleted successfully'));
  } catch (error) {
    logger.error('Delete file handler error', { error });
    res.status(500).json(errorResponse('Failed to delete file'));
  }
};

/**
 * Permanently delete file
 * DELETE /api/v1/files/:id/permanent
 */
export const permanentDeleteFileHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json(errorResponse('File ID is required'));
      return;
    }

    await permanentlyDeleteFile(id);

    res.json(successResponse(null, 'File permanently deleted'));
  } catch (error) {
    logger.error('Permanent delete file handler error', { error });
    if (error instanceof ApiError) {
      res.status(error.statusCode).json(errorResponse(error.message));
    } else {
      res.status(500).json(errorResponse('Failed to permanently delete file'));
    }
  }
};

/**
 * Download file
 * GET /api/v1/files/:id/download
 */
export const downloadFileHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json(errorResponse('File ID is required'));
      return;
    }

    const { buffer, file } = await downloadFile(id);

    // Set headers for file download
    res.setHeader('Content-Type', file.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${file.original_filename}"`);
    res.setHeader('Content-Length', file.file_size);

    res.send(buffer);
  } catch (error) {
    logger.error('Download file handler error', { error });
    if (error instanceof ApiError) {
      res.status(error.statusCode).json(errorResponse(error.message));
    } else {
      res.status(500).json(errorResponse('Failed to download file'));
    }
  }
};

/**
 * View file (inline)
 * GET /api/v1/files/:id/view
 */
export const viewFileHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json(errorResponse('File ID is required'));
      return;
    }

    const { buffer, file } = await downloadFile(id);

    // Set headers for inline viewing
    res.setHeader('Content-Type', file.mime_type);
    res.setHeader('Content-Disposition', `inline; filename="${file.original_filename}"`);
    res.setHeader('Content-Length', file.file_size);

    res.send(buffer);
  } catch (error) {
    logger.error('View file handler error', { error });
    if (error instanceof ApiError) {
      res.status(error.statusCode).json(errorResponse(error.message));
    } else {
      res.status(500).json(errorResponse('Failed to view file'));
    }
  }
};

/**
 * Download thumbnail
 * GET /api/v1/files/:id/thumbnail
 */
export const downloadThumbnailHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json(errorResponse('File ID is required'));
      return;
    }

    const file = await getFileById(id);

    if (!file) {
      res.status(404).json(errorResponse('File not found'));
      return;
    }

    if (!file.thumbnail_path) {
      res.status(404).json(errorResponse('Thumbnail not available'));
      return;
    }

    const { getStorageService } = await import('../utils/storage.util');
    const storageService = getStorageService();
    const buffer = await storageService.download(file.thumbnail_path);

    // Set headers for thumbnail
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Disposition', `inline; filename="thumb_${file.original_filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

    res.send(buffer);
  } catch (error) {
    logger.error('Download thumbnail handler error', { error });
    res.status(500).json(errorResponse('Failed to download thumbnail'));
  }
};

/**
 * Toggle favorite status
 * PATCH /api/v1/files/:id/favorite
 */
export const toggleFavoriteHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json(errorResponse('File ID is required'));
      return;
    }

    const file = await getFileById(id);
    if (!file) {
      res.status(404).json(errorResponse('File not found'));
      return;
    }

    const updatedFile = await updateFile(id, {
      isFavorite: !file.is_favorite
    });

    res.json(successResponse(updatedFile, 'Favorite status updated'));
  } catch (error) {
    logger.error('Toggle favorite handler error', { error });
    res.status(500).json(errorResponse('Failed to update favorite status'));
  }
};

/**
 * Get file statistics
 * GET /api/v1/files/stats
 */
export const getFileStatisticsHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId, uploadedBy } = req.query;

    const filters: FileFilters = {
      projectId: projectId as string,
      uploadedBy: uploadedBy as string
    };

    const stats = await getFileStatistics(filters);

    res.json(successResponse(stats));
  } catch (error) {
    logger.error('Get file statistics handler error', { error });
    res.status(500).json(errorResponse('Failed to retrieve file statistics'));
  }
};

export default {
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
};
