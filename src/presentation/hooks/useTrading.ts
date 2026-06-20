import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from './useAuth';
import {
  getWatchlist, addToWatchlist, removeFromWatchlist,
  executePaperTrade, getPaperTrades,
} from '../../infrastructure/di/container';
import { CoinGeckoService, OHLCPoint } from '../../data/coingecko/CoinGeckoService';
import { computeSignal, SignalResult } from '../../shared/utils/indicators';
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

// ── USD/IDR rate ──────────────────────────────────────────────────────────────

export function useUsdToIdr() {
  return useQuery({
    queryKey: ['usdToIdr'],
    queryFn: () => CoinGeckoService.getUsdToIdr(),
    staleTime: 10 * 60_000,
  });
}
