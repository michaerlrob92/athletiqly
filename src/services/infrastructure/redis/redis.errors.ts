/**
 * Base class for Redis service errors
 */
export class RedisServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RedisServiceError';
  }
}

/**
 * Error thrown when Redis connection fails
 */
export class RedisConnectionError extends RedisServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'RedisConnectionError';
  }
}

/**
 * Error thrown when Redis operation fails
 */
export class RedisOperationError extends RedisServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'RedisOperationError';
  }
}

/**
 * Error thrown when Redis health check fails
 */
export class RedisHealthCheckError extends RedisServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'RedisHealthCheckError';
  }
}

/**
 * Error thrown when Redis service is not ready
 */
export class RedisNotReadyError extends RedisServiceError {
  constructor(message: string = 'Redis service is not ready') {
    super(message);
    this.name = 'RedisNotReadyError';
  }
}

/**
 * Error thrown when Redis service is already connected
 */
export class RedisAlreadyConnectedError extends RedisServiceError {
  constructor(message: string = 'Redis service is already connected') {
    super(message);
    this.name = 'RedisAlreadyConnectedError';
  }
}

/**
 * Error thrown when Redis service is already disconnected
 */
export class RedisAlreadyDisconnectedError extends RedisServiceError {
  constructor(message: string = 'Redis service is already disconnected') {
    super(message);
    this.name = 'RedisAlreadyDisconnectedError';
  }
} 