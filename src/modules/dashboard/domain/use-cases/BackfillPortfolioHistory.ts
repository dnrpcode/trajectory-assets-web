import { IAssetEntryRepository } from '@/modules/portfolio/domain/repositories/IAssetEntryRepository';
import { IAssetProjectionRepository } from '@/modules/portfolio/domain/repositories/IAssetProjectionRepository';
import { IPortfolioRepository } from '../repositories/IPortfolioRepository';
import { computeNewAvgCost } from '@/shared/utils/calculations';
import { getCurrentMonth, getMonthFromDate } from '@/shared/utils/formatDate';

function addMonths(ym: string, n: number): string {
  const [y, m] = ym.split('-').map(Number);
  const date = new Date(y, m - 1 + n, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthsBetween(from: string, to: string): string[] {
  const months: string[] = [];
  let cur = from;
  while (cur <= to) {
    months.push(cur);
    cur = addMonths(cur, 1);
  }
  return months;
}

export class BackfillPortfolioHistory {
  constructor(
    private entryRepo: IAssetEntryRepository,
    private projectionRepo: IAssetProjectionRepository,
    private portfolioRepo: IPortfolioRepository,
  ) {}

  async execute(userId: string): Promise<void> {
    const [allEntries, assets] = await Promise.all([
      this.entryRepo.getByUserId(userId),
      this.projectionRepo.getByUserId(userId),
    ]);

    if (allEntries.length === 0) return;

    // Current asset value by assetId (for price approximation)
    const assetCurrentPrice: Record<string, number> = {};
    for (const a of assets) {
      assetCurrentPrice[a.id] = a.currentPricePerUnit;
    }

    // Sort entries oldest-first
    const sorted = [...allEntries].sort((a, b) => a.date.getTime() - b.date.getTime());

    // Filter out corrected/correction entries
    const correctedIds = new Set(sorted.filter((e) => e.isCorrected).map((e) => e.id));
    const targetedIds = new Set(
      sorted.filter((e) => e.entryType === 'correction' && e.targetEntryId).map((e) => e.targetEntryId),
    );
    const active = sorted.filter((e) => !correctedIds.has(e.id) && !targetedIds.has(e.id as string));

    if (active.length === 0) return;

    const firstMonth = getMonthFromDate(active[0].date);
    const currentMonth = getCurrentMonth();
    const allMonths = monthsBetween(firstMonth, currentMonth);

    // Fetch existing history to avoid overwriting months that already have data
    const existing = await this.portfolioRepo.getHistory(userId);
    const existingMonths = new Set(existing.map((h) => h.month));

    // For each month, replay entries up to end of that month and compute state per asset
    for (const month of allMonths) {
      if (existingMonths.has(month) && month !== currentMonth) continue;

      const endOfMonth = new Date(`${month}-01`);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);

      const entriesUpTo = active.filter((e) => e.date < endOfMonth);

      // Group by assetId
      const byAsset: Record<string, typeof active> = {};
      for (const e of entriesUpTo) {
        if (!e.assetId) continue;
        if (!byAsset[e.assetId]) byAsset[e.assetId] = [];
        byAsset[e.assetId].push(e);
      }

      let totalValueIDR = 0;
      let totalCostBasisIDR = 0;

      for (const [assetId, entries] of Object.entries(byAsset)) {
        let units = 0;
        let costBasis = 0;
        let avgCost = 0;
        let latestPrice = 0;
        let closed = false;

        for (const e of entries) {
          const rate = e.exchangeRateToIDR ?? 1;
          switch (e.entryType) {
            case 'new_position':
            case 'top_up': {
              const u = e.units ?? 0;
              const p = e.pricePerUnit ?? 0;
              avgCost = computeNewAvgCost(units, avgCost, u, p);
              units += u;
              costBasis += u * p * rate;
              latestPrice = p * rate;
              break;
            }
            case 'price_update':
              latestPrice = (e.pricePerUnit ?? latestPrice / (e.exchangeRateToIDR ?? 1)) * rate;
              break;
            case 'partial_sell': {
              const u = e.units ?? 0;
              const cbPerUnit = units > 0 ? costBasis / units : 0;
              costBasis = Math.max(0, costBasis - cbPerUnit * u);
              units = Math.max(0, units - u);
              latestPrice = (e.pricePerUnit ?? 0) * rate;
              break;
            }
            case 'full_sell':
              units = 0;
              costBasis = 0;
              latestPrice = (e.pricePerUnit ?? 0) * rate;
              closed = true;
              break;
          }
        }

        if (!closed) {
          // Use current asset price if no historical price entry exists for this month
          const priceIDR = latestPrice > 0 ? latestPrice : (assetCurrentPrice[assetId] ?? 0);
          totalValueIDR += units * priceIDR;
          totalCostBasisIDR += costBasis;
        }
      }

      if (totalValueIDR > 0 || totalCostBasisIDR > 0) {
        await this.portfolioRepo.saveHistoryPoint(userId, {
          month,
          totalValueIDR,
          totalCostBasisIDR,
        });
      }
    }
  }
}
