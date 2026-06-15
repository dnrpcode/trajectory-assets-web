import { PortfolioHistoryPoint } from '../entities/Portfolio';

export interface IPortfolioRepository {
  getHistory(userId: string): Promise<PortfolioHistoryPoint[]>;
  saveHistoryPoint(userId: string, point: PortfolioHistoryPoint): Promise<void>;
}
