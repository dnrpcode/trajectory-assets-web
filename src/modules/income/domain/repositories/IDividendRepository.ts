import type { DividendInfo, TickerSuggestion } from '../entities/Dividend';

export interface IDividendRepository {
  getDividendInfo(ticker: string): Promise<DividendInfo>;
  searchTicker(query: string): Promise<TickerSuggestion[]>;
}
