import { useQuery } from '@tanstack/react-query';
import { getPortfolioSummary, getPortfolioHistory, backfillPortfolioHistory } from '../../infrastructure/di/container';
import { useAuthStore } from './useAuth';

export function usePortfolioSummary() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['portfolioSummary', user?.id],
    queryFn: () => getPortfolioSummary.execute(user!.id),
    enabled: !!user,
    staleTime: 30_000,
  });
}

export function usePortfolioHistory() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['portfolioHistory', user?.id],
    queryFn: async () => {
      const history = await getPortfolioHistory.execute(user!.id);
      // If no history exists yet, backfill from entry data
      if (history.length === 0) {
        await backfillPortfolioHistory.execute(user!.id);
        return getPortfolioHistory.execute(user!.id);
      }
      return history;
    },
    enabled: !!user,
    staleTime: 60_000,
  });
}
