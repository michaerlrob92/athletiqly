import { EventEmitter } from 'events';
import { createHash } from 'crypto';
import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';
import { IRedisService } from '@/services/infrastructure/redis/redis.types';
import {
  ICacheService,
  CacheServiceOptions,
  CacheEntry,
  CacheStats,
  CacheServiceEvent,
  CacheServiceEventMap,
} from './cache.types';
import {
  CacheServiceError,
  CacheOperationError,
  CacheSerializationError,
  CacheDeserializationError,
  CacheKeyError,
  CacheTTLError,
  CacheStatsError,
  CacheCompressionError,
  CacheDecompressionError,
} from './cache.errors';

// Promisify compression functions
const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

// Minimum size in bytes to consider compression
const MIN_COMPRESSION_SIZE = 1024; // 1KB

/**
 * Cache service implementation
 */
export class CacheService extends EventEmitter implements ICacheService {
  private static instance: CacheService;
  private readonly redis: IRedisService;
  private readonly defaultTTL: number;
  private readonly enableStaleWhileRevalidate: boolean;
  private readonly staleWhileRevalidateTTL: number;
  private readonly keyPrefix: string;
  private readonly enableCompression: boolean;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    keys: 0,
    memoryUsage: 0,
    hitRate: 0,
  };

  private constructor(options: CacheServiceOptions) {
    super();
    this.redis = options.redisService;
    this.defaultTTL = options.defaultTTL ?? 300;
    this.enableStaleWhileRevalidate = options.enableStaleWhileRevalidate ?? true;
    this.staleWhileRevalidateTTL = options.staleWhileRevalidateTTL ?? 600;
    this.keyPrefix = options.keyPrefix ?? 'cache';
    this.enableCompression = options.enableCompression ?? false;

    // Validate TTLs
    if (this.defaultTTL <= 0) {
      throw new CacheTTLError('Default TTL must be positive');
    }
    if (this.staleWhileRevalidateTTL <= this.defaultTTL) {
      throw new CacheTTLError('Stale-while-revalidate TTL must be greater than default TTL');
    }
  }

  /**
   * Get cache service instance (singleton)
   */
  public static getInstance(options: CacheServiceOptions): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService(options);
    }
    return CacheService.instance;
  }

  /**
   * Get a value from the cache
   */
  public async get<T>(key: string): Promise<CacheEntry<T> | null> {
    try {
      const fullKey = this.generateKey(key);
      const client = this.redis.getClient();
      const value = await client.get(fullKey);

      if (!value) {
        this.stats.misses++;
        this.updateHitRate();
        this.emit(CacheServiceEvent.MISS, key);
        return null;
      }

      try {
        const entry = await this.deserialize<CacheEntry<T>>(value);
        this.stats.hits++;
        this.updateHitRate();

        if (this.isStale(entry)) {
          this.emit(CacheServiceEvent.STALE, key);
        } else {
          this.emit(CacheServiceEvent.HIT, key);
        }

        return entry;
      } catch (error) {
        throw new CacheDeserializationError(
          `Failed to deserialize cache entry: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    } catch (error) {
      if (error instanceof CacheServiceError) {
        throw error;
      }
      throw new CacheOperationError(
        `Failed to get cache entry: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Set a value in the cache
   */
  public async set<T>(
    key: string,
    value: T,
    options: { ttl?: number; etag?: string } = {}
  ): Promise<void> {
    try {
      const fullKey = this.generateKey(key);
      const client = this.redis.getClient();
      const ttl = options.ttl ?? this.defaultTTL;

      if (ttl <= 0) {
        throw new CacheTTLError('TTL must be positive');
      }

      const entry: CacheEntry<T> = {
        data: value,
        timestamp: Date.now(),
        etag: options.etag ?? this.generateETag(value),
        ttl,
      };

      const serialized = await this.serialize(entry);
      await client.set(fullKey, serialized, 'EX', ttl);

      this.stats.keys++;
      this.emit(CacheServiceEvent.SET, key);
    } catch (error) {
      if (error instanceof CacheServiceError) {
        throw error;
      }
      throw new CacheOperationError(
        `Failed to set cache entry: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Delete a value from the cache
   */
  public async delete(key: string): Promise<void> {
    try {
      const fullKey = this.generateKey(key);
      const client = this.redis.getClient();
      await client.del(fullKey);

      this.stats.keys = Math.max(0, this.stats.keys - 1);
      this.emit(CacheServiceEvent.DELETE, key);
    } catch (error) {
      if (error instanceof CacheServiceError) {
        throw error;
      }
      throw new CacheOperationError(
        `Failed to delete cache entry: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate a cache key
   */
  public generateKey(...parts: string[]): string {
    if (parts.length === 0) {
      throw new CacheKeyError('Cache key parts cannot be empty');
    }

    const sanitizedParts = parts.map((part) => {
      if (!part || typeof part !== 'string') {
        throw new CacheKeyError('Cache key parts must be non-empty strings');
      }
      return part.replace(/[^a-zA-Z0-9_-]/g, '_');
    });

    return `${this.keyPrefix}:${sanitizedParts.join(':')}`;
  }

  /**
   * Generate an ETag for a value
   */
  public generateETag<T>(value: T): string {
    const serialized = JSON.stringify(value);
    return createHash('sha256').update(Buffer.from(serialized)).digest('hex');
  }

  /**
   * Check if a value is stale
   */
  public isStale<T>(entry: CacheEntry<T>): boolean {
    const now = Date.now();
    const age = now - entry.timestamp;
    const isStale = age > entry.ttl * 1000;

    if (isStale && !this.enableStaleWhileRevalidate) {
      return true;
    }

    if (isStale && this.enableStaleWhileRevalidate) {
      return age > this.staleWhileRevalidateTTL * 1000;
    }

    return false;
  }

  /**
   * Get cache statistics
   */
  public async getStats(): Promise<CacheStats> {
    try {
      const client = this.redis.getClient();
      const info = await client.info('memory');
      const memoryUsage = this.parseMemoryUsage(info);

      return {
        ...this.stats,
        memoryUsage,
      };
    } catch (error) {
      throw new CacheStatsError(
        `Failed to get cache stats: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Add event listener with type safety
   */
  public on<K extends keyof CacheServiceEventMap>(
    event: K,
    listener: CacheServiceEventMap[K]
  ): this {
    return super.on(event, listener);
  }

  /**
   * Remove event listener
   */
  public off<K extends keyof CacheServiceEventMap>(
    event: K,
    listener: CacheServiceEventMap[K]
  ): this {
    return super.off(event, listener);
  }

  /**
   * Serialize a value to JSON
   */
  private async serialize<T>(value: T): Promise<string> {
    try {
      const json = JSON.stringify(value);
      
      if (!this.enableCompression || json.length < MIN_COMPRESSION_SIZE) {
        return json;
      }

      try {
        const jsonBuffer = Buffer.from(json);
        const compressed = await gzipAsync(jsonBuffer);
        // Prefix compressed data with a marker and original length
        return `C:${jsonBuffer.length}:${compressed.toString('base64')}`;
      } catch (error) {
        throw new CacheCompressionError(
          `Failed to compress value: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    } catch (error) {
      if (error instanceof CacheServiceError) {
        throw error;
      }
      throw new CacheSerializationError(
        `Failed to serialize value: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Deserialize a JSON string to a value
   */
  private async deserialize<T>(value: string): Promise<T> {
    try {
      // Check if the value is compressed
      if (value.startsWith('C:')) {
        try {
          const [, originalLength, compressed] = value.split(':');
          const compressedBuffer = Buffer.from(compressed, 'base64');
          const decompressed = await gunzipAsync(compressedBuffer);
          
          if (decompressed.length !== parseInt(originalLength, 10)) {
            throw new CacheDecompressionError('Decompressed data length mismatch');
          }
          
          return JSON.parse(decompressed.toString()) as T;
        } catch (error) {
          throw new CacheDecompressionError(
            `Failed to decompress value: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }
      
      return JSON.parse(value) as T;
    } catch (error) {
      if (error instanceof CacheServiceError) {
        throw error;
      }
      throw new CacheDeserializationError(
        `Failed to deserialize value: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Parse memory usage from Redis INFO command
   */
  private parseMemoryUsage(info: string): number {
    const memoryMatch = info.match(/used_memory:(\d+)/);
    return memoryMatch ? parseInt(memoryMatch[1], 10) : 0;
  }
} 