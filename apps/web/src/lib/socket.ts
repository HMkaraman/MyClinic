import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export interface NotificationData {
  id: string;
  tenantId: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationEvents {
  'notification:new': (notification: NotificationData) => void;
  'notification:count': (data: { unreadCount: number }) => void;
  'notification:read': (data: { notificationId: string }) => void;
}

export function getSocket(): Socket | null {
  return socket;
}

export function initSocket(token: string): Socket {
  if (socket?.connected) {
    return socket;
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  socket = io(`${apiUrl}/notifications`, {
    auth: { token },
    query: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect', () => {
    console.log('WebSocket connected to notifications');
  });

  socket.on('disconnect', (reason) => {
    console.log('WebSocket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('WebSocket connection error:', error.message);
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function markNotificationAsRead(notificationId: string): void {
  if (socket?.connected) {
    socket.emit('notification:markRead', { notificationId });
  }
}

export function markAllNotificationsAsRead(): void {
  if (socket?.connected) {
    socket.emit('notification:markAllRead');
  }
}
