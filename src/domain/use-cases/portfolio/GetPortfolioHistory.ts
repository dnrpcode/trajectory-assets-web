import { IPortfolioRepository } from '../../repositories/IPortfolioRepository';
import { PortfolioHistoryPoint } from '../../entities/Portfolio';

export class GetPortfolioHistory {
  constructor(private portfolioRepo: IPortfolioRepository) {}

  async execute(userId: string): Promise<PortfolioHistoryPoint[]> {
    return this.portfolioRepo.getHistory(userId);
  }
}
