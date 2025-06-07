import winston from 'winston';
import path from 'path';
import { config } from '@/config/environment';
import { AppError, ErrorCode, HttpStatus } from '@/types/errors';

// Define types for our log metadata
interface RequestContext {
  method: string;
  url: string;
  ip: string;
  userAgent: string;
}

interface LogMetadata {
  correlationId?: string;
  request?: RequestContext;
  [key: string]: unknown;
}

interface LogInfo extends winston.Logform.TransformableInfo {
  metadata?: LogMetadata;
  correlationId?: string;
  request?: RequestContext;
  type?: 'AppError' | 'Error';
  code?: ErrorCode;
  status?: number;
  errorCategory?: string;
  severity?: 'critical' | 'error' | 'warning' | 'info';
  timestamp?: string;
}

/**
 * Enhanced error replacer that handles both standard Error and AppError objects.
 * For AppError instances, it includes additional metadata like error codes and status.
 * For standard Error objects, it maintains the basic message and stack information.
 *
 * @param _key - The key being processed (not used in this implementation)
 * @param value - The value being processed, which may be an Error or AppError object
 * @returns A structured object containing error information, or the original value if it's not an error
 */
function errorReplacer(_key: string, value: unknown): unknown {
  if (value instanceof AppError) {
    return {
      type: 'AppError',
      name: value.name,
      message: value.message,
      code: value.code,
      status: value.status,
      statusText: HttpStatus[value.status],
      details: value.details,
      timestamp: value.timestamp,
      stack: value.stack,
    };
  }

  if (value instanceof Error) {
    return {
      type: 'Error',
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  return value;
}

/**
 * Extracts nested error messages and stacks from the log entry.
 * This is useful for logging errors in a structured format.
 *
 * @param info - The log entry to process
 * @returns The log entry with the nested error message and stack
 */
const extractNestedError = winston.format(info => {
  if (info.error instanceof Error) {
    info.message = `${info.message}: ${info.error.message}`;
    info.stack = info.error.stack;
    delete info.error;
  }
  return info;
});

/**
 * Custom format that enhances error metadata and standardizes error structure.
 * This format ensures consistent error logging across all transports and adds
 * useful context to error logs.
 */
const enhanceErrorMetadata = winston.format((info: LogInfo) => {
  // Add correlation ID if available in the metadata
  if (info.metadata?.correlationId) {
    info.correlationId = info.metadata.correlationId;
    delete info.metadata.correlationId;
  }

  // Add request context if available
  if (info.metadata?.request) {
    const { method, url, ip, userAgent } = info.metadata.request;
    info.request = { method, url, ip, userAgent };
    delete info.metadata.request;
  }

  // Enhance error information
  if (info.error || info.type === 'AppError' || info.type === 'Error') {
    // Add error category based on the error type
    if (info.type === 'AppError') {
      info.errorCategory = 'application';
      // Map error codes to categories
      switch (info.code) {
        case ErrorCode.VALIDATION_ERROR:
          info.errorCategory = 'validation';
          break;
        case ErrorCode.AUTHENTICATION_ERROR:
        case ErrorCode.AUTHORIZATION_ERROR:
          info.errorCategory = 'security';
          break;
        case ErrorCode.DATABASE_ERROR:
          info.errorCategory = 'database';
          break;
        case ErrorCode.EXTERNAL_SERVICE_ERROR:
          info.errorCategory = 'external';
          break;
      }
    } else if (info.type === 'Error') {
      info.errorCategory = 'system';
    }

    // Add severity level based on error type and status
    const status = info.status as number | undefined;
    if (status) {
      if (status >= 500) {
        info.severity = 'critical';
      } else if (status >= 400) {
        info.severity = 'error';
      }
    } else {
      info.severity = 'error';
    }

    // Add timestamp if not present
    if (!info.timestamp) {
      info.timestamp = new Date().toISOString();
    }
  }

  return info;
});

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
 */
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  enhanceErrorMetadata(),
  winston.format.json({ replacer: errorReplacer })
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
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join('logs', 'exceptions.log'),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join('logs', 'rejections.log'),
    }),
  ],
});

if (config.NODE_ENV === 'development') {
  // Custom colors for different error types and status codes
  const customColors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
    AppError: 'red',
    Error: 'red',
    VALIDATION_ERROR: 'yellow',
    AUTHENTICATION_ERROR: 'red',
    AUTHORIZATION_ERROR: 'red',
    NOT_FOUND_ERROR: 'blue',
    CONFLICT_ERROR: 'yellow',
    INTERNAL_ERROR: 'red',
    EXTERNAL_SERVICE_ERROR: 'red',
    DATABASE_ERROR: 'red',
  };

  winston.addColors(customColors);

  logger.add(
    new winston.transports.Console({
      level: config.LOG_LEVEL,
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.timestamp({ format: 'HH:mm:ss:ms' }),
        winston.format.errors({ stack: true }),
        enhanceErrorMetadata(),
        extractNestedError(),
        winston.format.printf(
          ({
            timestamp,
            level,
            message,
            stack,
            type,
            code,
            status,
            statusText,
            details,
            errorCategory,
            severity,
            correlationId,
            request,
            ...meta
          }: LogInfo) => {
            // Base log line with timestamp and level
            let output = `${timestamp} [${level}]: `;

            // Add correlation ID if available
            if (correlationId) {
              output += `[${correlationId}] `;
            }

            // Handle error logging
            if (type === 'AppError' || type === 'Error') {
              // Add error type and category
              output += `[${type}]`;
              if (errorCategory) {
                output += ` [${errorCategory}]`;
              }
              if (severity) {
                output += ` [${severity}]`;
              }

              // Add error code and status for AppError
              if (type === 'AppError') {
                output += ` [${code}]`;
                if (status) {
                  output += ` [${status} ${statusText}]`;
                }
              }

              // Add the error message
              output += ` ${message}\n`;

              // Add request context if available
              if (request && 'method' in request) {
                output += `\nRequest Context:\n`;
                output += `  Method: ${request.method}\n`;
                output += `  URL: ${request.url}\n`;
                output += `  IP: ${request.ip}\n`;
                output += `  User Agent: ${request.userAgent}\n`;
              }

              // Add stack trace if available
              if (stack && typeof stack === 'string') {
                output += `\nStack Trace:\n${stack.split('\n').slice(1).join('\n')}\n`;
              }

              // Add details if available
              if (details) {
                output += `\nDetails:\n${JSON.stringify(details, null, 2)}\n`;
              }
            } else {
              // Regular log message
              output += message;
            }

            // Add any additional metadata
            const metaKeys = Object.keys(meta);
            if (metaKeys.length > 0) {
              output += `\nMetadata:\n${JSON.stringify(meta, null, 2)}`;
            }

            return output;
          }
        )
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
  write: (message: string): void => {
    logger.http(message.trim());
  },
};

// Export the configured logger instance
export { logger };
