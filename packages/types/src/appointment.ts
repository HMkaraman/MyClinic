/**
 * Appointment types
 */

import type { Timestamps, BranchEntity } from './common';

// ===========================================
// Appointment Status
// ===========================================
export const APPOINTMENT_STATUS = {
  NEW: 'NEW',
  CONFIRMED: 'CONFIRMED',
  ARRIVED: 'ARRIVED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  NO_SHOW: 'NO_SHOW',
  CANCELLED: 'CANCELLED',
  RESCHEDULED: 'RESCHEDULED',
} as const;

export type AppointmentStatus =
  (typeof APPOINTMENT_STATUS)[keyof typeof APPOINTMENT_STATUS];

// Valid status transitions
export const APPOINTMENT_STATUS_TRANSITIONS: Record<
  AppointmentStatus,
  AppointmentStatus[]
> = {
  NEW: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['ARRIVED', 'NO_SHOW', 'CANCELLED', 'RESCHEDULED'],
  ARRIVED: ['IN_PROGRESS', 'NO_SHOW', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: [],
  NO_SHOW: ['RESCHEDULED'],
  CANCELLED: ['RESCHEDULED'],
  RESCHEDULED: ['NEW', 'CONFIRMED'],
};

// ===========================================
// Service
// ===========================================
export interface Service extends Timestamps {
  id: string;
  tenantId: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  nameCkb?: string;
  nameKmr?: string;
  durationMinutes: number;
  price: number;
  category?: string;
  active: boolean;
}

// ===========================================
// Appointment
// ===========================================
export interface Appointment extends Timestamps, BranchEntity {
  id: string;
  patientId: string;
  doctorId: string;
  serviceId: string;
  scheduledAt: Date;
  durationMinutes: number;
  status: AppointmentStatus;
  arrivalTime?: Date;
  checkInTime?: Date;
  checkOutTime?: Date;
  rescheduleReason?: string;
  cancelReason?: string;
  notes?: string;
}

export interface CreateAppointmentInput {
  patientId: string;
  doctorId: string;
  serviceId: string;
  branchId: string;
  scheduledAt: Date;
  notes?: string;
}

export interface UpdateAppointmentInput {
  doctorId?: string;
  serviceId?: string;
  scheduledAt?: Date;
  notes?: string;
}

export interface RescheduleAppointmentInput {
  scheduledAt: Date;
  doctorId?: string;
  reason?: string;
}

// ===========================================
// Available Slots
// ===========================================
export interface TimeSlot {
  start: Date;
  end: Date;
  doctorId: string;
  doctorName: string;
  available: boolean;
}

export interface AvailableSlotsQuery {
  branchId: string;
  serviceId?: string;
  doctorId?: string;
  date: Date;
}
