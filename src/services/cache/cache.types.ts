import { IRedisService } from '../infrastructure/redis/redis.types';

/**
 * Cache service configuration options
 */
export interface CacheServiceOptions {
  /**
   * Redis service instance
   */
  redisService: IRedisService;

  /**
   * Default TTL in seconds for cached items
   * @default 300 (5 minutes)
   */
  defaultTTL?: number;

  /**
   * Whether to enable stale-while-revalidate pattern
   * @default true
   */
  enableStaleWhileRevalidate?: boolean;

  /**
   * Stale-while-revalidate TTL in seconds
   * Only used if enableStaleWhileRevalidate is true
   * @default 600 (10 minutes)
   */
  staleWhileRevalidateTTL?: number;

  /**
   * Key prefix for all cache keys
   * @default 'cache'
   */
  keyPrefix?: string;

  /**
   * Whether to enable compression
   * @default false
   */
  enableCompression?: boolean;
}

/**
 * Cache entry metadata
 */
export interface CacheEntry<T> {
  /**
   * Cached data
   */
  data: T;

  /**
   * Timestamp when the data was cached
   */
  timestamp: number;

  /**
   * ETag for the cached data
   */
  etag: string;

  /**
   * TTL in seconds
   */
  ttl: number;
}

/**
 * Cache service interface
 */
export interface ICacheService {
  /**
   * Get a value from the cache
   * @param key Cache key
   * @returns Cached value or null if not found
   */
  get<T>(key: string): Promise<CacheEntry<T> | null>;

  /**
   * Set a value in the cache
   * @param key Cache key
   * @param value Value to cache
   * @param options Cache options
   */
  set<T>(
    key: string,
    value: T,
    options?: {
      ttl?: number;
      etag?: string;
    }
  ): Promise<void>;

  /**
   * Delete a value from the cache
   * @param key Cache key
   */
  delete(key: string): Promise<void>;

  /**
   * Generate a cache key
   * @param parts Key parts to join
   * @returns Generated cache key
   */
  generateKey(...parts: string[]): string;

  /**
   * Generate an ETag for a value
   * @param value Value to generate ETag for
   * @returns Generated ETag
   */
  generateETag<T>(value: T): string;

  /**
   * Check if a value is stale
   * @param entry Cache entry to check
   * @returns Whether the entry is stale
   */
  isStale<T>(entry: CacheEntry<T>): boolean;

  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  getStats(): Promise<CacheStats>;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  /**
   * Number of cache hits
   */
  hits: number;

  /**
   * Number of cache misses
   */
  misses: number;

  /**
   * Number of cache keys
   */
  keys: number;

  /**
   * Memory usage in bytes
   */
  memoryUsage: number;

  /**
   * Hit rate (hits / (hits + misses))
   */
  hitRate: number;
}

/**
 * Cache service events
 */
export enum CacheServiceEvent {
  HIT = 'hit',
  MISS = 'miss',
  SET = 'set',
  DELETE = 'delete',
  ERROR = 'error',
  STALE = 'stale',
}

/**
 * Cache service event handlers
 */
export type CacheServiceEventHandler = (key: string, error?: Error) => void;

/**
 * Cache service event map
 */
export interface CacheServiceEventMap {
  [CacheServiceEvent.HIT]: (key: string) => void;
  [CacheServiceEvent.MISS]: (key: string) => void;
  [CacheServiceEvent.SET]: (key: string) => void;
  [CacheServiceEvent.DELETE]: (key: string) => void;
  [CacheServiceEvent.ERROR]: (key: string, error: Error) => void;
  [CacheServiceEvent.STALE]: (key: string) => void;
} 