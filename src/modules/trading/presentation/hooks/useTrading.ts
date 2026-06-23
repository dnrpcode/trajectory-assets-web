import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/modules/auth';
import {
  getWatchlist, addToWatchlist, removeFromWatchlist,
  executePaperTrade, getPaperTrades,
} from '@/infrastructure/di/container';
import { CoinGeckoService, CoinGeckoError, OHLCPoint, sleep } from '../../data/CoinGeckoRepository';
import { CoinMarket } from '../../domain/entities/Market';
import { computeSignal, SignalResult } from '@/shared/utils/indicators';
import { WatchlistCoin } from '../../domain/entities/Watchlist';
import { PaperTrade } from '../../domain/entities/PaperTrade';

// Never retry 401 (auth) or 4xx client errors other than 429.
// Retry 429 and 5xx with appropriate delay.
function cgRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof CoinGeckoError) {
    if (error.isUnauthorized) return false;
    if (error.isRateLimit) return failureCount < 2;
    if (error.isServerError) return failureCount < 1;
    return false;
  }
  // Network errors: retry once
  return failureCount < 1;
}

// For 429: wait for Retry-After (default 60s). Other errors: 5s backoff.
function cgRetryDelay(_failureCount: number, error: unknown): number {
  if (error instanceof CoinGeckoError && error.isRateLimit) {
    return (error.retryAfter ?? 60) * 1000;
  }
  return 5_000;
}

// ── Watchlist ─────────────────────────────────────────────────────────────────

export function useWatchlist() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['watchlist', user?.id],
    queryFn: () => getWatchlist.execute(user!.id),
    enabled: !!user,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });
}

export function useAddToWatchlist() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (coin: Omit<WatchlistCoin, 'addedAt'>) => addToWatchlist.execute(user!.id, coin),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['watchlist', user?.id] }),
  });
}

export function useRemoveFromWatchlist() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (coinId: string) => removeFromWatchlist.execute(user!.id, coinId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['watchlist', user?.id] }),
  });
}

// ── Coin market data ──────────────────────────────────────────────────────────

export function useCoinMarkets(coinIds: string[]) {
  return useQuery({
    queryKey: ['coinMarkets', coinIds],
    queryFn: () => CoinGeckoService.getMarkets(coinIds),
    enabled: coinIds.length > 0,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    retry: cgRetry,
    retryDelay: cgRetryDelay,
  });
}

// ── Coin detail: OHLC + indicators ───────────────────────────────────────────

export interface CoinDetailData {
  ohlc: OHLCPoint[];
  closes: number[];
  signal: SignalResult;
  usdToIdr: number;
}

export function useCoinDetail(coinId: string) {
  return useQuery({
    queryKey: ['coinDetail', coinId],
    queryFn: async (): Promise<CoinDetailData> => {
      const [ohlc, usdToIdr] = await Promise.all([
        CoinGeckoService.getOHLC(coinId, 30),
        CoinGeckoService.getUsdToIdr(),
      ]);
      const closes = ohlc.map((p: OHLCPoint) => p.close);
      const signal = computeSignal(closes);
      return { ohlc, closes, signal, usdToIdr };
    },
    enabled: !!coinId,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    retry: cgRetry,
    retryDelay: cgRetryDelay,
  });
}

// ── Paper trades ──────────────────────────────────────────────────────────────

export function usePaperTrades() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['paperTrades', user?.id],
    queryFn: () => getPaperTrades.getAll(user!.id),
    enabled: !!user,
    staleTime: 30_000,
    gcTime: 10 * 60_000,
  });
}

export function useCoinPaperTrades(coinId: string) {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['paperTrades', user?.id, coinId],
    queryFn: () => getPaperTrades.getByCoin(user!.id, coinId),
    enabled: !!user && !!coinId,
    staleTime: 30_000,
    gcTime: 10 * 60_000,
  });
}

export function useExecutePaperTrade() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (trade: Omit<PaperTrade, 'id' | 'createdAt'>) =>
      executePaperTrade.execute(trade),
    onSuccess: (_data, trade) => {
      qc.invalidateQueries({ queryKey: ['paperTrades', user?.id] });
      qc.invalidateQueries({ queryKey: ['paperTrades', user?.id, trade.coinId] });
    },
  });
}

// ── Signal Scanner ────────────────────────────────────────────────────────────

export const TOP_SCAN_COINS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot' },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink' },
  { id: 'sui', symbol: 'SUI', name: 'Sui' },
  { id: 'pepe', symbol: 'PEPE', name: 'PEPE' },
];

export interface ScanResult {
  id: string;
  symbol: string;
  name: string;
  signal: SignalResult;
  currentPrice?: number;
  priceChange24h?: number;
  image?: string;
}

async function fetchWithRateLimitRetry(coinId: string): Promise<number[]> {
  try {
    return await CoinGeckoService.getMarketChart(coinId, 30);
  } catch (e) {
    if (e instanceof CoinGeckoError && e.isRateLimit) {
      const waitMs = (e.retryAfter ?? 60) * 1000;
      await sleep(waitMs);
      return CoinGeckoService.getMarketChart(coinId, 30);
    }
    throw e;
  }
}

async function scanCoins(): Promise<ScanResult[]> {
  const ids = TOP_SCAN_COINS.map((c) => c.id);
  const markets = await CoinGeckoService.getMarkets(ids);
  const marketMap = Object.fromEntries(markets.map((m: CoinMarket) => [m.id, m]));

  const results: ScanResult[] = [];

  for (const coin of TOP_SCAN_COINS) {
    try {
      const closes = await fetchWithRateLimitRetry(coin.id);
      const signal = computeSignal(closes);
      const m = marketMap[coin.id];
      results.push({
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        signal,
        currentPrice: m?.current_price,
        priceChange24h: m?.price_change_percentage_24h,
        image: m?.image,
      });
      await sleep(400);
    } catch {
      // Skip coin if it fails after retry
    }
  }

  return results;
}

export function useSignalScanner() {
  return useQuery({
    queryKey: ['signalScanner'],
    queryFn: scanCoins,
    staleTime: 10 * 60_000,
    gcTime: 10 * 60_000,
    retry: false, // scanCoins handles its own retries internally
    enabled: false,
  });
}

// ── USD/IDR rate ──────────────────────────────────────────────────────────────

export function useUsdToIdr() {
  return useQuery({
    queryKey: ['usdToIdr'],
    queryFn: () => CoinGeckoService.getUsdToIdr(),
    staleTime: 10 * 60_000,
    gcTime: 10 * 60_000,
    retry: cgRetry,
    retryDelay: cgRetryDelay,
  });
}
