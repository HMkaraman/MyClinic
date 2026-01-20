import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client!: Redis;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.configService.get<string>(
      'REDIS_URL',
      'redis://localhost:6379',
    );

    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    this.client.on('connect', () => {
      console.log('Redis connected');
    });
  }

  async onModuleDestroy() {
    await this.client?.quit();
  }

  getClient(): Redis {
    return this.client;
  }

  // Token blacklisting for logout
  async blacklistToken(
    token: string,
    expiresInSeconds: number,
  ): Promise<void> {
    await this.client.setex(`blacklist:${token}`, expiresInSeconds, '1');
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const result = await this.client.get(`blacklist:${token}`);
    return result === '1';
  }

  // 2FA temporary storage
  async store2FASecret(
    userId: string,
    secret: string,
    expiresInSeconds: number = 300, // 5 minutes
  ): Promise<void> {
    await this.client.setex(`2fa:setup:${userId}`, expiresInSeconds, secret);
  }

  async get2FASecret(userId: string): Promise<string | null> {
    return this.client.get(`2fa:setup:${userId}`);
  }

  async delete2FASecret(userId: string): Promise<void> {
    await this.client.del(`2fa:setup:${userId}`);
  }

  // Session management / caching
  async setSession(
    sessionId: string,
    data: Record<string, unknown>,
    expiresInSeconds: number,
  ): Promise<void> {
    await this.client.setex(
      `session:${sessionId}`,
      expiresInSeconds,
      JSON.stringify(data),
    );
  }

  async getSession(sessionId: string): Promise<Record<string, unknown> | null> {
    const data = await this.client.get(`session:${sessionId}`);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      console.error(`Failed to parse session data for ${sessionId}`);
      return null;
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.client.del(`session:${sessionId}`);
  }

  // Generic key-value operations
  async set(
    key: string,
    value: string,
    expiresInSeconds?: number,
  ): Promise<void> {
    if (expiresInSeconds) {
      await this.client.setex(key, expiresInSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }
}
