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
  branchIds?: string[];
  branches?: Branch[];
  language?: 'ar' | 'en' | 'ckb' | 'kmr';
  createdAt: string;
  updatedAt: string;
}

export interface Branch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
}

export interface CreateUserDto {
  email: string;
  name: string;
  password: string;
  phone?: string;
  role: UserRole;
  branchIds: string[];
  language?: 'ar' | 'en' | 'ckb' | 'kmr';
}

export interface UpdateUserDto {
  email?: string;
  name?: string;
  password?: string;
  phone?: string;
  role?: UserRole;
  branchIds?: string[];
  language?: 'ar' | 'en' | 'ckb' | 'kmr';
  status?: UserStatus;
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
    api.get<PaginatedResponse<User>>(`/users/doctors`),

  getUser: (id: string) => api.get<User>(`/users/${id}`),

  createUser: (data: CreateUserDto) =>
    api.post<User>('/users', data),

  updateUser: (id: string, data: UpdateUserDto) =>
    api.patch<User>(`/users/${id}`, data),

  deleteUser: (id: string) =>
    api.delete<void>(`/users/${id}`),

  getBranches: () =>
    api.get<Branch[]>('/tenant/branches'),
};
