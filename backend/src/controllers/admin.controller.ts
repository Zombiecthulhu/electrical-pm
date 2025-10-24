import { Request, Response } from 'express';
import { 
  createUser, 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser, 
  resetUserPassword,
  CreateUserData,
  UpdateUserData,
  ResetPasswordData
} from '../services/admin.service';
import { logger } from '../utils/logger';
import { successResponse, errorResponse } from '../utils/response';

/**
 * Create a new user (SUPER_ADMIN only)
 */
export const createUserController = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminUserId = req.user?.id;
    const ipAddress = req.ip || 'unknown';

    if (!adminUserId) {
      errorResponse(res, 'Authentication required', 401);
      return;
    }

    const { email, password, firstName, lastName, phone, role } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !phone || !role) {
      errorResponse(res, 'All fields are required', 400);
      return;
    }

    const userData: CreateUserData = {
      email,
      password,
      firstName,
      lastName,
      phone,
      role
    };

    const result = await createUser(userData, adminUserId, ipAddress);

    if (!result.success) {
      errorResponse(res, result.error || 'Failed to create user', 400);
      return;
    }

    logger.info('User created via admin controller', {
      userId: result.user?.id,
      email: result.user?.email,
      role: result.user?.role,
      adminUserId,
      service: 'electrical-pm-api',
      timestamp: new Date().toISOString()
    });

    successResponse(res, { user: result.user }, 'User created successfully', 201);
  } catch (error) {
    logger.error('Create user controller error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminUserId: req.user?.id,
      service: 'electrical-pm-api',
      timestamp: new Date().toISOString()
    });

    errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * Get all users (SUPER_ADMIN only)
 */
export const getAllUsersController = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminUserId = req.user?.id;

    if (!adminUserId) {
      errorResponse(res, 'Authentication required', 401);
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      errorResponse(res, 'Invalid pagination parameters', 400);
      return;
    }

    const result = await getAllUsers(adminUserId, page, limit);

    if (!result.success) {
      errorResponse(res, result.error || 'Failed to retrieve users', 500);
      return;
    }

    logger.info('Users retrieved via admin controller', {
      count: result.users?.length,
      total: result.total,
      page,
      limit,
      adminUserId,
      service: 'electrical-pm-api',
      timestamp: new Date().toISOString()
    });

    successResponse(res, {
      users: result.users,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil((result.total || 0) / limit)
      }
    }, 'Users retrieved successfully');
  } catch (error) {
    logger.error('Get all users controller error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminUserId: req.user?.id,
      service: 'electrical-pm-api',
      timestamp: new Date().toISOString()
    });

    errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * Get user by ID (SUPER_ADMIN only)
 */
export const getUserByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminUserId = req.user?.id;
    const { id } = req.params;

    if (!adminUserId) {
      errorResponse(res, 'Authentication required', 401);
      return;
    }

    if (!id) {
      errorResponse(res, 'User ID is required', 400);
      return;
    }

    const result = await getUserById(id, adminUserId);

    if (!result.success) {
      const statusCode = result.error === 'User not found' ? 404 : 500;
      errorResponse(res, result.error || 'Failed to retrieve user', statusCode);
      return;
    }

    logger.info('User retrieved via admin controller', {
      userId: id,
      adminUserId,
      service: 'electrical-pm-api',
      timestamp: new Date().toISOString()
    });

    successResponse(res, { user: result.user }, 'User retrieved successfully');
  } catch (error) {
    logger.error('Get user by ID controller error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.params.id,
      adminUserId: req.user?.id,
      service: 'electrical-pm-api',
      timestamp: new Date().toISOString()
    });

    errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * Update user (SUPER_ADMIN only)
 */
export const updateUserController = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminUserId = req.user?.id;
    const { id } = req.params;
    const ipAddress = req.ip || 'unknown';

    if (!adminUserId) {
      errorResponse(res, 'Authentication required', 401);
      return;
    }

    if (!id) {
      errorResponse(res, 'User ID is required', 400);
      return;
    }

    const { email, firstName, lastName, phone, role, isActive } = req.body;

    // Validate that at least one field is provided for update
    if (!email && !firstName && !lastName && !phone && !role && isActive === undefined) {
      errorResponse(res, 'At least one field must be provided for update', 400);
      return;
    }

    const userData: UpdateUserData = {};
    if (email !== undefined) userData.email = email;
    if (firstName !== undefined) userData.firstName = firstName;
    if (lastName !== undefined) userData.lastName = lastName;
    if (phone !== undefined) userData.phone = phone;
    if (role !== undefined) userData.role = role;
    if (isActive !== undefined) userData.isActive = isActive;

    const result = await updateUser(id, userData, adminUserId, ipAddress);

    if (!result.success) {
      const statusCode = result.error === 'User not found' ? 404 : 400;
      errorResponse(res, result.error || 'Failed to update user', statusCode);
      return;
    }

    logger.info('User updated via admin controller', {
      userId: id,
      updatedFields: Object.keys(userData),
      adminUserId,
      service: 'electrical-pm-api',
      timestamp: new Date().toISOString()
    });

    successResponse(res, { user: result.user }, 'User updated successfully');
  } catch (error) {
    logger.error('Update user controller error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.params.id,
      adminUserId: req.user?.id,
      service: 'electrical-pm-api',
      timestamp: new Date().toISOString()
    });

    errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * Delete user (SUPER_ADMIN only)
 */
export const deleteUserController = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminUserId = req.user?.id;
    const { id } = req.params;
    const ipAddress = req.ip || 'unknown';

    if (!adminUserId) {
      errorResponse(res, 'Authentication required', 401);
      return;
    }

    if (!id) {
      errorResponse(res, 'User ID is required', 400);
      return;
    }

    const result = await deleteUser(id, adminUserId, ipAddress);

    if (!result.success) {
      const statusCode = result.error === 'User not found' ? 404 : 
                        result.error === 'Cannot delete your own account' ? 400 : 500;
      errorResponse(res, result.error || 'Failed to delete user', statusCode);
      return;
    }

    logger.info('User deleted via admin controller', {
      userId: id,
      adminUserId,
      service: 'electrical-pm-api',
      timestamp: new Date().toISOString()
    });

    successResponse(res, null, 'User deleted successfully');
  } catch (error) {
    logger.error('Delete user controller error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.params.id,
      adminUserId: req.user?.id,
      service: 'electrical-pm-api',
      timestamp: new Date().toISOString()
    });

    errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * Reset user password (SUPER_ADMIN only)
 */
export const resetUserPasswordController = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminUserId = req.user?.id;
    const { id } = req.params;
    const ipAddress = req.ip || 'unknown';

    if (!adminUserId) {
      errorResponse(res, 'Authentication required', 401);
      return;
    }

    if (!id) {
      errorResponse(res, 'User ID is required', 400);
      return;
    }

    const { newPassword } = req.body;

    if (!newPassword) {
      errorResponse(res, 'New password is required', 400);
      return;
    }

    const passwordData: ResetPasswordData = {
      newPassword
    };

    const result = await resetUserPassword(id, passwordData, adminUserId, ipAddress);

    if (!result.success) {
      const statusCode = result.error === 'User not found' ? 404 : 400;
      errorResponse(res, result.error || 'Failed to reset password', statusCode);
      return;
    }

    logger.info('User password reset via admin controller', {
      userId: id,
      adminUserId,
      service: 'electrical-pm-api',
      timestamp: new Date().toISOString()
    });

    successResponse(res, null, 'Password reset successfully');
  } catch (error) {
    logger.error('Reset user password controller error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.params.id,
      adminUserId: req.user?.id,
      service: 'electrical-pm-api',
      timestamp: new Date().toISOString()
    });

    errorResponse(res, 'Internal server error', 500);
  }
};
