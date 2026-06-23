import { useQuery } from '@tanstack/react-query';
import { getPortfolioSummary } from '@/infrastructure/di/container';
import { useAuthStore } from '@/shared/hooks/useAuthStore';

export function usePortfolioSummary() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['portfolioSummary', user?.id],
    queryFn: () => getPortfolioSummary.execute(user!.id),
    enabled: !!user,
    staleTime: 30_000,
    gcTime: 10 * 60_000,
  });
}
