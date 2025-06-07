import { Request, Response } from 'express';
import { HealthService } from '@/services/health.service';
import { logger } from '@/utils/logger';
import { RequestWithId } from '@/middleware/request-id.middleware';

class HealthController {
  private healthService: HealthService;

  constructor() {
    this.healthService = new HealthService();
  }

  async checkHealth(req: Request, res: Response): Promise<void> {
    try {
      const healthStatus = await this.healthService.checkHealth();
      const reqWithId = req as RequestWithId;

      // Set appropriate status code based on health
      const statusCode = healthStatus.status === 'healthy' ? 200 : 503;

      res.status(statusCode).json({
        ...healthStatus,
        service: 'athletiqly',
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

export default new HealthController();
