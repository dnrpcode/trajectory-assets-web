import { AssetCategory, PlatformHolding } from '@/shared/types';

export interface Asset {
  id: string;
  userId: string;
  assetName: string;
  ticker?: string;
  category: AssetCategory;
  status: 'active' | 'closed';
  currency: string;
  platform: string;
  platformBreakdown?: PlatformHolding[];
  totalUnits: number;
  avgCostPerUnit: number;
  totalCostBasisIDR: number;
  currentPricePerUnit: number;
  currentValueIDR: number;
  isStale: boolean;
  unrealizedGainIDR: number;
  unrealizedGainPct: number;
  realizedGainIDR: number;
  totalIncomeIDR: number;
  totalFeesIDR: number;
  firstEntryDate: Date;
  lastUpdatedDate: Date;
  projectionVersion: number;
  updatedAt: Date;
}
