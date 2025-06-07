import { Request, Response, RequestHandler } from 'express';
import { ErrorResponse, HttpStatus, ErrorCode } from '@/types/errors';
import { logger } from '../utils/logger';
import { RequestWithId } from './request-id.middleware';

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

  logger.warn('Route not found', {
    requestId,
    method: req.method,
    path: req.originalUrl,
    response: errorResponse,
  });

  // Send the 404 response
  res.status(HttpStatus.NOT_FOUND).json(errorResponse);
};
