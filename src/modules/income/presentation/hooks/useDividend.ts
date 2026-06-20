import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDividendInfo,
  getDividendWatchlist,
  addToDividendWatchlist,
  removeFromDividendWatchlist,
} from '@/infrastructure/di/container';
import { useAuthStore } from '@/modules/auth';
import type { DividendInfo } from '../../domain/entities/Dividend';
import { DividendError } from '../../data/YahooDividendRepository';

function divRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof DividendError) return !error.isNotFound && failureCount < 1;
  return failureCount < 1;
}

export function useDividendWatchlist() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['dividendWatchlist', user?.id],
    queryFn: () => getDividendWatchlist.execute(user!.id),
    enabled: !!user,
    staleTime: 60_000,
  });
}

export function useDividendInfo(ticker: string | null) {
  return useQuery({
    queryKey: ['dividendInfo', ticker],
    queryFn: () => getDividendInfo.execute(ticker!),
    enabled: !!ticker,
    staleTime: 5 * 60_000,
    retry: divRetry,
  });
}

export function useWatchlistDividends(tickers: string[]) {
  return useQuery({
    queryKey: ['dividendInfoBulk', tickers],
    queryFn: async (): Promise<DividendInfo[]> => {
      const results = await Promise.allSettled(
        tickers.map((t) => getDividendInfo.execute(t)),
      );
      return results
        .filter((r): r is PromiseFulfilledResult<DividendInfo> => r.status === 'fulfilled')
        .map((r) => r.value);
    },
    enabled: tickers.length > 0,
    staleTime: 5 * 60_000,
    retry: 0,
  });
}

export function useAddToDividendWatchlist() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ticker: string) => addToDividendWatchlist.execute(user!.id, ticker),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dividendWatchlist', user?.id] }),
  });
}

export function useRemoveFromDividendWatchlist() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ticker: string) => removeFromDividendWatchlist.execute(user!.id, ticker),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dividendWatchlist', user?.id] }),
  });
}
