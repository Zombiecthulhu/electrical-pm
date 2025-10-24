/**
 * Logger Utility
 * 
 * Simple logging utility for the frontend application.
 * Provides consistent logging interface across the app.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  private log(level: LogLevel, message: string, data?: any): void {
    if (!this.isDevelopment) {
      return; // Only log in development
    }

    const logEntry = this.formatMessage(level, message, data);
    
    // Use console methods with appropriate styling
    switch (level) {
      case 'debug':
        console.debug(`🔍 [DEBUG] ${message}`, data || '');
        break;
      case 'info':
        console.info(`ℹ️ [INFO] ${message}`, data || '');
        break;
      case 'warn':
        console.warn(`⚠️ [WARN] ${message}`, data || '');
        break;
      case 'error':
        console.error(`❌ [ERROR] ${message}`, data || '');
        break;
    }
  }

  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: any): void {
    this.log('error', message, data);
  }
}

// Create and export a singleton instance
export const logger = new Logger();
