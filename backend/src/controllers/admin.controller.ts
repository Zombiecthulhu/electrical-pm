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
export const createUserController = async (req: Request, res: Response): Promise<Response | undefined> => {
  try {
    const adminUserId = req.user?.id;
    const ipAddress = req.ip || 'unknown';

    if (!adminUserId) {
      return res.status(401).json(errorResponse('Authentication required', 'UNAUTHORIZED'));
      return;
    }

    const { email, password, firstName, lastName, phone, role } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !phone || !role) {
      return res.status(400).json(errorResponse('All fields are required', 'MISSING_FIELDS'));
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
      return res.status(400).json(errorResponse(result.error || 'Failed to create user', 'CREATE_USER_FAILED'));
    }

    logger.info('User created via admin controller', {
      userId: result.user?.id,
      email: result.user?.email,
      role: result.user?.role,
      adminUserId,
      service: 'electrical-pm-api',
      timestamp: new Date().toISOString()
    });

    return res.status(201).json(successResponse({ user: result.user }, 'User created successfully'));
  } catch (error) {
    logger.error('Create user controller error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminUserId: req.user?.id,
      service: 'electrical-pm-api',
      timestamp: new Date().toISOString()
    });

    return res.status(500).json(errorResponse('Internal server error', 'INTERNAL_ERROR'));
  }
};

/**
 * Get all users (SUPER_ADMIN only)
 */
export const getAllUsersController = async (req: Request, res: Response): Promise<Response | undefined> => {
  try {
    const adminUserId = req.user?.id;

    if (!adminUserId) {
      return res.status(401).json(errorResponse('Authentication required', 'UNAUTHORIZED'));
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json(errorResponse('Invalid pagination parameters', 'INVALID_PAGINATION'));
    }

    const result = await getAllUsers(adminUserId, page, limit);

    if (!result.success) {
      return res.status(500).json(errorResponse(result.error || 'Failed to retrieve users', 'RETRIEVE_USERS_FAILED'));
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

    return res.json(successResponse({
      users: result.users,
      pagination: {
        page,
        limit,
        total: result.total || 0,
        totalPages: Math.ceil((result.total || 0) / limit)
      }
    }, 'Users retrieved successfully'));
  } catch (error) {
    logger.error('Get all users controller error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminUserId: req.user?.id,
      service: 'electrical-pm-api',
      timestamp: new Date().toISOString()
    });

    return res.status(500).json(errorResponse('Internal server error', 'INTERNAL_ERROR'));
  }
};

/**
 * Get user by ID (SUPER_ADMIN only)
 */
export const getUserByIdController = async (req: Request, res: Response): Promise<Response | undefined> => {
  try {
    const adminUserId = req.user?.id;
    const { id } = req.params;

    if (!adminUserId) {
      return res.status(401).json(errorResponse('Authentication required', 'UNAUTHORIZED'));
      return;
    }

    if (!id) {
      return res.status(400).json(errorResponse('User ID is required', 'MISSING_USER_ID'));
      return;
    }

    const result = await getUserById(id, adminUserId);

    if (!result.success) {
      const statusCode = result.error === 'User not found' ? 404 : 500;
      return res.status(statusCode).json(errorResponse(result.error || 'Failed to retrieve user', 'RETRIEVE_USER_FAILED'));
    }

    logger.info('User retrieved via admin controller', {
      userId: id,
      adminUserId,
      service: 'electrical-pm-api',
      timestamp: new Date().toISOString()
    });

    return res.json(successResponse({ user: result.user }, 'User retrieved successfully'));
  } catch (error) {
    logger.error('Get user by ID controller error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.params.id,
      adminUserId: req.user?.id,
      service: 'electrical-pm-api',
      timestamp: new Date().toISOString()
    });

    return res.status(500).json(errorResponse('Internal server error', 'INTERNAL_ERROR'));
  }
};

/**
 * Update user (SUPER_ADMIN only)
 */
export const updateUserController = async (req: Request, res: Response): Promise<Response | undefined> => {
  try {
    const adminUserId = req.user?.id;
    const { id } = req.params;
    const ipAddress = req.ip || 'unknown';

    if (!adminUserId) {
      return res.status(401).json(errorResponse('Authentication required', 'UNAUTHORIZED'));
      return;
    }

    if (!id) {
      return res.status(400).json(errorResponse('User ID is required', 'MISSING_USER_ID'));
      return;
    }

    const { email, firstName, lastName, phone, role, isActive } = req.body;

    // Validate that at least one field is provided for update
    if (!email && !firstName && !lastName && !phone && !role && isActive === undefined) {
      return res.status(400).json(errorResponse('At least one field must be provided for update', 'MISSING_UPDATE_FIELDS'));
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
      return res.status(statusCode).json(errorResponse(result.error || 'Failed to update user', 'UPDATE_USER_FAILED'));
    }

    logger.info('User updated via admin controller', {
      userId: id,
      updatedFields: Object.keys(userData),
      adminUserId,
      service: 'electrical-pm-api',
      timestamp: new Date().toISOString()
    });

    return res.json(successResponse({ user: result.user }, 'User updated successfully'));
  } catch (error) {
    logger.error('Update user controller error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.params.id,
      adminUserId: req.user?.id,
      service: 'electrical-pm-api',
      timestamp: new Date().toISOString()
    });

    return res.status(500).json(errorResponse('Internal server error', 'INTERNAL_ERROR'));
  }
};

/**
 * Delete user (SUPER_ADMIN only)
 */
export const deleteUserController = async (req: Request, res: Response): Promise<Response | undefined> => {
  try {
    const adminUserId = req.user?.id;
    const { id } = req.params;
    const ipAddress = req.ip || 'unknown';

    if (!adminUserId) {
      return res.status(401).json(errorResponse('Authentication required', 'UNAUTHORIZED'));
      return;
    }

    if (!id) {
      return res.status(400).json(errorResponse('User ID is required', 'MISSING_USER_ID'));
      return;
    }

    const result = await deleteUser(id, adminUserId, ipAddress);

    if (!result.success) {
      const statusCode = result.error === 'User not found' ? 404 : 
                        result.error === 'Cannot delete your own account' ? 400 : 500;
      return res.status(statusCode).json(errorResponse(result.error || 'Failed to delete user', 'DELETE_USER_FAILED'));
    }

    logger.info('User deleted via admin controller', {
      userId: id,
      adminUserId,
      service: 'electrical-pm-api',
      timestamp: new Date().toISOString()
    });

    return res.json(successResponse(null, 'User deleted successfully'));
  } catch (error) {
    logger.error('Delete user controller error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.params.id,
      adminUserId: req.user?.id,
      service: 'electrical-pm-api',
      timestamp: new Date().toISOString()
    });

    return res.status(500).json(errorResponse('Internal server error', 'INTERNAL_ERROR'));
  }
};

/**
 * Reset user password (SUPER_ADMIN only)
 */
export const resetUserPasswordController = async (req: Request, res: Response): Promise<Response | undefined> => {
  try {
    const adminUserId = req.user?.id;
    const { id } = req.params;
    const ipAddress = req.ip || 'unknown';

    if (!adminUserId) {
      return res.status(401).json(errorResponse('Authentication required', 'UNAUTHORIZED'));
      return;
    }

    if (!id) {
      return res.status(400).json(errorResponse('User ID is required', 'MISSING_USER_ID'));
      return;
    }

    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json(errorResponse('New password is required', 'MISSING_PASSWORD'));
    }

    const passwordData: ResetPasswordData = {
      newPassword
    };

    const result = await resetUserPassword(id, passwordData, adminUserId, ipAddress);

    if (!result.success) {
      const statusCode = result.error === 'User not found' ? 404 : 400;
      return res.status(statusCode).json(errorResponse(result.error || 'Failed to reset password', 'RESET_PASSWORD_FAILED'));
    }

    logger.info('User password reset via admin controller', {
      userId: id,
      adminUserId,
      service: 'electrical-pm-api',
      timestamp: new Date().toISOString()
    });

    return res.json(successResponse(null, 'Password reset successfully'));
  } catch (error) {
    logger.error('Reset user password controller error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.params.id,
      adminUserId: req.user?.id,
      service: 'electrical-pm-api',
      timestamp: new Date().toISOString()
    });

    return res.status(500).json(errorResponse('Internal server error', 'INTERNAL_ERROR'));
  }
};
