import { useQuery } from '@tanstack/react-query';
import { getActiveAssets } from '@/infrastructure/di/container';
import { useAuthStore } from '@/shared/hooks/useAuthStore';

export function useActiveAssets() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['activeAssets', user?.id],
    queryFn: () => getActiveAssets.execute(user!.id),
    enabled: !!user,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });
}
