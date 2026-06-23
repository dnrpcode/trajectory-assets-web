import { useQuery } from '@tanstack/react-query';
import { getAssetEntries } from '@/infrastructure/di/container';
import { useAuthStore } from '@/shared/hooks/useAuthStore';

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
