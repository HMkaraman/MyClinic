import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './query-keys';
import {
  patientsApi,
  type Patient,
  type PatientListParams,
  type CreatePatientDto,
  type UpdatePatientDto,
} from '@/lib/patients-api';

export function usePatients(params: PatientListParams = {}) {
  return useQuery({
    queryKey: queryKeys.patients.list(params),
    queryFn: () => patientsApi.getPatients(params),
  });
}

export function usePatient(id: string) {
  return useQuery({
    queryKey: queryKeys.patients.detail(id),
    queryFn: () => patientsApi.getPatient(id),
    enabled: !!id,
  });
}

export function useSearchPatients(query: string) {
  return useQuery({
    queryKey: queryKeys.patients.list({ search: query }),
    queryFn: () => patientsApi.searchPatients(query),
    enabled: query.length >= 2,
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePatientDto) => patientsApi.createPatient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.lists() });
    },
  });
}

export function useUpdatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePatientDto }) =>
      patientsApi.updatePatient(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.patients.detail(variables.id),
      });
    },
  });
}

export function useDeletePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => patientsApi.deletePatient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.lists() });
    },
  });
}

export type { Patient, PatientListParams, CreatePatientDto, UpdatePatientDto };
