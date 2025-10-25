import prisma from '../config/database';
import { logger } from '../utils/logger';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Time Entry Service
 * Handles project time allocation and tracking
 */

interface TimeEntryData {
  employeeId: string;
  date: Date;
  projectId: string;
  hoursWorked: number;
  workType?: string;
  description?: string;
  taskPerformed?: string;
  hourlyRate?: number;
  startTime?: Date;
  endTime?: Date;
  signInId?: string;
}

interface TimeEntryFilters {
  employeeId?: string;
  projectId?: string;
  status?: string;
}

/**
 * Get all time entries for a specific date with optional filters
 */
export const getTimeEntriesForDate = async (
  date: Date,
  filters?: TimeEntryFilters
) => {
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

    if (filters?.status) {
      where.status = filters.status;
    }

    const timeEntries = await prisma.timeEntry.findMany({
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
        created_by_user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        approved_by_user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return timeEntries;
  } catch (error) {
    logger.error('Error getting time entries for date', { date, filters, error });
    throw error;
  }
};

/**
 * Get time entries for an employee within a date range
 */
export const getTimeEntriesForEmployee = async (
  employeeId: string,
  startDate: Date,
  endDate: Date
) => {
  try {
    const timeEntries = await prisma.timeEntry.findMany({
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
        created_by_user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        approved_by_user: {
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

    return timeEntries;
  } catch (error) {
    logger.error('Error getting time entries for employee', {
      employeeId,
      startDate,
      endDate,
      error,
    });
    throw error;
  }
};

/**
 * Get time entries for a project within a date range
 */
export const getTimeEntriesForProject = async (
  projectId: string,
  startDate: Date,
  endDate: Date
) => {
  try {
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        project_id: projectId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            classification: true,
            hourly_rate: true,
          },
        },
        created_by_user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        approved_by_user: {
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

    return timeEntries;
  } catch (error) {
    logger.error('Error getting time entries for project', {
      projectId,
      startDate,
      endDate,
      error,
    });
    throw error;
  }
};

/**
 * Create a new time entry
 * Validates hours are reasonable (0-24)
 */
export const create = async (data: TimeEntryData, createdBy: string) => {
  try {
    // Validate hours
    if (data.hoursWorked <= 0 || data.hoursWorked > 24) {
      throw new Error('Hours worked must be between 0 and 24');
    }

    // Calculate total cost if hourly rate is provided
    let totalCost = null;
    if (data.hourlyRate) {
      totalCost = data.hoursWorked * data.hourlyRate;
    }

    const timeEntry = await prisma.timeEntry.create({
      data: {
        employee_id: data.employeeId,
        date: data.date,
        project_id: data.projectId,
        hours_worked: new Decimal(data.hoursWorked),
        work_type: data.workType || 'Regular',
        description: data.description,
        task_performed: data.taskPerformed,
        hourly_rate: data.hourlyRate ? new Decimal(data.hourlyRate) : null,
        total_cost: totalCost ? new Decimal(totalCost) : null,
        start_time: data.startTime,
        end_time: data.endTime,
        sign_in_id: data.signInId,
        created_by: createdBy,
        status: 'PENDING',
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
        created_by_user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    logger.info('Time entry created successfully', {
      timeEntryId: timeEntry.id,
      employeeId: data.employeeId,
      projectId: data.projectId,
      hoursWorked: data.hoursWorked,
      createdBy,
    });

    return timeEntry;
  } catch (error) {
    logger.error('Error creating time entry', { data, createdBy, error });
    throw error;
  }
};

/**
 * Update a time entry
 */
export const update = async (
  id: string,
  data: Partial<TimeEntryData>,
  updatedBy: string
) => {
  try {
    // Validate hours if provided
    if (data.hoursWorked !== undefined) {
      if (data.hoursWorked <= 0 || data.hoursWorked > 24) {
        throw new Error('Hours worked must be between 0 and 24');
      }
    }

    // Prepare update data
    const updateData: any = {
      updated_by: updatedBy,
    };

    if (data.hoursWorked !== undefined) {
      updateData.hours_worked = new Decimal(data.hoursWorked);

      // Recalculate total cost if hours changed and hourly rate exists
      const existing = await prisma.timeEntry.findUnique({
        where: { id },
        select: { hourly_rate: true },
      });

      if (existing?.hourly_rate) {
        updateData.total_cost = new Decimal(data.hoursWorked).mul(
          existing.hourly_rate
        );
      }
    }

    if (data.workType !== undefined) updateData.work_type = data.workType;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.taskPerformed !== undefined)
      updateData.task_performed = data.taskPerformed;
    if (data.startTime !== undefined) updateData.start_time = data.startTime;
    if (data.endTime !== undefined) updateData.end_time = data.endTime;

    if (data.hourlyRate !== undefined) {
      updateData.hourly_rate = data.hourlyRate
        ? new Decimal(data.hourlyRate)
        : null;

      // Recalculate total cost if hourly rate changed
      const existing = await prisma.timeEntry.findUnique({
        where: { id },
        select: { hours_worked: true },
      });

      if (existing?.hours_worked && data.hourlyRate) {
        updateData.total_cost = existing.hours_worked.mul(
          new Decimal(data.hourlyRate)
        );
      }
    }

    const timeEntry = await prisma.timeEntry.update({
      where: { id },
      data: updateData,
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
        created_by_user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        approved_by_user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    logger.info('Time entry updated successfully', {
      timeEntryId: id,
      updatedBy,
    });

    return timeEntry;
  } catch (error) {
    logger.error('Error updating time entry', { id, data, updatedBy, error });
    throw error;
  }
};

/**
 * Delete a time entry (hard delete)
 */
export const deleteTimeEntry = async (id: string) => {
  try {
    await prisma.timeEntry.delete({
      where: { id },
    });

    logger.info('Time entry deleted successfully', { timeEntryId: id });

    return { success: true };
  } catch (error) {
    logger.error('Error deleting time entry', { id, error });
    throw error;
  }
};

/**
 * Create multiple time entries at once (bulk operation)
 */
export const bulkCreate = async (
  entries: TimeEntryData[],
  createdBy: string
) => {
  try {
    // Validate all entries
    for (const entry of entries) {
      if (entry.hoursWorked <= 0 || entry.hoursWorked > 24) {
        throw new Error(
          `Invalid hours (${entry.hoursWorked}) for employee ${entry.employeeId}`
        );
      }
    }

    // Prepare data for bulk insert
    const timeEntryData = entries.map((entry) => {
      const totalCost = entry.hourlyRate
        ? entry.hoursWorked * entry.hourlyRate
        : null;

      return {
        employee_id: entry.employeeId,
        date: entry.date,
        project_id: entry.projectId,
        hours_worked: new Decimal(entry.hoursWorked),
        work_type: entry.workType || 'Regular',
        description: entry.description,
        task_performed: entry.taskPerformed,
        hourly_rate: entry.hourlyRate ? new Decimal(entry.hourlyRate) : null,
        total_cost: totalCost ? new Decimal(totalCost) : null,
        start_time: entry.startTime,
        end_time: entry.endTime,
        sign_in_id: entry.signInId,
        created_by: createdBy,
        status: 'PENDING',
      };
    });

    await prisma.timeEntry.createMany({
      data: timeEntryData,
    });

    // Fetch the created entries
    const employeeIds = entries.map((e) => e.employeeId);
    const date = entries[0].date; // Assuming all entries are for the same date

    const createdEntries = await prisma.timeEntry.findMany({
      where: {
        employee_id: { in: employeeIds },
        date: date,
        created_by: createdBy,
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
        created_by_user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    logger.info('Bulk time entries created successfully', {
      count: entries.length,
      createdBy,
    });

    return createdEntries;
  } catch (error) {
    logger.error('Error creating bulk time entries', { entries, createdBy, error });
    throw error;
  }
};

/**
 * Calculate total hours for an employee on a specific day
 */
export const calculateDayTotal = async (employeeId: string, date: Date) => {
  try {
    const entries = await prisma.timeEntry.findMany({
      where: {
        employee_id: employeeId,
        date: date,
      },
      select: {
        hours_worked: true,
      },
    });

    const totalHours = entries.reduce(
      (sum, entry) => sum + Number(entry.hours_worked),
      0
    );

    return totalHours;
  } catch (error) {
    logger.error('Error calculating day total', { employeeId, date, error });
    throw error;
  }
};

/**
 * Automatically create time entry from sign-in/sign-out times
 */
export const autoCreateFromSignIn = async (
  signInId: string,
  projectId: string,
  createdBy: string
) => {
  try {
    const signIn = await prisma.dailySignIn.findUnique({
      where: { id: signInId },
      include: {
        employee: {
          select: {
            id: true,
            hourly_rate: true,
          },
        },
      },
    });

    if (!signIn) {
      throw new Error('Sign-in record not found');
    }

    if (!signIn.sign_out_time) {
      throw new Error('Employee has not signed out yet');
    }

    // Calculate hours worked
    const signInTime = new Date(signIn.sign_in_time);
    const signOutTime = new Date(signIn.sign_out_time);
    const milliseconds = signOutTime.getTime() - signInTime.getTime();
    const hoursWorked = milliseconds / (1000 * 60 * 60);

    // Round to 2 decimal places
    const roundedHours = Math.round(hoursWorked * 100) / 100;

    // Create time entry
    const timeEntryData: TimeEntryData = {
      employeeId: signIn.employee_id,
      date: signIn.date,
      projectId: projectId,
      hoursWorked: roundedHours,
      startTime: signIn.sign_in_time,
      endTime: signIn.sign_out_time,
      signInId: signInId,
      hourlyRate: signIn.employee.hourly_rate
        ? Number(signIn.employee.hourly_rate)
        : undefined,
    };

    const timeEntry = await create(timeEntryData, createdBy);

    logger.info('Time entry auto-created from sign-in', {
      signInId,
      timeEntryId: timeEntry.id,
      hoursWorked: roundedHours,
    });

    return timeEntry;
  } catch (error) {
    logger.error('Error auto-creating time entry from sign-in', {
      signInId,
      projectId,
      createdBy,
      error,
    });
    throw error;
  }
};

/**
 * Approve a time entry
 */
export const approve = async (id: string, approvedBy: string) => {
  try {
    const timeEntry = await prisma.timeEntry.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approved_by: approvedBy,
        approved_at: new Date(),
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
        created_by_user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        approved_by_user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    logger.info('Time entry approved', {
      timeEntryId: id,
      approvedBy,
    });

    return timeEntry;
  } catch (error) {
    logger.error('Error approving time entry', { id, approvedBy, error });
    throw error;
  }
};

/**
 * Reject a time entry
 */
export const reject = async (id: string, approvedBy: string, reason: string) => {
  try {
    const timeEntry = await prisma.timeEntry.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approved_by: approvedBy,
        approved_at: new Date(),
        description: reason,
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
        created_by_user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        approved_by_user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    logger.info('Time entry rejected', {
      timeEntryId: id,
      approvedBy,
      reason,
    });

    return timeEntry;
  } catch (error) {
    logger.error('Error rejecting time entry', { id, approvedBy, reason, error });
    throw error;
  }
};

/**
 * Get all unapproved time entries
 */
export const getUnapprovedEntries = async () => {
  try {
    const unapprovedEntries = await prisma.timeEntry.findMany({
      where: {
        status: 'PENDING',
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
        created_by_user: {
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

    return unapprovedEntries;
  } catch (error) {
    logger.error('Error getting unapproved entries', { error });
    throw error;
  }
};

