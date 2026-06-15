import { AssetCategory, EntryType } from '../../shared/types';

export interface AssetEntry {
  id: string;
  userId: string;
  assetId?: string;
  assetName?: string;
  ticker?: string;
  category?: AssetCategory;
  platform?: string;
  entryType: EntryType;
  month: string; // "YYYY-MM"
  pricePerUnit?: number;
  units?: number;
  currency: string;
  exchangeRateToIDR?: number;
  incomeFeeCategory?: 'dividend' | 'coupon' | 'interest' | 'platform_fee' | 'tax' | 'other';
  amount?: number;
  targetEntryId?: string;
  correctedFields?: Record<string, unknown>;
  reason?: string;
  snapshotUnitsAfter?: number;
  snapshotAvgCostAfter?: number;
  snapshotValueAfterIDR?: number;
  isCorrected: boolean;
  notes?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}
