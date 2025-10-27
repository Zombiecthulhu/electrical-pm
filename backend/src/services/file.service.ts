/**
 * File Service
 * 
 * Business logic for file management including upload, download, organization,
 * and metadata management for photos and documents.
 */

import prisma from '../config/database';
import { File, FileCategory, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/response';
import {
  getStorageService,
  calculateChecksum,
  validateFileSize,
  validateFileType,
  getAllowedMimeTypes,
  getThumbnailPath,
  type FileMetadata
} from '../utils/storage.util';
import {
  processImage,
  isImage,
  type ImageProcessResult
} from '../utils/image-processing.util';

/**
 * File upload data
 */
export interface UploadFileData {
  buffer: Buffer;
  originalFilename: string;
  mimeType: string;
  category: FileCategory;
  projectId?: string;
  dailyLogId?: string;
  description?: string;
  tags?: string[];
  folderPath?: string;
}

/**
 * File with relations
 */
export type FileWithRelations = File & {
  project?: {
    id: string;
    name: string;
    project_number: string;
  };
  daily_log?: {
    id: string;
    date: Date;
  };
  uploader: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
};

/**
 * File filters
 */
export interface FileFilters {
  projectId?: string;
  dailyLogId?: string;
  category?: FileCategory;
  mimeType?: string;
  uploadedBy?: string;
  tags?: string[];
  isFavorite?: boolean;
  folderPath?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

/**
 * Pagination options
 */
export interface FilePaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * File list response
 */
export interface FileListResponse {
  files: FileWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * File statistics
 */
export interface FileStatistics {
  totalFiles: number;
  totalSize: number;
  filesByCategory: Record<string, number>;
  filesByProject: Array<{ projectId: string; projectName: string; count: number }>;
  recentUploads: number;
}

/**
 * Upload file with processing
 */
export const uploadFile = async (
  data: UploadFileData,
  uploadedBy: string
): Promise<FileWithRelations> => {
  try {
    const { buffer, originalFilename, mimeType, category } = data;

    // Validate file size
    if (!validateFileSize(buffer.length)) {
      throw new ApiError('File size exceeds maximum allowed size', 400);
    }

    // Validate file type
    const allowedTypes = getAllowedMimeTypes(category);
    if (!validateFileType(mimeType, allowedTypes)) {
      throw new ApiError(
        `File type ${mimeType} is not allowed for category ${category}`,
        400
      );
    }

    // Calculate checksum
    const checksum = calculateChecksum(buffer);

    // Check for duplicate files (same checksum)
    const existingFile = await prisma.file.findFirst({
      where: {
        checksum,
        deleted_at: null,
        project_id: data.projectId || null
      }
    });

    if (existingFile) {
      logger.warn('Duplicate file detected', { checksum, existingFileId: existingFile.id });
      throw new ApiError('This file already exists in the system', 409);
    }

    // Storage metadata
    const storageMetadata: FileMetadata = {
      originalFilename,
      mimeType,
      category,
      projectId: data.projectId,
      dailyLogId: data.dailyLogId,
      date: new Date()
    };

    // Upload to storage
    const storageService = getStorageService();
    const storagePath = await storageService.upload(buffer, storageMetadata);

    // Process image if it's a photo
    let imageData: ImageProcessResult | null = null;
    let thumbnailPath: string | undefined;

    if (isImage(mimeType) && category === FileCategory.PHOTO) {
      try {
        imageData = await processImage(buffer);
        
        // Save thumbnail
        if (imageData.thumbnail) {
          thumbnailPath = getThumbnailPath(storagePath);
          await storageService.upload(imageData.thumbnail, {
            ...storageMetadata,
            originalFilename: `thumb_${originalFilename}`
          });
        }
      } catch (imageError) {
        logger.warn('Image processing failed, continuing without thumbnail', { 
          error: imageError,
          filename: originalFilename 
        });
      }
    }

    // Create file record
    const file = await prisma.file.create({
      data: {
        storage_path: storagePath,
        original_filename: originalFilename,
        mime_type: mimeType,
        file_size: buffer.length,
        checksum,
        category,
        project_id: data.projectId,
        daily_log_id: data.dailyLogId,
        uploaded_by: uploadedBy,
        description: data.description,
        tags: data.tags || [],
        folder_path: data.folderPath,
        thumbnail_path: thumbnailPath,
        width: imageData?.dimensions.width,
        height: imageData?.dimensions.height,
        exif_data: imageData?.exifData as any
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            project_number: true
          }
        },
        daily_log: {
          select: {
            id: true,
            date: true
          }
        },
        uploader: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        }
      }
    });

    logger.info('File uploaded successfully', {
      fileId: file.id,
      filename: originalFilename,
      size: buffer.length,
      category,
      projectId: data.projectId,
      uploadedBy
    });

    return file as FileWithRelations;
  } catch (error) {
    logger.error('Failed to upload file', { error, originalFilename: data.originalFilename });
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('File upload failed', 500);
  }
};

/**
 * Get file by ID
 */
export const getFileById = async (fileId: string): Promise<FileWithRelations | null> => {
  try {
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        deleted_at: null
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            project_number: true
          }
        },
        daily_log: {
          select: {
            id: true,
            date: true
          }
        },
        uploader: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        }
      }
    });

    return file as FileWithRelations | null;
  } catch (error) {
    logger.error('Failed to get file', { error, fileId });
    throw new ApiError('Failed to retrieve file', 500);
  }
};

/**
 * List files with filtering and pagination
 */
export const listFiles = async (
  filters: FileFilters = {},
  pagination: FilePaginationOptions = {}
): Promise<FileListResponse> => {
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
      search
    } = filters;

    const { page = 1, limit = 20, sortBy = 'uploaded_at', sortOrder = 'desc' } = pagination;
    const actualPage = Math.max(1, page);
    const skip = (actualPage - 1) * limit;

    // Build where clause
    const where: Prisma.FileWhereInput = {
      deleted_at: null
    };

    if (projectId) where.project_id = projectId;
    if (dailyLogId) where.daily_log_id = dailyLogId;
    if (category) where.category = category;
    if (mimeType) where.mime_type = { contains: mimeType };
    if (uploadedBy) where.uploaded_by = uploadedBy;
    if (isFavorite !== undefined) where.is_favorite = isFavorite;
    if (folderPath) where.folder_path = folderPath;

    if (tags && tags.length > 0) {
      where.tags = {
        hasEvery: tags
      };
    }

    if (dateFrom || dateTo) {
      where.uploaded_at = {};
      if (dateFrom) where.uploaded_at.gte = dateFrom;
      if (dateTo) where.uploaded_at.lte = dateTo;
    }

    if (search) {
      where.OR = [
        { original_filename: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } }
      ];
    }

    // Get total count
    const total = await prisma.file.count({ where });

    // Get files
    const files = await prisma.file.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            project_number: true
          }
        },
        daily_log: {
          select: {
            id: true,
            date: true
          }
        },
        uploader: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder }
    });

    const totalPages = Math.ceil(total / limit);

    logger.info('Files retrieved', { count: files.length, total, page: actualPage, limit });

    return {
      files: files as FileWithRelations[],
      pagination: {
        page: actualPage,
        limit,
        total,
        totalPages
      }
    };
  } catch (error) {
    logger.error('Failed to list files', { error, filters });
    throw new ApiError('Failed to retrieve files', 500);
  }
};

/**
 * Update file metadata
 */
export const updateFile = async (
  fileId: string,
  data: {
    description?: string;
    tags?: string[];
    folderPath?: string;
    isFavorite?: boolean;
  }
): Promise<FileWithRelations> => {
  try {
    const file = await prisma.file.update({
      where: { id: fileId },
      data,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            project_number: true
          }
        },
        daily_log: {
          select: {
            id: true,
            date: true
          }
        },
        uploader: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        }
      }
    });

    logger.info('File updated', { fileId, data });
    return file as FileWithRelations;
  } catch (error) {
    logger.error('Failed to update file', { error, fileId });
    throw new ApiError('Failed to update file', 500);
  }
};

/**
 * Delete file (soft delete)
 */
export const deleteFile = async (fileId: string): Promise<void> => {
  try {
    await prisma.file.update({
      where: { id: fileId },
      data: { deleted_at: new Date() }
    });

    logger.info('File soft deleted', { fileId });
  } catch (error) {
    logger.error('Failed to delete file', { error, fileId });
    throw new ApiError('Failed to delete file', 500);
  }
};

/**
 * Permanently delete file
 */
export const permanentlyDeleteFile = async (fileId: string): Promise<void> => {
  try {
    const file = await prisma.file.findUnique({
      where: { id: fileId }
    });

    if (!file) {
      throw new ApiError('File not found', 404);
    }

    // Delete from storage
    const storageService = getStorageService();
    await storageService.delete(file.storage_path);

    // Delete thumbnail if exists
    if (file.thumbnail_path) {
      try {
        await storageService.delete(file.thumbnail_path);
      } catch (thumbError) {
        logger.warn('Failed to delete thumbnail', { thumbError, fileId });
      }
    }

    // Delete from database
    await prisma.file.delete({
      where: { id: fileId }
    });

    logger.info('File permanently deleted', { fileId });
  } catch (error) {
    logger.error('Failed to permanently delete file', { error, fileId });
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to permanently delete file', 500);
  }
};

/**
 * Download file
 */
export const downloadFile = async (fileId: string): Promise<{ buffer: Buffer; file: File }> => {
  try {
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        deleted_at: null
      }
    });

    if (!file) {
      throw new ApiError('File not found', 404);
    }

    const storageService = getStorageService();
    const buffer = await storageService.download(file.storage_path);

    logger.info('File downloaded', { fileId, filename: file.original_filename });
    return { buffer, file };
  } catch (error) {
    logger.error('Failed to download file', { error, fileId });
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to download file', 500);
  }
};

/**
 * Get file statistics
 */
export const getFileStatistics = async (filters: FileFilters = {}): Promise<FileStatistics> => {
  try {
    const where: Prisma.FileWhereInput = {
      deleted_at: null
    };

    if (filters.projectId) where.project_id = filters.projectId;
    if (filters.uploadedBy) where.uploaded_by = filters.uploadedBy;

    const [totalFiles, totalSizeResult, filesByCategory, filesByProject, recentUploads] = await Promise.all([
      prisma.file.count({ where }),
      prisma.file.aggregate({
        where,
        _sum: { file_size: true }
      }),
      prisma.file.groupBy({
        by: ['category'],
        where,
        _count: true
      }),
      prisma.file.groupBy({
        by: ['project_id'],
        where: { ...where, project_id: { not: null } },
        _count: true
      }),
      prisma.file.count({
        where: {
          ...where,
          uploaded_at: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      })
    ]);

    const categoryStats = filesByCategory.reduce((acc: Record<string, number>, item: any) => {
      acc[item.category] = item._count;
      return acc;
    }, {} as Record<string, number>);

    // Get project names for project stats
    const projectIds = filesByProject.map((p: any) => p.project_id).filter(Boolean) as string[];
    const projects = await prisma.project.findMany({
      where: { id: { in: projectIds } },
      select: { id: true, name: true }
    });

    const projectStats = filesByProject.map((item: any) => {
      const project = projects.find((p: any) => p.id === item.project_id);
      return {
        projectId: item.project_id!,
        projectName: project?.name || 'Unknown',
        count: item._count
      };
    });

    return {
      totalFiles,
      totalSize: Number(totalSizeResult._sum.file_size || 0),
      filesByCategory: categoryStats,
      filesByProject: projectStats,
      recentUploads
    };
  } catch (error) {
    logger.error('Failed to get file statistics', { error });
    throw new ApiError('Failed to retrieve file statistics', 500);
  }
};

export default {
  uploadFile,
  getFileById,
  listFiles,
  updateFile,
  deleteFile,
  permanentlyDeleteFile,
  downloadFile,
  getFileStatistics
};
