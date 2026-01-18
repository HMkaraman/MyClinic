'use client';

import * as React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useTranslations } from 'next-intl';
import {
  Calendar,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  User,
  FileText,
  TrendingUp,
  X,
  Circle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { Notification, NotificationType } from '@/stores/notification-store';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick?: (notification: Notification) => void;
}

const typeIcons: Record<NotificationType, React.ElementType> = {
  APPOINTMENT_CREATED: Calendar,
  APPOINTMENT_CANCELLED: Calendar,
  APPOINTMENT_RESCHEDULED: Calendar,
  PATIENT_ASSIGNED: User,
  TASK_ASSIGNED: CheckCircle,
  TASK_COMPLETED: CheckCircle,
  LEAD_STAGE_CHANGED: TrendingUp,
  INVOICE_PAID: FileText,
  INVOICE_OVERDUE: AlertCircle,
  MESSAGE_RECEIVED: MessageSquare,
  SYSTEM: AlertCircle,
};

const typeColors: Record<NotificationType, string> = {
  APPOINTMENT_CREATED: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
  APPOINTMENT_CANCELLED: 'text-red-500 bg-red-50 dark:bg-red-900/20',
  APPOINTMENT_RESCHEDULED: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
  PATIENT_ASSIGNED: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
  TASK_ASSIGNED: 'text-green-500 bg-green-50 dark:bg-green-900/20',
  TASK_COMPLETED: 'text-green-600 bg-green-50 dark:bg-green-900/20',
  LEAD_STAGE_CHANGED: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20',
  INVOICE_PAID: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
  INVOICE_OVERDUE: 'text-red-600 bg-red-50 dark:bg-red-900/20',
  MESSAGE_RECEIVED: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-900/20',
  SYSTEM: 'text-gray-500 bg-gray-50 dark:bg-gray-900/20',
};

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
}: NotificationItemProps) {
  const t = useTranslations('notifications');
  const Icon = typeIcons[notification.type] || AlertCircle;
  const colorClass = typeColors[notification.type] || typeColors.SYSTEM;

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    onClick?.(notification);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(notification.id);
  };

  return (
    <div
      className={cn(
        'group relative flex items-start gap-3 p-3 cursor-pointer transition-colors',
        'hover:bg-accent/50',
        !notification.isRead && 'bg-accent/30'
      )}
      onClick={handleClick}
    >
      {/* Unread indicator */}
      {!notification.isRead && (
        <Circle className="absolute top-4 start-1 h-2 w-2 fill-primary text-primary" />
      )}

      {/* Icon */}
      <div className={cn('rounded-full p-2 shrink-0', colorClass)}>
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm font-medium',
          !notification.isRead && 'font-semibold'
        )}>
          {notification.title}
        </p>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>

      {/* Delete button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        onClick={handleDelete}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">{t('delete')}</span>
      </Button>
    </div>
  );
}
