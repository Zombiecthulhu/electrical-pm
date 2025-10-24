/**
 * File Upload Hook
 * 
 * Custom hook for handling file upload operations with progress tracking,
 * error handling, and state management.
 */

import { useState, useCallback } from 'react';
import { fileService, FileCategory, File } from '../services/file.service';
import { logger } from '../utils/logger';

export interface FileUploadState {
  isUploading: boolean;
  progress: number;
  uploadedFiles: File[];
  errors: string[];
  isDragOver: boolean;
}

export interface FileUploadOptions {
  projectId?: string;
  category: FileCategory;
  description?: string;
  tags?: string[];
  maxFiles?: number;
  onSuccess?: (files: File[]) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: number) => void;
}

export interface FileUploadResult {
  state: FileUploadState;
  uploadFiles: (files: globalThis.File[]) => Promise<void>;
  uploadSingleFile: (file: globalThis.File) => Promise<void>;
  clearErrors: () => void;
  reset: () => void;
  setDragOver: (isDragOver: boolean) => void;
}

/**
 * File Upload Hook
 */
export const useFileUpload = (options: FileUploadOptions): FileUploadResult => {
  const [state, setState] = useState<FileUploadState>({
    isUploading: false,
    progress: 0,
    uploadedFiles: [],
    errors: [],
    isDragOver: false,
  });

  const updateState = useCallback((updates: Partial<FileUploadState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const clearErrors = useCallback(() => {
    updateState({ errors: [] });
  }, [updateState]);

  const reset = useCallback(() => {
    setState({
      isUploading: false,
      progress: 0,
      uploadedFiles: [],
      errors: [],
      isDragOver: false,
    });
  }, []);

  const setDragOver = useCallback((isDragOver: boolean) => {
    updateState({ isDragOver });
  }, [updateState]);

  const uploadSingleFile = useCallback(async (file: globalThis.File) => {
    // Validate file
    const validation = fileService.validateFile(file);
    if (!validation.isValid) {
      updateState({
        errors: [...state.errors, validation.error || 'Invalid file']
      });
      options.onError?.(validation.error || 'Invalid file');
      return;
    }

    updateState({ isUploading: true, progress: 0 });

    try {
      const response = await fileService.uploadFile(file, {
        projectId: options.projectId,
        category: options.category,
        description: options.description,
        tags: options.tags,
      });

      if (response.success && response.data) {
        const uploadedFile = Array.isArray(response.data) ? response.data[0] : response.data;
        updateState({
          uploadedFiles: [...state.uploadedFiles, uploadedFile],
          progress: 100,
        });
        options.onSuccess?.([uploadedFile]);
        logger.info('File uploaded successfully', { fileId: uploadedFile.id, filename: uploadedFile.original_filename });
      } else {
        throw new Error(response.error?.message || 'Upload failed');
      }
    } catch (error: any) {
      const errorMessage = error?.error?.message || error?.message || 'Upload failed';
      updateState({
        errors: [...state.errors, errorMessage]
      });
      options.onError?.(errorMessage);
      logger.error('File upload failed', { error: errorMessage, filename: file.name });
    } finally {
      updateState({ isUploading: false, progress: 0 });
    }
  }, [state.uploadedFiles, state.errors, options, updateState]);

  const uploadFiles = useCallback(async (files: globalThis.File[]) => {
    // Validate files
    const validFiles: globalThis.File[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      const validation = fileService.validateFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error || 'Invalid file'}`);
      }
    });

    if (errors.length > 0) {
      updateState({ errors: [...state.errors, ...errors] });
      options.onError?.(errors.join(', '));
    }

    if (validFiles.length === 0) {
      return;
    }

    // Check max files limit
    if (options.maxFiles && validFiles.length > options.maxFiles) {
      const errorMessage = `Maximum ${options.maxFiles} files allowed`;
      updateState({
        errors: [...state.errors, errorMessage]
      });
      options.onError?.(errorMessage);
      return;
    }

    updateState({ isUploading: true, progress: 0 });

    try {
      // Upload files in batches to avoid overwhelming the server
      const batchSize = 5;
      const batches = [];
      for (let i = 0; i < validFiles.length; i += batchSize) {
        batches.push(validFiles.slice(i, i + batchSize));
      }

      const allUploadedFiles: File[] = [];

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const batchProgress = ((i + 1) / batches.length) * 100;
        
        updateState({ progress: batchProgress });
        options.onProgress?.(batchProgress);

        if (batch.length === 1) {
          // Single file upload
          const response = await fileService.uploadFile(batch[0], {
            projectId: options.projectId,
            category: options.category,
            description: options.description,
            tags: options.tags,
          });

          if (response.success && response.data) {
            const uploadedFile = Array.isArray(response.data) ? response.data[0] : response.data;
            allUploadedFiles.push(uploadedFile);
          } else {
            throw new Error(response.error?.message || 'Upload failed');
          }
        } else {
          // Multiple files upload
          const response = await fileService.uploadMultipleFiles(batch, {
            projectId: options.projectId,
            category: options.category,
            description: options.description,
            tags: options.tags,
          });

          if (response.success && response.data) {
            allUploadedFiles.push(...response.data);
          } else {
            throw new Error(response.error?.message || 'Upload failed');
          }
        }
      }

      updateState({
        uploadedFiles: [...state.uploadedFiles, ...allUploadedFiles],
        progress: 100,
      });
      options.onSuccess?.(allUploadedFiles);
      logger.info('Files uploaded successfully', { count: allUploadedFiles.length });
    } catch (error: any) {
      const errorMessage = error?.error?.message || error?.message || 'Upload failed';
      updateState({
        errors: [...state.errors, errorMessage]
      });
      options.onError?.(errorMessage);
      logger.error('File upload failed', { error: errorMessage, fileCount: validFiles.length });
    } finally {
      updateState({ isUploading: false, progress: 0 });
    }
  }, [state.uploadedFiles, state.errors, options, updateState]);

  return {
    state,
    uploadFiles,
    uploadSingleFile,
    clearErrors,
    reset,
    setDragOver,
  };
};
