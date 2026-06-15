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

export interface RebalancingAdvice {
  title: string;
  type: 'increase' | 'decrease';
  categoryLabel: string;
  description: string;
  actionAmount: number;
}
