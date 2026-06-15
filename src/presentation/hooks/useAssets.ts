import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getActiveAssets, projectionRepository, deleteAsset } from '../../infrastructure/di/container';
import { useAuthStore } from './useAuth';

export function useActiveAssets() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['activeAssets', user?.id],
    queryFn: () => getActiveAssets.execute(user!.id),
    enabled: !!user,
    staleTime: 30_000,
  });
}

export function useAllAssets() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['allAssets', user?.id],
    queryFn: () => projectionRepository.getByUserId(user!.id),
    enabled: !!user,
    staleTime: 30_000,
  });
}

export function useDeleteAsset() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assetId: string) => {
      await deleteAsset.execute(user!.id, assetId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeAssets', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['allAssets', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['portfolioSummary', user?.id] });
    },
  });
}
