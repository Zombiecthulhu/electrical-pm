import { Request, Response } from 'express';
import * as payrollService from '../services/payroll.service';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';

/**
 * Payroll Controller
 * Handles HTTP requests for payroll reports and CSV exports
 */

/**
 * Get daily payroll report
 * GET /api/v1/payroll/daily?date=YYYY-MM-DD&employeeId=xxx&projectId=xxx
 */
export const getDailyReport = async (req: Request, res: Response) => {
  try {
    const { date } = req.query;

    if (!date) {
      return sendError(res, 'VALIDATION_ERROR', 'Date parameter is required', 400);
    }

    const dateObj = new Date(date as string);
    if (isNaN(dateObj.getTime())) {
      return sendError(res, 'VALIDATION_ERROR', 'Invalid date format', 400);
    }

    const report = await payrollService.generateDailyReport(dateObj);
    return sendSuccess(res, report, 'Daily payroll report generated successfully');
  } catch (error: any) {
    logger.error('Error in getDailyReport controller', { error });
    return sendError(res, 'REPORT_ERROR', error.message || 'Failed to generate daily report');
  }
};

/**
 * Get weekly payroll report
 * GET /api/v1/payroll/weekly?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&employeeId=xxx
 */
export const getWeeklyReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return sendError(res, 'VALIDATION_ERROR', 'startDate and endDate parameters are required', 400);
    }

    const startDateObj = new Date(startDate as string);
    const endDateObj = new Date(endDate as string);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return sendError(res, 'VALIDATION_ERROR', 'Invalid date format', 400);
    }

    const report = await payrollService.generateWeeklyReport(startDateObj, endDateObj);
    return sendSuccess(res, report, 'Weekly payroll report generated successfully');
  } catch (error: any) {
    logger.error('Error in getWeeklyReport controller', { error });
    return sendError(res, 'REPORT_ERROR', error.message || 'Failed to generate weekly report');
  }
};

/**
 * Get project cost report
 * GET /api/v1/payroll/project/:projectId?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
export const getProjectCostReport = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { startDate, endDate } = req.query;

    if (!projectId) {
      return sendError(res, 'VALIDATION_ERROR', 'projectId parameter is required', 400);
    }

    if (!startDate || !endDate) {
      return sendError(res, 'VALIDATION_ERROR', 'startDate and endDate parameters are required', 400);
    }

    const startDateObj = new Date(startDate as string);
    const endDateObj = new Date(endDate as string);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return sendError(res, 'VALIDATION_ERROR', 'Invalid date format', 400);
    }

    const report = await payrollService.generateProjectCostReport(projectId, startDateObj, endDateObj);
    return sendSuccess(res, report, 'Project cost report generated successfully');
  } catch (error: any) {
    logger.error('Error in getProjectCostReport controller', { error });
    return sendError(res, 'REPORT_ERROR', error.message || 'Failed to generate project cost report');
  }
};

/**
 * Download daily report as CSV
 * GET /api/v1/payroll/export/daily?date=YYYY-MM-DD
 */
export const downloadDailyCSV = async (req: Request, res: Response) => {
  try {
    const { date } = req.query;

    if (!date) {
      return sendError(res, 'VALIDATION_ERROR', 'Date parameter is required', 400);
    }

    const dateObj = new Date(date as string);
    if (isNaN(dateObj.getTime())) {
      return sendError(res, 'VALIDATION_ERROR', 'Invalid date format', 400);
    }

    const csv = await payrollService.exportDailyReportCSV(dateObj);
    
    const filename = `payroll-daily-${date}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    return res.send(csv);
  } catch (error: any) {
    logger.error('Error in downloadDailyCSV controller', { error });
    return sendError(res, 'EXPORT_ERROR', error.message || 'Failed to export daily report');
  }
};

/**
 * Download weekly report as CSV
 * GET /api/v1/payroll/export/weekly?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
export const downloadWeeklyCSV = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return sendError(res, 'VALIDATION_ERROR', 'startDate and endDate parameters are required', 400);
    }

    const startDateObj = new Date(startDate as string);
    const endDateObj = new Date(endDate as string);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return sendError(res, 'VALIDATION_ERROR', 'Invalid date format', 400);
    }

    const csv = await payrollService.exportWeeklyReportCSV(startDateObj, endDateObj);
    
    const filename = `payroll-weekly-${startDate}-to-${endDate}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    return res.send(csv);
  } catch (error: any) {
    logger.error('Error in downloadWeeklyCSV controller', { error });
    return sendError(res, 'EXPORT_ERROR', error.message || 'Failed to export weekly report');
  }
};

/**
 * Get payroll summary
 * GET /api/v1/payroll/summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
export const getPayrollSummary = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return sendError(res, 'VALIDATION_ERROR', 'startDate and endDate parameters are required', 400);
    }

    const startDateObj = new Date(startDate as string);
    const endDateObj = new Date(endDate as string);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return sendError(res, 'VALIDATION_ERROR', 'Invalid date format', 400);
    }

    const summary = await payrollService.getPayrollSummary(startDateObj, endDateObj);
    return sendSuccess(res, summary, 'Payroll summary retrieved successfully');
  } catch (error: any) {
    logger.error('Error in getPayrollSummary controller', { error });
    return sendError(res, 'SUMMARY_ERROR', error.message || 'Failed to get payroll summary');
  }
};
