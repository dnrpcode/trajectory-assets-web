import { computeSignal } from '@/shared/utils/indicators';
import type { BacktestResult, BacktestTrade, BacktestSideStats } from '../entities/Backtest';

// MACD (slow=26, signal=9) baru valid mulai indeks 26-1+9=34 — mulai jalan dari 40
// candle pertama supaya seluruh faktor (termasuk support/resistance 20-candle) valid.
const MIN_WARMUP_CANDLES = 40;

function computeSideStats(trades: BacktestTrade[]): BacktestSideStats {
  if (trades.length === 0) return { count: 0, winRatePct: 0, avgReturnPct: 0 };
  const wins = trades.filter((t) => t.returnPct > 0).length;
  const avg = trades.reduce((s, t) => s + t.returnPct, 0) / trades.length;
  return {
    count: trades.length,
    winRatePct: Math.round((wins / trades.length) * 1000) / 10,
    avgReturnPct: Math.round(avg * 100) / 100,
  };
}

/**
 * Backtest pure — replay computeSignal() day-by-day terhadap closes historis
 * TANPA look-ahead: sinyal hari i hanya memakai data 0..i, dieksekusi di
 * penutupan hari i+1. Tidak ada overlapping trade (posisi baru dibuka hanya
 * setelah posisi sebelumnya exit) supaya simulasi realistis satu posisi.
 */
export class BacktestSignalStrategy {
  execute(coinId: string, closes: number[], dates: number[], holdingDays: number): BacktestResult {
    const trades: BacktestTrade[] = [];
    let i = MIN_WARMUP_CANDLES;

    while (i < closes.length - 1) {
      const windowCloses = closes.slice(0, i + 1);
      const signal = computeSignal(windowCloses);

      if (signal.signal === 'HOLD') { i++; continue; }

      const entryIndex = i + 1;
      if (entryIndex >= closes.length) break;
      const exitIndex = Math.min(entryIndex + holdingDays, closes.length - 1);
      if (exitIndex === entryIndex) break;

      const entryPrice = closes[entryIndex];
      const exitPrice = closes[exitIndex];
      const rawReturnPct = ((exitPrice - entryPrice) / entryPrice) * 100;
      const returnPct = signal.signal === 'BUY' ? rawReturnPct : -rawReturnPct;

      trades.push({
        side: signal.signal,
        signalDate: new Date(dates[i]),
        entryDate: new Date(dates[entryIndex]),
        entryPrice,
        exitDate: new Date(dates[exitIndex]),
        exitPrice,
        holdingDays: exitIndex - entryIndex,
        returnPct: Math.round(returnPct * 100) / 100,
        score: signal.score,
      });

      i = exitIndex; // no overlapping positions — resume scanning after this trade closes
    }

    const winCount = trades.filter((t) => t.returnPct > 0).length;
    const returns = trades.map((t) => t.returnPct);

    // Equity curve dari compounding trade berurutan, untuk max drawdown
    let equity = 100;
    let peak = 100;
    let maxDrawdownPct = 0;
    for (const r of returns) {
      equity *= 1 + r / 100;
      peak = Math.max(peak, equity);
      const drawdown = ((peak - equity) / peak) * 100;
      maxDrawdownPct = Math.max(maxDrawdownPct, drawdown);
    }

    return {
      coinId,
      holdingDays,
      daysAnalyzed: closes.length,
      trades,
      totalTrades: trades.length,
      winCount,
      winRatePct: trades.length > 0 ? Math.round((winCount / trades.length) * 1000) / 10 : 0,
      avgReturnPct: trades.length > 0 ? Math.round((returns.reduce((s, r) => s + r, 0) / trades.length) * 100) / 100 : 0,
      bestReturnPct: trades.length > 0 ? Math.max(...returns) : 0,
      worstReturnPct: trades.length > 0 ? Math.min(...returns) : 0,
      maxDrawdownPct: Math.round(maxDrawdownPct * 100) / 100,
      buy: computeSideStats(trades.filter((t) => t.side === 'BUY')),
      sell: computeSideStats(trades.filter((t) => t.side === 'SELL')),
    };
  }
}
