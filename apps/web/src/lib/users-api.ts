import { api } from './api';
import type { PaginatedResponse } from './api';

export type UserRole = 'ADMIN' | 'MANAGER' | 'DOCTOR' | 'NURSE' | 'RECEPTION' | 'ACCOUNTANT' | 'SUPPORT';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
}

function buildQueryString(params: UserListParams): string {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.limit) searchParams.append('limit', params.limit.toString());
  if (params.search) searchParams.append('search', params.search);
  if (params.role) searchParams.append('role', params.role);
  if (params.status) searchParams.append('status', params.status);
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

export const usersApi = {
  getUsers: (params: UserListParams = {}) =>
    api.get<PaginatedResponse<User>>(`/users${buildQueryString(params)}`),

  getDoctors: () =>
    api.get<PaginatedResponse<User>>(`/users?role=DOCTOR&status=ACTIVE`),

  getUser: (id: string) => api.get<User>(`/users/${id}`),
};
