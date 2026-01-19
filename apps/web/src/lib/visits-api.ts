import { api } from './api';
import type { PaginatedResponse } from './api';

export type VisitStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Visit {
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
  appointmentId?: string;
  appointment?: {
    id: string;
    date: string;
    startTime: string;
  };
  branchId?: string;
  branch?: {
    id: string;
    name: string;
  };
  date: string;
  chiefComplaint?: string;
  presentIllness?: string;
  examination?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  prescriptions?: Prescription[];
  vitalSigns?: VitalSigns;
  notes?: string;
  status: VisitStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Prescription {
  id?: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface VitalSigns {
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  temperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
}

export interface CreateVisitDto {
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  branchId?: string;
  date?: string;
  chiefComplaint?: string;
  presentIllness?: string;
  examination?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  prescriptions?: Prescription[];
  vitalSigns?: VitalSigns;
  notes?: string;
}

export interface UpdateVisitDto extends Partial<CreateVisitDto> {
  status?: VisitStatus;
}

export interface VisitListParams {
  page?: number;
  limit?: number;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: VisitStatus;
  doctorId?: string;
  patientId?: string;
  branchId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

function buildQueryString(params: VisitListParams): string {
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

export const visitsApi = {
  getVisits: (params: VisitListParams = {}) =>
    api.get<PaginatedResponse<Visit>>(`/visits${buildQueryString(params)}`),

  getVisit: (id: string) => api.get<Visit>(`/visits/${id}`),

  getPatientVisits: (patientId: string, params: Omit<VisitListParams, 'patientId'> = {}) =>
    api.get<PaginatedResponse<Visit>>(
      `/visits${buildQueryString({ ...params, patientId })}`
    ),

  createVisit: (data: CreateVisitDto) => api.post<Visit>('/visits', data),

  updateVisit: (id: string, data: UpdateVisitDto) =>
    api.patch<Visit>(`/visits/${id}`, data),

  completeVisit: (id: string) =>
    api.post<Visit>(`/visits/${id}/complete`),

  getTodayStats: () =>
    api.get<{
      total: number;
      inProgress: number;
      completed: number;
    }>('/visits/stats/today'),
};
