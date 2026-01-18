import { AppointmentStatus } from '@prisma/client';

export interface AppointmentFactoryOptions {
  id?: string;
  branchId?: string;
  patientId?: string;
  doctorId?: string;
  serviceId?: string;
  scheduledAt?: Date;
  durationMinutes?: number;
  status?: AppointmentStatus;
  notes?: string | null;
  arrivalTime?: Date | null;
  checkInTime?: Date | null;
  checkOutTime?: Date | null;
  cancelReason?: string | null;
  rescheduleReason?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export function createAppointment(options: AppointmentFactoryOptions = {}) {
  const now = new Date();
  const scheduledAt = options.scheduledAt ?? new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow

  return {
    id: options.id ?? 'test-appointment-id',
    branchId: options.branchId ?? 'test-branch-id',
    patientId: options.patientId ?? 'test-patient-id',
    doctorId: options.doctorId ?? 'test-doctor-id',
    serviceId: options.serviceId ?? 'test-service-id',
    scheduledAt,
    durationMinutes: options.durationMinutes ?? 30,
    status: options.status ?? AppointmentStatus.NEW,
    notes: options.notes ?? null,
    arrivalTime: options.arrivalTime ?? null,
    checkInTime: options.checkInTime ?? null,
    checkOutTime: options.checkOutTime ?? null,
    cancelReason: options.cancelReason ?? null,
    rescheduleReason: options.rescheduleReason ?? null,
    createdAt: options.createdAt ?? now,
    updatedAt: options.updatedAt ?? now,
    patient: {
      id: options.patientId ?? 'test-patient-id',
      name: 'Test Patient',
      phone: '+1234567890',
      fileNumber: 'P-20260118-00001',
    },
    doctor: {
      id: options.doctorId ?? 'test-doctor-id',
      name: 'Dr. Test',
      email: 'doctor@example.com',
    },
    service: {
      id: options.serviceId ?? 'test-service-id',
      name: 'Consultation',
      price: 100,
      durationMinutes: 30,
    },
    branch: {
      id: options.branchId ?? 'test-branch-id',
      name: 'Test Branch',
    },
    visit: null,
  };
}

export function createNewAppointment(options: AppointmentFactoryOptions = {}) {
  return createAppointment({ ...options, status: AppointmentStatus.NEW });
}

export function createConfirmedAppointment(options: AppointmentFactoryOptions = {}) {
  return createAppointment({ ...options, status: AppointmentStatus.CONFIRMED });
}

export function createArrivedAppointment(options: AppointmentFactoryOptions = {}) {
  return createAppointment({
    ...options,
    status: AppointmentStatus.ARRIVED,
    arrivalTime: new Date(),
  });
}

export function createInProgressAppointment(options: AppointmentFactoryOptions = {}) {
  return createAppointment({
    ...options,
    status: AppointmentStatus.IN_PROGRESS,
    arrivalTime: new Date(),
    checkInTime: new Date(),
  });
}

export function createCompletedAppointment(options: AppointmentFactoryOptions = {}) {
  return createAppointment({
    ...options,
    status: AppointmentStatus.COMPLETED,
    arrivalTime: new Date(),
    checkInTime: new Date(),
    checkOutTime: new Date(),
  });
}

export function createCancelledAppointment(options: AppointmentFactoryOptions = {}) {
  return createAppointment({
    ...options,
    status: AppointmentStatus.CANCELLED,
    cancelReason: 'Patient requested cancellation',
  });
}

export function createRescheduledAppointment(options: AppointmentFactoryOptions = {}) {
  return createAppointment({
    ...options,
    status: AppointmentStatus.RESCHEDULED,
    rescheduleReason: 'Doctor unavailable',
  });
}
