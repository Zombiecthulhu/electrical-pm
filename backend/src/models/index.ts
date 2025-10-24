/**
 * Models Index
 * 
 * This file exports data models and type definitions.
 * Note: Primary database models are defined in prisma/schema.prisma
 * This directory is for TypeScript interfaces, DTOs, and model utilities.
 * 
 * Export pattern:
 * export * from './user.model';
 * export * from './project.model';
 * export type { CreateProjectDTO, UpdateProjectDTO } from './project.types';
 */

// Re-export Prisma types for convenience
export type {
  User,
  Client,
  Project,
  File,
  DailyLog,
  Quote,
  UserRole,
  ProjectStatus,
  ProjectType,
  ClientType,
  FileCategory,
  QuoteStatus,
} from '@prisma/client';

// Additional model types and DTOs will be exported here
export {};

