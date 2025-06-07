import { Router } from 'express';
import healthController from '@/controllers/health.controller';

const router = Router();

router.get(
  '/',
  async (req, res) => await healthController.checkHealth(req, res)
);

process.on('SIGTERM', async () => {
  await healthController.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await healthController.close();
  process.exit(0);
});

export default router;
