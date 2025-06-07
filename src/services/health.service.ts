import { PrismaClient } from '../generated/prisma';
import { logger } from '@/utils/logger';

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  database: {
    status: 'connected' | 'disconnected';
    poolSize?: number;
  };
}

export class HealthService {
  private prisma: PrismaClient;
  
  constructor() {
    this.prisma = new PrismaClient();
  }

  async checkHealth(): Promise<HealthStatus> {
    const timestamp = new Date().toISOString();
    const healthStatus: HealthStatus = {
      status: 'healthy',
      timestamp,
      database: {
        status: 'disconnected',
      },
    };

    try {
      // Check database connection
      await this.prisma.$queryRaw`SELECT 1`;
      healthStatus.database.status = 'connected';

      // Update overall status
      const isUnhealthy = 
        healthStatus.database.status !== 'connected';
      
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
