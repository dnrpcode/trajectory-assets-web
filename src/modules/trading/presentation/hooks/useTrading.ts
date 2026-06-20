import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/modules/auth';
import {
  getWatchlist, addToWatchlist, removeFromWatchlist,
  executePaperTrade, getPaperTrades,
} from '@/infrastructure/di/container';
import { CoinGeckoService, OHLCPoint } from '../../data/CoinGeckoRepository';
import { computeSignal, SignalResult } from '@/shared/utils/indicators';
import { WatchlistCoin } from '../../domain/entities/Watchlist';
import { PaperTrade } from '../../domain/entities/PaperTrade';

// ── Watchlist ─────────────────────────────────────────────────────────────────

export function useWatchlist() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['watchlist', user?.id],
    queryFn: () => getWatchlist.execute(user!.id),
    enabled: !!user,
    staleTime: 60_000,
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
    queryKey: ['coinMarkets', coinIds.join(',')],
    queryFn: () => CoinGeckoService.getMarkets(coinIds),
    enabled: coinIds.length > 0,
    staleTime: 60_000,
    retry: 2,
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
      const closes = ohlc.map((p) => p.close);
      const signal = computeSignal(closes);
      return { ohlc, closes, signal, usdToIdr };
    },
    enabled: !!coinId,
    staleTime: 5 * 60_000,
    retry: 2,
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
  });
}

export function useCoinPaperTrades(coinId: string) {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['paperTrades', user?.id, coinId],
    queryFn: () => getPaperTrades.getByCoin(user!.id, coinId),
    enabled: !!user && !!coinId,
    staleTime: 30_000,
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

async function scanCoins(): Promise<ScanResult[]> {
  const ids = TOP_SCAN_COINS.map((c) => c.id);

  // Fetch market prices in one call
  const markets = await CoinGeckoService.getMarkets(ids);
  const marketMap = Object.fromEntries(markets.map((m) => [m.id, m]));

  const results: ScanResult[] = [];

  // Sequential to respect rate limits (free tier ~30 req/min)
  for (const coin of TOP_SCAN_COINS) {
    try {
      const closes = await CoinGeckoService.getMarketChart(coin.id, 30);
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
      // Small delay to avoid rate limit
      await new Promise((r) => setTimeout(r, 300));
    } catch {
      // Skip failed coins
    }
  }

  return results;
}

export function useSignalScanner() {
  return useQuery({
    queryKey: ['signalScanner'],
    queryFn: scanCoins,
    staleTime: 10 * 60_000,
    retry: 1,
    enabled: false, // only run when manually triggered
  });
}

// ── USD/IDR rate ──────────────────────────────────────────────────────────────

export function useUsdToIdr() {
  return useQuery({
    queryKey: ['usdToIdr'],
    queryFn: () => CoinGeckoService.getUsdToIdr(),
    staleTime: 10 * 60_000,
  });
}
