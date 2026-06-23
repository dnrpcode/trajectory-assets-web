import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateEntryInput } from '@/shared/types/assetEntry';
import { createEntry, recomputeAssetProjection } from '@/infrastructure/di/container';
import { useAuthStore } from '@/shared/hooks/useAuthStore';
import { useToast } from '@/shared/ui/Toast';




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
    },
    onError: () => {
      toast('Gagal menyimpan transaksi. Periksa koneksi dan coba lagi.', 'error');
    },
  });
}
