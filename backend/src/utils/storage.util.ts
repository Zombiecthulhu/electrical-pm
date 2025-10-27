/**
 * Storage Utility
 * 
 * Handles file storage operations, organization, and management.
 * Provides abstraction layer for local storage (with cloud-ready architecture).
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { promisify } from 'util';
import { pipeline } from 'stream';
import { logger } from './logger';

const streamPipeline = promisify(pipeline);

// Storage configuration
const STORAGE_BASE_PATH = process.env.STORAGE_PATH || path.join(__dirname, '../../storage');
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '52428800'); // 50MB default

// File organization structure
const STORAGE_PATHS = {
  documents: 'documents',
  photos: 'photos',
  plans: 'plans',
  temp: 'temp',
  thumbnails: 'thumbnails'
};

/**
 * Storage service interface for easy cloud migration
 */
export interface IStorageService {
  upload(file: Buffer | NodeJS.ReadableStream, metadata: FileMetadata): Promise<string>;
  download(storagePath: string): Promise<Buffer>;
  delete(storagePath: string): Promise<void>;
  getUrl(storagePath: string): string;
  exists(storagePath: string): Promise<boolean>;
  move(fromPath: string, toPath: string): Promise<void>;
}

/**
 * File metadata for storage operations
 */
export interface FileMetadata {
  originalFilename: string;
  mimeType: string;
  category: string;
  projectId?: string;
  dailyLogId?: string;
  date?: Date;
}

/**
 * Upload result with file information
 */
export interface UploadResult {
  storagePath: string;
  filename: string;
  fileSize: number;
  checksum: string;
}

/**
 * Initialize storage directories
 */
export const initializeStorage = async (): Promise<void> => {
  try {
    // Create base storage directory
    if (!fs.existsSync(STORAGE_BASE_PATH)) {
      fs.mkdirSync(STORAGE_BASE_PATH, { recursive: true });
    }

    // Create subdirectories
    Object.values(STORAGE_PATHS).forEach((dir) => {
      const fullPath = path.join(STORAGE_BASE_PATH, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });

    logger.info('Storage directories initialized', { basePath: STORAGE_BASE_PATH });
  } catch (error) {
    logger.error('Failed to initialize storage', { error });
    throw error;
  }
};

/**
 * Generate unique filename with UUID
 */
export const generateFilename = (originalFilename: string): string => {
  const ext = path.extname(originalFilename);
  const uuid = crypto.randomUUID();
  return `${uuid}${ext}`;
};

/**
 * Calculate file checksum (SHA-256)
 */
export const calculateChecksum = (buffer: Buffer): string => {
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

/**
 * Get storage path for file based on category and metadata
 */
export const getStoragePath = (metadata: FileMetadata, filename: string): string => {
  const { category, projectId, dailyLogId, date } = metadata;
  const baseCategory = getCategoryPath(category);
  
  let relativePath = baseCategory;

  // Organize by project
  if (projectId) {
    relativePath = path.join(relativePath, projectId);
  }

  // Organize photos by date
  if (category === 'PHOTO' && date) {
    const dateStr = date.toISOString().split('T')[0] || date.toISOString(); // YYYY-MM-DD
    relativePath = path.join(relativePath, dateStr);
  }

  // Organize by daily log if specified
  if (dailyLogId) {
    relativePath = path.join(relativePath, 'daily-logs', dailyLogId);
  }

  return path.join(relativePath, filename);
};

/**
 * Get category-based path
 */
const getCategoryPath = (category: string): string => {
  switch (category) {
    case 'PHOTO':
      return STORAGE_PATHS.photos;
    case 'PLAN':
    case 'SPEC':
      return STORAGE_PATHS.plans;
    case 'DOCUMENT':
    case 'PERMIT':
    case 'CONTRACT':
    case 'INVOICE':
    case 'RECEIPT':
    case 'REPORT':
      return STORAGE_PATHS.documents;
    default:
      return STORAGE_PATHS.documents;
  }
};

/**
 * Get thumbnail path for an image
 */
export const getThumbnailPath = (originalPath: string): string => {
  const filename = path.basename(originalPath);
  return path.join(STORAGE_PATHS.thumbnails, filename);
};

/**
 * Local Storage Service Implementation
 */
export class LocalStorageService implements IStorageService {
  /**
   * Upload file to local storage
   */
  async upload(
    file: Buffer | NodeJS.ReadableStream,
    metadata: FileMetadata
  ): Promise<string> {
    try {
      // Generate unique filename
      const filename = generateFilename(metadata.originalFilename);
      const storagePath = getStoragePath(metadata, filename);
      const fullPath = path.join(STORAGE_BASE_PATH, storagePath);

      // Ensure directory exists
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write file
      if (Buffer.isBuffer(file)) {
        fs.writeFileSync(fullPath, file);
      } else {
        await streamPipeline(file, fs.createWriteStream(fullPath));
      }

      logger.info('File uploaded to local storage', { storagePath, originalFilename: metadata.originalFilename });
      return storagePath;
    } catch (error) {
      logger.error('Failed to upload file to local storage', { error, metadata });
      throw new Error('File upload failed');
    }
  }

  /**
   * Download file from local storage
   */
  async download(storagePath: string): Promise<Buffer> {
    try {
      const fullPath = path.join(STORAGE_BASE_PATH, storagePath);
      
      if (!fs.existsSync(fullPath)) {
        throw new Error('File not found');
      }

      return fs.readFileSync(fullPath);
    } catch (error) {
      logger.error('Failed to download file from local storage', { error, storagePath });
      throw error;
    }
  }

  /**
   * Delete file from local storage
   */
  async delete(storagePath: string): Promise<void> {
    try {
      const fullPath = path.join(STORAGE_BASE_PATH, storagePath);
      
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        logger.info('File deleted from local storage', { storagePath });
      }
    } catch (error) {
      logger.error('Failed to delete file from local storage', { error, storagePath });
      throw error;
    }
  }

  /**
   * Get URL for file access
   */
  getUrl(storagePath: string): string {
    // For local storage, return API endpoint
    return `/api/v1/files/download/${encodeURIComponent(storagePath)}`;
  }

  /**
   * Check if file exists
   */
  async exists(storagePath: string): Promise<boolean> {
    const fullPath = path.join(STORAGE_BASE_PATH, storagePath);
    return fs.existsSync(fullPath);
  }

  /**
   * Move file to new location
   */
  async move(fromPath: string, toPath: string): Promise<void> {
    try {
      const fullFromPath = path.join(STORAGE_BASE_PATH, fromPath);
      const fullToPath = path.join(STORAGE_BASE_PATH, toPath);

      // Ensure destination directory exists
      const dir = path.dirname(fullToPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.renameSync(fullFromPath, fullToPath);
      logger.info('File moved', { from: fromPath, to: toPath });
    } catch (error) {
      logger.error('Failed to move file', { error, fromPath, toPath });
      throw error;
    }
  }
}

/**
 * Get storage service instance
 */
export const getStorageService = (): IStorageService => {
  // For now, return local storage
  // Can be extended to return cloud storage based on config
  return new LocalStorageService();
};

/**
 * Validate file size
 */
export const validateFileSize = (fileSize: number): boolean => {
  return fileSize <= MAX_FILE_SIZE;
};

/**
 * Validate file type
 */
export const validateFileType = (mimeType: string, allowedTypes: string[]): boolean => {
  return allowedTypes.some((type) => {
    // Allow all types
    if (type === '*/*') {
      return true;
    }
    // Allow type wildcards (e.g., image/*)
    if (type.endsWith('/*')) {
      const prefix = type.slice(0, -2);
      return mimeType.startsWith(prefix);
    }
    // Exact match
    return mimeType === type;
  });
};

/**
 * Get allowed MIME types by category
 */
export const getAllowedMimeTypes = (category: string): string[] => {
  switch (category) {
    case 'PHOTO':
      return ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic'];
    case 'DOCUMENT':
    case 'PERMIT':
    case 'CONTRACT':
    case 'INVOICE':
    case 'RECEIPT':
    case 'REPORT':
      return [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
      ];
    case 'PLAN':
    case 'SPEC':
      return [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/tiff',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
    default:
      return ['*/*']; // Allow all for OTHER category
  }
};

/**
 * Clean up temporary files older than specified hours
 */
export const cleanupTempFiles = async (hoursOld: number = 24): Promise<void> => {
  try {
    const tempPath = path.join(STORAGE_BASE_PATH, STORAGE_PATHS.temp);
    const cutoffTime = Date.now() - (hoursOld * 60 * 60 * 1000);

    if (!fs.existsSync(tempPath)) {
      return;
    }

    const files = fs.readdirSync(tempPath);
    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(tempPath, file);
      const stats = fs.statSync(filePath);

      if (stats.mtimeMs < cutoffTime) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    }

    logger.info('Temporary files cleaned up', { deletedCount, hoursOld });
  } catch (error) {
    logger.error('Failed to cleanup temporary files', { error });
  }
};

export default {
  initializeStorage,
  generateFilename,
  calculateChecksum,
  getStoragePath,
  getThumbnailPath,
  getStorageService,
  validateFileSize,
  validateFileType,
  getAllowedMimeTypes,
  cleanupTempFiles,
  LocalStorageService
};

