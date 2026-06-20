import { IPaperTradeRepository } from '../repositories/IPaperTradeRepository';
import { PaperTrade } from '../entities/PaperTrade';

export class GetPaperTrades {
  constructor(private repo: IPaperTradeRepository) {}

  getAll(userId: string): Promise<PaperTrade[]> {
    return this.repo.getByUserId(userId);
  }

  getByCoin(userId: string, coinId: string): Promise<PaperTrade[]> {
    return this.repo.getByCoinId(userId, coinId);
  }
}
