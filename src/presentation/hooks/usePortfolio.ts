import { useQuery } from '@tanstack/react-query';
import { getPortfolioSummary, getPortfolioHistory } from '../../infrastructure/di/container';
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
    queryFn: () => getPortfolioHistory.execute(user!.id),
    enabled: !!user,
    staleTime: 60_000,
  });
}
