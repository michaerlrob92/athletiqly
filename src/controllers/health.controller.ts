import { Request, Response } from 'express';
import { HealthService } from '../services/health.service';
import { IRedisService } from '@/services/infrastructure/redis/redis.types';
import { ICacheService } from '@/services/cache';
import { logger } from '@/utils/logger';
import { RequestWithId } from '@/middleware/request-id.middleware';

export class HealthController {
  private healthService: HealthService;

  constructor(redisService: IRedisService, cacheService: ICacheService) {
    this.healthService = new HealthService(redisService, cacheService);
  }

  async checkHealth(req: Request, res: Response): Promise<void> {
    try {
      const healthStatus = await this.healthService.checkHealth();
      const reqWithId = req as RequestWithId;

      // Set appropriate status code based on health
      const statusCode = healthStatus.status === 'healthy' ? 200 : 503;

      // Add cache headers
      res.set({
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
        'ETag': `"${healthStatus.timestamp}"`,
        'Vary': 'Accept-Encoding',
      });

      // Check if client sent If-None-Match header
      const ifNoneMatch = req.headers['if-none-match'];
      if (ifNoneMatch === `"${healthStatus.timestamp}"`) {
        res.status(304).end(); // Not Modified
        return;
      }

      res.status(statusCode).json({
        ...healthStatus,
        service: 'athletiqly',
        version: process.env.npm_package_version || '1.0.0',
        requestId: reqWithId.id,
      });
    } catch (error) {
      logger.error('Health check failed:', {
        error,
        requestId: (req as RequestWithId).id,
      });
      
      res.status(500).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Internal server error during health check',
        requestId: (req as RequestWithId).id,
      });
    }
  }

  async close(): Promise<void> {
    await this.healthService.close();
  }
}
