import { Request, Response, NextFunction, RequestHandler, ErrorRequestHandler } from 'express';
import {
  AppError,
  ErrorResponse,
  HttpStatus,
  ErrorCode,
  isAppError,
} from '../types/errors';
import { logger } from '../utils/logger';
import { RequestWithId } from './request-id.middleware';

/**
 * Environment-aware error response formatter.
 * Formats error responses differently based on the environment:
 * - Production: Hides internal error details for security
 * - Development: Includes detailed error information for debugging
 * 
 * The formatter handles:
 * - Custom AppError instances with structured error data
 * - Standard Error objects with stack traces
 * - Unknown error types with safe fallbacks
 * 
 * @param error - The error to format
 * @param req - The Express request object
 * @param isProduction - Whether the application is running in production
 * @returns Formatted error response suitable for client consumption
 * 
 * @example
 * ```typescript
 * // Production error response
 * {
 *   "code": "INTERNAL_ERROR",
 *   "message": "An unexpected error occurred",
 *   "status": 500,
 *   "timestamp": "2024-03-14T10:00:00.000Z",
 *   "path": "/api/users"
 * }
 * 
 * // Development error response
 * {
 *   "code": "VALIDATION_ERROR",
 *   "message": "Invalid input data",
 *   "status": 400,
 *   "timestamp": "2024-03-14T10:00:00.000Z",
 *   "path": "/api/users",
 *   "details": {
 *     "field": "email",
 *     "reason": "Invalid email format"
 *   }
 * }
 * ```
 */
function formatErrorResponse(
  error: Error | AppError,
  req: Request,
  isProduction: boolean
): ErrorResponse {
  const path = req.originalUrl;
  
  // Format custom AppError instances with their structured data
  if (isAppError(error)) {
    const response = error.toJSON();
    return {
      ...response,
      path,
      // Hide internal details in production
      details: isProduction ? undefined : response.details,
    };
  }

  // Format unknown errors with safe defaults
  return {
    code: ErrorCode.INTERNAL_ERROR,
    message: isProduction
      ? 'An unexpected error occurred'
      : error.message || 'Unknown error',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    timestamp: new Date().toISOString(),
    path,
    // Include stack traces only in development
    details: isProduction
      ? undefined
      : {
          stack: error.stack,
          name: error.name,
        },
  };
}

/**
 * Global error handling middleware.
 * This should be the last middleware in the chain to catch all unhandled errors.
 * 
 * Features:
 * - Environment-aware error formatting
 * - Structured error logging with request context
 * - Consistent error response format
 * - Request ID tracking for error correlation
 * 
 * The middleware:
 * 1. Formats the error based on environment
 * 2. Logs the error with full context
 * 3. Sends a consistent error response
 * 
 * @example
 * ```typescript
 * // In app.ts:
 * app.use(errorHandler);
 * 
 * // In a route:
 * app.get('/api/users', (req, res, next) => {
 *   try {
 *     // ... route logic
 *   } catch (error) {
 *     next(error); // Error will be handled by errorHandler
 *   }
 * });
 * ```
 */
export const errorHandler: ErrorRequestHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Determine environment for error formatting
  const isProduction = process.env.NODE_ENV === 'production';

  // Format the error response
  const errorResponse = formatErrorResponse(error, req, isProduction);

  // Create detailed error message for logging
  const errorMessage = error instanceof Error 
    ? `${error.name}: ${error.message}`
    : 'Unknown error occurred';

  // Log the error with full context for debugging
  logger.error(errorMessage, {
    error,
    requestId: (req as RequestWithId).id,
    method: req.method,
    path: req.originalUrl,
    status: errorResponse.status,
    response: errorResponse,
    // Include request details only in development
    headers: isProduction ? undefined : req.headers,
    query: req.query,
    body: req.body
  });

  // Send the formatted error response
  res.status(errorResponse.status).json(errorResponse);
};

/**
 * Async handler wrapper to catch and properly handle async errors.
 * This wrapper ensures that all async errors are caught and passed to the error handler.
 * 
 * Usage:
 * ```typescript
 * // Instead of:
 * app.get('/users', async (req, res) => {
 *   const users = await db.getUsers(); // Uncaught errors crash the app
 *   res.json(users);
 * });
 * 
 * // Use:
 * app.get('/users', asyncHandler(async (req, res) => {
 *   const users = await db.getUsers(); // Errors are caught and handled
 *   res.json(users);
 * }));
 * ```
 * 
 * Benefits:
 * - Prevents unhandled promise rejections
 * - Ensures consistent error handling
 * - Maintains request context in error logs
 * - Simplifies async route handlers
 */
export const asyncHandler =
  (fn: (req: RequestWithId, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: RequestWithId, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      // Log the error with request context before passing to error handler
      const errorMessage = error instanceof Error 
        ? `${error.name}: ${error.message}`
        : 'Unknown async error occurred';

      logger.error(errorMessage, {
        error,
        requestId: req.id,
        method: req.method,
        path: req.originalUrl,
        message: 'Unhandled async error',
      });
      next(error);
    });
  };

/**
 * Not found handler for unmatched routes.
 * This should be placed after all routes but before the error handler.
 * 
 * Features:
 * - Consistent 404 error format
 * - Request ID tracking
 * - Warning level logging
 * - Clean error messages
 * 
 * @example
 * ```typescript
 * // In app.ts:
 * app.use(notFoundHandler);
 * 
 * // Response for unmatched route:
 * {
 *   "code": "NOT_FOUND_ERROR",
 *   "message": "Route GET /api/nonexistent not found",
 *   "status": 404,
 *   "timestamp": "2024-03-14T10:00:00.000Z",
 *   "path": "/api/nonexistent"
 * }
 * ```
 */
export const notFoundHandler: RequestHandler = (
  req: Request,
  res: Response
): void => {
  const requestId = (req as RequestWithId).id;
  const errorResponse: ErrorResponse = {
    code: ErrorCode.NOT_FOUND_ERROR,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    status: HttpStatus.NOT_FOUND,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  };

  // Log the not found error at warning level
  logger.warn('Route not found', {
    requestId,
    method: req.method,
    path: req.originalUrl,
    response: errorResponse,
  });

  // Send the 404 response
  res.status(HttpStatus.NOT_FOUND).json(errorResponse);
};
