import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './query-keys';
import {
  appointmentsApi,
  type Appointment,
  type AppointmentListParams,
  type AppointmentStatus,
  type CreateAppointmentDto,
  type UpdateAppointmentDto,
  type RescheduleAppointmentDto,
  type AvailableSlotsParams,
} from '@/lib/appointments-api';

export function useAppointments(params: AppointmentListParams = {}) {
  return useQuery({
    queryKey: queryKeys.appointments.list(params),
    queryFn: () => appointmentsApi.getAppointments(params),
  });
}

export function useAppointment(id: string) {
  return useQuery({
    queryKey: queryKeys.appointments.detail(id),
    queryFn: () => appointmentsApi.getAppointment(id),
    enabled: !!id,
  });
}

export function useAppointmentTodayStats() {
  return useQuery({
    queryKey: queryKeys.appointments.todayStats(),
    queryFn: () => appointmentsApi.getTodayStats(),
  });
}

export function useAvailableSlots(params: AvailableSlotsParams) {
  return useQuery({
    queryKey: queryKeys.appointments.availableSlots(params.doctorId, params.date),
    queryFn: () => appointmentsApi.getAvailableSlots(params),
    enabled: !!params.doctorId && !!params.date,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAppointmentDto) =>
      appointmentsApi.createAppointment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.appointments.todayStats(),
      });
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAppointmentDto }) =>
      appointmentsApi.updateAppointment(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.appointments.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.appointments.todayStats(),
      });
    },
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      appointmentsApi.updateAppointmentStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.appointments.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.appointments.todayStats(),
      });
    },
  });
}

export function useRescheduleAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RescheduleAppointmentDto }) =>
      appointmentsApi.rescheduleAppointment(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.appointments.detail(variables.id),
      });
    },
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      appointmentsApi.cancelAppointment(id, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.appointments.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.appointments.todayStats(),
      });
    },
  });
}

export type {
  Appointment,
  AppointmentListParams,
  AppointmentStatus,
  CreateAppointmentDto,
  UpdateAppointmentDto,
};
