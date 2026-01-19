import { api } from './api';
import type { PaginatedResponse } from './api';

export interface Patient {
  id: string;
  fileNumber: string;
  name: string;
  phone: string;
  email?: string;
  gender: 'MALE' | 'FEMALE';
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  medicalHistory?: string;
  allergies?: string;
  bloodType?: string;
  notes?: string;
  status: 'active' | 'inactive';
  lastVisit?: string;
  totalVisits: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePatientDto {
  name: string;
  phone: string;
  email?: string;
  gender: 'MALE' | 'FEMALE';
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  medicalHistory?: string;
  allergies?: string;
  bloodType?: string;
  notes?: string;
}

export interface UpdatePatientDto extends Partial<CreatePatientDto> {
  status?: 'active' | 'inactive';
}

export interface PatientListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

function buildQueryString(params: PatientListParams): string {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.limit) searchParams.append('limit', params.limit.toString());
  if (params.search) searchParams.append('search', params.search);
  if (params.status) searchParams.append('status', params.status);
  if (params.sortBy) searchParams.append('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

export const patientsApi = {
  getPatients: (params: PatientListParams = {}) =>
    api.get<PaginatedResponse<Patient>>(`/patients${buildQueryString(params)}`),

  getPatient: (id: string) => api.get<Patient>(`/patients/${id}`),

  createPatient: (data: CreatePatientDto) =>
    api.post<Patient>('/patients', data),

  updatePatient: (id: string, data: UpdatePatientDto) =>
    api.patch<Patient>(`/patients/${id}`, data),

  deletePatient: (id: string) => api.delete(`/patients/${id}`),

  searchPatients: (query: string) =>
    api.get<PaginatedResponse<Patient>>(`/patients?search=${encodeURIComponent(query)}`),
};
