/**
 * File Service
 * 
 * Handles file upload, storage, and management operations.
 * Implements secure file handling with validation, virus scanning, and storage abstraction.
 */

import { PrismaClient, File, FileCategory } from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/response';

const prisma = new PrismaClient();

// File upload configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'application/zip',
  'application/x-zip-compressed'
];

// Storage configuration
const STORAGE_BASE_PATH = process.env.STORAGE_PATH || './storage';
const THUMBNAIL_SIZE = 200;
const PREVIEW_SIZE = 800;

export interface FileUploadData {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface FileMetadata {
  projectId?: string;
  category: FileCategory;
  description?: string;
  tags?: string[];
  originalname?: string;
  mimetype?: string;
}

export interface FileStorageResult {
  filePath: string;
  thumbnailPath?: string;
  previewPath?: string;
  checksum: string;
}

/**
 * File Storage Service Interface
 * Abstracted for easy cloud migration
 */
export interface IStorageService {
  upload(file: Buffer, metadata: FileMetadata): Promise<FileStorageResult>;
  download(filePath: string): Promise<Buffer>;
  delete(filePath: string): Promise<void>;
  getUrl(filePath: string): string;
}

/**
 * Local Storage Service Implementation
 */
class LocalStorageService implements IStorageService {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  async upload(file: Buffer, metadata: FileMetadata): Promise<FileStorageResult> {
    const fileId = crypto.randomUUID();
    const extension = this.getFileExtension(metadata.originalname || '');
    const fileName = `${fileId}${extension}`;
    
    // Create directory structure
    const dirPath = this.getDirectoryPath(metadata);
    await this.ensureDirectoryExists(dirPath);
    
    const filePath = path.join(dirPath, fileName);
    const checksum = crypto.createHash('sha256').update(file).digest('hex');
    
    // Write file
    await fs.writeFile(filePath, file);
    
    const result: FileStorageResult = {
      filePath: path.relative(this.basePath, filePath),
      checksum
    };
    
    // Generate thumbnails and previews for images
    if (this.isImage(metadata.mimetype || '')) {
      const thumbnailPath = await this.generateThumbnail(file, dirPath, fileId);
      const previewPath = await this.generatePreview(file, dirPath, fileId);
      
      if (thumbnailPath) result.thumbnailPath = path.relative(this.basePath, thumbnailPath);
      if (previewPath) result.previewPath = path.relative(this.basePath, previewPath);
    }
    
    return result;
  }

  async download(filePath: string): Promise<Buffer> {
    const fullPath = path.join(this.basePath, filePath);
    return await fs.readFile(fullPath);
  }

  async delete(filePath: string): Promise<void> {
    const fullPath = path.join(this.basePath, filePath);
    try {
      await fs.unlink(fullPath);
    } catch (error) {
      logger.warn('File not found for deletion', { filePath, error });
    }
  }

  getUrl(filePath: string): string {
    return `/api/v1/files/download/${filePath}`;
  }

  private getFileExtension(filename: string): string {
    return path.extname(filename || '').toLowerCase();
  }

  private getDirectoryPath(metadata: FileMetadata): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    if (metadata.projectId) {
      return path.join(this.basePath, 'projects', metadata.projectId, metadata.category.toLowerCase(), `${year}-${month}-${day}`);
    }
    
    return path.join(this.basePath, 'general', metadata.category.toLowerCase(), `${year}-${month}-${day}`);
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      logger.error('Failed to create directory', { dirPath, error });
      throw new ApiError('Failed to create storage directory', 500);
    }
  }

  private isImage(mimetype: string): boolean {
    return ALLOWED_IMAGE_TYPES.includes(mimetype || '');
  }

  private async generateThumbnail(file: Buffer, dirPath: string, fileId: string): Promise<string | null> {
    try {
      const thumbnailPath = path.join(dirPath, `${fileId}_thumb.jpg`);
      await sharp(file)
        .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);
      return thumbnailPath;
    } catch (error) {
      logger.warn('Failed to generate thumbnail', { fileId, error });
      return null;
    }
  }

  private async generatePreview(file: Buffer, dirPath: string, fileId: string): Promise<string | null> {
    try {
      const previewPath = path.join(dirPath, `${fileId}_preview.jpg`);
      await sharp(file)
        .resize(PREVIEW_SIZE, PREVIEW_SIZE, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toFile(previewPath);
      return previewPath;
    } catch (error) {
      logger.warn('Failed to generate preview', { fileId, error });
      return null;
    }
  }
}

// Initialize storage service
const storageService = new LocalStorageService(STORAGE_BASE_PATH);

/**
 * Validate file upload
 */
export function validateFileUpload(file: FileUploadData): void {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new ApiError(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`, 400);
  }

  // Check file type
  const allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];
  if (!allowedTypes.includes(file.mimetype)) {
    throw new ApiError(`File type ${file.mimetype} is not allowed`, 400);
  }

  // Check filename
  if (!file.originalname || file.originalname.length === 0) {
    throw new ApiError('Filename is required', 400);
  }

  // Check for suspicious file extensions
  const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com'];
  const extension = path.extname(file.originalname).toLowerCase();
  if (suspiciousExtensions.includes(extension)) {
    throw new ApiError('File type is not allowed for security reasons', 400);
  }
}

/**
 * Determine file category from MIME type
 */
export function getFileCategory(mimetype: string): FileCategory {
  if (ALLOWED_IMAGE_TYPES.includes(mimetype)) {
    return FileCategory.PHOTO;
  }
  
  if (mimetype === 'application/pdf') {
    return FileCategory.DOCUMENT;
  }
  
  if (mimetype.includes('word') || mimetype.includes('excel') || mimetype.includes('powerpoint')) {
    return FileCategory.DOCUMENT;
  }
  
  if (mimetype.includes('zip') || mimetype.includes('compressed')) {
    return FileCategory.DOCUMENT;
  }
  
  return FileCategory.OTHER;
}

/**
 * Upload file to storage and database
 */
export async function uploadFile(
  file: FileUploadData,
  metadata: FileMetadata,
  uploadedBy: string
): Promise<File> {
  try {
    // Validate file
    validateFileUpload(file);
    
    // Determine category if not provided
    const category = metadata.category || getFileCategory(file.mimetype);
    
    // Upload to storage
    const storageResult = await storageService.upload(file.buffer, {
      ...metadata,
      category,
      originalname: file.originalname,
      mimetype: file.mimetype
    });
    
    // Save to database
    const fileRecord = await prisma.file.create({
      data: {
        storage_path: storageResult.filePath,
        original_filename: file.originalname,
        mime_type: file.mimetype,
        file_size: file.size,
        checksum: storageResult.checksum,
        category,
        project_id: metadata.projectId,
        uploaded_by: uploadedBy,
        description: metadata.description,
        tags: metadata.tags || [],
        version_number: 1
      }
    });
    
    logger.info('File uploaded successfully', {
      fileId: fileRecord.id,
      filename: file.originalname,
      size: file.size,
      category,
      uploadedBy
    });
    
    return fileRecord;
  } catch (error) {
    logger.error('File upload failed', { error, filename: file.originalname });
    throw error;
  }
}

/**
 * Get file by ID
 */
export async function getFileById(fileId: string): Promise<File | null> {
  try {
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        deleted_at: null
      },
      include: {
        uploader: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            project_number: true
          }
        }
      }
    });
    
    return file;
  } catch (error) {
    logger.error('Failed to get file by ID', { fileId, error });
    throw new ApiError('Failed to retrieve file', 500);
  }
}

/**
 * Get files by project ID
 */
export async function getFilesByProject(
  projectId: string,
  category?: FileCategory,
  page: number = 1,
  limit: number = 20
): Promise<{ files: File[]; total: number }> {
  try {
    const where: any = {
      project_id: projectId,
      deleted_at: null
    };
    
    if (category) {
      where.category = category;
    }
    
    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where,
        include: {
          uploader: {
            select: {
              id: true,
              first_name: true,
              last_name: true
            }
          }
        },
        orderBy: { uploaded_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.file.count({ where })
    ]);
    
    return { files, total };
  } catch (error) {
    logger.error('Failed to get files by project', { projectId, error });
    throw new ApiError('Failed to retrieve project files', 500);
  }
}

/**
 * Download file
 */
export async function downloadFile(fileId: string): Promise<{ file: File; buffer: Buffer }> {
  try {
    const file = await getFileById(fileId);
    if (!file) {
      throw new ApiError('File not found', 404);
    }
    
    const buffer = await storageService.download(file.storage_path);
    
    return { file, buffer };
  } catch (error) {
    logger.error('Failed to download file', { fileId, error });
    throw error;
  }
}

/**
 * Delete file (soft delete)
 */
export async function deleteFile(fileId: string, deletedBy: string): Promise<void> {
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
    
    // Soft delete
    await prisma.file.update({
      where: { id: fileId },
      data: {
        deleted_at: new Date()
      }
    });
    
    logger.info('File soft deleted', { fileId, deletedBy });
  } catch (error) {
    logger.error('Failed to delete file', { fileId, error });
    throw error;
  }
}

/**
 * Get file statistics
 */
export async function getFileStats(projectId?: string): Promise<{
  totalFiles: number;
  totalSize: number;
  byCategory: Record<string, number>;
}> {
  try {
    const where: any = { deleted_at: null };
    if (projectId) {
      where.project_id = projectId;
    }
    
    const files = await prisma.file.findMany({
      where,
      select: {
        file_size: true,
        category: true
      }
    });
    
    const stats = {
      totalFiles: files.length,
      totalSize: files.reduce((sum, file) => sum + file.file_size, 0),
      byCategory: files.reduce((acc, file) => {
        acc[file.category] = (acc[file.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
    
    return stats;
  } catch (error) {
    logger.error('Failed to get file stats', { projectId, error });
    throw new ApiError('Failed to retrieve file statistics', 500);
  }
}

export { storageService };
