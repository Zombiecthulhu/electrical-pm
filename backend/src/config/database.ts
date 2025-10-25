import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Initialize Prisma Client with connection pooling
const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  // Connection pool settings to prevent timeouts
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Test database connection with retry logic
export const connectDatabase = async (retries = 5, delay = 3000): Promise<void> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`; // Test query
      logger.info('Database connected successfully');
      return;
    } catch (error) {
      logger.error(`Database connection attempt ${attempt}/${retries} failed:`, error);
      
      if (attempt < retries) {
        logger.info(`Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        logger.error('Database connection failed after all retries');
        throw new Error('Failed to connect to database after multiple attempts');
      }
    }
  }
};

// Disconnect database
export const disconnectDatabase = async (): Promise<void> => {
  await prisma.$disconnect();
  logger.info('Database disconnected');
};

// Note: Shutdown handlers moved to server.ts for centralized management

export default prisma;

