import { IAssetProjectionRepository } from '../../repositories/IAssetProjectionRepository';
import { PortfolioSummary } from '../../entities/Portfolio';
import { computeActualAllocation, computeIsStale } from '../../../shared/utils/calculations';

export class GetPortfolioSummary {
  constructor(private projectionRepo: IAssetProjectionRepository) {}

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

    return {
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
  }
}
