import { api } from './api';
import type { PaginatedResponse } from './api';

export type InvoiceStatus = 'DRAFT' | 'PENDING' | 'PARTIAL' | 'PAID' | 'CANCELLED' | 'REFUNDED';
export type PaymentMethod = 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'INSURANCE' | 'OTHER';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patient?: {
    id: string;
    name: string;
    phone: string;
    fileNumber: string;
  };
  visitId?: string;
  visit?: {
    id: string;
    date: string;
  };
  branchId?: string;
  branch?: {
    id: string;
    name: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  discountType?: 'PERCENTAGE' | 'FIXED';
  discountValue?: number;
  discountAmount: number;
  taxRate?: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  balance: number;
  status: InvoiceStatus;
  dueDate?: string;
  notes?: string;
  payments?: Payment[];
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id?: string;
  description: string;
  serviceId?: string;
  service?: {
    id: string;
    name: string;
  };
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  createdAt: string;
  createdById: string;
  createdBy?: {
    id: string;
    name: string;
  };
}

export interface CreateInvoiceDto {
  patientId: string;
  visitId?: string;
  branchId?: string;
  items: {
    description: string;
    serviceId?: string;
    quantity: number;
    unitPrice: number;
  }[];
  discountType?: 'PERCENTAGE' | 'FIXED';
  discountValue?: number;
  taxRate?: number;
  dueDate?: string;
  notes?: string;
}

export interface AddPaymentDto {
  amount: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
}

export interface InvoiceListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: InvoiceStatus;
  patientId?: string;
  branchId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

function buildQueryString(params: InvoiceListParams): string {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.limit) searchParams.append('limit', params.limit.toString());
  if (params.search) searchParams.append('search', params.search);
  if (params.status) searchParams.append('status', params.status);
  if (params.patientId) searchParams.append('patientId', params.patientId);
  if (params.branchId) searchParams.append('branchId', params.branchId);
  if (params.dateFrom) searchParams.append('dateFrom', params.dateFrom);
  if (params.dateTo) searchParams.append('dateTo', params.dateTo);
  if (params.sortBy) searchParams.append('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

export const invoicesApi = {
  getInvoices: (params: InvoiceListParams = {}) =>
    api.get<PaginatedResponse<Invoice>>(`/invoices${buildQueryString(params)}`),

  getInvoice: (id: string) => api.get<Invoice>(`/invoices/${id}`),

  getPatientInvoices: (patientId: string, params: Omit<InvoiceListParams, 'patientId'> = {}) =>
    api.get<PaginatedResponse<Invoice>>(
      `/invoices${buildQueryString({ ...params, patientId })}`
    ),

  createInvoice: (data: CreateInvoiceDto) =>
    api.post<Invoice>('/invoices', data),

  updateInvoice: (id: string, data: Partial<CreateInvoiceDto>) =>
    api.patch<Invoice>(`/invoices/${id}`, data),

  deleteInvoice: (id: string) => api.delete(`/invoices/${id}`),

  addPayment: (id: string, data: AddPaymentDto) =>
    api.post<Payment>(`/invoices/${id}/payments`, data),

  getFinanceStats: () =>
    api.get<{
      todayRevenue: number;
      weekRevenue: number;
      monthRevenue: number;
      pendingPayments: number;
      revenueChange: number;
    }>('/invoices/stats/finance'),

  getRecentInvoices: (limit: number = 5) =>
    api.get<Invoice[]>(`/invoices/recent?limit=${limit}`),

  getRecentPayments: (limit: number = 5) =>
    api.get<Payment[]>(`/invoices/payments/recent?limit=${limit}`),
};
