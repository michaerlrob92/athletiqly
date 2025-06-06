import { Request, Response } from 'express';
import { HealthService } from '../services/health.service';
import { logger } from '@/utils/logger';

export class HealthController {
  private healthService: HealthService;

  constructor() {
    this.healthService = new HealthService();
  }

  async checkHealth(req: Request, res: Response): Promise<void> {
    try {
      const healthStatus = await this.healthService.checkHealth();

      // Set appropriate status code based on health
      const statusCode = healthStatus.status === 'healthy' ? 200 : 503;

      res.status(statusCode).json({
        ...healthStatus,
        service: 'athletiqly',
        version: process.env.npm_package_version || '1.0.0',
      });
    } catch (error) {
      logger.error('Health check failed:', error);
      res.status(500).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Internal server error during health check',
      });
    }
  }

  async close(): Promise<void> {
    await this.healthService.close();
  }
}
