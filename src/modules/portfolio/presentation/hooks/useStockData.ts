import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/shared/hooks/useAuthStore';
import { createEntry, recomputeAssetProjection } from '@/infrastructure/di/container';
import { getCurrentMonth } from '@/shared/utils/formatDate';
import type { Asset } from '@/modules/portfolio/domain/entities/Asset';

export interface StockQuote {
  livePrice: number;
  prevClose: number;
  change: number;
  changePct: number;
  currency: string;
  marketState: string; // 'REGULAR' | 'CLOSED' | 'PRE' | 'POST'
}

export interface ChartPoint {
  time: string;
  price: number | null;
}

export type ChartRange = '1d' | '5d' | '1mo' | '1y';

const RANGE_TO_INTERVAL: Record<ChartRange, string> = {
  '1d': '5m',
  '5d': '15m',
  '1mo': '1d',
  '1y': '1wk',
};

function toJK(ticker: string) {
  return ticker.includes('.') ? ticker : `${ticker}.JK`;
}

async function fetchChart(symbol: string, range: string, interval: string) {
  const url = `/api/market/chart?symbol=${encodeURIComponent(symbol)}&range=${range}&interval=${interval}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Market API ${res.status}`);
  const json = await res.json() as {
    chart: {
      result: Array<{
        meta: Record<string, number | string>;
        timestamp: number[];
        indicators: { quote: Array<{ close: (number | null)[] }> };
      }> | null;
      error?: { description: string };
    };
  };
  if (json.chart?.error) throw new Error(json.chart.error.description);
  return json.chart?.result?.[0] ?? null;
}

export function useStockQuote(ticker: string | undefined) {
  const symbol = ticker ? toJK(ticker) : undefined;
  return useQuery({
    queryKey: ['stockQuote', symbol],
    queryFn: async (): Promise<StockQuote> => {
      const result = await fetchChart(symbol!, '1d', '5m');
      if (!result) throw new Error('No data');
      const meta = result.meta as Record<string, number | string>;
      const livePrice = Number(meta.regularMarketPrice ?? 0);
      const prevClose = Number(meta.chartPreviousClose ?? meta.previousClose ?? livePrice);
      const change = livePrice - prevClose;
      const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0;
      return {
        livePrice,
        prevClose,
        change,
        changePct,
        currency: String(meta.currency ?? 'IDR'),
        marketState: String(meta.marketState ?? 'CLOSED'),
      };
    },
    enabled: !!symbol,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchInterval: 90_000,
    retry: 1,
  });
}

export function useStockChart(ticker: string | undefined, range: ChartRange) {
  const symbol = ticker ? toJK(ticker) : undefined;
  const interval = RANGE_TO_INTERVAL[range];
  return useQuery({
    queryKey: ['stockChart', symbol, range],
    queryFn: async (): Promise<ChartPoint[]> => {
      const result = await fetchChart(symbol!, range, interval);
      if (!result) return [];
      const timestamps: number[] = result.timestamp ?? [];
      const closes = result.indicators?.quote?.[0]?.close ?? [];
      return timestamps
        .map((ts, i) => {
          const d = new Date(ts * 1000);
          let time: string;
          const tz = 'Asia/Jakarta';
          if (range === '1d') {
            time = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: tz });
          } else if (range === '5d') {
            time = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', timeZone: tz });
          } else if (range === '1mo') {
            time = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', timeZone: tz });
          } else {
            time = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit', timeZone: tz });
          }
          return { time, price: closes[i] ?? null };
        })
        .filter((d): d is { time: string; price: number } => d.price !== null);
    },
    enabled: !!symbol,
    staleTime: range === '1d' ? 60_000 : 3_600_000,
    gcTime: 10 * 60_000,
    retry: 1,
  });
}

export function useSyncStockPrice(asset: Asset) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (livePrice: number) => {
      if (!user) throw new Error('Not authenticated');
      await createEntry.execute({
        userId: user.id,
        assetId: asset.id,
        assetName: asset.assetName,
        ticker: asset.ticker,
        category: asset.category,
        platform: asset.platform,
        entryType: 'price_update',
        pricePerUnit: livePrice,
        currency: 'IDR',
        date: new Date(),
        month: getCurrentMonth(),
        notes: 'Auto-sync harga pasar',
      });
      await recomputeAssetProjection.execute(user.id, asset.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeAssets', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['allAssets', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['entries', user?.id, asset.id] });
      queryClient.invalidateQueries({ queryKey: ['portfolioSummary', user?.id] });
    },
  });
}
