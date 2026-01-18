import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../../prisma/prisma.service';
import { RedisPubSubService, NotificationPubSubMessage } from './redis-pubsub.service';

interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
    tenantId: string;
    role: string;
  };
}

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: '*',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private connectedUsers = new Map<string, Set<string>>(); // userId -> Set<socketId>

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
    private redisPubSub: RedisPubSubService,
  ) {}

  onModuleInit() {
    // Subscribe to Redis pub/sub for horizontal scaling
    this.redisPubSub.onMessage((message: NotificationPubSubMessage) => {
      this.handlePubSubMessage(message);
    });
  }

  afterInit() {
    this.logger.log('Notifications WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from query or auth header
      const token =
        client.handshake.query.token as string ||
        client.handshake.auth?.token ||
        client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn('Connection rejected: No token provided');
        client.disconnect();
        return;
      }

      // Verify JWT
      const secret = this.configService.get<string>('JWT_SECRET');
      const payload = this.jwtService.verify(token, { secret });

      // Attach user data to socket
      client.data = {
        userId: payload.sub,
        tenantId: payload.tenantId,
        role: payload.role,
      };

      // Join user-specific and tenant-specific rooms
      const userRoom = `user:${payload.sub}`;
      const tenantRoom = `tenant:${payload.tenantId}`;

      client.join(userRoom);
      client.join(tenantRoom);

      // Track connected users
      if (!this.connectedUsers.has(payload.sub)) {
        this.connectedUsers.set(payload.sub, new Set());
      }
      this.connectedUsers.get(payload.sub)!.add(client.id);

      this.logger.log(`Client connected: ${client.id} (user: ${payload.sub})`);

      // Send initial unread count
      const unreadCount = await this.getUnreadCount(payload.tenantId, payload.sub);
      client.emit('notification:count', { unreadCount });
    } catch (error) {
      this.logger.warn(`Connection rejected: Invalid token - ${error}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.data?.userId) {
      const userSockets = this.connectedUsers.get(client.data.userId);
      if (userSockets) {
        userSockets.delete(client.id);
        if (userSockets.size === 0) {
          this.connectedUsers.delete(client.data.userId);
        }
      }
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Handle Redis pub/sub messages for horizontal scaling
  private handlePubSubMessage(message: NotificationPubSubMessage) {
    const userRoom = `user:${message.userId}`;

    switch (message.type) {
      case 'new_notification':
        this.server.to(userRoom).emit('notification:new', message.data);
        break;
      case 'count_update':
        this.server.to(userRoom).emit('notification:count', message.data);
        break;
      case 'mark_read':
        this.server.to(userRoom).emit('notification:read', message.data);
        break;
    }
  }

  // Subscribe to mark notification as read
  @SubscribeMessage('notification:markRead')
  async handleMarkRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { notificationId: string },
  ) {
    try {
      const { userId, tenantId } = client.data;

      await this.prisma.notification.updateMany({
        where: {
          id: data.notificationId,
          userId,
          tenantId,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      // Get updated unread count
      const unreadCount = await this.getUnreadCount(tenantId, userId);

      // Broadcast to all user's connected clients via Redis
      await this.redisPubSub.publishCountUpdate(tenantId, userId, unreadCount);

      return { success: true };
    } catch (error) {
      this.logger.error('Error marking notification as read:', error);
      return { success: false, error: 'Failed to mark as read' };
    }
  }

  // Subscribe to mark all as read
  @SubscribeMessage('notification:markAllRead')
  async handleMarkAllRead(@ConnectedSocket() client: AuthenticatedSocket) {
    try {
      const { userId, tenantId } = client.data;

      await this.prisma.notification.updateMany({
        where: {
          userId,
          tenantId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      // Broadcast zero count via Redis
      await this.redisPubSub.publishCountUpdate(tenantId, userId, 0);

      return { success: true };
    } catch (error) {
      this.logger.error('Error marking all notifications as read:', error);
      return { success: false, error: 'Failed to mark all as read' };
    }
  }

  // Get unread count for a user
  private async getUnreadCount(tenantId: string, userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        tenantId,
        userId,
        isRead: false,
      },
    });
  }

  // Send notification to a specific user (called from service)
  async sendToUser(tenantId: string, userId: string, notification: any) {
    // Publish via Redis for horizontal scaling
    await this.redisPubSub.publishNewNotification(tenantId, userId, notification);

    // Also get and send updated count
    const unreadCount = await this.getUnreadCount(tenantId, userId);
    await this.redisPubSub.publishCountUpdate(tenantId, userId, unreadCount);
  }

  // Send notification to all users in a tenant
  async sendToTenant(tenantId: string, notification: any) {
    this.server.to(`tenant:${tenantId}`).emit('notification:new', notification);
  }

  // Check if a user is connected
  isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId) && this.connectedUsers.get(userId)!.size > 0;
  }

  // Get count of connected clients for a user
  getUserConnectionCount(userId: string): number {
    return this.connectedUsers.get(userId)?.size || 0;
  }
}
