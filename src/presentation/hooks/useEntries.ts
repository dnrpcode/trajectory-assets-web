import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAssetEntries, deleteEntry, createEntry, recomputeAssetProjection } from '../../infrastructure/di/container';
import { useAuthStore } from './useAuth';
import { CreateEntryInput } from '../../domain/use-cases/asset-entries/CreateEntry';
import { AssetEntry } from '../../domain/entities/AssetEntry';

export function useAssetEntries(assetId: string) {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['entries', user?.id, assetId],
    queryFn: () => getAssetEntries.executeByAsset(user!.id, assetId),
    enabled: !!user && !!assetId,
    staleTime: 30_000,
  });
}

export function useEntries() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['entries', user?.id],
    queryFn: () => getAssetEntries.executeByUser(user!.id),
    enabled: !!user,
    staleTime: 30_000,
  });
}

export function useDeleteEntry() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entry: AssetEntry) =>
      deleteEntry.execute(user!.id, entry.id, entry.assetId),
    onSuccess: (_data, entry) => {
      queryClient.invalidateQueries({ queryKey: ['entries', user?.id, entry.assetId] });
      queryClient.invalidateQueries({ queryKey: ['entries', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['activeAssets', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['portfolioSummary', user?.id] });
    },
  });
}

export function useCreateEntry() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateEntryInput) => {
      const entry = await createEntry.execute(input);
      if (entry.assetId) {
        await recomputeAssetProjection.execute(user!.id, entry.assetId);
      }
      return entry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['activeAssets', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['allAssets', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['portfolioSummary', user?.id] });
    },
  });
}
