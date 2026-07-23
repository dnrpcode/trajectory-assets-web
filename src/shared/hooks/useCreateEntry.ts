import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { CreateEntryInput } from '@/shared/types/assetEntry';
import { createEntry, recomputeAssetProjection } from '@/infrastructure/di/container';
import { useAuthStore } from '@/shared/hooks/useAuthStore';
import { useToast } from '@/shared/ui/Toast';

export function useCreateEntry() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

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
      queryClient.invalidateQueries({ queryKey: ['portfolioSeries', user?.id] });
    },
    onError: () => {
      toast(t('entry.saveError'), 'error');
    },
  });
}
