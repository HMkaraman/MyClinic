import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './query-keys';
import { usersApi, type User, type UserListParams } from '@/lib/users-api';

export function useDoctors() {
  return useQuery({
    queryKey: queryKeys.users.doctors(),
    queryFn: () => usersApi.getDoctors(),
  });
}

export function useUsers(params: UserListParams = {}) {
  return useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: () => usersApi.getUsers(params),
  });
}

export type { User, UserListParams };
