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
 * GET /api/v1/payroll/daily?date=YYYY-MM-DD
 */
export const getDailyReport = async (req: Request, res: Response) => {
  try {
    const { date } = req.query;

    if (!date) {
      return sendError(res, 'Date parameter is required', 400);
    }

    const dateObj = new Date(date as string);
    if (isNaN(dateObj.getTime())) {
      return sendError(res, 'Invalid date format', 400);
    }

    const report = await payrollService.generateDailyReport(dateObj);
    sendSuccess(res, report, 'Daily payroll report generated successfully');
  } catch (error: any) {
    logger.error('Error in getDailyReport controller', { error });
    sendError(res, error.message);
  }
};

/**
 * Get weekly payroll report
 * GET /api/v1/payroll/weekly?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
export const getWeeklyReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return sendError(res, 'startDate and endDate parameters are required', 400);
    }

    const startDateObj = new Date(startDate as string);
    const endDateObj = new Date(endDate as string);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return sendError(res, 'Invalid date format', 400);
    }

    const report = await payrollService.generateWeeklyReport(
      startDateObj,
      endDateObj
    );
    sendSuccess(res, report, 'Weekly payroll report generated successfully');
  } catch (error: any) {
    logger.error('Error in getWeeklyReport controller', { error });
    sendError(res, error.message);
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

    if (!startDate || !endDate) {
      return sendError(res, 'startDate and endDate parameters are required', 400);
    }

    const startDateObj = new Date(startDate as string);
    const endDateObj = new Date(endDate as string);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return sendError(res, 'Invalid date format', 400);
    }

    const report = await payrollService.generateProjectCostReport(
      projectId,
      startDateObj,
      endDateObj
    );
    sendSuccess(res, report, 'Project cost report generated successfully');
  } catch (error: any) {
    logger.error('Error in getProjectCostReport controller', { error });
    
    if (error.message.includes('not found')) {
      return sendError(res, error.message, 404);
    }
    
    sendError(res, error.message);
  }
};

/**
 * Get payroll summary statistics
 * GET /api/v1/payroll/summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
export const getPayrollSummary = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return sendError(res, 'startDate and endDate parameters are required', 400);
    }

    const startDateObj = new Date(startDate as string);
    const endDateObj = new Date(endDate as string);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return sendError(res, 'Invalid date format', 400);
    }

    const summary = await payrollService.getPayrollSummary(
      startDateObj,
      endDateObj
    );
    sendSuccess(res, summary, 'Payroll summary generated successfully');
  } catch (error: any) {
    logger.error('Error in getPayrollSummary controller', { error });
    sendError(res, error.message);
  }
};

/**
 * Download daily payroll report as CSV
 * GET /api/v1/payroll/export/daily?date=YYYY-MM-DD
 */
export const downloadDailyCSV = async (req: Request, res: Response) => {
  try {
    const { date } = req.query;

    if (!date) {
      return sendError(res, 'Date parameter is required', 400);
    }

    const dateObj = new Date(date as string);
    if (isNaN(dateObj.getTime())) {
      return sendError(res, 'Invalid date format', 400);
    }

    const csv = await payrollService.exportDailyReportCSV(dateObj);

    // Set headers for file download
    const filename = `payroll-report-${date}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', Buffer.byteLength(csv));

    res.send(csv);

    logger.info('Daily CSV downloaded', { date, filename });
  } catch (error: any) {
    logger.error('Error in downloadDailyCSV controller', { error });
    sendError(res, error.message);
  }
};

/**
 * Download weekly payroll report as CSV
 * GET /api/v1/payroll/export/weekly?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
export const downloadWeeklyCSV = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return sendError(res, 'startDate and endDate parameters are required', 400);
    }

    const startDateObj = new Date(startDate as string);
    const endDateObj = new Date(endDate as string);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return sendError(res, 'Invalid date format', 400);
    }

    const csv = await payrollService.exportWeeklyReportCSV(
      startDateObj,
      endDateObj
    );

    // Set headers for file download
    const filename = `weekly-payroll-${startDate}-to-${endDate}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', Buffer.byteLength(csv));

    res.send(csv);

    logger.info('Weekly CSV downloaded', { startDate, endDate, filename });
  } catch (error: any) {
    logger.error('Error in downloadWeeklyCSV controller', { error });
    sendError(res, error.message);
  }
};

