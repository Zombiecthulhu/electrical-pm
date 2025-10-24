import { PrismaClient, User, UserRole } from '@prisma/client';

// Partial user type for admin operations (without sensitive fields)
type AdminUser = Pick<User, 'id' | 'email' | 'first_name' | 'last_name' | 'phone' | 'role' | 'is_active' | 'created_at' | 'updated_at'>;
import bcrypt from 'bcrypt';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Types for admin operations
export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
}

export interface UpdateUserData {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface ResetPasswordData {
  newPassword: string;
}

export interface AuditLogData {
  adminUserId: string;
  action: 'CREATE_USER' | 'UPDATE_USER' | 'DELETE_USER' | 'RESET_PASSWORD';
  targetUserId: string;
  details: Record<string, any>;
  ipAddress: string;
}

/**
 * Create audit log entry
 */
const createAuditLog = async (auditData: AuditLogData): Promise<void> => {
  try {
    // For now, we'll log to the application logs
    // In production, you might want to store this in a dedicated audit_logs table
    logger.info('Admin action performed', {
      adminUserId: auditData.adminUserId,
      action: auditData.action,
      targetUserId: auditData.targetUserId,
      details: auditData.details,
      ipAddress: auditData.ipAddress,
      service: 'electrical-pm-api',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to create audit log', {
      error: error instanceof Error ? error.message : 'Unknown error',
      auditData,
      service: 'electrical-pm-api',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Validate email format
 */
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
const isValidPassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Validate phone number format
 */
const isValidPhone = (phone: string): boolean => {
  // Very flexible phone validation - just check it's not empty and has some digits
  if (!phone || phone.trim().length === 0) {
    return false;
  }
  const cleanedPhone = phone.replace(/[\s\-\(\)\.]/g, '');
  return cleanedPhone.length >= 7 && /^\d+$/.test(cleanedPhone);
};

/**
 * Create a new user (admin only)
 */
export const createUser = async (
  userData: CreateUserData,
  adminUserId: string,
  ipAddress: string
): Promise<{ success: boolean; user?: AdminUser; error?: string }> => {
  try {
    // Validate input data
    if (!isValidEmail(userData.email)) {
      return { success: false, error: 'Invalid email format' };
    }

    if (!isValidPassword(userData.password)) {
      return { 
        success: false, 
        error: 'Password must be at least 8 characters with uppercase, lowercase, and number' 
      };
    }

    if (!isValidPhone(userData.phone)) {
      return { success: false, error: 'Invalid phone number format' };
    }

    if (!Object.values(UserRole).includes(userData.role)) {
      return { success: false, error: 'Invalid user role' };
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (existingUser) {
      return { success: false, error: 'User with this email already exists' };
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        password_hash: hashedPassword,
        first_name: userData.firstName,
        last_name: userData.lastName,
        phone: userData.phone,
        role: userData.role,
        is_active: true
      }
    });

    // Create audit log
    await createAuditLog({
      adminUserId,
      action: 'CREATE_USER',
      targetUserId: user.id,
      details: {
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name
      },
      ipAddress
    });

    logger.info('User created successfully', {
      userId: user.id,
      email: user.email,
      role: user.role,
      adminUserId,
      service: 'electrical-pm-api',
      timestamp: new Date().toISOString()
    });

    return { success: true, user };
  } catch (error) {
    logger.error('Failed to create user', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userData: { ...userData, password: '[REDACTED]' },
      adminUserId,
      service: 'electrical-pm-api',
      timestamp: new Date().toISOString()
    });

    return { success: false, error: 'Failed to create user' };
  }
};

/**
 * Get all users (admin only)
 */
export const getAllUsers = async (
  adminUserId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ success: boolean; users?: AdminUser[]; total?: number; error?: string }> => {
  try {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { deleted_at: null },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          phone: true,
          role: true,
          is_active: true,
          created_at: true,
          updated_at: true
        }
      }),
      prisma.user.count({
        where: { deleted_at: null }
      })
    ]);

    logger.info('Users retrieved successfully', {
      count: users.length,
      total,
      page,
      limit,
      adminUserId,
      service: 'electrical-pm-api',
      timestamp: new Date().toISOString()
    });

    return { success: true, users, total };
  } catch (error) {
    logger.error('Failed to get users', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminUserId,
      service: 'electrical-pm-api',
      timestamp: new Date().toISOString()
    });

    return { success: false, error: 'Failed to retrieve users' };
  }
};

/**
 * Get user by ID (admin only)
 */
export const getUserById = async (
  userId: string,
  adminUserId: string
): Promise<{ success: boolean; user?: AdminUser; error?: string }> => {
  try {
    const user = await prisma.user.findUnique({
      where: { 
        id: userId,
        deleted_at: null
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
        role: true,
        is_active: true,
        created_at: true,
        updated_at: true
      }
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    logger.info('User retrieved successfully', {
      userId,
      adminUserId,
      service: 'electrical-pm-api',
      timestamp: new Date().toISOString()
    });

    return { success: true, user };
  } catch (error) {
    logger.error('Failed to get user', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
      adminUserId,
      service: 'electrical-pm-api',
      timestamp: new Date().toISOString()
    });

    return { success: false, error: 'Failed to retrieve user' };
  }
};

/**
 * Update user (admin only)
 */
export const updateUser = async (
  userId: string,
  userData: UpdateUserData,
  adminUserId: string,
  ipAddress: string
): Promise<{ success: boolean; user?: AdminUser; error?: string }> => {
  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { 
        id: userId,
        deleted_at: null
      }
    });

    if (!existingUser) {
      return { success: false, error: 'User not found' };
    }

    // Validate email if provided
    if (userData.email && !isValidEmail(userData.email)) {
      return { success: false, error: 'Invalid email format' };
    }

    // Check email uniqueness if email is being updated
    if (userData.email && userData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (emailExists) {
        return { success: false, error: 'Email already in use' };
      }
    }

    // Validate phone if provided
    if (userData.phone && !isValidPhone(userData.phone)) {
      return { success: false, error: 'Invalid phone number format' };
    }

    // Validate role if provided
    if (userData.role && !Object.values(UserRole).includes(userData.role)) {
      return { success: false, error: 'Invalid user role' };
    }

    // Prepare update data with correct field names
    const updateData: any = {
      updated_at: new Date()
    };

    if (userData.email !== undefined) updateData.email = userData.email;
    if (userData.firstName !== undefined) updateData.first_name = userData.firstName;
    if (userData.lastName !== undefined) updateData.last_name = userData.lastName;
    if (userData.phone !== undefined) updateData.phone = userData.phone;
    if (userData.role !== undefined) updateData.role = userData.role;
    if (userData.isActive !== undefined) updateData.is_active = userData.isActive;

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
        role: true,
        is_active: true,
        created_at: true,
        updated_at: true
      }
    });

    // Create audit log
    await createAuditLog({
      adminUserId,
      action: 'UPDATE_USER',
      targetUserId: userId,
      details: {
        updatedFields: Object.keys(userData),
        newValues: userData
      },
      ipAddress
    });

    logger.info('User updated successfully', {
      userId,
      adminUserId,
      updatedFields: Object.keys(userData),
      service: 'electrical-pm-api',
      timestamp: new Date().toISOString()
    });

    return { success: true, user };
  } catch (error) {
    logger.error('Failed to update user', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
      userData,
      adminUserId,
      service: 'electrical-pm-api',
      timestamp: new Date().toISOString()
    });

    return { success: false, error: 'Failed to update user' };
  }
};

/**
 * Delete user (soft delete) (admin only)
 */
export const deleteUser = async (
  userId: string,
  adminUserId: string,
  ipAddress: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { 
        id: userId,
        deleted_at: null
      }
    });

    if (!existingUser) {
      return { success: false, error: 'User not found' };
    }

    // Prevent admin from deleting themselves
    if (userId === adminUserId) {
      return { success: false, error: 'Cannot delete your own account' };
    }

    // Soft delete user
    await prisma.user.update({
      where: { id: userId },
      data: {
        deleted_at: new Date(),
        updated_at: new Date()
      }
    });

    // Create audit log
    await createAuditLog({
      adminUserId,
      action: 'DELETE_USER',
      targetUserId: userId,
      details: {
        deletedUserEmail: existingUser.email,
        deletedUserRole: existingUser.role
      },
      ipAddress
    });

    logger.info('User deleted successfully', {
      userId,
      adminUserId,
      deletedUserEmail: existingUser.email,
      service: 'electrical-pm-api',
      timestamp: new Date().toISOString()
    });

    return { success: true };
  } catch (error) {
    logger.error('Failed to delete user', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
      adminUserId,
      service: 'electrical-pm-api',
      timestamp: new Date().toISOString()
    });

    return { success: false, error: 'Failed to delete user' };
  }
};

/**
 * Reset user password (admin only)
 */
export const resetUserPassword = async (
  userId: string,
  passwordData: ResetPasswordData,
  adminUserId: string,
  ipAddress: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Validate password
    if (!isValidPassword(passwordData.newPassword)) {
      return { 
        success: false, 
        error: 'Password must be at least 8 characters with uppercase, lowercase, and number' 
      };
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { 
        id: userId,
        deleted_at: null
      }
    });

    if (!existingUser) {
      return { success: false, error: 'User not found' };
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(passwordData.newPassword, saltRounds);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        password_hash: hashedPassword,
        updated_at: new Date()
      }
    });

    // Create audit log
    await createAuditLog({
      adminUserId,
      action: 'RESET_PASSWORD',
      targetUserId: userId,
      details: {
        resetForEmail: existingUser.email
      },
      ipAddress
    });

    logger.info('User password reset successfully', {
      userId,
      adminUserId,
      resetForEmail: existingUser.email,
      service: 'electrical-pm-api',
      timestamp: new Date().toISOString()
    });

    return { success: true };
  } catch (error) {
    logger.error('Failed to reset user password', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
      adminUserId,
      service: 'electrical-pm-api',
      timestamp: new Date().toISOString()
    });

    return { success: false, error: 'Failed to reset password' };
  }
};
