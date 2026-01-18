import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface NotificationPubSubMessage {
  type: 'new_notification' | 'count_update' | 'mark_read';
  tenantId: string;
  userId: string;
  data: any;
}

@Injectable()
export class RedisPubSubService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisPubSubService.name);
  private publisher!: Redis;
  private subscriber!: Redis;
  private readonly CHANNEL = 'notifications';

  private messageHandlers: ((message: NotificationPubSubMessage) => void)[] = [];

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.configService.get<string>(
      'REDIS_URL',
      'redis://localhost:6379',
    );

    // Create separate connections for pub/sub
    this.publisher = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.subscriber = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.publisher.on('error', (err) => {
      this.logger.error('Redis publisher error:', err);
    });

    this.subscriber.on('error', (err) => {
      this.logger.error('Redis subscriber error:', err);
    });

    this.publisher.on('connect', () => {
      this.logger.log('Redis publisher connected');
    });

    this.subscriber.on('connect', () => {
      this.logger.log('Redis subscriber connected');
    });

    // Subscribe to the notifications channel
    await this.subscriber.subscribe(this.CHANNEL);

    // Handle incoming messages
    this.subscriber.on('message', (channel, message) => {
      if (channel === this.CHANNEL) {
        try {
          const parsed = JSON.parse(message) as NotificationPubSubMessage;
          this.handleMessage(parsed);
        } catch (error) {
          this.logger.error('Failed to parse pub/sub message:', error);
        }
      }
    });
  }

  async onModuleDestroy() {
    await this.subscriber?.unsubscribe(this.CHANNEL);
    await this.publisher?.quit();
    await this.subscriber?.quit();
  }

  // Publish a message to all instances
  async publish(message: NotificationPubSubMessage): Promise<void> {
    await this.publisher.publish(this.CHANNEL, JSON.stringify(message));
  }

  // Register a handler for incoming messages
  onMessage(handler: (message: NotificationPubSubMessage) => void): void {
    this.messageHandlers.push(handler);
  }

  // Remove a handler
  offMessage(handler: (message: NotificationPubSubMessage) => void): void {
    const index = this.messageHandlers.indexOf(handler);
    if (index > -1) {
      this.messageHandlers.splice(index, 1);
    }
  }

  private handleMessage(message: NotificationPubSubMessage): void {
    for (const handler of this.messageHandlers) {
      try {
        handler(message);
      } catch (error) {
        this.logger.error('Error in message handler:', error);
      }
    }
  }

  // Helper methods for common operations
  async publishNewNotification(
    tenantId: string,
    userId: string,
    notification: any,
  ): Promise<void> {
    await this.publish({
      type: 'new_notification',
      tenantId,
      userId,
      data: notification,
    });
  }

  async publishCountUpdate(
    tenantId: string,
    userId: string,
    unreadCount: number,
  ): Promise<void> {
    await this.publish({
      type: 'count_update',
      tenantId,
      userId,
      data: { unreadCount },
    });
  }
}
