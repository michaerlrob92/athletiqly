import { z } from 'zod';
import { RedisOptions } from 'ioredis';

// Default retry strategy function
const defaultRetryStrategy = (times: number) => Math.min(times * 50, 2000);

// Redis configuration schema
const redisConfigSchema = z.object({
  host: z.string().default('localhost'),
  port: z.number().int().positive().default(6379),
  password: z.string().optional(),
  db: z.number().int().nonnegative().default(0),
  tls: z.boolean().default(false),
  maxRetriesPerRequest: z.number().int().positive().default(3),
  enableReadyCheck: z.boolean().default(true),
  retryStrategy: z.function()
    .args(z.number())
    .returns(z.number().nullable())
    .default(defaultRetryStrategy),
});

// Type for Redis configuration
export type RedisConfig = z.infer<typeof redisConfigSchema>;

// Parse environment variables
const parseEnvConfig = (): Partial<RedisConfig> => {
  const isTest = process.env.NODE_ENV === 'test';
  
  return {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : undefined,
    password: process.env.REDIS_PASSWORD,
    db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB, 10) : (isTest ? 15 : undefined),
    tls: process.env.REDIS_TLS === 'true',
    // Always include retryStrategy in test environment
    ...(isTest ? { retryStrategy: defaultRetryStrategy } : {}),
  };
};

// Default Redis configuration
export const redisConfig: RedisConfig = redisConfigSchema.parse(parseEnvConfig());

// Convert to ioredis options
export const getRedisOptions = (): RedisOptions => ({
  ...redisConfig,
  tls: redisConfig.tls ? {} : undefined,
});

// Export validation function
export const validateRedisConfig = (config: unknown): RedisConfig => {
  return redisConfigSchema.parse(config);
}; 