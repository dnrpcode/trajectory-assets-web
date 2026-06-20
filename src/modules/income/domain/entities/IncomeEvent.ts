import type { AssetCategory } from '@/shared/types';

export type IncomeEventType = 'dividend' | 'coupon' | 'interest' | 'other';
export type IncomeEventStatus = 'upcoming' | 'received';

export interface IncomeEvent {
  id: string;
  userId: string;
  assetId: string;
  assetName: string;
  ticker?: string;
  category: AssetCategory;
  eventType: IncomeEventType;
  exDate?: Date;
  paymentDate: Date;
  estimatedAmountIDR?: number;
  currency: string;
  notes?: string;
  status: IncomeEventStatus;
  createdAt: Date;
}
