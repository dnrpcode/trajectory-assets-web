import { Asset } from '@/shared/types/asset';
import { AllocationTarget, AssetCategory } from '../types';
import { getCurrentMonth, getMonthFromDate } from './formatDate';

export function computeIsStale(asset: Pick<Asset, 'status' | 'category' | 'lastUpdatedDate'>): boolean {
  if (asset.status !== 'active') return false;
  if (asset.category === 'cash') return false;
  return getMonthFromDate(asset.lastUpdatedDate) !== getCurrentMonth();
}

export function computeActualAllocation(assets: Asset[]): AllocationTarget {
  const totalValue = assets
    .filter((a) => a.status === 'active')
    .reduce((sum, a) => sum + a.currentValueIDR, 0);

  const result: AllocationTarget = {
    saham: 0,
    reksa_dana: 0,
    obligasi_sbn: 0,
    emas: 0,
    kripto: 0,
    cash: 0,
    lainnya: 0,
  };

  if (totalValue === 0) return result;

  for (const asset of assets.filter((a) => a.status === 'active')) {
    const cat = asset.category as AssetCategory;
    result[cat] += (asset.currentValueIDR / totalValue) * 100;
  }

  return result;
}

export function computeNewAvgCost(
  prevUnits: number,
  prevAvg: number,
  additionalUnits: number,
  buyPrice: number,
): number {
  if (prevUnits + additionalUnits === 0) return 0;
  return (prevUnits * prevAvg + additionalUnits * buyPrice) / (prevUnits + additionalUnits);
}
