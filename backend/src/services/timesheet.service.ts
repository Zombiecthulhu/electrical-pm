import prisma from '../config/database';
import { logger } from '../utils/logger';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Timesheet Service
 * Handles timesheet operations (containers for time entries)
 */

interface TimesheetData {
  date: Date;
  title?: string;
  notes?: string;
  employeeIds: string[]; // Employees to include
  timeEntries: TimeEntryInput[];
}

interface TimeEntryInput {
  employeeId: string;
  projectId: string;
  hoursWorked: number;
  workType?: string;
  description?: string;
  taskPerformed?: string;
}

interface UpdateTimesheetData {
  title?: string;
  notes?: string;
  status?: string;
  timeEntries?: TimeEntryInput[];
}

/**
 * Transform snake_case Prisma response to camelCase for frontend
 */
function transformTimesheetData(timesheet: any): any {
  if (!timesheet) return null;

  return {
    id: timesheet.id,
    date: timesheet.date,
    status: timesheet.status,
    title: timesheet.title,
    notes: timesheet.notes,
    submittedAt: timesheet.submitted_at,
    submittedBy: timesheet.submitted_by,
    submittedByUser: timesheet.submitted_by_user ? {
      id: timesheet.submitted_by_user.id,
      firstName: timesheet.submitted_by_user.first_name,
      lastName: timesheet.submitted_by_user.last_name,
    } : undefined,
    approvedAt: timesheet.approved_at,
    approvedBy: timesheet.approved_by,
    approvedByUser: timesheet.approved_by_user ? {
      id: timesheet.approved_by_user.id,
      firstName: timesheet.approved_by_user.first_name,
      lastName: timesheet.approved_by_user.last_name,
    } : undefined,
    createdBy: timesheet.created_by,
    createdByUser: timesheet.created_by_user ? {
      id: timesheet.created_by_user.id,
      firstName: timesheet.created_by_user.first_name,
      lastName: timesheet.created_by_user.last_name,
    } : undefined,
    createdAt: timesheet.created_at,
    updatedAt: timesheet.updated_at,
    // Transform time entries if included
    timeEntries: timesheet.time_entries ? timesheet.time_entries.map((entry: any) => transformTimeEntryData(entry)) : undefined,
  };
}

function transformTimeEntryData(entry: any): any {
  if (!entry) return null;

  return {
    id: entry.id,
    timesheetId: entry.timesheet_id,
    employeeId: entry.employee_id,
    employee: entry.employee ? {
      id: entry.employee.id,
      firstName: entry.employee.first_name,
      lastName: entry.employee.last_name,
      classification: entry.employee.classification,
    } : undefined,
    date: entry.date,
    projectId: entry.project_id,
    project: entry.project ? {
      id: entry.project.id,
      name: entry.project.name,
      projectNumber: entry.project.project_number,
    } : undefined,
    hoursWorked: Number(entry.hours_worked),
    workType: entry.work_type,
    description: entry.description,
    taskPerformed: entry.task_performed,
    startTime: entry.start_time,
    endTime: entry.end_time,
    hourlyRate: entry.hourly_rate ? Number(entry.hourly_rate) : undefined,
    totalCost: entry.total_cost ? Number(entry.total_cost) : undefined,
    status: entry.status,
    signInId: entry.sign_in_id,
    createdBy: entry.created_by,
    createdAt: entry.created_at,
    updatedAt: entry.updated_at,
  };
}

/**
 * Get all timesheets with optional filters
 */
export const getAllTimesheets = async (filters?: {
  status?: string;
  startDate?: Date;
  endDate?: Date;
  createdBy?: string;
}) => {
  try {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) {
        where.date.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.date.lte = filters.endDate;
      }
    }

    if (filters?.createdBy) {
      where.created_by = filters.createdBy;
    }

    const timesheets = await prisma.timesheet.findMany({
      where,
      include: {
        created_by_user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        submitted_by_user: {
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
        _count: {
          select: { time_entries: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    return timesheets.map((ts: any) => ({
      ...transformTimesheetData(ts),
      entryCount: ts._count.time_entries,
    }));
  } catch (error: any) {
    logger.error('Error fetching timesheets', { error: error.message });
    throw new Error('Failed to fetch timesheets');
  }
};

/**
 * Get a single timesheet by ID with all time entries
 */
export const getTimesheetById = async (id: string) => {
  try {
    const timesheet = await prisma.timesheet.findUnique({
      where: { id },
      include: {
        time_entries: {
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
          },
          orderBy: [
            { employee_id: 'asc' },
            { created_at: 'asc' },
          ],
        },
        created_by_user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        submitted_by_user: {
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

    if (!timesheet) {
      throw new Error('Timesheet not found');
    }

    return transformTimesheetData(timesheet);
  } catch (error: any) {
    logger.error('Error fetching timesheet', { id, error: error.message });
    throw error;
  }
};

/**
 * Create a new timesheet with time entries
 */
export const createTimesheet = async (data: TimesheetData, userId: string) => {
  try {
    const timesheet = await prisma.$transaction(async (tx) => {
      // Create timesheet
      const newTimesheet = await tx.timesheet.create({
        data: {
          date: data.date,
          title: data.title,
          notes: data.notes,
          status: 'DRAFT',
          created_by: userId,
        },
        include: {
          created_by_user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
            },
          },
        },
      });

      // Create time entries if provided
      if (data.timeEntries && data.timeEntries.length > 0) {
        await tx.timeEntry.createMany({
          data: data.timeEntries.map((entry) => ({
            timesheet_id: newTimesheet.id,
            employee_id: entry.employeeId,
            project_id: entry.projectId,
            date: data.date,
            hours_worked: new Decimal(entry.hoursWorked),
            work_type: entry.workType || 'Regular',
            description: entry.description,
            task_performed: entry.taskPerformed,
            status: 'PENDING',
            created_by: userId,
          })),
        });

        // Fetch the complete timesheet with entries
        return await tx.timesheet.findUnique({
          where: { id: newTimesheet.id },
          include: {
            time_entries: {
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
      }

      return newTimesheet;
    });

    logger.info('Timesheet created successfully', { timesheetId: timesheet!.id, userId });
    return transformTimesheetData(timesheet);
  } catch (error: any) {
    logger.error('Error creating timesheet', { error: error.message, userId });
    throw new Error('Failed to create timesheet');
  }
};

/**
 * Update an existing timesheet
 */
export const updateTimesheet = async (
  id: string,
  data: UpdateTimesheetData,
  userId: string
) => {
  try {
    const timesheet = await prisma.$transaction(async (tx) => {
      // Check if timesheet exists and is editable
      const existing = await tx.timesheet.findUnique({
        where: { id },
        select: { status: true, date: true },
      });

      if (!existing) {
        throw new Error('Timesheet not found');
      }

      if (existing.status === 'APPROVED') {
        throw new Error('Cannot edit approved timesheet');
      }

      // Update timesheet
      const updateData: any = {
        updated_by: userId,
      };

      if (data.title !== undefined) updateData.title = data.title;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.status !== undefined) updateData.status = data.status;

      const updated = await tx.timesheet.update({
        where: { id },
        data: updateData,
        include: {
          created_by_user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
            },
          },
        },
      });

      // Update time entries if provided
      if (data.timeEntries) {
        // Delete existing entries
        await tx.timeEntry.deleteMany({
          where: { timesheet_id: id },
        });

        // Create new entries
        if (data.timeEntries.length > 0) {
          await tx.timeEntry.createMany({
            data: data.timeEntries.map((entry) => ({
              timesheet_id: id,
              employee_id: entry.employeeId,
              project_id: entry.projectId,
              date: existing.date,
              hours_worked: new Decimal(entry.hoursWorked),
              work_type: entry.workType || 'Regular',
              description: entry.description,
              task_performed: entry.taskPerformed,
              status: 'PENDING',
              created_by: userId,
            })),
          });
        }

        // Fetch the complete updated timesheet with entries
        return await tx.timesheet.findUnique({
          where: { id },
          include: {
            time_entries: {
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
      }

      return updated;
    });

    logger.info('Timesheet updated successfully', { timesheetId: id, userId });
    return transformTimesheetData(timesheet);
  } catch (error: any) {
    logger.error('Error updating timesheet', { id, error: error.message, userId });
    throw error;
  }
};

/**
 * Submit a timesheet (change status from DRAFT to SUBMITTED)
 */
export const submitTimesheet = async (id: string, userId: string) => {
  try {
    const timesheet = await prisma.timesheet.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        submitted_at: new Date(),
        submitted_by: userId,
        updated_by: userId,
      },
      include: {
        time_entries: {
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
          },
        },
        created_by_user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        submitted_by_user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    logger.info('Timesheet submitted successfully', { timesheetId: id, userId });
    return transformTimesheetData(timesheet);
  } catch (error: any) {
    logger.error('Error submitting timesheet', { id, error: error.message, userId });
    throw new Error('Failed to submit timesheet');
  }
};

/**
 * Approve a timesheet
 */
export const approveTimesheet = async (id: string, userId: string) => {
  try {
    const timesheet = await prisma.timesheet.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approved_at: new Date(),
        approved_by: userId,
        updated_by: userId,
      },
      include: {
        time_entries: true,
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

    // Also approve all related time entries
    await prisma.timeEntry.updateMany({
      where: { timesheet_id: id },
      data: {
        status: 'APPROVED',
        approved_by: userId,
        approved_at: new Date(),
      },
    });

    logger.info('Timesheet approved successfully', { timesheetId: id, userId });
    return transformTimesheetData(timesheet);
  } catch (error: any) {
    logger.error('Error approving timesheet', { id, error: error.message, userId });
    throw new Error('Failed to approve timesheet');
  }
};

/**
 * Delete a timesheet (only drafts can be deleted)
 */
export const deleteTimesheet = async (id: string) => {
  try {
    // Check if timesheet is deletable
    const existing = await prisma.timesheet.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!existing) {
      throw new Error('Timesheet not found');
    }

    if (existing.status !== 'DRAFT') {
      throw new Error('Only draft timesheets can be deleted');
    }

    // Delete time entries first (cascade should handle this, but being explicit)
    await prisma.timeEntry.deleteMany({
      where: { timesheet_id: id },
    });

    // Delete timesheet
    await prisma.timesheet.delete({
      where: { id },
    });

    logger.info('Timesheet deleted successfully', { timesheetId: id });
    return { success: true };
  } catch (error: any) {
    logger.error('Error deleting timesheet', { id, error: error.message });
    throw error;
  }
};

/**
 * Get timesheets for a specific date
 */
export const getTimesheetsForDate = async (date: Date) => {
  try {
    const timesheets = await prisma.timesheet.findMany({
      where: { date },
      include: {
        time_entries: {
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
      orderBy: { created_at: 'desc' },
    });

    return timesheets.map(transformTimesheetData);
  } catch (error: any) {
    logger.error('Error fetching timesheets for date', { date, error: error.message });
    throw new Error('Failed to fetch timesheets for date');
  }
};

