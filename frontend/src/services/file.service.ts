/**
 * File Service
 * 
 * Handles API communication for file management operations.
 * Provides type-safe methods for file upload, download, and management.
 */

import api, { ApiResponse } from './api';

// File category enum
export enum FileCategory {
  DOCUMENT = 'DOCUMENT',
  PHOTO = 'PHOTO',
  PLAN = 'PLAN',
  SPEC = 'SPEC',
  PERMIT = 'PERMIT',
  CONTRACT = 'CONTRACT',
  INVOICE = 'INVOICE',
  RECEIPT = 'RECEIPT',
  REPORT = 'REPORT',
  OTHER = 'OTHER'
}

export interface FileUploadRequest {
  file: File;
  category: string;
  projectId?: string;
  dailyLogId?: string;
  description?: string;
  tags?: string[];
  folderPath?: string;
}

export interface FileData {
  id: string;
  storage_path: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  checksum: string | null;
  category: string;
  project_id: string | null;
  daily_log_id: string | null;
  uploaded_by: string;
  uploaded_at: string;
  version_number: number;
  parent_file_id: string | null;
  tags: string[];
  description: string | null;
  thumbnail_path: string | null;
  width: number | null;
  height: number | null;
  exif_data: any;
  page_count: number | null;
  folder_path: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  project?: {
    id: string;
    name: string;
    project_number: string;
  };
  daily_log?: {
    id: string;
    date: string;
  };
  uploader: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface FileListResponse {
  files: FileData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FileFilters {
  projectId?: string;
  dailyLogId?: string;
  category?: string;
  mimeType?: string;
  uploadedBy?: string;
  tags?: string;
  isFavorite?: boolean;
  folderPath?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface FilePaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class FileService {
  /**
   * Upload file
   */
  async uploadFile(data: FileUploadRequest): Promise<FileData> {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('category', data.category);
    
    if (data.projectId) formData.append('projectId', data.projectId);
    if (data.dailyLogId) formData.append('dailyLogId', data.dailyLogId);
    if (data.description) formData.append('description', data.description);
    if (data.tags) formData.append('tags', JSON.stringify(data.tags));
    if (data.folderPath) formData.append('folderPath', data.folderPath);

    const response: ApiResponse<FileData> = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data!;
  }

  /**
   * Get file by ID
   */
  async getFileById(id: string): Promise<FileData> {
    const response: ApiResponse<FileData> = await api.get(`/files/${id}`);
    return response.data!;
  }

  /**
   * List files with filtering and pagination
   */
  async listFiles(
    filters: FileFilters = {},
    pagination: FilePaginationOptions = {}
  ): Promise<FileListResponse> {
    const params = {
      ...filters,
      ...pagination
    };

    const response: ApiResponse<FileListResponse> = await api.get('/files', { params });
    return response.data!;
  }

  /**
   * Update file metadata
   */
  async updateFile(
    id: string,
    data: {
      description?: string;
      tags?: string[];
      folderPath?: string;
      isFavorite?: boolean;
    }
  ): Promise<FileData> {
    const response: ApiResponse<FileData> = await api.put(`/files/${id}`, data);
    return response.data!;
  }

  /**
   * Delete file
   */
  async deleteFile(id: string): Promise<void> {
    await api.delete(`/files/${id}`);
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(id: string): Promise<FileData> {
    const response: ApiResponse<FileData> = await api.patch(`/files/${id}/favorite`);
    return response.data!;
  }

  /**
   * Get download URL for file
   */
  getDownloadUrl(id: string): string {
    return `${api.defaults.baseURL}/files/${id}/download`;
  }

  /**
   * Get view URL for file (inline)
   */
  getViewUrl(id: string): string {
    return `${api.defaults.baseURL}/files/${id}/view`;
  }

  /**
   * Get thumbnail URL for file
   */
  getThumbnailUrl(id: string): string {
    return `${api.defaults.baseURL}/files/${id}/thumbnail`;
  }

  /**
   * Format file size
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Get file category display name
   */
  getCategoryDisplayName(category: string): string {
    const categoryNames: Record<string, string> = {
      DOCUMENT: 'Document',
      PHOTO: 'Photo',
      PLAN: 'Plan/Drawing',
      SPEC: 'Specification',
      PERMIT: 'Permit',
      CONTRACT: 'Contract',
      INVOICE: 'Invoice',
      RECEIPT: 'Receipt',
      REPORT: 'Report',
      OTHER: 'Other'
    };
    return categoryNames[category] || category;
  }
}

const fileService = new FileService();
export default fileService;
