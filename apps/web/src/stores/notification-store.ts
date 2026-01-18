import { create } from 'zustand';
import { api } from '@/lib/api';
import {
  initSocket,
  disconnectSocket,
  markNotificationAsRead as socketMarkAsRead,
  markAllNotificationsAsRead as socketMarkAllAsRead,
  type NotificationData,
} from '@/lib/socket';

export type NotificationType =
  | 'APPOINTMENT_CREATED'
  | 'APPOINTMENT_CANCELLED'
  | 'APPOINTMENT_RESCHEDULED'
  | 'PATIENT_ASSIGNED'
  | 'TASK_ASSIGNED'
  | 'TASK_COMPLETED'
  | 'LEAD_STAGE_CHANGED'
  | 'INVOICE_PAID'
  | 'INVOICE_OVERDUE'
  | 'MESSAGE_RECEIVED'
  | 'SYSTEM';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationPreferences {
  appointmentCreated: boolean;
  appointmentCancelled: boolean;
  appointmentRescheduled: boolean;
  taskAssigned: boolean;
  taskCompleted: boolean;
  leadStageChanged: boolean;
  invoicePaid: boolean;
  invoiceOverdue: boolean;
  messageReceived: boolean;
  systemNotifications: boolean;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isConnected: boolean;
  preferences: NotificationPreferences | null;

  // Actions
  initialize: (token: string) => void;
  disconnect: () => void;
  fetchNotifications: (page?: number) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  fetchPreferences: () => Promise<void>;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  addNotification: (notification: Notification) => void;
  setUnreadCount: (count: number) => void;
  reset: () => void;
}

const initialState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  isConnected: false,
  preferences: null,
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  ...initialState,

  initialize: (token: string) => {
    const socket = initSocket(token);

    socket.on('connect', () => {
      set({ isConnected: true });
    });

    socket.on('disconnect', () => {
      set({ isConnected: false });
    });

    socket.on('notification:new', (notification: NotificationData) => {
      get().addNotification({
        id: notification.id,
        type: notification.type as NotificationType,
        title: notification.title,
        message: notification.message,
        entityType: notification.entityType,
        entityId: notification.entityId,
        metadata: notification.metadata,
        isRead: notification.isRead,
        readAt: notification.readAt,
        createdAt: notification.createdAt,
      });
    });

    socket.on('notification:count', (data: { unreadCount: number }) => {
      set({ unreadCount: data.unreadCount });
    });

    // Fetch initial data
    get().fetchNotifications();
    get().fetchUnreadCount();
  },

  disconnect: () => {
    disconnectSocket();
    set({ isConnected: false });
  },

  fetchNotifications: async (page = 1) => {
    set({ isLoading: true });
    try {
      const response = await api.get<{ data: Notification[] }>(
        `/notifications?page=${page}&limit=20`
      );
      if (page === 1) {
        set({ notifications: response.data });
      } else {
        set((state) => ({
          notifications: [...state.notifications, ...response.data],
        }));
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const response = await api.get<{ unreadCount: number }>(
        '/notifications/unread-count'
      );
      set({ unreadCount: response.unreadCount });
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  },

  markAsRead: async (id: string) => {
    try {
      // Optimistic update
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));

      // Also emit via WebSocket for real-time sync
      socketMarkAsRead(id);

      // API call for persistence
      await api.patch(`/notifications/${id}/read`);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // Revert on failure
      get().fetchNotifications();
      get().fetchUnreadCount();
    }
  },

  markAllAsRead: async () => {
    try {
      // Optimistic update
      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          isRead: true,
          readAt: new Date().toISOString(),
        })),
        unreadCount: 0,
      }));

      // Also emit via WebSocket
      socketMarkAllAsRead();

      // API call
      await api.post('/notifications/mark-all-read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      get().fetchNotifications();
      get().fetchUnreadCount();
    }
  },

  deleteNotification: async (id: string) => {
    try {
      const notification = get().notifications.find((n) => n.id === id);

      // Optimistic update
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: notification && !notification.isRead
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount,
      }));

      await api.delete(`/notifications/${id}`);
    } catch (error) {
      console.error('Failed to delete notification:', error);
      get().fetchNotifications();
      get().fetchUnreadCount();
    }
  },

  fetchPreferences: async () => {
    try {
      const response = await api.get<NotificationPreferences>(
        '/notifications/preferences'
      );
      set({ preferences: response });
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
    }
  },

  updatePreferences: async (preferences: Partial<NotificationPreferences>) => {
    try {
      const response = await api.patch<NotificationPreferences>(
        '/notifications/preferences',
        preferences
      );
      set({ preferences: response });
    } catch (error) {
      console.error('Failed to update preferences:', error);
      throw error;
    }
  },

  addNotification: (notification: Notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + (notification.isRead ? 0 : 1),
    }));
  },

  setUnreadCount: (count: number) => {
    set({ unreadCount: count });
  },

  reset: () => {
    get().disconnect();
    set(initialState);
  },
}));
