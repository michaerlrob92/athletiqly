import { Redis } from 'ioredis';
import { RedisConfig } from '../../../config/redis.config';

// Redis service interface
export interface IRedisService {
  /**
   * Get the Redis client instance
   */
  getClient(): Redis;

  /**
   * Get the Redis subscriber instance
   */
  getSubscriber(): Redis;

  /**
   * Check if the Redis service is healthy
   */
  healthCheck(): Promise<boolean>;

  /**
   * Gracefully shutdown the Redis service
   */
  shutdown(): Promise<void>;
}

// Redis service options
export interface RedisServiceOptions {
  /**
   * Redis configuration
   */
  config: RedisConfig;

  /**
   * Whether to create a subscriber client
   * @default true
   */
  createSubscriber?: boolean;
}

// Redis service events
export enum RedisServiceEvent {
  CONNECT = 'connect',
  ERROR = 'error',
  CLOSE = 'close',
  RECONNECTING = 'reconnecting',
  READY = 'ready',
}

// Redis service event handlers
export type RedisServiceEventHandler = (error?: Error) => void;

// Redis service event map
export interface RedisServiceEventMap {
  [RedisServiceEvent.CONNECT]: () => void;
  [RedisServiceEvent.ERROR]: (error: Error) => void;
  [RedisServiceEvent.CLOSE]: () => void;
  [RedisServiceEvent.RECONNECTING]: () => void;
  [RedisServiceEvent.READY]: () => void;
} 