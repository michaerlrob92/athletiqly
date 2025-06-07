import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from '@/config/environment';
import { stream } from '@/utils/logger';
import healthRoutes from '@/routes/health.routes';
import { requestIdMiddleware } from '@/middleware/request-id.middleware';
import { notFoundHandler } from '@/middleware/error.middleware';

const app = express();

app.use(requestIdMiddleware);

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: config.CORS_ORIGIN,
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (config.NODE_ENV !== 'production') {
  app.use(morgan('combined', { stream }));
}

// Routes
app.use('/health', healthRoutes);

// Not found handler (after all routes)
app.use(notFoundHandler);

export default app;
