import { PrismaClient } from '../generated/prisma';
import { logger } from '@/utils/logger';
import { IRedisService } from './infrastructure/redis/redis.types';
import { ICacheService } from './cache';

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  database: {
    status: 'connected' | 'disconnected';
    poolSize?: number;
  };
  redis: {
    status: 'connected' | 'disconnected';
    cacheHitRate?: number;
    memoryUsage?: number;
  };
  cache: {
    status: 'enabled' | 'disabled';
    hitRate?: number;
    memoryUsage?: number;
  };
}

export class HealthService {
  private prisma: PrismaClient;
  private redisService: IRedisService;
  private cacheService: ICacheService;

  constructor(redisService: IRedisService, cacheService: ICacheService) {
    this.prisma = new PrismaClient();
    this.redisService = redisService;
    this.cacheService = cacheService;
  }

  async checkHealth(): Promise<HealthStatus> {
    const timestamp = new Date().toISOString();
    const healthStatus: HealthStatus = {
      status: 'healthy',
      timestamp,
      database: {
        status: 'disconnected',
      },
      redis: {
        status: 'disconnected',
      },
      cache: {
        status: 'enabled',
      },
    };

    try {
      // Check database connection
      await this.prisma.$queryRaw`SELECT 1`;
      healthStatus.database.status = 'connected';

      // Check Redis connection
      const redisHealthy = await this.redisService.healthCheck();
      healthStatus.redis.status = redisHealthy ? 'connected' : 'disconnected';

      // Get cache stats if Redis is healthy
      if (redisHealthy) {
        try {
          const cacheStats = await this.cacheService.getStats();
          healthStatus.cache.hitRate = cacheStats.hitRate;
          healthStatus.cache.memoryUsage = cacheStats.memoryUsage;
          healthStatus.redis.cacheHitRate = cacheStats.hitRate;
          healthStatus.redis.memoryUsage = cacheStats.memoryUsage;
        } catch (error) {
          logger.error('Failed to get cache stats:', error);
          healthStatus.cache.status = 'disabled';
        }
      }

      // Update overall status
      const isUnhealthy = 
        healthStatus.database.status !== 'connected' || 
        healthStatus.redis.status !== 'connected';
      
      if (isUnhealthy) {
        healthStatus.status = 'unhealthy';
      }
    } catch (error) {
      healthStatus.status = 'unhealthy';
      logger.error('Health check failed:', error);
    }

    return healthStatus;
  }

  async close(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
