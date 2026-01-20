import { api } from './api';
import type { PaginatedResponse } from './api';

export interface Service {
  id: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  durationMinutes: number;
  price: number;
  category?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceListParams {
  page?: number;
  limit?: number;
  search?: string;
  active?: boolean;
  category?: string;
}

function buildQueryString(params: ServiceListParams): string {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.limit) searchParams.append('limit', params.limit.toString());
  if (params.search) searchParams.append('search', params.search);
  if (params.active !== undefined) searchParams.append('active', params.active.toString());
  if (params.category) searchParams.append('category', params.category);
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

export const servicesApi = {
  getServices: (params: ServiceListParams = {}) =>
    api.get<PaginatedResponse<Service>>(`/services${buildQueryString(params)}`),

  getActiveServices: () =>
    api.get<PaginatedResponse<Service>>(`/services?active=true`),

  getService: (id: string) => api.get<Service>(`/services/${id}`),
};
