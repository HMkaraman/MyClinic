import { api } from './api';

export type Granularity = 'daily' | 'weekly' | 'monthly';

export interface QueryAnalyticsParams {
  dateFrom?: string;
  dateTo?: string;
  granularity?: Granularity;
  branchId?: string;
}

export interface TrendDataPoint {
  date: string;
  value: number;
}

export interface DashboardSummary {
  revenue: {
    total: number;
    percentChange: number;
  };
  patients: {
    total: number;
    new: number;
    percentChange: number;
  };
  appointments: {
    total: number;
    completionRate: number;
    percentChange: number;
  };
  leads: {
    total: number;
    converted: number;
    conversionRate: number;
  };
}

export interface RevenueData {
  total: number;
  trend: TrendDataPoint[];
  byPaymentMethod: { method: string; amount: number }[];
  byService: { service: string; amount: number }[];
  comparison: {
    previousPeriod: number;
    percentChange: number;
  };
}

export interface PatientStats {
  total: number;
  new: number;
  returning: number;
  trend: TrendDataPoint[];
  bySource: { source: string; count: number }[];
  byGender: { gender: string; count: number }[];
  byBranch: { branch: string; count: number }[];
}

export interface AppointmentMetrics {
  total: number;
  completed: number;
  cancelled: number;
  noShow: number;
  completionRate: number;
  trend: TrendDataPoint[];
  byStatus: { status: string; count: number }[];
  byDoctor: { doctor: string; count: number }[];
  averageWaitTime: number;
}

export interface ServicePerformance {
  services: {
    id: string;
    name: string;
    appointmentCount: number;
    revenue: number;
    averageRating?: number;
  }[];
}

export interface StaffProductivity {
  staff: {
    id: string;
    name: string;
    role: string;
    appointmentsCompleted: number;
    revenue: number;
    averageAppointmentsPerDay: number;
  }[];
}

export interface LeadFunnel {
  stages: {
    stage: string;
    count: number;
    conversionRate: number;
  }[];
  bySource: { source: string; count: number }[];
  trend: TrendDataPoint[];
}

function buildQueryString(params: QueryAnalyticsParams): string {
  const searchParams = new URLSearchParams();
  if (params.dateFrom) searchParams.append('dateFrom', params.dateFrom);
  if (params.dateTo) searchParams.append('dateTo', params.dateTo);
  if (params.granularity) searchParams.append('granularity', params.granularity);
  if (params.branchId) searchParams.append('branchId', params.branchId);
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

export const analyticsApi = {
  getDashboard: (params: QueryAnalyticsParams = {}) =>
    api.get<DashboardSummary>(`/analytics/dashboard${buildQueryString(params)}`),

  getRevenue: (params: QueryAnalyticsParams = {}) =>
    api.get<RevenueData>(`/analytics/revenue${buildQueryString(params)}`),

  getPatients: (params: QueryAnalyticsParams = {}) =>
    api.get<PatientStats>(`/analytics/patients${buildQueryString(params)}`),

  getAppointments: (params: QueryAnalyticsParams = {}) =>
    api.get<AppointmentMetrics>(`/analytics/appointments${buildQueryString(params)}`),

  getServices: (params: QueryAnalyticsParams = {}) =>
    api.get<ServicePerformance>(`/analytics/services${buildQueryString(params)}`),

  getStaff: (params: QueryAnalyticsParams = {}) =>
    api.get<StaffProductivity>(`/analytics/staff${buildQueryString(params)}`),

  getLeads: (params: QueryAnalyticsParams = {}) =>
    api.get<LeadFunnel>(`/analytics/leads${buildQueryString(params)}`),

  exportReport: (type: string, params: QueryAnalyticsParams = {}, format: 'csv' | 'excel' | 'pdf' = 'csv') =>
    api.get<unknown>(`/analytics/export/${type}${buildQueryString(params)}&format=${format}`),
};
