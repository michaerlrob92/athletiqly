/**
 * Base class for cache service errors
 */
export class CacheServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CacheServiceError';
  }
}

/**
 * Error thrown when cache operation fails
 */
export class CacheOperationError extends CacheServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'CacheOperationError';
  }
}

/**
 * Error thrown when cache serialization fails
 */
export class CacheSerializationError extends CacheServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'CacheSerializationError';
  }
}

/**
 * Error thrown when cache deserialization fails
 */
export class CacheDeserializationError extends CacheServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'CacheDeserializationError';
  }
}

/**
 * Error thrown when cache compression fails
 */
export class CacheCompressionError extends CacheServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'CacheCompressionError';
  }
}

/**
 * Error thrown when cache decompression fails
 */
export class CacheDecompressionError extends CacheServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'CacheDecompressionError';
  }
}

/**
 * Error thrown when cache key is invalid
 */
export class CacheKeyError extends CacheServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'CacheKeyError';
  }
}

/**
 * Error thrown when cache TTL is invalid
 */
export class CacheTTLError extends CacheServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'CacheTTLError';
  }
}

/**
 * Error thrown when cache statistics operation fails
 */
export class CacheStatsError extends CacheServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'CacheStatsError';
  }
} 