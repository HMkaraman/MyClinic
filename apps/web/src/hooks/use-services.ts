import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './query-keys';
import { servicesApi, type Service, type ServiceListParams } from '@/lib/services-api';

export function useServices(params: ServiceListParams = {}) {
  return useQuery({
    queryKey: queryKeys.services.list(params),
    queryFn: () => servicesApi.getServices(params),
  });
}

export function useActiveServices() {
  return useQuery({
    queryKey: queryKeys.services.active(),
    queryFn: () => servicesApi.getActiveServices(),
  });
}

export function useService(id: string) {
  return useQuery({
    queryKey: queryKeys.services.detail(id),
    queryFn: () => servicesApi.getService(id),
    enabled: !!id,
  });
}

export type { Service, ServiceListParams };
