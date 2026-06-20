import type { IDividendRepository } from '../repositories/IDividendRepository';
import type { DividendInfo } from '../entities/Dividend';

export class GetDividendInfo {
  constructor(private repo: IDividendRepository) {}

  async execute(ticker: string): Promise<DividendInfo> {
    return this.repo.getDividendInfo(ticker);
  }
}
