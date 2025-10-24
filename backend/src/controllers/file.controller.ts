/**
 * File Controller
 * 
 * Handles HTTP requests for file upload, download, and management operations.
 * Implements secure file handling with proper validation and error handling.
 */

import { Request, Response } from 'express';
import multer from 'multer';
import { logger } from '../utils/logger';
import { ApiError, successResponse, errorResponse } from '../utils/response';
import {
  uploadFile,
  getFileById,
  getFilesByProject,
  downloadFile,
  deleteFile,
  getFileStats,
  FileUploadData,
  FileMetadata
} from '../services/file.service';
import { FileCategory } from '@prisma/client';

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10 // Max 10 files per request
  },
  fileFilter: (_req, file, cb) => {
    // Basic file type validation (detailed validation in service)
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/zip',
      'application/x-zip-compressed'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ApiError(`File type ${file.mimetype} is not allowed`, 400));
    }
  }
});

/**
 * Upload single file
 * POST /api/v1/files/upload
 */
export const uploadSingleFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const uploadHandler = upload.single('file');
    
    uploadHandler(req, res, async (err) => {
      if (err) {
        logger.error('File upload error', { error: err.message });
        res.status(400).json(errorResponse('File upload failed', 'UPLOAD_ERROR'));
        return;
      }
      
      if (!req.file) {
        res.status(400).json(errorResponse('No file provided', 'NO_FILE'));
        return;
      }
      
      const { projectId, category, description, tags } = req.body;
      const uploadedBy = req.user?.id;
      
      if (!uploadedBy) {
        res.status(401).json(errorResponse('Authentication required', 'UNAUTHORIZED'));
        return;
      }
      
      // Validate category
      let fileCategory: FileCategory;
      if (category && Object.values(FileCategory).includes(category)) {
        fileCategory = category as FileCategory;
      } else {
        fileCategory = FileCategory.OTHER;
      }
      
      // Parse tags
      let parsedTags: string[] = [];
      if (tags) {
        try {
          parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
        } catch (error) {
          logger.warn('Invalid tags format', { tags });
        }
      }
      
      const fileData: FileUploadData = {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        buffer: req.file.buffer
      };
      
      const metadata: FileMetadata = {
        projectId: projectId || undefined,
        category: fileCategory,
        description: description || undefined,
        tags: parsedTags
      };
      
      const file = await uploadFile(fileData, metadata, uploadedBy);
      
      logger.info('File uploaded successfully', {
        fileId: file.id,
        filename: file.original_filename,
        uploadedBy
      });
      
      res.status(201).json(successResponse(file, 'File uploaded successfully'));
    });
  } catch (error) {
    logger.error('File upload controller error', { error });
    res.status(500).json(errorResponse('Internal server error', 'INTERNAL_ERROR'));
  }
};

/**
 * Upload multiple files
 * POST /api/v1/files/upload-multiple
 */
export const uploadMultipleFiles = async (req: Request, res: Response): Promise<void> => {
  try {
    const uploadHandler = upload.array('files', 10);
    
    uploadHandler(req, res, async (err) => {
      if (err) {
        logger.error('Multiple file upload error', { error: err.message });
        res.status(400).json(errorResponse('File upload failed', 'UPLOAD_ERROR'));
        return;
      }
      
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        res.status(400).json(errorResponse('No files provided', 'NO_FILES'));
        return;
      }
      
      const { projectId, category, description, tags } = req.body;
      const uploadedBy = req.user?.id;
      
      if (!uploadedBy) {
        res.status(401).json(errorResponse('Authentication required', 'UNAUTHORIZED'));
        return;
      }
      
      // Validate category
      let fileCategory: FileCategory;
      if (category && Object.values(FileCategory).includes(category)) {
        fileCategory = category as FileCategory;
      } else {
        fileCategory = FileCategory.OTHER;
      }
      
      // Parse tags
      let parsedTags: string[] = [];
      if (tags) {
        try {
          parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
        } catch (error) {
          logger.warn('Invalid tags format', { tags });
        }
      }
      
      const uploadPromises = files.map(file => {
        const fileData: FileUploadData = {
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          buffer: file.buffer
        };
        
        const metadata: FileMetadata = {
          projectId: projectId || undefined,
          category: fileCategory,
          description: description || undefined,
          tags: parsedTags
        };
        
        return uploadFile(fileData, metadata, uploadedBy);
      });
      
      const uploadedFiles = await Promise.all(uploadPromises);
      
      logger.info('Multiple files uploaded successfully', {
        count: uploadedFiles.length,
        uploadedBy
      });
      
      res.status(201).json(successResponse(uploadedFiles, 'Files uploaded successfully'));
    });
  } catch (error) {
    logger.error('Multiple file upload controller error', { error });
    res.status(500).json(errorResponse('Internal server error', 'INTERNAL_ERROR'));
  }
};

/**
 * Get file by ID
 * GET /api/v1/files/:id
 */
export const getFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!id) {
      res.status(400).json(errorResponse('File ID is required', 'MISSING_FILE_ID'));
      return;
    }
    
    const file = await getFileById(id);
    if (!file) {
      res.status(404).json(errorResponse('File not found', 'FILE_NOT_FOUND'));
      return;
    }
    
    res.json(successResponse(file));
  } catch (error) {
    logger.error('Get file error', { fileId: req.params.id, error });
    res.status(500).json(errorResponse('Failed to retrieve file', 'INTERNAL_ERROR'));
  }
};

/**
 * Get files by project
 * GET /api/v1/files/project/:projectId
 */
export const getProjectFiles = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { category, page = '1', limit = '20' } = req.query;
    
    if (!projectId) {
      res.status(400).json(errorResponse('Project ID is required', 'MISSING_PROJECT_ID'));
      return;
    }
    
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    
    if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
      res.status(400).json(errorResponse('Invalid pagination parameters', 'INVALID_PAGINATION'));
      return;
    }
    
    const result = await getFilesByProject(
      projectId,
      category as FileCategory,
      pageNum,
      limitNum
    );
    
    res.json(successResponse(result, 'Project files retrieved successfully'));
  } catch (error) {
    logger.error('Get project files error', { projectId: req.params.projectId, error });
    res.status(500).json(errorResponse('Failed to retrieve project files', 'INTERNAL_ERROR'));
  }
};

/**
 * Download file
 * GET /api/v1/files/:id/download
 */
export const downloadFileById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!id) {
      res.status(400).json(errorResponse('File ID is required', 'MISSING_FILE_ID'));
      return;
    }
    
    const { file, buffer } = await downloadFile(id);
    
    // Set appropriate headers
    res.setHeader('Content-Type', file.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${file.original_filename}"`);
    res.setHeader('Content-Length', file.file_size.toString());
    
    res.send(buffer);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json(errorResponse(error.message, error.code));
      return;
    }
    
    logger.error('Download file error', { fileId: req.params.id, error });
    res.status(500).json(errorResponse('Failed to download file', 'INTERNAL_ERROR'));
  }
};

/**
 * Get file preview/thumbnail
 * GET /api/v1/files/:id/preview
 */
export const getFilePreview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { type: _type = 'preview' } = req.query;
    
    if (!id) {
      res.status(400).json(errorResponse('File ID is required', 'MISSING_FILE_ID'));
      return;
    }
    
    const file = await getFileById(id);
    if (!file) {
      res.status(404).json(errorResponse('File not found', 'FILE_NOT_FOUND'));
      return;
    }
    
    // For now, return the original file
    // In a full implementation, you'd return thumbnail/preview based on type
    const { buffer } = await downloadFile(id);
    
    res.setHeader('Content-Type', file.mime_type);
    res.setHeader('Content-Length', file.file_size.toString());
    res.send(buffer);
  } catch (error) {
    logger.error('Get file preview error', { fileId: req.params.id, error });
    res.status(500).json(errorResponse('Failed to get file preview', 'INTERNAL_ERROR'));
  }
};

/**
 * Delete file
 * DELETE /api/v1/files/:id
 */
export const deleteFileById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deletedBy = req.user?.id;
    
    if (!id) {
      res.status(400).json(errorResponse('File ID is required', 'MISSING_FILE_ID'));
      return;
    }
    
    if (!deletedBy) {
      res.status(401).json(errorResponse('Authentication required', 'UNAUTHORIZED'));
      return;
    }
    
    await deleteFile(id, deletedBy);
    
    logger.info('File deleted successfully', { fileId: id, deletedBy });
    res.json(successResponse(null, 'File deleted successfully'));
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json(errorResponse(error.message, error.code));
      return;
    }
    
    logger.error('Delete file error', { fileId: req.params.id, error });
    res.status(500).json(errorResponse('Failed to delete file', 'INTERNAL_ERROR'));
  }
};

/**
 * Get file statistics
 * GET /api/v1/files/stats
 */
export const getFileStatistics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.query;
    
    const stats = await getFileStats(projectId as string);
    
    res.json(successResponse(stats, 'File statistics retrieved successfully'));
  } catch (error) {
    logger.error('Get file stats error', { error });
    res.status(500).json(errorResponse('Failed to retrieve file statistics', 'INTERNAL_ERROR'));
  }
};

/**
 * Search files
 * GET /api/v1/files/search
 */
export const searchFiles = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, category, projectId, page = '1', limit = '20' } = req.query;
    
    // This is a basic implementation - you'd want to implement full-text search
    // For now, just return project files with optional filtering
    if (!projectId) {
      res.status(400).json(errorResponse('Project ID is required for search', 'MISSING_PROJECT_ID'));
      return;
    }
    
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    
    const result = await getFilesByProject(
      projectId as string,
      category as FileCategory,
      pageNum,
      limitNum
    );
    
    // Basic filtering by search query
    let filteredFiles = result.files;
    if (q) {
      const searchTerm = (q as string).toLowerCase();
      filteredFiles = result.files.filter(file => 
        file.original_filename.toLowerCase().includes(searchTerm) ||
        file.description?.toLowerCase().includes(searchTerm) ||
        file.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }
    
    res.json(successResponse({
      files: filteredFiles,
      total: filteredFiles.length
    }, 'Files search completed'));
  } catch (error) {
    logger.error('Search files error', { error });
    res.status(500).json(errorResponse('Failed to search files', 'INTERNAL_ERROR'));
  }
};

export { upload };
