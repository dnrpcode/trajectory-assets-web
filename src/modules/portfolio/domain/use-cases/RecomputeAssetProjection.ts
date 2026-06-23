import { IAssetEntryRepository } from '../repositories/IAssetEntryRepository';
import { IAssetProjectionRepository } from '../repositories/IAssetProjectionRepository';
import { Asset } from '../entities/Asset';
import { computeNewAvgCost } from '@/shared/utils/calculations';
import { getCurrentMonth, getMonthFromDate } from '@/shared/utils/formatDate';

export class RecomputeAssetProjection {
  constructor(
    private entryRepo: IAssetEntryRepository,
    private projectionRepo: IAssetProjectionRepository,
  ) {}

  async execute(userId: string, assetId: string): Promise<Asset> {
    const entries = await this.entryRepo.getByAssetId(userId, assetId);
    const sorted = [...entries].sort((a, b) => a.date.getTime() - b.date.getTime());

    // Filter out corrected entries
    const correctedIds = new Set(
      entries.filter((e) => e.isCorrected).map((e) => e.id),
    );
    // Also skip entries targeted by corrections
    const targetedIds = new Set(
      entries
        .filter((e) => e.entryType === 'correction' && e.targetEntryId)
        .map((e) => e.targetEntryId),
    );

    const activeEntries = sorted.filter(
      (e) => !correctedIds.has(e.id) && !targetedIds.has(e.id),
    );

    if (activeEntries.length === 0) {
      throw new Error('No entries found for asset');
    }

    // Grab metadata from first new_position
    const firstEntry = activeEntries.find((e) => e.entryType === 'new_position') ?? activeEntries[0];

    // Cash stores every entry as units=1, pricePerUnit=amount — must use balance arithmetic instead of unit math
    const isCash = (firstEntry.category ?? 'lainnya') === 'cash';

    let totalUnits = 0;
    let avgCostPerUnit = 0;
    let totalCostBasisIDR = 0;
    let currentPricePerUnit = 0;
    let realizedGainIDR = 0;
    let totalIncomeIDR = 0;
    let totalFeesIDR = 0;
    let status: 'active' | 'closed' = 'active';
    let lastUpdatedDate = firstEntry.date;
    const currentMonth = getCurrentMonth();
    let hasRecentUpdate = false;

    for (const entry of activeEntries) {
      const rate = entry.exchangeRateToIDR ?? 1;
      const entryMonth = getMonthFromDate(entry.date);

      switch (entry.entryType) {
        case 'new_position': {
          const units = entry.units ?? 0;
          const price = entry.pricePerUnit ?? 0;
          if (isCash) {
            // pricePerUnit = deposit amount; units is always 1 for cash
            totalCostBasisIDR += price * rate;
            totalUnits = 1;
            avgCostPerUnit = totalCostBasisIDR;
            currentPricePerUnit = totalCostBasisIDR;
          } else {
            avgCostPerUnit = computeNewAvgCost(totalUnits, avgCostPerUnit, units, price);
            totalUnits += units;
            totalCostBasisIDR += units * price * rate;
            currentPricePerUnit = price;
          }
          lastUpdatedDate = entry.date;
          if (entryMonth === currentMonth) hasRecentUpdate = true;
          break;
        }
        case 'price_update': {
          currentPricePerUnit = entry.pricePerUnit ?? currentPricePerUnit;
          lastUpdatedDate = entry.date;
          if (entryMonth === currentMonth) hasRecentUpdate = true;
          break;
        }
        case 'top_up': {
          const units = entry.units ?? 0;
          const price = entry.pricePerUnit ?? 0;
          if (isCash) {
            totalCostBasisIDR += price * rate;
            totalUnits = 1;
            avgCostPerUnit = totalCostBasisIDR;
            currentPricePerUnit = totalCostBasisIDR;
          } else {
            avgCostPerUnit = computeNewAvgCost(totalUnits, avgCostPerUnit, units, price);
            totalUnits += units;
            totalCostBasisIDR += units * price * rate;
            currentPricePerUnit = price;
          }
          lastUpdatedDate = entry.date;
          if (entryMonth === currentMonth) hasRecentUpdate = true;
          break;
        }
        case 'partial_sell': {
          const units = entry.units ?? 0;
          const price = entry.pricePerUnit ?? 0;
          if (isCash) {
            // pricePerUnit = amount withdrawn; subtract from balance, no gain/loss
            totalCostBasisIDR = Math.max(0, totalCostBasisIDR - price * rate);
            totalUnits = 1;
            avgCostPerUnit = totalCostBasisIDR;
            currentPricePerUnit = totalCostBasisIDR;
          } else {
            // Use cost-basis-derived IDR per unit to avoid FX rate mismatch
            const cbPerUnitIDR = totalUnits > 0 ? totalCostBasisIDR / totalUnits : 0;
            realizedGainIDR += (price * rate - cbPerUnitIDR) * units;
            totalCostBasisIDR = Math.max(0, totalCostBasisIDR - cbPerUnitIDR * units);
            totalUnits = Math.max(0, totalUnits - units);
            currentPricePerUnit = price;
          }
          lastUpdatedDate = entry.date;
          if (entryMonth === currentMonth) hasRecentUpdate = true;
          break;
        }
        case 'full_sell': {
          const price = entry.pricePerUnit ?? 0;
          if (isCash) {
            totalCostBasisIDR = 0;
            totalUnits = 1;
            avgCostPerUnit = 0;
            currentPricePerUnit = 0;
            status = 'closed';
          } else {
            realizedGainIDR += price * rate * totalUnits - totalCostBasisIDR;
            totalUnits = 0;
            totalCostBasisIDR = 0;
            avgCostPerUnit = 0;
            currentPricePerUnit = price;
            status = 'closed';
          }
          lastUpdatedDate = entry.date;
          if (entryMonth === currentMonth) hasRecentUpdate = true;
          break;
        }
        case 'income': {
          const amount = entry.amount ?? 0;
          totalIncomeIDR += amount * rate;
          break;
        }
        case 'fee': {
          const amount = entry.amount ?? 0;
          totalFeesIDR += amount * rate;
          break;
        }
        case 'correction': {
          // corrections handled by filtering above
          break;
        }
      }
    }

    const currentValueIDR = totalUnits * currentPricePerUnit;
    const unrealizedGainIDR = currentValueIDR - totalCostBasisIDR;
    const unrealizedGainPct =
      totalCostBasisIDR > 0 ? (unrealizedGainIDR / totalCostBasisIDR) * 100 : 0;

    // isStale = no price_update / top_up / sell in current month
    const isStale = status === 'active' && !hasRecentUpdate;

    const existingAsset = await this.projectionRepo.getById(userId, assetId);

    const asset: Asset = {
      id: assetId,
      userId,
      assetName: firstEntry.assetName ?? 'Unknown',
      ticker: firstEntry.ticker,
      category: firstEntry.category ?? 'lainnya',
      status,
      currency: firstEntry.currency,
      platform: firstEntry.platform ?? '',
      totalUnits,
      avgCostPerUnit,
      totalCostBasisIDR,
      currentPricePerUnit,
      currentValueIDR,
      isStale,
      unrealizedGainIDR,
      unrealizedGainPct,
      realizedGainIDR,
      totalIncomeIDR,
      totalFeesIDR,
      firstEntryDate: activeEntries[0].date,
      lastUpdatedDate,
      projectionVersion: (existingAsset?.projectionVersion ?? 0) + 1,
      updatedAt: new Date(),
    };

    await this.projectionRepo.save(asset);
    return asset;
  }
}
