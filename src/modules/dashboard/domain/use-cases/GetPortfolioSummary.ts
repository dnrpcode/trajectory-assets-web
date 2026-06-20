import { IAssetProjectionRepository } from '@/modules/portfolio/domain/repositories/IAssetProjectionRepository';
import { IPortfolioRepository } from '../repositories/IPortfolioRepository';
import { PortfolioSummary } from '../entities/Portfolio';
import { computeActualAllocation, computeIsStale } from '@/shared/utils/calculations';
import { getCurrentMonth } from '@/shared/utils/formatDate';

export class GetPortfolioSummary {
  constructor(
    private projectionRepo: IAssetProjectionRepository,
    private portfolioRepo: IPortfolioRepository,
  ) {}

  async execute(userId: string): Promise<PortfolioSummary> {
    const assets = await this.projectionRepo.getByUserId(userId);
    const active = assets.filter((a) => a.status === 'active');

    const totalValueIDR = active.reduce((s, a) => s + a.currentValueIDR, 0);
    const totalCostBasisIDR = active.reduce((s, a) => s + a.totalCostBasisIDR, 0);
    const unrealizedGainIDR = totalValueIDR - totalCostBasisIDR;
    const unrealizedGainPct =
      totalCostBasisIDR > 0 ? (unrealizedGainIDR / totalCostBasisIDR) * 100 : 0;
    const realizedGainIDR = assets.reduce((s, a) => s + a.realizedGainIDR, 0);
    const totalIncomeIDR = assets.reduce((s, a) => s + a.totalIncomeIDR, 0);
    const staleAssetCount = active.filter((a) => computeIsStale(a)).length;
    const allocationActual = computeActualAllocation(active);

    const summary: PortfolioSummary = {
      totalValueIDR,
      totalCostBasisIDR,
      unrealizedGainIDR,
      unrealizedGainPct,
      realizedGainIDR,
      totalIncomeIDR,
      allocationActual,
      staleAssetCount,
      lastUpdated: new Date(),
    };

    // Persist current month snapshot so WealthGrowthChart has data to display
    if (totalValueIDR > 0 || totalCostBasisIDR > 0) {
      this.portfolioRepo.saveHistoryPoint(userId, {
        month: getCurrentMonth(),
        totalValueIDR,
        totalCostBasisIDR,
      }).catch(() => { /* non-critical */ });
    }

    return summary;
  }
}
