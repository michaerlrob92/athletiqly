import { Router } from 'express';
import { HealthController } from '../controllers/health.controller';
import { logger } from '@/utils/logger';

const router = Router();
const healthController = new HealthController();

// Health check endpoint
router.get('/health', (req, res) => healthController.checkHealth(req, res));

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
