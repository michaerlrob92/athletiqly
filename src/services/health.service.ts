import { PrismaClient } from '../generated/prisma';
import { Pool } from 'pg';
import { logger } from '@/utils/logger';

interface PoolStats {
  database: string;
  cl_active: string;
  cl_waiting: string;
  maxwait: string;
}

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  database: {
    status: 'connected' | 'disconnected';
    poolSize?: number;
    activeConnections?: number;
    waitingConnections?: number;
    maxConnections?: number;
  };
  pgbouncer: {
    status: 'connected' | 'disconnected';
    pools?: {
      name: string;
      size: number;
      active: number;
      waiting: number;
      maxWait: number;
    }[];
  };
}

export class HealthService {
  private prisma: PrismaClient;
  private pool: Pool;

  constructor() {
    this.prisma = new PrismaClient();
    // Create a direct connection pool for pgBouncer stats
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 1, // We only need one connection for health checks
    });
  }

  async checkHealth(): Promise<HealthStatus> {
    const timestamp = new Date().toISOString();
    const healthStatus: HealthStatus = {
      status: 'healthy',
      timestamp,
      database: {
        status: 'disconnected',
      },
      pgbouncer: {
        status: 'disconnected',
      },
    };

    try {
      // Check database connection
      await this.prisma.$queryRaw`SELECT 1`;
      healthStatus.database.status = 'connected';

      // Get pgBouncer stats
      const [pools, stats] = await Promise.all([
        this.pool.query<PoolStats>('SHOW POOLS'),
        this.pool.query('SHOW STATS'),
      ]);

      // Process pgBouncer stats
      healthStatus.pgbouncer.status = 'connected';
      healthStatus.pgbouncer.pools = pools.rows.map(pool => ({
        name: pool.database,
        size: parseInt(pool.cl_active, 10),
        active: parseInt(pool.cl_active, 10),
        waiting: parseInt(pool.cl_waiting, 10),
        maxWait: parseInt(pool.maxwait, 10),
      }));

      // Add database pool stats
      const totalStats = stats.rows[0];
      healthStatus.database.poolSize = parseInt(
        totalStats.total_connections,
        10
      );
      healthStatus.database.activeConnections = parseInt(
        totalStats.active_connections,
        10
      );
      healthStatus.database.waitingConnections = parseInt(
        totalStats.waiting_connections,
        10
      );
      healthStatus.database.maxConnections = parseInt(
        totalStats.max_connections,
        10
      );

      // Check if we have any critical issues
      const isUnhealthy =
        healthStatus.database.status !== 'connected' ||
        healthStatus.pgbouncer.status !== 'connected' ||
        (healthStatus.database.waitingConnections ?? 0) > 10; // More than 10 waiting connections

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
    await this.pool.end();
    await this.prisma.$disconnect();
  }
}
