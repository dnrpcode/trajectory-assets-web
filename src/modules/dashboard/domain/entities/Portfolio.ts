import { AllocationTarget } from '@/shared/types';

export type { PortfolioHistoryPoint } from '@/shared/types';

export interface PortfolioSummary {
  totalValueIDR: number;
  totalCostBasisIDR: number;
  unrealizedGainIDR: number;
  unrealizedGainPct: number;
  realizedGainIDR: number;
  totalIncomeIDR: number;
  allocationActual: AllocationTarget;
  staleAssetCount: number;
  lastUpdated: Date;
}
