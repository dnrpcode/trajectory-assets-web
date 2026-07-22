export type AssetCategory =
  | 'saham'
  | 'reksa_dana'
  | 'obligasi_sbn'
  | 'emas'
  | 'kripto'
  | 'cash'
  | 'lainnya';

export type EntryType =
  | 'new_position'
  | 'price_update'
  | 'top_up'
  | 'partial_sell'
  | 'full_sell'
  | 'income'
  | 'fee'
  | 'correction';

export type RiskProfile = 'conservative' | 'moderate' | 'aggressive';
export type InvestmentHorizon = 'short' | 'medium' | 'long';

export interface AllocationTarget {
  saham: number;
  reksa_dana: number;
  obligasi_sbn: number;
  emas: number;
  kripto: number;
  cash: number;
  lainnya: number;
}

export interface PlatformHolding {
  platform: string;
  units: number;
  valueIDR: number;
}

export interface CategoryBreakdown {
  category: AssetCategory;
  label: string;
  currentValue: number;
  actualPercentage: number;
  targetPercentage: number;
  gap: number;
  color: string;
}

export interface SectorBreakdown {
  sector: string;
  valueIDR: number;
  pct: number;
  tickers: string[];
}

export interface SectorConcentrationResult {
  breakdown: SectorBreakdown[];
  totalStockValueIDR: number;
  classifiedValueIDR: number;
  /** % nilai saham yang sektornya berhasil teridentifikasi */
  classifiedPct: number;
  topSectorPct: number;
  /** true kalau sektor terbesar > CONCENTRATION_THRESHOLD_PCT dari total saham */
  isConcentrated: boolean;
}

export interface RebalancingAdvice {
  type: 'increase' | 'decrease';
  categoryLabel: string;
  actionAmount: number;
  actualPct: number;
  targetPct: number;
}

export interface PortfolioHistoryPoint {
  month: string; // "YYYY-MM"
  totalValueIDR: number;
  totalCostBasisIDR: number;
}
