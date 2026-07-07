import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getGoals, createGoal, updateGoal, deleteGoal } from '@/infrastructure/di/container';
import { useAuthStore } from '@/shared/hooks/useAuthStore';
import type { CreateGoalInput, UpdateGoalInput } from '../../domain/repositories/IGoalRepository';

export type GoalFormInput = Omit<CreateGoalInput, 'userId' | 'createdAt' | 'updatedAt'>;

export function useGoals() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['goals', user?.id],
    queryFn: () => getGoals.execute(user!.id),
    enabled: !!user,
  });
}

export function useCreateGoal() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GoalFormInput) => createGoal.execute({ ...input, userId: user!.id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals', user?.id] }),
  });
}

export function useUpdateGoal() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, input }: { goalId: string; input: UpdateGoalInput }) =>
      updateGoal.execute(user!.id, goalId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals', user?.id] }),
  });
}

export function useDeleteGoal() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (goalId: string) => deleteGoal.execute(user!.id, goalId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals', user?.id] }),
  });
}
