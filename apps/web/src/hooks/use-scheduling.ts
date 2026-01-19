import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './query-keys';
import {
  schedulingApi,
  type ScheduleTemplate,
  type WorkSchedule,
  type TimeOffRequest,
  type StaffAvailability,
} from '@/lib/api';

// Templates
export function useScheduleTemplates(params?: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.scheduling.templates.list(params),
    queryFn: () => schedulingApi.getTemplates(params),
  });
}

export function useScheduleTemplate(id: string) {
  return useQuery({
    queryKey: [...queryKeys.scheduling.templates.all(), id],
    queryFn: () => schedulingApi.getTemplate(id),
    enabled: !!id,
  });
}

export function useCreateScheduleTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<ScheduleTemplate>) =>
      schedulingApi.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.scheduling.templates.lists(),
      });
    },
  });
}

export function useUpdateScheduleTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ScheduleTemplate> }) =>
      schedulingApi.updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.scheduling.templates.lists(),
      });
    },
  });
}

// Work Schedules
export function useWorkSchedules(params?: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.scheduling.schedules.list(params),
    queryFn: () => schedulingApi.getSchedules(params),
  });
}

export function useWorkSchedule(id: string) {
  return useQuery({
    queryKey: [...queryKeys.scheduling.schedules.all(), id],
    queryFn: () => schedulingApi.getSchedule(id),
    enabled: !!id,
  });
}

export function useCreateWorkSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<WorkSchedule>) =>
      schedulingApi.createSchedule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.scheduling.schedules.lists(),
      });
    },
  });
}

export function useUpdateWorkSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WorkSchedule> }) =>
      schedulingApi.updateSchedule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.scheduling.schedules.lists(),
      });
    },
  });
}

export function useApplyScheduleTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      templateId: string;
      userId: string;
      startDate: string;
      endDate: string;
    }) => schedulingApi.applyTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.scheduling.schedules.lists(),
      });
    },
  });
}

export function useBulkCreateSchedules() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<WorkSchedule>[]) =>
      schedulingApi.bulkCreate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.scheduling.schedules.lists(),
      });
    },
  });
}

// Time Off Requests
export function useTimeOffRequests(params?: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.scheduling.timeOff.list(params),
    queryFn: () => schedulingApi.getTimeOffRequests(params),
  });
}

export function useTimeOffRequest(id: string) {
  return useQuery({
    queryKey: [...queryKeys.scheduling.timeOff.all(), id],
    queryFn: () => schedulingApi.getTimeOffRequest(id),
    enabled: !!id,
  });
}

export function useCreateTimeOffRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<TimeOffRequest>) =>
      schedulingApi.createTimeOffRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.scheduling.timeOff.lists(),
      });
    },
  });
}

export function useApproveTimeOffRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => schedulingApi.approveTimeOffRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.scheduling.timeOff.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.scheduling.schedules.lists(),
      });
    },
  });
}

export function useRejectTimeOffRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      schedulingApi.rejectTimeOffRequest(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.scheduling.timeOff.lists(),
      });
    },
  });
}

// Availability
export function useStaffAvailability(params: {
  date?: string;
  startDate?: string;
  endDate?: string;
  userId?: string;
}) {
  return useQuery({
    queryKey: queryKeys.scheduling.availability(params as Record<string, string>),
    queryFn: () => schedulingApi.getAvailability(params),
    enabled: !!(params.date || (params.startDate && params.endDate)),
  });
}

export function useCheckDoctorAvailability(
  doctorId: string,
  date: string,
  startTime: string,
  endTime: string
) {
  return useQuery({
    queryKey: [
      ...queryKeys.scheduling.all,
      'doctorAvailability',
      doctorId,
      date,
      startTime,
      endTime,
    ],
    queryFn: () =>
      schedulingApi.checkDoctorAvailability(doctorId, date, startTime, endTime),
    enabled: !!doctorId && !!date && !!startTime && !!endTime,
  });
}

export type { ScheduleTemplate, WorkSchedule, TimeOffRequest, StaffAvailability };
