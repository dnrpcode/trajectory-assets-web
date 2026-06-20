import { CoinMarket, OHLCPoint, CoinSearchResult } from '../entities/Market';

export interface ICoinGeckoRepository {
  getMarkets(ids: string[]): Promise<CoinMarket[]>;
  getOHLC(coinId: string, days?: 30 | 14 | 7): Promise<OHLCPoint[]>;
  getMarketChart(coinId: string, days?: number): Promise<number[]>;
  search(query: string): Promise<CoinSearchResult[]>;
  getUsdToIdr(): Promise<number>;
}
