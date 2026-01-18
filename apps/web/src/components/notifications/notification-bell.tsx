'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { NotificationCenter } from './notification-center';
import { useNotificationStore, type Notification } from '@/stores/notification-store';
import { useAuthStore } from '@/stores/auth-store';

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const t = useTranslations('notifications');
  const locale = useLocale();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const { unreadCount, initialize, isConnected } = useNotificationStore();
  const { accessToken, isAuthenticated } = useAuthStore();

  // Initialize WebSocket connection when authenticated
  React.useEffect(() => {
    if (isAuthenticated && accessToken && !isConnected) {
      initialize(accessToken);
    }
  }, [isAuthenticated, accessToken, isConnected, initialize]);

  const handleNotificationClick = (notification: Notification) => {
    // Navigate based on notification type and entity
    if (notification.entityType && notification.entityId) {
      switch (notification.entityType) {
        case 'appointment':
          router.push(`/${locale}/appointments/${notification.entityId}`);
          break;
        case 'task':
          router.push(`/${locale}/tasks`);
          break;
        case 'lead':
          router.push(`/${locale}/leads/${notification.entityId}`);
          break;
        case 'invoice':
          router.push(`/${locale}/invoices/${notification.entityId}`);
          break;
        case 'conversation':
          router.push(`/${locale}/inbox/${notification.entityId}`);
          break;
        default:
          break;
      }
    }
  };

  const handleSettingsClick = () => {
    setOpen(false);
    router.push(`/${locale}/settings/notifications`);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('relative', className)}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -end-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
          <span className="sr-only">{t('title')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[380px] p-0"
        sideOffset={8}
      >
        <NotificationCenter
          onClose={() => setOpen(false)}
          onSettingsClick={handleSettingsClick}
          onNotificationClick={handleNotificationClick}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
