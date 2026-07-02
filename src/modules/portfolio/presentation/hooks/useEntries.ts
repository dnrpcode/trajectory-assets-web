import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAssetEntries, deleteEntry, createEntry, recomputeAssetProjection, entryRepository } from '@/infrastructure/di/container';
import { useAuthStore } from '@/shared/hooks/useAuthStore';
import { useToast } from '@/shared/ui/Toast';
import { CreateEntryInput } from '@/modules/portfolio/domain/use-cases/CreateEntry';
import { AssetEntry } from '@/modules/portfolio/domain/entities/AssetEntry';

export interface EditEntryInput {
  original: AssetEntry;
  patch: Partial<Pick<AssetEntry, 'date' | 'pricePerUnit' | 'units' | 'amount' | 'notes' | 'exchangeRateToIDR' | 'incomeFeeCategory' | 'month'>>;
}

export function useAssetEntries(assetId: string) {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['entries', user?.id, assetId],
    queryFn: () => getAssetEntries.executeByAsset(user!.id, assetId),
    enabled: !!user && !!assetId,
    staleTime: 30_000,
    gcTime: 10 * 60_000,
  });
}

export function useEntries() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['entries', user?.id],
    queryFn: () => getAssetEntries.executeByUser(user!.id),
    enabled: !!user,
    staleTime: 30_000,
    gcTime: 10 * 60_000,
  });
}

export function useDeleteEntry() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (entry: AssetEntry) =>
      deleteEntry.execute(user!.id, entry.id, entry.assetId),
    onSuccess: (_data, entry) => {
      queryClient.invalidateQueries({ queryKey: ['entries', user?.id, entry.assetId] });
      queryClient.invalidateQueries({ queryKey: ['entries', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['activeAssets', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['allAssets', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['portfolioSummary', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['portfolioHistory', user?.id] });
    },
    onError: () => {
      toast('Gagal menghapus transaksi. Periksa koneksi dan coba lagi.', 'error');
    },
  });
}

export function useCreateEntry() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateEntryInput) => {
      const entry = await createEntry.execute(input);
      if (entry.assetId) {
        await recomputeAssetProjection.execute(user!.id, entry.assetId);
      }
      return entry;
    },
    onSuccess: (_data, input) => {
      if (input.assetId) {
        queryClient.invalidateQueries({ queryKey: ['entries', user?.id, input.assetId] });
      }
      queryClient.invalidateQueries({ queryKey: ['entries', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['activeAssets', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['allAssets', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['portfolioSummary', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['portfolioHistory', user?.id] });
    },
    onError: () => {
      toast('Gagal menyimpan transaksi. Periksa koneksi dan coba lagi.', 'error');
    },
  });
}

export function useEditEntry() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ original, patch }: EditEntryInput) => {
      // Mark original as corrected (immutable ledger — never truly edit in place)
      await entryRepository.markCorrected(user!.id, original.id);
      // Create replacement entry with patched fields
      const { id: _id, createdAt: _c, updatedAt: _u, isCorrected: _ic, ...rest } = original;
      const replacement = await createEntry.execute({ ...rest, ...patch });
      if (replacement.assetId) {
        await recomputeAssetProjection.execute(user!.id, replacement.assetId);
      }
      return replacement;
    },
    onSuccess: (_data, { original }) => {
      queryClient.invalidateQueries({ queryKey: ['entries', user?.id, original.assetId] });
      queryClient.invalidateQueries({ queryKey: ['entries', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['activeAssets', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['allAssets', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['portfolioSummary', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['portfolioHistory', user?.id] });
      toast('Transaksi berhasil diperbarui.', 'success');
    },
    onError: () => {
      toast('Gagal memperbarui transaksi. Periksa koneksi dan coba lagi.', 'error');
    },
  });
}
