import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getIncomeEvents,
  createIncomeEvent,
  deleteIncomeEvent,
  markEventReceived,
} from '@/infrastructure/di/container';
import { useAuthStore } from '@/modules/auth';
import type { CreateIncomeEventInput } from '../../domain/use-cases/CreateIncomeEvent';

export function useIncomeEvents() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['incomeEvents', user?.id],
    queryFn: () => getIncomeEvents.execute(user!.id),
    enabled: !!user,
    staleTime: 30_000,
  });
}

export function useCreateIncomeEvent() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Omit<CreateIncomeEventInput, 'userId'>) =>
      createIncomeEvent.execute({ ...input, userId: user!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomeEvents', user?.id] });
    },
  });
}

export function useDeleteIncomeEvent() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => deleteIncomeEvent.execute(user!.id, eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomeEvents', user?.id] });
    },
  });
}

export function useMarkEventReceived() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => markEventReceived.execute(user!.id, eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomeEvents', user?.id] });
    },
  });
}
