import { useQuery } from '@tanstack/react-query';
import { getPortfolioSummary, getPortfolioHistory, backfillPortfolioHistory, projectionRepository } from '@/infrastructure/di/container';
import { useAuthStore } from '@/shared/hooks/useAuthStore';

interface MarketPoint { month: string; close: number }

/** Fetch monthly closes for a symbol (5-year range). Returns {} on error so backfill degrades gracefully. */
async function fetchMonthlyPrices(ticker: string): Promise<Record<string, number>> {
  try {
    const symbol = ticker.includes('.') ? ticker : `${ticker}.JK`;
    const url = `/api/market/chart?symbol=${encodeURIComponent(symbol)}&range=5y&interval=1mo`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return {};
    const json = await res.json() as {
      chart: { result: Array<{ timestamp: number[]; indicators: { quote: Array<{ close: (number | null)[] }> } }> | null };
    };
    const result = json.chart?.result?.[0];
    if (!result) return {};
    const timestamps = result.timestamp ?? [];
    const closes = result.indicators?.quote?.[0]?.close ?? [];
    const out: Record<string, number> = {};
    timestamps.forEach((ts, i) => {
      const c = closes[i];
      if (c != null && Number.isFinite(c) && c > 0) {
        out[new Date(ts * 1000).toISOString().slice(0, 7)] = c;
      }
    });
    return out;
  } catch {
    return {};
  }
}

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
      // Fetch all saham assets with tickers so we can enrich backfill with market prices
      const assets = await projectionRepository.getByUserId(user!.id);
      const sahamAssets = assets.filter((a) => a.category === 'saham' && a.ticker && a.status === 'active');

      // Fetch monthly close prices for each saham ticker (failures silently return {})
      const marketPrices: Record<string, Record<string, number>> = {};
      await Promise.all(
        sahamAssets.map(async (a) => {
          const ticker = a.ticker!.replace(/\.JK$/i, '');
          marketPrices[ticker] = await fetchMonthlyPrices(ticker);
        }),
      );

      // Always re-run backfill — it skips past months already saved, only refreshes current month
      await backfillPortfolioHistory.execute(user!.id, marketPrices);
      return getPortfolioHistory.execute(user!.id);
    },
    enabled: !!user,
    staleTime: 5 * 60_000,   // re-fetch after 5 min so current month stays fresh
    gcTime: 10 * 60_000,
  });
}
