import { Request, Response } from 'express';
import { successResponse } from '../utils/response';
import { logger } from '../utils/logger';

/**
 * Health check endpoint
 */
export const healthCheck = async (req: Request, res: Response): Promise<void> => {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    };

    logger.info('Health check requested', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      service: 'electrical-pm-api',
      timestamp: new Date().toISOString()
    });

    successResponse(res, healthData, 'Server is healthy');
  } catch (error) {
    logger.error('Health check error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      service: 'electrical-pm-api',
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: 'Server health check failed'
      }
    });
  }
};
