/**
 * File Service
 * 
 * Handles file upload, download, and management operations on the frontend.
 * Provides a clean interface for interacting with the file API endpoints.
 */

import api, { ApiResponse } from './api';

// File category enum (matches backend)
export enum FileCategory {
  DOCUMENT = 'DOCUMENT',
  PHOTO = 'PHOTO',
  PLAN = 'PLAN',
  SPEC = 'SPEC',
  PERMIT = 'PERMIT',
  CONTRACT = 'CONTRACT',
  INVOICE = 'INVOICE',
  OTHER = 'OTHER'
}

// File interface (matches backend Prisma model)
export interface File {
  id: string;
  storage_path: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  checksum: string | null;
  category: FileCategory;
  project_id: string | null;
  uploaded_by: string;
  uploaded_at: string;
  version_number: number;
  parent_file_id: string | null;
  tags: string[];
  description: string | null;
  deleted_at: string | null;
  uploader?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  project?: {
    id: string;
    name: string;
    project_number: string;
  };
}

// File upload data interface
export interface FileUploadData {
  file: File;
  projectId?: string;
  category: FileCategory;
  description?: string;
  tags?: string[];
}

// File upload response
export interface FileUploadResponse {
  success: boolean;
  data: File | File[];
  message?: string;
}

// File list response
export interface FileListResponse {
  files: File[];
  total: number;
}

// File statistics response
export interface FileStatsResponse {
  totalFiles: number;
  totalSize: number;
  byCategory: Record<string, number>;
}

// File search parameters
export interface FileSearchParams {
  q?: string;
  category?: FileCategory;
  projectId?: string;
  page?: number;
  limit?: number;
}

/**
 * File Service Class
 */
class FileService {
  /**
   * Upload a single file
   */
  async uploadFile(
    file: globalThis.File,
    metadata: {
      projectId?: string;
      category: FileCategory;
      description?: string;
      tags?: string[];
    }
  ): Promise<ApiResponse<File>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (metadata.projectId) {
      formData.append('projectId', metadata.projectId);
    }
    formData.append('category', metadata.category);
    
    if (metadata.description) {
      formData.append('description', metadata.description);
    }
    
    if (metadata.tags && metadata.tags.length > 0) {
      formData.append('tags', JSON.stringify(metadata.tags));
    }

    return api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(
    files: globalThis.File[],
    metadata: {
      projectId?: string;
      category: FileCategory;
      description?: string;
      tags?: string[];
    }
  ): Promise<ApiResponse<File[]>> {
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('files', file);
    });
    
    if (metadata.projectId) {
      formData.append('projectId', metadata.projectId);
    }
    formData.append('category', metadata.category);
    
    if (metadata.description) {
      formData.append('description', metadata.description);
    }
    
    if (metadata.tags && metadata.tags.length > 0) {
      formData.append('tags', JSON.stringify(metadata.tags));
    }

    return api.post('/files/upload-multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * Get file by ID
   */
  async getFile(fileId: string): Promise<ApiResponse<File>> {
    return api.get(`/files/${fileId}`);
  }

  /**
   * Get files by project
   */
  async getProjectFiles(
    projectId: string,
    params?: {
      category?: FileCategory;
      page?: number;
      limit?: number;
    }
  ): Promise<ApiResponse<FileListResponse>> {
    const queryParams = new URLSearchParams();
    
    if (params?.category) {
      queryParams.append('category', params.category);
    }
    if (params?.page) {
      queryParams.append('page', params.page.toString());
    }
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }

    const queryString = queryParams.toString();
    const url = `/files/project/${projectId}${queryString ? `?${queryString}` : ''}`;
    
    return api.get(url);
  }

  /**
   * Download file
   */
  async downloadFile(fileId: string): Promise<Blob> {
    const response = await api.get(`/files/${fileId}/download`, {
      responseType: 'blob',
    });
    return response as unknown as Blob;
  }

  /**
   * Get file preview/thumbnail
   */
  async getFilePreview(fileId: string, type: 'preview' | 'thumbnail' = 'preview'): Promise<Blob> {
    const response = await api.get(`/files/${fileId}/preview?type=${type}`, {
      responseType: 'blob',
    });
    return response as unknown as Blob;
  }

  /**
   * Delete file
   */
  async deleteFile(fileId: string): Promise<ApiResponse<null>> {
    return api.delete(`/files/${fileId}`);
  }

  /**
   * Get file statistics
   */
  async getFileStats(projectId?: string): Promise<ApiResponse<FileStatsResponse>> {
    const params = projectId ? { projectId } : {};
    return api.get('/files/stats', { params });
  }

  /**
   * Search files
   */
  async searchFiles(params: FileSearchParams): Promise<ApiResponse<FileListResponse>> {
    return api.get('/files/search', { params });
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get file icon based on MIME type
   */
  getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) {
      return 'image';
    } else if (mimeType.includes('pdf')) {
      return 'picture_as_pdf';
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      return 'description';
    } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
      return 'table_chart';
    } else if (mimeType.includes('zip') || mimeType.includes('compressed')) {
      return 'folder_zip';
    } else {
      return 'insert_drive_file';
    }
  }

  /**
   * Validate file before upload
   */
  validateFile(file: globalThis.File): { isValid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/zip',
      'application/x-zip-compressed'
    ];

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File size exceeds maximum allowed size of ${this.formatFileSize(maxSize)}`
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `File type ${file.type} is not allowed`
      };
    }

    return { isValid: true };
  }

  /**
   * Create download URL for file
   */
  createDownloadUrl(fileId: string): string {
    return `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1'}/files/${fileId}/download`;
  }

  /**
   * Create preview URL for file
   */
  createPreviewUrl(fileId: string, type: 'preview' | 'thumbnail' = 'preview'): string {
    return `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1'}/files/${fileId}/preview?type=${type}`;
  }
}

// Export singleton instance
export const fileService = new FileService();

// Export default
export default fileService;
