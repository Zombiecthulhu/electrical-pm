import prisma from '../config/database';
import { logger } from '../utils/logger';

/**
 * Sign-In Service
 * Handles employee sign-in/sign-out operations for daily attendance
 */

interface SignInData {
  employeeId: string;
  date: Date;
  signInTime: Date;
  location?: string;
  projectId?: string;
  notes?: string;
}

interface SignInFilters {
  employeeId?: string;
  projectId?: string;
}

/**
 * Transform snake_case Prisma response to camelCase for frontend
 */
function transformSignInData(signIn: any): any {
  if (!signIn) return null;
  
  return {
    id: signIn.id,
    employeeId: signIn.employee_id,
    employee: signIn.employee ? {
      id: signIn.employee.id,
      firstName: signIn.employee.first_name,
      lastName: signIn.employee.last_name,
      classification: signIn.employee.classification,
    } : undefined,
    date: signIn.date,
    signInTime: signIn.sign_in_time,
    signOutTime: signIn.sign_out_time,
    location: signIn.location,
    projectId: signIn.project_id,
    project: signIn.project ? {
      id: signIn.project.id,
      name: signIn.project.name,
      projectNumber: signIn.project.project_number,
    } : undefined,
    notes: signIn.notes,
    signedInBy: signIn.signed_in_by,
    signedInByUser: signIn.signed_in_by_user ? {
      id: signIn.signed_in_by_user.id,
      firstName: signIn.signed_in_by_user.first_name,
      lastName: signIn.signed_in_by_user.last_name,
    } : undefined,
    signedOutBy: signIn.signed_out_by,
    signedOutByUser: signIn.signed_out_by_user ? {
      id: signIn.signed_out_by_user.id,
      firstName: signIn.signed_out_by_user.first_name,
      lastName: signIn.signed_out_by_user.last_name,
    } : undefined,
    createdAt: signIn.created_at,
    updatedAt: signIn.updated_at,
  };
}

/**
 * Get all sign-ins for a specific date with optional filters
 */
export const getSignInsForDate = async (date: Date, filters?: SignInFilters) => {
  try {
    const where: any = {
      date: date,
    };

    if (filters?.employeeId) {
      where.employee_id = filters.employeeId;
    }

    if (filters?.projectId) {
      where.project_id = filters.projectId;
    }

    const signIns = await prisma.dailySignIn.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            classification: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            project_number: true,
          },
        },
        signed_in_by_user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        signed_out_by_user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
      orderBy: {
        sign_in_time: 'desc',
      },
    });

    return signIns.map(transformSignInData);
  } catch (error) {
    logger.error('Error getting sign-ins for date', { date, filters, error });
    throw error;
  }
};

/**
 * Get all sign-ins for today
 */
export const getTodaySignIns = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return getSignInsForDate(today);
};

/**
 * Sign an employee in
 * Prevents duplicate sign-ins for same employee/date
 */
export const signIn = async (data: SignInData, signedInBy: string) => {
  try {
    // Check if employee has an ACTIVE sign-in (not signed out yet)
    const activeSignIn = await prisma.dailySignIn.findFirst({
      where: {
        employee_id: data.employeeId,
        date: data.date,
        sign_out_time: null, // Only check for active sign-ins
      },
    });

    if (activeSignIn) {
      throw new Error('Employee is already signed in and has not signed out yet');
    }

    const signIn = await prisma.dailySignIn.create({
      data: {
        employee_id: data.employeeId,
        date: data.date,
        sign_in_time: data.signInTime,
        location: data.location,
        project_id: data.projectId,
        notes: data.notes,
        signed_in_by: signedInBy,
      },
      include: {
        employee: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            classification: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            project_number: true,
          },
        },
        signed_in_by_user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    logger.info('Employee signed in successfully', {
      signInId: signIn.id,
      employeeId: data.employeeId,
      date: data.date,
      signedInBy,
    });

    return transformSignInData(signIn);
  } catch (error) {
    logger.error('Error signing in employee', { data, signedInBy, error });
    throw error;
  }
};

/**
 * Sign an employee out
 */
export const signOut = async (
  signInId: string,
  signOutTime: Date,
  signedOutBy: string
) => {
  try {
    const signIn = await prisma.dailySignIn.findUnique({
      where: { id: signInId },
    });

    if (!signIn) {
      throw new Error('Sign-in record not found');
    }

    if (signIn.sign_out_time) {
      throw new Error('Employee is already signed out');
    }

    const updatedSignIn = await prisma.dailySignIn.update({
      where: { id: signInId },
      data: {
        sign_out_time: signOutTime,
        signed_out_by: signedOutBy,
      },
      include: {
        employee: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            classification: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            project_number: true,
          },
        },
        signed_in_by_user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        signed_out_by_user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    logger.info('Employee signed out successfully', {
      signInId,
      employeeId: signIn.employee_id,
      signedOutBy,
    });

    return transformSignInData(updatedSignIn);
  } catch (error) {
    logger.error('Error signing out employee', { signInId, signedOutBy, error });
    throw error;
  }
};

/**
 * Sign multiple employees in at once (bulk operation)
 */
export const bulkSignIn = async (
  employeeIds: string[],
  date: Date,
  signInTime: Date,
  signedInBy: string,
  location?: string,
  projectId?: string
) => {
  try {
    // Check for ACTIVE sign-ins only (not signed out yet)
    const activeSignIns = await prisma.dailySignIn.findMany({
      where: {
        employee_id: { in: employeeIds },
        date: date,
        sign_out_time: null, // Only check for active sign-ins
      },
      select: {
        employee_id: true,
      },
    });

    const alreadySignedInIds = activeSignIns.map((s) => s.employee_id);
    const canSignInIds = employeeIds.filter(
      (id) => !alreadySignedInIds.includes(id)
    );

    if (canSignInIds.length === 0) {
      throw new Error('All selected employees are already signed in and have not signed out yet');
    }

    // Create sign-ins for employees who can sign in
    const signInData = canSignInIds.map((employeeId) => ({
      employee_id: employeeId,
      date: date,
      sign_in_time: signInTime,
      location: location,
      project_id: projectId,
      signed_in_by: signedInBy,
    }));

    await prisma.dailySignIn.createMany({
      data: signInData,
    });

    // Fetch the created sign-ins with relations
    const createdSignIns = await prisma.dailySignIn.findMany({
      where: {
        employee_id: { in: canSignInIds },
        date: date,
        sign_in_time: signInTime, // Use exact timestamp to get only the newly created ones
      },
      include: {
        employee: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            classification: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            project_number: true,
          },
        },
        signed_in_by_user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    logger.info('Bulk sign-in successful', {
      employeeCount: canSignInIds.length,
      date,
      signedInBy,
    });

    return {
      signedIn: createdSignIns.map(transformSignInData),
      alreadySignedIn: alreadySignedInIds,
    };
  } catch (error) {
    logger.error('Error in bulk sign-in', { employeeIds, date, signedInBy, error });
    throw error;
  }
};

/**
 * Get sign-in history for an employee within a date range
 */
export const getEmployeeSignInHistory = async (
  employeeId: string,
  startDate: Date,
  endDate: Date
) => {
  try {
    const signIns = await prisma.dailySignIn.findMany({
      where: {
        employee_id: employeeId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            project_number: true,
          },
        },
        signed_in_by_user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        signed_out_by_user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return signIns.map(transformSignInData);
  } catch (error) {
    logger.error('Error getting employee sign-in history', {
      employeeId,
      startDate,
      endDate,
      error,
    });
    throw error;
  }
};

/**
 * Check if an employee is signed in for a specific date
 */
export const isEmployeeSignedIn = async (employeeId: string, date: Date) => {
  try {
    // Check if employee has an active sign-in (not signed out yet)
    const activeSignIn = await prisma.dailySignIn.findFirst({
      where: {
        employee_id: employeeId,
        date: date,
        sign_out_time: null, // Only check for active sign-ins
      },
    });

    return activeSignIn !== null;
  } catch (error) {
    logger.error('Error checking if employee is signed in', {
      employeeId,
      date,
      error,
    });
    throw error;
  }
};

/**
 * Get all active sign-ins (not signed out yet)
 */
export const getActiveSignIns = async () => {
  try {
    const activeSignIns = await prisma.dailySignIn.findMany({
      where: {
        sign_out_time: null,
      },
      include: {
        employee: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            classification: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            project_number: true,
          },
        },
        signed_in_by_user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
      orderBy: {
        sign_in_time: 'desc',
      },
    });

    return activeSignIns.map(transformSignInData);
  } catch (error) {
    logger.error('Error getting active sign-ins', { error });
    throw error;
  }
};

