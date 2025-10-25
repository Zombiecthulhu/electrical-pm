import prisma from '../config/database';
import { logger } from '../utils/logger';

/**
 * Payroll Service
 * Generates payroll reports and exports to CSV
 */

interface DailyReportEmployee {
  employeeId: string;
  firstName: string;
  lastName: string;
  classification: string;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  projects: Array<{
    projectId: string;
    projectName: string;
    hoursWorked: number;
  }>;
  signInTime?: Date;
  signOutTime?: Date;
}

interface DailyReport {
  date: Date;
  employees: DailyReportEmployee[];
  grandTotalHours: number;
}

/**
 * Calculate overtime based on daily hours
 * Overtime = any hours over 8 in a day
 */
const calculateOvertimeDaily = (hours: number) => {
  if (hours <= 8) {
    return { regular: hours, overtime: 0 };
  } else {
    return { regular: 8, overtime: hours - 8 };
  }
};

/**
 * Generate daily payroll report
 */
export const generateDailyReport = async (date: Date): Promise<DailyReport> => {
  try {
    // Get all time entries for the date
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        date: date,
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
      },
    });

    // Get sign-ins for the date
    const signIns = await prisma.dailySignIn.findMany({
      where: {
        date: date,
      },
      select: {
        employee_id: true,
        sign_in_time: true,
        sign_out_time: true,
      },
    });

    // Create a map of sign-in times by employee
    const signInMap = new Map();
    signIns.forEach((signIn) => {
      signInMap.set(signIn.employee_id, {
        signInTime: signIn.sign_in_time,
        signOutTime: signIn.sign_out_time,
      });
    });

    // Group time entries by employee
    const employeeMap = new Map<string, DailyReportEmployee>();

    timeEntries.forEach((entry) => {
      const employeeId = entry.employee_id;

      if (!employeeMap.has(employeeId)) {
        const signInData = signInMap.get(employeeId);
        employeeMap.set(employeeId, {
          employeeId: employeeId,
          firstName: entry.employee.first_name,
          lastName: entry.employee.last_name,
          classification: entry.employee.classification,
          totalHours: 0,
          regularHours: 0,
          overtimeHours: 0,
          projects: [],
          signInTime: signInData?.signInTime,
          signOutTime: signInData?.signOutTime,
        });
      }

      const employeeData = employeeMap.get(employeeId)!;
      const hours = Number(entry.hours_worked);

      employeeData.totalHours += hours;
      employeeData.projects.push({
        projectId: entry.project_id,
        projectName: entry.project.name,
        hoursWorked: hours,
      });
    });

    // Calculate regular and overtime hours for each employee
    const employees: DailyReportEmployee[] = Array.from(employeeMap.values()).map(
      (employee) => {
        const { regular, overtime } = calculateOvertimeDaily(employee.totalHours);
        return {
          ...employee,
          regularHours: regular,
          overtimeHours: overtime,
        };
      }
    );

    // Calculate grand total
    const grandTotalHours = employees.reduce(
      (sum, emp) => sum + emp.totalHours,
      0
    );

    const report: DailyReport = {
      date: date,
      employees: employees,
      grandTotalHours: grandTotalHours,
    };

    logger.info('Daily payroll report generated', {
      date,
      employeeCount: employees.length,
      totalHours: grandTotalHours,
    });

    return report;
  } catch (error) {
    logger.error('Error generating daily report', { date, error });
    throw error;
  }
};

/**
 * Generate weekly payroll report
 */
export const generateWeeklyReport = async (startDate: Date, endDate: Date) => {
  try {
    // Get all time entries for the week
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
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
      orderBy: {
        date: 'asc',
      },
    });

    // Group by employee
    const employeeMap = new Map<
      string,
      {
        employeeId: string;
        firstName: string;
        lastName: string;
        classification: string;
        dailyHours: { date: Date; hours: number; projects: any[] }[];
        totalHours: number;
        regularHours: number;
        overtimeHours: number;
      }
    >();

    timeEntries.forEach((entry) => {
      const employeeId = entry.employee_id;
      const dateStr = entry.date.toISOString().split('T')[0];

      if (!employeeMap.has(employeeId)) {
        employeeMap.set(employeeId, {
          employeeId: employeeId,
          firstName: entry.employee.first_name,
          lastName: entry.employee.last_name,
          classification: entry.employee.classification,
          dailyHours: [],
          totalHours: 0,
          regularHours: 0,
          overtimeHours: 0,
        });
      }

      const employeeData = employeeMap.get(employeeId)!;
      const hours = Number(entry.hours_worked);

      // Find or create daily entry
      let dayEntry = employeeData.dailyHours.find(
        (d) => d.date.toISOString().split('T')[0] === dateStr
      );
      if (!dayEntry) {
        dayEntry = { date: entry.date, hours: 0, projects: [] };
        employeeData.dailyHours.push(dayEntry);
      }

      dayEntry.hours += hours;
      dayEntry.projects.push({
        projectId: entry.project_id,
        projectName: entry.project.name,
        hoursWorked: hours,
      });

      employeeData.totalHours += hours;
    });

    // Calculate overtime (over 40 hours per week)
    const employees = Array.from(employeeMap.values()).map((employee) => {
      if (employee.totalHours <= 40) {
        employee.regularHours = employee.totalHours;
        employee.overtimeHours = 0;
      } else {
        employee.regularHours = 40;
        employee.overtimeHours = employee.totalHours - 40;
      }
      return employee;
    });

    const grandTotalHours = employees.reduce(
      (sum, emp) => sum + emp.totalHours,
      0
    );

    const report = {
      startDate,
      endDate,
      employees,
      grandTotalHours,
    };

    logger.info('Weekly payroll report generated', {
      startDate,
      endDate,
      employeeCount: employees.length,
      totalHours: grandTotalHours,
    });

    return report;
  } catch (error) {
    logger.error('Error generating weekly report', { startDate, endDate, error });
    throw error;
  }
};

/**
 * Generate project cost report
 */
export const generateProjectCostReport = async (
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
        project: {
          select: {
            id: true,
            name: true,
            project_number: true,
          },
        },
      },
    });

    const project = timeEntries[0]?.project || null;

    if (!project) {
      throw new Error('Project not found or has no time entries');
    }

    // Calculate breakdown by employee
    const employeeMap = new Map<
      string,
      {
        employeeId: string;
        name: string;
        classification: string;
        hours: number;
        rate: number | null;
        cost: number;
      }
    >();

    let totalHours = 0;
    let totalCost = 0;

    timeEntries.forEach((entry) => {
      const employeeId = entry.employee_id;
      const hours = Number(entry.hours_worked);
      const rate = entry.hourly_rate
        ? Number(entry.hourly_rate)
        : entry.employee.hourly_rate
        ? Number(entry.employee.hourly_rate)
        : null;

      const cost = rate ? hours * rate : 0;

      if (!employeeMap.has(employeeId)) {
        employeeMap.set(employeeId, {
          employeeId: employeeId,
          name: `${entry.employee.first_name} ${entry.employee.last_name}`,
          classification: entry.employee.classification,
          hours: 0,
          rate: rate,
          cost: 0,
        });
      }

      const employeeData = employeeMap.get(employeeId)!;
      employeeData.hours += hours;
      employeeData.cost += cost;

      totalHours += hours;
      totalCost += cost;
    });

    const breakdown = Array.from(employeeMap.values());

    const report = {
      projectId: project.id,
      projectName: project.name,
      projectNumber: project.project_number,
      startDate,
      endDate,
      totalHours,
      totalCost,
      breakdown,
    };

    logger.info('Project cost report generated', {
      projectId,
      startDate,
      endDate,
      totalHours,
      totalCost,
    });

    return report;
  } catch (error) {
    logger.error('Error generating project cost report', {
      projectId,
      startDate,
      endDate,
      error,
    });
    throw error;
  }
};

/**
 * Export daily report as CSV
 */
export const exportDailyReportCSV = async (date: Date): Promise<string> => {
  try {
    const report = await generateDailyReport(date);

    // CSV Headers
    const headers = [
      'Employee ID',
      'First Name',
      'Last Name',
      'Classification',
      'Date',
      'Project ID',
      'Project Name',
      'Hours',
      'Work Type',
      'Sign In Time',
      'Sign Out Time',
    ];

    const rows: string[][] = [headers];

    // Add data rows
    report.employees.forEach((employee) => {
      employee.projects.forEach((project) => {
        const workType =
          employee.overtimeHours > 0 &&
          project.hoursWorked > 8 - (employee.totalHours - employee.overtimeHours)
            ? 'Overtime'
            : 'Regular';

        rows.push([
          employee.employeeId,
          employee.firstName,
          employee.lastName,
          employee.classification,
          date.toISOString().split('T')[0],
          project.projectId,
          project.projectName,
          project.hoursWorked.toFixed(2),
          workType,
          employee.signInTime
            ? employee.signInTime.toLocaleTimeString()
            : 'N/A',
          employee.signOutTime
            ? employee.signOutTime.toLocaleTimeString()
            : 'N/A',
        ]);
      });
    });

    // Convert to CSV string
    const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

    logger.info('Daily CSV report exported', { date, rowCount: rows.length - 1 });

    return csv;
  } catch (error) {
    logger.error('Error exporting daily CSV report', { date, error });
    throw error;
  }
};

/**
 * Export weekly report as CSV
 */
export const exportWeeklyReportCSV = async (
  startDate: Date,
  endDate: Date
): Promise<string> => {
  try {
    const report = await generateWeeklyReport(startDate, endDate);

    // CSV Headers
    const headers = [
      'Employee ID',
      'First Name',
      'Last Name',
      'Classification',
      'Week Start',
      'Week End',
      'Total Hours',
      'Regular Hours',
      'Overtime Hours',
      'Projects',
    ];

    const rows: string[][] = [headers];

    // Add data rows
    report.employees.forEach((employee) => {
      const projectsList = Array.from(
        new Set(
          employee.dailyHours.flatMap((day) =>
            day.projects.map((p) => p.projectName)
          )
        )
      ).join('; ');

      rows.push([
        employee.employeeId,
        employee.firstName,
        employee.lastName,
        employee.classification,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        employee.totalHours.toFixed(2),
        employee.regularHours.toFixed(2),
        employee.overtimeHours.toFixed(2),
        projectsList,
      ]);
    });

    // Convert to CSV string
    const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

    logger.info('Weekly CSV report exported', {
      startDate,
      endDate,
      rowCount: rows.length - 1,
    });

    return csv;
  } catch (error) {
    logger.error('Error exporting weekly CSV report', {
      startDate,
      endDate,
      error,
    });
    throw error;
  }
};

/**
 * Get payroll summary statistics
 */
export const getPayrollSummary = async (startDate: Date, endDate: Date) => {
  try {
    // Get all time entries in the date range
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        employee: {
          select: {
            id: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Calculate statistics
    const uniqueEmployees = new Set(timeEntries.map((e) => e.employee_id));
    const uniqueProjects = new Set(timeEntries.map((e) => e.project_id));

    const totalLaborHours = timeEntries.reduce(
      (sum, entry) => sum + Number(entry.hours_worked),
      0
    );

    const totalLaborCost = timeEntries.reduce((sum, entry) => {
      if (entry.total_cost) {
        return sum + Number(entry.total_cost);
      }
      return sum;
    }, 0);

    // Top projects by hours
    const projectMap = new Map<string, { name: string; hours: number }>();
    timeEntries.forEach((entry) => {
      const projectId = entry.project_id;
      if (!projectMap.has(projectId)) {
        projectMap.set(projectId, {
          name: entry.project.name,
          hours: 0,
        });
      }
      projectMap.get(projectId)!.hours += Number(entry.hours_worked);
    });

    const topProjects = Array.from(projectMap.entries())
      .map(([projectId, data]) => ({
        projectId,
        name: data.name,
        hours: data.hours,
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 5);

    const summary = {
      totalLaborHours,
      totalLaborCost,
      employeeCount: uniqueEmployees.size,
      projectCount: uniqueProjects.size,
      topProjects,
    };

    logger.info('Payroll summary generated', {
      startDate,
      endDate,
      totalHours: totalLaborHours,
      totalCost: totalLaborCost,
    });

    return summary;
  } catch (error) {
    logger.error('Error generating payroll summary', {
      startDate,
      endDate,
      error,
    });
    throw error;
  }
};

