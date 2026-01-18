'use client';

import { useState, useEffect, useCallback } from 'react';
import { analyticsApi } from '@/lib/analytics-api';
import type {
  QueryAnalyticsParams,
  DashboardSummary,
  RevenueData,
  PatientStats,
  AppointmentMetrics,
  ServicePerformance,
  StaffProductivity,
  LeadFunnel,
} from '@/lib/analytics-api';

interface UseAnalyticsResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDashboard(params: QueryAnalyticsParams = {}): UseAnalyticsResult<DashboardSummary> {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyticsApi.getDashboard(params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [params.dateFrom, params.dateTo, params.granularity, params.branchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

export function useRevenue(params: QueryAnalyticsParams = {}): UseAnalyticsResult<RevenueData> {
  const [data, setData] = useState<RevenueData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyticsApi.getRevenue(params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch revenue data');
    } finally {
      setIsLoading(false);
    }
  }, [params.dateFrom, params.dateTo, params.granularity, params.branchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

export function usePatients(params: QueryAnalyticsParams = {}): UseAnalyticsResult<PatientStats> {
  const [data, setData] = useState<PatientStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyticsApi.getPatients(params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch patient data');
    } finally {
      setIsLoading(false);
    }
  }, [params.dateFrom, params.dateTo, params.granularity, params.branchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

export function useAppointments(params: QueryAnalyticsParams = {}): UseAnalyticsResult<AppointmentMetrics> {
  const [data, setData] = useState<AppointmentMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyticsApi.getAppointments(params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch appointment data');
    } finally {
      setIsLoading(false);
    }
  }, [params.dateFrom, params.dateTo, params.granularity, params.branchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

export function useServices(params: QueryAnalyticsParams = {}): UseAnalyticsResult<ServicePerformance> {
  const [data, setData] = useState<ServicePerformance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyticsApi.getServices(params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch service data');
    } finally {
      setIsLoading(false);
    }
  }, [params.dateFrom, params.dateTo, params.granularity, params.branchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

export function useStaff(params: QueryAnalyticsParams = {}): UseAnalyticsResult<StaffProductivity> {
  const [data, setData] = useState<StaffProductivity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyticsApi.getStaff(params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch staff data');
    } finally {
      setIsLoading(false);
    }
  }, [params.dateFrom, params.dateTo, params.granularity, params.branchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

export function useLeads(params: QueryAnalyticsParams = {}): UseAnalyticsResult<LeadFunnel> {
  const [data, setData] = useState<LeadFunnel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyticsApi.getLeads(params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch lead data');
    } finally {
      setIsLoading(false);
    }
  }, [params.dateFrom, params.dateTo, params.granularity, params.branchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}
