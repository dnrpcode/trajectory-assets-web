import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getActiveAssets, getAllAssets, deleteAsset, projectionRepository } from '@/infrastructure/di/container';
import { useAuthStore } from '@/modules/auth';
import { useToast } from '@/shared/ui/Toast';
import type { Asset } from '@/modules/portfolio/domain/entities/Asset';

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
    queryFn: () => getAllAssets.execute(user!.id),
    enabled: !!user,
    staleTime: 30_000,
  });
}

export function useUpdateAssetMeta() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (patch: Pick<Asset, 'id'> & Partial<Pick<Asset, 'assetName' | 'ticker' | 'platform'>>) =>
      projectionRepository.getById(user!.id, patch.id).then((current) => {
        if (!current) throw new Error('Asset not found');
        return projectionRepository.save({
          ...current,
          ...(patch.assetName !== undefined && { assetName: patch.assetName }),
          ...(patch.ticker !== undefined && { ticker: patch.ticker }),
          ...(patch.platform !== undefined && { platform: patch.platform }),
          updatedAt: new Date(),
        });
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['activeAssets', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['allAssets', user?.id] });
      toast(`Aset ${variables.assetName ?? ''} berhasil diperbarui.`, 'success');
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
    mutationFn: (assetId: string) => deleteAsset.execute(user!.id, assetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeAssets', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['allAssets', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['portfolioSummary', user?.id] });
    },
    onError: () => {
      toast('Gagal menghapus aset. Periksa koneksi dan coba lagi.', 'error');
    },
  });
}
