import { Injectable, NotFoundException, Logger, Inject, forwardRef } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Prisma, NotificationType } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/decorators/current-user.decorator';
import { NotificationsGateway } from './notifications.gateway';
import {
  CreateNotificationInternalDto,
  QueryNotificationsDto,
  UpdateNotificationPreferencesDto,
} from './dto';
import {
  NOTIFICATION_EVENTS,
  NOTIFICATION_TYPE_TO_PREFERENCE,
  AppointmentCreatedEvent,
  AppointmentCancelledEvent,
  AppointmentRescheduledEvent,
  TaskAssignedEvent,
  TaskCompletedEvent,
  LeadStageChangedEvent,
  InvoicePaidEvent,
  InvoiceOverdueEvent,
  MessageReceivedEvent,
} from './events/notification.events';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsGateway))
    private notificationsGateway: NotificationsGateway,
  ) {}

  async findAll(user: JwtPayload, query: QueryNotificationsDto) {
    const { isRead, type, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
      tenantId: user.tenantId,
      userId: user.sub,
    };

    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    if (type) {
      where.type = type;
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data: notifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUnreadCount(user: JwtPayload): Promise<number> {
    return this.prisma.notification.count({
      where: {
        tenantId: user.tenantId,
        userId: user.sub,
        isRead: false,
      },
    });
  }

  async markAsRead(user: JwtPayload, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
        userId: user.sub,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(user: JwtPayload) {
    const result = await this.prisma.notification.updateMany({
      where: {
        tenantId: user.tenantId,
        userId: user.sub,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { count: result.count };
  }

  async delete(user: JwtPayload, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
        userId: user.sub,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.delete({ where: { id } });
    return { success: true };
  }

  async getPreferences(user: JwtPayload) {
    let preferences = await this.prisma.notificationPreference.findUnique({
      where: { userId: user.sub },
    });

    // Create default preferences if they don't exist
    if (!preferences) {
      preferences = await this.prisma.notificationPreference.create({
        data: {
          tenantId: user.tenantId,
          userId: user.sub,
        },
      });
    }

    return preferences;
  }

  async updatePreferences(
    user: JwtPayload,
    dto: UpdateNotificationPreferencesDto,
  ) {
    return this.prisma.notificationPreference.upsert({
      where: { userId: user.sub },
      create: {
        tenantId: user.tenantId,
        userId: user.sub,
        ...dto,
      },
      update: dto,
    });
  }

  // Internal method to create notification
  async createNotification(dto: CreateNotificationInternalDto) {
    const notification = await this.prisma.notification.create({
      data: {
        tenantId: dto.tenantId,
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        message: dto.message,
        entityType: dto.entityType,
        entityId: dto.entityId,
        metadata: dto.metadata,
      },
    });

    // Send real-time notification via WebSocket
    try {
      await this.notificationsGateway.sendToUser(dto.tenantId, dto.userId, notification);
    } catch (error) {
      this.logger.warn(`Failed to send real-time notification: ${error}`);
    }

    return notification;
  }

  // Check if user has preference enabled for notification type
  async shouldNotifyUser(
    userId: string,
    notificationType: NotificationType,
  ): Promise<boolean> {
    const preferences = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    // Default to true if no preferences set
    if (!preferences) return true;

    const preferenceKey = NOTIFICATION_TYPE_TO_PREFERENCE[notificationType];
    return (preferences as any)[preferenceKey] ?? true;
  }

  // Event handlers for creating notifications
  @OnEvent(NOTIFICATION_EVENTS.APPOINTMENT_CREATED)
  async handleAppointmentCreated(payload: AppointmentCreatedEvent) {
    this.logger.debug(`Handling appointment created event: ${payload.appointmentId}`);

    for (const userId of payload.recipientUserIds) {
      const shouldNotify = await this.shouldNotifyUser(
        userId,
        NotificationType.APPOINTMENT_CREATED,
      );

      if (shouldNotify) {
        await this.createNotification({
          tenantId: payload.tenantId,
          userId,
          type: NotificationType.APPOINTMENT_CREATED,
          title: 'New Appointment',
          message: `New appointment scheduled for ${payload.patientName} with Dr. ${payload.doctorName}`,
          entityType: 'appointment',
          entityId: payload.appointmentId,
          metadata: {
            patientName: payload.patientName,
            doctorName: payload.doctorName,
            scheduledAt: payload.scheduledAt,
            serviceName: payload.serviceName,
          },
        });
      }
    }
  }

  @OnEvent(NOTIFICATION_EVENTS.APPOINTMENT_CANCELLED)
  async handleAppointmentCancelled(payload: AppointmentCancelledEvent) {
    this.logger.debug(`Handling appointment cancelled event: ${payload.appointmentId}`);

    for (const userId of payload.recipientUserIds) {
      const shouldNotify = await this.shouldNotifyUser(
        userId,
        NotificationType.APPOINTMENT_CANCELLED,
      );

      if (shouldNotify) {
        await this.createNotification({
          tenantId: payload.tenantId,
          userId,
          type: NotificationType.APPOINTMENT_CANCELLED,
          title: 'Appointment Cancelled',
          message: `Appointment for ${payload.patientName} has been cancelled${payload.cancelReason ? `: ${payload.cancelReason}` : ''}`,
          entityType: 'appointment',
          entityId: payload.appointmentId,
          metadata: {
            patientName: payload.patientName,
            cancelReason: payload.cancelReason,
          },
        });
      }
    }
  }

  @OnEvent(NOTIFICATION_EVENTS.APPOINTMENT_RESCHEDULED)
  async handleAppointmentRescheduled(payload: AppointmentRescheduledEvent) {
    this.logger.debug(`Handling appointment rescheduled event: ${payload.appointmentId}`);

    for (const userId of payload.recipientUserIds) {
      const shouldNotify = await this.shouldNotifyUser(
        userId,
        NotificationType.APPOINTMENT_RESCHEDULED,
      );

      if (shouldNotify) {
        await this.createNotification({
          tenantId: payload.tenantId,
          userId,
          type: NotificationType.APPOINTMENT_RESCHEDULED,
          title: 'Appointment Rescheduled',
          message: `Appointment for ${payload.patientName} has been rescheduled`,
          entityType: 'appointment',
          entityId: payload.newAppointmentId,
          metadata: {
            patientName: payload.patientName,
            oldScheduledAt: payload.oldScheduledAt,
            newScheduledAt: payload.newScheduledAt,
            reason: payload.reason,
          },
        });
      }
    }
  }

  @OnEvent(NOTIFICATION_EVENTS.TASK_ASSIGNED)
  async handleTaskAssigned(payload: TaskAssignedEvent) {
    this.logger.debug(`Handling task assigned event: ${payload.taskId}`);

    for (const userId of payload.recipientUserIds) {
      const shouldNotify = await this.shouldNotifyUser(
        userId,
        NotificationType.TASK_ASSIGNED,
      );

      if (shouldNotify) {
        await this.createNotification({
          tenantId: payload.tenantId,
          userId,
          type: NotificationType.TASK_ASSIGNED,
          title: 'Task Assigned',
          message: `${payload.assignedByName} assigned you a task: ${payload.taskTitle}`,
          entityType: 'task',
          entityId: payload.taskId,
          metadata: {
            taskTitle: payload.taskTitle,
            assignedByName: payload.assignedByName,
            dueDate: payload.dueDate,
          },
        });
      }
    }
  }

  @OnEvent(NOTIFICATION_EVENTS.TASK_COMPLETED)
  async handleTaskCompleted(payload: TaskCompletedEvent) {
    this.logger.debug(`Handling task completed event: ${payload.taskId}`);

    for (const userId of payload.recipientUserIds) {
      const shouldNotify = await this.shouldNotifyUser(
        userId,
        NotificationType.TASK_COMPLETED,
      );

      if (shouldNotify) {
        await this.createNotification({
          tenantId: payload.tenantId,
          userId,
          type: NotificationType.TASK_COMPLETED,
          title: 'Task Completed',
          message: `${payload.completedByName} completed task: ${payload.taskTitle}`,
          entityType: 'task',
          entityId: payload.taskId,
          metadata: {
            taskTitle: payload.taskTitle,
            completedByName: payload.completedByName,
          },
        });
      }
    }
  }

  @OnEvent(NOTIFICATION_EVENTS.LEAD_STAGE_CHANGED)
  async handleLeadStageChanged(payload: LeadStageChangedEvent) {
    this.logger.debug(`Handling lead stage changed event: ${payload.leadId}`);

    for (const userId of payload.recipientUserIds) {
      const shouldNotify = await this.shouldNotifyUser(
        userId,
        NotificationType.LEAD_STAGE_CHANGED,
      );

      if (shouldNotify) {
        await this.createNotification({
          tenantId: payload.tenantId,
          userId,
          type: NotificationType.LEAD_STAGE_CHANGED,
          title: 'Lead Stage Updated',
          message: `${payload.leadName} moved from ${payload.previousStage} to ${payload.newStage}`,
          entityType: 'lead',
          entityId: payload.leadId,
          metadata: {
            leadName: payload.leadName,
            previousStage: payload.previousStage,
            newStage: payload.newStage,
            changedByName: payload.changedByName,
          },
        });
      }
    }
  }

  @OnEvent(NOTIFICATION_EVENTS.INVOICE_PAID)
  async handleInvoicePaid(payload: InvoicePaidEvent) {
    this.logger.debug(`Handling invoice paid event: ${payload.invoiceId}`);

    for (const userId of payload.recipientUserIds) {
      const shouldNotify = await this.shouldNotifyUser(
        userId,
        NotificationType.INVOICE_PAID,
      );

      if (shouldNotify) {
        await this.createNotification({
          tenantId: payload.tenantId,
          userId,
          type: NotificationType.INVOICE_PAID,
          title: 'Invoice Paid',
          message: `Invoice ${payload.invoiceNumber} for ${payload.patientName} has been paid`,
          entityType: 'invoice',
          entityId: payload.invoiceId,
          metadata: {
            invoiceNumber: payload.invoiceNumber,
            patientName: payload.patientName,
            amount: payload.amount,
          },
        });
      }
    }
  }

  @OnEvent(NOTIFICATION_EVENTS.INVOICE_OVERDUE)
  async handleInvoiceOverdue(payload: InvoiceOverdueEvent) {
    this.logger.debug(`Handling invoice overdue event: ${payload.invoiceId}`);

    for (const userId of payload.recipientUserIds) {
      const shouldNotify = await this.shouldNotifyUser(
        userId,
        NotificationType.INVOICE_OVERDUE,
      );

      if (shouldNotify) {
        await this.createNotification({
          tenantId: payload.tenantId,
          userId,
          type: NotificationType.INVOICE_OVERDUE,
          title: 'Invoice Overdue',
          message: `Invoice ${payload.invoiceNumber} for ${payload.patientName} is overdue`,
          entityType: 'invoice',
          entityId: payload.invoiceId,
          metadata: {
            invoiceNumber: payload.invoiceNumber,
            patientName: payload.patientName,
            amount: payload.amount,
            dueDate: payload.dueDate,
          },
        });
      }
    }
  }

  @OnEvent(NOTIFICATION_EVENTS.MESSAGE_RECEIVED)
  async handleMessageReceived(payload: MessageReceivedEvent) {
    this.logger.debug(`Handling message received event: ${payload.conversationId}`);

    for (const userId of payload.recipientUserIds) {
      const shouldNotify = await this.shouldNotifyUser(
        userId,
        NotificationType.MESSAGE_RECEIVED,
      );

      if (shouldNotify) {
        await this.createNotification({
          tenantId: payload.tenantId,
          userId,
          type: NotificationType.MESSAGE_RECEIVED,
          title: 'New Message',
          message: `${payload.senderName}: ${payload.messagePreview}`,
          entityType: 'conversation',
          entityId: payload.conversationId,
          metadata: {
            senderName: payload.senderName,
            channel: payload.channel,
          },
        });
      }
    }
  }
}
