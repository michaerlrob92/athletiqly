import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ICacheService, CacheEntry } from '@/services/cache';
import { CacheServiceError } from '@/services/cache/cache.errors';
import { logger } from '@/utils/logger';
import { RequestWithId } from './request-id.middleware';

/**
 * Cache policy configuration for routes
 */
export interface CachePolicy {
  /** Whether to enable caching for this route */
  enabled: boolean;
  /** Cache TTL in seconds */
  ttl: number;
  /** Whether to enable stale-while-revalidate */
  staleWhileRevalidate?: boolean;
  /** TTL for stale-while-revalidate in seconds */
  staleWhileRevalidateTTL?: number;
  /** Whether to enable ETag validation */
  etag?: boolean;
  /** Custom cache key generator function */
  keyGenerator?: (req: Request) => string;
  /** Function to determine if request should bypass cache */
  bypassCache?: (req: Request) => boolean;
}

/**
 * Default cache policy
 */
const DEFAULT_CACHE_POLICY: CachePolicy = {
  enabled: true,
  ttl: 300, // 5 minutes
  staleWhileRevalidate: true,
  staleWhileRevalidateTTL: 600, // 10 minutes
  etag: true,
};

/**
 * Generate cache key from request
 */
function generateCacheKey(req: Request, policy: CachePolicy): string {
  if (policy.keyGenerator) {
    return policy.keyGenerator(req);
  }

  // Default key generation based on URL and query parameters
  const { originalUrl, method, query } = req;
  const queryString = Object.keys(query).length
    ? `?${new URLSearchParams(query as Record<string, string>).toString()}`
    : '';
  
  return `${method}:${originalUrl}${queryString}`;
}

/**
 * Set cache control headers
 */
function setCacheHeaders(
  res: Response,
  policy: CachePolicy,
  entry?: CacheEntry<unknown>
): void {
  const directives: string[] = [];

  if (!policy.enabled) {
    directives.push('no-store');
  } else {
    if (entry?.etag) {
      res.setHeader('ETag', entry.etag);
    }

    if (policy.staleWhileRevalidate) {
      directives.push(
        `max-age=${policy.ttl}`,
        `stale-while-revalidate=${policy.staleWhileRevalidateTTL ?? policy.ttl * 2}`
      );
    } else {
      directives.push(`max-age=${policy.ttl}`);
    }
  }

  res.setHeader('Cache-Control', directives.join(', '));
}

/**
 * Cache middleware factory
 * Creates middleware with the specified cache policy
 * 
 * @param cacheService - The cache service instance
 * @param policy - Cache policy configuration
 * @returns Express middleware function
 * 
 * @example
 * ```typescript
 * // Basic usage with default policy
 * app.get('/api/users', cacheMiddleware(cacheService, { enabled: true }));
 * 
 * // Custom policy
 * app.get('/api/products', cacheMiddleware(cacheService, {
 *   enabled: true,
 *   ttl: 600,
 *   etag: true,
 *   keyGenerator: (req) => `products:${req.params.id}`
 * }));
 * ```
 */
export const cacheMiddleware = (
  cacheService: ICacheService,
  policy: Partial<CachePolicy> = {}
): RequestHandler => {
  // Merge with default policy
  const finalPolicy: CachePolicy = {
    ...DEFAULT_CACHE_POLICY,
    ...policy,
  };

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Cast to RequestWithId after request-id middleware has run
    const reqWithId = req as RequestWithId;

    // Skip caching if disabled or bypassed
    if (!finalPolicy.enabled || (finalPolicy.bypassCache && finalPolicy.bypassCache(req))) {
      return next();
    }

    try {
      const cacheKey = generateCacheKey(req, finalPolicy);

      // Check ETag if enabled
      if (finalPolicy.etag) {
        const ifNoneMatch = req.headers['if-none-match'];
        if (ifNoneMatch) {
          const entry = await cacheService.get<unknown>(cacheKey);
          if (entry?.etag === ifNoneMatch) {
            res.status(304).end(); // Not Modified
            return;
          }
        }
      }

      // Try to get from cache
      const entry = await cacheService.get<unknown>(cacheKey);
      
      if (entry) {
        // Cache hit
        setCacheHeaders(res, finalPolicy, entry);
        res.json(entry.data);
        return;
      }

      // Cache miss - store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache response
      res.json = function (body: unknown): Response {
        // Cache the response
        cacheService
          .set(cacheKey, body, {
            ttl: finalPolicy.ttl,
            etag: finalPolicy.etag ? cacheService.generateETag(body) : undefined,
          })
          .catch((error) => {
            logger.error('Failed to cache response', {
              error,
              requestId: reqWithId.id,
              cacheKey,
              path: req.originalUrl,
            });
          });

        // Set cache headers
        setCacheHeaders(res, finalPolicy);

        // Call original json method
        return originalJson(body);
      };

      next();
    } catch (error) {
      // Log cache errors but continue with request
      logger.error('Cache middleware error', {
        error,
        requestId: reqWithId.id,
        path: req.originalUrl,
        policy: finalPolicy,
      });

      // Continue with request on cache errors
      if (error instanceof CacheServiceError) {
        next();
      } else {
        next(error);
      }
    }
  };
}; 