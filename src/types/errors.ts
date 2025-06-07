/**
 * HTTP Status Codes enum for type-safe status code usage
 */
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

/**
 * Application error codes for consistent error identification
 */
export enum ErrorCode {
  // Client Errors (4xx)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  
  // Server Errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
}

/**
 * Standard error response interface
 */
export interface ErrorResponse {
  code: ErrorCode;
  message: string;
  status: HttpStatus;
  details?: unknown;
  timestamp: string;
  path?: string;
}

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly status: HttpStatus;
  public readonly details?: unknown;
  public readonly timestamp: string;

  constructor(
    code: ErrorCode,
    message: string,
    status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.status = status;
    this.details = details;
    this.timestamp = new Date().toISOString();

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  public toJSON(): ErrorResponse {
    return {
      code: this.code,
      message: this.message,
      status: this.status,
      details: this.details,
      timestamp: this.timestamp,
    };
  }
}

/**
 * Specific error classes for different error types
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(ErrorCode.VALIDATION_ERROR, message, HttpStatus.BAD_REQUEST, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', details?: unknown) {
    super(
      ErrorCode.AUTHENTICATION_ERROR,
      message,
      HttpStatus.UNAUTHORIZED,
      details
    );
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Not authorized', details?: unknown) {
    super(
      ErrorCode.AUTHORIZATION_ERROR,
      message,
      HttpStatus.FORBIDDEN,
      details
    );
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', details?: unknown) {
    super(ErrorCode.NOT_FOUND_ERROR, message, HttpStatus.NOT_FOUND, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict', details?: unknown) {
    super(ErrorCode.CONFLICT_ERROR, message, HttpStatus.CONFLICT, details);
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string = 'External service error', details?: unknown) {
    super(
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      message,
      HttpStatus.SERVICE_UNAVAILABLE,
      details
    );
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database error', details?: unknown) {
    super(
      ErrorCode.DATABASE_ERROR,
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      details
    );
  }
}