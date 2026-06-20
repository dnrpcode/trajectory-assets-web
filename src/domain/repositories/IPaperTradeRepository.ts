import { PaperTrade } from '../entities/PaperTrade';

export interface IPaperTradeRepository {
  getByUserId(userId: string): Promise<PaperTrade[]>;
  getByCoinId(userId: string, coinId: string): Promise<PaperTrade[]>;
  save(trade: PaperTrade): Promise<void>;
  delete(userId: string, tradeId: string): Promise<void>;
}
