import { useQuery } from '@tanstack/react-query';
import { getPortfolioSummary, getPortfolioHistory, backfillPortfolioHistory } from '@/infrastructure/di/container';
import { useAuthStore } from '@/modules/auth';

interface MarketPoint { month: string; close: number }

async function fetchMarketHistory(symbol: string): Promise<MarketPoint[]> {
  const url = `/api/market/chart?symbol=${encodeURIComponent(symbol)}&range=5y&interval=1mo`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Market data error ${res.status}`);
  const json = await res.json() as {
    chart: {
      result: Array<{
        timestamp: number[];
        indicators: { quote: Array<{ close: (number | null)[] }> };
      }> | null;
    };
  };
  const result = json.chart?.result?.[0];
  if (!result) throw new Error('No market data');
  const timestamps = result.timestamp ?? [];
  const closes = result.indicators?.quote?.[0]?.close ?? [];
  return timestamps
    .map((ts, i) => ({ month: new Date(ts * 1000).toISOString().slice(0, 7), close: closes[i] ?? null }))
    .filter((d): d is MarketPoint => d.close !== null);
}

export function useMarketHistory(symbol: string) {
  return useQuery({
    queryKey: ['marketHistory', symbol],
    queryFn: () => fetchMarketHistory(symbol),
    staleTime: 3_600_000,
    gcTime: 10 * 60_000,
    retry: 1,
  });
}

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
    gcTime: 10 * 60_000,
  });
}
