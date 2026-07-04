import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getActiveAssets, getAllAssets, deleteAsset, updateAssetMeta, portfolioRepository } from '@/infrastructure/di/container';
import { useAuthStore } from '@/shared/hooks/useAuthStore';
import { useToast } from '@/shared/ui/Toast';
import type { UpdateAssetMetaInput } from '@/modules/portfolio/domain/use-cases/UpdateAssetMeta';

export function useActiveAssets() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['activeAssets', user?.id],
    queryFn: () => getActiveAssets.execute(user!.id),
    enabled: !!user,
    staleTime: 30_000,
    gcTime: 10 * 60_000,
  });
}

export function useAllAssets() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['allAssets', user?.id],
    queryFn: () => getAllAssets.execute(user!.id),
    enabled: !!user,
    staleTime: 30_000,
    gcTime: 10 * 60_000,
  });
}

export function useUpdateAssetMeta() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: UpdateAssetMetaInput) => updateAssetMeta.execute(user!.id, input),
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: ['activeAssets', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['allAssets', user?.id] });
      toast(`Aset ${input.assetName ?? ''} berhasil diperbarui.`, 'success');
    },
    onError: () => {
      toast('Gagal memperbarui aset. Periksa koneksi dan coba lagi.', 'error');
    },
  });
}

export function useDeleteAsset() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (assetId: string) => {
      await deleteAsset.execute(user!.id, assetId);
      // Clear stale portfolio history snapshots so backfill recomputes from scratch
      // on next dashboard load. Without this, old monthly values that included the
      // deleted asset's value persist in Firestore and corrupt the growth chart.
      await portfolioRepository.clearHistory(user!.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeAssets', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['allAssets', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['portfolioSummary', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['portfolioHistory', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['portfolioSeries', user?.id] });
    },
    onError: () => {
      toast('Gagal menghapus aset. Periksa koneksi dan coba lagi.', 'error');
    },
  });
}
