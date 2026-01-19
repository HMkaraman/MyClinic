import { NotificationType } from '@prisma/client';

// Event names
export const NOTIFICATION_EVENTS = {
  APPOINTMENT_CREATED: 'notification.appointment.created',
  APPOINTMENT_CANCELLED: 'notification.appointment.cancelled',
  APPOINTMENT_RESCHEDULED: 'notification.appointment.rescheduled',
  TASK_ASSIGNED: 'notification.task.assigned',
  TASK_COMPLETED: 'notification.task.completed',
  LEAD_STAGE_CHANGED: 'notification.lead.stage_changed',
  INVOICE_PAID: 'notification.invoice.paid',
  INVOICE_OVERDUE: 'notification.invoice.overdue',
  MESSAGE_RECEIVED: 'notification.message.received',
  SYSTEM: 'notification.system',
} as const;

// Base event payload interface
export interface BaseNotificationEventPayload {
  tenantId: string;
  recipientUserIds: string[];
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
}

// Appointment events
export interface AppointmentCreatedEvent extends BaseNotificationEventPayload {
  appointmentId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  scheduledAt: Date;
  serviceName: string;
}

export interface AppointmentCancelledEvent extends BaseNotificationEventPayload {
  appointmentId: string;
  patientName: string;
  doctorId: string;
  cancelReason?: string;
}

export interface AppointmentRescheduledEvent extends BaseNotificationEventPayload {
  appointmentId: string;
  newAppointmentId: string;
  patientName: string;
  doctorId: string;
  oldScheduledAt: Date;
  newScheduledAt: Date;
  reason?: string;
}

// Task events
export interface TaskAssignedEvent extends BaseNotificationEventPayload {
  taskId: string;
  taskTitle: string;
  assignedById: string;
  assignedByName: string;
  dueDate: Date;
}

export interface TaskCompletedEvent extends BaseNotificationEventPayload {
  taskId: string;
  taskTitle: string;
  completedById: string;
  completedByName: string;
}

// Lead events
export interface LeadStageChangedEvent extends BaseNotificationEventPayload {
  leadId: string;
  leadName: string;
  previousStage: string;
  newStage: string;
  changedById: string;
  changedByName: string;
}

// Invoice events
export interface InvoicePaidEvent extends BaseNotificationEventPayload {
  invoiceId: string;
  invoiceNumber: string;
  patientName: string;
  amount: number;
}

export interface InvoiceOverdueEvent extends BaseNotificationEventPayload {
  invoiceId: string;
  invoiceNumber: string;
  patientName: string;
  amount: number;
  dueDate: Date;
}

// Message events
export interface MessageReceivedEvent extends BaseNotificationEventPayload {
  conversationId: string;
  senderName: string;
  messagePreview: string;
  channel: string;
}

// System events
export interface SystemNotificationEvent extends BaseNotificationEventPayload {
  title: string;
  message: string;
}

// Map notification type to preference field
export const NOTIFICATION_TYPE_TO_PREFERENCE: Record<NotificationType, string> = {
  APPOINTMENT_CREATED: 'appointmentCreated',
  APPOINTMENT_CANCELLED: 'appointmentCancelled',
  APPOINTMENT_RESCHEDULED: 'appointmentRescheduled',
  PATIENT_ASSIGNED: 'appointmentCreated', // Group with appointments
  TASK_ASSIGNED: 'taskAssigned',
  TASK_COMPLETED: 'taskCompleted',
  LEAD_STAGE_CHANGED: 'leadStageChanged',
  INVOICE_PAID: 'invoicePaid',
  INVOICE_OVERDUE: 'invoiceOverdue',
  MESSAGE_RECEIVED: 'messageReceived',
  SYSTEM: 'systemNotifications',
  // Inventory notifications
  LOW_STOCK_ALERT: 'systemNotifications',
  STOCK_EXPIRED: 'systemNotifications',
  PURCHASE_ORDER_APPROVED: 'systemNotifications',
  PURCHASE_ORDER_RECEIVED: 'systemNotifications',
  // Scheduling notifications
  TIME_OFF_REQUESTED: 'systemNotifications',
  TIME_OFF_APPROVED: 'systemNotifications',
  TIME_OFF_REJECTED: 'systemNotifications',
  SCHEDULE_CHANGED: 'systemNotifications',
};
