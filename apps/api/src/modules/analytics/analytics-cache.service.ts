import { Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { Granularity } from './dto';

export interface CacheConfig {
  ttlSeconds: number;
}

@Injectable()
export class AnalyticsCacheService {
  private readonly CACHE_PREFIX = 'analytics';

  constructor(private redisService: RedisService) {}

  private getCacheTtl(granularity: Granularity): number {
    switch (granularity) {
      case Granularity.DAILY:
        return 60 * 5; // 5 minutes
      case Granularity.WEEKLY:
        return 60 * 15; // 15 minutes
      case Granularity.MONTHLY:
        return 60 * 60; // 1 hour
      default:
        return 60; // 1 minute
    }
  }

  private buildCacheKey(
    tenantId: string,
    reportType: string,
    params: Record<string, string | undefined>,
  ): string {
    const sortedParams = Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(':');

    return `${this.CACHE_PREFIX}:${tenantId}:${reportType}:${sortedParams}`;
  }

  async get<T>(
    tenantId: string,
    reportType: string,
    params: Record<string, string | undefined>,
  ): Promise<T | null> {
    const key = this.buildCacheKey(tenantId, reportType, params);
    const cached = await this.redisService.get(key);

    if (cached) {
      try {
        return JSON.parse(cached) as T;
      } catch {
        return null;
      }
    }

    return null;
  }

  async set<T>(
    tenantId: string,
    reportType: string,
    params: Record<string, string | undefined>,
    data: T,
    granularity: Granularity = Granularity.DAILY,
  ): Promise<void> {
    const key = this.buildCacheKey(tenantId, reportType, params);
    const ttl = this.getCacheTtl(granularity);

    await this.redisService.set(key, JSON.stringify(data), ttl);
  }

  async invalidate(tenantId: string, reportType?: string): Promise<void> {
    const client = this.redisService.getClient();
    const pattern = reportType
      ? `${this.CACHE_PREFIX}:${tenantId}:${reportType}:*`
      : `${this.CACHE_PREFIX}:${tenantId}:*`;

    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  }

  async getDashboardCache<T>(tenantId: string, branchId?: string): Promise<T | null> {
    return this.get<T>(tenantId, 'dashboard', { branchId });
  }

  async setDashboardCache<T>(tenantId: string, data: T, branchId?: string): Promise<void> {
    const key = this.buildCacheKey(tenantId, 'dashboard', { branchId });
    await this.redisService.set(key, JSON.stringify(data), 60); // 1 minute TTL for dashboard
  }
}
