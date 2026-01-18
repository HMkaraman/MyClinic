'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { CheckCheck, Settings, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NotificationItem } from './notification-item';
import { useNotificationStore, type Notification } from '@/stores/notification-store';

interface NotificationCenterProps {
  onClose?: () => void;
  onSettingsClick?: () => void;
  onNotificationClick?: (notification: Notification) => void;
}

export function NotificationCenter({
  onClose,
  onSettingsClick,
  onNotificationClick,
}: NotificationCenterProps) {
  const t = useTranslations('notifications');
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications,
  } = useNotificationStore();

  const [page, setPage] = React.useState(1);

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    await fetchNotifications(nextPage);
    setPage(nextPage);
  };

  const handleNotificationClick = (notification: Notification) => {
    onNotificationClick?.(notification);
    onClose?.();
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h3 className="font-semibold">{t('title')}</h3>
          {unreadCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {t('unreadCount', { count: unreadCount })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              <CheckCheck className="h-4 w-4 me-1" />
              {t('markAllRead')}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onSettingsClick}
          >
            <Settings className="h-4 w-4" />
            <span className="sr-only">{t('settings')}</span>
          </Button>
        </div>
      </div>

      {/* Notifications list */}
      <ScrollArea className="h-[400px]">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
            <p className="text-sm">{t('empty')}</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
                onClick={handleNotificationClick}
              />
            ))}
          </div>
        )}

        {/* Load more */}
        {notifications.length >= 20 * page && (
          <div className="p-4 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadMore}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              {t('loadMore')}
            </Button>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
