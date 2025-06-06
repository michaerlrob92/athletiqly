import Redis from 'ioredis';
import { EventEmitter } from 'events';
import { logger } from '@/utils/logger';
import { getRedisOptions } from '@/config/redis.config';
import { IRedisService, RedisServiceEvent, RedisServiceEventMap, RedisServiceOptions } from './redis.types';
import {
  RedisConnectionError,
  RedisHealthCheckError,
  RedisNotReadyError,
  RedisServiceError,
} from './redis.errors';

/**
 * Redis service implementation
 */
export class RedisService extends EventEmitter implements IRedisService {
  private static instance: RedisService;
  private client: Redis;
  private subscriber: Redis | null = null;
  private isConnected: boolean = false;
  private isReady: boolean = false;

  private constructor(private readonly options: RedisServiceOptions) {
    super();
    this.client = new Redis(getRedisOptions());
    if (options.createSubscriber !== false) {
      this.subscriber = new Redis(getRedisOptions());
    }
    this.setupEventListeners();
  }

  /**
   * Get Redis service instance (singleton)
   */
  public static getInstance(options: RedisServiceOptions): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService(options);
    }
    return RedisService.instance;
  }

  /**
   * Set up event listeners for Redis clients
   */
  private setupEventListeners(): void {
    const setupClientListeners = (client: Redis, isSubscriber: boolean = false) => {
      const prefix = isSubscriber ? 'Subscriber' : 'Client';

      client.on(RedisServiceEvent.CONNECT, () => {
        this.isConnected = true;
        this.emit(RedisServiceEvent.CONNECT);
        logger.info(`Redis ${prefix} connected`);
      });

      client.on(RedisServiceEvent.ERROR, (error: Error) => {
        this.isConnected = false;
        this.isReady = false;
        this.emit(RedisServiceEvent.ERROR, error);
        logger.error(`Redis ${prefix} error:`, error);
      });

      client.on(RedisServiceEvent.CLOSE, () => {
        this.isConnected = false;
        this.isReady = false;
        this.emit(RedisServiceEvent.CLOSE);
        logger.warn(`Redis ${prefix} connection closed`);
      });

      client.on(RedisServiceEvent.RECONNECTING, () => {
        this.emit(RedisServiceEvent.RECONNECTING);
        logger.info(`Redis ${prefix} reconnecting...`);
      });

      client.on(RedisServiceEvent.READY, () => {
        this.isReady = true;
        this.emit(RedisServiceEvent.READY);
        logger.info(`Redis ${prefix} ready`);
      });
    };

    setupClientListeners(this.client);
    if (this.subscriber) {
      setupClientListeners(this.subscriber, true);
    }
  }

  /**
   * Get Redis client instance
   */
  public getClient(): Redis {
    if (!this.isReady) {
      throw new RedisNotReadyError();
    }
    return this.client;
  }

  /**
   * Get Redis subscriber instance
   */
  public getSubscriber(): Redis {
    if (!this.isReady) {
      throw new RedisNotReadyError();
    }
    if (!this.subscriber) {
      throw new RedisServiceError('Subscriber client not initialized');
    }
    return this.subscriber;
  }

  /**
   * Check if Redis service is healthy
   */
  public async healthCheck(): Promise<boolean> {
    try {
      if (!this.isConnected || !this.isReady) {
        return false;
      }

      const pingResult = await this.client.ping();
      if (pingResult !== 'PONG') {
        throw new RedisHealthCheckError('Ping failed');
      }

      if (this.subscriber) {
        const subscriberPingResult = await this.subscriber.ping();
        if (subscriberPingResult !== 'PONG') {
          throw new RedisHealthCheckError('Subscriber ping failed');
        }
      }

      return true;
    } catch (error) {
      logger.error('Redis health check failed:', error);
      if (error instanceof RedisServiceError) {
        throw error;
      }
      throw new RedisHealthCheckError(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gracefully shutdown Redis service
   */
  public async shutdown(): Promise<void> {
    try {
      const closePromises: Promise<unknown>[] = [];

      if (this.client.status === 'ready') {
        closePromises.push(this.client.quit().then(() => undefined));
      }

      if (this.subscriber?.status === 'ready') {
        closePromises.push(this.subscriber.quit().then(() => undefined));
      }

      await Promise.all(closePromises);
      this.isConnected = false;
      this.isReady = false;
      logger.info('Redis connections closed gracefully');
    } catch (error) {
      logger.error('Error during Redis shutdown:', error);
      throw new RedisServiceError(`Shutdown failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add event listener with type safety
   */
  public on<K extends keyof RedisServiceEventMap>(
    event: K,
    listener: RedisServiceEventMap[K]
  ): this {
    return super.on(event, listener);
  }

  /**
   * Remove event listener
   */
  public off<K extends keyof RedisServiceEventMap>(
    event: K,
    listener: RedisServiceEventMap[K]
  ): this {
    return super.off(event, listener);
  }
} 