import winston from 'winston';
import path from 'path';
import { config } from '../config/environment';
import { AppError, ErrorResponse } from '../types/errors';

/**
 * Custom log levels for the application, ordered by severity.
 * Each level has a specific use case:
 * - error: Critical issues that require immediate attention
 * - warn: Potential issues that don't break functionality
 * - info: Important business events and state changes
 * - http: HTTP request/response logging
 * - debug: Detailed information for development
 * 
 * @example
 * ```typescript
 * // Error logging with context
 * logger.error('Failed to process payment', { 
 *   orderId: '123',
 *   error: paymentError 
 * });
 * 
 * // Info logging for business events
 * logger.info('User subscription updated', {
 *   userId: '456',
 *   plan: 'premium'
 * });
 * ```
 */
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
} as const;

/**
 * Color mapping for different log levels in development console.
 * Colors are only applied in non-production environments.
 */
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
} as const;

// Add colors to Winston for development console output
winston.addColors(colors);

/**
 * Custom Winston format that enhances error handling and metadata formatting.
 * This format:
 * 1. Adds timestamps to all log entries
 * 2. Properly formats Error objects with stack traces
 * 3. Handles custom AppError and ErrorResponse objects
 * 4. Converts all output to JSON for structured logging
 * 
 * The format is designed to work with:
 * - Standard Error objects
 * - Custom AppError instances
 * - ErrorResponse objects from the API
 * - Regular log messages with metadata
 * 
 * @example
 * ```typescript
 * // Error object logging
 * logger.error(new Error('Database connection failed'));
 * // Output: {"timestamp":"2024-03-14 10:00:00:000","level":"error","message":"Error: Database connection failed","error":{"name":"Error","message":"Database connection failed","stack":"..."}}
 * 
 * // Custom error logging
 * logger.error(new AppError('VALIDATION_ERROR', 'Invalid input'));
 * // Output: {"timestamp":"2024-03-14 10:00:00:000","level":"error","message":"VALIDATION_ERROR: Invalid input","error":{"code":"VALIDATION_ERROR","message":"Invalid input",...}}
 * ```
 */
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format((info) => {
    const { message, ...meta } = info;

    // Transform Error objects into structured format
    if (message instanceof Error) {
      const error = message;
      return {
        ...info,
        message: `${error.name}: ${error.message}`,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          ...(error instanceof AppError ? error.toJSON() : {}),
        },
      };
    }

    // Transform ErrorResponse objects into structured format
    if (message && typeof message === 'object' && 'code' in message && 'status' in message) {
      const errorResponse = message as ErrorResponse;
      return {
        ...info,
        message: `${errorResponse.code}: ${errorResponse.message}`,
        error: errorResponse,
      };
    }

    return info;
  })(),
  winston.format.json()
);

/**
 * Base logger configuration with file transports and exception handling.
 * 
 * Transport Strategy:
 * - error.log: Contains only error level logs
 * - combined.log: Contains all logs
 * - exceptions.log: Contains unhandled exceptions and rejections
 * 
 * Performance Considerations:
 * - File transports use streams for efficient writing
 * - JSON formatting enables easy log aggregation
 * - Exception handling prevents process crashes
 * 
 * @example
 * ```typescript
 * // Basic logging
 * logger.info('Server started', { port: 3000 });
 * 
 * // Error logging with context
 * logger.error('Database error', { 
 *   operation: 'create',
 *   table: 'users',
 *   error: dbError 
 * });
 * 
 * // HTTP request logging
 * logger.http('GET /api/users', {
 *   duration: 150,
 *   statusCode: 200
 * });
 * ```
 */
const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  levels,
  format,
  defaultMeta: { service: 'athletiqly' },
  transports: [
    // Separate error logs for easier error tracking
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
    }),
    // Combined logs for complete request tracing
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
    }),
    // Exception logs for unhandled errors
    new winston.transports.File({
      filename: path.join('logs', 'exceptions.log'),
      handleExceptions: true,
      handleRejections: true,
    }),
  ],
});

// Add development console transport with colors and readable format
if (config.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaString = Object.keys(meta).length
            ? `\n${JSON.stringify(meta, null, 2)}`
            : '';
          return `${timestamp} ${level}: ${message}${metaString}`;
        })
      ),
    })
  );
}

/**
 * Stream interface for Morgan HTTP request logging middleware.
 * This enables Morgan to write HTTP request logs through our logger,
 * ensuring consistent formatting and transport handling.
 * 
 * @example
 * ```typescript
 * // In app.ts:
 * import morgan from 'morgan';
 * 
 * app.use(morgan('combined', { stream }));
 * // This will log all HTTP requests through our logger
 * ```
 */
export const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

/**
 * Type definition for log levels.
 * Used for type-safe logging throughout the application.
 */
export type LogLevel = keyof typeof levels;

// Export the configured logger instance
export { logger };
