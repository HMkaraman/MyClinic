/**
 * Inbox, CRM, and Communication types
 */

import type { Timestamps, TenantEntity } from './common';

// ===========================================
// Channel
// ===========================================
export const CHANNEL = {
  WHATSAPP: 'WHATSAPP',
  SMS: 'SMS',
  EMAIL: 'EMAIL',
  WEB_CHAT: 'WEB_CHAT',
  PHONE: 'PHONE',
} as const;

export type Channel = (typeof CHANNEL)[keyof typeof CHANNEL];

// ===========================================
// Conversation Status
// ===========================================
export const CONVERSATION_STATUS = {
  OPEN: 'OPEN',
  PENDING: 'PENDING',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const;

export type ConversationStatus =
  (typeof CONVERSATION_STATUS)[keyof typeof CONVERSATION_STATUS];

// ===========================================
// Pipeline Stage (CRM)
// ===========================================
export const PIPELINE_STAGE = {
  INQUIRY: 'INQUIRY',
  QUALIFIED: 'QUALIFIED',
  BOOKED: 'BOOKED',
  ARRIVED: 'ARRIVED',
  FOLLOW_UP: 'FOLLOW_UP',
  RE_ENGAGE: 'RE_ENGAGE',
  CONVERTED: 'CONVERTED',
  LOST: 'LOST',
} as const;

export type PipelineStage = (typeof PIPELINE_STAGE)[keyof typeof PIPELINE_STAGE];

// ===========================================
// Lead
// ===========================================
export interface Lead extends Timestamps, TenantEntity {
  id: string;
  patientId?: string;
  name: string;
  phone: string;
  email?: string;
  source: Channel;
  stage: PipelineStage;
  notes?: string;
}

export interface CreateLeadInput {
  name: string;
  phone: string;
  email?: string;
  source: Channel;
  notes?: string;
}

// ===========================================
// Conversation
// ===========================================
export interface Conversation extends Timestamps, TenantEntity {
  id: string;
  channel: Channel;
  externalId?: string; // e.g., WhatsApp phone number
  leadId?: string;
  patientId?: string;
  assignedTo?: string;
  tags: string[];
  pipelineStage?: PipelineStage;
  status: ConversationStatus;
  lastMessageAt?: Date;
}

// ===========================================
// Message
// ===========================================
export type MessageDirection = 'INBOUND' | 'OUTBOUND';

export interface Message extends Timestamps {
  id: string;
  conversationId: string;
  direction: MessageDirection;
  content: string;
  attachments?: string[];
  isInternalNote: boolean;
  senderId?: string; // User ID for internal notes/outbound
  externalSenderId?: string; // For inbound messages
  readAt?: Date;
}

export interface SendMessageInput {
  conversationId: string;
  content: string;
  isInternalNote?: boolean;
  attachments?: string[];
}

// ===========================================
// Task (Follow-up)
// ===========================================
export const TASK_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type TaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS];

export const TASK_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

export type TaskPriority = (typeof TASK_PRIORITY)[keyof typeof TASK_PRIORITY];

export type TaskEntityType = 'LEAD' | 'PATIENT' | 'CONVERSATION' | 'APPOINTMENT';

export interface Task extends Timestamps {
  id: string;
  tenantId: string;
  entityType: TaskEntityType;
  entityId: string;
  assignedTo: string;
  title: string;
  description?: string;
  dueDate: Date;
  priority: TaskPriority;
  status: TaskStatus;
  completedAt?: Date;
  createdBy: string;
}

export interface CreateTaskInput {
  entityType: TaskEntityType;
  entityId: string;
  assignedTo: string;
  title: string;
  description?: string;
  dueDate: Date;
  priority?: TaskPriority;
}

// ===========================================
// Activity & Audit
// ===========================================
export type ActivityAction =
  | 'CREATED'
  | 'UPDATED'
  | 'DELETED'
  | 'STATUS_CHANGED'
  | 'ASSIGNED'
  | 'COMMENTED'
  | 'TAGGED'
  | 'UPLOADED'
  | 'DOWNLOADED';

export interface ActivityEvent extends Timestamps {
  id: string;
  entityType: string;
  entityId: string;
  action: ActivityAction;
  actorId: string;
  metadata?: Record<string, unknown>;
}

export interface AuditEvent extends Timestamps {
  id: string;
  tenantId: string;
  branchId?: string;
  userId: string;
  userRole: string;
  entityType: string;
  entityId: string;
  action: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  correlationId?: string;
  ipAddress?: string;
  userAgent?: string;
}
