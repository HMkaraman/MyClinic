import { api } from './api';
import type { PaginatedResponse } from './api';

export type AppointmentStatus =
  | 'NEW'
  | 'CONFIRMED'
  | 'ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'NO_SHOW'
  | 'CANCELLED';

export interface Appointment {
  id: string;
  patientId: string;
  patient?: {
    id: string;
    name: string;
    phone: string;
    fileNumber: string;
  };
  doctorId: string;
  doctor?: {
    id: string;
    name: string;
  };
  serviceId?: string;
  service?: {
    id: string;
    name: string;
  };
  branchId?: string;
  branch?: {
    id: string;
    name: string;
  };
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: AppointmentStatus;
  notes?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentDto {
  patientId: string;
  doctorId: string;
  serviceId: string;
  branchId: string;
  scheduledAt: string;
  durationMinutes?: number;
  notes?: string;
}

export interface UpdateAppointmentDto extends Partial<CreateAppointmentDto> {
  status?: AppointmentStatus;
}

export interface RescheduleAppointmentDto {
  newScheduledAt: string;
  reason?: string;
}

export interface AppointmentListParams {
  page?: number;
  limit?: number;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: AppointmentStatus;
  doctorId?: string;
  patientId?: string;
  branchId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AvailableSlot {
  start: string;      // ISO date string from backend
  end: string;        // ISO date string from backend
  available: boolean;
}

export interface AvailableSlotsParams {
  doctorId: string;
  date: string;
  durationMinutes?: number;  // Backend expects durationMinutes, not duration
}

function buildQueryString(params: AppointmentListParams): string {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.limit) searchParams.append('limit', params.limit.toString());
  if (params.date) searchParams.append('date', params.date);
  if (params.dateFrom) searchParams.append('dateFrom', params.dateFrom);
  if (params.dateTo) searchParams.append('dateTo', params.dateTo);
  if (params.status) searchParams.append('status', params.status);
  if (params.doctorId) searchParams.append('doctorId', params.doctorId);
  if (params.patientId) searchParams.append('patientId', params.patientId);
  if (params.branchId) searchParams.append('branchId', params.branchId);
  if (params.sortBy) searchParams.append('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

export const appointmentsApi = {
  getAppointments: (params: AppointmentListParams = {}) =>
    api.get<PaginatedResponse<Appointment>>(`/appointments${buildQueryString(params)}`),

  getAppointment: (id: string) => api.get<Appointment>(`/appointments/${id}`),

  getAvailableSlots: (params: AvailableSlotsParams) => {
    const searchParams = new URLSearchParams();
    searchParams.append('doctorId', params.doctorId);
    searchParams.append('date', params.date);
    if (params.durationMinutes) searchParams.append('durationMinutes', params.durationMinutes.toString());
    return api.get<AvailableSlot[]>(`/appointments/available-slots?${searchParams.toString()}`);
  },

  createAppointment: (data: CreateAppointmentDto) =>
    api.post<Appointment>('/appointments', data),

  updateAppointment: (id: string, data: UpdateAppointmentDto) =>
    api.patch<Appointment>(`/appointments/${id}`, data),

  updateAppointmentStatus: (id: string, status: AppointmentStatus) =>
    api.post<Appointment>(`/appointments/${id}/status`, { status }),

  rescheduleAppointment: (id: string, data: RescheduleAppointmentDto) =>
    api.post<Appointment>(`/appointments/${id}/reschedule`, data),

  cancelAppointment: (id: string, reason?: string) =>
    api.post<Appointment>(`/appointments/${id}/cancel`, { reason }),

  getTodayStats: () =>
    api.get<{
      total: number;
      confirmed: number;
      completed: number;
      waiting: number;
      noShow: number;
      cancelled: number;
    }>('/appointments/stats/today'),
};
