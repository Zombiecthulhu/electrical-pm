import express, { Application, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/error-handler';
import apiRouter from './routes';
import { initializeStorage } from './utils/storage.util';

// Load environment variables
dotenv.config();

// Initialize storage directories
initializeStorage().catch((error) => {
  logger.error('Failed to initialize storage', { error });
  process.exit(1);
});

// Initialize Express app
const app: Application = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Update CORS to be more permissive for mobile testing
app.use(
  cors({
    origin: true, // Allow all origins for testing
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Request logging middleware with response time
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Log response time when request finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} completed`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
    
    // Warn if response took longer than 1 second
    if (duration > 1000) {
      logger.warn(`Slow request detected: ${req.method} ${req.path}`, {
        duration: `${duration}ms`,
        statusCode: res.statusCode,
      });
    }
  });

  next();
});

// Root health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Mount API v1 routes
app.use('/api/v1', apiRouter);

// API routes are configured in routes/index.ts
// Current routes:
// - /api/v1/auth - Authentication routes
// - /api/v1/admin - Admin user management routes (SUPER_ADMIN only)
// - /api/v1/health - Health check routes
// - /api/v1/projects - Project management routes
// Additional routes will be added to routes/index.ts as needed

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found',
    },
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error('Unhandled Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

export default app;

