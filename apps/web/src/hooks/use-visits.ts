import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './query-keys';
import {
  visitsApi,
  type Visit,
  type VisitListParams,
  type VisitStatus,
  type CreateVisitDto,
  type UpdateVisitDto,
} from '@/lib/visits-api';

export function useVisits(params: VisitListParams = {}) {
  return useQuery({
    queryKey: queryKeys.visits.list(params),
    queryFn: () => visitsApi.getVisits(params),
  });
}

export function useVisit(id: string) {
  return useQuery({
    queryKey: queryKeys.visits.detail(id),
    queryFn: () => visitsApi.getVisit(id),
    enabled: !!id,
  });
}

export function usePatientVisits(patientId: string, params: Omit<VisitListParams, 'patientId'> = {}) {
  return useQuery({
    queryKey: queryKeys.visits.patientVisits(patientId),
    queryFn: () => visitsApi.getPatientVisits(patientId, params),
    enabled: !!patientId,
  });
}

export function useVisitTodayStats() {
  return useQuery({
    queryKey: queryKeys.visits.todayStats(),
    queryFn: () => visitsApi.getTodayStats(),
  });
}

export function useCreateVisit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateVisitDto) => visitsApi.createVisit(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.visits.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.visits.todayStats() });
      if (variables.patientId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.visits.patientVisits(variables.patientId),
        });
      }
    },
  });
}

export function useUpdateVisit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVisitDto }) =>
      visitsApi.updateVisit(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.visits.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.visits.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.visits.todayStats() });
    },
  });
}

export function useCompleteVisit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => visitsApi.completeVisit(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.visits.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.visits.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.visits.todayStats() });
    },
  });
}

export type {
  Visit,
  VisitListParams,
  VisitStatus,
  CreateVisitDto,
  UpdateVisitDto,
};
