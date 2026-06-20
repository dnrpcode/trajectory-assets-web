import { IPaperTradeRepository } from '../../repositories/IPaperTradeRepository';
import { PaperTrade } from '../../entities/PaperTrade';

type Input = Omit<PaperTrade, 'id' | 'createdAt'>;

export class ExecutePaperTrade {
  constructor(private repo: IPaperTradeRepository) {}

  execute(input: Input): Promise<void> {
    const trade: PaperTrade = {
      ...input,
      id: `${input.userId}_${input.coinId}_${Date.now()}`,
      createdAt: new Date(),
    };
    return this.repo.save(trade);
  }
}
