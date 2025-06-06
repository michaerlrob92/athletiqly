import { Router } from 'express';
import { HealthController } from '../controllers/health.controller';
import { logger } from '@/utils/logger';
import { RedisService } from '@/services/infrastructure/redis/redis.service';
import { CacheService } from '@/services/cache/cache.service';
import { cacheMiddleware, CachePolicy } from '@/middleware/cache.middleware';
import { redisConfig } from '@/config/redis.config';

const router = Router();

// Initialize services
const redisService = RedisService.getInstance({ 
  config: redisConfig,
  createSubscriber: true 
});
const cacheService = CacheService.getInstance({ redisService });

// Initialize controller with services
const healthController = new HealthController(redisService, cacheService);

// Cache policy for health endpoint
const healthCachePolicy: CachePolicy = {
  enabled: true,
  ttl: 30, // 30 seconds
  staleWhileRevalidate: true,
  staleWhileRevalidateTTL: 60, // 60 seconds
  etag: true,
  keyGenerator: (req) => `health:status:v1:system`,
  bypassCache: (req) => {
    // Bypass cache for non-GET requests or if cache-bust header is present
    return req.method !== 'GET' || req.headers['cache-control'] === 'no-cache';
  },
};

// Health check endpoint with cache middleware
router.get('/health', 
  cacheMiddleware(cacheService, healthCachePolicy),
  (req, res) => healthController.checkHealth(req, res)
);

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Closing health check connections...');
  await healthController.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Closing health check connections...');
  await healthController.close();
  process.exit(0);
});

export default router;
