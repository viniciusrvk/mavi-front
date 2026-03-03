import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AuthLoginRequest } from '@/types/api';

export function useLoginMutation() {
  return useMutation({
    mutationFn: (data: AuthLoginRequest) => api.login(data),
  });
}
