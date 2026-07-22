import type { TradingSignal } from '@/shared/utils/indicators';

export interface BacktestTrade {
  side: Exclude<TradingSignal, 'HOLD'>;
  signalDate: Date;
  entryDate: Date;
  entryPrice: number;
  exitDate: Date;
  exitPrice: number;
  holdingDays: number;
  returnPct: number;
  score: number;
}

export interface BacktestSideStats {
  count: number;
  winRatePct: number;
  avgReturnPct: number;
}

export interface BacktestResult {
  coinId: string;
  holdingDays: number;
  daysAnalyzed: number;
  trades: BacktestTrade[];
  totalTrades: number;
  winCount: number;
  winRatePct: number;
  avgReturnPct: number;
  bestReturnPct: number;
  worstReturnPct: number;
  /** Max peak-to-trough drawdown (%) of the equity curve built by compounding trades sequentially */
  maxDrawdownPct: number;
  buy: BacktestSideStats;
  sell: BacktestSideStats;
}
