// Event names
export const SCHEDULING_EVENTS = {
  TIME_OFF_REQUESTED: 'scheduling.time_off.requested',
  TIME_OFF_APPROVED: 'scheduling.time_off.approved',
  TIME_OFF_REJECTED: 'scheduling.time_off.rejected',
  SCHEDULE_CHANGED: 'scheduling.schedule.changed',
} as const;

// Base event payload interface
export interface BaseSchedulingEventPayload {
  tenantId: string;
  recipientUserIds: string[];
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
}

// Time Off Requested
export interface TimeOffRequestedEvent extends BaseSchedulingEventPayload {
  requestId: string;
  userId: string;
  userName: string;
  type: string;
  startDate: Date;
  endDate: Date;
  reason?: string;
}

// Time Off Approved
export interface TimeOffApprovedEvent extends BaseSchedulingEventPayload {
  requestId: string;
  userId: string;
  userName: string;
  type: string;
  startDate: Date;
  endDate: Date;
  approvedById: string;
  approvedByName: string;
}

// Time Off Rejected
export interface TimeOffRejectedEvent extends BaseSchedulingEventPayload {
  requestId: string;
  userId: string;
  userName: string;
  type: string;
  startDate: Date;
  endDate: Date;
  rejectedById: string;
  rejectedByName: string;
  reason?: string;
}

// Schedule Changed
export interface ScheduleChangedEvent extends BaseSchedulingEventPayload {
  scheduleId: string;
  userId: string;
  userName: string;
  date: Date;
  changeType: 'created' | 'updated' | 'deleted';
  changedById: string;
  changedByName: string;
}

// Map notification type to preference field
export const SCHEDULING_NOTIFICATION_PREFERENCE_MAP: Record<string, string> = {
  TIME_OFF_REQUESTED: 'timeOffRequested',
  TIME_OFF_APPROVED: 'timeOffApproved',
  TIME_OFF_REJECTED: 'timeOffRejected',
  SCHEDULE_CHANGED: 'scheduleChanged',
};
